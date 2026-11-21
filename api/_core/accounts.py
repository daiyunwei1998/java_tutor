"""Simple named accounts (e.g. "stu" and "test") with progress stored server-side.

Passwords only tell accounts apart; they are not meant to protect data. They are still stored as
PBKDF2 hashes so a database dump never shows them. Login returns an HMAC-signed token.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time

from . import usage

TOKEN_TTL_S = 60 * 60 * 24 * 180  # half a year: students should not have to log in every class

SCHEMA = [
    "CREATE TABLE IF NOT EXISTS accounts (username TEXT PRIMARY KEY, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS progress (username TEXT PRIMARY KEY, data TEXT NOT NULL, rev INTEGER NOT NULL DEFAULT 0,"
    " updated_at TEXT NOT NULL)",
]


def _hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return f"pbkdf2${salt.hex()}${dk.hex()}"


def _verify(password: str, stored: str) -> bool:
    try:
        _, salt, _dk = stored.split("$")
        return hmac.compare_digest(_hash(password, bytes.fromhex(salt)), stored)
    except ValueError:
        return False


_secret = b""


def init(secret_seed: str, seed_accounts: list[str]) -> None:
    global _secret
    _secret = hashlib.sha256(("jt-auth|" + secret_seed).encode()).digest()
    with usage._conn() as c:
        for stmt in SCHEMA:
            c.execute(stmt)
        for name in seed_accounts:
            # Password = username (requested: passwords only distinguish accounts).
            c.execute(
                "INSERT INTO accounts (username, password_hash, created_at) VALUES (?,?,?) ON CONFLICT (username) DO NOTHING",
                (name, _hash(name), usage.now_iso()),
            )


def login(username: str, password: str) -> str | None:
    username = username.strip().lower()
    with usage._conn() as c:
        row = c.execute("SELECT password_hash FROM accounts WHERE username = ?", (username,)).fetchone()
    if not row or not _verify(password, row["password_hash"]):
        return None
    return make_token(username)


def make_token(username: str) -> str:
    payload = f"{username}|{int(time.time()) + TOKEN_TTL_S}"
    sig = hmac.new(_secret, payload.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=") + "." + base64.urlsafe_b64encode(sig).decode().rstrip("=")


def check_token(token: str | None) -> str | None:
    """Returns the username for a valid token, else None."""
    if not token or "." not in token:
        return None
    try:
        p64, s64 = token.split(".", 1)
        payload = base64.urlsafe_b64decode(p64 + "=" * (-len(p64) % 4)).decode()
        sig = base64.urlsafe_b64decode(s64 + "=" * (-len(s64) % 4))
    except (ValueError, UnicodeDecodeError):
        return None
    if not hmac.compare_digest(hmac.new(_secret, payload.encode(), hashlib.sha256).digest(), sig):
        return None
    username, _, exp = payload.rpartition("|")
    if not exp.isdigit() or int(exp) < time.time():
        return None
    return username


EMPTY = {"tickets": {}}


def get_progress(username: str) -> dict:
    with usage._conn() as c:
        row = c.execute("SELECT data, rev, updated_at FROM progress WHERE username = ?", (username,)).fetchone()
    if not row:
        return {"data": EMPTY, "rev": 0, "updated_at": None}
    return {"data": json.loads(row["data"]), "rev": int(row["rev"]), "updated_at": row["updated_at"]}


def _write(c, username: str, data: dict, rev: int) -> str:
    now = usage.now_iso()
    c.execute(
        "INSERT INTO progress (username, data, rev, updated_at) VALUES (?,?,?,?)"
        " ON CONFLICT (username) DO UPDATE SET data = excluded.data, rev = excluded.rev, updated_at = excluded.updated_at",
        (username, json.dumps(data, ensure_ascii=False), rev, now),
    )
    return now


def put_progress(username: str, data: dict, base_rev: int) -> dict:
    """Saves when base_rev matches the stored revision; otherwise returns the newer server copy (conflict)."""
    with usage._conn() as c:
        row = c.execute("SELECT rev FROM progress WHERE username = ?", (username,)).fetchone()
        current = int(row["rev"]) if row else 0
        if base_rev != current:
            conflict = True
        else:
            conflict = False
            updated = _write(c, username, data, current + 1)
    if conflict:
        return {"conflict": True, **get_progress(username)}
    return {"conflict": False, "rev": current + 1, "updated_at": updated}


def list_accounts() -> list[dict]:
    with usage._conn() as c:
        rows = c.execute(
            "SELECT a.username, p.data, p.updated_at FROM accounts a LEFT JOIN progress p ON p.username = a.username"
            " ORDER BY a.username"
        ).fetchall()
    out = []
    for r in rows:
        tickets = (json.loads(r["data"]) if r["data"] else EMPTY).get("tickets", {})
        statuses = [t.get("status") for t in tickets.values() if isinstance(t, dict)]
        out.append({
            "username": r["username"],
            "updated_at": r["updated_at"],
            "merged": statuses.count("merged"),
            "in_review": statuses.count("in_review"),
            "in_progress": statuses.count("in_progress"),
        })
    return out


def exists(username: str) -> bool:
    with usage._conn() as c:
        return c.execute("SELECT 1 AS x FROM accounts WHERE username = ?", (username,)).fetchone() is not None


def reset(username: str) -> None:
    """Clears progress. The revision still goes up, so an open browser tab picks up the reset."""
    with usage._conn() as c:
        row = c.execute("SELECT rev FROM progress WHERE username = ?", (username,)).fetchone()
        _write(c, username, EMPTY, (int(row["rev"]) if row else 0) + 1)


def copy(src: str, dst: str) -> None:
    data = get_progress(src)["data"]
    with usage._conn() as c:
        row = c.execute("SELECT rev FROM progress WHERE username = ?", (dst,)).fetchone()
        _write(c, dst, data, (int(row["rev"]) if row else 0) + 1)


def detail(username: str) -> dict:
    """One account's progress per ticket, without the code (for the admin account page)."""
    p = get_progress(username)
    tickets = {}
    for key, t in (p["data"].get("tickets") or {}).items():
        if not isinstance(t, dict):
            continue
        tickets[key] = {k: t.get(k) for k in ("status", "attempts", "lastTest", "hintsShown", "mergedAt")}
    return {"username": username, "updated_at": p["updated_at"], "tickets": tickets}
