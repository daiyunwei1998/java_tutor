"use client";

import { useEffect, useMemo, useState } from "react";
import type { Rgb } from "@/lib/viz/rgb";
import { PHOTOS, loadRgb } from "@/lib/viz/photos";
import { CodeLines, StepControls, useStepper, Vars } from "../StepControls";
import css from "./concepts.module.css";
import { Choice, ConceptBadge, ImgCanvas, NumGrid } from "./shared";

type Mode = "shapes" | "clip" | "transpose";
type Cell = { r: number; c: number };

// Every value is its position: 23 = row 2, column 3
const grid = (rows: number, cols: number) => Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => 10 * r + c));

/* ---------- 1. Loop shapes ---------- */

type ShapeId = "whole" | "rect" | "lower" | "lowerStrict" | "upper" | "anti";
type Shape = {
  label: string; rows: number; cols: number; outer: string; inner: string;
  /** inner range [from, to) for row r */
  range: (r: number) => [number, number];
  rowFrom: number; rowTo: number; count: string;
};
const SHAPES: Record<ShapeId, Shape> = {
  whole: { label: "Whole image", rows: 5, cols: 6, outer: "for (int r = 0; r < 5; r++) {", inner: "for (int c = 0; c < 6; c++) {", range: () => [0, 6], rowFrom: 0, rowTo: 5, count: "5 × 6 = 30" },
  rect: { label: "Sub-rectangle", rows: 5, cols: 6, outer: "for (int r = 1; r < 4; r++) {", inner: "for (int c = 2; c < 5; c++) {", range: () => [2, 5], rowFrom: 1, rowTo: 4, count: "(4 − 1) × (5 − 2) = 3 × 3 = 9" },
  lower: { label: "c <= r", rows: 5, cols: 5, outer: "for (int r = 0; r < 5; r++) {", inner: "for (int c = 0; c <= r; c++) {", range: (r) => [0, r + 1], rowFrom: 0, rowTo: 5, count: "1 + 2 + 3 + 4 + 5 = 15" },
  lowerStrict: { label: "c < r", rows: 5, cols: 5, outer: "for (int r = 0; r < 5; r++) {", inner: "for (int c = 0; c < r; c++) {", range: (r) => [0, r], rowFrom: 0, rowTo: 5, count: "0 + 1 + 2 + 3 + 4 = 10 (no diagonal)" },
  upper: { label: "c = r … end", rows: 5, cols: 5, outer: "for (int r = 0; r < 5; r++) {", inner: "for (int c = r; c < 5; c++) {", range: (r) => [r, 5], rowFrom: 0, rowTo: 5, count: "5 + 4 + 3 + 2 + 1 = 15" },
  anti: { label: "c < 5 − r", rows: 5, cols: 5, outer: "for (int r = 0; r < 5; r++) {", inner: "for (int c = 0; c < 5 - r; c++) {", range: (r) => [0, 5 - r], rowFrom: 0, rowTo: 5, count: "5 + 4 + 3 + 2 + 1 = 15" },
};

