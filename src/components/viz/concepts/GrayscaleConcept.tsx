"use client";

import { useEffect, useMemo, useState } from "react";
import { PHOTOS, loadRgb } from "@/lib/viz/photos";
import { fileToRgb, RGB_SAMPLES, type Rgb } from "@/lib/viz/rgb";
import css from "./concepts.module.css";
import { Choice, ConceptBadge, ImgCanvas, NumGrid, type Tint } from "./shared";

type Src = "coffee" | "cat" | "bars" | "upload";
type Px = { red: number; green: number; blue: number };

const PRESETS: { label: string; px: Px }[] = [
  { label: "Pure red", px: { red: 255, green: 0, blue: 0 } },
  { label: "Pure green", px: { red: 0, green: 255, blue: 0 } },
  { label: "Pure blue", px: { red: 0, green: 0, blue: 255 } },
  { label: "Yellow", px: { red: 255, green: 255, blue: 0 } },
  { label: "White", px: { red: 255, green: 255, blue: 255 } },
];

const avg = (p: Px) => Math.floor((p.red + p.green + p.blue) / 3);
const luma = (p: Px) => Math.floor((299 * p.red + 587 * p.green + 114 * p.blue) / 1000);

/** Starts on a strongly colored pixel, where red, green and blue differ the most, so the example is interesting. */
function mostColorful(img: Rgb): { r: number; c: number } {
  let best = -1, at = { r: 0, c: 0 };
  for (let r = 1; r < img.red.length - 1; r++) {
    for (let c = 1; c < img.red[0].length - 1; c++) {
      const v = [img.red[r][c], img.green[r][c], img.blue[r][c]];
      const spread = Math.max(...v) - Math.min(...v) + Math.max(...v) / 4;
      if (spread > best) { best = spread; at = { r, c }; }
    }
  }
  return at;
}

