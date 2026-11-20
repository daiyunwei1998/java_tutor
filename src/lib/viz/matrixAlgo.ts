/** Step generators for the matrix algorithm visualizer (TypeScript simulation). */
import type { MatrixAlgorithmId } from "@/content/types";

export type AStep = {
  cells: [number, number][]; // cells read in this step
  line: number;
  vars: Record<string, number | string>;
  reads: number; // cumulative array reads
  out?: { r: number; c: number; value: number }; // transpose output write
  outVec?: { i: number; value: number }; // row/column sum output
};

export type Algo = { id: MatrixAlgorithmId; label: string; code: string[]; time: string; space: string; why: string };

export const ALGOS: Record<MatrixAlgorithmId, Algo> = {
  "row-sum": {
    id: "row-sum", label: "每列總和 (row sum)",
    code: ["int[] sums = new int[m.length];", "for (int r = 0; r < m.length; r++)", "    for (int c = 0; c < m[r].length; c++)", "        sums[r] += m[r][c];"],
    time: "O(R·C)", space: "O(R)", why: "每一格都要讀一次；結果陣列有 R 格。",
  },
  "column-sum": {
    id: "column-sum", label: "每欄總和 (column sum)",
    code: ["int[] sums = new int[m[0].length];", "for (int c = 0; c < m[0].length; c++)", "    for (int r = 0; r < m.length; r++)", "        sums[c] += m[r][c];"],
    time: "O(R·C)", space: "O(C)", why: "每一格都要讀一次；結果陣列有 C 格。",
  },
  "main-diagonal": {
    id: "main-diagonal", label: "主對角線",
    code: ["int sum = 0;", "for (int i = 0; i < m.length; i++)", "    sum += m[i][i];"],
    time: "O(N)", space: "O(1)", why: "只讀 N 格，不需要掃描整個矩陣。",
  },
  "anti-diagonal": {
    id: "anti-diagonal", label: "副對角線",
    code: ["int sum = 0;", "int n = m.length;", "for (int i = 0; i < n; i++)", "    sum += m[i][n - 1 - i];"],
    time: "O(N)", space: "O(1)", why: "只讀 N 格。",
  },
  max: {
    id: "max", label: "最大值",
    code: ["int max = m[0][0];", "for (int r = 0; r < m.length; r++)", "    for (int c = 0; c < m[r].length; c++)", "        if (m[r][c] > max) max = m[r][c];"],
    time: "O(R·C)", space: "O(1)", why: "最大值可能在任何一格，所以每格都要看。",
  },
  transpose: {
    id: "transpose", label: "轉置 (transpose)",
    code: ["int[][] t = new int[m[0].length][m.length];", "for (int r = 0; r < m.length; r++)", "    for (int c = 0; c < m[0].length; c++)", "        t[c][r] = m[r][c];"],
    time: "O(R·C)", space: "O(R·C)", why: "每格複製一次；結果是新的 C×R 陣列。",
  },
};

export function algoSteps(id: MatrixAlgorithmId, m: number[][]): AStep[] {
  const R = m.length, C = m[0].length;
  const steps: AStep[] = [];
  let reads = 0;
  switch (id) {
    case "row-sum": {
      const sums = Array(R).fill(0);
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        sums[r] += m[r][c];
        steps.push({ cells: [[r, c]], line: 3, vars: { r, c, [`sums[${r}]`]: sums[r] }, reads: ++reads, outVec: { i: r, value: sums[r] } });
      }
      break;
    }
    case "column-sum": {
      const sums = Array(C).fill(0);
      for (let c = 0; c < C; c++) for (let r = 0; r < R; r++) {
        sums[c] += m[r][c];
        steps.push({ cells: [[r, c]], line: 3, vars: { c, r, [`sums[${c}]`]: sums[c] }, reads: ++reads, outVec: { i: c, value: sums[c] } });
      }
      break;
    }
    case "main-diagonal": {
      let sum = 0;
      for (let i = 0; i < Math.min(R, C); i++) {
        sum += m[i][i];
        steps.push({ cells: [[i, i]], line: 2, vars: { i, sum }, reads: ++reads });
      }
      break;
    }
    case "anti-diagonal": {
      let sum = 0;
      const n = Math.min(R, C);
      for (let i = 0; i < n; i++) {
        sum += m[i][n - 1 - i];
        steps.push({ cells: [[i, n - 1 - i]], line: 3, vars: { i, "n - 1 - i": n - 1 - i, sum }, reads: ++reads });
      }
      break;
    }
    case "max": {
      let max = m[0][0];
      reads++;
      steps.push({ cells: [[0, 0]], line: 0, vars: { max }, reads });
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        if (m[r][c] > max) max = m[r][c];
        steps.push({ cells: [[r, c]], line: 3, vars: { r, c, max }, reads: ++reads });
      }
      break;
    }
    case "transpose": {
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        steps.push({ cells: [[r, c]], line: 3, vars: { r, c, [`t[${c}][${r}]`]: m[r][c] }, reads: ++reads, out: { r: c, c: r, value: m[r][c] } });
      }
      break;
    }
  }
  return steps;
}
