"use client";

import { useEffect, useMemo, useState } from "react";
import type { Gray } from "@/lib/viz/image";
import { loadGray } from "@/lib/viz/photos";
import { CodeLines, StepControls, useStepper, Vars } from "../StepControls";
import css from "./concepts.module.css";
import { Choice, ConceptBadge, ImgCanvas } from "./shared";

type Mode = "build" | "loop" | "kernel";
const N = 7;

function pascalJs(n: number): number[][] {
  const tri: number[][] = [];
  for (let r = 0; r < n; r++) {
    tri.push(Array(r + 1).fill(1));
    for (let c = 1; c < r; c++) tri[r][c] = tri[r - 1][c - 1] + tri[r - 1][c];
  }
  return tri;
}

/* ---------- 1. Build the jagged triangle ---------- */

type BuildStep = { r: number; c: number | null; line: number };

function BuildDemo() {
  const full = useMemo(() => pascalJs(N), []);
  const steps = useMemo(() => {
    const list: BuildStep[] = [{ r: -1, c: null, line: 0 }];
    for (let r = 0; r < N; r++) {
      list.push({ r, c: null, line: 2 });
      list.push({ r, c: 0, line: 3 });
      if (r > 0) list.push({ r, c: r, line: 4 });
      for (let c = 1; c < r; c++) list.push({ r, c, line: 6 });
    }
    return list;
  }, []);
  const s = useStepper(steps.length, "build");
  const cur = s.i > 0 ? steps[s.i - 1] : null;

  // State of tri after the first s.i steps: undefined = outer array not created, null = row not allocated yet.
  const created = s.i >= 1;
  const shown: ((number | null)[] | null)[] = Array(N).fill(null);
  for (const st of steps.slice(0, s.i)) {
    if (st.line === 2) shown[st.r] = Array(st.r + 1).fill(0);
    else if (st.c !== null && shown[st.r]) shown[st.r]![st.c] = full[st.r][st.c];
  }
  const isParent = (r: number, c: number) => !!cur && cur.line === 6 && r === cur.r - 1 && (c === cur.c! - 1 || c === cur.c);

  return (
    <>
      <CodeLines
        lines={[
          "int[][] tri = new int[n][];          // rows are null for now",
          "for (int r = 0; r < n; r++) {",
          "    tri[r] = new int[r + 1];          // row r gets its own length",
          "    tri[r][0] = 1;",
          "    tri[r][r] = 1;",
          "    for (int c = 1; c < r; c++)       // only the inside",
          "        tri[r][c] = tri[r - 1][c - 1] + tri[r - 1][c];",
        ]}
        on={cur ? cur.line : null}
      />
      <StepControls s={s} />
      <Vars vars={cur && cur.r >= 0 ? { r: cur.r, ...(cur.c !== null ? { c: cur.c } : {}), "tri[r].length": cur.r + 1 } : { n: N }} />
      <figure className={css.gridFig} aria-label="The array tri, one line per row">
        <figcaption className="small muted">tri: every row is its own array, so every row can have a different length.</figcaption>
        {!created ? (
          <p className="small muted">tri does not exist yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 3 }}>
            {shown.map((row, r) => (
              <div key={r} style={{ display: "flex", gap: 3, alignItems: "center" }}>
                <span className={css.head} style={{ width: 52, justifyContent: "flex-start" }}>tri[{r}]</span>
                {row === null ? (
                  <span className={`${css.cell} ${css.empty}`} style={{ width: 48, height: 28, cursor: "default" }}>null</span>
                ) : (
                  row.map((v, c) => {
                    const mark = cur && cur.r === r && cur.c === c ? css.dst : isParent(r, c) ? css.src : cur && cur.r === r && cur.line === 2 ? css.window : "";
                    return <span key={c} className={`${css.cell} ${mark}`} style={{ width: 34, height: 28, cursor: "default" }}>{v}</span>;
                  })
                )}
              </div>
            ))}
          </div>
        )}
      </figure>
      <div className={css.calc}>
        {!cur ? (
          <span className="small muted">Press Step ▶ to build the first {N} rows.</span>
        ) : cur.line === 0 ? (
          <span>The outer array has {N} slots, but every slot is still <code>null</code>: no row exists yet.</span>
        ) : cur.line === 2 ? (
          <span>Row {cur.r} is created with length {cur.r + 1}. Java fills it with zeros.</span>
        ) : cur.line === 6 ? (
          <span className={css.mono}>tri[{cur.r}][{cur.c}] = tri[{cur.r - 1}][{cur.c! - 1}] + tri[{cur.r - 1}][{cur.c}] = {full[cur.r - 1][cur.c! - 1]} + {full[cur.r - 1][cur.c!]} = {full[cur.r][cur.c!]}</span>
        ) : (
          <span>
            The {cur.c === 0 ? "first" : "last"} entry of a row is always 1.
            {cur.r < 2 && cur.c === (cur.r === 0 ? 0 : 1) ? ` Row ${cur.r} has no inside, so the loop c = 1; c < ${cur.r} runs 0 times.` : ""}
          </span>
        )}
        {s.i === steps.length && (
          <p className="small" style={{ margin: "6px 0 0" }}>Done: {N} rows with lengths {full.map((r) => r.length).join(", ")}. A rectangle <code>new int[{N}][{N}]</code> would have held {N * N} values; the triangle needs only {full.flat().length}.</p>
        )}
      </div>
    </>
  );
}

