"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sprints } from "@/content/registry";
import { useAdmin } from "@/components/admin/AdminShell";
import { AdminError, adminFetch } from "@/lib/admin";

type Account = { username: string; updated_at: string | null; merged: number; in_review: number; in_progress: number; starred?: string[] };
type TimeRow = { username: string; ticket: string; active_ms: number; first_at: string; last_at: string };

/** 75 s → "1m", 3720 s → "1h 2m". Under a minute shows seconds. */
function dur(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { hour12: false }) : "—");

export default function AdminPage() {
  const { password: pw, reloadAccounts } = useAdmin();
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [confirm, setConfirm] = useState<null | "reset" | "sync">(null);
  const [accMsg, setAccMsg] = useState<string | null>(null);
  const [time, setTime] = useState<TimeRow[]>([]);

  async function loadTime() {
    const t = await adminFetch<{ time: TimeRow[] }>("/api/admin/time").catch(() => null);
    setTime(t?.time ?? []);
  }

  async function accountAction(kind: "reset" | "sync") {
    if (confirm !== kind) {
      setConfirm(kind);
      setAccMsg(null);
      return;
    }
    setConfirm(null);
    const res = await fetch(kind === "reset" ? "/api/admin/accounts/test/reset" : "/api/admin/accounts/sync", {
      method: "POST",
      headers: { "X-Admin-Password": pw, "Content-Type": "application/json" },
      body: kind === "sync" ? JSON.stringify({ source: "stu", target: "test" }) : undefined,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setAccMsg(`Failed: ${body?.detail ?? res.status}`);
      return;
    }
    setAccounts(body.accounts);
    loadTime();
    setAccMsg(kind === "reset" ? "✅ test progress cleared." : "✅ Copied stu progress to test.");
  }

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const acc = await adminFetch<{ accounts: Account[] }>("/api/admin/accounts");
      setAccounts(acc.accounts ?? []);
      reloadAccounts();
      await loadTime();
    } catch (e) {
      setErr(e instanceof AdminError ? e.message : "Cannot reach the backend (FastAPI). Make sure it is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>Students</h1>
          <p className="muted small" style={{ margin: 0 }}>Read-only view of each student&apos;s progress. Open a student to see their board, ticket summaries and code.</p>
        </div>
        <button className="btn" onClick={load} disabled={loading}>↻ Refresh</button>
      </div>
      {err && <div className="callout warn" role="alert">{err}</div>}

      <QuotaWarning />

      <h2>Accounts</h2>
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr><th>Account</th><th>Merged</th><th>Tests passed</th><th>In progress</th><th>Last sync</th></tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.username}>
                <td>
                  <Link href={`/admin/accounts/${encodeURIComponent(a.username)}`}><strong>{a.username}</strong></Link>{" "}
                  <Link className="btn small" href={`/admin/accounts/${encodeURIComponent(a.username)}#board`}>🗂 Board &amp; notes</Link>
                </td>
                <td>{a.merged}</td>
                <td>{a.in_review}</td>
                <td>{a.in_progress}</td>
                <td className="small">{fmt(a.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <button className={`btn${confirm === "reset" ? " primary" : ""}`} onClick={() => accountAction("reset")}>
            {confirm === "reset" ? "Clear all test progress? Click again" : "↺ Reset test"}
          </button>
          <button className={`btn${confirm === "sync" ? " primary" : ""}`} onClick={() => accountAction("sync")}>
            {confirm === "sync" ? "Overwrite test with stu? Click again" : "⇢ Sync stu to test"}
          </button>
          {confirm && <button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button>}
          {accMsg && <span className="small" role="status">{accMsg}</span>}
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>An open tab logged in as test picks up the new progress when you switch back to it. stu is never changed.</p>
      </div>

      <TimeTable accounts={accounts} time={time} />

    </div>
  );
}

/** Active time per student per ticket: tickets down, accounts across. ⭐ = the student starred it. */
function TimeTable({ accounts, time }: { accounts: Account[]; time: TimeRow[] }) {
  const byCell = new Map(time.map((r) => [`${r.username}|${r.ticket}`, r]));
  const known = sprints.flatMap((s) => s.tickets.map((t) => ({ key: `${s.id}/${t.id}`, label: `${t.id} ${t.title}`, sprint: s.number })));
  const extra = [...new Set(time.map((r) => r.ticket))].filter((k) => !known.some((t) => t.key === k)).map((k) => ({ key: k, label: k, sprint: 0 }));
  const rows = [...known, ...extra];
  const starred = new Set(accounts.flatMap((a) => (a.starred ?? []).map((k) => `${a.username}|${k}`)));
  const total = (u: string) => time.filter((r) => r.username === u).reduce((sum, r) => sum + r.active_ms, 0);

  return (
    <>
      <h2>Time on tickets</h2>
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr><th>Ticket</th>{accounts.map((a) => <th key={a.username}>{a.username}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.key}>
                <td className="small">{t.sprint ? `S${t.sprint} · ` : ""}{t.label}</td>
                {accounts.map((a) => {
                  const cell = byCell.get(`${a.username}|${t.key}`);
                  const star = starred.has(`${a.username}|${t.key}`);
                  return (
                    <td key={a.username} title={cell ? `First opened ${fmt(cell.first_at)}, last active ${fmt(cell.last_at)}` : ""}>
                      {cell ? dur(cell.active_ms) : <span className="muted">—</span>}
                      {star && <span title="Starred by the student"> ⭐</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td><strong>Total</strong></td>
              {accounts.map((a) => <td key={a.username}><strong>{dur(total(a.username))}</strong></td>)}
            </tr>
          </tbody>
        </table>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Active time only: the ticket page is open in a visible tab and the student typed, clicked or scrolled in the last 3 minutes. Hover a cell for first and last activity. Reset and sync also clear or copy this time.
        </p>
      </div>
    </>
  );
}

/** Shows the OpenAI quota warning here too, so it is not missed when the AI usage page is closed. */
function QuotaWarning() {
  const [last, setLast] = useState<string | null>(null);
  useEffect(() => {
    adminFetch<{ last_quota_exhausted: string | null }>("/api/admin/usage?days=3")
      .then((u) => setLast(u.last_quota_exhausted))
      .catch(() => {});
  }, []);
  if (!last || Date.now() - new Date(last).getTime() >= 3 * 24 * 3600 * 1000) return null;
  return (
    <div className="callout warn" role="alert" style={{ marginTop: 14 }}>
      <strong>⚠️ OpenAI quota used up</strong> (last: {fmt(last)}). Students now see &quot;contact your teacher&quot;. Details on <Link href="/admin/usage">AI usage</Link>.
    </div>
  );
}
