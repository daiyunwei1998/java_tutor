/** Step generators for traversal visualizations (TypeScript simulation of the code shown, not student code). */
import type { TraversalMode } from "@/content/types";

export type TStep = { r: number; c: number; line: number; vars: Record<string, string | number>; access: number };

export const TRAVERSAL_CODE: Record<TraversalMode, string[]> = {
  "row-major": [
    "for (int r = 0; r < m.length; r++) {",
    "    for (int c = 0; c < m[r].length; c++) {",
    "        sum += m[r][c];",
    "    }",
    "}",
  ],
  "column-major": [
    "for (int c = 0; c < m[0].length; c++) {",
    "    for (int r = 0; r < m.length; r++) {",
    "        sum += m[r][c];",
    "    }",
    "}",
  ],
  "enhanced-for": [
    "for (int[] row : m) {",
    "    for (int value : row) {",
    "        sum += value;",
    "    }",
    "}",
  ],
};

export function traversalSteps(mode: TraversalMode, m: number[][]): TStep[] {
  const steps: TStep[] = [];
  const rows = m.length;
  const cols = rows ? m[0].length : 0;
  let sum = 0;
  let access = 0;
  if (mode === "column-major") {
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        sum += m[r][c];
        steps.push({ r, c, line: 2, vars: { c, r, "m[r][c]": m[r][c], sum }, access: ++access });
      }
    }
  } else {
    for (let r = 0; r < rows; r++) {
      if (mode === "enhanced-for") {
        steps.push({ r, c: -1, line: 0, vars: { row: `m[${r}]（參考）`, sum }, access: access });
      }
      for (let c = 0; c < m[r].length; c++) {
        sum += m[r][c];
        const vars: Record<string, string | number> =
          mode === "enhanced-for" ? { row: `m[${r}]（參考）`, value: m[r][c], sum } : { r, c, "m[r][c]": m[r][c], sum };
        steps.push({ r, c, line: 2, vars, access: ++access });
      }
    }
  }
  return steps;
}

/** Hypothetical contiguous storage offset for a rectangular matrix. */
export const offsetOf = (layout: "row" | "col", r: number, c: number, rows: number, cols: number) =>
  layout === "row" ? r * cols + c : c * rows + r;

/**
 * Tiny illustrative cache: holds `lines` cache lines of `lineSize` ints (LRU). Counts misses for a sequence of offsets.
 * Teaching model only — real CPUs and the JVM are far more complex.
 */
export function cacheMisses(offsets: number[], lineSize = 4, lines = 1) {
  const cache: number[] = [];
  let misses = 0;
  const missAt: boolean[] = [];
  for (const off of offsets) {
    const line = Math.floor(off / lineSize);
    const i = cache.indexOf(line);
    if (i === -1) {
      misses++;
      missAt.push(true);
      cache.push(line);
      if (cache.length > lines) cache.shift();
    } else {
      missAt.push(false);
      cache.splice(i, 1);
      cache.push(line);
    }
  }
  return { misses, missAt };
}
