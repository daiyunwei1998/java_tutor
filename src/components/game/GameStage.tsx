"use client";

import { useEffect, useMemo, useState } from "react";
import type { Ticket } from "@/content/types";
import { actionLine, readProp, runGame, type GameMethod, type GameObject, type GameRun, type GameState } from "@/lib/game/runGame";
import { ClassPreview } from "./ClassPreview";
import { Sprite } from "./Sprite";

const NUMERIC = new Set(["int", "long", "short", "double", "float", "Integer", "Double"]);

/** Display name of an object: its readable name field, or the class name if the name cannot be read. */
function label(o: GameObject, i: number) {
  const n = readProp(o, "name");
  return typeof n === "string" && n ? n : `${o?.cls ?? "null"} #${i}`;
}

/** Public instance methods of an object, subclass first, without duplicates (an override hides the inherited one). */
function methodsOf(state: GameState, o: GameObject): GameMethod[] {
  if (!o) return [];
  const seen = new Set<string>();
  const out: GameMethod[] = [];
  for (const cname of o.chain) {
    const c = state.classes.find((k) => k.name === cname);
    for (const m of c?.methods ?? []) {
      const key = `${m.name}(${m.params.join(",")})`;
      if (m.access !== "public" || m.static || seen.has(key)) continue;
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}

/**
 * Pixel Arena: shows the objects the ticket's Arena.setup() creates, drawn as 8-bit characters, and turns the
 * student's public methods into buttons. Every click re-runs the student's real Java (nothing is simulated).
 */
export function GameStage({ ticket, files }: { ticket: Ticket; files: Record<string, string> }) {
  const [actions, setActions] = useState<string[]>([]);
  const [run, setRun] = useState<GameRun | null>(null);
  const [busy, setBusy] = useState(false);
  const [ranCode, setRanCode] = useState<string | null>(null);
  const [sel, setSel] = useState(0);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [maxSeen, setMaxSeen] = useState<Record<number, number>>({});
  const codeKey = JSON.stringify(files);
  const stale = ranCode !== null && ranCode !== codeKey;

  async function go(next: string[]) {
    setBusy(true);
    const r = await runGame(ticket, files, next);
    setBusy(false);
    setRun(r);
    setRanCode(codeKey);
    if (r.kind === "ok") {
      setActions(next);
      // Without a readable maxHp, the first hp we can read is used as 100% of the bar.
      setMaxSeen((m) => {
        const c = { ...m };
        r.state.objects.forEach((o, i) => {
          const hp = readProp(o, "hp");
          if (typeof hp === "number" && (c[i] === undefined || hp > c[i])) c[i] = hp;
        });
        return c;
      });
    }
  }

  // Build the world once when the ticket opens.
  useEffect(() => {
    setActions([]);
    setRun(null);
    setMaxSeen({});
    setSel(0);
    go([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  const state = run?.kind === "ok" ? run.state : null;
  const last = state?.results[state.results.length - 1];
  const lastActor = last ? Number(last.action.split("|")[0]) : -1;
  const obj = state?.objects[sel] ?? null;
  const methods = useMemo(() => (state ? methodsOf(state, obj) : []), [state, obj]);
  const statics = (state?.classes ?? []).flatMap((c) => [
    ...c.fields.filter((f) => f.static && f.access === "public" && f.value !== null).map((f) => ({ k: `${c.name}.${f.name}`, v: f.value })),
    ...c.methods.filter((m) => m.static && m.staticValue !== null && m.staticValue !== undefined).map((m) => ({ k: `${c.name}.${m.name}()`, v: m.staticValue })),
  ]);

  const inp = (k: string, d: string) => inputs[k] ?? d;
  const setInp = (k: string, v: string) => setInputs((x) => ({ ...x, [k]: v }));

  function argFor(type: string, key: string): string | null {
    const v = inp(key, NUMERIC.has(type) ? "10" : type === "boolean" ? "true" : type === "String" ? "" : "");
    if (NUMERIC.has(type)) return Number.isFinite(Number(v)) && v.trim() !== "" ? `${type === "double" || type === "float" || type === "Double" ? "d" : "i"}:${v.trim()}` : null;
    if (type === "boolean") return `b:${v}`;
    if (type === "String") return `s:${v}`;
    const idx = v === "" ? (state?.objects.findIndex((o, i) => i !== sel && o?.chain.includes(type)) ?? -1) : Number(v);
    return idx >= 0 ? `o:${idx}` : null;
  }

  function call(m: GameMethod) {
    const key = `${m.name}(${m.params.join(",")})`;
    const args: string[] = [];
    for (let i = 0; i < m.params.length; i++) {
      const a = argFor(m.params[i], `${key}#${i}`);
      if (a === null) return;
      args.push(a);
    }
    go([...actions, actionLine(sel, "call", m.name, args)]);
  }

  return (
    <div className="game">
      <div className="game-bar">
        <strong>🎮 Pixel Arena</strong>
        <button className="btn small primary" onClick={() => go([])} disabled={busy}>{run ? "⟳ Rebuild from my code" : "▶ Run my code"}</button>
        {actions.length > 0 && <button className="btn small ghost" onClick={() => go([])} disabled={busy}>Reset world</button>}
        {busy && <span className="small muted">☕ your Java is running…</span>}
        {stale && !busy && <span className="small" style={{ color: "var(--warn)" }}>Code changed: rebuild to see it</span>}
        <span className="spacer" />
        {statics.map((s) => <span key={s.k} className="pill" title="a static value: it belongs to the class">{s.k} = {String(s.v)}</span>)}
      </div>

      {run?.kind === "compile_error" && (
        <div className="callout warn">
          <strong>Your code does not compile yet</strong>, so the game cannot build your classes. Fix the error shown under the editor (Run main), then rebuild.
          <pre className="wm-msg" style={{ maxHeight: 120, overflow: "auto" }}>{run.message.split("\n").slice(0, 8).join("\n")}</pre>
        </div>
      )}
      {run?.kind === "error" && <div className="callout warn">{run.message}</div>}
      {state?.setupError && <div className="callout warn">Creating the characters failed: {state.setupError}</div>}

      <div className="game-stage" aria-label="Game stage">
        {state?.objects.map((o, i) => {
          if (!o) return <div key={i} className="game-char empty">null</div>;
          const hp = readProp(o, "hp");
          const maxHp = readProp(o, "maxHp");
          const max = typeof maxHp === "number" ? maxHp : maxSeen[i];
          const level = readProp(o, "level");
          const hpProp = o.props.find((p) => p.name === "hp");
          const bubble = lastActor === i && last?.out.trim() ? last.out.trim().split("\n").slice(-2).join("\n") : null;
          return (
            <button key={i} className={`game-char${sel === i ? " sel" : ""}`} onClick={() => setSel(i)} aria-pressed={sel === i} aria-label={`${label(o, i)}, ${o.cls}`}>
              {bubble && <span className="game-bubble">{bubble}</span>}
              <Sprite chain={o.chain} size={6} flip={i % 2 === 1} hurt={typeof hp === "number" && hp <= 0} />
              <span className="game-name">{label(o, i)}</span>
              <span className="small muted">{o.cls}{typeof level === "number" ? ` · Lv ${level}` : ""}</span>
              {hpProp && (typeof hp === "number" ? (
                <span className="game-hp" title={`hp read via ${hpProp.via}`}>
                  <span style={{ width: `${max ? Math.max(0, Math.min(100, (hp / max) * 100)) : 100}%` }} />
                  <em>{hp}{typeof maxHp === "number" ? `/${maxHp}` : ""} HP</em>
                </span>
              ) : (
                <span className="small" title="hp is private and there is no public getHp(), so the game (outside code) cannot read it">HP 🔒 ?</span>
              ))}
            </button>
          );
        })}
        {!state && !busy && !run && <p className="small muted">Press ▶ Run my code.</p>}
      </div>

      {last && (
        <div className={`game-result ${last.ok ? "ok" : "bad"}`} role="status">
          {last.ok ? "✓ " : "✗ "}
          <code>{describeAction(last.action, state)}</code>
          {last.ok && last.result != null && <> returned <strong>{last.result}</strong></>}
          {!last.ok && <> · {last.error}</>}
        </div>
      )}

      {obj && state && (
        <div className="game-actions">
          <div className="wm-label">{label(obj, sel)} · what outside code can do with this object</div>
          <div className="game-methods">
            {methods.length === 0 && <span className="small muted">No public methods yet. Write one and rebuild: it will show up here as a button.</span>}
            {methods.map((m) => {
              const key = `${m.name}(${m.params.join(",")})`;
              return (
                <span key={key} className="game-method">
                  <button className="btn small" onClick={() => call(m)} disabled={busy}>{m.name}(</button>
                  {m.params.map((p, i) =>
                    NUMERIC.has(p) || p === "String" ? (
                      <input key={i} className="wm-input" style={{ width: p === "String" ? 110 : 56 }} value={inp(`${key}#${i}`, NUMERIC.has(p) ? "10" : "")} onChange={(e) => setInp(`${key}#${i}`, e.target.value)} aria-label={`${m.name} argument ${i + 1} (${p})`} placeholder={p} />
                    ) : p === "boolean" ? (
                      <select key={i} className="wm-input" value={inp(`${key}#${i}`, "true")} onChange={(e) => setInp(`${key}#${i}`, e.target.value)}><option>true</option><option>false</option></select>
                    ) : (
                      <select key={i} className="wm-input" value={inp(`${key}#${i}`, "")} onChange={(e) => setInp(`${key}#${i}`, e.target.value)} aria-label={`${m.name} target`}>
                        <option value="">{p}…</option>
                        {state.objects.map((o, j) => (o && o.chain.includes(p) ? <option key={j} value={j}>{label(o, j)}</option> : null))}
                      </select>
                    ),
                  )}
                  <span className="small">)</span>
                </span>
              );
            })}
          </div>
          <div className="game-fields">
            {obj.props.map((p) => (
              <div key={p.name} className="game-field">
                <span>{p.access === "public" ? "🌐" : "🔒"} {p.name}</span>
                <span className="muted small">{p.readable ? `= ${JSON.stringify(p.value)}${p.via && p.via !== "field" ? ` (via ${p.via})` : ""}` : "can't read"}</span>
                <input className="wm-input" style={{ width: 70 }} value={inp(`field:${p.name}`, "")} onChange={(e) => setInp(`field:${p.name}`, e.target.value)} placeholder="new value" aria-label={`New value for ${p.name}`} />
                <button
                  className="btn small ghost"
                  disabled={busy}
                  onClick={() => {
                    const raw = inp(`field:${p.name}`, "");
                    const arg = NUMERIC.has(p.type) ? `i:${raw || "0"}` : p.type === "boolean" ? `b:${raw}` : `s:${raw}`;
                    go([...actions, actionLine(sel, p.access === "public" ? "set" : "tryset", p.name, [arg])]);
                  }}
                  title={p.access === "public" ? "Set this field directly from outside" : "Try to set this field from outside the class"}
                >
                  {p.access === "public" ? `${p.name} =` : `try ${p.name} =`}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {state && (
        <details className="game-classes" open>
          <summary><strong>📐 Your classes</strong> <span className="small muted">(read from your compiled code)</span></summary>
          <ClassPreview classes={state.classes} />
        </details>
      )}
      {state?.results.length ? (
        <details className="small">
          <summary className="muted">History ({state.results.length})</summary>
          {state.results.map((r, i) => (
            <div key={i} style={{ fontFamily: "var(--mono)" }}>{r.ok ? "✓" : "✗"} {describeAction(r.action, state)}{r.ok && r.result != null ? ` → ${r.result}` : ""}</div>
          ))}
        </details>
      ) : null}
    </div>
  );
}

/** "Aria.takeDamage(30)" from an action line. */
function describeAction(line: string, state: GameState | null): string {
  const [i, kind, name, rawArgs = ""] = line.split("|");
  const who = state ? label(state.objects[Number(i)] ?? null, Number(i)) : `#${i}`;
  const args = rawArgs ? rawArgs.split("\u001f").map((a) => {
    const v = a.slice(2);
    if (a.startsWith("s:")) return JSON.stringify(v);
    if (a.startsWith("o:") && state) return label(state.objects[Number(v)] ?? null, Number(v));
    return v;
  }) : [];
  if (kind === "call") return `${who}.${name}(${args.join(", ")})`;
  return `${who}.${name} = ${args[0] ?? ""}`;
}
