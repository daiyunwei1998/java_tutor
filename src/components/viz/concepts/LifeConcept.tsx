"use client";

import { useMemo, useState } from "react";
import { CodeLines, StepControls, useStepper, Vars } from "../StepControls";
import css from "./concepts.module.css";
import { Choice, ConceptBadge, NumGrid } from "./shared";

type Mode = "count" | "generation" | "play";
type Grid = number[][];

const ALIVE = { background: "var(--text)", color: "var(--surface)", fontWeight: 700 } as const;
const aliveStyle = (_r: number, _c: number, v: number | null) => (v === 1 ? ALIVE : undefined);

const fromRows = (rows: string[]): Grid => rows.map((s) => [...s].map((ch) => (ch === "#" ? 1 : 0)));

function countJs(g: Grid, r: number, c: number): number {
  let n = 0;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (dr === 0 && dc === 0) continue;
    n += g[r + dr]?.[c + dc] ?? 0;
  }
  return n;
}
const rule = (alive: number, n: number) => (alive === 1 ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0);
const nextJs = (g: Grid): Grid => g.map((row, r) => row.map((v, c) => rule(v, countJs(g, r, c))));

/* ---------- 1. Count the 8 neighbors ---------- */

const COUNT_GRID = fromRows([".#...", "##.#.", "..#..", ".#.##", "#...#"]);

function CountDemo() {
  const [cell, setCell] = useState({ r: 0, c: 0 });
  const R = COUNT_GRID.length, C = COUNT_GRID[0].length;
  const steps = useMemo(() => {
    const list: { dr: number; dc: number; nr: number; nc: number; kind: "self" | "outside" | "read"; count: number }[] = [];
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = cell.r + dr, nc = cell.c + dc;
      const kind = dr === 0 && dc === 0 ? "self" : nr < 0 || nr >= R || nc < 0 || nc >= C ? "outside" : "read";
      if (kind === "read") count += COUNT_GRID[nr][nc];
      list.push({ dr, dc, nr, nc, kind, count });
    }
    return list;
  }, [cell, R, C]);
  const s = useStepper(steps.length, `${cell.r},${cell.c}`);
  const cur = s.i > 0 ? steps[s.i - 1] : null;
  const seen = steps.slice(0, s.i);
  const finished = s.i === steps.length;

  return (
    <>
      <p className="small" style={{ margin: "4px 0" }}>Click any cell to count its neighbors. Start with a corner: some of its offsets fall off the grid.</p>
      <CodeLines
        lines={[
          "for (int dr = -1; dr <= 1; dr++) {",
          "    for (int dc = -1; dc <= 1; dc++) {",
          "        if (dr == 0 && dc == 0) continue;           // the cell itself",
          "        int nr = r + dr, nc = c + dc;",
          "        if (nr < 0 || nr >= grid.length",
          "                || nc < 0 || nc >= grid[nr].length) continue;",
          "        count += grid[nr][nc];",
        ]}
        on={cur ? (cur.kind === "self" ? 2 : cur.kind === "outside" ? 5 : 6) : null}
      />
      <StepControls s={s} />
      <Vars vars={cur ? { r: cell.r, c: cell.c, dr: cur.dr, dc: cur.dc, nr: cur.nr, nc: cur.nc, count: cur.count } : { r: cell.r, c: cell.c, count: 0 }} />
      <NumGrid
        values={COUNT_GRID}
        shade={false}
        ghostRing
        cellStyle={aliveStyle}
        caption="grid (1 = alive). Dashed cells are outside the grid."
        onCell={(r, c) => setCell({ r, c })}
        marks={(r, c) => {
          if (r === cell.r && c === cell.c) return "center";
          const hit = seen.find((p) => p.nr === r && p.nc === c);
          if (cur && cur.nr === r && cur.nc === c && cur.kind === "outside") return "ghost";
          if (hit) return hit.kind === "outside" ? "ghost" : "done";
          return Math.abs(r - cell.r) <= 1 && Math.abs(c - cell.c) <= 1 && r >= 0 && r < R && c >= 0 && c < C ? "window" : undefined;
        }}
      />
      <div className={css.calc}>
        {cur ? (
          <span className={css.mono}>
            offset ({cur.dr}, {cur.dc}) → [{cur.nr}][{cur.nc}]:{" "}
            {cur.kind === "self" ? "this is the cell itself, skip it" : cur.kind === "outside" ? "outside the grid, counts as dead" : `value ${COUNT_GRID[cur.nr][cur.nc]}, count is now ${cur.count}`}
          </span>
        ) : <span className="small muted">Press Step ▶ to try the 9 offsets one by one.</span>}
        {finished && (
          <p className="small" style={{ margin: "6px 0 0" }}>
            [{cell.r}][{cell.c}] has <strong>{steps[steps.length - 1].count}</strong> live neighbors out of {steps.filter((p) => p.kind === "read").length} real ones.{" "}
            It is {COUNT_GRID[cell.r][cell.c] ? "alive" : "dead"}, so in the next generation it is <strong>{rule(COUNT_GRID[cell.r][cell.c], steps[steps.length - 1].count) ? "alive" : "dead"}</strong>.
          </p>
        )}
      </div>
    </>
  );
}

