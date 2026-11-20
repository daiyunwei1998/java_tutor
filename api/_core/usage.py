"""SQLite log of every AI request, so the tutor can see usage on the admin page."""
from __future__ import annotations

import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

_lock = threading.Lock()
_db_path: Path | None = None
_pg_url: str | None = None

_COLUMNS = """
    ts TEXT NOT NULL,                -- UTC ISO timestamp
    student_id TEXT NOT NULL,
    student_name TEXT NOT NULL,
    kind TEXT NOT NULL,              -- 'chat' | 'debug'
    ticket_id TEXT,
    model TEXT,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    status TEXT NOT NULL,            -- ok | quota_exhausted | rate_limited | daily_limit | not_configured | error
    error TEXT
"""
SCHEMA_SQLITE = [
    f"CREATE TABLE IF NOT EXISTS ai_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, {_COLUMNS})",
    "CREATE INDEX IF NOT EXISTS idx_ai_requests_ts ON ai_requests(ts)",
    "CREATE INDEX IF NOT EXISTS idx_ai_requests_student ON ai_requests(student_id, ts)",
]
SCHEMA_PG = [
    f"CREATE TABLE IF NOT EXISTS ai_requests (id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, {_COLUMNS})",
    "CREATE INDEX IF NOT EXISTS idx_ai_requests_ts ON ai_requests(ts)",
    "CREATE INDEX IF NOT EXISTS idx_ai_requests_student ON ai_requests(student_id, ts)",
]


def init(database_url: str | None, db_path: Path) -> None:
    """Uses Postgres when DATABASE_URL is set (Vercel Postgres / Neon), otherwise a local SQLite file."""
    global _db_path, _pg_url
    _pg_url = database_url
    if not _pg_url:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        _db_path = db_path
    with _conn() as c:
        for stmt in SCHEMA_PG if _pg_url else SCHEMA_SQLITE:
            c.execute(stmt)


def backend_name() -> str:
    return "postgres" if _pg_url else f"sqlite ({_db_path})"


class _PgConn:
    """Tiny adapter so the same '?'-style SQL and row['col'] access work on psycopg."""

    def __init__(self, conn):
        self._c = conn

    def execute(self, sql: str, params: tuple = ()):
        cur = self._c.cursor()
        cur.execute(sql.replace("?", "%s"), params)
        return cur


@contextmanager
def _conn():
    if _pg_url:
        import psycopg
        from psycopg.rows import dict_row

        with psycopg.connect(_pg_url, row_factory=dict_row, connect_timeout=10) as conn:
            yield _PgConn(conn)
        return
    assert _db_path is not None, "usage.init() not called"
    with _lock:
        conn = sqlite3.connect(_db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def record(*, student_id: str, student_name: str, kind: str, ticket_id: str | None, model: str | None,
           prompt_tokens: int = 0, completion_tokens: int = 0, status: str, error: str | None = None) -> None:
    with _conn() as c:
        c.execute(
            "INSERT INTO ai_requests (ts, student_id, student_name, kind, ticket_id, model, prompt_tokens,"
            " completion_tokens, status, error) VALUES (?,?,?,?,?,?,?,?,?,?)",
            (now_iso(), student_id, student_name, kind, ticket_id, model, prompt_tokens, completion_tokens,
             status, (error or "")[:500] or None),
        )


def count_today(student_id: str) -> int:
    start = datetime.now(timezone.utc) - timedelta(hours=24)
    with _conn() as c:
        row = c.execute(
            "SELECT COUNT(*) AS n FROM ai_requests WHERE student_id = ? AND ts >= ? AND status = 'ok'",
            (student_id, start.isoformat(timespec="seconds")),
        ).fetchone()
    return int(row["n"])


def summary(price_in: float, price_out: float, days: int = 30) -> dict:
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat(timespec="seconds")
    month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def cost(p: int, o: int) -> float:
        return round(p / 1_000_000 * price_in + o / 1_000_000 * price_out, 4)

    with _conn() as c:
        tot = c.execute(
            "SELECT COUNT(*) AS n, COALESCE(SUM(prompt_tokens),0) AS p, COALESCE(SUM(completion_tokens),0) AS o"
            " FROM ai_requests WHERE status='ok' AND ts >= ?",
            (month_start.isoformat(timespec="seconds"),),
        ).fetchone()
        by_student = c.execute(
            "SELECT student_id, MAX(student_name) AS name, COUNT(*) AS n,"
            " SUM(CASE WHEN kind='chat' THEN 1 ELSE 0 END) AS chat,"
            " SUM(CASE WHEN kind='debug' THEN 1 ELSE 0 END) AS debug,"
            " COALESCE(SUM(prompt_tokens),0) AS p, COALESCE(SUM(completion_tokens),0) AS o, MAX(ts) AS last"
            " FROM ai_requests WHERE status='ok' AND ts >= ? GROUP BY student_id ORDER BY n DESC",
            (since,),
        ).fetchall()
        by_day = c.execute(
            "SELECT substr(ts,1,10) AS day, COUNT(*) AS n, COALESCE(SUM(prompt_tokens),0) AS p,"
            " COALESCE(SUM(completion_tokens),0) AS o FROM ai_requests WHERE status='ok' AND ts >= ?"
            " GROUP BY substr(ts,1,10) ORDER BY 1",
            (since,),
        ).fetchall()
        failures = c.execute(
            "SELECT status, COUNT(*) AS n, MAX(ts) AS last FROM ai_requests WHERE status != 'ok' AND ts >= ?"
            " GROUP BY status",
            (since,),
        ).fetchall()
        recent = c.execute(
            "SELECT ts, student_name, kind, ticket_id, model, prompt_tokens, completion_tokens, status, error"
            " FROM ai_requests ORDER BY id DESC LIMIT 50"
        ).fetchall()
        last_quota = c.execute(
            "SELECT MAX(ts) AS last FROM ai_requests WHERE status='quota_exhausted'"
        ).fetchone()

    return {
        "month": {
            "requests": tot["n"],
            "prompt_tokens": tot["p"],
            "completion_tokens": tot["o"],
            "estimated_cost_usd": cost(tot["p"], tot["o"]),
        },
        "by_student": [
            {"student_id": r["student_id"], "name": r["name"], "requests": r["n"], "chat": r["chat"],
             "debug": r["debug"], "prompt_tokens": r["p"], "completion_tokens": r["o"],
             "estimated_cost_usd": cost(r["p"], r["o"]), "last": r["last"]}
            for r in by_student
        ],
        "by_day": [
            {"day": r["day"], "requests": r["n"], "tokens": r["p"] + r["o"],
             "estimated_cost_usd": cost(r["p"], r["o"])}
            for r in by_day
        ],
        "failures": [{"status": r["status"], "count": r["n"], "last": r["last"]} for r in failures],
        "last_quota_exhausted": last_quota["last"],
        "recent": [dict(r) for r in recent],
        "window_days": days,
    }
