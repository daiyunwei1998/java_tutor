"use client";

import { useMemo, useState } from "react";
import type { MatrixAlgorithmId } from "@/content/types";
import { ALGOS, algoSteps } from "@/lib/viz/matrixAlgo";
import { CodeLines, SimBadge, StepControls, useStepper, Vars } from "./StepControls";

const SQUARE = [[3, 8, 1, 6], [7, 2, 9, 4], [5, 10, 4, 2], [6, 1, 3, 9]];
const WIDE = [[1, 2, 3], [4, 5, 6]];

export function MatrixAlgoViz({ algorithms }: { algorithms: MatrixAlgorithmId[] }) {
  const [id, setId] = useState<MatrixAlgorithmId>(algorithms[0]);
  const algo = ALGOS[id];
  const m = id === "transpose" ? WIDE : SQUARE;
  const steps = useMemo(() => algoSteps(id, m), [id, m]);
  const s = useStepper(steps.length, id);
  const cur = s.i > 0 ? steps[s.i - 1] : null;
  const R = m.length, C = m[0].length;
  const accessed = new Set(steps.slice(0, s.i).flatMap((x) => x.cells.map(([r, c]) => `${r},${c}`)));
  const t: (number | null)[][] = Array.from({ length: C }, () => Array(R).fill(null));
  const vec: (number | null)[] = Array(id === "column-sum" ? C : R).fill(null);
  steps.slice(0, s.i).forEach((x) => {
    if (x.out) t[x.out.r][x.out.c] = x.out.value;
    if (x.outVec) vec[x.outVec.i] = x.outVec.value;
  });

  return (
    <div>
      <div className="row" style={{ marginBottom: 6 }}>
        {algorithms.map((a) => (
          <button key={a} className={`btn small${a === id ? " primary" : ""}`} onClick={() => setId(a)}>{ALGOS[a].label}</button>
        ))}
      </div>
      <SimBadge />
      <CodeLines lines={algo.code} on={cur ? cur.line : null} />
      <StepControls s={s} />
      <Vars vars={cur?.vars ?? {}} />

      <div className="row" style={{ alignItems: "flex-start", gap: 24 }}>
        <div>
          <div className="small muted">m ({R}×{C})</div>
          <table className="matrix">
            <tbody>
              {m.map((row, r) => (
                <tr key={r}>
                  <th scope="row">{r}</th>
                  {row.map((v, c) => {
                    const isCur = cur?.cells.some(([a, b]) => a === r && b === c);
                    return <td key={c} className={isCur ? "current" : accessed.has(`${r},${c}`) ? "visited" : ""}>{v}</td>;
                  })}
                  {(id === "row-sum") && <td className={vec[r] !== null ? "selected" : "missing"}>{vec[r] ?? "?"}</td>}
                </tr>
              ))}
              {id === "column-sum" && (
                <tr><th scope="row">Σ</th>{vec.map((v, c) => <td key={c} className={v !== null ? "selected" : "missing"}>{v ?? "?"}</td>)}</tr>
              )}
            </tbody>
          </table>
        </div>
        {id === "transpose" && (
          <div>
            <div className="small muted">t ({C}×{R}, a new array)</div>
            <table className="matrix">
              <tbody>
                {t.map((row, r) => (
                  <tr key={r}><th scope="row">{r}</th>{row.map((v, c) => <td key={c} className={cur?.out && cur.out.r === r && cur.out.c === c ? "current" : v !== null ? "selected" : "missing"}>{v ?? "·"}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 12, padding: 12 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span>Array reads: <strong>{cur?.reads ?? 0}</strong> / {steps.at(-1)?.reads ?? 0}</span>
          <span>{R * C} cells in the matrix</span>
        </div>
        <div className="small" style={{ marginTop: 6 }}>
          Time <strong>{algo.time}</strong> · extra space <strong>{algo.space}</strong> — {algo.why}
        </div>
      </div>
      <p className="viz-note">Compare "main diagonal" with "max": one reads only N cells, the other must read every cell. Reading one element at a known position (like m[2][3]) is O(1).</p>
    </div>
  );
}
