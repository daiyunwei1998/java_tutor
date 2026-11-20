"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { projects } from "@/content/registry";
import { levelOf, setProfile, ticketKey, useStore, xpOf } from "@/lib/progress";
import { ChatWidget } from "./ChatWidget";
import { ThemeToggle } from "./ThemeToggle";
import { WorkspaceProvider } from "./WorkspaceContext";

export const xpByKey: Record<string, number> = Object.fromEntries(
  projects.flatMap((p) => p.tickets.map((t) => [ticketKey(p.id, t.id), t.xp])),
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const path = usePathname();
  const isAdmin = path.startsWith("/admin");
  const xp = xpOf(store, xpByKey);
  const level = levelOf(xp);

  return (
    <WorkspaceProvider>
      <header className="topbar">
        <Link href="/" className="brand">
          <span aria-hidden>🧩</span> <span className="brand-text">PixelForge Dev HQ</span>
        </Link>
        <nav className="topnav" aria-label="主選單">
          <Link href="/" className={path === "/" ? "active" : ""}>我的工作台</Link>
          <Link href="/projects/mini-photoshop" className={path.startsWith("/projects") ? "active" : ""}>專案看板</Link>
        </nav>
        <div className="spacer" />
        <ThemeToggle />
        {store?.profile && !isAdmin && (
          <div className="badge-level" title={`${xp} XP`}>
            <span className="avatar" aria-hidden>{store.profile.name.slice(0, 1).toUpperCase()}</span>
            <span className="level-text">
              <strong style={{ color: "var(--text)" }}>{store.profile.name}</strong> · {level.title} · {xp} XP
            </span>
          </div>
        )}
      </header>
      <main>{children}</main>
      {store && !store.profile && !isAdmin && <Onboarding />}
      {!isAdmin && store?.profile && <ChatWidget />}
    </WorkspaceProvider>
  );
}

function Onboarding() {
  const [name, setName] = useState("");
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="onb-title">
      <form
        className="card modal"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) setProfile(name);
        }}
      >
        <div style={{ fontSize: 34 }} aria-hidden>👋</div>
        <h1 id="onb-title">歡迎加入 PixelForge Studio</h1>
        <p className="muted">
          從今天起，你是我們團隊的 <strong>Junior Developer</strong>。你會接到真正的 ticket、寫 Java、跑測試，最後把功能 merge 進產品。
        </p>
        <label htmlFor="onb-name" className="small muted">你的名字（會顯示在工作台，也讓老師看到誰在問 AI）</label>
        <div className="row" style={{ marginTop: 6 }}>
          <input id="onb-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus style={{ flex: 1 }} placeholder="例如：小明" />
          <button className="btn primary" type="submit" disabled={!name.trim()}>報到 🚀</button>
        </div>
      </form>
    </div>
  );
}