/* ---------- 2. One generation: new array vs. in place ---------- */

const GEN_GRID = fromRows([".....", "..#..", "...#.", ".###.", "....."]);

function GenerationDemo() {
  const [inPlace, setInPlace] = useState(false);
  const R = GEN_GRID.length, C = GEN_GRID[0].length;
  const correct = useMemo(() => nextJs(GEN_GRID), []);
  const steps = useMemo(() => {
    const read = GEN_GRID.map((row) => [...row]);
    const next: (number | null)[][] = GEN_GRID.map((row) => row.map(() => null));
    const list: { r: number; c: number; n: number; v: number; read: Grid; next: (number | null)[][] }[] = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const n = countJs(read, r, c);
      const v = rule(read[r][c], n);
      if (inPlace) read[r][c] = v; else next[r][c] = v;
      list.push({ r, c, n, v, read: read.map((row) => [...row]), next: next.map((row) => [...row]) });
    }
    return list;
  }, [inPlace, R, C]);
  const s = useStepper(steps.length, inPlace);
  const cur = s.i > 0 ? steps[s.i - 1] : null;
  const finished = s.i === steps.length;
  const result = inPlace ? (cur ? cur.read : GEN_GRID) : null;
  const wrong = finished && inPlace ? result!.reduce((a, row, r) => a + row.filter((v, c) => v !== correct[r][c]).length, 0) : 0;
  const near = (r: number, c: number) => !!cur && Math.abs(r - cur.r) <= 1 && Math.abs(c - cur.c) <= 1 && !(r === cur.r && c === cur.c);
  const visitedBefore = (r: number, c: number) => !!cur && (r < cur.r || (r === cur.r && c < cur.c));

  return (
    <>
      <Choice<string>
        label="Where the new values go"
        value={inPlace ? "same" : "new"}
        onChange={(v) => setInPlace(v === "same")}
        options={[{ id: "new", label: "Write into a new array" }, { id: "same", label: "Write into the same array (bug)" }]}
      />
      <CodeLines
        lines={[
          inPlace ? "// no second array" : "int[][] next = new int[grid.length][grid[0].length];",
          "for (int r = 0; r < grid.length; r++) {",
          "    for (int c = 0; c < grid[r].length; c++) {",
          "        int n = countNeighbors(grid, r, c);",
          inPlace ? "        grid[r][c] = (rule for grid[r][c] and n);" : "        next[r][c] = (rule for grid[r][c] and n);",
        ]}
        on={cur ? 4 : null}
      />
      <StepControls s={s} />
      <Vars vars={cur ? { r: cur.r, c: cur.c, n: cur.n, [inPlace ? "grid[r][c]" : "next[r][c]"]: cur.v } : { r: "-", c: "-" }} />
      <div className={inPlace ? undefined : css.two}>
        <NumGrid
          values={inPlace ? result! : GEN_GRID}
          shade={false}
          cellStyle={aliveStyle}
          caption={inPlace ? "grid: read AND written. Cells before the current one already hold new values." : "grid: only read, never changed"}
          marks={(r, c) => {
            if (cur && r === cur.r && c === cur.c) return "center";
            if (near(r, c)) return inPlace && visitedBefore(r, c) ? "pair" : "window";
            return undefined;
          }}
        />
        {!inPlace && (
          <NumGrid
            values={cur ? cur.next : GEN_GRID.map((row) => row.map(() => null))}
            shade={false}
            cellStyle={aliveStyle}
            caption="next: only written"
            marks={(r, c) => (cur && r === cur.r && c === cur.c ? "dst" : undefined)}
          />
        )}
      </div>
      <div className={css.calc}>
        {cur ? (
          <span className={css.mono}>
            [{cur.r}][{cur.c}] has {cur.n} live neighbor{cur.n === 1 ? "" : "s"} → {cur.v ? "alive" : "dead"}
            {inPlace && [...Array(9)].some((_, k) => { const r = cur.r + Math.floor(k / 3) - 1, c = cur.c + (k % 3) - 1; return near(r, c) && visitedBefore(r, c) && r >= 0 && c >= 0 && r < R && c < C; })
              ? "   (the blue-ringed neighbors were already overwritten!)" : ""}
          </span>
        ) : <span className="small muted">Press Step ▶. The orange ring is the 3×3 neighborhood the loop reads for the current cell.</span>}
        {finished && (
          <p className="small" style={{ margin: "6px 0 0" }}>
            {inPlace
              ? wrong > 0
                ? <>❌ {wrong} cell{wrong === 1 ? "" : "s"} differ from the real next generation. Cells further down counted neighbors that were already in the new generation.</>
                : <>The result happens to be right for this grid, but only by luck.</>
              : <>✅ This is the real next generation: the glider moved one step. <code>grid</code> was never changed while we read it.</>}
          </p>
        )}
      </div>
    </>
  );
}

