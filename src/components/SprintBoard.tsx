"use client";

import Link from "next/link";
import { getSprint } from "@/content/registry";
import { getTicketState, ticketKey, type TicketStatus, useStore } from "@/lib/progress";
import { isLocked, sprintProgress, STATUS_LABEL } from "@/lib/ticket-status";
import { SprintProgressBar } from "./SprintProgressBar";

const COLUMNS: TicketStatus[] = ["todo", "in_progress", "in_review", "merged"];

export function SprintBoard({ sprintId }: { sprintId: string }) {
  const sprint = getSprint(sprintId)!;
  const store = useStore();
  const prog = sprintProgress(store, sprint);

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

      <div className="board" style={{ marginTop: 16 }}>
        {COLUMNS.map((col) => (
          <section key={col} className="column" aria-label={STATUS_LABEL[col]}>
            <h3>{STATUS_LABEL[col]}</h3>
            {sprint.tickets
              .filter((t) => getTicketState(store, ticketKey(sprint.id, t.id)).status === col)
              .map((t) => {
                const st = getTicketState(store, ticketKey(sprint.id, t.id));
                const locked = isLocked(store, sprint, t);
                return (
                  <Link key={t.id} href={`/sprints/${sprint.id}/tickets/${t.id}`} className={`ticket-card${locked ? " locked" : ""}`}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span className="ticket-id">{t.id}</span>
                      <span className="small muted">{t.xp} XP</span>
                    </div>
                    <div style={{ fontWeight: 600, margin: "4px 0" }}>{t.title}</div>
                    <div className="small muted">
                      {locked && `🔒 Finish ${t.dependsOn.join(", ")} first`}
                      {st.lastTest && `${locked ? " · " : ""}tests ${st.lastTest.passed}/${st.lastTest.total}`}
                      {st.status === "merged" && (st.tutorVerified ? " · ✅ reviewed by teacher" : " · waiting for teacher review")}
                    </div>
                  </Link>
                );
              })}
          </section>
        ))}
      </div>

      {sprint.backlog.length > 0 && (
        <>
          <h2>Backlog: tickets coming later</h2>
          <div className="grid2">
            {sprint.backlog.map((u) => (
              <div key={u.title} className="card" style={{ opacity: 0.75 }}>
                <strong>{u.title}</strong>
                <div className="small muted">{u.note} · 🔒 coming soon</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
