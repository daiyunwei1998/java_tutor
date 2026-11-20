"use client";

import { useEffect, useState } from "react";

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
  ok: "成功",
  quota_exhausted: "額度用完 (429)",
  rate_limited: "太頻繁 (429)",
  daily_limit: "超過每人每日上限",
  not_configured: "未設定 API key",
  error: "其他錯誤",
};

type Account = { username: string; updated_at: string | null; merged: number; in_review: number; in_progress: number };

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("zh-TW", { hour12: false }) : "—");
const n = (x: number) => x.toLocaleString("en-US");

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [data, setData] = useState<Usage | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [confirm, setConfirm] = useState<null | "reset" | "sync">(null);
  const [accMsg, setAccMsg] = useState<string | null>(null);

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
      setAccMsg(`失敗：${body?.detail ?? res.status}`);
      return;
    }
    setAccounts(body.accounts);
    setAccMsg(kind === "reset" ? "✅ test 的進度已清空。" : "✅ 已把 stu 的進度複製到 test。");
  }

  async function load(password: string) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/usage?days=30", { headers: { "X-Admin-Password": password } });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setData(null);
        setErr(body?.detail ?? `錯誤 ${res.status}`);
        if (res.status === 401) sessionStorage.removeItem("jt.admin");
        return;
      }
      sessionStorage.setItem("jt.admin", password);
      setData(body);
      const acc = await fetch("/api/admin/accounts", { headers: { "X-Admin-Password": password } }).then((r) => r.json());
      setAccounts(acc.accounts ?? []);
    } catch {
      setErr("連不到後端（FastAPI）。請確認後端有在執行。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem("jt.admin");
    if (saved) {
      setPw(saved);
      load(saved);
    }
  }, []);

  if (!data) {
    return (
      <div className="page" style={{ maxWidth: 480 }}>
        <h1>老師後台</h1>
        <p className="muted">查看學生的 AI 使用量。密碼是 <code>.env</code> 裡的 <code>ADMIN_PASSWORD</code>。</p>
        <form className="card" onSubmit={(e) => { e.preventDefault(); load(pw); }}>
          <label htmlFor="pw" className="small muted">Admin 密碼</label>
          <div className="row" style={{ marginTop: 6 }}>
            <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ flex: 1 }} autoFocus />
            <button className="btn primary" disabled={!pw || loading}>{loading ? "載入中…" : "登入"}</button>
          </div>
          {err && <div className="callout warn" role="alert">{err}</div>}
        </form>
      </div>
    );
  }

  const maxDay = Math.max(1, ...data.by_day.map((d) => d.requests));
  const quotaRecent = data.last_quota_exhausted && Date.now() - new Date(data.last_quota_exhausted).getTime() < 3 * 24 * 3600 * 1000;

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>老師後台 · AI 使用量</h1>
          <p className="muted small" style={{ margin: 0 }}>
            模型 <code>{data.config.model}</code> · API key {data.config.ai_configured ? "✅ 已設定" : "❌ 未設定"} · 每位學生每 24 小時上限 {data.config.daily_limit_per_student || "不限"} 次
          </p>
        </div>
        <div className="row">
          <button className="btn" onClick={() => load(pw)} disabled={loading}>↻ 重新整理</button>
          <button className="btn ghost" onClick={() => { sessionStorage.removeItem("jt.admin"); setData(null); setPw(""); }}>登出</button>
        </div>
      </div>

      {quotaRecent && (
        <div className="callout warn" role="alert" style={{ marginTop: 14 }}>
          <strong>⚠️ OpenAI 額度已用完</strong>（最近一次：{fmt(data.last_quota_exhausted)}）。學生現在會看到「請聯絡老師」。到 OpenAI 後台調整 project 的 monthly limit，或等下個月重置。
        </div>
      )}

      <div className="grid2" style={{ marginTop: 16, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="card"><div className="small muted">本月成功請求</div><div className="stat">{n(data.month.requests)}</div></div>
        <div className="card"><div className="small muted">本月 tokens（輸入 / 輸出）</div><div className="stat" style={{ fontSize: 20 }}>{n(data.month.prompt_tokens)} / {n(data.month.completion_tokens)}</div></div>
        <div className="card">
          <div className="small muted">本月估計花費</div>
          <div className="stat">${data.month.estimated_cost_usd.toFixed(2)}</div>
          <div className="small muted">以 ${data.config.price_input_per_1m} / ${data.config.price_output_per_1m} 每 1M tokens 估算，實際以 OpenAI 帳單為準</div>
        </div>
        <div className="card">
          <div className="small muted">失敗（近 {data.window_days} 天）</div>
          {data.failures.length === 0 ? <div className="stat">0</div> : data.failures.map((f) => <div key={f.status} className="small">{STATUS_TEXT[f.status] ?? f.status}：<strong>{f.count}</strong>（最近 {fmt(f.last)}）</div>)}
        </div>
      </div>

      <h2>學生帳號</h2>
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr><th>帳號</th><th>已 merge</th><th>測試通過</th><th>進行中</th><th>最後同步</th></tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.username}>
                <td><strong>{a.username}</strong></td>
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
            {confirm === "reset" ? "確定清空 test 的進度？再按一次" : "↺ 重設 test"}
          </button>
          <button className={`btn${confirm === "sync" ? " primary" : ""}`} onClick={() => accountAction("sync")}>
            {confirm === "sync" ? "確定用 stu 覆蓋 test？再按一次" : "⇢ 把 stu 同步到 test"}
          </button>
          {confirm && <button className="btn ghost" onClick={() => setConfirm(null)}>取消</button>}
          {accMsg && <span className="small" role="status">{accMsg}</span>}
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>test 帳號開著的分頁會在下次切回來時自動拿到新進度。stu 的進度不會被改動。</p>
      </div>

      <h2>每日請求數（近 {data.window_days} 天）</h2>
      <div className="card">
        {data.by_day.length === 0 ? (
          <p className="muted small">還沒有資料。</p>
        ) : (
          <>
            <div className="bars" role="img" aria-label="每日請求數長條圖">
              {data.by_day.map((d) => (
                <div key={d.day} style={{ height: `${(d.requests / maxDay) * 100}%` }} title={`${d.day}：${d.requests} 次、${n(d.tokens)} tokens、$${d.estimated_cost_usd}`} />
              ))}
            </div>
            <div className="row small muted" style={{ justifyContent: "space-between" }}>
              <span>{data.by_day[0].day}</span>
              <span>{data.by_day.at(-1)!.day}</span>
            </div>
          </>
        )}
      </div>

      <h2>依學生（近 {data.window_days} 天）</h2>
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr><th>學生</th><th>請求</th><th>聊天</th><th>Debug 按鈕</th><th>Tokens</th><th>估計花費</th><th>最近使用</th></tr>
          </thead>
          <tbody>
            {data.by_student.length === 0 && <tr><td colSpan={7} className="muted">還沒有資料。</td></tr>}
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

      <h2>最近 50 筆請求</h2>
      <div className="card table-scroll">
        <table className="data">
          <thead>
            <tr><th>時間</th><th>學生</th><th>類型</th><th>Ticket</th><th>Tokens</th><th>狀態</th></tr>
          </thead>
          <tbody>
            {data.recent.map((r, i) => (
              <tr key={i}>
                <td className="small">{fmt(r.ts)}</td>
                <td>{r.student_name}</td>
                <td>{r.kind === "chat" ? "💬 聊天" : "🤖 Debug"}</td>
                <td>{r.ticket_id ?? "—"}</td>
                <td>{r.prompt_tokens + r.completion_tokens || "—"}</td>
                <td><span className={`pill ${r.status === "ok" ? "merged" : "in_review"}`} title={r.error ?? ""}>{STATUS_TEXT[r.status] ?? r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted">「學生」欄是登入的帳號名稱。</p>
    </div>
  );
}