/* ---------- 2. Loop over a jagged array ---------- */

type DataId = "triangle" | "longFirst";
const DATA: Record<DataId, { label: string; rows: number[][] }> = {
  triangle: { label: "pascal(4)", rows: [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1]] },
  longFirst: { label: "{{5, 5, 5}, {1}, {2, 4}}", rows: [[5, 5, 5], [1], [2, 4]] },
};

function LoopDemo() {
  const [data, setData] = useState<DataId>("triangle");
  const [own, setOwn] = useState(true);
  const tri = DATA[data].rows;
  const steps = useMemo(() => {
    const list: { r: number; c: number; sums: number[]; crash?: boolean }[] = [];
    const sums = tri.map(() => 0);
    for (let r = 0; r < tri.length; r++) {
      const end = own ? tri[r].length : tri[0].length;
      for (let c = 0; c < end; c++) {
        if (c >= tri[r].length) { list.push({ r, c, sums: [...sums], crash: true }); return list; }
        sums[r] += tri[r][c];
        list.push({ r, c, sums: [...sums] });
      }
    }
    return list;
  }, [tri, own]);
  const s = useStepper(steps.length, `${data}-${own}`);
  const cur = s.i > 0 ? steps[s.i - 1] : null;
  const finished = s.i === steps.length;
  const correct = tri.map((row) => row.reduce((a, b) => a + b, 0));
  const sums = cur ? cur.sums : tri.map(() => 0);
  const visited = new Set(steps.slice(0, s.i).filter((p) => !p.crash).map((p) => `${p.r},${p.c}`));
  const width = Math.max(...tri.map((r) => r.length), own ? 0 : tri[0].length);

  return (
    <>
      <Choice<DataId> label="Array" value={data} onChange={setData} options={(Object.keys(DATA) as DataId[]).map((id) => ({ id, label: DATA[id].label }))} />
      <Choice<string> label="Inner bound" value={own ? "own" : "first"} onChange={(v) => setOwn(v === "own")} options={[{ id: "own", label: "c < tri[r].length" }, { id: "first", label: "c < tri[0].length (bug)" }]} />
      <CodeLines
        lines={[
          "for (int r = 0; r < tri.length; r++) {",
          `    for (int c = 0; ${own ? "c < tri[r].length" : "c < tri[0].length"}; c++) {`,
          "        sums[r] += tri[r][c];",
        ]}
        on={cur ? 2 : null}
      />
      <StepControls s={s} />
      <Vars vars={cur ? { r: cur.r, c: cur.c, [own ? "tri[r].length" : "tri[0].length"]: own ? tri[cur.r].length : tri[0].length } : { r: "-", c: "-" }} />
      <div style={{ display: "grid", gap: 3, margin: "6px 0" }} aria-label="The jagged array tri and the sums so far">
        {tri.map((row, r) => (
          <div key={r} style={{ display: "flex", gap: 3, alignItems: "center" }}>
            <span className={css.head} style={{ width: 52, justifyContent: "flex-start" }}>tri[{r}]</span>
            {Array.from({ length: width }, (_, c) => {
              if (c >= row.length) {
                const hit = cur?.crash && cur.r === r && cur.c === c;
                return <span key={c} className={`${css.cell} ${hit ? css.ghost : css.void}`} style={{ width: 34, height: 28 }}>{hit ? "✕" : ""}</span>;
              }
              const mark = cur && !cur.crash && cur.r === r && cur.c === c ? css.center : visited.has(`${r},${c}`) ? css.done : finished ? css.dim : "";
              return <span key={c} className={`${css.cell} ${mark}`} style={{ width: 34, height: 28, cursor: "default" }}>{row[c]}</span>;
            })}
            <span className={`small ${css.mono}`} style={{ marginLeft: 10 }}>sums[{r}] = {sums[r]}</span>
          </div>
        ))}
      </div>
      <div className={css.calc}>
        {cur?.crash ? (
          <span style={{ color: "var(--bad)" }}>💥 <code>ArrayIndexOutOfBoundsException: Index {cur.c} out of bounds for length {tri[cur.r].length}</code>. Row {cur.r} is shorter than row 0.</span>
        ) : finished ? (
          sums.every((v, r) => v === correct[r])
            ? <span>✅ sums = [{sums.join(", ")}]. Every value of every row was added exactly once.</span>
            : <span>❌ sums = [{sums.join(", ")}], but the right answer is [{correct.join(", ")}]. The dimmed values were never read, and nothing crashed to warn you.</span>
        ) : (
          <span className="small muted">Press Step ▶. Then try the bug on both arrays: one gives a silently wrong answer, the other crashes.</span>
        )}
      </div>
    </>
  );
}

/* ---------- 3. A row becomes a blur kernel ---------- */

