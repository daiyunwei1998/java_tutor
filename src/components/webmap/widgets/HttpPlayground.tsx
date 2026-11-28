"use client";

import { useState } from "react";
import { handle, initialDb, METHOD_INFO, METHODS, requestText, responseText, type DbState, type Handled, type Method } from "@/lib/webmap/mockServer";
import { MethodTag, StatusTag } from "../HttpBits";
import { DataTables } from "./DataTables";

const PRESETS: { label: string; method: Method; path: string; body?: string }[] = [
  { label: "List shifts", method: "GET", path: "/api/shifts" },
  { label: "One shift", method: "GET", path: "/api/shifts/2" },
  { label: "Create a shift", method: "POST", path: "/api/shifts", body: '{"title": "Beach clean-up", "date": "2026-12-13", "slots": 5}' },
  { label: "Replace shift 2", method: "PUT", path: "/api/shifts/2", body: '{"title": "Park clean-up", "date": "2026-12-06", "slots": 8}' },
  { label: "Change slots of shift 1", method: "PATCH", path: "/api/shifts/1", body: '{"slots": 6}' },
  { label: "Delete shift 3", method: "DELETE", path: "/api/shifts/3" },
  { label: "Sign Amy up for shift 3", method: "POST", path: "/api/shifts/3/signups", body: '{"volunteer": "Amy"}' },
];

const hasBody = (m: Method) => m === "POST" || m === "PUT" || m === "PATCH";

/** Send requests to the pretend server (src/lib/webmap/mockServer.ts) and watch responses and tables. */
export function HttpPlayground() {
  const [db, setDb] = useState<DbState>(initialDb);
  const [method, setMethod] = useState<Method>("GET");
  const [path, setPath] = useState("/api/shifts");
  const [body, setBody] = useState("");
  const [last, setLast] = useState<{ req: string; h: Handled; before: DbState } | null>(null);
  const [log, setLog] = useState<{ m: Method; p: string; s: number }[]>([]);

  function send() {
    const req = { method, path: path.trim() || "/", body: hasBody(method) ? body : undefined };
    const h = handle(db, req);
    setLast({ req: requestText(req), h, before: db });
    setDb(h.state);
    setLog((l) => [{ m: method, p: req.path, s: h.response.status }, ...l].slice(0, 8));
  }

  const info = METHOD_INFO[method];
  return (
    <div className="wm-widget">
      <h4>🧪 HTTP playground (a pretend server running in your browser)</h4>
      <div className="wm-label">Presets</div>
      <div className="wm-row">
        {PRESETS.map((p) => (
          <button key={p.label} className="btn small" onClick={() => { setMethod(p.method); setPath(p.path); setBody(p.body ?? ""); }}>
            <MethodTag m={p.method} /> {p.label}
          </button>
        ))}
      </div>
      <div className="wm-label">Request</div>
      <div className="wm-row">
        <select value={method} onChange={(e) => setMethod(e.target.value as Method)} aria-label="Method" className="wm-input">
          {METHODS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <input className="wm-input" value={path} onChange={(e) => setPath(e.target.value)} aria-label="Path" style={{ flex: 1, minWidth: 200 }} spellCheck={false} />
        <button className="btn primary" onClick={send}>Send</button>
        <button className="btn" onClick={send} disabled={!last} title="Send exactly the same request again">Send again</button>
        <button className="btn ghost small" onClick={() => { setDb(initialDb()); setLast(null); setLog([]); }}>Reset data</button>
      </div>
      <p className="small muted" style={{ margin: "6px 0" }}>
        <MethodTag m={method} /> {info.meaning} · safe: {info.safe ? "yes" : "no"} · idempotent: {info.idempotent ? "yes" : "no"}
      </p>
      {hasBody(method) && (
        <>
          <div className="wm-label">Body (JSON)</div>
          <textarea className="wm-input" value={body} onChange={(e) => setBody(e.target.value)} rows={3} style={{ width: "100%" }} spellCheck={false} aria-label="Request body" />
        </>
      )}
      {last && (
        <div className="wm-grid2" style={{ marginTop: 8 }}>
          <div>
            <div className="wm-label">What the browser sent</div>
            <pre className="wm-msg">{last.req}</pre>
          </div>
          <div>
            <div className="wm-label">What the server answered · <StatusTag code={last.h.response.status} text={last.h.response.statusText} /></div>
            <pre className="wm-msg">{responseText(last.h.response)}</pre>
          </div>
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        <DataTables db={db} touched={last?.h.touched ?? []} before={last?.before} />
      </div>
      {log.length > 0 && (
        <>
          <div className="wm-label">History</div>
          <div className="small" style={{ fontFamily: "var(--mono)" }}>
            {log.map((l, i) => (
              <div key={i}><MethodTag m={l.m} /> {l.p} → <StatusTag code={l.s} /></div>
            ))}
          </div>
        </>
      )}
      <p className="small muted" style={{ marginBottom: 0 }}>Endpoints: /api/shifts · /api/shifts/&#123;id&#125; · /api/shifts/&#123;id&#125;/signups · /api/signups/&#123;id&#125;. Try a wrong path or method, or break the JSON on purpose.</p>
    </div>
  );
}
