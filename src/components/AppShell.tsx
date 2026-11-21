"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { currentSprint, SITE_NAME, sprints } from "@/content/registry";
import { levelOf, login, logout, ticketKey, useStore, xpOf } from "@/lib/progress";
import { ChatWidget } from "./ChatWidget";
import { NotesWidget } from "./NotesWidget";
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

  // Admin pages bring their own top bar and menu (src/app/admin/layout.tsx), never the student one.
  if (isAdmin) return <WorkspaceProvider>{children}</WorkspaceProvider>;

  return (
    <WorkspaceProvider>
      <header className="topbar">
        <Link href="/" className="brand">
          <span aria-hidden>☕</span> <span className="brand-text">{SITE_NAME}</span>
        </Link>
        <nav className="topnav" aria-label="Main menu">
          <Link href="/" className={path === "/" ? "active" : ""}>Dashboard</Link>
          {cur && <Link href={`/sprints/${cur.id}`} className={path.startsWith("/sprints") && !path.includes("/knowledge") ? "active" : ""}>Sprint board</Link>}
          {cur?.knowledge?.length ? <Link href={`/sprints/${cur.id}/knowledge`} className={path.includes("/knowledge") ? "active" : ""}>Knowledge Space</Link> : null}
          {store?.profile && <Link href="/notes" className={path.startsWith("/notes") ? "active" : ""}>My notes</Link>}
        </nav>
        <div className="spacer" />
        <ThemeToggle />
        {store?.profile && (
          <div className="badge-level" title={`${xp} XP`}>
            <span className="avatar" aria-hidden>{store.profile.name.slice(0, 1).toUpperCase()}</span>
            <span className="level-text">
              <strong style={{ color: "var(--text)" }}>{store.profile.name}</strong> · {level.title} · {xp} XP
            </span>
            <button className="btn small ghost" onClick={logout} title="Log out (switch account)">Log out</button>
          </div>
        )}
      </header>
      <main>{children}</main>
      {store && !store.auth && <Login />}
      {store?.profile && <ChatWidget />}
      {store?.profile && <NotesWidget />}
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
        <h1 id="login-title">Welcome back, Junior Developer</h1>
        <p className="muted">Log in to your account. Your progress is saved online, so you can continue on any computer.</p>
        <label htmlFor="login-user" className="small muted">Username</label>
        <input id="login-user" type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" autoFocus style={{ width: "100%", marginTop: 4 }} />
        <label htmlFor="login-pw" className="small muted" style={{ display: "block", marginTop: 10 }}>Password</label>
        <input id="login-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" style={{ width: "100%", marginTop: 4 }} />
        {err && <div className="callout warn" role="alert">{err}</div>}
        <button className="btn primary" type="submit" disabled={!username.trim() || !password || busy} style={{ marginTop: 14, width: "100%" }}>
          {busy ? "Logging in…" : "Log in 🚀"}
        </button>
      </form>
    </div>
  );
}
