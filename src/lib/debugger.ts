/**
 * Step-through debugger for the student's own code.
 *
 * The browser runner compiles an instrumented copy of the code (runtime-java/src/tutor/Instrument.java) whose
 * recorder (tutor/T.java) returns one snapshot per statement: the call stack with its variables and every
 * array/object reachable from them. This file turns those snapshots into the same TraceStep shape as the
 * Knowledge Space traces (src/lib/trace.ts), adds a plain-English note per step, and answers the stepping
 * questions (next breakpoint, step over, step out) the debugger controls need.
 */
import type { Breakpoint } from "./editor-debug";
import type { DebugRunResult } from "./java-runner";
import type { Frame, HeapObj, TraceStep, Val } from "./trace";

type RawFrame = Frame & { static?: boolean; file?: number; line?: number };
type RawStep = { file: number; line: number; bp?: boolean; outBytes: number; frames: RawFrame[]; heap: HeapObj[] };

export type DebugStep = TraceStep & {
  /** Index into DebugTrace.files; -1 for the final "program finished" step. */
  file: number;
  /** Number of method frames on the stack (static-field frames not counted). */
  depth: number;
  /** Method that is running, e.g. "sum". */
  fn: string;
  /** Paused on a breakpoint whose condition (if any) was true. */
  bp: boolean;
};

export type Breakpoints = Record<string, Breakpoint[]>;

export type DebugTrace = {
  files: string[];
  steps: DebugStep[];
  status: DebugRunResult["status"];
  stdout: string;
  stderr: string;
  reached: boolean;
  stepLimit: boolean;
  maxSteps: number;
};

export const MAX_DEBUG_STEPS = 1000;

/** Breakpoints as the runner expects them: one per line, "fileIndex:line" or "fileIndex:line:condition". */
export function breakpointSpec(files: string[], bps: Breakpoints): string {
  return files
    .flatMap((f, i) => (bps[f] ?? []).map((b) => `${i}:${b.line}${b.cond?.trim() ? ":" + b.cond.replace(/\s+/g, " ").trim() : ""}`))
    .join("\n");
}

export function buildDebugTrace(r: DebugRunResult, files: string[]): DebugTrace {
  const raw = (r.steps ?? []) as RawStep[];
  const bytes = new TextEncoder().encode(r.stdout ?? "");
  const dec = new TextDecoder();
  const outCache = new Map<number, string[]>();
  const outAt = (n: number) => {
    let o = outCache.get(n);
    if (!o) {
      const text = dec.decode(bytes.slice(0, Math.min(n, bytes.length)));
      o = text === "" ? [] : text.replace(/\n$/, "").split("\n");
      outCache.set(n, o);
    }
    return o;
  };

  const steps: DebugStep[] = raw.map((s) => {
    const methods = s.frames.filter((f) => !f.static);
    return {
      line: s.line,
      file: s.file,
      note: "",
      frames: s.frames.map((f) => ({ name: f.name, vars: f.vars })),
      heap: s.heap,
      out: outAt(s.outBytes),
      depth: methods.length,
      fn: methods[methods.length - 1]?.name ?? "",
      bp: !!s.bp,
    };
  });

  // An uncaught exception happens on the last statement that started.
  if (r.status === "runtime_error" && steps.length) {
    const last = steps[steps.length - 1];
    last.error = (r.stderr ?? "").split("\n")[0] || "An exception was thrown.";
  }
  steps.forEach((s, i) => (s.note = describe(steps[i - 1], s, i === steps.length - 1 ? r : undefined)));

  return {
    files,
    steps,
    status: r.status,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    reached: !!r.reached,
    stepLimit: !!r.stepLimit,
    maxSteps: MAX_DEBUG_STEPS,
  };
}

// ---------------------------------------------------------------------------------------------- stepping

/**
 * Next step after i that is paused on a breakpoint (or the last step). Uses what was recorded (conditions were
 * checked while the program ran) plus plain breakpoints set since then.
 */
export function nextBreakpoint(t: DebugTrace, i: number, bps: Breakpoints): number {
  for (let k = i + 1; k < t.steps.length; k++) {
    const s = t.steps[k];
    if (s.bp || (s.file >= 0 && (bps[t.files[s.file]] ?? []).some((b) => b.line === s.line && !b.cond?.trim()))) return k;
  }
  return t.steps.length - 1;
}

/** Runs the current line completely, including any method it calls. */
export function stepOver(t: DebugTrace, i: number): number {
  const d = t.steps[i].depth;
  for (let k = i + 1; k < t.steps.length; k++) if (t.steps[k].depth <= d) return k;
  return t.steps.length - 1;
}

