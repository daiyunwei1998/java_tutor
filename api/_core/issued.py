"""Which tickets the teacher has issued to students.

Each ticket's default comes from the content (Ticket.issuedByDefault, true when missing). The table
only stores the teacher's overrides, keyed by "sprintId/ticketId" (the same keys student progress
uses), so a ticket added to the content later follows its own default until the teacher changes it.
"""
from __future__ import annotations

from . import usage

SCHEMA = [
    "CREATE TABLE IF NOT EXISTS ticket_issue (ticket_key TEXT PRIMARY KEY, issued INTEGER NOT NULL,"
    " updated_at TEXT NOT NULL)",
]


def init() -> None:
    with usage._conn() as c:
        for stmt in SCHEMA:
            c.execute(stmt)


def overrides() -> dict[str, bool]:
    with usage._conn() as c:
        rows = c.execute("SELECT ticket_key, issued FROM ticket_issue").fetchall()
    return {r["ticket_key"]: bool(r["issued"]) for r in rows}


def set_issued(key: str, issued: bool | None) -> dict[str, bool]:
    """issued=None removes the override, so the ticket follows its content default again."""
    with usage._conn() as c:
        if issued is None:
            c.execute("DELETE FROM ticket_issue WHERE ticket_key = ?", (key,))
        else:
            c.execute(
                "INSERT INTO ticket_issue (ticket_key, issued, updated_at) VALUES (?,?,?)"
                " ON CONFLICT (ticket_key) DO UPDATE SET issued = excluded.issued, updated_at = excluded.updated_at",
                (key, 1 if issued else 0, usage.now_iso()),
            )
    return overrides()