function ShapesDemo() {
  const [id, setId] = useState<ShapeId>("lower");
  const sh = SHAPES[id];
  const values = useMemo(() => grid(sh.rows, sh.cols), [sh]);
  const steps = useMemo(() => {
    const list: Cell[] = [];
    for (let r = sh.rowFrom; r < sh.rowTo; r++) {
      const [a, b] = sh.range(r);
      for (let c = a; c < b; c++) list.push({ r, c });
    }
    return list;
  }, [sh]);
  const s = useStepper(steps.length, id);
  const cur = s.i > 0 ? steps[s.i - 1] : null;
  const visited = new Set(steps.slice(0, s.i).map((p) => `${p.r},${p.c}`));
  const finished = s.i === steps.length;
  const [a, b] = cur ? sh.range(cur.r) : [0, 0];

  return (
    <>
      <Choice<ShapeId> label="Loop shape" value={id} onChange={setId} options={(Object.keys(SHAPES) as ShapeId[]).map((k) => ({ id: k, label: SHAPES[k].label }))} />
      <CodeLines lines={[sh.outer, "    " + sh.inner, "        visit(img[r][c]);", "    }", "}"]} on={cur ? 2 : null} />
      <StepControls s={s} />
      <Vars vars={cur ? { r: cur.r, c: cur.c, visited: s.i } : { visited: 0 }} />
      <NumGrid
        values={values}
        shade={false}
        caption="img (each value is its position: 23 = row 2, column 3)"
        marks={(r, c) => (cur && r === cur.r && c === cur.c ? "center" : visited.has(`${r},${c}`) ? "done" : finished ? "dim" : undefined)}
        onCell={(r, c) => { const k = steps.findIndex((p) => p.r === r && p.c === c); if (k >= 0) { s.setPlaying(false); s.setI(k + 1); } }}
      />
      <div className={css.calc}>
        {cur ? (
          <span className={css.mono}>row {cur.r}: the inner loop runs c = {a} … {b - 1} ({b - a} cell{b - a === 1 ? "" : "s"})</span>
        ) : id === "lowerStrict" ? (
          <span className="small muted">Press Step ▶. Row 0 has no cells at all here: c = 0; c &lt; 0 is false right away, so the inner loop runs 0 times.</span>
        ) : (
          <span className="small muted">Press Step ▶ and watch which cells the loop visits. Click a cell to jump to it.</span>
        )}
        {finished && <p className="small" style={{ margin: "6px 0 0" }}>Visited <strong>{steps.length}</strong> cells: {sh.count}.</p>}
      </div>
    </>
  );
}

/* ---------- 2. Clipping a selection ---------- */

const CR = 4, CC = 5;
const BOX = { top: -1, left: 3, bottom: 3, right: 6 };

function ClipDemo() {
  const [clip, setClip] = useState(true);
  const rStart = clip ? Math.max(0, BOX.top) : BOX.top, rEnd = clip ? Math.min(CR, BOX.bottom) : BOX.bottom;
  const cStart = clip ? Math.max(0, BOX.left) : BOX.left, cEnd = clip ? Math.min(CC, BOX.right) : BOX.right;
  const steps = useMemo(() => {
    const list: Cell[] = [];
    for (let r = rStart; r < rEnd; r++) for (let c = cStart; c < cEnd; c++) {
      list.push({ r, c });
      if (r < 0 || r >= CR || c < 0 || c >= CC) return list; // Java stops at the first bad index
    }
    return list;
  }, [rStart, rEnd, cStart, cEnd]);
  const s = useStepper(steps.length, clip);
  const cur = s.i > 0 ? steps[s.i - 1] : null;
  const crashed = !!cur && (cur.r < 0 || cur.r >= CR || cur.c < 0 || cur.c >= CC);
  const values = grid(CR, CC).map((row, r) => row.map((v, c) => (steps.slice(0, s.i).some((p) => p.r === r && p.c === c) ? 0 : v)));
  const inBox = (r: number, c: number) => r >= BOX.top && r < BOX.bottom && c >= BOX.left && c < BOX.right;

  return (
    <>
      <p className="small" style={{ margin: "4px 0" }}>
        The user dragged a box from (−1, 3) to (3, 6) on a {CR} × {CC} image: <code>fillRect(img, -1, 3, 3, 6, 0)</code>. Part of it hangs off the top and the right.
      </p>
      <Choice<string> label="Bounds" value={clip ? "clip" : "raw"} onChange={(v) => setClip(v === "clip")} options={[{ id: "clip", label: "Clip with Math.max / Math.min" }, { id: "raw", label: "Use the box as is (bug)" }]} />
      <CodeLines
        lines={clip ? [
          "int rStart = Math.max(0, top);            // 0",
          "int rEnd   = Math.min(img.length, bottom); // 3",
          "for (int r = rStart; r < rEnd; r++) {",
          "    int cStart = Math.max(0, left);           // 3",
          "    int cEnd = Math.min(img[r].length, right); // 5",
          "    for (int c = cStart; c < cEnd; c++) {",
          "        img[r][c] = value; count++;",
        ] : [
          "for (int r = top; r < bottom; r++) {      // r = -1 … 2",
          "    for (int c = left; c < right; c++) {  // c = 3 … 5",
          "        img[r][c] = value; count++;",
        ]}
        on={cur ? (clip ? 6 : 2) : null}
      />
      <StepControls s={s} />
      <Vars vars={cur ? { r: cur.r, c: cur.c, count: crashed ? s.i - 1 : s.i } : { count: 0 }} />
      <NumGrid
        values={values}
        shade={false}
        ghostRing
        caption="img: dashed cells do not exist. The ✕ cells are the part of the box outside the image."
        marks={(r, c) => {
          const inside = r >= 0 && r < CR && c >= 0 && c < CC;
          if (cur && r === cur.r && c === cur.c) return inside ? "center" : "ghost";
          if (!inside) return inBox(r, c) ? "ghost" : undefined;
          if (steps.slice(0, s.i).some((p) => p.r === r && p.c === c)) return "done";
          return inBox(r, c) ? "window" : undefined;
        }}
      />
      <div className={css.calc}>
        {crashed ? (
          <span style={{ color: "var(--bad)" }}>💥 <code>ArrayIndexOutOfBoundsException: Index {cur!.r < 0 || cur!.r >= CR ? cur!.r : cur!.c} out of bounds for length {cur!.r < 0 || cur!.r >= CR ? CR : CC}</code>. The very first pixel of the box, (−1, 3), is not in the image.</span>
        ) : s.i === steps.length && steps.length > 0 ? (
          <span>✅ Set <strong>{steps.length}</strong> pixels: rows {rStart}–{rEnd - 1} × columns {cStart}–{cEnd - 1} = {(rEnd - rStart)} × {(cEnd - cStart)}. No index was ever checked inside the loop, because the bounds were already safe.</span>
        ) : (
          <span className="small muted">Press Step ▶. The highlighted cells are the part of the box that is inside the image.</span>
        )}
      </div>
    </>
  );
}

