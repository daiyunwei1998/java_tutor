"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminError, adminFetch, allTickets, type Note, ticketRef } from "@/lib/admin";
import { AdminLoginNeeded, NotesPanel } from "./Notes";

type Account = { username: string };

/** Every teacher note in one place, with filters. Teacher notes are admin-only; students never see them. */
export function AllNotes() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [err, setErr] = useState<{ message: string; status: number } | null>(null);
  // "" = all, "__general" = notes without an account, otherwise a username.
  const [who, setWho] = useState("");
  // "" = any, "__none" = notes without tickets, otherwise a ticket key.
  const [ticket, setTicket] = useState("");
  const [state, setState] = useState<"open" | "done" | "all">("open");
  const [q, setQ] = useState("");

  useEffect(() => {
    Promise.all([adminFetch<{ notes: Note[] }>("/api/admin/notes"), adminFetch<{ accounts: Account[] }>("/api/admin/accounts")])
      .then(([n, a]) => {
        setNotes(n.notes);
        setUsernames(a.accounts.map((x) => x.username));
      })
      .catch((e) => setErr(e instanceof AdminError ? { message: e.message, status: e.status } : { message: "Cannot reach the backend.", status: 0 }));
  }, []);

  const ticketOptions = useMemo(() => {
    const used = new Set((notes ?? []).flatMap((n) => n.tickets));
    // Known tickets in board order, then any saved keys that are no longer in the content.
    return [...allTickets.filter((t) => used.has(t.key)), ...[...used].filter((k) => !allTickets.some((t) => t.key === k)).map(ticketRef)];
  }, [notes]);

  if (err?.status === 401) return <AdminLoginNeeded message={err.message === "Not logged in." ? undefined : err.message} />;
  if (err) return <div className="page"><div className="callout warn" role="alert">{err.message}</div></div>;
  if (!notes) return <div className="page muted">Loading…</div>;

  const needle = q.trim().toLowerCase();
  const shown = notes.filter(
    (n) =>
      (who === "" || (who === "__general" ? !n.username : n.username === who)) &&
      (ticket === "" || (ticket === "__none" ? n.tickets.length === 0 : n.tickets.includes(ticket))) &&
      (state === "all" || (state === "done") === n.done) &&
      (!needle || n.body.toLowerCase().includes(needle)),
  );
  const filtered = who !== "" || ticket !== "" || state !== "open" || needle !== "";

  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <Link href="/admin" className="small">← Teacher admin</Link>
      <h1 style={{ marginTop: 6 }}>📝 Teacher notes</h1>
      <p className="muted small" style={{ marginTop: 0 }}>
        Only you see these. Notes about a student also show on that student&apos;s page. General notes are for things like what to do next class.
      </p>

      <div className="card row small" style={{ marginBottom: 12 }}>
        <label>
          Account{" "}
          <select value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="">All</option>
            <option value="__general">General only</option>
            {usernames.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label>
          Ticket{" "}
          <select value={ticket} onChange={(e) => setTicket(e.target.value)} style={{ maxWidth: 280 }}>
            <option value="">Any</option>
            <option value="__none">No ticket</option>
            {ticketOptions.map((t) => <option key={t.key} value={t.key}>{t.id} {t.title}</option>)}
          </select>
        </label>
        <label>
          Show{" "}
          <select value={state} onChange={(e) => setState(e.target.value as typeof state)}>
            <option value="open">Open</option>
            <option value="done">Done</option>
            <option value="all">All</option>
          </select>
        </label>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search text" aria-label="Search notes" style={{ flex: "1 1 160px" }} />
        {filtered && (
          <button className="btn small ghost" onClick={() => { setWho(""); setTicket(""); setState("open"); setQ(""); }}>Clear filters</button>
        )}
        <span className="muted">{shown.length} of {notes.length}</span>
      </div>

      <NotesPanel
        notes={shown}
        setNotes={(fn) => setNotes((prev) => fn(prev ?? []))}
        account={{ kind: "pick", usernames }}
        defaults={{
          username: who && who !== "__general" ? who : null,
          tickets: ticket && ticket !== "__none" ? [ticket] : [],
        }}
        showAccount
        emptyText={notes.length === 0 ? "No notes yet. Add one above, or from a student's page." : "No notes match these filters."}
      />
    </div>
  );
}
