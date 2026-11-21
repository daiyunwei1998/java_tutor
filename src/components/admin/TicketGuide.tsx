"use client";

import Link from "next/link";
import { useState } from "react";
import { sprints } from "@/content/registry";
import type { Sprint, Ticket } from "@/content/types";
import { adminFetch, AdminError } from "@/lib/admin";
import { isIssued, setIssued, useIssueOverrides } from "@/lib/issued";
import { ticketKey } from "@/lib/progress";
import { LevelPill, TicketGoal } from "./TicketGoal";

/**
 * Teacher-only (the admin layout gates it behind the login) overview: every ticket of every sprint with
 * what it is designed to teach, in board order, and a switch that issues it to students or hides it.
 */
export function TicketGuide() {
  const overrides = useIssueOverrides();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle(s: Sprint, t: Ticket, on: boolean) {
    const key = ticketKey(s.id, t.id);
    setBusy(key);
    setMsg(null);
    try {
      // Matching the content default clears the override, so later content changes still apply.
      await setIssued(adminFetch, key, on === (t.issuedByDefault !== false) ? null : on);
      setMsg(`${t.id} is now ${on ? "issued to students" : "hidden from students"}. Open student tabs pick it up when they reload.`);
    } catch (e) {
      setMsg(e instanceof AdminError ? e.message : "Cannot reach the backend.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <h1>🎯 Tickets</h1>
      <p className="muted small" style={{ marginTop: 0 }}>
        Manage what students get: switch a ticket on to issue it, off to hide it from every student&apos;s board. Open a ticket to try it yourself in a sandbox (only you see it, and ↺ Start over restores the starter code).
      </p>
      {msg && <div className="callout info small" role="status">{msg}</div>}
      {sprints.map((s) => (
        <section key={s.id} style={{ marginTop: 18 }}>
          <h2 style={{ marginBottom: 4 }}>Sprint {s.number}: {s.topic}</h2>
          <p className="small muted" style={{ marginTop: 0 }}>
            {s.tickets.filter((t) => isIssued(overrides, s.id, t)).length} of {s.tickets.length} tickets issued · difficulty of the issued ones in board order:{" "}
            {s.tickets.filter((t) => isIssued(overrides, s.id, t)).map((t) => (
              <span key={t.id} style={{ marginRight: 4 }} title={t.id}><LevelPill level={t.learningGoal.level} /></span>
            ))}
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {s.tickets.map((t) => {
              const on = isIssued(overrides, s.id, t);
              const key = ticketKey(s.id, t.id);
              return (
              <div key={t.id} className="card" style={on ? undefined : { opacity: 0.6 }}>
                <div className="row" style={{ marginBottom: 6, justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <Link href={`/admin/tickets/${s.id}/${t.id}`} title="Try the ticket yourself in a teacher sandbox"><strong>{t.id}</strong> {t.title}</Link>
                  <span className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
                  <label className="small" style={{ whiteSpace: "nowrap", cursor: "pointer" }}>
                    <input type="checkbox" checked={on} disabled={busy === key} onChange={(e) => toggle(s, t, e.target.checked)} />{" "}
                    {on ? "Issued to students" : "Hidden from students"}
                  </label>
                  <Link className="btn small" href={`/admin/tickets/${s.id}/${t.id}`}>▶ Try it</Link>
                  </span>
                </div>
                <TicketGoal ticket={t} />
              </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
