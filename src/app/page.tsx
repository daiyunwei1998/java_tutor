"use client";

import Link from "next/link";
import { currentSprint, SITE_NAME, sprints } from "@/content/registry";
import type { Sprint } from "@/content/types";
import { getTicketState, levelOf, ticketKey, useStore, xpOf } from "@/lib/progress";
import { sprintProgress } from "@/lib/ticket-status";
import { xpByKey } from "@/components/AppShell";
import { SprintProgressBar } from "@/components/SprintProgressBar";

const STATUS_TEXT: Record<Sprint["status"], string> = { current: "This week", done: "Finished", upcoming: "Coming soon" };

export default function DashboardPage() {
  const store = useStore();
  const xp = xpOf(store, xpByKey);
  const level = levelOf(xp);
  const name = store?.profile?.name ?? "Junior Dev";
  const cur = currentSprint();
  const others = sprints.filter((s) => s !== cur);

  return (
    <div className="page">
      <p className="muted small" style={{ margin: 0 }}>{SITE_NAME}</p>
      <h1>Hi, {name} 👋</h1>
      <p className="muted">You are a <strong>Junior Developer</strong>. Each sprint you join a new mini project: finish tickets, pass the tests, and merge your code.</p>

      <div className="grid2" style={{ marginTop: 18 }}>
        {cur && <SprintCard sprint={cur} store={store} highlight />}
        <div className="card">
          <div className="small muted">Your level</div>
          <div className="stat">{level.title}</div>
          <div className="progress" style={{ margin: "8px 0 4px" }} aria-label="Level progress">
            <div style={{ width: `${Math.round(level.progress * 100)}%` }} />
          </div>
          <div className="small muted">
            {xp} XP{level.next ? ` · ${level.next.min - xp} XP to ${level.next.title}` : " · top level reached"}
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <>
          <h2>All sprints</h2>
          <div className="grid2">
            {others.map((s) => <SprintCard key={s.id} sprint={s} store={store} />)}
          </div>
        </>
      )}
    </div>
  );
}

function SprintCard({ sprint, store, highlight }: { sprint: Sprint; store: ReturnType<typeof useStore>; highlight?: boolean }) {
  const prog = sprintProgress(store, sprint);
  const next = sprint.tickets.find((t) => getTicketState(store, ticketKey(sprint.id, t.id)).status !== "merged");
  const upcoming = sprint.status === "upcoming";
  return (
    <div className="card" style={highlight ? { borderColor: "var(--accent)" } : upcoming ? { opacity: 0.7 } : undefined}>
      <div className="small muted">
        Sprint {sprint.number} · {STATUS_TEXT[sprint.status]}{sprint.dates ? ` · ${sprint.dates}` : ""}
      </div>
      <div className="stat" style={{ fontSize: 22 }}>{sprint.topic}</div>
      <div className="small muted" style={{ marginBottom: 10 }}>
        Mini project: {sprint.project.name} @ {sprint.project.company} · {sprint.unit}
      </div>
      {!upcoming && <SprintProgressBar {...prog} />}
      {!upcoming && (
        <div className="row" style={{ marginTop: 12 }}>
          {next && <Link className="btn primary" href={`/sprints/${sprint.id}/tickets/${next.id}`}>Continue: {next.id} →</Link>}
          <Link className="btn" href={`/sprints/${sprint.id}`}>Sprint board</Link>
        </div>
      )}
    </div>
  );
}
