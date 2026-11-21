"use client";

import { useEffect, useMemo, useState } from "react";
import type { Gray } from "@/lib/viz/image";
import { GX, GY, kernelAt, loadGray, magnitude, sobelJs } from "@/lib/viz/photos";
import { StepControls, useStepper } from "../StepControls";
import css from "./concepts.module.css";
import { Choice, ConceptBadge, ImgCanvas, NumGrid } from "./shared";

type Sample = "vertical" | "horizontal" | "diagonal" | "photo";
const N = 8;
const make = (f: (r: number, c: number) => number): Gray => Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => f(r, c)));
const SAMPLES: Record<Exclude<Sample, "photo">, Gray> = {
  vertical: make((_, c) => (c < 4 ? 30 : 80)),
  horizontal: make((r) => (r < 4 ? 30 : 80)),
  diagonal: make((r, c) => (r + c < 7 ? 30 : 80)),
};

/** Finds the 8×8 crop of the photo with the strongest edges, so the worked example uses real pixel values. */
function bestCrop(img: Gray): { crop: Gray; top: number; left: number } {
  const e = sobelJs(img);
  let best = -1, top = 0, left = 0;
  for (let r = 0; r + N <= img.length; r += 4) {
    for (let c = 0; c + N <= img[0].length; c += 4) {
      let s = 0;
      for (let i = 2; i < N - 2; i++) for (let j = 2; j < N - 2; j++) s += e[r + i][c + j];
      if (s > best) { best = s; top = r; left = c; }
    }
  }
  return { crop: img.slice(top, top + N).map((row) => row.slice(left, left + N)), top, left };
}

