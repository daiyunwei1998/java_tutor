"use client";

import Link from "next/link";
import { useState } from "react";
import { sprints } from "@/content/registry";
import { GENERAL_NOTE, useStore } from "@/lib/progress";
import { NoteEditor, savedLabel } from "@/components/NoteEditor";

/** All of the student's notes in one place: General first, then tickets in sprint order. */
export default function NotesPage() {
  const store = useStore();
  const [q, setQ] = useState("");
  const notes = store?.notes ?? {};
  const tickets = sprints.flatMap((s) => s.tickets.map((t) => ({ key: `${s.id}/${t.id}`, sprint: s, ticket: t })));
  const query = q.trim().toLowerCase();
  const match = (key: string, label: string) => !query || label.toLowerCase().includes(query) || (notes[key]?.text ?? "").toLowerCase().includes(query);
  const withNotes = tickets.filter((t) => notes[t.key] && match(t.key, `${t.ticket.id} ${t.ticket.title}`));

  if (!store?.profile) return <div className="page"><h1>My notes</h1><p className="muted">Log in to see your notes.</p></div>;

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <h1>My notes</h1>
      <p className="muted">Everything you wrote, saved to your account. Open 📝 Notes on any ticket page to add a note for that ticket.</p>
      <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" aria-label="Search notes" style={{ width: "100%", marginBottom: 16 }} />

      {match(GENERAL_NOTE, "General") && (
        <div className="card note-card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <strong>General</strong>
            <span className="small muted">{savedLabel(notes[GENERAL_NOTE]?.updatedAt)}</span>
          </div>
          <NoteEditor noteKey={GENERAL_NOTE} />
        </div>
      )}

      {withNotes.map(({ key, sprint, ticket }) => (
        <div key={key} className="card note-card">
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <Link href={`/sprints/${sprint.id}/tickets/${ticket.id}`}>
              <span className="ticket-id">S{sprint.number} · {ticket.id}</span> <strong>{ticket.title}</strong>
            </Link>
            <span className="small muted">{savedLabel(notes[key]?.updatedAt)}</span>
          </div>
          <NoteEditor noteKey={key} />
        </div>
      ))}

      {withNotes.length === 0 && (
        <p className="muted small">{query ? "No ticket notes match your search." : "No ticket notes yet."}</p>
      )}
    </div>
  );
}
