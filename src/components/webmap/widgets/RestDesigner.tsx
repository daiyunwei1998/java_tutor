"use client";

import { useState } from "react";
import { METHODS, type Method } from "@/lib/webmap/mockServer";
import { MethodTag } from "../HttpBits";

const PATHS = ["/api/shifts", "/api/shifts/3", "/api/shifts/3/signups", "/api/getShift?id=3", "/api/createShift", "/api/shifts/3/delete"];

const TASKS: { task: string; method: Method; path: string; why: string }[] = [
  { task: "List all shifts", method: "GET", path: "/api/shifts", why: "Reading the whole collection: GET on the plural noun." },
  { task: "See the details of shift 3", method: "GET", path: "/api/shifts/3", why: "One item of the collection: its id goes in the path." },
  { task: "Create a new shift", method: "POST", path: "/api/shifts", why: "POST to the collection creates a new item; the server picks the id and answers 201 with a Location." },
  { task: "Change only the number of slots of shift 3", method: "PATCH", path: "/api/shifts/3", why: "Changing some fields of one item is PATCH (PUT would replace the whole shift)." },
  { task: "Delete shift 3", method: "DELETE", path: "/api/shifts/3", why: "The verb is already in the method. /shifts/3/delete puts a verb in the path, which REST avoids." },
  { task: "List who signed up for shift 3", method: "GET", path: "/api/shifts/3/signups", why: "Signups belong to a shift, so they are a sub-collection under it." },
  { task: "Sign Amy up for shift 3", method: "POST", path: "/api/shifts/3/signups", why: "Creating a new signup = POST to that sub-collection, with {\"volunteer\": \"Amy\"} in the body." },
];

/** Pick the method + path for each feature of the volunteer app, then check against REST conventions. */
export function RestDesigner() {
  const [ans, setAns] = useState<Record<number, { m?: Method; p?: string }>>({});
  const [checked, setChecked] = useState(false);
  const score = TASKS.filter((t, i) => ans[i]?.m === t.method && ans[i]?.p === t.path).length;
  return (
    <div className="wm-widget">
      <h4>✏️ Design the API for the volunteer app</h4>
      <p className="small muted" style={{ marginTop: 0 }}>For each feature, choose a method and a path. Then press Check.</p>
      <table className="wm-table">
        <thead><tr><th>Feature</th><th>Method</th><th>Path</th>{checked && <th></th>}</tr></thead>
        <tbody>
          {TASKS.map((t, i) => {
            const a = ans[i] ?? {};
            const ok = a.m === t.method && a.p === t.path;
            return (
              <tr key={i}>
                <td>{t.task}</td>
                <td>
                  <select className="wm-input" value={a.m ?? ""} onChange={(e) => { setChecked(false); setAns({ ...ans, [i]: { ...a, m: e.target.value as Method } }); }} aria-label={`Method for: ${t.task}`}>
                    <option value="">—</option>
                    {METHODS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </td>
                <td>
                  <select className="wm-input" value={a.p ?? ""} onChange={(e) => { setChecked(false); setAns({ ...ans, [i]: { ...a, p: e.target.value } }); }} aria-label={`Path for: ${t.task}`}>
                    <option value="">—</option>
                    {PATHS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </td>
                {checked && (
                  <td className="small">
                    {ok ? "✅ " : "❌ "}
                    {!ok && <><MethodTag m={t.method} /> <code>{t.path}</code><br /></>}
                    {t.why}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="wm-row" style={{ marginTop: 8 }}>
        <button className="btn primary" onClick={() => setChecked(true)}>Check</button>
        {checked && <span className="small">{score} / {TASKS.length} match REST conventions{score === TASKS.length ? " 🎉" : ""}</span>}
        <button className="btn ghost small" onClick={() => { setAns({}); setChecked(false); }}>Reset</button>
      </div>
      {checked && (
        <p className="small muted" style={{ marginBottom: 0 }}>
          Notice the pattern: only three paths are needed for seven features. The method carries the verb. You can try all of these on the pretend server in the HTTP methods tutorial.
        </p>
      )}
    </div>
  );
}
