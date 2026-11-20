"use client";

import { useEffect, useRef, useState } from "react";
import type { Ticket } from "@/content/types";
import { runJava } from "@/lib/java-runner";
import { drawGray, fileToGray, type Gray, parseImgOutput, SAMPLES, toText, validate } from "@/lib/viz/image";

const SCALE = 9;

/**
 * Mini Photoshop preview. The processed image is ALWAYS computed by the student's Java code
 * (compiled + run in the browser). JavaScript only loads, displays and inspects pixels.
 */
export function ImageLab({ ticket, files }: { ticket: Ticket; files: Record<string, string> }) {
  const [sampleId, setSampleId] = useState("smiley");
  const [src, setSrc] = useState<Gray>(() => SAMPLES.smiley.make());
  const [out, setOut] = useState<Gray | null>(null);
  const [outFor, setOutFor] = useState<string>("");
  const [showAfter, setShowAfter] = useState(true);
  const [delta, setDelta] = useState(40);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [picked, setPicked] = useState<{ r: number; c: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);

  const shown = out && showAfter ? out : src;
  useEffect(() => {
    if (canvas.current) drawGray(canvas.current, shown, SCALE, picked ?? hover);
  }, [shown, hover, picked]);

  function cellAt(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const k = e.currentTarget.width / rect.width;
    const c = Math.floor(((e.clientX - rect.left) * k) / SCALE);
    const r = Math.floor(((e.clientY - rect.top) * k) / SCALE);
    return r >= 0 && r < shown.length && c >= 0 && c < (shown[r]?.length ?? 0) ? { r, c } : null;
  }

  function setSource(img: Gray) {
    setSrc(img);
    setOut(null);
    setIssues([]);
    setErr(null);
    setPicked(null);
  }

  async function apply() {
    setBusy(true);
    setErr(null);
    setIssues([]);
    const id = Date.now();
    const dataName = `input-${id}.txt`;
    const harness = `public class PreviewHarness {
    public static void main(String[] args) throws Exception {
        int[][] img = tutor.Img.read("/files/data/${dataName}");
        tutor.Img.write(Filters.brighten(img, ${Math.round(delta)}));
    }
}
`;
    const studentFiles = ticket.task.files.filter((f) => !f.readOnly).map((f) => ({ path: f.path, content: files[f.path] ?? f.content }));
    const r = await runJava({
      files: [...studentFiles, { path: "PreviewHarness.java", content: harness }],
      mode: "run",
      mainClass: "PreviewHarness",
      dataFiles: [{ name: dataName, content: toText(src) }],
    });
    setBusy(false);
    if (r.status !== "completed") {
      setErr(r.status === "compile_error" ? "Your code has a compile error. Fix it in the editor first." : r.stderr || "Run failed");
      return;
    }
    const parsed = parseImgOutput(r.stdout);
    if (!parsed.img) {
      setErr(parsed.error ?? "No output");
      return;
    }
    setIssues(validate(src, parsed.img));
    setOut(parsed.img);
    setOutFor(`brighten(img, ${Math.round(delta)})`);
    setShowAfter(true);
  }

  function exportPng() {
    const cv = document.createElement("canvas");
    drawGray(cv, shown, 1);
    const a = document.createElement("a");
    a.href = cv.toDataURL("image/png");
    a.download = out && showAfter ? "pixelforge-output.png" : "pixelforge-input.png";
    a.click();
  }

  const info = picked ?? hover;
  const val = info ? shown[info.r]?.[info.c] : undefined;

  return (
    <div>
      <div className="row" style={{ marginBottom: 8 }}>
        {Object.entries(SAMPLES).map(([k, v]) => (
          <button key={k} className={`btn small${k === sampleId ? " primary" : ""}`} onClick={() => { setSampleId(k); setSource(v.make()); }}>{v.label}</button>
        ))}
        <label className="btn small">
          📁 Upload image
          <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) { setSampleId(""); setSource(await fileToGray(f)); }
          }} />
        </label>
      </div>

      <canvas
        ref={canvas}
        className="pixel-canvas"
        onPointerMove={(e) => setHover(cellAt(e))}
        onPointerLeave={() => setHover(null)}
        onClick={(e) => setPicked(cellAt(e))}
        role="img"
        aria-label={`Grayscale image, ${shown.length} rows × ${shown[0]?.length ?? 0} columns`}
      />
      <div className="row small" style={{ justifyContent: "space-between", margin: "4px 0 8px" }}>
        <span>
          {out && showAfter ? <span className="pill java">✓ Computed by your Java code · {outFor}</span> : <span className="pill todo">Original</span>}
        </span>
        <span className="muted">{shown.length} × {shown[0]?.length ?? 0} pixels</span>
      </div>

      <div className="card" style={{ padding: 10 }}>
        <strong className="small">🔍 Pixel inspector</strong>
        {info && val !== undefined ? (
          <div className="small">
            <code>img[{info.r}][{info.c}] = {val}</code>
            <span className="muted"> · row {info.r}, col {info.c}{picked ? " (selected; click elsewhere to pick another)" : ""}</span>
            {picked && !(out && showAfter) && (
              <div className="row" style={{ marginTop: 6 }}>
                <label className="small">Set to
                  <input type="number" min={0} max={255} value={val} style={{ width: 80, marginLeft: 6 }} onChange={(e) => {
                    const v = Math.max(0, Math.min(255, Number(e.target.value) || 0));
                    setSource(src.map((row, r) => row.map((x, c) => (r === picked.r && c === picked.c ? v : x))));
                    setPicked(picked);
                  }} />
                </label>
              </div>
            )}
          </div>
        ) : (
          <div className="small muted">Hover over the image to see coordinates and brightness; click to select a pixel and change it in the original.</div>
        )}
      </div>

      <div className="card" style={{ padding: 10, marginTop: 10 }}>
        <label className="small">Brightness delta: <strong>{delta > 0 ? "+" : ""}{delta}</strong>
          <input type="range" min={-120} max={120} value={delta} onChange={(e) => setDelta(Number(e.target.value))} style={{ width: "100%" }} aria-label="Brightness delta" />
        </label>
        <div className="row" style={{ marginTop: 6 }}>
          <button className="btn primary" onClick={apply} disabled={busy}>{busy ? "⏳ Your Java is working…" : "☕ Apply brighten with my Java"}</button>
          <button className="btn" onClick={() => setShowAfter((x) => !x)} disabled={!out}>{showAfter ? "Show before" : "Show after"}</button>
          <button className="btn" onClick={() => { setOut(null); setIssues([]); }} disabled={!out}>Reset</button>
          <button className="btn" onClick={exportPng}>⬇ Export PNG</button>
        </div>
        {err && <div className="console err">{err}</div>}
        {issues.map((x) => <div key={x} className="callout warn small">{x}</div>)}
        {out && !issues.length && !err && <div className="small" style={{ color: "var(--ok)", marginTop: 6 }}>Output size is correct and every pixel is within 0–255 👍</div>}
      </div>
      <p className="viz-note">"Apply with my Java" compiles and runs the <code>Filters.brighten</code> you wrote in the editor. If your method isn't finished yet, the result looks like the original, which is expected.</p>
    </div>
  );
}
