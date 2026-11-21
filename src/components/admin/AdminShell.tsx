"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SITE_NAME } from "@/content/registry";
import { ADMIN_EVENT, adminFetch, adminPassword, setAdminPassword } from "@/lib/admin";
import { ThemeToggle } from "../ThemeToggle";
import { type Lobby, useLiveLobby } from "../live/LiveLobby";

type Account = { username: string };
type AdminCtx = { password: string; accounts: string[]; reloadAccounts: () => void; lobby: Lobby };

const Ctx = createContext<AdminCtx>({ password: "", accounts: [], reloadAccounts: () => {}, lobby: { state: "connecting", local: false, entries: [] } });
/** The logged-in admin password and the account list, for any page under /admin. */
export const useAdmin = () => useContext(Ctx);

/**
 * Shared frame for every /admin page: one top bar with the admin menu (current section highlighted)
 * and one login gate, so subpages never show the student menu or their own login form.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  // undefined = not read from storage yet (first render), null = logged out.
  const [password, setPassword] = useState<string | null | undefined>(undefined);
  const [accounts, setAccounts] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setPassword(adminPassword());
    sync();
    window.addEventListener(ADMIN_EVENT, sync);
    window.addEventListener("storage", sync); // login or logout in another tab
    return () => {
      window.removeEventListener(ADMIN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const reloadAccounts = useCallback(() => {
    adminFetch<{ accounts: Account[] }>("/api/admin/accounts")
      .then((a) => setAccounts(a.accounts.map((x) => x.username)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (password) reloadAccounts();
  }, [password, reloadAccounts]);

  // One lobby connection for the whole admin, so the Live button can show who is in a session right now.
  const lobby = useLiveLobby(password ?? null);

  return (
    <>
      <AdminTopbar loggedIn={!!password} live={lobby.state === "ok" ? lobby.entries.length : null} />
      <main>
        {password === undefined ? null : password ? (
          <Ctx.Provider value={{ password, accounts, reloadAccounts, lobby }}>{children}</Ctx.Provider>
        ) : (
          <AdminLogin />
        )}
      </main>
    </>
  );
}

function AdminTopbar({ loggedIn, live }: { loggedIn: boolean; live: number | null }) {
  const path = usePathname();
  const router = useRouter();
  const account = path.match(/^\/admin\/accounts\/([^/]+)/)?.[1];
  const students = path === "/admin" || !!account;
  const inLive = path.startsWith("/admin/live");
  const item = (href: string, label: string, on: boolean) => (
    <Link href={href} className={on ? "active" : undefined} aria-current={on ? "page" : undefined}>{label}</Link>
  );

  return (
    <header className="topbar">
      <Link href="/admin" className="brand">
        <span aria-hidden>☕</span> <span className="brand-text">{SITE_NAME}</span>
        <span className="admin-tag">Teacher</span>
      </Link>
      {loggedIn && (
        <nav className="topnav admin-nav" aria-label="Admin menu">
          {item("/admin", "Students", students)}
          {account && <span className="crumb" aria-hidden>› {decodeURIComponent(account)}</span>}
          {item("/admin/tickets", "Tickets", path.startsWith("/admin/tickets"))}
          {item("/admin/notes", "Notes", path.startsWith("/admin/notes"))}
          {item("/admin/usage", "AI usage", path.startsWith("/admin/usage"))}
        </nav>
      )}
      <div className="spacer" />
      {loggedIn && (
        <Link
          href="/admin/live"
          className={`btn small live-cta${live ? " on" : ""}${inLive ? " current" : ""}`}
          aria-current={inLive ? "page" : undefined}
          title={live ? `${live} student${live === 1 ? "" : "s"} working on a ticket right now` : "See who is working on a ticket right now"}
        >
          <span className={`live-dot${live ? "" : " off"}`} aria-hidden /> Live{live ? ` · ${live}` : ""}
        </Link>
      )}
      <ThemeToggle />
      {loggedIn && (
        <button className="btn small ghost" onClick={() => { setAdminPassword(null); router.push("/admin"); }}>Log out</button>
      )}
    </header>
  );
}

function AdminLogin() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/accounts", { headers: { "X-Admin-Password": pw } });
      if (res.ok) return setAdminPassword(pw);
      const body = await res.json().catch(() => null);
      setErr(typeof body?.detail === "string" ? body.detail : `Error ${res.status}`);
    } catch {
      setErr("Cannot reach the backend (FastAPI). Make sure it is running.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 480 }}>
      <h1>Teacher admin</h1>
      <p className="muted">Student progress, tickets, live sessions, notes and AI usage. The password is <code>ADMIN_PASSWORD</code> from the environment.</p>
      <form className="card" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label htmlFor="pw" className="small muted">Admin password</label>
        <div className="row" style={{ marginTop: 6 }}>
          <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ flex: 1 }} autoFocus autoComplete="current-password" />
          <button className="btn primary" disabled={!pw || busy}>{busy ? "Checking…" : "Log in"}</button>
        </div>
        {err && <div className="callout warn" role="alert">{err}</div>}
      </form>
    </div>
  );
}
