"use client";

import { useEffect, useState } from "react";

/** Shared play / pause / step / reset / speed controls. `i` is the number of steps applied (0..total). */
export function useStepper(total: number, resetKey: unknown) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  useEffect(() => {
    setI(0);
    setPlaying(false);
  }, [resetKey]);
  useEffect(() => {
    if (!playing) return;
    if (i >= total) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setI((x) => Math.min(total, x + 1)), 700 / speed);
    return () => window.clearTimeout(t);
  }, [playing, i, total, speed]);
  return { i, setI, playing, setPlaying, speed, setSpeed, total };
}

export function StepControls({ s }: { s: ReturnType<typeof useStepper> }) {
  return (
    <div className="step-controls" role="group" aria-label="Playback controls">
      <button className="btn small" onClick={() => { s.setPlaying(false); s.setI(0); }} aria-label="Reset">⏮ Reset</button>
      <button className="btn small" onClick={() => s.setI(Math.max(0, s.i - 1))} disabled={s.i === 0} aria-label="Back">◀ Back</button>
      <button className="btn small primary" onClick={() => { if (s.i >= s.total) s.setI(0); s.setPlaying(!s.playing); }} aria-label={s.playing ? "Pause" : "Play"}>
        {s.playing ? "⏸ Pause" : "▶ Play"}
      </button>
      <button className="btn small" onClick={() => s.setI(Math.min(s.total, s.i + 1))} disabled={s.i >= s.total} aria-label="Step">Step ▶</button>
      <label className="small muted row" style={{ gap: 4 }}>
        Speed
        <select value={s.speed} onChange={(e) => s.setSpeed(Number(e.target.value))} aria-label="Playback speed">
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
      </label>
      <span className="small muted">Step {s.i} / {s.total}</span>
    </div>
  );
}

export function SimBadge() {
  return <span className="pill sim" title="This simulates the example code above in TypeScript; it does not run your Java">Simulation · not your code</span>;
}

export function CodeLines({ lines, on }: { lines: string[]; on: number | null }) {
  return (
    <div className="code-lines" aria-label="Example code">
      {lines.map((l, k) => (
        <div key={k} className={k === on ? "on" : ""} aria-current={k === on ? "step" : undefined}>{l || " "}</div>
      ))}
    </div>
  );
}

export function Vars({ vars, prev }: { vars: Record<string, string | number>; prev?: Record<string, string | number> }) {
  return (
    <div className="vars" aria-label="Variables">
      {Object.entries(vars).map(([k, v]) => (
        <span key={k} className={`var${prev && prev[k] !== v ? " changed" : ""}`}>{k} = {String(v)}</span>
      ))}
    </div>
  );
}
