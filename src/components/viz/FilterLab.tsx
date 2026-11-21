"use client";

import { useEffect, useRef, useState } from "react";
import type { FilterLabId, Ticket } from "@/content/types";
import { runJava } from "@/lib/java-runner";
import { drawGray, fileToGray, type Gray, SAMPLES, toText, validate } from "@/lib/viz/image";
import { drawRgb, fileToRgb, parseAllImgOutputs, RGB_SAMPLES, type Rgb } from "@/lib/viz/rgb";

const SCALE = 9;
const STEP_RE = /^[a-z]+( \d{1,3})?$/;

type Frame = { label: string; img: Gray };

/**
 * Mini Photoshop preview for the PF-2xx filter tickets. Every processed image is computed by the
 * student's Java code, compiled and run in the browser. JavaScript only loads, displays and inspects pixels.
 */
export function FilterLab({ ticket, files, filter }: { ticket: Ticket; files: Record<string, string>; filter: FilterLabId }) {
  const color = filter === "grayscale";
  const [sampleId, setSampleId] = useState(color ? "fruit" : filter === "edges" ? "circle" : filter === "blur" ? "checker" : "smiley");
  const [gray, setGray] = useState<Gray>(() => (SAMPLES[sampleId] ?? SAMPLES.smiley).make());
  const [rgb, setRgb] = useState<Rgb>(() => RGB_SAMPLES.fruit.make());
  const [frames, setFrames] = useState<Frame[]>([]);
  const [shownIdx, setShownIdx] = useState(-1); // -1 = original
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  // filter options
  const [method, setMethod] = useState<"luma" | "average">("luma");
  const [passes, setPasses] = useState(1);
  const [steps, setSteps] = useState("darken 20\nthreshold 100\ninvert");
  const canvas = useRef<HTMLCanvasElement>(null);

  const shown = shownIdx >= 0 ? frames[shownIdx]?.img : null;
  useEffect(() => {
    if (!canvas.current) return;
    if (shown) drawGray(canvas.current, shown, SCALE, hover);
    else if (color) drawRgb(canvas.current, rgb, SCALE);
    else drawGray(canvas.current, gray, SCALE, hover);
  }, [shown, gray, rgb, color, hover]);

  const samples = color ? RGB_SAMPLES : SAMPLES;

  function reset() {
    setFrames([]);
    setShownIdx(-1);
    setIssues([]);
    setErr(null);
  }

  function cellAt(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const k = e.currentTarget.width / rect.width;
    const c = Math.floor(((e.clientX - rect.left) * k) / SCALE);
    const r = Math.floor(((e.clientY - rect.top) * k) / SCALE);
    const ref = shown ?? (color ? rgb.red : gray);
    return r >= 0 && r < ref.length && c >= 0 && c < (ref[r]?.length ?? 0) ? { r, c } : null;
  }

  function stepList(): string[] | string {
    const list = steps.split("\n").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const bad = list.find((s) => !STEP_RE.test(s));
    return bad ? `"${bad}" is not a step. Use one step per line, e.g. "invert", "threshold 128", "darken 40".` : list;
  }

  async function apply(mode?: "horizontal" | "vertical") {
    const id = Date.now();
    const data: { name: string; content: string }[] = [];
    let body = "";
    let labels: string[] = [];
    const read = (name: string, img: Gray) => {
      const file = `${name}-${id}.txt`;
      data.push({ name: file, content: toText(img) });
      return `tutor.Img.read("/files/data/${file}")`;
    };
    if (filter === "grayscale") {
      body = `tutor.Img.write(Grayscale.${method}(${read("red", rgb.red)}, ${read("green", rgb.green)}, ${read("blue", rgb.blue)}));`;
      labels = [`Grayscale.${method}(red, green, blue)`];
    } else if (filter === "flip") {
      const m = mode === "vertical" ? "flipVertical" : "flipHorizontal";
      body = `tutor.Img.write(Flip.${m}(${read("input", gray)}));`;
      labels = [`Flip.${m}(img)`];
    } else if (filter === "blur") {
      body = `int[][] img = ${read("input", gray)};
        for (int i = 0; i < ${passes}; i++) {
            img = Blur.boxBlur(img);
            tutor.Img.write(img);
        }`;
      labels = Array.from({ length: passes }, (_, i) => `boxBlur × ${i + 1}`);
    } else if (filter === "edges") {
      body = `tutor.Img.write(Edges.edges(${read("input", gray)}));`;
      labels = ["Edges.edges(img)"];
    } else {
      const list = stepList();
      if (typeof list === "string") { setErr(list); return; }
      const arr = `new String[]{${list.map((s) => `"${s}"`).join(", ")}}`;
      body = `int[][][] frames = Pipeline.history(${read("input", gray)}, ${arr});
        for (int k = 1; k < frames.length; k++) tutor.Img.write(frames[k]);`;
      labels = list.map((s, i) => `step ${i + 1}: ${s}`);
    }
    const harness = `public class PreviewHarness {
    public static void main(String[] args) throws Exception {
        ${body}
    }
}
`;
    setBusy(true);
    setErr(null);
    setIssues([]);
    const studentFiles = ticket.task.files
      .filter((f) => !f.readOnly || !/Test\.java$/.test(f.path))
      .map((f) => ({ path: f.path, content: files[f.path] ?? f.content }));
    const r = await runJava({
      files: [...studentFiles, { path: "PreviewHarness.java", content: harness }],
      mode: "run",
      mainClass: "PreviewHarness",
      dataFiles: data,
    });
    setBusy(false);
    if (r.status !== "completed") {
      setErr(r.status === "compile_error" ? "Your code has a compile error. Fix it in the editor first." : r.stderr || "The run failed.");
      return;
    }
    const imgs = parseAllImgOutputs(r.stdout);
    if (imgs.length === 0) {
      setErr(filter === "pipeline" ? "No frames came back. Does history() return the input plus one image per step?" : "No output image was found.");
      return;
    }
    if (imgs.some((x) => x === null)) {
      setErr("Your method returned null (or an image with a null row).");
      return;
    }
    const out = imgs as Gray[];
    const input = color ? rgb.red : gray;
    setIssues(filter === "pipeline" || filter === "blur" ? validate(input, out[out.length - 1]) : validate(input, out[0]));
    setFrames(out.map((img, i) => ({ label: labels[i] ?? `frame ${i + 1}`, img })));
    setShownIdx(out.length - 1);
  }

  const val = hover ? (shown ? shown[hover.r]?.[hover.c] : color ? null : gray[hover.r]?.[hover.c]) : undefined;
  const rgbVal = hover && !shown && color ? [rgb.red, rgb.green, rgb.blue].map((ch) => ch[hover.r]?.[hover.c]) : null;
  const dims = shown ?? (color ? rgb.red : gray);

  return (
    <div>
      <div className="row" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        {Object.entries(samples).map(([k, v]) => (
          <button key={k} className={`btn small${k === sampleId ? " primary" : ""}`} onClick={() => {
            setSampleId(k);
            if (color) setRgb((v as { make: () => Rgb }).make());
            else setGray((v as { make: () => Gray }).make());
            reset();
          }}>{v.label}</button>
        ))}
        <label className="btn small">
          📁 Upload image
          <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setSampleId("");
            if (color) setRgb(await fileToRgb(f));
            else setGray(await fileToGray(f));
            reset();
          }} />
        </label>
      </div>

      <canvas
        ref={canvas}
        className="pixel-canvas"
        onPointerMove={(e) => setHover(cellAt(e))}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Image, ${dims.length} rows × ${dims[0]?.length ?? 0} columns`}
      />
      <div className="row small" style={{ justifyContent: "space-between", margin: "4px 0 8px" }}>
        <span>
          {shown ? <span className="pill java">✓ Computed by your Java code · {frames[shownIdx].label}</span> : <span className="pill todo">Original image</span>}
        </span>
        <span className="muted">
          {hover && rgbVal ? `[${hover.r}][${hover.c}] red ${rgbVal[0]}, green ${rgbVal[1]}, blue ${rgbVal[2]}` : hover && val != null ? `img[${hover.r}][${hover.c}] = ${val}` : `${dims.length} × ${dims[0]?.length ?? 0} pixels`}
        </span>
      </div>

      {frames.length > 0 && (
        <div className="row" style={{ flexWrap: "wrap", marginBottom: 8 }} role="tablist" aria-label="Frames">
          <button className={`btn small${shownIdx === -1 ? " primary" : ""}`} onClick={() => setShownIdx(-1)}>Original</button>
          {frames.map((f, i) => (
            <button key={i} className={`btn small${shownIdx === i ? " primary" : ""}`} onClick={() => setShownIdx(i)}>{f.label}</button>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 10 }}>
        {filter === "grayscale" && (
          <div className="row" style={{ marginBottom: 6 }}>
            <span className="small">Method:</span>
            {(["luma", "average"] as const).map((m) => (
              <button key={m} className={`btn small${method === m ? " primary" : ""}`} onClick={() => setMethod(m)}>{m}</button>
            ))}
          </div>
        )}
        {filter === "blur" && (
          <label className="small">Blur passes: <strong>{passes}</strong>
            <input type="range" min={1} max={5} value={passes} onChange={(e) => setPasses(Number(e.target.value))} style={{ width: "100%" }} aria-label="Blur passes" />
          </label>
        )}
        {filter === "pipeline" && (
          <label className="small" style={{ display: "block", marginBottom: 6 }}>Preset steps (one per line)
            <textarea rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} style={{ width: "100%", fontFamily: "var(--mono)" }} spellCheck={false} />
          </label>
        )}
        <div className="row" style={{ marginTop: 6, flexWrap: "wrap" }}>
          {filter === "flip" ? (
            <>
              <button className="btn primary" onClick={() => apply("horizontal")} disabled={busy}>☕ Flip horizontal</button>
              <button className="btn primary" onClick={() => apply("vertical")} disabled={busy}>☕ Flip vertical</button>
            </>
          ) : (
            <button className="btn primary" onClick={() => apply()} disabled={busy}>
              {busy ? "⏳ Your Java code is running…" : `☕ Run my ${ticket.task.mainClass}`}
            </button>
          )}
          <button className="btn" onClick={reset} disabled={!frames.length}>Reset</button>
        </div>
        {busy && filter === "flip" && <div className="small muted" style={{ marginTop: 6 }}>⏳ Your Java code is running…</div>}
        {err && <div className="console err">{err}</div>}
        {issues.map((x) => <div key={x} className="callout warn small">{x}</div>)}
        {frames.length > 0 && !issues.length && !err && <div className="small" style={{ color: "var(--ok)", marginTop: 6 }}>Output size is right and every pixel is within 0–255 👍</div>}
      </div>
      <p className="viz-note">
        The buttons compile and run the <code>{ticket.task.mainClass}</code> you wrote in the editor. If your method is not finished yet, the result may look exactly like the original. That is expected.
      </p>
    </div>
  );
}
