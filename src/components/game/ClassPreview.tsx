"use client";

import type { GameClass } from "@/lib/game/runGame";

const ICON: Record<string, string> = { public: "🌐", private: "🔒", protected: "🛡️", package: "📦" };

function sig(name: string, params: string[]) {
  return `${name}(${params.join(", ")})`;
}

/** UML-style cards of the student's classes, read from the compiled code: fields, constructors, methods, access. */
export function ClassPreview({ classes }: { classes: GameClass[] }) {
  if (classes.length === 0) return <p className="small muted">Run your code to see your classes here.</p>;
  return (
    <div className="cp-grid">
      {classes.map((c) => (
        <div key={c.name} className="cp-card">
          <div className="cp-head">
            <strong>{c.name}</strong>
            {c.extends && <span className="small muted"> extends {c.extends}</span>}
          </div>
          <div className="cp-sec">
            {c.fields.length === 0 && <div className="small muted">no fields</div>}
            {c.fields.map((f) => (
              <div key={f.name} className={`cp-row${f.static ? " static" : ""}`} title={`${f.access}${f.static ? " static" : ""}${f.final ? " final" : ""} ${f.type} ${f.name}`}>
                <span aria-label={f.access}>{ICON[f.access]}</span> {f.static && <span className="cp-tag">static</span>}{f.final && <span className="cp-tag">final</span>}
                {f.name}: <span className="muted">{f.type}</span>
                {f.static && f.value !== null && f.value !== undefined && <span className="muted"> = {String(f.value)}</span>}
              </div>
            ))}
          </div>
          <div className="cp-sec">
            {c.ctors.map((k, i) => (
              <div key={`c${i}`} className="cp-row"><span aria-label={k.access}>{ICON[k.access]}</span> {sig(c.name, k.params)} <span className="cp-tag">constructor</span></div>
            ))}
            {c.methods.map((m, i) => (
              <div key={`m${i}`} className={`cp-row${m.static ? " static" : ""}`} title={`${m.access}${m.static ? " static" : ""} ${m.returns} ${sig(m.name, m.params)}`}>
                <span aria-label={m.access}>{ICON[m.access]}</span> {m.static && <span className="cp-tag">static</span>}
                {sig(m.name, m.params)}: <span className="muted">{m.returns}</span>
                {m.overrides && <span className="cp-tag ov">overrides</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="small muted cp-legend">🌐 public · 🔒 private · static items belong to the class, not to each object</div>
    </div>
  );
}
