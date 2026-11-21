"use client";

import { useEffect, useRef, useState } from "react";
import { sprints } from "@/content/registry";
import { ticketKey, type TicketStatus } from "@/lib/progress";
import { STATUS_LABEL } from "@/lib/ticket-status";
import { AdminError, adminFetch, fmtTime, type Note } from "@/lib/admin";
import type { Sprint, Ticket } from "@/content/types";
import { AdminBoard } from "./AdminBoard";
import { TicketSummary } from "./TicketSummary";
import { AdminLoginNeeded, NotesPanel } from "./Notes";

type TicketSummary = {
  status?: TicketStatus;
  attempts?: number;
  lastTest?: { passed: number; total: number; at: string };
  hintsShown?: number;
  mergedAt?: string;
};
type Detail = { username: string; updated_at: string | null; tickets: Record<string, TicketSummary> };

export function AccountInfo({ username }: { username: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [err, setErr] = useState<{ message: string; status: number } | null>(null);
  const [preset, setPreset] = useState<string[]>([]);
  const [ticketFilter, setTicketFilter] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [moveMsg, setMoveMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ sprint: Sprint; ticket: Ticket } | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const u = encodeURIComponent(username);
    Promise.all([
      adminFetch<Detail>(`/api/admin/accounts/${u}`),
      adminFetch<{ notes: Note[] }>(`/api/admin/notes?username=${u}`),
    ])
      .then(([d, n]) => {
        setDetail(d);
        setNotes(n.notes);
      })
      .catch((e) => setErr(e instanceof AdminError ? { message: e.message, status: e.status } : { message: "Cannot reach the backend.", status: 0 }));
  }, [username]);

  if (err?.status === 401) return <AdminLoginNeeded message={err.message === "Not logged in." ? undefined : err.message} />;
  if (err) {
    return (
      <div className="page">
        <div className="callout warn" role="alert">{err.status === 404 ? `There is no account "${username}".` : err.message}</div>
      </div>
    );
  }
  if (!detail) return <div className="page muted">Loading…</div>;

  /** Moves one ticket to another board column for this student. Their open tab picks it up on the next sync. */
  async function moveTicket(key: string, status: TicketStatus) {
    setMoving(key);
    setMoveMsg(null);
    try {
      const d = await adminFetch<Detail>(`/api/admin/accounts/${encodeURIComponent(username)}/ticket-status`, {
        method: "PUT",
        body: { ticket: key, status },
      });
      setDetail(d);
      setMoveMsg(`${key.split("/")[1]} moved to ${STATUS_LABEL[status]}.`);
    } catch (e) {
      setMoveMsg(`Could not move ${key.split("/")[1]}: ${e instanceof Error ? e.message : "cannot reach the backend"}`);
    } finally {
      setMoving(null);
    }
  }

  function addNoteFor(key: string) {
    setPreset([key]);
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    composerRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
  }

  const countFor = (key: string) => notes.filter((n) => n.tickets.includes(key)).length;
  // Notes moved to "general" while on this page stay visible until reload, so nothing seems to vanish.
  const shown = ticketFilter ? notes.filter((n) => n.tickets.includes(ticketFilter)) : notes;
  const open = notes.filter((n) => !n.done).length;

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>👤 {detail.username}</h1>
          <p className="muted small" style={{ margin: 0 }}>Last progress sync {fmtTime(detail.updated_at)}</p>
        </div>
      </div>

      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }} id="board">
        <h2>{detail.username}&apos;s board</h2>
        <span className="small muted" role="status">{moveMsg ?? "Drag a card to move it on the student's board. Click a card for a summary."}</span>
      </div>
      {sprints.map((s) => (
        <div key={s.id} style={{ marginBottom: 16 }}>
          <div className="small muted" style={{ marginBottom: 6 }}>Sprint {s.number}: {s.topic}</div>
          <AdminBoard sprint={s} tickets={detail.tickets} busyKey={moving} onMove={moveTicket} onOpen={(ticket) => setSummary({ sprint: s, ticket })} />
        </div>
      ))}

      <h2>Ticket details</h2>
      {sprints.map((s) => (
        <div key={s.id} className="card table-scroll" style={{ marginBottom: 12 }}>
          <div className="small muted" style={{ marginBottom: 6 }}>Sprint {s.number}: {s.topic}</div>
          <table className="data">
            <thead>
              <tr><th>Ticket</th><th>Status</th><th>Runs</th><th>Last test</th><th>Hints</th><th>Notes</th><th /></tr>
            </thead>
            <tbody>
              {s.tickets.map((t) => {
                const key = ticketKey(s.id, t.id);
                const st = detail.tickets[key] ?? {};
                const status = st.status ?? "todo";
                const c = countFor(key);
                return (
                  <tr key={key}>
                    <td><strong>{t.id}</strong> <span className="muted">{t.title}</span></td>
                    <td><span className={`pill ${status}`}>{STATUS_LABEL[status] ?? status}</span></td>
                    <td>{st.attempts ?? 0}</td>
                    <td className="small">{st.lastTest ? `${st.lastTest.passed}/${st.lastTest.total} · ${fmtTime(st.lastTest.at)}` : "—"}</td>
                    <td>{st.hintsShown ?? 0}</td>
                    <td>
                      {c > 0 ? (
                        <button className={`btn small${ticketFilter === key ? " primary" : ""}`} onClick={() => setTicketFilter(ticketFilter === key ? null : key)} title="Show only notes about this ticket">
                          {c}
                        </button>
                      ) : (
                        <span className="muted">0</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn small"
                        onClick={() => addNoteFor(key)}
                      >
                        + Note
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}

      <div className="row" style={{ justifyContent: "space-between" }} ref={composerRef}>
        <h2>Notes about {detail.username} <span className="muted small">({open} open, {notes.length - open} done)</span></h2>
        {ticketFilter && (
          <button className="btn small" onClick={() => setTicketFilter(null)}>Showing {ticketFilter.split("/")[1]} only · show all ✕</button>
        )}
      </div>
      <NotesPanel
        notes={shown}
        setNotes={setNotes}
        account={{ kind: "fixed", username: detail.username }}
        defaults={{ username: detail.username, tickets: preset }}
        showAccount={false}
        onCreated={() => setPreset([])}
        emptyText={ticketFilter ? "No notes about this ticket." : "No notes yet."}
      />
      {summary && (
        <TicketSummary
          username={detail.username}
          sprint={summary.sprint}
          ticket={summary.ticket}
          notes={notes}
          onClose={() => setSummary(null)}
          onAddNote={() => {
            const key = ticketKey(summary.sprint.id, summary.ticket.id);
            setSummary(null);
            setTimeout(() => addNoteFor(key), 0);
          }}
        />
      )}
    </div>
  );
}
