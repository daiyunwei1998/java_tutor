"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { heapColumns, reachable, type HeapObj, type Trace, type TraceStep, type Val } from "@/lib/trace";

/**
 * Code on the left, memory on the right, one step per executed line.
 * - the line that just ran is highlighted and explained below
 * - variables live in stack frames; arrays and objects live on the heap
 * - references are drawn as arrows; values that changed in this step are highlighted
 * - objects nothing points to any more are faded ("garbage")
 */
export function TraceViewer({ trace, caption }: { trace: Trace; caption?: string }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const last = trace.steps.length - 1;
  const step = trace.steps[i];
  const prev = i > 0 ? trace.steps[i - 1] : undefined;
  const cols = useMemo(() => heapColumns(trace), [trace]);
  const lines = useMemo(() => trace.code.split("\n"), [trace.code]);

  const go = useCallback((n: number) => setI(Math.max(0, Math.min(last, n))), [last]);

  useEffect(() => {
    if (!playing) return;
    if (i >= last || (step.ask && answers[i] === undefined)) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setI((x) => x + 1), 1400);
    return () => clearTimeout(t);
  }, [playing, i, last, step.ask, answers]);

  const ask = step.ask;
  const picked = answers[i];

  return (
    <figure
      className="trace"
      tabIndex={0}
      aria-label={caption ?? "Code and memory, step by step"}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
      }}
    >
      {caption && <figcaption className="trace-cap">{caption}</figcaption>}
      <div className="trace-bar">
        <button className="btn small" onClick={() => { setPlaying(false); go(0); }} disabled={i === 0} aria-label="Back to start">⏮</button>
        <button className="btn small" onClick={() => { setPlaying(false); go(i - 1); }} disabled={i === 0}>◀ Back</button>
        <button className="btn small primary" onClick={() => { setPlaying(false); go(i + 1); }} disabled={i === last}>Next ▶</button>
        <button className="btn small ghost" onClick={() => (i === last ? (go(0), setPlaying(true)) : setPlaying((p) => !p))}>
          {playing ? "⏸ Pause" : "⏯ Play"}
        </button>
        <input
          type="range"
          min={0}
          max={last}
          value={i}
          onChange={(e) => { setPlaying(false); go(Number(e.target.value)); }}
          aria-label="Step"
          className="trace-range"
        />
        <span className="small muted" aria-live="polite">Step {i} / {last}</span>
      </div>

      <div className="trace-grid">
        <div className="trace-code" aria-label="Code">
          {lines.map((ln, n) => (
            <div key={n} className={`tl${step.line === n + 1 ? " now" : ""}${prev && prev.line === n + 1 && step.line !== n + 1 ? " was" : ""}`}>
              <span className="tn">{step.line === n + 1 ? "▶" : n + 1}</span>
              <code>{highlight(ln)}</code>
            </div>
          ))}
        </div>

        <MemoryView step={step} prev={prev} cols={cols} />
      </div>

      <div className="trace-note">
        <div className="trace-line-tag">{step.line > 0 ? `Line ${step.line}` : "Before start"}</div>
        <Markdown>{step.note}</Markdown>
        {step.error && <div className="callout warn" style={{ marginTop: 8 }}>💥 {step.error}</div>}
        {ask && (
          <div className="trace-ask">
            <div><strong>🤔 Predict: </strong>{ask.q}</div>
            <div className="row" style={{ marginTop: 8, flexWrap: "wrap" }}>
              {ask.options.map((o, k) => (
                <button
                  key={k}
                  className={`btn small${picked === k ? (k === ask.answer ? " ok" : " bad") : ""}`}
                  onClick={() => setAnswers((a) => ({ ...a, [i]: k }))}
                >
                  {o}
                </button>
              ))}
            </div>
            {picked !== undefined && (
              <div className="small" style={{ marginTop: 8 }}>
                {picked === ask.answer ? "✅ Correct!" : "❌ Not quite."} {ask.explain}
              </div>
            )}
          </div>
        )}
        {step.out.length > 0 && (
          <div className="trace-out" aria-label="Output">
            <div className="small muted">Output</div>
            {step.out.map((o, k) => (
              <div key={k} className={k >= (prev?.out.length ?? 0) ? "hot" : ""}>{o}</div>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}

/**
 * The memory half of a trace: stack frames on the left, heap objects in columns on the right, and SVG arrows
 * from every reference to the object it points to. Shared by the Knowledge Space traces and the debugger.
 */
export function MemoryView({ step, prev, cols }: { step: TraceStep; prev?: TraceStep; cols: string[][] }) {
  const changed = useMemo(() => diff(prev, step), [prev, step]);
  const live = useMemo(() => reachable(step.frames, step.heap), [step]);
  // ---------- arrows (measured from the DOM so they follow any layout) ----------
  const memRef = useRef<HTMLDivElement>(null);
  const [arrows, setArrows] = useState<{ d: string; hot: boolean; key: string }[]>([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const measure = useCallback(() => {
    const root = memRef.current;
    if (!root) return;
    const rb = root.getBoundingClientRect();
    const ox = rb.left - root.scrollLeft;
    const oy = rb.top - root.scrollTop;
    const out: { d: string; hot: boolean; key: string }[] = [];
    root.querySelectorAll<HTMLElement>("[data-to]").forEach((el) => {
      const target = root.querySelector<HTMLElement>(`[data-obj="${el.dataset.to}"]`);
      if (!target) return;
      const a = el.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const x1 = a.left + a.width / 2 - ox;
      const y1 = a.top + a.height / 2 - oy;
      const forward = b.left - ox > x1 + 12;
      const x2 = forward ? b.left - ox - 2 : b.left + Math.min(28, b.width / 2) - ox;
      const y2 = forward ? b.top + Math.min(22, b.height / 2) - oy : b.top - oy - 2;
      const dx = Math.max(30, Math.abs(x2 - x1) * 0.45);
      const d = forward
        ? `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
        : `M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2} ${y2 - 50}, ${x2} ${y2}`;
      out.push({ d, hot: el.dataset.hot === "1", key: el.dataset.key ?? d });
    });
    setArrows(out);
    setBox({ w: root.scrollWidth, h: root.scrollHeight });
  }, []);

  useLayoutEffect(measure, [measure, step]);
  useEffect(() => {
    const root = memRef.current;
    if (!root) return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    root.querySelectorAll(".mem-obj, .frame").forEach((el) => ro.observe(el));
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, step]);

  const byId = new Map(step.heap.map((h) => [h.id, h]));
  const value = (v: Val, key: string) => {
    const hot = changed.has(key);
    if (v.t === "p") return <span className={`mv${hot ? " hot" : ""}`}>{v.v}</span>;
    if (v.t === "null") return <span className={`mv null${hot ? " hot" : ""}`}>null</span>;
    return (
      <span className={`mv ref${hot ? " hot" : ""}`} data-to={v.id} data-key={key} data-hot={hot ? "1" : "0"} title={`reference → ${v.id}`}>
        <span className="dot" aria-hidden />
        <span className="sr-only">points to {v.id}</span>
      </span>
    );
  };

  return (
    <div className="trace-mem" ref={memRef}>
      <div className="mem-layout">
        <div className="mem-col">
          <div className="mem-h">Variables <span className="muted">stack</span></div>
          {step.frames.length === 0 && <div className="small muted">(program not started)</div>}
          {step.frames.map((f, fi) => (
            <div key={fi} className={`frame${fi === step.frames.length - 1 ? " top" : ""}`}>
              <div className="frame-name">{f.name}</div>
              {f.vars.length === 0 && <div className="small muted" style={{ padding: "2px 8px" }}>(no variables)</div>}
              {f.vars.map((a) => (
                <div key={a.name} className="var">
                  <span className="vn">{a.name}</span>
                  {value(a.v, `${fi}:${f.name}:${a.name}`)}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="mem-heap">
          <div className="mem-h">Objects <span className="muted">heap</span></div>
          <div className="mem-heap-cols">
            {cols.map((col, ci) => (
              <div key={ci} className="mem-col">
                {col.map((id) => {
                  const o = byId.get(id);
                  if (!o) return null;
                  return <HeapCard key={id} o={o} isNew={!!prev && !prev.heap.some((h) => h.id === id)} garbage={!live.has(id)} value={value} />;
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <svg className="trace-arrows" width={box.w} height={box.h} aria-hidden>
        <defs>
          <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="ah" />
          </marker>
          <marker id="ah-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="ah hot" />
          </marker>
        </defs>
        {arrows.map((a) => (
          <path key={a.key} d={a.d} className={`arrow${a.hot ? " hot" : ""}`} markerEnd={a.hot ? "url(#ah-hot)" : "url(#ah)"} />
        ))}
      </svg>
    </div>
  );
}

function HeapCard({ o, isNew, garbage, value }: { o: HeapObj; isNew: boolean; garbage: boolean; value: (v: Val, key: string) => React.ReactNode }) {
  const refArray = o.kind === "array" && (o.type.endsWith("[][]") || !/^(int|double|boolean|char|long|float|short|byte)\[\]$/.test(o.type));
  return (
    <div className={`mem-obj${isNew ? " new" : ""}${garbage ? " gc" : ""}`} data-obj={o.id}>
      <div className="obj-h">
        <span>{o.type}</span>
        <span className="obj-id">{o.kind === "array" && o.length !== undefined && o.length > o.items.length ? `length ${o.length} · ` : ""}{o.id}</span>
      </div>
      {o.kind === "array" ? (
        o.items.length === 0 ? (
          <div className="small muted" style={{ padding: "4px 8px" }}>(length 0)</div>
        ) : refArray ? (
          <div className="cells vert">
            {o.items.map((v, k) => (
              <div key={k} className="cell">
                <span className="ci">[{k}]</span>
                {value(v, `${o.id}[${k}]`)}
              </div>
            ))}
          </div>
        ) : (
          <div className="cells horiz">
            {o.items.map((v, k) => (
              <div key={k} className="cell">
                {value(v, `${o.id}[${k}]`)}
                <span className="ci">{k}</span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="fields">
          {o.fields.map((f) => (
            <div key={f.name} className="var">
              <span className="vn">{f.name}</span>
              {value(f.v, `${o.id}.${f.name}`)}
            </div>
          ))}
        </div>
      )}
      {garbage && <div className="gc-tag">No reference points here → the garbage collector will reclaim it</div>}
    </div>
  );
}

/** Keys of variables, cells and fields whose value differs from the previous step. */
export function diff(prev: TraceStep | undefined, cur: TraceStep): Set<string> {
  const out = new Set<string>();
  if (!prev) return out;
  const flat = (s: TraceStep) => {
    const m = new Map<string, string>();
    s.frames.forEach((f, fi) => f.vars.forEach((a) => m.set(`${fi}:${f.name}:${a.name}`, JSON.stringify(a.v))));
    s.heap.forEach((h) => {
      if (h.kind === "array") h.items.forEach((v, k) => m.set(`${h.id}[${k}]`, JSON.stringify(v)));
      else h.fields.forEach((f) => m.set(`${h.id}.${f.name}`, JSON.stringify(f.v)));
    });
    return m;
  };
  const a = flat(prev);
  const b = flat(cur);
  const newObjs = new Set(cur.heap.filter((h) => !prev.heap.some((p) => p.id === h.id)).map((h) => h.id));
  b.forEach((v, k) => {
    const owner = k.match(/^(#\d+)[[.]/)?.[1];
    if (owner && newObjs.has(owner)) return; // a brand-new object is highlighted as a whole instead
    if (a.get(k) !== v) out.add(k);
  });
  return out;
}

const KW = /\b(int|double|boolean|char|long|void|static|public|private|new|for|while|if|else|return|class|null|true|false|String)\b/;

/** Tiny Java highlighter for the trace code (comments, strings, keywords, numbers). */
function highlight(line: string) {
  const parts: React.ReactNode[] = [];
  const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|(\b\d+\b)|(\b[A-Za-z_]\w*\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    const [tok] = m;
    const cls = m[1] ? "tk-c" : m[2] ? "tk-s" : m[3] ? "tk-n" : KW.test(tok) && tok.match(KW)![0] === tok ? "tk-k" : /^[A-Z]/.test(tok) ? "tk-t" : "";
    parts.push(cls ? <span key={k++} className={cls}>{tok}</span> : <Fragment key={k++}>{tok}</Fragment>);
    last = m.index + tok.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts.length ? parts : " ";
}
