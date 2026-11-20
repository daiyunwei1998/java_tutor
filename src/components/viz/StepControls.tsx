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
    <div className="step-controls" role="group" aria-label="播放控制">
      <button className="btn small" onClick={() => { s.setPlaying(false); s.setI(0); }} aria-label="重設">⏮ Reset</button>
      <button className="btn small" onClick={() => s.setI(Math.max(0, s.i - 1))} disabled={s.i === 0} aria-label="上一步">◀ Back</button>
      <button className="btn small primary" onClick={() => { if (s.i >= s.total) s.setI(0); s.setPlaying(!s.playing); }} aria-label={s.playing ? "暫停" : "播放"}>
        {s.playing ? "⏸ Pause" : "▶ Play"}
      </button>
      <button className="btn small" onClick={() => s.setI(Math.min(s.total, s.i + 1))} disabled={s.i >= s.total} aria-label="下一步">Step ▶</button>
      <label className="small muted row" style={{ gap: 4 }}>
        速度
        <select value={s.speed} onChange={(e) => s.setSpeed(Number(e.target.value))} aria-label="播放速度">
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
      </label>
      <span className="small muted">步驟 {s.i} / {s.total}</span>
    </div>
  );
}

export function SimBadge() {
  return <span className="pill sim" title="這是用 TypeScript 模擬上面那段範例程式，不是執行你寫的 Java">模擬示範 · 不是執行你的程式</span>;
}

export function CodeLines({ lines, on }: { lines: string[]; on: number | null }) {
  return (
    <div className="code-lines" aria-label="範例程式碼">
      {lines.map((l, k) => (
        <div key={k} className={k === on ? "on" : ""} aria-current={k === on ? "step" : undefined}>{l || " "}</div>
      ))}
    </div>
  );
}

export function Vars({ vars, prev }: { vars: Record<string, string | number>; prev?: Record<string, string | number> }) {
  return (
    <div className="vars" aria-label="變數">
      {Object.entries(vars).map(([k, v]) => (
        <span key={k} className={`var${prev && prev[k] !== v ? " changed" : ""}`}>{k} = {String(v)}</span>
      ))}
    </div>
  );
}
