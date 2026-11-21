"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTicket } from "@/content/registry";
import { ticketKey, type TicketState } from "@/lib/progress";
import { RemoteTicketProvider } from "../live/LiveContext";
import { Workspace } from "../Workspace";
import { LevelPill } from "./TicketGoal";

const STORE = "jt.admin.preview";
const blank = (): TicketState => ({ status: "todo", attempts: 0, files: {}, predictions: {}, hintsShown: 0 });

function readAll(): Record<string, TicketState> {
  try {
    return JSON.parse(localStorage.getItem(STORE) ?? "{}");
  } catch {
    return {};
  }
}

/**
 * The teacher's view of a ticket: the real student workspace (lesson, editor, Run, tests, debugger) on the
 * teacher's own scratch copy, kept in this browser only. No student login, and no student's work is touched.
 */
export function TicketPreview({ sprintId, ticketId, solution }: { sprintId: string; ticketId: string; solution: string | null }) {
  const { sprint, ticket } = getTicket(sprintId, ticketId)!;
  const key = ticketKey(sprintId, ticketId);
  const [st, setSt] = useState<TicketState>(blank);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    setSt(readAll()[key] ?? blank());
    setShowSolution(false);
  }, [key]);

  const update = (fn: (t: TicketState) => TicketState) =>
    setSt((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(STORE, JSON.stringify({ ...readAll(), [key]: next }));
      } catch {
        /* storage blocked: the scratch copy just won't survive a reload */
      }
      return next;
    });

  const others = ticket.task.files.filter((f) => f.readOnly && !f.path.endsWith("Test.java"));

  return (
    <div className="preview-frame">
      <div className="preview-banner" role="status">
        <strong>👩‍🏫 Teacher preview</strong>
        <LevelPill level={ticket.learningGoal.level} />
        <span className="small muted preview-banner-text">Your own scratch copy, saved in this browser only. Students never see it.</span>
        <span className="spacer" />
        <button className="btn small" onClick={() => setShowSolution((v) => !v)} aria-expanded={showSolution}>
          {showSolution ? "Hide solution" : "🔑 Reference solution"}
        </button>
        <button className="btn small ghost" onClick={() => update(() => blank())} title="Clear your scratch code, test results and answers for this ticket">↺ Start over</button>
      </div>
      {showSolution && (
        <aside className="solution-drawer card" aria-label="Reference solution">
          <div>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 6 }}><span className="small muted">{ticket.task.mainClass}.java · one correct answer</span><button className="btn small ghost" onClick={() => setShowSolution(false)} aria-label="Close the solution">✕</button></div>
            {solution ? (
              <pre className="console" style={{ color: "var(--text)", fontSize: 14, margin: 0 }}>{solution}</pre>
            ) : (
              <p className="muted" style={{ margin: 0 }}>There is no reference solution for this ticket yet.</p>
            )}
            {others.map((f) => (
              <details key={f.path}>
                <summary className="small muted">{f.path} (given, unchanged)</summary>
                <pre className="console" style={{ color: "var(--text)" }}>{f.content}</pre>
              </details>
            ))}
          </div>
        </aside>
      )}
      <RemoteTicketProvider
        value={{
          key,
          st,
          update,
          links: { board: "/admin/tickets", boardLabel: "All tickets", ticket: (id) => `/admin/tickets/${sprint.id}/${id}` },
        }}
      >
        <Workspace key={key} sprintId={sprintId} ticketId={ticketId} />
      </RemoteTicketProvider>
    </div>
  );
}
