"use client";

import { useMemo } from "react";
import { MemoryView } from "@/components/knowledge/TraceViewer";
import { Markdown } from "@/components/Markdown";
import { type Breakpoints, type DebugTrace, nextBreakpoint, stepOut, stepOver } from "@/lib/debugger";
import { heapColumns } from "@/lib/trace";

/**
 * The debugger tab of the output panel. The code itself stays in the editor (the paused line is highlighted
 * there); this panel has the stepping controls, what the step did, the memory picture and the output.
 * Everything was recorded up front, so stepping backwards works too.
 */
export function DebugPanel({
  trace,
  i,
  onStep,
  breakpoints,
  stale,
  onRestart,
  onFromStart,
  onStop,
}: {
  trace: DebugTrace;
  i: number;
  onStep: (i: number) => void;
  breakpoints: Breakpoints;
  /** The code was edited after this trace was recorded. */
  stale: boolean;
  onRestart: () => void;
  onFromStart: () => void;
  onStop: () => void;
}) {
  const steps = trace.steps;
  const last = steps.length - 1;
  const cols = useMemo(() => heapColumns({ code: "", steps }), [steps]);
  const go = (n: number) => onStep(Math.max(0, Math.min(last, n)));

  if (!steps.length) {
    return (
      <div className="debug-panel">
        <div className="debug-head">
          <strong>🐞 Debugger</strong>
          <div className="spacer" />
          <button className="btn small ghost" onClick={onStop}>✕ Close</button>
        </div>
        {trace.status === "unsupported" ? (
          <div className="callout warn">{trace.stderr}</div>
        ) : trace.status === "timeout" ? (
          <div className="callout warn">⏱️ The program ran past the time limit before the debugger could pause. Check for a loop that never ends.</div>
        ) : !trace.reached && trace.status === "runtime_error" ? (
          <div className="callout warn">
            The program crashed with an exception before it reached any of your breakpoints (see below). Debug from the start
            to watch what leads up to it.
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn small primary" onClick={onFromStart}>Debug from the first line of main</button>
            </div>
          </div>
        ) : !trace.reached ? (
          <div className="callout">
            The program finished without reaching any of your breakpoints, so there was nothing to pause on. Is that line
            inside a method that <code>main</code> never calls, or inside an <code>if</code> that was false? If the
            breakpoint has a condition, it may never have been true.
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn small primary" onClick={onFromStart}>Debug from the first line of main</button>
            </div>
          </div>
        ) : (
          <div className="callout warn">{trace.stderr || "The debugger did not record anything."}</div>
        )}
        {trace.stdout && <div className="console">{trace.stdout}</div>}
        {trace.status === "runtime_error" && trace.stderr && <div className="console err">{trace.stderr}</div>}
      </div>
    );
  }

  const step = steps[i];
  const prev = i > 0 ? steps[i - 1] : undefined;
  const file = step.file >= 0 ? trace.files[step.file] : "";
  const hasBps = Object.values(breakpoints).some((l) => l.length > 0);
  const nextBp = nextBreakpoint(trace, i, breakpoints);

  return (
    <div
      className="debug-panel"
      tabIndex={0}
      aria-label="Debugger"
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
      }}
    >
      <div className="debug-bar" role="toolbar" aria-label="Debugger controls">
        <button className="btn small" onClick={() => go(0)} disabled={i === 0} title="Back to where the debugger first paused" aria-label="Back to the first step">⏮</button>
        <button className="btn small" onClick={() => go(i - 1)} disabled={i === 0} title="Undo the last step (←)">◀ Back</button>
        <button className="btn small primary" onClick={() => go(i + 1)} disabled={i === last} title="Run the highlighted line; go into a method it calls (→)">Step ▶</button>
        <button className="btn small" onClick={() => go(stepOver(trace, i))} disabled={i === last} title="Run the highlighted line completely, without stopping inside methods it calls">Step over ⤼</button>
        <button className="btn small" onClick={() => go(stepOut(trace, i))} disabled={i === last || step.depth <= 1} title="Run until this method returns to its caller">Step out ⤴</button>
        <button className="btn small" onClick={() => go(nextBp)} disabled={i === last} title={hasBps ? "Run until the next breakpoint is reached" : "No breakpoints set: runs to the end"}>Continue ⏭</button>
        <input type="range" min={0} max={last} value={i} onChange={(e) => go(Number(e.target.value))} aria-label="Step" className="trace-range" />
        <span className="small muted" aria-live="polite">Step {i + 1} / {steps.length}{trace.stepLimit ? "+" : ""}</span>
        <button className="btn small ghost" onClick={onStop} title="Stop debugging">✕</button>
      </div>

      {stale && (
        <div className="callout warn small debug-stale">
          You changed the code after this run, so the steps below show the old version.{" "}
          <button className="btn small" onClick={onRestart}>🐞 Debug again</button>
        </div>
      )}

      <div className="trace-note debug-note">
        <div className="trace-line-tag">
          {step.file < 0 ? "Finished" : `Paused before line ${step.line}${trace.files.length > 1 ? ` · ${file}` : ""} · in ${step.fn}`}
        </div>
        <Markdown>{step.note}</Markdown>
        {step.error && <div className="callout warn" style={{ marginTop: 8 }}>💥 {step.error}</div>}
      </div>

      <MemoryView step={step} prev={prev} cols={cols} />

      {step.out.length > 0 && (
        <div className="trace-out debug-out" aria-label="Output so far">
          <div className="small muted">Output so far</div>
          {step.out.slice(-40).map((o, k, arr) => (
            <div key={k} className={step.out.length - arr.length + k >= (prev?.out.length ?? 0) ? "hot" : ""}>{o || " "}</div>
          ))}
        </div>
      )}
    </div>
  );
}
