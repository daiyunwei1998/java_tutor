"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CodeConcept } from "@/content/types";
import { Markdown } from "./Markdown";

/**
 * A long, read-only program with a concept panel beside it, for quick review.
 * Explore: click a concept to highlight its lines (or click a line to see which concepts it belongs to).
 * Spot check: a random concept is named, the student clicks a line that shows it, then the answer is revealed.
 */
export function CodeMap({ code, concepts, title, mode: startMode = "explore" }: { code: string; concepts: CodeConcept[]; title?: string; mode?: "explore" | "quiz" }) {
  const lines = useMemo(() => code.split("\n"), [code]);
  const [mode, setMode] = useState(startMode);
  const [sel, setSel] = useState<string | null>(null);
  const [lineSel, setLineSel] = useState<number | null>(null);
  const [quiz, setQuiz] = useState<{ id: string; picked: number | null; asked: string[]; right: number }>({ id: "", picked: null, asked: [], right: 0 });
  const rows = useRef<Record<number, HTMLDivElement | null>>({});
  const groups = useMemo(() => [...new Set(concepts.map((c) => c.group))], [concepts]);
  const byId = (id: string | null) => concepts.find((c) => c.id === id) ?? null;
  // Spot-check mode starts with a first question.
  useEffect(() => {
    if (startMode === "quiz") nextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const inRanges = (c: CodeConcept | null, n: number) => !!c && c.ranges.some(([a, b]) => n >= a && n <= b);

  function scrollTo(c: CodeConcept) {
    const first = Math.min(...c.ranges.map((r) => r[0]));
    rows.current[first]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }
  function pick(id: string) {
    setLineSel(null);
    if (sel === id) return setSel(null);
    setSel(id);
    const c = byId(id);
    if (c) scrollTo(c);
  }
  function nextQuestion() {
    const left = concepts.filter((c) => !quiz.asked.includes(c.id));
    const pool = left.length ? left : concepts;
    const c = pool[Math.floor(Math.random() * pool.length)];
    setQuiz((q) => ({ id: c.id, picked: null, asked: left.length ? [...q.asked, c.id] : [c.id], right: left.length ? q.right : 0 }));
  }
  function clickLine(n: number) {
    if (mode === "explore") {
      setSel(null);
      setLineSel(lineSel === n ? null : n);
      return;
    }
    if (!quiz.id || quiz.picked !== null) return;
    const ok = inRanges(byId(quiz.id), n);
    setQuiz((q) => ({ ...q, picked: n, right: q.right + (ok ? 1 : 0) }));
    const c = byId(quiz.id);
    if (!ok && c) setTimeout(() => scrollTo(c), 50);
  }

  const quizC = byId(quiz.id);
  const revealed = mode === "quiz" && quiz.picked !== null;
  const shown = mode === "explore" ? byId(sel) : revealed ? quizC : null;
  const lineConcepts = lineSel !== null ? concepts.filter((c) => inRanges(c, lineSel)) : [];

  return (
    <div className="code-map">
      <div className="cm-head">
        <strong>🗺 {title ?? "Code map"}</strong>
        <div className="cm-modes" role="tablist" aria-label="Mode">
          <button role="tab" aria-selected={mode === "explore"} onClick={() => setMode("explore")}>🔍 Explore</button>
          <button role="tab" aria-selected={mode === "quiz"} onClick={() => { setMode("quiz"); if (!quiz.id) nextQuestion(); }}>🎲 Spot check</button>
        </div>
      </div>
      <div className="cm-body">
        <div className="cm-code" role="list" aria-label="Code">
          {lines.map((text, i) => {
            const n = i + 1;
            const hl = inRanges(shown, n);
            const cls = [
              "cm-line",
              hl ? "hl" : "",
              lineSel === n ? "picked" : "",
              revealed && quiz.picked === n ? (inRanges(quizC, n) ? "right" : "wrong") : "",
              text.startsWith("// =====") ? "file" : "",
            ].join(" ");
            return (
              <div key={n} ref={(el) => { rows.current[n] = el; }} className={cls} role="listitem" onClick={() => clickLine(n)}>
                <span className="ln">{n}</span>
                <code>{colorize(text)}</code>
              </div>
            );
          })}
        </div>
        <aside className="cm-panel">
          {mode === "explore" ? (
            <>
              <p className="small muted" style={{ marginTop: 0 }}>Click a concept to highlight it, or click a line to see what it shows.</p>
              {groups.map((g) => (
                <div key={g} className="cm-group">
                  <div className="cm-group-name">{g}</div>
                  <div className="cm-chips">
                    {concepts.filter((c) => c.group === g).map((c) => (
                      <button key={c.id} className={`cm-chip${sel === c.id ? " on" : ""}`} aria-pressed={sel === c.id} onClick={() => pick(c.id)}>{c.label}</button>
                    ))}
                  </div>
                </div>
              ))}
              {shown && (
                <div className="cm-explain">
                  <strong>{shown.label}</strong>
                  <Markdown>{shown.explain}</Markdown>
                  <div className="small muted">{shown.ranges.length} place{shown.ranges.length > 1 ? "s" : ""} highlighted</div>
                </div>
              )}
              {lineSel !== null && (
                <div className="cm-explain">
                  <strong>Line {lineSel}</strong>
                  {lineConcepts.length ? (
                    <div className="cm-chips" style={{ marginTop: 6 }}>
                      {lineConcepts.map((c) => <button key={c.id} className="cm-chip" onClick={() => pick(c.id)}>{c.label}</button>)}
                    </div>
                  ) : <p className="small muted">No concept is tagged on this line.</p>}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="small muted">Score {quiz.right} / {quiz.asked.length - (revealed ? 0 : 1)} · {concepts.length} concepts</div>
              {quizC && (
                <div className="cm-question">
                  <div className="small muted">Click a line that shows…</div>
                  <div className="cm-q">{quizC.label}</div>
                </div>
              )}
              {revealed && quizC && (
                <div className={`callout ${inRanges(quizC, quiz.picked!) ? "" : "warn"}`}>
                  <strong>{inRanges(quizC, quiz.picked!) ? "Yes!" : quiz.picked === -1 ? "Here it is." : `Not line ${quiz.picked}.`}</strong> The highlighted lines are all the places.
                  <Markdown>{quizC.explain}</Markdown>
                </div>
              )}
              <button className="btn primary" onClick={() => { nextQuestion(); }} disabled={!revealed}>Next concept ▶</button>
              {!revealed && <button className="btn small ghost" onClick={() => { setQuiz((q) => ({ ...q, picked: -1 })); if (quizC) setTimeout(() => scrollTo(quizC), 50); }}>Show me</button>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

const KW = /\b(public|private|protected|static|final|class|extends|return|new|if|else|for|void|int|boolean|String|this|super|null|true|false|import|instanceof)\b/;

/** Light Java colouring: comments, strings, keywords, annotations. */
function colorize(text: string) {
  const out: React.ReactNode[] = [];
  const re = /(\/\/.*$|\/\*\*?.*?\*\/|\/\*.*$|^\s*\*.*$)|("(?:[^"\\]|\\.)*")|(@\w+)|\b(\w+)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<span key={k++} className="tk-c">{m[1]}</span>);
    else if (m[2]) out.push(<span key={k++} className="tk-s">{m[2]}</span>);
    else if (m[3]) out.push(<span key={k++} className="tk-a">{m[3]}</span>);
    else if (m[4] && KW.test(m[4]) && m[4].match(KW)![0] === m[4]) out.push(<span key={k++} className="tk-k">{m[4]}</span>);
    else out.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out.length ? out : " ";
}
