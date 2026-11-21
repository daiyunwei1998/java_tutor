"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { Gray } from "@/lib/viz/image";
import { loadGray } from "@/lib/viz/photos";
import css from "./concepts.module.css";
import { Choice, ConceptBadge, ImgCanvas, NumGrid } from "./shared";

const IMG: Gray = [[10, 120, 200], [60, 130, 250]];
const PRESETS: Record<string, string[]> = {
  sketch: ["darken 20", "threshold 100", "invert"],
  negative: ["invert", "darken 60"],
};

function apply(img: Gray, step: string): Gray {
  const [name, n] = step.split(" ");
  const k = Number(n);
  if (name === "invert") return img.map((row) => row.map((v) => 255 - v));
  if (name === "threshold") return img.map((row) => row.map((v) => (v >= k ? 255 : 0)));
  return img.map((row) => row.map((v) => Math.max(0, v - k)));
}

function history(img: Gray, steps: string[]): Gray[] {
  const frames = [img.map((row) => [...row])];
  steps.forEach((s, k) => frames.push(apply(frames[k], s)));
  return frames;
}

/** PF-205 concept: each step's output is the next step's input, and history keeps every frame in an int[][][]. */
export function PipelineConcept() {
  const [preset, setPreset] = useState<keyof typeof PRESETS>("sketch");
  const [sel, setSel] = useState({ k: 0, r: 0, c: 1 });
  const [photo, setPhoto] = useState<Gray | null>(null);
  useEffect(() => { loadGray("camera", 96).then(setPhoto); }, []);
  const steps = PRESETS[preset];
  const frames = useMemo(() => history(IMG, steps), [steps]);
  const photoFrames = useMemo(() => (photo ? history(photo, steps) : []), [photo, steps]);
  const k = Math.min(sel.k, frames.length - 1);

  return (
    <div>
      <ConceptBadge />
      <Choice<string> label="Preset" value={preset} onChange={(v) => { setPreset(v as keyof typeof PRESETS); setSel({ k: 0, r: 0, c: 1 }); }} options={[{ id: "sketch", label: "darken 20 → threshold 100 → invert" }, { id: "negative", label: "invert → darken 60" }]} />

      <div className={css.section}>
        <h4>1. frames = history(img, steps)</h4>
        <p className="small muted" style={{ marginTop: 0 }}>Click any pixel to follow the same <code>[r][c]</code> through every frame.</p>
        <div className={css.frames}>
          {frames.map((f, i) => (
            <Fragment key={i}>
              {i > 0 && <div className={css.arrow} aria-hidden>→<div className="small">{steps[i - 1]}</div></div>}
              <NumGrid
                values={f}
                caption={i === 0 ? "frames[0] (copy of img)" : `frames[${i}]`}
                marks={(r, c) => (r === sel.r && c === sel.c ? (i === k ? "center" : "window") : undefined)}
                onCell={(r, c) => setSel({ k: i, r, c })}
              />
            </Fragment>
          ))}
        </div>
      </div>

      <div className={css.section}>
        <h4>2. Three indices: which frame, which row, which column</h4>
        <div className={css.calc}>
          <div className={css.formula}>frames[{k}][{sel.r}][{sel.c}] = <strong>{frames[k][sel.r][sel.c]}</strong></div>
          <div className={css.formula}>frames.length = {frames.length} &nbsp;(steps.length + 1) · frames[{k}].length = {frames[k].length} rows · frames[{k}][{sel.r}].length = {frames[k][sel.r].length} columns</div>
          <div className={css.formula}>pixel [{sel.r}][{sel.c}] over time: {frames.map((f) => f[sel.r][sel.c]).join(" → ")}</div>
        </div>
      </div>

      <div className={css.section}>
        <h4>3. The same preset on a photo</h4>
        {photoFrames.length ? (
          <div className={css.strip}>
            {photoFrames.map((f, i) => (
              <div key={i}><ImgCanvas gray={f} label={`frames[${i}]`} /><p className={css.cap}>frames[{i}]{i > 0 ? ` · ${steps[i - 1]}` : ""}</p></div>
            ))}
          </div>
        ) : <p className="muted">Loading the photo…</p>}
      </div>
    </div>
  );
}
