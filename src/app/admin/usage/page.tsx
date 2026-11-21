"use client";

import { useEffect, useState } from "react";
import { AdminError, adminFetch } from "@/lib/admin";

type Usage = {
  month: { requests: number; prompt_tokens: number; completion_tokens: number; estimated_cost_usd: number };
  by_student: { student_id: string; name: string; requests: number; chat: number; debug: number; prompt_tokens: number; completion_tokens: number; estimated_cost_usd: number; last: string }[];
  by_day: { day: string; requests: number; tokens: number; estimated_cost_usd: number }[];
  failures: { status: string; count: number; last: string }[];
  last_quota_exhausted: string | null;
  recent: { ts: string; student_name: string; kind: string; ticket_id: string | null; model: string | null; prompt_tokens: number; completion_tokens: number; status: string; error: string | null }[];
  window_days: number;
  config: { model: string; ai_configured: boolean; daily_limit_per_student: number; price_input_per_1m: number; price_output_per_1m: number };
};

const STATUS_TEXT: Record<string, string> = {
  ok: "OK",
  quota_exhausted: "Quota used up (429)",
  rate_limited: "Too frequent (429)",
  daily_limit: "Over daily per-student limit",
  not_configured: "API key not set",
  error: "Other error",
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { hour12: false }) : "—");
const n = (x: number) => x.toLocaleString("en-US");

export default function AdminUsagePage() {
  const [data, setData] = useState<Usage | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      setData(await adminFetch<Usage>("/api/admin/usage?days=30"));
    } catch (e) {
      setErr(e instanceof AdminError ? e.message : "Cannot reach the backend (FastAPI). Make sure it is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!data) return <div className="page">{err ? <div className="callout warn" role="alert">{err}</div> : <p className="muted">Loading…</p>}</div>;

  const maxDay = Math.max(1, ...data.by_day.map((d) => d.requests));
  const quotaRecent = data.last_quota_exhausted && Date.now() - new Date(data.last_quota_exhausted).getTime() < 3 * 24 * 3600 * 1000;

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>AI usage</h1>
          <p className="muted small" style={{ margin: 0 }}>
            Model <code>{data.config.model}</code> · API key {data.config.ai_configured ? "✅ set" : "❌ not set"} · limit per student per 24 h: {data.config.daily_limit_per_student || "none"}
          </p>
        </div>
        <button className="btn" onClick={load} disabled={loading}>↻ Refresh</button>
      </div>

      {quotaRecent && (
        <div className="callout warn" role="alert" style={{ marginTop: 14 }}>
          <strong>⚠️ OpenAI quota used up</strong> (last: {fmt(data.last_quota_exhausted)}). Students now see "contact your teacher". Raise the project's monthly limit in the OpenAI dashboard, or wait for next month's reset.
        </div>
      )}

      <div className="grid2" style={{ marginTop: 16, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="card"><div className="small muted">Successful requests this month</div><div className="stat">{n(data.month.requests)}</div></div>
        <div className="card"><div className="small muted">Tokens this month (in / out)</div><div className="stat" style={{ fontSize: 20 }}>{n(data.month.prompt_tokens)} / {n(data.month.completion_tokens)}</div></div>
        <div className="card">
          <div className="small muted">Estimated cost this month</div>
          <div className="stat">${data.month.estimated_cost_usd.toFixed(2)}</div>
          <div className="small muted">At ${data.config.price_input_per_1m} / ${data.config.price_output_per_1m} per 1M tokens; your OpenAI bill is the real number</div>
        </div>
        <div className="card">
          <div className="small muted">Failures (last {data.window_days} days)</div>
          {data.failures.length === 0 ? <div className="stat">0</div> : data.failures.map((f) => <div key={f.status} className="small">{STATUS_TEXT[f.status] ?? f.status}: <strong>{f.count}</strong> (last {fmt(f.last)})</div>)}
        </div>
      </div>

      <h2>Requests per day (last {data.window_days} days)</h2>
      <div className="card">
        {data.by_day.length === 0 ? (
          <p className="muted small">No data yet.</p>
        ) : (
          <>
            <div className="bars" role="img" aria-label="Requests per day chart">
              {data.by_day.map((d) => (
                <div key={d.day} style={{ height: `${(d.requests / maxDay) * 100}%` }} title={`${d.day}: ${d.requests} requests, ${n(d.tokens)} tokens, $${d.estimated_cost_usd}`} />
              ))}
            </div>
            <div className="row small muted" style={{ justifyContent: "space-between" }}>
              <span>{data.by_day[0].day}</span>
              <span>{data.by_day.at(-1)!.day}</span>
            </div>
          </>
        )}
      </div>

      <h2>By student (last {data.window_days} days)</h2>
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr><th>Student</th><th>Requests</th><th>Chat</th><th>Debug button</th><th>Tokens</th><th>Est. cost</th><th>Last used</th></tr>
          </thead>
          <tbody>
            {data.by_student.length === 0 && <tr><td colSpan={7} className="muted">No data yet.</td></tr>}
            {data.by_student.map((s) => (
              <tr key={s.student_id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.requests}</td>
                <td>{s.chat}</td>
                <td>{s.debug}</td>
                <td>{n(s.prompt_tokens + s.completion_tokens)}</td>
                <td>${s.estimated_cost_usd.toFixed(3)}</td>
                <td className="small">{fmt(s.last)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Latest 50 requests</h2>
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr><th>Time</th><th>Student</th><th>Type</th><th>Ticket</th><th>Tokens</th><th>Status</th></tr>
          </thead>
          <tbody>
            {data.recent.map((r, i) => (
              <tr key={i}>
                <td className="small">{fmt(r.ts)}</td>
                <td>{r.student_name}</td>
                <td>{r.kind === "chat" ? "💬 Chat" : "🤖 Debug"}</td>
                <td>{r.ticket_id ?? "—"}</td>
                <td>{r.prompt_tokens + r.completion_tokens || "—"}</td>
                <td><span className={`pill ${r.status === "ok" ? "merged" : "in_review"}`} title={r.error ?? ""}>{STATUS_TEXT[r.status] ?? r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted">"Student" is the account name used to log in.</p>
    </div>
  );
}
