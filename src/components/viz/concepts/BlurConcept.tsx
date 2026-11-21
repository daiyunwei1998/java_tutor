"use client";

import { useEffect, useMemo, useState } from "react";
import type { Gray } from "@/lib/viz/image";
import { boxBlurJs, loadGray } from "@/lib/viz/photos";
import { StepControls, useStepper } from "../StepControls";
import css from "./concepts.module.css";
import { Choice, ConceptBadge, ImgCanvas, NumGrid } from "./shared";

type Sample = "dot" | "checker" | "photo";
const R = 5, C = 6;
const make = (f: (r: number, c: number) => number): Gray => Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, c) => f(r, c)));
const SAMPLES: Record<Exclude<Sample, "photo">, Gray> = {
  dot: make((r, c) => (r === 2 && c === 2 ? 240 : 30)),
  checker: make((r, c) => ((r + c) % 2 ? 210 : 40)),
};

/** PF-203 concept: average the 3×3 neighborhood, skipping cells that do not exist. */
export function BlurConcept() {
  const [sample, setSample] = useState<Sample>("dot");
  const [photo, setPhoto] = useState<Gray | null>(null);
  const [passes, setPasses] = useState(2);
  useEffect(() => { loadGray("camera", 96).then(setPhoto); }, []);
  const crop = useMemo(() => photo?.slice(30, 30 + R).map((row) => row.slice(40, 40 + C)) ?? null, [photo]);
  const img = sample === "photo" ? crop ?? SAMPLES.dot : SAMPLES[sample];

  const positions = useMemo(() => {
    const p: { r: number; c: number }[] = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) p.push({ r, c });
    return p;
  }, []);
  const s = useStepper(positions.length, sample);
  const cur = s.i > 0 ? positions[s.i - 1] : null;
  const blurred = boxBlurJs(img);
  const out: (number | null)[][] = img.map((row) => row.map(() => null));
  positions.slice(0, s.i).forEach(({ r, c }) => { out[r][c] = blurred[r][c]; });

  const inside: number[] = [];
  let outside = 0;
  if (cur) {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const v = img[cur.r + dr]?.[cur.c + dc];
      if (v === undefined) outside++; else inside.push(v);
    }
  }
  const sum = inside.reduce((a, b) => a + b, 0);
  const near = (r: number, c: number) => !!cur && Math.abs(r - cur.r) <= 1 && Math.abs(c - cur.c) <= 1;

  const photoPasses = useMemo(() => {
    if (!photo) return [];
    const list = [photo];
    for (let k = 0; k < 5; k++) list.push(boxBlurJs(list[list.length - 1]));
    return list;
  }, [photo]);

  return (
    <div>
      <ConceptBadge />
      <div className={css.section}>
        <h4>1. Visit every pixel and look at its 3×3 neighborhood</h4>
        <Choice<Sample> label="Example image" value={sample} onChange={setSample} options={[{ id: "dot", label: "One bright dot" }, { id: "checker", label: "Checkerboard" }, { id: "photo", label: "📷 Real photo crop" }]} />
        <StepControls s={s} />
        <NumGrid
          values={img}
          ghostRing
          caption="img: dashed red ✕ cells are outside the array and do not exist"
          marks={(r, c) => {
            if (!near(r, c)) return undefined;
            const exists = r >= 0 && r < R && c >= 0 && c < C;
            if (!exists) return "ghost";
            return r === cur!.r && c === cur!.c ? "center" : "window";
          }}
          onCell={(r, c) => { s.setPlaying(false); s.setI(r * C + c + 1); }}
        />
      </div>

      <div className={css.section}>
        <h4>2. Average only the cells that exist</h4>
        {cur ? (
          <div className={css.calc}>
            <div className="small">Pixel <code>[{cur.r}][{cur.c}]</code>: {inside.length} of 9 neighbors exist{outside ? `, ${outside} are outside the image and skipped` : ""}.</div>
            <div className={css.formula}>
              ({inside.join(" + ")}) / {inside.length} = {sum} / {inside.length} = <strong>{Math.floor(sum / inside.length)}</strong>
            </div>
            <p className="small muted" style={{ margin: "4px 0 0" }}>
              {inside.length === 4 ? "A corner pixel has only 4 neighbors (itself included)." : inside.length === 6 ? "An edge pixel has 6." : "An inside pixel has all 9."}
              {" "}Reading img[-1][…] would throw ArrayIndexOutOfBoundsException, so the bounds check must come first.
            </p>
          </div>
        ) : <p className="small muted">Press Step ▶ to start at the corner [0][0], where the bounds check matters most.</p>}
      </div>

      <div className={css.section}>
        <h4>3. Write the average into a new image</h4>
        <NumGrid values={out} caption="out: always read from img, write here" marks={(r, c) => (cur && r === cur.r && c === cur.c ? "dst" : undefined)} />
        <p className="small muted">The bright dot spreads out over its neighbors and gets darker: that is what blur means.</p>
      </div>

      <div className={css.section}>
        <h4>4. The same math on a real photo</h4>
        <label className="small">Blur passes: <strong>{passes}</strong>
          <input type="range" min={1} max={5} value={passes} onChange={(e) => setPasses(Number(e.target.value))} style={{ width: "100%" }} aria-label="Blur passes" />
        </label>
        {photoPasses.length ? (
          <div className={css.two}>
            <div><ImgCanvas gray={photoPasses[0]} label="Original photo" marks={sample === "photo" ? [{ r: 30, c: 40, h: R, w: C }] : []} /><p className={css.cap}>original</p></div>
            <div><ImgCanvas gray={photoPasses[passes]} label={`Photo after ${passes} blur passes`} /><p className={css.cap}>boxBlur applied {passes}×</p></div>
          </div>
        ) : <p className="muted">Loading the photo…</p>}
      </div>
    </div>
  );
}