/** PF-201 concept: a color photo is three 2D arrays; grayscale combines them pixel by pixel. */
export function GrayscaleConcept() {
  const [src, setSrc] = useState<Src>("coffee");
  const [img, setImg] = useState<Rgb | null>(null);
  const [sel, setSel] = useState({ r: 40, c: 60 });
  const [custom, setCustom] = useState<Px | null>(null);
  const [asNumbers, setAsNumbers] = useState(false);

  useEffect(() => {
    if (src === "bars") { setImg(RGB_SAMPLES.stripes.make()); setSel({ r: 10, c: 14 }); return; }
    if (src === "upload") return;
    let live = true;
    loadRgb(PHOTOS[src].src).then((x) => { if (live) { setImg(x); setSel(mostColorful(x)); } });
    return () => { live = false; };
  }, [src]);

  const results = useMemo(() => {
    if (!img) return null;
    const a = img.red.map((row, r) => row.map((_, c) => avg({ red: img.red[r][c], green: img.green[r][c], blue: img.blue[r][c] })));
    const l = img.red.map((row, r) => row.map((_, c) => luma({ red: img.red[r][c], green: img.green[r][c], blue: img.blue[r][c] })));
    return { a, l };
  }, [img]);

  if (!img || !results) return <p className="muted">Loading the photo…</p>;
  const rows = img.red.length, cols = img.red[0].length;
  const r = Math.min(sel.r, rows - 1), c = Math.min(sel.c, cols - 1);
  const px: Px = custom ?? { red: img.red[r][c], green: img.green[r][c], blue: img.blue[r][c] };
  const where = custom ? "your pixel" : `pixel [${r}][${c}]`;

  // 3×3 neighborhood of numbers around the selected pixel, per channel
  const around = (ch: number[][]) => [-1, 0, 1].map((dr) => [-1, 0, 1].map((dc) => ch[r + dr]?.[c + dc] ?? null));
  const pick = (p: { r: number; c: number }) => { setSel(p); setCustom(null); };
  const mark = custom ? [] : [{ r, c }];
  const channels: { tint: Tint; name: string }[] = [{ tint: "red", name: "red" }, { tint: "green", name: "green" }, { tint: "blue", name: "blue" }];

  return (
    <div>
      <ConceptBadge />
      <Choice<Src>
        label="Image"
        value={src}
        onChange={(v) => { setSrc(v); setCustom(null); }}
        options={[{ id: "coffee", label: "☕ Coffee photo" }, { id: "cat", label: "🐱 Cat photo" }, { id: "bars", label: "Color bars" }, { id: "upload", label: "📁 Your image" }]}
      />
      {src === "upload" && (
        <input type="file" accept="image/*" aria-label="Upload an image" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const x = await fileToRgb(f, 120);
          setImg(x);
          setSel(mostColorful(x));
        }} />
      )}

      <div className={css.section}>
        <h4>1. The color image ({rows} rows × {cols} columns)</h4>
        <ImgCanvas rgb={img} marks={mark} label="Color image. Click to pick a pixel." onPick={pick} maxWidth={420} />
        <p className="small muted" style={{ margin: "4px 0 0" }}>Click or drag on the photo to pick a pixel. The yellow box is the pixel we follow below.</p>
      </div>

      <div className={css.section}>
        <h4>2. It is stored as three 2D arrays: red, green and blue</h4>
        <label className="small row" style={{ gap: 6, marginBottom: 6 }}>
          <input type="checkbox" checked={asNumbers} onChange={(e) => setAsNumbers(e.target.checked)} />
          Show each channel the way Java sees it: just numbers 0–255 (drawn as gray)
        </label>
        <div className={css.three}>
          {channels.map(({ tint, name }) => (
            <div key={tint}>
              <ImgCanvas rgb={asNumbers ? undefined : img} gray={asNumbers ? img[tint] : undefined} tint={tint} marks={mark} label={`${name} channel`} onPick={pick} />
              <p className={css.cap}><code>{name}</code> channel</p>
              {!custom && <NumGrid values={around(img[tint])} rowLabels={false} cell={30} marks={(i, j) => (i === 1 && j === 1 ? "center" : undefined)} shade={false} caption={`${name}[${r - 1}..${r + 1}][${c - 1}..${c + 1}]`} />}
            </div>
          ))}
        </div>
        <p className="small muted">Same <code>[r][c]</code> in all three arrays = the same pixel. A bright spot in the red channel means that part of the photo has a lot of red.</p>
      </div>

      <div className={css.section}>
        <h4>3. Combine the three numbers of {where} into one gray value</h4>
        <div className={css.calc}>
          <div style={{ marginBottom: 8 }}>
            <span className={css.swatch} style={{ background: `rgb(${px.red},${px.green},${px.blue})` }} />
            <span className={css.mono}>red = {px.red}, green = {px.green}, blue = {px.blue}</span>
          </div>
          <div className={css.formula}>
            <span className={css.swatch} style={{ background: `rgb(${avg(px)},${avg(px)},${avg(px)})` }} />
            <strong>average</strong> = ({px.red} + {px.green} + {px.blue}) / 3 = {px.red + px.green + px.blue} / 3 = <strong>{avg(px)}</strong>
          </div>
          <div className={css.formula}>
            <span className={css.swatch} style={{ background: `rgb(${luma(px)},${luma(px)},${luma(px)})` }} />
            <strong>luma</strong> = (299 × {px.red} + 587 × {px.green} + 114 × {px.blue}) / 1000 = {299 * px.red + 587 * px.green + 114 * px.blue} / 1000 = <strong>{luma(px)}</strong>
          </div>
          <p className="small muted" style={{ margin: "6px 0 0" }}>Both use integer division, so the decimals are dropped. The luma weights add up to 1000, so white (255, 255, 255) stays 255.</p>
        </div>
        <div className="row" style={{ flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          <span className="small">Try a pixel:</span>
          {PRESETS.map((p) => <button key={p.label} className="btn small" onClick={() => setCustom(p.px)}>{p.label}</button>)}
          {custom && <button className="btn small ghost" onClick={() => setCustom(null)}>Back to the photo</button>}
        </div>
        {custom && (
          <div style={{ marginTop: 8 }}>
            {(["red", "green", "blue"] as const).map((k) => (
              <label key={k} className={css.slider}>
                <span>{k}</span>
                <input type="range" min={0} max={255} value={custom[k]} onChange={(e) => setCustom({ ...custom, [k]: Number(e.target.value) })} aria-label={k} />
                <span className={css.mono}>{custom[k]}</span>
              </label>
            ))}
            <p className="small muted">Pure green and pure blue both average to 85, but green looks much brighter to us. Luma gives 149 vs 29.</p>
          </div>
        )}
      </div>

      <div className={css.section}>
        <h4>4. Do that for every pixel: two grayscale images</h4>
        <div className={css.two}>
          <div>
            <ImgCanvas gray={results.a} marks={mark} label="Average grayscale" onPick={pick} />
            <p className={css.cap}>average</p>
          </div>
          <div>
            <ImgCanvas gray={results.l} marks={mark} label="Luma grayscale" onPick={pick} />
            <p className={css.cap}>luma</p>
          </div>
        </div>
        <p className="small muted">Pick the color bars to see the difference best: under average, green and blue get the same gray. Under luma, green is clearly brighter.</p>
      </div>
    </div>
  );
}
