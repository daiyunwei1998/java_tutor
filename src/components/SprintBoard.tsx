"use client";

import Link from "next/link";
import { useState } from "react";
import { getSprint } from "@/content/registry";
import { getTicketState, ticketKey, type TicketState, type TicketStatus, updateTicket, useStore } from "@/lib/progress";
import { sprintProgress, STATUS_LABEL, STATUSES } from "@/lib/ticket-status";
import { SprintProgressBar } from "./SprintProgressBar";
import { StarButton } from "./StarButton";

const COLUMNS = STATUSES;

/** Students can always move a ticket back. Moving forward past In Progress needs a fully passing test run. */
function canMove(t: TicketState, to: TicketStatus): boolean {
  if (t.status === to) return false;
  if (COLUMNS.indexOf(to) <= Math.max(COLUMNS.indexOf(t.status), 1)) return true;
  const lt = t.lastTest;
  return !!lt && lt.total > 0 && lt.passed === lt.total;
}

function moveTo(key: string, to: TicketStatus) {
  updateTicket(key, (t) => {
    const next: TicketState = { ...t, status: to };
    if (to === "merged") next.mergedAt = t.mergedAt ?? new Date().toISOString();
    else {
      delete next.mergedAt;
      delete next.tutorVerified;
    }
    return next;
  });
}

export function SprintBoard({ sprintId }: { sprintId: string }) {
  const sprint = getSprint(sprintId)!;
  const store = useStore();
  const prog = sprintProgress(store, sprint);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TicketStatus | null>(null);
  const dragState = dragKey ? getTicketState(store, dragKey) : null;

  return (
    <div className="page" style={{ maxWidth: 1250 }}>
      <p className="muted small" style={{ margin: 0 }}>
        Sprint {sprint.number} · {sprint.topic} · {sprint.unit}{sprint.dates ? ` · ${sprint.dates}` : ""}
      </p>
      <h1>{sprint.project.name} <span className="muted" style={{ fontWeight: 400 }}>@ {sprint.project.company}</span></h1>
      <p className="muted">{sprint.project.tagline}</p>
      <div className="row" style={{ alignItems: "stretch", flexWrap: "wrap" }}>
        <div className="card" style={{ flex: "1 1 360px", maxWidth: 560, margin: 0 }}>
          <SprintProgressBar {...prog} />
        </div>
        {sprint.knowledge?.length ? (
          <Link href={`/sprints/${sprint.id}/knowledge`} className="card k-promo" style={{ flex: "1 1 280px", maxWidth: 420, margin: 0 }}>
            <strong>📚 Knowledge Space</strong>
            <div className="small muted">{sprint.knowledge.length} interactive deep dives that go beyond the textbook (optional)</div>
          </Link>
        ) : null}
      </div>

      {store && <p className="small muted" style={{ margin: "16px 0 6px" }}>Drag a card to another column to move it. Tests Passed and Merged need all tests passing.</p>}
      <div className={`board${dragKey ? " dragging" : ""}`}>
        {COLUMNS.map((col) => {
          const allowed = !!dragState && canMove(dragState, col);
          return (
          <section
            key={col}
            className={`column${dragState && dragState.status !== col ? (allowed ? " drop-ok" : " drop-no") : ""}${overCol === col && allowed ? " drop-over" : ""}`}
            aria-label={STATUS_LABEL[col]}
            onDragOver={(e) => {
              if (!allowed) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overCol !== col) setOverCol(col);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverCol((c) => (c === col ? null : c));
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragKey && allowed) moveTo(dragKey, col);
              setDragKey(null);
              setOverCol(null);
            }}
          >
            <h3>{STATUS_LABEL[col]}</h3>
            {sprint.tickets
              .filter((t) => getTicketState(store, ticketKey(sprint.id, t.id)).status === col)
              // Starred tickets first; otherwise keep the sprint's order (sort is stable).
              .sort((a, b) => Number(!!getTicketState(store, ticketKey(sprint.id, b.id)).starred) - Number(!!getTicketState(store, ticketKey(sprint.id, a.id)).starred))
              .map((t) => {
                const st = getTicketState(store, ticketKey(sprint.id, t.id));
                return (
                  <Link
                    key={t.id}
                    href={`/sprints/${sprint.id}/tickets/${t.id}`}
                    className={`ticket-card${st.starred ? " starred" : ""}${dragKey === ticketKey(sprint.id, t.id) ? " is-dragging" : ""}`}
                    draggable={!!store}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", t.id);
                      setDragKey(ticketKey(sprint.id, t.id));
                    }}
                    onDragEnd={() => {
                      setDragKey(null);
                      setOverCol(null);
                    }}
                  >
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span className="ticket-id">{t.id}</span>
                      <span className="row" style={{ gap: 6 }}>
                        <span className="small muted">{t.xp} XP</span>
                        {store && <StarButton ticketKey={ticketKey(sprint.id, t.id)} starred={!!st.starred} label={t.id} />}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, margin: "4px 0" }}>{t.title}</div>
                    <div className="small muted">
                      {st.lastTest && `tests ${st.lastTest.passed}/${st.lastTest.total}`}
                      {st.status === "merged" && (st.tutorVerified ? " · ✅ reviewed by teacher" : " · waiting for teacher review")}
                    </div>
                  </Link>
                );
              })}
          </section>
          );
        })}
      </div>

    </div>
  );
}
