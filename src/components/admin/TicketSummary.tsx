"use client";

import { useEffect, useState } from "react";
import type { Sprint, Ticket } from "@/content/types";
import { ticketKey, type TicketState } from "@/lib/progress";
import { STATUS_LABEL } from "@/lib/ticket-status";
import { adminFetch, fmtTime, type Note } from "@/lib/admin";
import { TicketGoal } from "./TicketGoal";

type Detail = {
  state: Partial<TicketState> | null;
  time: { active_ms: number; first_at: string; last_at: string } | null;
};

const fmtMins = (ms: number) => {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

/** What the teacher sees after clicking a card on a student's board. Read-only: nothing here changes the student's work. */
export function TicketSummary({
  username,
  sprint,
  ticket,
  notes,
  onAddNote,
  onClose,
}: {
  username: string;
  sprint: Sprint;
  ticket: Ticket;
  notes: Note[];
  onAddNote: () => void;
  onClose: () => void;
}) {
  const key = ticketKey(sprint.id, ticket.id);
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const editable = ticket.task.files.filter((f) => !f.readOnly);
  const [file, setFile] = useState(editable[0]?.path ?? "");

  useEffect(() => {
    adminFetch<Detail>(`/api/admin/accounts/${encodeURIComponent(username)}/ticket?key=${encodeURIComponent(key)}`)
      .then(setD)
      .catch((e) => setErr(e instanceof Error ? e.message : "Cannot reach the backend."));
  }, [username, key]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const st = d?.state ?? {};
  const status = st.status ?? "todo";
  const starter = editable.find((f) => f.path === file)?.content ?? "";
  const code = st.files?.[file];
  const ticketNotes = notes.filter((n) => n.tickets.includes(key));
  const whyQuestions = ticket.blocks.filter((b): b is Extract<typeof b, { type: "short-answer" }> => b.type === "short-answer");

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ts-title" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card ticket-summary">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="small muted">{username} · Sprint {sprint.number}</div>
            <h2 id="ts-title" style={{ margin: "2px 0 0" }}>{ticket.id} {ticket.title}</h2>
            <TicketGoal ticket={ticket} compact />
          </div>
          <button className="btn ghost" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {err && <div className="callout warn">{err}</div>}
        {!d && !err && <p className="muted">Loading…</p>}
        {d && (
          <>
            <div className="ts-stats">
              <div><span className="small muted">Status</span><span className={`pill ${status}`}>{STATUS_LABEL[status]}</span></div>
              <div><span className="small muted">Time on ticket</span><strong>{d.time ? fmtMins(d.time.active_ms) : "—"}</strong></div>
              <div><span className="small muted">Runs</span><strong>{st.attempts ?? 0}</strong></div>
              <div><span className="small muted">Last test</span><strong>{st.lastTest ? `${st.lastTest.passed}/${st.lastTest.total}` : "—"}</strong></div>
              <div><span className="small muted">Hints shown</span><strong>{st.hintsShown ?? 0}</strong></div>
              <div><span className="small muted">Predictions</span><strong>{Object.keys(st.predictions ?? {}).length}</strong></div>
            </div>
            <p className="small muted" style={{ margin: "4px 0 10px" }}>
              {d.time ? `First opened ${fmtTime(d.time.first_at)} · last active ${fmtTime(d.time.last_at)}` : "Not opened yet."}
              {st.lastTest && ` · last test run ${fmtTime(st.lastTest.at)}`}
              {st.mergedAt && ` · merged ${fmtTime(st.mergedAt)}`}
            </p>

            <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
              <strong>Student&apos;s code</strong>
              {editable.length > 1 && (
                <div className="row" style={{ gap: 4 }}>
                  {editable.map((f) => (
                    <button key={f.path} className={`btn small${f.path === file ? " primary" : ""}`} onClick={() => setFile(f.path)}>{f.path}</button>
                  ))}
                </div>
              )}
            </div>
            {code === undefined || code === starter ? (
              <p className="small muted">{file}: no changes from the starter code yet.</p>
            ) : (
              <pre className="ts-code"><code>{code}</code></pre>
            )}

            {whyQuestions.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong>&quot;Why&quot; answers ({whyQuestions.filter((q) => st.answers?.[q.id]).length}/{whyQuestions.length})</strong>
                {whyQuestions.map((q) => (
                  <div key={q.id} className="small" style={{ margin: "6px 0" }}>
                    <div className="muted">{q.question.replace(/`/g, "")}</div>
                    <div style={{ whiteSpace: "pre-wrap" }}>{st.answers?.[q.id] ?? "— not answered yet"}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}>
              <strong>Notes about this ticket ({ticketNotes.length})</strong>
              <button className="btn small" onClick={onAddNote}>+ Note</button>
            </div>
            {ticketNotes.map((n) => (
              <div key={n.id} className="small" style={{ margin: "4px 0", opacity: n.done ? 0.6 : 1 }}>{n.done ? "✓ " : "• "}{n.body}</div>
            ))}
          </>
        )}

        <div className="row" style={{ marginTop: 14, flexWrap: "wrap" }}>
          <a className="btn" href={`/admin/tickets/${sprint.id}/${ticket.id}`} target="_blank" rel="noreferrer" title="Opens the ticket as a teacher preview in a new tab. The student's work is never changed.">
            ✏️ Try this ticket yourself ↗
          </a>
        </div>
      </div>
    </div>
  );
}
