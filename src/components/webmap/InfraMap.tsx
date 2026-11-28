"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { JOURNEY, MAP_EDGES, MAP_HOSTS, MAP_NODES, MAP_ZONES, topicsFor, type MapNode, type MapNodeId } from "@/content/webmap";

const W = 1200, H = 660;
const size = (n: MapNode) => (n.id === "hosting" ? { w: 320, h: 92 } : { w: 228, h: 112 });
const byId = Object.fromEntries(MAP_NODES.map((n) => [n.id, n])) as Record<MapNodeId, MapNode>;

/** Point where the line from a node's center toward (tx, ty) leaves the node's box. */
function anchor(n: MapNode, tx: number, ty: number) {
  const { w, h } = size(n);
  const dx = tx - n.x, dy = ty - n.y;
  const t = Math.min(dx ? w / 2 / Math.abs(dx) : Infinity, dy ? h / 2 / Math.abs(dy) : Infinity);
  return { x: n.x + dx * t, y: n.y + dy * t };
}

function edgePoints(a: MapNodeId, b: MapNodeId) {
  const A = byId[a], B = byId[b];
  return { p: anchor(A, B.x, B.y), q: anchor(B, A.x, A.y) };
}

/** The big clickable architecture diagram. Click a part to see its tutorials; ▶ follows one request through the system. */
export function InfraMap({ initial }: { initial?: MapNodeId }) {
  const [selected, setSelected] = useState<MapNodeId>(initial ?? "browser");
  const [step, setStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const js = step === null ? null : JOURNEY[step];

  function choose(id: MapNodeId) {
    setSelected(id);
    // The tutorials list sits under the map: bring it into view if it is off screen.
    requestAnimationFrame(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  useEffect(() => {
    if (!playing || step === null) return;
    if (step >= JOURNEY.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => (s === null ? 0 : s + 1)), 3200);
    return () => clearTimeout(t);
  }, [playing, step]);

  const lit = new Set(js?.nodes ?? []);
  const litEdge = js?.edge ? `${js.edge[0]}-${js.edge[1]}` : null;
  const sel = byId[selected];
  const topics = topicsFor(selected);

  return (
    <div>
      <div className="wm-row" style={{ marginBottom: 10 }}>
        <button className="btn primary" onClick={() => { setStep(0); setPlaying(true); }}>
          ▶ Follow one request
        </button>
        {step !== null && (
          <>
            <button className="btn small" onClick={() => { setPlaying(false); setStep(Math.max(0, step - 1)); }} disabled={step === 0}>◀ Back</button>
            <button className="btn small" onClick={() => { setPlaying(false); setStep(Math.min(JOURNEY.length - 1, step + 1)); }} disabled={step === JOURNEY.length - 1}>Next ▶</button>
            <button className="btn small" onClick={() => setPlaying(!playing)}>{playing ? "⏸ Pause" : "⏵ Play"}</button>
            <button className="btn small ghost" onClick={() => { setPlaying(false); setStep(null); }}>✕ Stop</button>
            <span className="small muted">Step {step + 1} / {JOURNEY.length}</span>
          </>
        )}
        {step === null && <span className="small muted">or click any part of the diagram to open its tutorials</span>}
      </div>

      <div className="wm-layout">
        <div>
          <div className="wm-map-scroll">
          <svg className="wm-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Diagram of a web application: browser, DNS, HTTP, API server, login, database and hosting">
            <defs>
              <marker id="wm-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="currentColor" style={{ color: "var(--muted)" }} />
              </marker>
            </defs>
            {MAP_ZONES.map((z) => (
              <g key={z.id}>
                <rect className="wm-zone" x={z.x} y={z.y} width={z.w} height={z.h} rx={14} />
                <text className="wm-zone-label" x={z.x + 14} y={z.y + 24}>{z.label}</text>
              </g>
            ))}
            {MAP_HOSTS.map((h) => {
              const host = byId.hosting;
              const zone = MAP_ZONES.find((z) => z.id === h.to)!;
              const top = host.y - size(host).h / 2;
              return (
                <g key={h.to}>
                  <path className="wm-edge dashed" d={`M${h.x},${zone.y + zone.h} L${h.x},${zone.y + zone.h + 8} L${h.x < host.x ? host.x - 60 : host.x + 60},${top}`} markerEnd="url(#wm-arrow)" />
                </g>
              );
            })}
            <text className="wm-edge-label" x={850} y={548}>the server and the database run here</text>
            {MAP_EDGES.map((e) => {
              const { p, q } = edgePoints(e.from, e.to);
              const on = litEdge === `${e.from}-${e.to}` || litEdge === `${e.to}-${e.from}`;
              return (
                <g key={`${e.from}-${e.to}`}>
                  <line className={`wm-edge${on ? " on" : ""}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} markerEnd="url(#wm-arrow)" markerStart="url(#wm-arrow)" />
                  {e.label && e.at && <text className="wm-edge-label" x={e.at[0]} y={e.at[1]} textAnchor="middle">{e.label}</text>}
                </g>
              );
            })}
            {js?.edge && (() => {
              const { p, q } = edgePoints(js.edge[0], js.edge[1]);
              return (
                <circle key={step} r={9} className="wm-packet">
                  <animateMotion dur="1.4s" repeatCount="indefinite" path={`M${p.x},${p.y} L${q.x},${q.y}`} />
                </circle>
              );
            })()}
            {MAP_NODES.map((n) => {
              const { w, h } = size(n);
              const count = topicsFor(n.id).length;
              const cls = `wm-node${selected === n.id ? " selected" : ""}${lit.has(n.id) ? " lit" : ""}`;
              return (
                <g
                  key={n.id}
                  className={cls}
                  role="button"
                  tabIndex={0}
                  aria-label={`${n.label}: ${count} tutorial${count === 1 ? "" : "s"}`}
                  aria-pressed={selected === n.id}
                  onClick={() => choose(n.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), choose(n.id))}
                >
                  <rect x={n.x - w / 2} y={n.y - h / 2} width={w} height={h} rx={14} />
                  <text x={n.x} y={n.y - 16} textAnchor="middle" fontSize={30}>{n.icon}</text>
                  <text className="wm-title" x={n.x} y={n.y + 16} textAnchor="middle">{n.label}</text>
                  <text className="wm-sub" x={n.x} y={n.y + 38} textAnchor="middle">{n.sub}</text>
                  <text className="wm-count" x={n.x + w / 2 - 10} y={n.y - h / 2 + 20} textAnchor="end">{count} tutorial{count === 1 ? "" : "s"}</text>
                </g>
              );
            })}
          </svg>
          </div>
          {js && (
            <div className="card wm-journey" aria-live="polite">
              <strong>{js.title}</strong>
              <Markdown>{js.note}</Markdown>
              {js.message && <pre>{js.message}</pre>}
            </div>
          )}
        </div>

        <aside ref={panel} className="card wm-side" aria-live="polite">
          <div className="wm-side-head">
            <div style={{ fontSize: 34 }} aria-hidden>{sel.icon}</div>
            <div>
              <h2>{sel.label}</h2>
              <p className="muted" style={{ margin: "2px 0 0" }}>{sel.blurb}</p>
            </div>
          </div>
          <div className="wm-side-topics">
          {topics.map((t) => (
            <Link key={t.id} href={`/web-map/${t.id}`} className="wm-topic-link">
              <strong>{t.title}</strong>
              <div className="small muted">{t.summary}</div>
              <div className="small" style={{ color: "var(--accent)", marginTop: 4 }}>{t.minutes} min · open →</div>
            </Link>
          ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
