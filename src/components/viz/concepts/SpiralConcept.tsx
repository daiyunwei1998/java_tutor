"use client";

import { useEffect, useMemo, useState } from "react";
import type { Gray } from "@/lib/viz/image";
import { loadGray } from "@/lib/viz/photos";
import { CodeLines, StepControls, useStepper, Vars } from "../StepControls";
import css from "./concepts.module.css";
import { Choice, ConceptBadge, ImgCanvas, NumGrid } from "./shared";

type SizeId = "4x4" | "4x5" | "3x5" | "5x3" | "1x4";
const SIZES: Record<SizeId, [number, number]> = { "4x4": [4, 4], "4x5": [4, 5], "3x5": [3, 5], "5x3": [5, 3], "1x4": [1, 4] };

type Bounds = { top: number; bottom: number; left: number; right: number };
type Step = { r: number; c: number; line: number; k: number; b: Bounds; crash?: string };

const counting = (rows: number, cols: number) => Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => r * cols + c + 1));

/** Simulates spiralOrder exactly like the Java version, optionally without the two checks. */
function walk(rows: number, cols: number, checks: boolean): { steps: Step[]; end: Bounds } {
  const list: Step[] = [];
  const total = rows * cols;
  let k = 0, top = 0, bottom = rows - 1, left = 0, right = cols - 1;
  const visit = (r: number, c: number, line: number) => {
    const b = { top, bottom, left, right };
    if (k >= total) { list.push({ r, c, line, k, b, crash: `out[${k}]: index ${k} out of bounds for length ${total}` }); return false; }
    list.push({ r, c, line, k: k++, b });
    return true;
  };
  outer: while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) if (!visit(top, c, 2)) break outer;
    top++;
    for (let r = top; r <= bottom; r++) if (!visit(r, right, 5)) break outer;
    right--;
    if (!checks || top <= bottom) {
      for (let c = right; c >= left; c--) if (!visit(bottom, c, 9)) break outer;
      bottom--;
    }
    if (!checks || left <= right) {
      for (let r = bottom; r >= top; r--) if (!visit(r, left, 14)) break outer;
      left++;
    }
  }
  return { steps: list, end: { top, bottom, left, right } };
}

