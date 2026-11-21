"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getTicket } from "@/content/registry";
import { GENERAL_NOTE, ticketKey, useStore } from "@/lib/progress";
import { NoteEditor, savedLabel } from "./NoteEditor";

/** Floating notebook next to "Ask Senior Dev". On a ticket page it opens that ticket's note; a General note is always there. */
export function NotesWidget() {
  const store = useStore();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const m = path.match(/^\/sprints\/([^/]+)\/tickets\/([^/]+)\/?$/);
  const found = m ? getTicket(m[1], m[2]) : undefined;
  const ticketNoteKey = found ? ticketKey(found.sprint.id, found.ticket.id) : null;
  const [tab, setTab] = useState<"ticket" | "general">("ticket");
  const key = tab === "ticket" && ticketNoteKey ? ticketNoteKey : GENERAL_NOTE;

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  if (!store?.profile || path.startsWith("/notes")) return null;

  if (!open) {
    return (
      <button className="btn notes-fab" onClick={() => setOpen(true)} aria-label="Open my notes">
        📝 Notes
      </button>
    );
  }

  return (
    <section className={`notes-panel${full ? " full" : ""}`} aria-label="My notes">
      <div className="chat-head">
        <span style={{ fontSize: 20 }} aria-hidden>📝</span>
        <div className="row" role="tablist" aria-label="Which note" style={{ flex: 1, gap: 4 }}>
          {found && (
            <button role="tab" aria-selected={key === ticketNoteKey} className={`btn small${key === ticketNoteKey ? " primary" : " ghost"}`} onClick={() => setTab("ticket")}>
              {found.ticket.id}
            </button>
          )}
          <button role="tab" aria-selected={key === GENERAL_NOTE} className={`btn small${key === GENERAL_NOTE ? " primary" : " ghost"}`} onClick={() => setTab("general")}>
            General
          </button>
        </div>
        <Link href="/notes" className="btn small ghost" title="See all my notes">All notes</Link>
        <button className="btn small ghost" onClick={() => setFull((f) => !f)} aria-label={full ? "Exit full screen" : "Full screen"} title={full ? "Exit full screen (Esc)" : "Full screen"}>
          {full ? "⤡" : "⤢"}
        </button>
        <button className="btn small ghost" onClick={() => { setOpen(false); setFull(false); }} aria-label="Close notes">✕</button>
      </div>
      {key === ticketNoteKey && found && <div className="small muted" style={{ padding: "6px 14px 0" }}>{found.ticket.title}</div>}
      <NoteEditor key={key} noteKey={key} autoFocus />
      <div className="small muted" style={{ padding: "4px 14px 10px" }}>{savedLabel(store.notes?.[key]?.updatedAt)}</div>
    </section>
  );
}
