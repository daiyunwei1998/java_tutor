"use client";

import { useState } from "react";
import type { Sprint, Ticket } from "@/content/types";
import { useIssuedTickets } from "@/lib/issued";
import { ticketKey, type TicketStatus } from "@/lib/progress";
import { STATUS_LABEL, STATUSES } from "@/lib/ticket-status";

type Summary = { status?: TicketStatus; lastTest?: { passed: number; total: number } };

/**
 * A student's sprint board as the teacher sees it: the same kanban the student uses. Drag a card to move
 * the ticket on the student's board (the teacher may move it to any column); click it for a summary.
 */
export function AdminBoard({
  sprint,
  tickets,
  busyKey,
  onMove,
  onOpen,
}: {
  sprint: Sprint;
  tickets: Record<string, Summary>;
  busyKey: string | null;
  onMove: (key: string, status: TicketStatus) => void;
  onOpen: (ticket: Ticket) => void;
}) {
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TicketStatus | null>(null);
  const statusOf = (key: string): TicketStatus => tickets[key]?.status ?? "todo";
  // Only the tickets students can see (issue or hide them on /admin/tickets).
  const issued = useIssuedTickets(sprint);

  return (
    <div className={`board admin-board${dragKey ? " dragging" : ""}`}>
      {STATUSES.map((col) => {
        const target = !!dragKey && statusOf(dragKey) !== col;
        return (
          <section
            key={col}
            className={`column${target ? " drop-ok" : ""}${target && overCol === col ? " drop-over" : ""}`}
            aria-label={STATUS_LABEL[col]}
            onDragOver={(e) => {
              if (!target) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overCol !== col) setOverCol(col);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverCol((c) => (c === col ? null : c));
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragKey && target) onMove(dragKey, col);
              setDragKey(null);
              setOverCol(null);
            }}
          >
            <h3>{STATUS_LABEL[col]}</h3>
            {issued
              .filter((t) => statusOf(ticketKey(sprint.id, t.id)) === col)
              .map((t) => {
                const key = ticketKey(sprint.id, t.id);
                const lt = tickets[key]?.lastTest;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => onOpen(t)}
                    title="Click for a summary, drag to move"
                    className={`ticket-card${dragKey === key ? " is-dragging" : ""}${busyKey === key ? " busy" : ""}`}
                    draggable={busyKey !== key}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", t.id);
                      setDragKey(key);
                    }}
                    onDragEnd={() => {
                      setDragKey(null);
                      setOverCol(null);
                    }}
                  >
                    <span className="ticket-id">{t.id}</span>
                    <div style={{ fontWeight: 600, margin: "4px 0", fontSize: 14 }}>{t.title}</div>
                    {lt && <div className="small muted">tests {lt.passed}/{lt.total}</div>}
                  </button>
                );
              })}
          </section>
        );
      })}
    </div>
  );
}
