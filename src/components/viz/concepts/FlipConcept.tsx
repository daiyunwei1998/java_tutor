"use client";

import { useEffect, useMemo, useState } from "react";
import type { Rgb } from "@/lib/viz/rgb";
import { PHOTOS, loadRgb } from "@/lib/viz/photos";
import { StepControls, useStepper } from "../StepControls";
import css from "./concepts.module.css";
import { Choice, ConceptBadge, ImgCanvas, NumGrid } from "./shared";

type Mode = "horizontal" | "vertical" | "inplace";
const R = 3, C = 5;
// The value tells you where the pixel started: 23 = row 1, column 2 (counting from 1 so 0 never appears)
const IMG = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => 10 * (r + 1) + (c + 1)));

function flipRgb(img: Rgb, h: boolean): Rgb {
  const f = (ch: number[][]) => (h ? ch.map((row) => [...row].reverse()) : [...ch].reverse().map((row) => [...row]));
  return { red: f(img.red), green: f(img.green), blue: f(img.blue) };
}

function MappingDemo({ mode }: { mode: "horizontal" | "vertical" }) {
  const positions = useMemo(() => {
    const p: { r: number; c: number }[] = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) p.push({ r, c });
    return p;
  }, []);
  const s = useStepper(positions.length, mode);
  const cur = s.i > 0 ? positions[s.i - 1] : null;
  const srcOf = (r: number, c: number) => (mode === "horizontal" ? { r, c: C - 1 - c } : { r: R - 1 - r, c });
  const src = cur ? srcOf(cur.r, cur.c) : null;
  const out: (number | null)[][] = IMG.map((row) => row.map(() => null));
  positions.slice(0, s.i).forEach(({ r, c }) => { const p = srcOf(r, c); out[r][c] = IMG[p.r][p.c]; });

  return (
    <>
      <StepControls s={s} />
      <div className={css.two}>
        <NumGrid values={IMG} shade={false} caption="img (input)" marks={(r, c) => (src && r === src.r && c === src.c ? "src" : undefined)} />
        <NumGrid values={out} shade={false} caption="out (new array)" marks={(r, c) => (cur && r === cur.r && c === cur.c ? "dst" : undefined)} onCell={(r, c) => { s.setPlaying(false); s.setI(r * C + c + 1); }} />
      </div>
      <div className={css.calc}>
        {cur && src ? (
          <div className={css.formula}>
            {mode === "horizontal"
              ? <>out[{cur.r}][{cur.c}] = img[{cur.r}][cols − 1 − {cur.c}] = img[{cur.r}][{C} − 1 − {cur.c}] = img[{src.r}][{src.c}] = <strong>{IMG[src.r][src.c]}</strong></>
              : <>out[{cur.r}][{cur.c}] = img[rows − 1 − {cur.r}][{cur.c}] = img[{R} − 1 − {cur.r}][{cur.c}] = img[{src.r}][{src.c}] = <strong>{IMG[src.r][src.c]}</strong></>}
          </div>
        ) : <span className="small muted">Press Step ▶. For each cell of out, the formula tells you which cell of img to copy. Each value is its starting position: 23 = row 1, column 2 (counting from 1).</span>}
      </div>
    </>
  );
}

function InPlaceDemo() {
  const [len, setLen] = useState(6);
  const [bug, setBug] = useState(false);
  const stop = bug ? len : Math.floor(len / 2);
  const states = useMemo(() => {
    const row = Array.from({ length: len }, (_, i) => i + 1);
    const list: { row: number[]; c: number }[] = [];
    for (let c = 0; c < stop; c++) {
      const t = row[c]; row[c] = row[len - 1 - c]; row[len - 1 - c] = t;
      list.push({ row: [...row], c });
    }
    return list;
  }, [len, stop]);
  const s = useStepper(states.length, `${len}-${bug}`);
  const cur = s.i > 0 ? states[s.i - 1] : null;
  const row = cur ? cur.row : Array.from({ length: len }, (_, i) => i + 1);

  return (
    <>
      <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
        <Choice<string> label="Row length" value={String(len)} onChange={(v) => setLen(Number(v))} options={[{ id: "6", label: "Even: 6 elements" }, { id: "5", label: "Odd: 5 elements" }]} />
        <Choice<string> label="Loop" value={bug ? "bug" : "ok"} onChange={(v) => setBug(v === "bug")} options={[{ id: "ok", label: "c < row.length / 2" }, { id: "bug", label: "c < row.length (bug)" }]} />
      </div>
      <pre className="console" style={{ color: "var(--text)" }}>{`for (int c = 0; c < ${bug ? "row.length" : "row.length / 2"}; c++) {   // ${stop} swaps
    int tmp = row[c];
    row[c] = row[row.length - 1 - c];
    row[row.length - 1 - c] = tmp;
}`}</pre>
      <StepControls s={s} />
      <NumGrid values={[row]} shade={false} caption="row (the same array, changed in place)" marks={(_, c) => (cur && (c === cur.c || c === len - 1 - cur.c) ? "pair" : undefined)} />
      <div className={css.calc}>
        {cur ? (
          <span className={css.mono}>c = {cur.c}: swap row[{cur.c}] and row[{len - 1 - cur.c}]{cur.c === len - 1 - cur.c ? " (the middle swaps with itself)" : ""}</span>
        ) : <span className="small muted">Press Step ▶ to swap pairs from both ends.</span>}
        {s.i === states.length && states.length > 0 && (
          <p className="small" style={{ margin: "6px 0 0" }}>
            {bug ? "❌ The second half swapped every pair back, so the row is unchanged." : len % 2 ? "✅ Mirrored. The middle element (index 2) never moved, and it did not need to." : "✅ Mirrored after only 3 swaps."}
          </p>
        )}
      </div>
    </>
  );
}

/** PF-202 concept: where every output pixel comes from, and why an in-place swap stops at the middle. */
export function FlipConcept() {
  const [mode, setMode] = useState<Mode>("horizontal");
  const [photo, setPhoto] = useState<Rgb | null>(null);
  useEffect(() => { loadRgb(PHOTOS.cat.src).then(setPhoto); }, []);
  const flipped = useMemo(() => (photo && mode !== "inplace" ? flipRgb(photo, mode === "horizontal") : null), [photo, mode]);

  return (
    <div>
      <ConceptBadge />
      <Choice<Mode> label="Operation" value={mode} onChange={setMode} options={[{ id: "horizontal", label: "Flip horizontal" }, { id: "vertical", label: "Flip vertical" }, { id: "inplace", label: "Mirror in place (swap)" }]} />
      {mode === "inplace" ? <InPlaceDemo /> : (
        <>
          <div className={css.section}><MappingDemo key={mode} mode={mode} /></div>
          <div className={css.section}>
            <h4>On a real photo</h4>
            {photo && flipped ? (
              <div className={css.two}>
                <div><ImgCanvas rgb={photo} label="Original photo" /><p className={css.cap}>img</p></div>
                <div><ImgCanvas rgb={flipped} label={`Photo flipped ${mode}`} /><p className={css.cap}>{mode === "horizontal" ? "flipHorizontal(img)" : "flipVertical(img)"}</p></div>
              </div>
            ) : <p className="muted">Loading the photo…</p>}
          </div>
        </>
      )}
    </div>
  );
}