function convolve(img: Gray, k: number[][]): Gray {
  const h = Math.floor(k.length / 2);
  return img.map((row, r) => row.map((_, c) => {
    let s = 0, w = 0;
    for (let i = 0; i < k.length; i++) for (let j = 0; j < k.length; j++) {
      const v = img[r + i - h]?.[c + j - h];
      if (v !== undefined) { s += k[i][j] * v; w += k[i][j]; }
    }
    return Math.floor(s / w);
  }));
}

function KernelDemo() {
  const [size, setSize] = useState<"3" | "5" | "7">("5");
  const [pick, setPick] = useState<{ r: number; c: number } | null>(null);
  const [photo, setPhoto] = useState<Gray | null>(null);
  useEffect(() => { loadGray("cat", 96).then(setPhoto); }, []);
  const n = Number(size);
  const w = useMemo(() => pascalJs(n)[n - 1], [n]);
  const k = useMemo(() => w.map((a) => w.map((b) => a * b)), [w]);
  const max = k[(n - 1) / 2][(n - 1) / 2];
  const total = k.flat().reduce((a, b) => a + b, 0);
  const blurred = useMemo(() => {
    if (!photo) return null;
    const box = Array.from({ length: n }, () => Array(n).fill(1));
    return { box: convolve(photo, box), smooth: convolve(photo, k) };
  }, [photo, k, n]);
  const p = pick && pick.r < n && pick.c < n ? pick : null;

  return (
    <>
      <Choice<"3" | "5" | "7"> label="Kernel size" value={size} onChange={setSize} options={[{ id: "3", label: "3 × 3" }, { id: "5", label: "5 × 5" }, { id: "7", label: "7 × 7" }]} />
      <p className="small" style={{ margin: "4px 0" }}>
        <code>w = pascal({n})[{n - 1}]</code> = <span className={css.mono}>{"{" + w.join(", ") + "}"}</span>. Click a cell of the kernel to see where its weight comes from.
      </p>
      <table className={css.kernelTable} aria-label={`${n} by ${n} kernel`}>
        <tbody>
          <tr>
            <td style={{ border: "none", background: "transparent" }} />
            {w.map((b, c) => <td key={c} style={{ border: "none", background: "transparent", color: "var(--muted)" }}>w[{c}]={b}</td>)}
          </tr>
          {k.map((row, r) => (
            <tr key={r}>
              <td style={{ border: "none", background: "transparent", color: "var(--muted)" }}>w[{r}]={w[r]}</td>
              {row.map((v, c) => (
                <td
                  key={c}
                  onClick={() => setPick({ r, c })}
                  style={{
                    cursor: "pointer",
                    background: `color-mix(in srgb, var(--hl) ${Math.round((v / max) * 70)}%, var(--surface))`,
                    outline: p && p.r === r && p.c === c ? "2px solid var(--hl2)" : undefined,
                    minWidth: 30,
                  }}
                >{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={css.calc} style={{ marginTop: 8 }}>
        {p ? (
          <span className={css.mono}>k[{p.r}][{p.c}] = w[{p.r}] * w[{p.c}] = {w[p.r]} * {w[p.c]} = {k[p.r][p.c]}</span>
        ) : (
          <span className="small muted">The center has the largest weight ({max}), the corners only 1.</span>
        )}
        <p className="small" style={{ margin: "6px 0 0" }}>All weights add up to {total} = {w.reduce((a, b) => a + b, 0)} × {w.reduce((a, b) => a + b, 0)}. The blur divides by that total.</p>
      </div>
      <div className={css.section}>
        <h4>Box blur vs. smooth blur, both {n} × {n}</h4>
        {photo && blurred ? (
          <div className={css.three}>
            <div><ImgCanvas gray={photo} label="Original photo" /><p className={css.cap}>original</p></div>
            <div><ImgCanvas gray={blurred.box} label="Box blur" /><p className={css.cap}>box blur: all weights 1</p></div>
            <div><ImgCanvas gray={blurred.smooth} label="Smooth blur with Pascal weights" /><p className={css.cap}>smooth blur: kernel({n})</p></div>
          </div>
        ) : <p className="muted">Loading the photo…</p>}
        <p className="small muted">Same size, same amount of work. Because the center pixel counts the most, the smooth blur keeps more of the eyes and whiskers, while the box blur washes them out more and can look a bit blocky.</p>
      </div>
    </>
  );
}

/** PF-209 concept: build Pascal's triangle as a jagged array, then turn a row into a 2D kernel. */
export function PascalConcept({ start }: { start?: string }) {
  const [mode, setMode] = useState<Mode>(start === "loop" || start === "kernel" ? start : "build");
  return (
    <div>
      <ConceptBadge />
      <Choice<Mode> label="Topic" value={mode} onChange={setMode} options={[{ id: "build", label: "Build the triangle" }, { id: "loop", label: "Loop over a jagged array" }, { id: "kernel", label: "Blur kernel" }]} />
      <div className={css.section}>{mode === "build" ? <BuildDemo /> : mode === "loop" ? <LoopDemo /> : <KernelDemo />}</div>
    </div>
  );
}
