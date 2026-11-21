"use client";

/**
 * Client for the in-browser Java runtime (public/java-runner.html, CheerpJ in a hidden iframe).
 * If student code runs too long (e.g. an infinite loop) the iframe is destroyed and recreated.
 */
export type TestResult = { name: string; passed: boolean; message: string };
export type RunResult = {
  status: "completed" | "compile_error" | "runtime_error" | "timeout";
  stdout: string;
  stderr: string;
  tests?: TestResult[];
  compileMs?: number;
  runMs?: number;
};
export type RunnerState = "idle" | "loading" | "ready" | "busy" | "error";

type RunRequest = {
  files: { path: string; content: string }[];
  mode: "run" | "test" | "debug";
  /** Debug mode: "fileIndex:line,..." where recording starts; empty = from the first line of main. */
  breakpoints?: string;
  maxSteps?: number;
  mainClass?: string;
  testClass?: string;
  dataFiles?: { name: string; content: string }[];
  timeoutMs?: number;
};

let iframe: HTMLIFrameElement | null = null;
let readyPromise: Promise<void> | null = null;
let nextId = 1;
let state: RunnerState = "idle";
let lastError = "";
const pending = new Map<number, { resolve: (r: RunResult) => void; timer: number; started: boolean; timeoutMs: number }>();
const stateListeners = new Set<(s: RunnerState, err: string) => void>();
// First load downloads the JVM (~tens of MB, cached afterwards).
const LOAD_TIMEOUT_MS = 180_000;
const COMPILE_TIMEOUT_MS = 120_000;

function setState(s: RunnerState, err = "") {
  state = s;
  lastError = err;
  stateListeners.forEach((l) => l(s, err));
}

export function onRunnerState(l: (s: RunnerState, err: string) => void) {
  stateListeners.add(l);
  l(state, lastError);
  return () => {
    stateListeners.delete(l);
  };
}

function onMessage(ev: MessageEvent) {
  if (ev.origin !== window.location.origin || !ev.data || ev.data.source !== "java-runner") return;
  const msg = ev.data;
  if (msg.type === "started") {
    const p = pending.get(msg.id);
    if (p) {
      // Compiling: generous guard only (the first compile also loads the compiler and JDK classes).
      window.clearTimeout(p.timer);
      p.timer = window.setTimeout(() => killForTimeout(msg.id), COMPILE_TIMEOUT_MS);
    }
  } else if (msg.type === "running") {
    const p = pending.get(msg.id);
    if (p) {
      // The execution time limit starts when student code actually starts running.
      window.clearTimeout(p.timer);
      p.started = true;
      p.timer = window.setTimeout(() => killForTimeout(msg.id), p.timeoutMs);
    }
  } else if (msg.type === "result") {
    const p = pending.get(msg.id);
    if (p) {
      window.clearTimeout(p.timer);
      pending.delete(msg.id);
      p.resolve(msg.result as RunResult);
      if (pending.size === 0) setState("ready");
    }
  }
}

function killForTimeout(id: number) {
  const p = pending.get(id);
  if (!p) return;
  pending.delete(id);
  p.resolve(
    p.started
      ? {
          status: "timeout",
          stdout: "",
          stderr: "The program ran past the time limit and was stopped.\nCommon cause: a loop condition that is always true (infinite loop), e.g. a missing r++ or a condition like r >= 0.",
        }
      : { status: "runtime_error", stdout: "", stderr: "Compiling took too long, so Java was restarted. Please press the button again (the first time is slower on a slow network)." },
  );
  destroy();
  // Fail everything else that was queued behind it.
  for (const [otherId, other] of pending) {
    window.clearTimeout(other.timer);
    other.resolve({ status: "runtime_error", stdout: "", stderr: "Java is restarting. Please press the button again." });
    pending.delete(otherId);
  }
  setState("idle");
}

function destroy() {
  iframe?.remove();
  iframe = null;
  readyPromise = null;
}

export function warmUp(): Promise<void> {
  if (readyPromise) return readyPromise;
  setState("loading");
  readyPromise = new Promise<void>((resolve, reject) => {
    window.addEventListener("message", onMessage);
    const frame = document.createElement("iframe");
    frame.src = "/java-runner.html";
    frame.title = "Java runtime";
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;width:1px;height:1px;left:-10px;top:-10px;border:0;opacity:0;pointer-events:none";
    const timer = window.setTimeout(() => {
      setState("error", "Loading Java timed out. Check your connection and reload the page.");
      reject(new Error("load timeout"));
    }, LOAD_TIMEOUT_MS);
    const handler = (ev: MessageEvent) => {
      if (ev.source !== frame.contentWindow || ev.data?.source !== "java-runner") return;
      if (ev.data.type === "loaded") {
        frame.contentWindow?.postMessage({ target: "java-runner", type: "warmup" }, window.location.origin);
      } else if (ev.data.type === "ready") {
        window.clearTimeout(timer);
        window.removeEventListener("message", handler);
        setState(pending.size ? "busy" : "ready");
        resolve();
      } else if (ev.data.type === "fatal") {
        window.clearTimeout(timer);
        window.removeEventListener("message", handler);
        setState("error", "Java could not start: " + ev.data.error);
        destroy();
        reject(new Error(ev.data.error));
      }
    };
    window.addEventListener("message", handler);
    document.body.appendChild(frame);
    iframe = frame;
  });
  readyPromise.catch(() => {
    readyPromise = null;
  });
  return readyPromise;
}

/** What the step recorder (tutor.T) sends back; see src/lib/debugger.ts. */
export type DebugRunResult = Omit<RunResult, "status"> & {
  status: RunResult["status"] | "unsupported";
  reached?: boolean;
  stepLimit?: boolean;
  steps?: unknown[];
};

export async function debugJava(req: Omit<RunRequest, "mode" | "testClass">): Promise<DebugRunResult> {
  // Recording snapshots makes the program slower, so it gets more time than a normal run.
  return (await runJava({ ...req, mode: "debug", timeoutMs: req.timeoutMs ?? 20_000 })) as DebugRunResult;
}

export async function runJava(req: RunRequest): Promise<RunResult> {
  try {
    await warmUp();
  } catch {
    return { status: "runtime_error", stdout: "", stderr: lastError || "Java could not start." };
  }
  const id = nextId++;
  setState("busy");
  return new Promise<RunResult>((resolve) => {
    const timeoutMs = req.timeoutMs ?? 10_000;
    // Before "started" arrives we only guard against a dead iframe (generous limit).
    const timer = window.setTimeout(() => killForTimeout(id), 120_000);
    pending.set(id, { resolve, timer, started: false, timeoutMs });
    iframe!.contentWindow!.postMessage({ target: "java-runner", type: "run", id, ...req }, window.location.origin);
  });
}

/** Parses ecj diagnostics into { line, message } for editor markers. */
export function parseDiagnostics(text: string): { file: string; line: number; message: string }[] {
  const out: { file: string; line: number; message: string }[] = [];
  const blocks = text.split(/^-{10}$/m);
  for (const b of blocks) {
    const m = b.match(/\d+\. (?:ERROR|WARNING) in (\S+) \(at line (\d+)\)\n[\s\S]*?\n([^\n]+)\s*$/);
    if (m) out.push({ file: m[1].split("/").pop()!, line: Number(m[2]), message: m[3].trim() });
  }
  return out;
}