/* ---------- 3. Transpose in place ---------- */

type Bound = "lt" | "le" | "full";
const N = 4;
const INNER: Record<Bound, string> = { lt: "c < r", le: "c <= r", full: "c < img.length" };

function TransposeDemo() {
  const [bound, setBound] = useState<Bound>("lt");
  const states = useMemo(() => {
    const m = grid(N, N);
    const list: { m: number[][]; r: number; c: number }[] = [];
    for (let r = 0; r < N; r++) {
      const end = bound === "lt" ? r : bound === "le" ? r + 1 : N;
      for (let c = 0; c < end; c++) {
        const t = m[r][c]; m[r][c] = m[c][r]; m[c][r] = t;
        list.push({ m: m.map((row) => [...row]), r, c });
      }
    }
    return list;
  }, [bound]);
  const s = useStepper(states.length, bound);
  const cur = s.i > 0 ? states[s.i - 1] : null;
  const m = cur ? cur.m : grid(N, N);
  const done = new Set(states.slice(0, s.i).map((p) => `${p.r},${p.c}`));
  const finished = s.i === states.length;
  const correct = finished && m.every((row, r) => row.every((v, c) => v === 10 * c + r));

  return (
    <>
      <Choice<Bound> label="Inner loop bound" value={bound} onChange={setBound} options={[{ id: "lt", label: "c < r" }, { id: "le", label: "c <= r" }, { id: "full", label: "c < img.length (old code)" }]} />
      <CodeLines
        lines={[
          "for (int r = 0; r < img.length; r++) {",
          `    for (int c = 0; ${INNER[bound]}; c++) {`,
          "        int tmp = img[r][c];",
          "        img[r][c] = img[c][r];",
          "        img[c][r] = tmp;",
        ]}
        on={cur ? 3 : null}
      />
      <StepControls s={s} />
      <Vars vars={cur ? { r: cur.r, c: cur.c, swaps: s.i } : { swaps: 0 }} />
      <NumGrid
        values={m}
        shade={false}
        caption="img (the same array, changed in place). At the start, 21 is row 2, column 1."
        marks={(r, c) => {
          if (cur && ((r === cur.r && c === cur.c) || (r === cur.c && c === cur.r))) return "pair";
          return done.has(`${r},${c}`) ? "done" : undefined;
        }}
      />
      <div className={css.calc}>
        {cur ? (
          <span className={css.mono}>
            swap img[{cur.r}][{cur.c}] ↔ img[{cur.c}][{cur.r}]
            {cur.r === cur.c ? " (a diagonal cell swaps with itself, wasted work)" : cur.c > cur.r ? " (this pair was already swapped once, so it goes back!)" : ""}
          </span>
        ) : <span className="small muted">Press Step ▶. Green cells are positions the loop has visited as (r, c).</span>}
        {finished && (
          <p className="small" style={{ margin: "6px 0 0" }}>
            {correct
              ? bound === "lt"
                ? `✅ Transposed with ${states.length} swaps: one per pair, nothing wasted.`
                : `✅ Transposed, but with ${states.length} swaps: ${N} of them swapped a diagonal cell with itself.`
              : `❌ ${states.length} swaps and the array is back to the start: every pair was swapped twice.`}
          </p>
        )}
      </div>
    </>
  );
}