function WalkDemo({ bug = false }: { bug?: boolean }) {
  const [size, setSize] = useState<SizeId>(bug ? "3x5" : "4x5");
  const [checks, setChecks] = useState(!bug);
  const [rows, cols] = SIZES[size];
  const img = useMemo(() => counting(rows, cols), [rows, cols]);
  const { steps, end } = useMemo(() => walk(rows, cols, checks), [rows, cols, checks]);
  const s = useStepper(steps.length, `${size}-${checks}`);
  const cur = s.i > 0 ? steps[s.i - 1] : null;
  const done = steps.slice(0, s.i).filter((p) => !p.crash);
  const times = new Map<string, number>();
  done.forEach((p) => times.set(`${p.r},${p.c}`, (times.get(`${p.r},${p.c}`) ?? 0) + 1));
  const b = cur ? cur.b : { top: 0, bottom: rows - 1, left: 0, right: cols - 1 };
  const finished = s.i === steps.length;
  const twice = [...times.values()].some((n) => n > 1);

  const check = (cond: string) => (checks ? `    if (${cond}) {` : `    {                            // check removed (bug)`);
  const lines = [
    "while (top <= bottom && left <= right) {",
    "    for (int c = left; c <= right; c++)          // top row",
    "        out[k++] = img[top][c];",
    "    top++;",
    "    for (int r = top; r <= bottom; r++)          // right column",
    "        out[k++] = img[r][right];",
    "    right--;",
    check("top <= bottom"),
    "        for (int c = right; c >= left; c--)      // bottom row",
    "            out[k++] = img[bottom][c];",
    "        bottom--;",
    "    }",
    check("left <= right"),
    "        for (int r = bottom; r >= top; r--)      // left column",
    "            out[k++] = img[r][left];",
    "        left++;",
    "    }",
    "}",
  ];
  const line = cur ? cur.line : null;

  return (
    <div>
      <Choice<SizeId> label="Image size" value={size} onChange={setSize} options={(Object.keys(SIZES) as SizeId[]).map((id) => ({ id, label: `${SIZES[id][0]} × ${SIZES[id][1]}` }))} />
      <Choice<string> label="Checks" value={checks ? "on" : "off"} onChange={(v) => setChecks(v === "on")} options={[{ id: "on", label: "With the two checks" }, { id: "off", label: "Without the checks (bug)" }]} />
      <div className={css.section}>
        <CodeLines lines={lines} on={line} />
        <StepControls s={s} />
        <Vars vars={{ top: b.top, bottom: b.bottom, left: b.left, right: b.right, k: cur ? cur.k : 0 }} />
        <NumGrid
          values={img}
          shade={false}
          caption="img. The orange frame is what is still unvisited: rows top … bottom, columns left … right."
          marks={(r, c) => {
            if (cur && r === cur.r && c === cur.c) return cur.crash ? "ghost" : "center";
            const n = times.get(`${r},${c}`) ?? 0;
            if (n > 1) return "pair";
            if (n === 1) return "done";
            return r >= b.top && r <= b.bottom && c >= b.left && c <= b.right ? "window" : undefined;
          }}
        />
        <div className={css.calc}>
          <div className={css.formula}>out = [{done.map((p) => img[p.r][p.c]).join(", ")}{done.length < rows * cols ? (done.length ? ", …" : "…") : ""}]</div>
          {cur?.crash ? (
            <p style={{ color: "var(--bad)", margin: "6px 0 0" }}>💥 <code>ArrayIndexOutOfBoundsException</code> at <code>{cur.crash}</code>. The leftover {rows < cols ? "row" : "column"} was walked a second time (blue ring), so there are more values than places in <code>out</code>.</p>
          ) : cur ? (
            <p className={`${css.mono} small`} style={{ margin: "6px 0 0" }}>
              {cur.line === 2 ? "top row" : cur.line === 5 ? "right column" : cur.line === 9 ? "bottom row" : "left column"}: out[{cur.k}] = img[{cur.r}][{cur.c}] = {img[cur.r][cur.c]}
            </p>
          ) : (
            <p className="small muted" style={{ margin: "6px 0 0" }}>Press Step ▶. Watch which boundary moves after each side. Try 3 × 5 and 5 × 3 with and without the checks.</p>
          )}
          {finished && !cur?.crash && (
            <p className="small" style={{ margin: "6px 0 0" }}>
              {twice ? "❌ Some cells were visited twice." : <>✅ All {rows * cols} cells, each exactly once. At the end top = {end.top}, bottom = {end.bottom}, left = {end.left}, right = {end.right}: {end.top > end.bottom ? "top passed bottom" : "left passed right"}, so nothing is left.</>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- 2. Rings ---------- */

const RING_ROWS = 6, RING_COLS = 8;

function RingsDemo() {
  const [pick, setPick] = useState({ r: 2, c: 1 });
  const ring = (r: number, c: number) => Math.min(Math.min(r, c), Math.min(RING_ROWS - 1 - r, RING_COLS - 1 - c));
  const values = Array.from({ length: RING_ROWS }, (_, r) => Array.from({ length: RING_COLS }, (_, c) => ring(r, c)));
  const { r, c } = pick;
  const d = [r, c, RING_ROWS - 1 - r, RING_COLS - 1 - c];
  const tints = ["var(--hl-soft)", "var(--hl2-soft)", "var(--ok-soft)", "var(--surface-2)"];
  return (
    <>
      <p className="small" style={{ margin: "4px 0" }}>Every cell shows its ring number on a {RING_ROWS} × {RING_COLS} image. Click a cell to see why it is on that ring.</p>
      <NumGrid
        values={values}
        shade={false}
        caption="ring(rows, cols, r, c) for every cell"
        onCell={(rr, cc) => setPick({ r: rr, c: cc })}
        cellStyle={(_r, _c, v) => ({ background: tints[(v ?? 0) % tints.length] })}
        marks={(rr, cc) => (rr === r && cc === c ? "center" : undefined)}
      />
      <div className={css.calc}>
        <div className={css.formula}>
          distance to the top = r = {d[0]}<br />
          distance to the left = c = {d[1]}<br />
          distance to the bottom = rows - 1 - r = {RING_ROWS - 1} - {r} = {d[2]}<br />
          distance to the right = cols - 1 - c = {RING_COLS - 1} - {c} = {d[3]}
        </div>
        <p className="small" style={{ margin: "6px 0 0" }}>The nearest edge is {Math.min(...d)} steps away, so <code>ring({RING_ROWS}, {RING_COLS}, {r}, {c})</code> = <strong>{Math.min(...d)}</strong>. The spiral finishes ring 0 completely before it starts ring 1.</p>
      </div>
    </>
  );
}

/* ---------- 3. The transition on a photo ---------- */

function revealOrderJs(rows: number, cols: number): number[][] {
  const step = Array.from({ length: rows }, () => Array(cols).fill(0));
  let k = 0, top = 0, bottom = rows - 1, left = 0, right = cols - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) step[top][c] = k++;
    top++;
    for (let r = top; r <= bottom; r++) step[r][right] = k++;
    right--;
    if (top <= bottom) { for (let c = right; c >= left; c--) step[bottom][c] = k++; bottom--; }
    if (left <= right) { for (let r = bottom; r >= top; r--) step[r][left] = k++; left++; }
  }
  return step;
}

function RevealDemo() {
  const [photo, setPhoto] = useState<Gray | null>(null);
  const [pct, setPct] = useState(35);
  useEffect(() => { loadGray("camera", 64).then(setPhoto); }, []);
  const order = useMemo(() => (photo ? revealOrderJs(photo.length, photo[0].length) : null), [photo]);
  if (!photo || !order) return <p className="muted">Loading the photo…</p>;
  const total = photo.length * photo[0].length;
  const shown = Math.round((pct / 100) * total);
  // Pixels whose step number is below `shown` are revealed; the rest still show the old slide (flat gray).
  const frame = photo.map((row, r) => row.map((v, c) => (order[r][c] < shown ? v : 225)));
  const stepView = photo.map((row, r) => row.map((_, c) => Math.floor((order[r][c] / total) * 255)));
  return (
    <>
      <p className="small" style={{ margin: "4px 0" }}>
        This is what the front end does with your <code>revealOrder</code>: at frame <em>f</em> it shows every pixel whose step number is smaller than <em>f</em>.
      </p>
      <label className={css.slider}>
        <span>shown</span>
        <input type="range" min={0} max={100} value={pct} onChange={(e) => setPct(Number(e.target.value))} aria-label="Percent of the photo revealed" />
        <span>{pct}%</span>
      </label>
      <div className={css.two} style={{ marginTop: 8 }}>
        <div><ImgCanvas gray={frame} label="Photo partly revealed in spiral order" /><p className={css.cap}>{shown} of {total} pixels revealed</p></div>
        <div><ImgCanvas gray={stepView} label="revealOrder drawn as brightness" /><p className={css.cap}>revealOrder as brightness: dark = early, bright = late</p></div>
      </div>
    </>
  );
}

type Mode = "walk" | "rings" | "reveal";

/** PF-208 concept: four boundaries that move inwards after each side of the spiral. */
export function SpiralConcept({ start }: { start?: string }) {
  const [mode, setMode] = useState<Mode>(start === "rings" || start === "reveal" ? start : "walk");
  return (
    <div>
      <ConceptBadge />
      <Choice<Mode> label="Topic" value={mode} onChange={setMode} options={[{ id: "walk", label: "Walk the spiral" }, { id: "rings", label: "Rings" }, { id: "reveal", label: "The transition on a photo" }]} />
      <div className={css.section}>{mode === "walk" ? <WalkDemo bug={start === "walk-bug"} /> : mode === "rings" ? <RingsDemo /> : <RevealDemo />}</div>
    </div>
  );
}
