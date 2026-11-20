"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { currentSprint, SITE_NAME, sprints } from "@/content/registry";
import { levelOf, login, logout, ticketKey, useStore, xpOf } from "@/lib/progress";
import { ChatWidget } from "./ChatWidget";
import { ThemeToggle } from "./ThemeToggle";
import { WorkspaceProvider } from "./WorkspaceContext";

export const xpByKey: Record<string, number> = Object.fromEntries(
  sprints.flatMap((p) => p.tickets.map((t) => [ticketKey(p.id, t.id), t.xp])),
);

export function AppShell({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const path = usePathname();
  const isAdmin = path.startsWith("/admin");
  const xp = xpOf(store, xpByKey);
  const level = levelOf(xp);
  const cur = currentSprint();

  return (
    <WorkspaceProvider>
      <header className="topbar">
        <Link href="/" className="brand">
          <span aria-hidden>☕</span> <span className="brand-text">{SITE_NAME}</span>
        </Link>
        <nav className="topnav" aria-label="主選單">
          <Link href="/" className={path === "/" ? "active" : ""}>我的工作台</Link>
          {cur && <Link href={`/sprints/${cur.id}`} className={path.startsWith("/sprints") ? "active" : ""}>Sprint 看板</Link>}
        </nav>
        <div className="spacer" />
        <ThemeToggle />
        {store?.profile && !isAdmin && (
          <div className="badge-level" title={`${xp} XP`}>
            <span className="avatar" aria-hidden>{store.profile.name.slice(0, 1).toUpperCase()}</span>
            <span className="level-text">
              <strong style={{ color: "var(--text)" }}>{store.profile.name}</strong> · {level.title} · {xp} XP
            </span>
            <button className="btn small ghost" onClick={logout} title="登出（換帳號）">登出</button>
          </div>
        )}
      </header>
      <main>{children}</main>
      {store && !store.auth && !isAdmin && <Login />}
      {!isAdmin && store?.profile && <ChatWidget />}
    </WorkspaceProvider>
  );
}

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <form
        className="card modal"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(await login(username, password));
          setBusy(false);
        }}
      >
        <div style={{ fontSize: 34 }} aria-hidden>👋</div>
        <h1 id="login-title">歡迎回來，Junior Developer</h1>
        <p className="muted">登入你的帳號，進度會存在雲端，換電腦也接得上。</p>
        <label htmlFor="login-user" className="small muted">帳號</label>
        <input id="login-user" type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" autoFocus style={{ width: "100%", marginTop: 4 }} />
        <label htmlFor="login-pw" className="small muted" style={{ display: "block", marginTop: 10 }}>密碼</label>
        <input id="login-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" style={{ width: "100%", marginTop: 4 }} />
        {err && <div className="callout warn" role="alert">{err}</div>}
        <button className="btn primary" type="submit" disabled={!username.trim() || !password || busy} style={{ marginTop: 14, width: "100%" }}>
          {busy ? "登入中…" : "登入 🚀"}
        </button>
      </form>
    </div>
  );
}
