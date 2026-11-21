"""Teacher notes. A note can belong to a student account and can list related tickets.

A note with no account is a general note (e.g. "next class: start with PF-203"). Notes are the
teacher's own records, not student progress, so reset and sync of accounts never touch them.
Tickets are stored as a JSON list of "sprintId/ticketId" keys, the same keys student progress uses.
"""
from __future__ import annotations

import json
import uuid

from . import usage

SCHEMA = [
    "CREATE TABLE IF NOT EXISTS teacher_notes (id TEXT PRIMARY KEY, username TEXT, body TEXT NOT NULL,"
    " tickets TEXT NOT NULL DEFAULT '[]', done INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,"
    " updated_at TEXT NOT NULL)",
    "CREATE INDEX IF NOT EXISTS idx_teacher_notes_user ON teacher_notes(username)",
]

_COLS = "id, username, body, tickets, done, created_at, updated_at"


def init() -> None:
    with usage._conn() as c:
        for stmt in SCHEMA:
            c.execute(stmt)


def _row(r) -> dict:
    return {
        "id": r["id"],
        "username": r["username"],
        "body": r["body"],
        "tickets": json.loads(r["tickets"] or "[]"),
        "done": bool(r["done"]),
        "created_at": r["created_at"],
        "updated_at": r["updated_at"],
    }


def _clean_tickets(tickets: list[str]) -> list[str]:
    seen: list[str] = []
    for t in tickets:
        t = t.strip()
        if t and t not in seen:
            seen.append(t)
    return seen


def list_notes(username: str | None = None) -> list[dict]:
    """All notes, newest first. With a username, only that account's notes."""
    with usage._conn() as c:
        if username is None:
            rows = c.execute(f"SELECT {_COLS} FROM teacher_notes ORDER BY created_at DESC, id").fetchall()
        else:
            rows = c.execute(f"SELECT {_COLS} FROM teacher_notes WHERE username = ? ORDER BY created_at DESC, id",
                             (username,)).fetchall()
    return [_row(r) for r in rows]


def get(note_id: str) -> dict | None:
    with usage._conn() as c:
        r = c.execute(f"SELECT {_COLS} FROM teacher_notes WHERE id = ?", (note_id,)).fetchone()
    return _row(r) if r else None


def create(username: str | None, body: str, tickets: list[str]) -> dict:
    now = usage.now_iso()
    note_id = uuid.uuid4().hex
    with usage._conn() as c:
        c.execute(
            "INSERT INTO teacher_notes (id, username, body, tickets, done, created_at, updated_at) VALUES (?,?,?,?,?,?,?)",
            (note_id, username, body, json.dumps(_clean_tickets(tickets)), 0, now, now),
        )
    return get(note_id)  # type: ignore[return-value]


_UNSET = object()


def update(note_id: str, *, body=_UNSET, tickets=_UNSET, username=_UNSET, done=_UNSET) -> dict | None:
    note = get(note_id)
    if not note:
        return None
    if body is not _UNSET:
        note["body"] = body
    if tickets is not _UNSET:
        note["tickets"] = _clean_tickets(tickets)  # type: ignore[arg-type]
    if username is not _UNSET:
        note["username"] = username
    if done is not _UNSET:
        note["done"] = bool(done)
    with usage._conn() as c:
        c.execute(
            "UPDATE teacher_notes SET username = ?, body = ?, tickets = ?, done = ?, updated_at = ? WHERE id = ?",
            (note["username"], note["body"], json.dumps(note["tickets"]), 1 if note["done"] else 0,
             usage.now_iso(), note_id),
        )
    return get(note_id)


def delete(note_id: str) -> bool:
    with usage._conn() as c:
        cur = c.execute("DELETE FROM teacher_notes WHERE id = ?", (note_id,))
        return (cur.rowcount or 0) > 0
