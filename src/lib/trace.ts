/**
 * Code ↔ memory traces for the Knowledge Space.
 *
 * A trace is a list of snapshots, one per executed line: which line ran, a short explanation, the stack
 * frames (variables) and the heap (arrays and objects). The viewer draws the code next to the memory and
 * highlights what changed. Nothing here is Java-specific except the wording, so later sprints can trace
 * ArrayLists, linked nodes, recursion frames, etc. with the same builder.
 */

export type Val = { t: "p"; v: string } | { t: "r"; id: string } | { t: "null" };

export type HeapObj =
  | { id: string; kind: "array"; type: string; items: Val[] }
  | { id: string; kind: "object"; type: string; fields: { name: string; v: Val }[] };

export type Frame = { name: string; vars: { name: string; v: Val }[] };

export type Ask = { q: string; options: string[]; answer: number; explain: string };

export type TraceStep = {
  /** 1-based line that just ran; 0 = before the program starts. */
  line: number;
  /** What this line did, in markdown. */
  note: string;
  frames: Frame[];
  heap: HeapObj[];
  out: string[];
  ask?: Ask;
  error?: string;
};

export type Trace = { code: string; steps: TraceStep[] };

export class Ref {
  constructor(public readonly id: string) {}
}

type In = number | string | boolean | null | Ref;

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** Small builder: mutate the model like the program would, call step() after each line. */
export class Tracer {
  private frames: Frame[] = [];
  private heap: HeapObj[] = [];
  private out: string[] = [];
  private next = 1;
  private readonly steps: TraceStep[] = [];

  constructor(private readonly code: string) {}

  private val(x: In): Val {
    if (x === null) return { t: "null" };
    if (x instanceof Ref) return { t: "r", id: x.id };
    return { t: "p", v: String(x) };
  }

  private obj(r: Ref): HeapObj {
    const o = this.heap.find((h) => h.id === r.id);
    if (!o) throw new Error(`no object ${r.id}`);
    return o;
  }

  /** Enters a method: pushes a frame. */
  call(name: string, args: Record<string, In> = {}) {
    this.frames.push({ name, vars: Object.entries(args).map(([n, v]) => ({ name: n, v: this.val(v) })) });
    return this;
  }

  /** Leaves the current method: its frame (and local variables) disappear. */
  ret() {
    this.frames.pop();
    return this;
  }

  /** Declares or assigns a local variable in the current frame. */
  set(name: string, x: In) {
    const f = this.frames[this.frames.length - 1];
    const v = f.vars.find((a) => a.name === name);
    if (v) v.v = this.val(x);
    else f.vars.push({ name, v: this.val(x) });
    return this;
  }

  /** Removes a local variable (e.g. loop variable going out of scope). */
  unset(name: string) {
    const f = this.frames[this.frames.length - 1];
    f.vars = f.vars.filter((a) => a.name !== name);
    return this;
  }

  newArray(type: string, items: In[]): Ref {
    const id = `#${this.next++}`;
    this.heap.push({ id, kind: "array", type, items: items.map((x) => this.val(x)) });
    return new Ref(id);
  }

  newObject(type: string, fields: Record<string, In>): Ref {
    const id = `#${this.next++}`;
    this.heap.push({ id, kind: "object", type, fields: Object.entries(fields).map(([name, v]) => ({ name, v: this.val(v) })) });
    return new Ref(id);
  }

  setItem(r: Ref, i: number, x: In) {
    const o = this.obj(r);
    if (o.kind !== "array") throw new Error("not an array");
    o.items[i] = this.val(x);
    return this;
  }

  setField(r: Ref, name: string, x: In) {
    const o = this.obj(r);
    if (o.kind !== "object") throw new Error("not an object");
    o.fields.find((f) => f.name === name)!.v = this.val(x);
    return this;
  }

  /** Drops unreachable objects (what the garbage collector would eventually do). */
  collect() {
    const live = reachable(this.frames, this.heap);
    this.heap = this.heap.filter((h) => live.has(h.id));
    return this;
  }

  print(line: string) {
    this.out.push(line);
    return this;
  }

  step(line: number, note: string, extra: { ask?: Ask; error?: string } = {}) {
    this.steps.push({ line, note, frames: clone(this.frames), heap: clone(this.heap), out: [...this.out], ...extra });
    return this;
  }

  build(): Trace {
    return { code: this.code.replace(/^\n/, "").replace(/\s+$/, ""), steps: this.steps };
  }
}

/** Ids of heap objects reachable from any variable. */
export function reachable(frames: Frame[], heap: HeapObj[]): Set<string> {
  const byId = new Map(heap.map((h) => [h.id, h]));
  const seen = new Set<string>();
  const stack: string[] = [];
  const visit = (v: Val) => {
    if (v.t === "r" && !seen.has(v.id)) {
      seen.add(v.id);
      stack.push(v.id);
    }
  };
  frames.forEach((f) => f.vars.forEach((a) => visit(a.v)));
  while (stack.length) {
    const o = byId.get(stack.pop()!);
    if (!o) continue;
    if (o.kind === "array") o.items.forEach(visit);
    else o.fields.forEach((f) => visit(f.v));
  }
  return seen;
}

/**
 * One stable layout for the whole trace: heap objects go into columns by their distance from the
 * variables (outer array → rows → …), in creation order, so nothing jumps around between steps.
 */
export function heapColumns(trace: Trace): string[][] {
  const depth = new Map<string, number>();
  const order: string[] = [];
  for (const s of trace.steps) {
    const byId = new Map(s.heap.map((h) => [h.id, h]));
    s.heap.forEach((h) => !order.includes(h.id) && order.push(h.id));
    let frontier = s.frames.flatMap((f) => f.vars.map((a) => a.v)).filter((v) => v.t === "r").map((v) => (v as { id: string }).id);
    const seen = new Set<string>();
    for (let d = 0; frontier.length; d++) {
      const next: string[] = [];
      for (const id of frontier) {
        if (seen.has(id)) continue;
        seen.add(id);
        depth.set(id, Math.min(depth.get(id) ?? Infinity, d));
        const o = byId.get(id);
        const vals = o ? (o.kind === "array" ? o.items : o.fields.map((f) => f.v)) : [];
        vals.forEach((v) => v.t === "r" && next.push(v.id));
      }
      frontier = next;
    }
  }
  const cols: string[][] = [];
  for (const id of order) {
    const d = depth.get(id) ?? 0;
    (cols[d] ??= []).push(id);
  }
  return cols.filter(Boolean);
}
