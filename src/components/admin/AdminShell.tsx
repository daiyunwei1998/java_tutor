"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SITE_NAME } from "@/content/registry";
import { ADMIN_EVENT, adminFetch, adminPassword, setAdminPassword } from "@/lib/admin";
import { ThemeToggle } from "../ThemeToggle";

type Account = { username: string };
type AdminCtx = { password: string; accounts: string[]; reloadAccounts: () => void };

const Ctx = createContext<AdminCtx>({ password: "", accounts: [], reloadAccounts: () => {} });
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

  return (
    <>
      <AdminTopbar loggedIn={!!password} accounts={accounts} />
      <main>
        {password === undefined ? null : password ? (
          <Ctx.Provider value={{ password, accounts, reloadAccounts }}>{children}</Ctx.Provider>
        ) : (
          <AdminLogin />
        )}
      </main>
    </>
  );
}

function AdminTopbar({ loggedIn, accounts }: { loggedIn: boolean; accounts: string[] }) {
  const path = usePathname();
  const router = useRouter();
  const account = path.match(/^\/admin\/accounts\/([^/]+)/)?.[1];
  const live = path.match(/^\/admin\/live\/([^/]+)/)?.[1];
  const current = account ? decodeURIComponent(account) : "";
  const cls = (on: boolean) => (on ? "active" : undefined);

  return (
    <header className="topbar">
      <Link href="/admin" className="brand">
        <span aria-hidden>☕</span> <span className="brand-text">{SITE_NAME}</span>
        <span className="admin-tag">Teacher</span>
      </Link>
      {loggedIn && (
        <nav className="topnav admin-nav" aria-label="Admin menu">
          <Link href="/admin" className={cls(path === "/admin")} aria-current={path === "/admin" ? "page" : undefined}>Overview</Link>
          <label className={`admin-nav-select${account ? " active" : ""}`}>
            <span className="sr-only">Open a student</span>
            <select
              value={current}
              onChange={(e) => e.target.value && router.push(`/admin/accounts/${encodeURIComponent(e.target.value)}`)}
              aria-current={account ? "page" : undefined}
            >
              <option value="">Students</option>
              {current && !accounts.includes(current) && <option value={current}>{current}</option>}
              {accounts.map((u) => <option key={u} value={u}>👤 {u}</option>)}
            </select>
          </label>
          <Link href="/admin/notes" className={cls(path.startsWith("/admin/notes"))} aria-current={path.startsWith("/admin/notes") ? "page" : undefined}>Notes</Link>
          <Link href="/admin/usage" className={cls(path.startsWith("/admin/usage"))} aria-current={path.startsWith("/admin/usage") ? "page" : undefined}>AI usage</Link>
          {live && <span className="active live-crumb" aria-current="page"><span className="live-dot" aria-hidden /> Live: {decodeURIComponent(live)}</span>}
        </nav>
      )}
      <div className="spacer" />
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
      <p className="muted">Student accounts, live sessions, notes and AI usage. The password is <code>ADMIN_PASSWORD</code> from the environment.</p>
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
