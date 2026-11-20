"use client";

import { useMemo, useState } from "react";
import type { TraversalMode } from "@/content/types";
import { cacheMisses, offsetOf, TRAVERSAL_CODE, traversalSteps } from "@/lib/viz/traversal";
import { CodeLines, SimBadge, StepControls, useStepper, Vars } from "./StepControls";

const MODE_LABEL: Record<TraversalMode, string> = { "row-major": "Row-major", "column-major": "Column-major", "enhanced-for": "Enhanced for" };

/** showMemory adds the (imagined) contiguous-memory + cache model; used in the Knowledge Space, not in tickets. */
export function TraversalViz({ modes, rows: r0, cols: c0, showMemory = false }: { modes: TraversalMode[]; rows: number; cols: number; showMemory?: boolean }) {
  const [mode, setMode] = useState<TraversalMode>(modes[0]);
  const [rows, setRows] = useState(r0);
  const [cols, setCols] = useState(c0);
  const [layout, setLayout] = useState<"row" | "col">("row");
  const [showMem, setShowMem] = useState(true);
  const m = useMemo(() => Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => r * cols + c + 1)), [rows, cols]);
  const steps = useMemo(() => traversalSteps(mode, m), [mode, m]);
  const s = useStepper(steps.length, `${mode}-${rows}-${cols}`);
  const cur = s.i > 0 ? steps[s.i - 1] : null;
  const prev = s.i > 1 ? steps[s.i - 2] : undefined;
  const visited = new Set(steps.slice(0, s.i).filter((x) => x.c >= 0).map((x) => `${x.r},${x.c}`));

  const accessOffsets = steps.filter((x) => x.c >= 0).map((x) => offsetOf(layout, x.r, x.c, rows, cols));
  const doneAccesses = steps.slice(0, s.i).filter((x) => x.c >= 0).length;
  const sim = cacheMisses(accessOffsets.slice(0, doneAccesses));
  const full = cacheMisses(accessOffsets);
  const curOffset = cur && cur.c >= 0 ? offsetOf(layout, cur.r, cur.c, rows, cols) : -1;
  const cachedLine = curOffset >= 0 ? Math.floor(curOffset / 4) : -1;

  return (
    <div>
      <div className="row" style={{ marginBottom: 6 }}>
        {modes.map((md) => (
          <button key={md} className={`btn small${md === mode ? " primary" : ""}`} onClick={() => setMode(md)}>{MODE_LABEL[md]}</button>
        ))}
        <label className="small muted row" style={{ gap: 4 }}>
          Size
          <select value={rows} onChange={(e) => setRows(Number(e.target.value))} aria-label="Rows">{[2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>
          ×
          <select value={cols} onChange={(e) => setCols(Number(e.target.value))} aria-label="Columns">{[2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select>
        </label>
      </div>
      <SimBadge />
      <CodeLines lines={TRAVERSAL_CODE[mode]} on={cur ? cur.line : null} />
      <StepControls s={s} />
      <Vars vars={cur?.vars ?? { sum: 0 }} prev={prev?.vars} />

      <table className="matrix" aria-label="Matrix m">
        <thead>
          <tr><th />{Array.from({ length: cols }, (_, c) => <th key={c} scope="col">c={c}</th>)}</tr>
        </thead>
        <tbody>
          {m.map((row, r) => (
            <tr key={r} style={mode === "enhanced-for" && cur?.r === r ? { outline: "2px dashed var(--accent)" } : undefined}>
              <th scope="row">r={r}</th>
              {row.map((v, c) => {
                const isCur = cur?.r === r && cur?.c === c;
                return (
                  <td key={c} className={isCur ? "current" : visited.has(`${r},${c}`) ? "visited" : ""} aria-label={`m[${r}][${c}] = ${v}${isCur ? ", current" : ""}`}>
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {mode === "enhanced-for" && cur && (
        <p className="small">
          <code>row</code> now refers to the inner array <code>m[{cur.r}]</code> (dashed box).
          {cur.c >= 0 && <> <code>value</code> is a <strong>copy</strong> of <code>m[{cur.r}][{cur.c}]</code>: changing value does not change the array.</>}
        </p>
      )}
      <p className="small muted">Visit order: {steps.filter((x) => x.c >= 0).slice(0, s.i).map((x) => m[x.r][x.c]).join(" → ") || "—"}</p>

      {showMemory && mode !== "enhanced-for" && (
        <details open={showMem} onToggle={(e) => setShowMem((e.target as HTMLDetailsElement).open)} style={{ marginTop: 10 }}>
          <summary><strong>Imagined contiguous memory & cache</strong></summary>
          <div className="callout warn small">
            This <strong>assumes</strong> the matrix is stored as one contiguous block, to explain locality. A Java <code>int[][]</code> is really an array of arrays and is not guaranteed to be one block.
          </div>
          <div className="row small">
            Storage order:
            <button className={`btn small${layout === "row" ? " primary" : ""}`} onClick={() => setLayout("row")}>row-major storage</button>
            <button className={`btn small${layout === "col" ? " primary" : ""}`} onClick={() => setLayout("col")}>column-major storage</button>
            <code>offset = {layout === "row" ? "r * cols + c" : "c * rows + r"}</code>
            {cur && cur.c >= 0 && <code>= {curOffset}</code>}
          </div>
          <div className="mem-strip" aria-label="Contiguous memory">
            {Array.from({ length: rows * cols }, (_, off) => {
              const r = layout === "row" ? Math.floor(off / cols) : off % rows;
              const c = layout === "row" ? off % cols : Math.floor(off / rows);
              return (
                <span key={off} className={off === curOffset ? "current" : Math.floor(off / 4) === cachedLine ? "cached" : ""} title={`offset ${off} = m[${r}][${c}]`}>
                  {m[r][c]}
                </span>
              );
            })}
          </div>
          <p className="small">
            Simulated cache (1 cache line = 4 ints; the light-blue run is what is in cache now): so far <strong>{sim.misses}</strong> misses / {doneAccesses} accesses.
            Whole traversal: <strong>{full.misses}</strong> misses.
          </p>
          <p className="viz-note">Try it: when the visit order matches the storage order there are fewer misses (sequential reads); when they differ, every step jumps far away. Real performance also depends on the JVM, the hardware and how you benchmark.</p>
        </details>
      )}
    </div>
  );
}