/** Runs until the current method returns to its caller. */
export function stepOut(t: DebugTrace, i: number): number {
  const d = t.steps[i].depth;
  for (let k = i + 1; k < t.steps.length; k++) if (t.steps[k].depth < d) return k;
  return t.steps.length - 1;
}

// ---------------------------------------------------------------------------------------------- notes

const show = (v: Val) => (v.t === "p" ? v.v : v.t === "null" ? "null" : `→ ${v.id}`);

function topVars(s: DebugStep): Map<string, Val> {
  const f = s.frames[s.frames.length - 1];
  return new Map((s.depth > 0 && f ? f.vars : []).map((a) => [a.name, a.v]));
}

function describe(prev: DebugStep | undefined, s: DebugStep, end?: DebugRunResult): string {
  const parts: string[] = [];
  if (s.file < 0) {
    parts.push("**The program finished.** `main` returned, so its frame and local variables are gone.");
  } else if (!prev) {
    parts.push(`Paused in \`${s.fn}\`. The highlighted line **has not run yet**: press **Step** to run it.`);
  } else if (s.depth > prev.depth) {
    parts.push(`Called \`${s.fn}\`: a new frame is pushed on the stack, with its own copies of the parameters.`);
  } else if (s.depth < prev.depth) {
    parts.push(`\`${prev.fn}\` returned, so its frame is removed. Back in \`${s.fn}\`.`);
  }

  if (prev && s.file >= 0 && s.depth === prev.depth) {
    const a = topVars(prev);
    const b = topVars(s);
    const changes: string[] = [];
    b.forEach((v, k) => {
      const old = a.get(k);
      if (!old) changes.push(`\`${k}\` is new: ${show(v)}`);
      else if (JSON.stringify(old) !== JSON.stringify(v)) changes.push(`\`${k}\`: ${show(old)} ⟶ ${show(v)}`);
    });
    a.forEach((_, k) => !b.has(k) && changes.push(`\`${k}\` went out of scope`));
    if (changes.length) parts.push(changes.slice(0, 5).join(" · ") + (changes.length > 5 ? " · …" : ""));
  }

  if (prev) {
    // Name objects after a variable that points to them ("sums[1]" reads better than "#2[1]").
    const names = new Map<string, string>();
    for (let f = s.frames.length - 1; f >= 0; f--) for (const a of s.frames[f].vars) if (a.v.t === "r" && !names.has(a.v.id)) names.set(a.v.id, a.name);
    const nm = (id: string) => names.get(id) ?? id;
    const before = new Map(prev.heap.map((h) => [h.id, h]));
    const cells: string[] = [];
    const created: string[] = [];
    for (const h of s.heap) {
      const o = before.get(h.id);
      if (!o) {
        created.push(`${h.type} ${h.id}${names.has(h.id) ? ` (${names.get(h.id)})` : ""}`);
        continue;
      }
      if (h.kind === "array" && o.kind === "array") {
        h.items.forEach((v, k) => o.items[k] && JSON.stringify(o.items[k]) !== JSON.stringify(v) && cells.push(`${nm(h.id)}[${k}]: ${show(o.items[k])} ⟶ ${show(v)}`));
        if (h.items.length !== o.items.length) cells.push(`${nm(h.id)} now has ${h.length ?? h.items.length} elements`);
      } else if (h.kind === "object" && o.kind === "object") {
        h.fields.forEach((f) => {
          const old = o.fields.find((x) => x.name === f.name);
          if (old && JSON.stringify(old.v) !== JSON.stringify(f.v)) cells.push(`${nm(h.id)}.${f.name}: ${show(old.v)} ⟶ ${show(f.v)}`);
        });
      }
    }
    if (created.length) parts.push(`New on the heap: ${created.slice(0, 3).join(", ")}${created.length > 3 ? ", …" : ""}`);
    if (cells.length) parts.push(`Changed in memory: ${cells.slice(0, 4).join(" · ")}${cells.length > 4 ? " · …" : ""}`);
    if (s.out.length > prev.out.length || (s.out.length && s.out[s.out.length - 1] !== prev.out[prev.out.length - 1])) {
      parts.push("New output below.");
    }
  }

  if (end?.stepLimit) parts.push(`⏸ Recording stopped here after ${MAX_DEBUG_STEPS} steps. To look further on, set a breakpoint later in the code and debug again.`);
  if (s.error) parts.push("💥 This line threw an exception, and nothing catches it, so the program stops here.");
  return parts.join("\n\n");
}
