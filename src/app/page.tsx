"use client";

import Link from "next/link";
import { projects } from "@/content/registry";
import { getTicketState, levelOf, ticketKey, useStore, xpOf } from "@/lib/progress";
import { isLocked } from "@/lib/ticket-status";
import { xpByKey } from "@/components/AppShell";

export default function DashboardPage() {
  const store = useStore();
  const xp = xpOf(store, xpByKey);
  const level = levelOf(xp);
  const name = store?.profile?.name ?? "Junior Dev";

  return (
    <div className="page">
      <p className="muted small" style={{ margin: 0 }}>PixelForge Studio · Developer Portal</p>
      <h1>早安，{name} 👋</h1>
      <p className="muted">你是團隊的 <strong>Junior Developer</strong>。完成 ticket、通過測試、merge 你的程式碼，一起把產品做出來。</p>

      <div className="grid2" style={{ marginTop: 18 }}>
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
        {projects.map((p) => {
          const merged = p.tickets.filter((t) => getTicketState(store, ticketKey(p.id, t.id)).status === "merged").length;
          const next = p.tickets.find((t) => getTicketState(store, ticketKey(p.id, t.id)).status !== "merged" && !isLocked(store, p, t));
          return (
            <div className="card" key={p.id}>
              <div className="small muted">{p.course} · {p.unit}</div>
              <div className="stat" style={{ fontSize: 20 }}>{p.title}</div>
              <div className="progress" style={{ margin: "8px 0 4px" }}>
                <div style={{ width: `${(merged / p.tickets.length) * 100}%` }} />
              </div>
              <div className="small muted">{merged} / {p.tickets.length} 張 ticket 已 merge</div>
              <div className="row" style={{ marginTop: 12 }}>
                {next && (
                  <Link className="btn primary" href={`/projects/${p.id}/tickets/${next.id}`}>
                    繼續：{next.id} →
                  </Link>
                )}
                <Link className="btn" href={`/projects/${p.id}`}>看專案看板</Link>
              </div>
            </div>
          );
        })}
      </div>

      <h2>專案</h2>
      {projects.map((p) => (
        <div key={p.id} className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="small muted">{p.company}</div>
              <h3 style={{ margin: "2px 0" }}>{p.title}</h3>
            </div>
            <Link className="btn" href={`/projects/${p.id}`}>打開 →</Link>
          </div>
          <p>{p.description}</p>
          <p className="small muted" style={{ marginBottom: 0 }}>Tech Lead：{p.techLead.avatar} {p.techLead.name} · 下一個 sprint：{p.upcoming.map((u) => u.title.split(" ")[1]).join("、")}</p>
        </div>
      ))}
    </div>
  );
}
