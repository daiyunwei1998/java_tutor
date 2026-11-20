"use client";

import { useMemo, useState } from "react";
import type { TraversalMode } from "@/content/types";
import { cacheMisses, offsetOf, TRAVERSAL_CODE, traversalSteps } from "@/lib/viz/traversal";
import { CodeLines, SimBadge, StepControls, useStepper, Vars } from "./StepControls";

const MODE_LABEL: Record<TraversalMode, string> = { "row-major": "Row-major", "column-major": "Column-major", "enhanced-for": "Enhanced for" };

export function TraversalViz({ modes, rows: r0, cols: c0 }: { modes: TraversalMode[]; rows: number; cols: number }) {
  const [mode, setMode] = useState<TraversalMode>(modes[0]);
  const [rows, setRows] = useState(r0);
  const [cols, setCols] = useState(c0);
  const [layout, setLayout] = useState<"row" | "col">("row");
  const [showMem, setShowMem] = useState(mode !== "enhanced-for");
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
          大小
          <select value={rows} onChange={(e) => setRows(Number(e.target.value))} aria-label="列數">{[2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>
          ×
          <select value={cols} onChange={(e) => setCols(Number(e.target.value))} aria-label="欄數">{[2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select>
        </label>
      </div>
      <SimBadge />
      <CodeLines lines={TRAVERSAL_CODE[mode]} on={cur ? cur.line : null} />
      <StepControls s={s} />
      <Vars vars={cur?.vars ?? { sum: 0 }} prev={prev?.vars} />

      <table className="matrix" aria-label="矩陣 m">
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
                  <td key={c} className={isCur ? "current" : visited.has(`${r},${c}`) ? "visited" : ""} aria-label={`m[${r}][${c}] = ${v}${isCur ? "，目前" : ""}`}>
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
          <code>row</code> 現在指向 <code>m[{cur.r}]</code> 這個 inner array（虛線框）。
          {cur.c >= 0 && <> <code>value</code> 是 <code>m[{cur.r}][{cur.c}]</code> 的 <strong>複本</strong>：改 value 不會改到陣列。</>}
        </p>
      )}
      <p className="small muted">走訪順序：{steps.filter((x) => x.c >= 0).slice(0, s.i).map((x) => m[x.r][x.c]).join(" → ") || "—"}</p>

      {mode !== "enhanced-for" && (
        <details open={showMem} onToggle={(e) => setShowMem((e.target as HTMLDetailsElement).open)} style={{ marginTop: 10 }}>
          <summary><strong>假想的連續記憶體模型 & cache</strong></summary>
          <div className="callout warn small">
            這是 <strong>假設</strong> 矩陣存成一整塊連續記憶體時的樣子，用來理解 locality。Java 的 <code>int[][]</code> 其實是「陣列的陣列」，不保證是一整塊連續記憶體。
          </div>
          <div className="row small">
            儲存方式：
            <button className={`btn small${layout === "row" ? " primary" : ""}`} onClick={() => setLayout("row")}>row-major 存放</button>
            <button className={`btn small${layout === "col" ? " primary" : ""}`} onClick={() => setLayout("col")}>column-major 存放</button>
            <code>offset = {layout === "row" ? "r * cols + c" : "c * rows + r"}</code>
            {cur && cur.c >= 0 && <code>= {curOffset}</code>}
          </div>
          <div className="mem-strip" aria-label="連續記憶體">
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
            模擬 cache（1 條 cache line = 4 個 int，淺藍色是目前在 cache 裡的那一段）：到目前為止 <strong>{sim.misses}</strong> 次 miss / {doneAccesses} 次存取。
            整個走完：<strong>{full.misses}</strong> 次 miss。
          </p>
          <p className="viz-note">試試看：走訪順序和存放順序一致時，miss 比較少（連續讀取）；不一致時，每一步都跳很遠。真實的效能還取決於 JVM、硬體和 benchmark 方法。</p>
        </details>
      )}
    </div>
  );
}
