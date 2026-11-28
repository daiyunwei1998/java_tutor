"use client";

import { useState } from "react";
import { handle, initialDb, type DbState, type HttpRequest, type Method, type Shift } from "@/lib/webmap/mockServer";
import { MethodTag, StatusTag } from "../HttpBits";

type Kind = "document" | "stylesheet" | "script" | "fetch";
type Entry = {
  n: number;
  name: string;
  url: string;
  method: Method;
  status: number;
  statusText: string;
  type: Kind;
  size: number;
  time: number;
  reqHeaders: Record<string, string>;
  resHeaders: Record<string, string>;
  payload?: string;
  response?: string;
  json?: unknown;
};

const ORIGIN = "https://volunteer.example.org";
const COOKIE = "session=demo";

const PAGE_HTML = `<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="/styles.css">
    <script src="/app.js" defer></script>
  </head>
  <body>
    <h1>Volunteer shifts</h1>
    <ul id="shifts">Loading…</ul>
  </body>
</html>`;

const APP_JS = `// Runs in the browser after the page loads
const shifts = await fetch("/api/shifts").then(r => r.json());
const me = await fetch("/api/me").then(r => r.json());
render(shifts, me);

async function signUp(shiftId) {
  const r = await fetch(\`/api/shifts/\${shiftId}/signups\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ volunteer: me.username }),
  });
  ...
}`;

const STYLES = `body { font-family: system-ui; }\n.shift { display: flex; justify-content: space-between; }`;

type Filter = "all" | "fetch" | "document" | "script" | "stylesheet";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "fetch", label: "Fetch/XHR" },
  { id: "document", label: "Doc" },
  { id: "script", label: "JS" },
  { id: "stylesheet", label: "CSS" },
];

type DetailTab = "headers" | "payload" | "preview" | "response";

