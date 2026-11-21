"use client";

import { useEffect, useRef } from "react";
import type { Gray } from "@/lib/viz/image";
import type { Rgb } from "@/lib/viz/rgb";
import css from "./concepts.module.css";

export type Tint = "red" | "green" | "blue";
export type Box = { r: number; c: number; h?: number; w?: number };

/**
 * Draws a grayscale image, a color image, or one channel (tinted) on a canvas that scales to its container.
 * `marks` are outlined rectangles in pixel coordinates (e.g. the selected pixel or a 3×3 window).
 */
export function ImgCanvas({
  gray, rgb, tint, marks = [], label, onPick, maxWidth,
}: {
  gray?: Gray; rgb?: Rgb; tint?: Tint; marks?: Box[]; label: string;
  onPick?: (p: { r: number; c: number }) => void; maxWidth?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const base = gray ?? rgb?.red ?? [[0]];
  const rows = base.length, cols = base[0]?.length ?? 0;
  const K = 4; // drawing scale so outlines stay crisp
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    cv.width = cols * K;
    cv.height = rows * K;
    const ctx = cv.getContext("2d")!;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let fill: string;
        if (gray) fill = `rgb(${gray[r][c]},${gray[r][c]},${gray[r][c]})`;
        else if (rgb && tint) {
          const v = rgb[tint][r][c];
          fill = tint === "red" ? `rgb(${v},0,0)` : tint === "green" ? `rgb(0,${v},0)` : `rgb(0,0,${v})`;
        } else fill = `rgb(${rgb!.red[r][c]},${rgb!.green[r][c]},${rgb!.blue[r][c]})`;
        ctx.fillStyle = fill;
        ctx.fillRect(c * K, r * K, K, K);
      }
    }
    for (const m of marks) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000";
      ctx.strokeRect(m.c * K - 1, m.r * K - 1, (m.w ?? 1) * K + 2, (m.h ?? 1) * K + 2);
      ctx.strokeStyle = "#ffd23f";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(m.c * K - 2.5, m.r * K - 2.5, (m.w ?? 1) * K + 5, (m.h ?? 1) * K + 5);
    }
  }, [gray, rgb, tint, marks, rows, cols]);

  function pick(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!onPick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * cols);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * rows);
    if (r >= 0 && r < rows && c >= 0 && c < cols) onPick({ r, c });
  }

  return (
    <canvas
      ref={ref}
      className={css.canvas}
      style={{ maxWidth, cursor: onPick ? "crosshair" : "default" }}
      role="img"
      aria-label={label}
      onPointerDown={pick}
      onPointerMove={(e) => { if (e.buttons === 1) pick(e); }}
    />
  );
}

export type CellMark = "center" | "window" | "src" | "dst" | "done" | "ghost" | "dim" | "pair";

/** A small 2D array drawn as numbered cells. Cells can be shaded by their value (like pixels) and marked. */
export function NumGrid({
  values, marks, shade = true, onCell, rowLabels = true, caption, ghostRing = false, cell = 34, cellStyle,
}: {
  values: (number | null)[][];
  marks?: (r: number, c: number) => CellMark | undefined;
  shade?: boolean;
  onCell?: (r: number, c: number) => void;
  rowLabels?: boolean;
  caption?: string;
  /** Draws one ring of non-existent cells around the array (r or c = -1 / length), for bounds-check pictures. */
  ghostRing?: boolean;
  cell?: number;
  /** Extra per-cell style, e.g. to color live cells (used when shade is false). */
  cellStyle?: (r: number, c: number, v: number | null) => React.CSSProperties | undefined;
}) {
  const rows = values.length, cols = values[0]?.length ?? 0;
  const r0 = ghostRing ? -1 : 0, r1 = ghostRing ? rows : rows - 1;
  const c0 = ghostRing ? -1 : 0, c1 = ghostRing ? cols : cols - 1;
  const rr: number[] = [], cc: number[] = [];
  for (let r = r0; r <= r1; r++) rr.push(r);
  for (let c = c0; c <= c1; c++) cc.push(c);
  return (
    <figure className={css.gridFig}>
      {caption && <figcaption className="small muted">{caption}</figcaption>}
      <div
        className={css.grid}
        style={{ gridTemplateColumns: `${rowLabels ? "22px " : ""}repeat(${cc.length}, ${cell}px)`, gridAutoRows: `${Math.round(cell * 0.86)}px` }}
      >
        {rowLabels && <span />}
        {rowLabels && cc.map((c) => <span key={`h${c}`} className={css.head}>{c >= 0 && c < cols ? c : ""}</span>)}
        {rr.map((r) => (
          <Row key={r} r={r} cc={cc} rows={rows} cols={cols} values={values} marks={marks} shade={shade} onCell={onCell} rowLabels={rowLabels} cellStyle={cellStyle} />
        ))}
      </div>
    </figure>
  );
}

function Row({ r, cc, rows, cols, values, marks, shade, onCell, rowLabels, cellStyle }: {
  r: number; cc: number[]; rows: number; cols: number; values: (number | null)[][];
  marks?: (r: number, c: number) => CellMark | undefined; shade: boolean; onCell?: (r: number, c: number) => void; rowLabels: boolean;
  cellStyle?: (r: number, c: number, v: number | null) => React.CSSProperties | undefined;
}) {
  return (
    <>
      {rowLabels && <span className={css.head}>{r >= 0 && r < rows ? r : ""}</span>}
      {cc.map((c) => {
        const inside = r >= 0 && r < rows && c >= 0 && c < cols;
        const m = marks?.(r, c);
        if (!inside) {
          return <span key={c} className={`${css.cell} ${m === "ghost" ? css.ghost : css.void}`}>{m === "ghost" ? "✕" : ""}</span>;
        }
        const v = values[r][c];
        const style = shade && v !== null ? { background: `rgb(${v},${v},${v})`, color: v > 140 ? "#1c1e21" : "#f4f1ea" } : cellStyle?.(r, c, v);
        return (
          <button
            key={c}
            type="button"
            className={`${css.cell}${m ? " " + css[m] : ""}${v === null ? " " + css.empty : ""}`}
            style={style}
            onClick={onCell ? () => onCell(r, c) : undefined}
            tabIndex={onCell ? 0 : -1}
            aria-label={`[${r}][${c}] = ${v ?? "not computed yet"}`}
          >
            {v ?? "?"}
          </button>
        );
      })}
    </>
  );
}

/** Button row for choosing a sample. */
export function Choice<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="row" role="group" aria-label={label} style={{ flexWrap: "wrap", gap: 6, margin: "6px 0" }}>
      {options.map((o) => (
        <button key={o.id} className={`btn small${o.id === value ? " primary" : ""}`} aria-pressed={o.id === value} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

export function ConceptBadge() {
  return <span className="pill sim" title="Computed by this page to explain the idea. Your Java code is not used here.">Concept demo · not your code</span>;
}