/* ---------- 3. Play many generations ---------- */

const PLAY_R = 14, PLAY_C = 16;
function playStart(): Grid {
  const g = Array.from({ length: PLAY_R }, () => Array(PLAY_C).fill(0));
  for (const [r, c] of [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]]) g[r][c] = 1; // glider
  for (const [r, c] of [[3, 11], [3, 12], [3, 13]]) g[r][c] = 1; // blinker
  for (const [r, c] of [[10, 2], [10, 3], [11, 2], [11, 3]]) g[r][c] = 1; // block
  return g;
}

function PlayDemo() {
  const gens = useMemo(() => {
    const list = [playStart()];
    for (let k = 0; k < 56; k++) list.push(nextJs(list[list.length - 1]));
    return list;
  }, []);
  const s = useStepper(gens.length - 1, "play");
  const g = gens[s.i];
  const alive = g.reduce((a, row) => a + row.reduce((x, v) => x + v, 0), 0);
  return (
    <>
      <p className="small" style={{ margin: "4px 0" }}>Three classic patterns: a <strong>glider</strong> (top left) that walks diagonally, a <strong>blinker</strong> (top right) that flips, and a <strong>block</strong> (bottom left) that never changes. Each step is one call to <code>nextGeneration</code>.</p>
      <StepControls s={s} />
      <Vars vars={{ generation: s.i, alive }} />
      <div className={css.gridFig}>
        <div className={css.grid} style={{ gridTemplateColumns: `repeat(${PLAY_C}, 18px)`, gridAutoRows: "18px", gap: 2 }} role="img" aria-label={`Generation ${s.i}, ${alive} live cells`}>
          {g.flatMap((row, r) => row.map((v, c) => (
            <span key={`${r},${c}`} className={css.cell} style={{ cursor: "default", borderWidth: 1, ...(v ? { background: "var(--text)", borderColor: "var(--text)" } : {}) }} />
          )))}
        </div>
      </div>
      {s.i >= 50 && <p className="small muted">The glider reaches the bottom edge. Cells outside the grid count as dead, so it cannot leave: it freezes into a block.</p>}
    </>
  );
}

/** PF-207 concept: count 8 neighbors with offsets, and compute a generation into a separate array. */
export function LifeConcept({ start }: { start?: string }) {
  const [mode, setMode] = useState<Mode>(start === "generation" || start === "play" ? start : "count");
  return (
    <div>
      <ConceptBadge />
      <Choice<Mode> label="Topic" value={mode} onChange={setMode} options={[{ id: "count", label: "Count neighbors" }, { id: "generation", label: "One generation" }, { id: "play", label: "Play" }]} />
      <div className={css.section}>{mode === "count" ? <CountDemo /> : mode === "generation" ? <GenerationDemo /> : <PlayDemo />}</div>
    </div>
  );
}
