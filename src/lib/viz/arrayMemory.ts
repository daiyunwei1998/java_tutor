/**
 * Educational model of Java 2D arrays as objects + references (TypeScript simulation, NOT real JVM state).
 * Addresses are made up for teaching and never claim real JVM placement.
 */
import type { ArrayMemoryPresetId } from "@/content/types";

export type Ref = { var: string; index?: number };
export type Op =
  | { kind: "newOuter"; var: string; len: number }
  | { kind: "newRect"; var: string; rows: number[][] }
  | { kind: "newInner"; target: Ref & { index: number }; values: number[] }
  | { kind: "alias"; var: string; from: string }
  | { kind: "assignRow"; target: Ref & { index: number }; from: Ref & { index: number } }
  | { kind: "write"; var: string; r: number; c: number; value: number };

export type Obj = { id: string; kind: "outer" | "inner"; addr: string; slots: (string | number | null)[] };
export type MemState = { vars: Record<string, string | null>; objects: Record<string, Obj>; order: string[]; error?: string };
export type Preset = { id: ArrayMemoryPresetId; label: string; lines: string[]; ops: Op[]; note: string };

export const PRESETS: Record<ArrayMemoryPresetId, Preset> = {
  jagged: {
    id: "jagged",
    label: "Jagged array",
    lines: ["int[][] a = new int[3][];", "a[0] = new int[]{1, 2, 3};", "a[1] = new int[]{4};", "a[2] = new int[]{5, 6};"],
    ops: [
      { kind: "newOuter", var: "a", len: 3 },
      { kind: "newInner", target: { var: "a", index: 0 }, values: [1, 2, 3] },
      { kind: "newInner", target: { var: "a", index: 1 }, values: [4] },
      { kind: "newInner", target: { var: "a", index: 2 }, values: [5, 6] },
    ],
    note: "每個 inner array 都是獨立的物件，所以長度可以不同。",
  },
  rectangular: {
    id: "rectangular",
    label: "Rectangular",
    lines: ["int[][] a = new int[2][3];", "a[1][2] = 7;"],
    ops: [
      { kind: "newRect", var: "a", rows: [[0, 0, 0], [0, 0, 0]] },
      { kind: "write", var: "a", r: 1, c: 2, value: 7 },
    ],
    note: "new int[2][3] 一次建立 1 個 outer array + 2 個 inner array（共 3 個物件），int 預設值是 0。",
  },
  alias: {
    id: "alias",
    label: "Aliasing (b = a)",
    lines: ["int[][] a = {{1, 2}, {3, 4}};", "int[][] b = a;", "b[0][0] = 9;"],
    ops: [
      { kind: "newRect", var: "a", rows: [[1, 2], [3, 4]] },
      { kind: "alias", var: "b", from: "a" },
      { kind: "write", var: "b", r: 0, c: 0, value: 9 },
    ],
    note: "b = a 只複製參考。a 和 b 指向同一個物件，透過 b 修改，a 也看得到。",
  },
  "shared-row": {
    id: "shared-row",
    label: "共用 row",
    lines: ["int[][] a = {{1, 2}, {3, 4}, {5, 6}};", "a[2] = a[0];", "a[2][1] = 8;"],
    ops: [
      { kind: "newRect", var: "a", rows: [[1, 2], [3, 4], [5, 6]] },
      { kind: "assignRow", target: { var: "a", index: 2 }, from: { var: "a", index: 0 } },
      { kind: "write", var: "a", r: 2, c: 1, value: 8 },
    ],
    note: "a[2] = a[0] 之後兩個 row 指向同一個 inner array。原本的 {5, 6} 沒有人參考了，之後會被 garbage collector 回收。",
  },
  "null-row": {
    id: "null-row",
    label: "null row",
    lines: ["int[][] a = new int[3][];", "a[0] = new int[]{1, 2};", "a[2] = new int[]{3};"],
    ops: [
      { kind: "newOuter", var: "a", len: 3 },
      { kind: "newInner", target: { var: "a", index: 0 }, values: [1, 2] },
      { kind: "newInner", target: { var: "a", index: 2 }, values: [3] },
    ],
    note: "a[1] 從來沒被指定，所以還是 null。讀 a[1].length 或 a[1][0] 會丟出 NullPointerException。",
  },
};

let addrSeed = 0;
function fakeAddr(n: number) {
  // Deterministic, obviously-fake addresses.
  return "@0x" + (0x1a40 + n * 0x60).toString(16).toUpperCase();
}

export function simulate(preset: Preset, steps: number): MemState {
  addrSeed = 0;
  const s: MemState = { vars: {}, objects: {}, order: [] };
  const alloc = (kind: Obj["kind"], slots: Obj["slots"]) => {
    const id = `o${addrSeed}`;
    s.objects[id] = { id, kind, addr: fakeAddr(addrSeed++), slots };
    s.order.push(id);
    return id;
  };
  const outerOf = (v: string) => {
    const id = s.vars[v];
    if (!id) throw new Error(`${v} 是 null`);
    return s.objects[id];
  };
  for (const op of preset.ops.slice(0, steps)) {
    try {
      switch (op.kind) {
        case "newOuter":
          s.vars[op.var] = alloc("outer", Array(op.len).fill(null));
          break;
        case "newRect": {
          const outer = alloc("outer", []);
          s.vars[op.var] = outer;
          s.objects[outer].slots = op.rows.map((r) => alloc("inner", [...r]));
          break;
        }
        case "newInner":
          outerOf(op.target.var).slots[op.target.index] = alloc("inner", [...op.values]);
          break;
        case "alias":
          s.vars[op.var] = s.vars[op.from];
          break;
        case "assignRow":
          outerOf(op.target.var).slots[op.target.index] = outerOf(op.from.var).slots[op.from.index];
          break;
        case "write": {
          const innerId = outerOf(op.var).slots[op.r];
          if (innerId === null || typeof innerId === "number") throw new Error("NullPointerException");
          s.objects[innerId as string].slots[op.c] = op.value;
          break;
        }
      }
    } catch (e) {
      s.error = (e as Error).message;
    }
  }
  return s;
}

/** Objects still reachable from some variable (unreachable ones are shown faded as garbage). */
export function reachable(s: MemState): Set<string> {
  const seen = new Set<string>();
  const visit = (id: string | null) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    const o = s.objects[id];
    if (o.kind === "outer") o.slots.forEach((x) => typeof x === "string" && visit(x));
  };
  Object.values(s.vars).forEach(visit);
  return seen;
}
