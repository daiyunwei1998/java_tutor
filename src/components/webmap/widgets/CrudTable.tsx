"use client";

import { useState } from "react";
import { handle, initialDb, requestText, type DbState, type Handled, type HttpRequest } from "@/lib/webmap/mockServer";
import { StatusTag } from "../HttpBits";
import { DataTables } from "./DataTables";

/** Create / Read / Update / Delete buttons that show the HTTP request, the SQL and the table at once. */
export function CrudTable() {
  const [db, setDb] = useState<DbState>(initialDb);
  const [target, setTarget] = useState(2);
  const [last, setLast] = useState<{ op: string; req: HttpRequest; h: Handled; before: DbState } | null>(null);

  function run(op: string, req: HttpRequest) {
    const h = handle(db, req);
    setLast({ op, req, h, before: db });
    setDb(h.state);
    if (op === "Delete" && h.response.status === 204) setTarget(h.state.shifts[0]?.id ?? 0);
    if (op === "Create" && h.response.status === 201) setTarget((h.response.body as { id: number }).id);
  }
  const shift = db.shifts.find((s) => s.id === target);
  const n = db.nextShiftId;

  return (
    <div className="wm-widget">
      <h4>🗄️ CRUD: one action, three layers</h4>
      <div className="wm-row">
        <label className="small">Shift:{" "}
          <select className="wm-input" value={target} onChange={(e) => setTarget(Number(e.target.value))} aria-label="Shift to act on">
            {db.shifts.map((s) => <option key={s.id} value={s.id}>{s.id}: {s.title}</option>)}
          </select>
        </label>
        <button className="btn" onClick={() => run("Create", { method: "POST", path: "/api/shifts", body: JSON.stringify({ title: `New shift ${n}`, date: "2026-12-20", slots: 3 }) })}>➕ Create</button>
        <button className="btn" disabled={!shift} onClick={() => run("Read", { method: "GET", path: `/api/shifts/${target}` })}>👁 Read</button>
        <button className="btn" disabled={!shift} onClick={() => run("Update", { method: "PATCH", path: `/api/shifts/${target}`, body: JSON.stringify({ slots: (shift?.slots ?? 0) + 1 }) })}>✏️ Update (+1 slot)</button>
        <button className="btn" disabled={!shift} onClick={() => run("Delete", { method: "DELETE", path: `/api/shifts/${target}` })}>🗑 Delete</button>
        <button className="btn ghost small" onClick={() => { setDb(initialDb()); setLast(null); setTarget(2); }}>Reset data</button>
      </div>
      {last && (
        <div className="wm-grid2" style={{ marginTop: 8 }}>
          <div>
            <div className="wm-label">1 · HTTP request (browser → server)</div>
            <pre className="wm-msg">{requestText(last.req)}</pre>
            <div className="small">Answer: <StatusTag code={last.h.response.status} text={last.h.response.statusText} /></div>
          </div>
          <div>
            <div className="wm-label">2 · SQL (server → database)</div>
            <pre className="wm-msg">{last.h.sql.join("\n") || "(none)"}</pre>
          </div>
        </div>
      )}
      <div className="wm-label">3 · The tables</div>
      <DataTables db={db} touched={last?.h.touched ?? []} before={last?.before} />
    </div>
  );
}
