"use client";

import Link from "next/link";
import { currentSprint, SITE_NAME, sprints } from "@/content/registry";
import type { Sprint } from "@/content/types";
import { getTicketState, levelOf, ticketKey, useStore, xpOf } from "@/lib/progress";
import { isLocked, sprintProgress } from "@/lib/ticket-status";
import { xpByKey } from "@/components/AppShell";
import { SprintProgressBar } from "@/components/SprintProgressBar";

const STATUS_TEXT: Record<Sprint["status"], string> = { current: "本週 Sprint", done: "已結束", upcoming: "即將開始" };

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
      <h1>嗨，{name} 👋</h1>
      <p className="muted">你是 <strong>Junior Developer</strong>。每個 Sprint 你會加入一個新的小專案，完成 ticket、通過測試、merge 你的程式碼。</p>

      <div className="grid2" style={{ marginTop: 18 }}>
        {cur && <SprintCard sprint={cur} store={store} highlight />}
        <div className="card">
          <div className="small muted">你的職級</div>
          <div className="stat">{level.title}</div>
          <div className="progress" style={{ margin: "8px 0 4px" }} aria-label="升級進度">
            <div style={{ width: `${Math.round(level.progress * 100)}%` }} />
          </div>
          <div className="small muted">
            {xp} XP{level.next ? ` · 再 ${level.next.min - xp} XP 升到 ${level.next.title}` : " · 已達最高職級"}
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <>
          <h2>所有 Sprint</h2>
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
  const next = sprint.tickets.find((t) => getTicketState(store, ticketKey(sprint.id, t.id)).status !== "merged" && !isLocked(store, sprint, t));
  const upcoming = sprint.status === "upcoming";
  return (
    <div className="card" style={highlight ? { borderColor: "var(--accent)" } : upcoming ? { opacity: 0.7 } : undefined}>
      <div className="small muted">
        Sprint {sprint.number} · {STATUS_TEXT[sprint.status]}{sprint.dates ? ` · ${sprint.dates}` : ""}
      </div>
      <div className="stat" style={{ fontSize: 22 }}>{sprint.topic}</div>
      <div className="small muted" style={{ marginBottom: 10 }}>
        小專案：{sprint.project.name} @ {sprint.project.company} · {sprint.unit}
      </div>
      {!upcoming && <SprintProgressBar {...prog} />}
      {!upcoming && (
        <div className="row" style={{ marginTop: 12 }}>
          {next && <Link className="btn primary" href={`/sprints/${sprint.id}/tickets/${next.id}`}>繼續：{next.id} →</Link>}
          <Link className="btn" href={`/sprints/${sprint.id}`}>Sprint 看板</Link>
        </div>
      )}
    </div>
  );
}
