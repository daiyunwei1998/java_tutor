"use client";

import { useMemo, useState } from "react";
import type { ArrayMemoryPresetId } from "@/content/types";
import { PRESETS, reachable, simulate } from "@/lib/viz/arrayMemory";
import { CodeLines, SimBadge, StepControls, useStepper } from "./StepControls";

const CELL = 34, ROWH = 70, TOP = 34;
type Sel = { kind: "cell"; inner: string; c: number; r: number } | { kind: "slot"; outer: string; index: number } | null;

export function ArrayMemoryViz({ presets }: { presets: ArrayMemoryPresetId[] }) {
  const [presetId, setPresetId] = useState<ArrayMemoryPresetId>(presets[0]);
  const preset = PRESETS[presetId];
  const s = useStepper(preset.ops.length, presetId);
  const state = useMemo(() => simulate(preset, s.i), [preset, s.i]);
  const live = reachable(state);
  const [sel, setSel] = useState<Sel>(null);

  // ---- layout ----
  const varNames = Object.keys(state.vars);
  const outers = state.order.filter((id) => state.objects[id].kind === "outer");
  const inners = state.order.filter((id) => state.objects[id].kind === "inner");
  const outerX = 110, innerX = 250;
  const outerPos: Record<string, { y: number }> = {};
  let y = TOP;
  outers.forEach((id) => { outerPos[id] = { y }; y += state.objects[id].slots.length * CELL + 40; });
  const innerPos: Record<string, { y: number }> = {};
  inners.forEach((id, k) => { innerPos[id] = { y: TOP + k * ROWH }; });
  const height = Math.max(y, TOP + inners.length * ROWH, 120) + 10;
  const width = innerX + 30 + Math.max(6, ...inners.map((id) => state.objects[id].slots.length)) * CELL + 60;

  // logical view from the first variable
  const mainVar = varNames[0];
  const outerId = mainVar ? state.vars[mainVar] : null;
  const outer = outerId ? state.objects[outerId] : null;

  const selInner = sel?.kind === "cell" ? sel.inner : sel?.kind === "slot" && outer ? (state.objects[sel.outer]?.slots[sel.index] as string | null) : null;
  const selSlot = sel?.kind === "cell" && outer ? { outer: outer.id, index: sel.r } : sel?.kind === "slot" ? { outer: sel.outer, index: sel.index } : null;

  return (
    <div>
      <div className="row" style={{ marginBottom: 6 }}>
        {presets.map((p) => (
          <button key={p} className={`btn small${p === presetId ? " primary" : ""}`} onClick={() => { setPresetId(p); setSel(null); }}>{PRESETS[p].label}</button>
        ))}
      </div>
      <SimBadge />
      <CodeLines lines={preset.lines} on={s.i > 0 ? s.i - 1 : null} />
      <StepControls s={s} />
      {state.error && <div className="callout warn">💥 {state.error}</div>}

      <div>
        <div>
          <div className="small muted">邏輯檢視：{mainVar ?? "（尚未宣告）"}</div>
          {outer ? (
            <table className="matrix" aria-label="邏輯陣列">
              <tbody>
                {outer.slots.map((slot, r) => {
                  const inner = typeof slot === "string" ? state.objects[slot] : null;
                  return (
                    <tr key={r}>
                      <th scope="row">[{r}]</th>
                      {inner ? (
                        inner.slots.map((v, c) => (
                          <td
                            key={c}
                            tabIndex={0}
                            className={sel?.kind === "cell" && sel.r === r && sel.c === c ? "selected" : ""}
                            onClick={() => setSel({ kind: "cell", inner: inner.id, c, r })}
                            onKeyDown={(e) => e.key === "Enter" && setSel({ kind: "cell", inner: inner.id, c, r })}
                            aria-label={`${mainVar}[${r}][${c}] = ${v}`}
                          >
                            {v as number}
                          </td>
                        ))
                      ) : (
                        <td className="missing">null</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="small muted">按 Step ▶ 開始建立陣列。</p>
          )}
          {sel?.kind === "cell" && (
            <p className="small">選取 <code>{mainVar}[{sel.r}][{sel.c}]</code>：先透過 outer array 第 {sel.r} 格的參考找到 inner array，再取第 {sel.c} 格。</p>
          )}
        </div>

        <div style={{ overflowX: "auto", marginTop: 12 }}>
          <div className="small muted">記憶體 / 物件圖（模擬位址）</div>
          <svg className="svg-mem" width={width} height={height} role="img" aria-label="物件與參考的示意圖">
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" fill="currentColor" style={{ color: "var(--muted)" }} />
              </marker>
            </defs>
            {/* variables */}
            {varNames.map((v, k) => {
              const vy = TOP + k * 50;
              const target = state.vars[v];
              const ty = target && outerPos[target] ? outerPos[target].y + CELL / 2 : vy + 15;
              return (
                <g key={v}>
                  <text x={10} y={vy - 6} className="label">變數 {v}</text>
                  <rect x={10} y={vy} width={56} height={30} rx={5} className="box" />
                  <text x={38} y={vy + 19} textAnchor="middle" fontSize={11}>{target ? state.objects[target].addr : "null"}</text>
                  {target && <path className="arrow" d={`M66,${vy + 15} C90,${vy + 15} 90,${ty} ${outerX - 2},${ty}`} markerEnd="url(#arr)" />}
                </g>
              );
            })}
            {/* outer arrays (vertical) */}
            {outers.map((id) => {
              const o = state.objects[id];
              const oy = outerPos[id].y;
              return (
                <g key={id} opacity={live.has(id) ? 1 : 0.35}>
                  <text x={outerX} y={oy - 6} className="label">int[][] {o.addr}</text>
                  {o.slots.map((slot, k) => {
                    const sy = oy + k * CELL;
                    const isSel = selSlot?.outer === id && selSlot.index === k;
                    const tgt = typeof slot === "string" ? innerPos[slot] : null;
                    return (
                      <g key={k} style={{ cursor: "pointer" }} onClick={() => setSel({ kind: "slot", outer: id, index: k })}>
                        <rect x={outerX} y={sy} width={92} height={CELL} className={`box${isSel ? " hl" : ""}`} />
                        <text x={outerX + 4} y={sy + 21} fontSize={10} className="label">[{k}]</text>
                        <text x={outerX + 56} y={sy + 21} textAnchor="middle" fontSize={11}>{slot === null ? "null" : state.objects[slot as string].addr}</text>
                        {tgt && (
                          <path className={`arrow${isSel ? " hl" : ""}`} d={`M${outerX + 92},${sy + CELL / 2} C${innerX - 30},${sy + CELL / 2} ${innerX - 40},${tgt.y + CELL / 2} ${innerX + 26},${tgt.y + CELL / 2}`} markerEnd="url(#arr)" />
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {/* inner arrays (horizontal) */}
            {inners.map((id) => {
              const o = state.objects[id];
              const iy = innerPos[id].y;
              const isSelObj = selInner === id;
              return (
                <g key={id} opacity={live.has(id) ? 1 : 0.35}>
                  <text x={innerX + 28} y={iy - 6} className="label">int[] {o.addr} · len {o.slots.length}{live.has(id) ? "" : " · garbage"}</text>
                  {o.slots.map((v, c) => {
                    const isSelCell = sel?.kind === "cell" && sel.inner === id && sel.c === c;
                    return (
                      <g key={c}>
                        <rect x={innerX + 28 + c * CELL} y={iy} width={CELL} height={CELL} className={`box${isSelCell ? " hl2" : isSelObj ? " hl" : ""}`} />
                        <text x={innerX + 28 + c * CELL + CELL / 2} y={iy + 21} textAnchor="middle" fontSize={13}>{v as number}</text>
                        <text x={innerX + 28 + c * CELL + CELL / 2} y={iy + CELL + 11} textAnchor="middle" className="label" fontSize={9}>{c}</text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <div className="callout">{preset.note}</div>
      <p className="viz-note">點左邊的格子，會在右邊標出對應的 inner array 元素；點 outer array 的格子，會標出它指向的物件。位址是教學用的假位址，不是真的 JVM 位址。</p>
    </div>
  );
}