function KernelProducts({ name, k, img, r, c, sum }: { name: string; k: number[][]; img: Gray; r: number; c: number; sum: number }) {
  return (
    <div>
      <div className="small"><strong>{name}</strong> × neighborhood</div>
      <table className={css.kernelTable}>
        <tbody>
          {k.map((row, i) => (
            <tr key={i}>
              {row.map((w, j) => {
                const p = img[r - 1 + i][c - 1 + j];
                return (
                  <td key={j} className={w === 0 ? css.zero : w > 0 ? css.pos : css.neg} title={`${name}[${i}][${j}] × img[${r - 1 + i}][${c - 1 + j}]`}>
                    {w} × {p}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={css.mono}>sum = <strong>{sum}</strong></div>
    </div>
  );
}

/** PF-204 concept: slide the 3×3 Sobel kernels over the pixels, then see the result on a real photo. */
export function SobelConcept() {
  const [sample, setSample] = useState<Sample>("vertical");
  const [photo, setPhoto] = useState<Gray | null>(null);
  const [photoId, setPhotoId] = useState<"camera" | "cat">("camera");
  const [cat, setCat] = useState<Gray | null>(null);

  useEffect(() => { loadGray("camera", 96).then(setPhoto); loadGray("cat", 120).then(setCat); }, []);
  const crop = useMemo(() => (photo ? bestCrop(photo) : null), [photo]);
  const img = sample === "photo" ? crop?.crop ?? SAMPLES.vertical : SAMPLES[sample];

  // Interior positions in row-major order: (1,1), (1,2), …
  const positions = useMemo(() => {
    const p: { r: number; c: number }[] = [];
    for (let r = 1; r < N - 1; r++) for (let c = 1; c < N - 1; c++) p.push({ r, c });
    return p;
  }, []);
  const s = useStepper(positions.length, sample);
  const cur = s.i > 0 ? positions[s.i - 1] : null;
  const out: (number | null)[][] = img.map((row, r) => row.map((_, c) => (r === 0 || c === 0 || r === N - 1 || c === N - 1 ? 0 : null)));
  positions.slice(0, s.i).forEach(({ r, c }) => { out[r][c] = magnitude(kernelAt(img, r, c, GX), kernelAt(img, r, c, GY)); });
  const gx = cur ? kernelAt(img, cur.r, cur.c, GX) : 0;
  const gy = cur ? kernelAt(img, cur.r, cur.c, GY) : 0;
  const inWin = (r: number, c: number) => !!cur && Math.abs(r - cur.r) <= 1 && Math.abs(c - cur.c) <= 1;

  const big = photoId === "camera" ? photo : cat;
  const views = useMemo(() => (big ? { gx: sobelJs(big, "gx"), gy: sobelJs(big, "gy"), both: sobelJs(big) } : null), [big]);

  return (
    <div>
      <ConceptBadge />
      <div className={css.section}>
        <h4>1. Slide the 3×3 window over the image</h4>
        <Choice<Sample>
          label="Example image"
          value={sample}
          onChange={setSample}
          options={[{ id: "vertical", label: "Vertical edge" }, { id: "horizontal", label: "Horizontal edge" }, { id: "diagonal", label: "Diagonal edge" }, { id: "photo", label: "📷 Real photo crop" }]}
        />
        {sample === "photo" && crop && <p className="small muted" style={{ margin: 0 }}>These are real pixel values: the 8×8 block at rows {crop.top}–{crop.top + N - 1}, columns {crop.left}–{crop.left + N - 1} of the camera photo below.</p>}
        <StepControls s={s} />
        <NumGrid
          values={img}
          caption="img (input): click an inside pixel to jump there"
          marks={(r, c) => (cur && r === cur.r && c === cur.c ? "center" : inWin(r, c) ? "window" : undefined)}
          onCell={(r, c) => { const k = positions.findIndex((p) => p.r === r && p.c === c); if (k >= 0) { s.setPlaying(false); s.setI(k + 1); } }}
        />
      </div>

      <div className={css.section}>
        <h4>2. Multiply each pixel by the kernel weight that sits on it, then add</h4>
        {cur ? (
          <div className={css.calc}>
            <div className="small" style={{ marginBottom: 6 }}>Center pixel <code>img[{cur.r}][{cur.c}]</code>. Green weights are +, red weights are −, gray weights are 0.</div>
            <div className={css.two}>
              <KernelProducts name="GX" k={GX} img={img} r={cur.r} c={cur.c} sum={gx} />
              <KernelProducts name="GY" k={GY} img={img} r={cur.r} c={cur.c} sum={gy} />
            </div>
            <div className={css.formula} style={{ marginTop: 8 }}>
              strength = √(gx² + gy²) = √({gx}² + {gy}²) = √{gx * gx + gy * gy} ≈ {Math.sqrt(gx * gx + gy * gy).toFixed(1)} → round → {Math.round(Math.sqrt(gx * gx + gy * gy))}
              {Math.round(Math.sqrt(gx * gx + gy * gy)) > 255 ? " → too big, clamp to 255" : ""} → <strong>{magnitude(gx, gy)}</strong>
            </div>
            <p className="small muted" style={{ margin: "6px 0 0" }}>
              {gx === 0 && gy === 0 ? "Every weight multiplies the same value, and the weights add up to 0, so a flat area gives 0: no edge." : Math.abs(gx) > Math.abs(gy) ? "GX is large: brightness changes from left to right, so there is a vertical edge here." : Math.abs(gy) > Math.abs(gx) ? "GY is large: brightness changes from top to bottom, so there is a horizontal edge here." : "GX and GY are both large: the edge is diagonal."}
            </p>
          </div>
        ) : (
          <p className="small muted">Press Step ▶ (or click a pixel that is not on the border) to start at img[1][1].</p>
        )}
      </div>

      <div className={css.section}>
        <h4>3. The result goes into a new image</h4>
        <NumGrid
          values={out}
          caption="edges (output): border pixels are 0, ? = not computed yet"
          marks={(r, c) => (cur && r === cur.r && c === cur.c ? "dst" : r === 0 || c === 0 || r === N - 1 || c === N - 1 ? "dim" : undefined)}
        />
      </div>

      <div className={css.section}>
        <h4>4. The same math on a whole photo</h4>
        <Choice<"camera" | "cat"> label="Photo" value={photoId} onChange={setPhotoId} options={[{ id: "camera", label: "📷 Camera photo" }, { id: "cat", label: "🐱 Cat photo" }]} />
        {big && views ? (
          <div className={css.two}>
            <div><ImgCanvas gray={big} label="Original photo in grayscale" marks={photoId === "camera" && sample === "photo" && crop ? [{ r: crop.top, c: crop.left, h: N, w: N }] : []} /><p className={css.cap}>original</p></div>
            <div><ImgCanvas gray={views.both} label="Sobel edge strength" /><p className={css.cap}>edges: √(gx² + gy²)</p></div>
            <div><ImgCanvas gray={views.gx} label="Only GX" /><p className={css.cap}>only |gx|: finds vertical edges</p></div>
            <div><ImgCanvas gray={views.gy} label="Only GY" /><p className={css.cap}>only |gy|: finds horizontal edges</p></div>
          </div>
        ) : <p className="muted">Loading the photo…</p>}
      </div>
    </div>
  );
}
