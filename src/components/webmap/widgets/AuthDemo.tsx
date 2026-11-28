"use client";

import { useState } from "react";
import { handle, initialDb, requestText, responseText, type DbState, type HttpRequest } from "@/lib/webmap/mockServer";
import { StatusTag } from "../HttpBits";

/** Log in, call /api/me with and without the session cookie, log out. The cookie jar is shown. */
export function AuthDemo() {
  const [db, setDb] = useState<DbState>(initialDb);
  const [jar, setJar] = useState<string | null>(null);
  const [user, setUser] = useState("Amy");
  const [pw, setPw] = useState("");
  const [last, setLast] = useState<{ req: string; res: string; status: number } | null>(null);

  function send(req: HttpRequest) {
    const withCookie: HttpRequest = { ...req, headers: jar ? { Cookie: jar } : {} };
    const h = handle(db, withCookie);
    setDb(h.state);
    const set = h.response.headers["Set-Cookie"];
    if (set) {
      const v = set.split(";")[0];
      setJar(v.endsWith("=") ? null : v);
    }
    setLast({ req: requestText(withCookie), res: responseText(h.response), status: h.response.status });
  }

  return (
    <div className="wm-widget">
      <h4>🔑 Sessions in action</h4>
      <div className="wm-row">
        <button className="btn" onClick={() => send({ method: "GET", path: "/api/me" })}>GET /api/me (who am I?)</button>
        <span className="small muted">|</span>
        <input className="wm-input" value={user} onChange={(e) => setUser(e.target.value)} aria-label="Username" style={{ width: 90 }} />
        <input className="wm-input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="password" aria-label="Password" style={{ width: 110 }} />
        <button className="btn primary" onClick={() => send({ method: "POST", path: "/api/login", body: JSON.stringify({ username: user, password: pw }) })}>Log in</button>
        <button className="btn" onClick={() => send({ method: "POST", path: "/api/logout" })}>Log out</button>
      </div>
      <p className="small" style={{ margin: "8px 0" }}>
        🍪 Browser&apos;s cookie jar for volunteer.example.org: <code>{jar ?? "(empty)"}</code>
      </p>
      {last && (
        <div className="wm-grid2">
          <div>
            <div className="wm-label">Request</div>
            <pre className="wm-msg">{last.req}</pre>
          </div>
          <div>
            <div className="wm-label">Response · <StatusTag code={last.status} /></div>
            <pre className="wm-msg">{last.res}</pre>
          </div>
        </div>
      )}
      <p className="small muted" style={{ marginBottom: 0 }}>Try: /api/me first (401), log in with password <code>volunteer</code>, /api/me again (200, and the Cookie header appears), log out, /api/me again.</p>
    </div>
  );
}
