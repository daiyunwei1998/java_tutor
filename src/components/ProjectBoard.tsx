"use client";

import Link from "next/link";
import { getProject } from "@/content/registry";
import { getTicketState, ticketKey, type TicketStatus, useStore } from "@/lib/progress";
import { isLocked, STATUS_LABEL } from "@/lib/ticket-status";

const COLUMNS: TicketStatus[] = ["todo", "in_progress", "in_review", "merged"];

export function ProjectBoard({ projectId }: { projectId: string }) {
  const project = getProject(projectId)!;
  const store = useStore();

  return (
    <div className="page" style={{ maxWidth: 1250 }}>
      <p className="muted small" style={{ margin: 0 }}>{project.company} · {project.course} · {project.unit}</p>
      <h1>{project.title} — Sprint Board</h1>
      <p className="muted">{project.tagline}</p>

      <div className="board" style={{ marginTop: 16 }}>
        {COLUMNS.map((col) => (
          <section key={col} className="column" aria-label={STATUS_LABEL[col]}>
            <h3>{STATUS_LABEL[col]}</h3>
            {project.tickets
              .filter((t) => getTicketState(store, ticketKey(project.id, t.id)).status === col)
              .map((t) => {
                const st = getTicketState(store, ticketKey(project.id, t.id));
                const locked = isLocked(store, project, t);
                return (
                  <Link key={t.id} href={`/projects/${project.id}/tickets/${t.id}`} className={`ticket-card${locked ? " locked" : ""}`}>
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <span className="ticket-id">{t.id}</span>
                      <span className="small muted">{t.xp} XP</span>
                    </div>
                    <div style={{ fontWeight: 600, margin: "4px 0" }}>{t.title}</div>
                    <div className="small muted">
                      {locked ? `🔒 先完成 ${t.dependsOn.join("、")}` : t.sprint}
                      {st.lastTest && ` · 測試 ${st.lastTest.passed}/${st.lastTest.total}`}
                      {st.status === "merged" && (st.tutorVerified ? " · ✅ 老師已 review" : " · 等待老師 code review")}
                    </div>
                  </Link>
                );
              })}
          </section>
        ))}
      </div>

      <h2>Backlog：下一個 Sprint</h2>
      <div className="grid2">
        {project.upcoming.map((u) => (
          <div key={u.title} className="card" style={{ opacity: 0.75 }}>
            <strong>{u.title}</strong>
            <div className="small muted">{u.note} · 🔒 即將推出</div>
          </div>
        ))}
      </div>
    </div>
  );
}