function squareCrop(img: Rgb): Rgb {
  const h = img.red.length, w = img.red[0].length, n = Math.min(h, w);
  const top = Math.floor((h - n) / 2), left = Math.floor((w - n) / 2);
  const f = (ch: number[][]) => ch.slice(top, top + n).map((row) => row.slice(left, left + n));
  return { red: f(img.red), green: f(img.green), blue: f(img.blue) };
}
function mapRgb(img: Rgb, f: (ch: number[][]) => number[][]): Rgb {
  return { red: f(img.red), green: f(img.green), blue: f(img.blue) };
}
const transposeJs = (ch: number[][]) => ch[0].map((_, c) => ch.map((row) => row[c]));
const mirrorJs = (ch: number[][]) => ch.map((row) => [...row].reverse());

/** PF-206 concept: loop bounds that start and stop partway (sub-rectangles, clipping, triangles). */
export function LoopBoundsConcept() {
  const [mode, setMode] = useState<Mode>("shapes");
  const [photo, setPhoto] = useState<Rgb | null>(null);
  useEffect(() => { loadRgb(PHOTOS.cat.src, 96).then((p) => setPhoto(squareCrop(p))); }, []);
  const frames = useMemo(() => {
    if (!photo) return null;
    const t = mapRgb(photo, transposeJs);
    return { t, rot: mapRgb(t, mirrorJs) };
  }, [photo]);

  return (
    <div>
      <ConceptBadge />
      <Choice<Mode> label="Topic" value={mode} onChange={setMode} options={[{ id: "shapes", label: "Loop shapes" }, { id: "clip", label: "Clip a selection" }, { id: "transpose", label: "Transpose in place" }]} />
      <div className={css.section}>
        {mode === "shapes" ? <ShapesDemo /> : mode === "clip" ? <ClipDemo /> : <TransposeDemo />}
      </div>
      {mode === "transpose" && (
        <div className={css.section}>
          <h4>Transpose + mirror rows = rotate 90° clockwise</h4>
          {photo && frames ? (
            <div className={css.three}>
              <div><ImgCanvas rgb={photo} label="Original photo" /><p className={css.cap}>img</p></div>
              <div><ImgCanvas rgb={frames.t} label="Photo transposed" /><p className={css.cap}>transposeInPlace(img)</p></div>
              <div><ImgCanvas rgb={frames.rot} label="Photo rotated 90 degrees clockwise" /><p className={css.cap}>then mirrorRows(img)</p></div>
            </div>
          ) : <p className="muted">Loading the photo…</p>}
        </div>
      )}
    </div>
  );
}