/** A simulated web app and a simulated DevTools Network panel, for practising before using the real one. */
export function NetworkPanel() {
  const [db, setDb] = useState<DbState>(() => ({ ...initialDb(), sessions: { demo: "Amy" } }));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [mine, setMine] = useState<Record<number, number>>({}); // shiftId -> signupId (what the page knows)
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [preserve, setPreserve] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const [tab, setTab] = useState<DetailTab>("headers");

  function staticEntry(n: number, name: string, type: Kind, contentType: string, body: string, time: number): Entry {
    return {
      n, name, url: `${ORIGIN}/${name === "volunteer.example.org" ? "" : name}`, method: "GET", status: 200, statusText: "OK", type,
      size: body.length + 180, time,
      reqHeaders: { Accept: type === "document" ? "text/html" : "*/*" },
      resHeaders: { "Content-Type": contentType, "Content-Length": String(body.length) },
      response: body,
    };
  }

  /** Runs a fetch() the way the page's JavaScript would, through the pretend server, and records it. */
  function api(state: DbState, n: number, req: HttpRequest, time: number): { state: DbState; entry: Entry } {
    const h = handle(state, { ...req, headers: { Cookie: COOKIE } });
    const r = h.response;
    const text = r.body === undefined ? "" : JSON.stringify(r.body);
    const reqHeaders: Record<string, string> = { Accept: "*/*", Cookie: COOKIE };
    if (req.body) reqHeaders["Content-Type"] = "application/json";
    return {
      state: h.state,
      entry: {
        n, name: req.path.split("/").pop() || req.path, url: ORIGIN + req.path, method: req.method, status: r.status, statusText: r.statusText,
        type: "fetch", size: text.length + 160, time, reqHeaders,
        resHeaders: { ...r.headers, ...(text ? { "Content-Length": String(text.length) } : {}) },
        payload: req.body, response: text, json: r.body,
      },
    };
  }

  function record(list: Entry[], reset: boolean) {
    setEntries((old) => (reset && !preserve ? list : [...old, ...list]));
  }

  function loadPage() {
    let n = count;
    const next = () => ++n;
    const doc = staticEntry(next(), "volunteer.example.org", "document", "text/html", PAGE_HTML, 84);
    const css = staticEntry(next(), "styles.css", "stylesheet", "text/css", STYLES, 21);
    const js = staticEntry(next(), "app.js", "script", "text/javascript", APP_JS, 33);
    const a = api(db, next(), { method: "GET", path: "/api/shifts" }, 57);
    const b = api(a.state, next(), { method: "GET", path: "/api/me" }, 29);
    setCount(n);
    setDb(b.state);
    setShifts(a.entry.json as Shift[]);
    setMine({});
    setLoaded(true);
    setNotice(null);
    setSel(null);
    record([doc, css, js, a.entry, b.entry], true);
  }

  function signUp(shiftId: number) {
    const n = count + 1;
    const r = api(db, n, { method: "POST", path: `/api/shifts/${shiftId}/signups`, body: '{"volunteer": "Amy"}' }, 64);
    setCount(n);
    setDb(r.state);
    record([r.entry], false);
    if (r.entry.status === 201) {
      setMine((m) => ({ ...m, [shiftId]: (r.entry.json as { id: number }).id }));
      setNotice("✅ You're signed up!");
    } else {
      setNotice(`⚠️ Something went wrong (${r.entry.status}). Check the Network tab to see why.`);
    }
  }

  function cancel(shiftId: number) {
    const n = count + 1;
    const r = api(db, n, { method: "DELETE", path: `/api/signups/${mine[shiftId]}` }, 41);
    setCount(n);
    setDb(r.state);
    record([r.entry], false);
    if (r.entry.status === 204) {
      setMine((m) => {
        const c = { ...m };
        delete c[shiftId];
        return c;
      });
      setNotice("Signup cancelled.");
    }
  }

  const shown = entries.filter((e) => filter === "all" || e.type === filter);
  const cur = entries.find((e) => e.n === sel) ?? null;

  return (
    <div className="wm-widget">
      <h4>🛠 Practice: a web app and its Network panel</h4>
      <div className="wm-grid2" style={{ gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.2fr)" }}>
        {/* ---------- the app ---------- */}
        <div>
          <div className="wm-label">The app (volunteer.example.org) · logged in as Amy</div>
          <div className="nt-app">
            <button className="btn small primary" onClick={loadPage}>⟳ {loaded ? "Reload page" : "Load page"}</button>
            {!loaded && <p className="small muted">Press Load page, as if you typed the address and hit Enter.</p>}
            {loaded && (
              <>
                <h3 style={{ margin: "10px 0 4px" }}>Volunteer shifts</h3>
                {shifts.map((s) => (
                  <div key={s.id} className="shift">
                    <div>
                      <strong>{s.title}</strong>
                      <div className="small muted">{s.date} · {s.slots} slots</div>
                    </div>
                    {mine[s.id] ? (
                      <button className="btn small" onClick={() => cancel(s.id)}>Cancel</button>
                    ) : (
                      <button className="btn small" onClick={() => signUp(s.id)}>Sign up</button>
                    )}
                  </div>
                ))}
                {notice && <div className="small" style={{ marginTop: 8 }}>{notice}</div>}
              </>
            )}
          </div>
        </div>

        {/* ---------- DevTools ---------- */}
        <div>
          <div className="wm-label">DevTools → Network (simulated)</div>
          <div className="nt">
            <div className="nt-bar">
              <button className="tab" onClick={() => { setEntries([]); setSel(null); }} title="Clear">🚫</button>
              <label className="small"><input type="checkbox" checked={preserve} onChange={(e) => setPreserve(e.target.checked)} /> Preserve log</label>
              <span style={{ width: 8 }} />
              {FILTERS.map((f) => (
                <button key={f.id} className={`tab${filter === f.id ? " on" : ""}`} onClick={() => setFilter(f.id)}>{f.label}</button>
              ))}
            </div>
            <div style={{ maxHeight: 190, overflow: "auto" }}>
              <table className="nt-list">
                <thead><tr><th>Name</th><th>Method</th><th>Status</th><th>Type</th><th>Size</th><th>Time</th></tr></thead>
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.n} className={sel === e.n ? "sel" : ""} onClick={() => { setSel(e.n); setTab("headers"); }}>
                      <td>{e.name}</td>
                      <td><MethodTag m={e.method} /></td>
                      <td><StatusTag code={e.status} /></td>
                      <td>{e.type}</td>
                      <td>{e.size < 1000 ? `${e.size} B` : `${(e.size / 1000).toFixed(1)} kB`}</td>
                      <td>{e.time} ms</td>
                    </tr>
                  ))}
                  {shown.length === 0 && (
                    <tr><td colSpan={6} style={{ color: "var(--muted)", padding: 12, whiteSpace: "normal" }}>Recording network activity… Load the page or click something in the app.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="small muted" style={{ padding: "3px 8px", borderTop: "1px solid var(--border)" }}>
              {shown.length} / {entries.length} requests
            </div>
            {cur && (
              <div className="nt-detail">
                <div className="nt-bar">
                  {(["headers", "payload", "preview", "response"] as DetailTab[]).map((t) => (
                    <button key={t} className={`tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
                  ))}
                  <button className="tab" style={{ marginLeft: "auto" }} onClick={() => setSel(null)} aria-label="Close details">✕</button>
                </div>
                {tab === "headers" && (
                  <div className="nt-kv">
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>General</div>
                    <div><b>Request URL:</b> {cur.url}</div>
                    <div><b>Request Method:</b> {cur.method}</div>
                    <div><b>Status Code:</b> <StatusTag code={cur.status} text={cur.statusText} /></div>
                    <div style={{ fontWeight: 700, margin: "6px 0 2px" }}>Response Headers</div>
                    {Object.entries(cur.resHeaders).map(([k, v]) => <div key={k}><b>{k.toLowerCase()}:</b> {v}</div>)}
                    <div style={{ fontWeight: 700, margin: "6px 0 2px" }}>Request Headers</div>
                    {Object.entries(cur.reqHeaders).map(([k, v]) => <div key={k}><b>{k.toLowerCase()}:</b> {v}</div>)}
                  </div>
                )}
                {tab === "payload" && <pre>{cur.payload ? cur.payload : "This request has no payload."}</pre>}
                {tab === "preview" && (
                  <pre>{cur.json !== undefined ? JSON.stringify(cur.json, null, 2) : cur.response ? cur.response : "This request has no response data available."}</pre>
                )}
                {tab === "response" && <pre>{cur.response ? cur.response : "This request has no response data available."}</pre>}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="small muted" style={{ marginBottom: 0 }}>Click a row to see its details. The real panel in Chrome, Edge or Firefox looks a little different, but has the same columns and tabs.</p>
    </div>
  );
}
