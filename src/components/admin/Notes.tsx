"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminFetch, allTickets, fmtTime, type Note, ticketRef } from "@/lib/admin";

/** Where a new note goes: fixed to one account (with a checkbox to make it general), or picked from a list. */
export type AccountChoice = { kind: "fixed"; username: string } | { kind: "pick"; usernames: string[] };

type Draft = { body: string; username: string | null; tickets: string[] };

const sprintGroups = Array.from(new Set(allTickets.map((t) => t.sprintLabel))).map((label) => ({
  label,
  tickets: allTickets.filter((t) => t.sprintLabel === label),
}));

function TicketPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (key: string) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  return (
    <fieldset className="note-tickets">
      <legend className="small muted">Related tickets (none checked = a note without tickets)</legend>
      {sprintGroups.map((g) => (
        <div key={g.label}>
          {sprintGroups.length > 1 && <div className="small muted">{g.label}</div>}
          <div className="note-chips">
            {g.tickets.map((t) => (
              <label key={t.key} className={`note-chip${value.includes(t.key) ? " on" : ""}`} title={t.title}>
                <input type="checkbox" checked={value.includes(t.key)} onChange={() => toggle(t.key)} />
                <strong>{t.id}</strong> <span className="note-chip-title">{t.title}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {/* Keys saved earlier for tickets that were later removed from the content stay visible so they can be unchecked. */}
      {value.filter((k) => !allTickets.some((t) => t.key === k)).map((k) => (
        <label key={k} className="note-chip on">
          <input type="checkbox" checked onChange={() => toggle(k)} /> {k}
        </label>
      ))}
    </fieldset>
  );
}

function NoteEditor({
  initial,
  account,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  account: AccountChoice;
  submitLabel: string;
  onSubmit: (d: Draft) => Promise<void>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // A new preset ticket (the "+ Note" button on a ticket row) resets the composer around that ticket.
  const initialKey = initial.tickets.join(",") + "|" + initial.username;
  useEffect(() => {
    setDraft((d) => ({ ...d, username: initial.username, tickets: Array.from(new Set([...d.tickets, ...initial.tickets])) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.body.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await onSubmit({ ...draft, body: draft.body.trim() });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="note-editor" onSubmit={submit}>
      <textarea
        value={draft.body}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        placeholder="Write a note… (Ctrl+Enter to save)"
        rows={3}
        aria-label="Note text"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(e);
        }}
      />
      <div className="row">
        {account.kind === "fixed" ? (
          <label className="small">
            <input
              type="checkbox"
              checked={draft.username === account.username}
              onChange={(e) => setDraft({ ...draft, username: e.target.checked ? account.username : null })}
            />{" "}
            About <strong>{account.username}</strong>
            {draft.username === null && <span className="muted"> (unchecked: general note, e.g. a reminder for next class)</span>}
          </label>
        ) : (
          <label className="small">
            Account{" "}
            <select value={draft.username ?? ""} onChange={(e) => setDraft({ ...draft, username: e.target.value || null })}>
              <option value="">General (no account)</option>
              {account.usernames.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <TicketPicker value={draft.tickets} onChange={(tickets) => setDraft({ ...draft, tickets })} />
      <div className="row">
        <button className="btn primary" disabled={busy || !draft.body.trim()}>{busy ? "Saving…" : submitLabel}</button>
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
        {err && <span className="small" role="alert" style={{ color: "var(--bad)" }}>{err}</span>}
      </div>
    </form>
  );
}

function NoteItem({
  note,
  account,
  showAccount,
  onChanged,
  onDeleted,
}: {
  note: Note;
  account: AccountChoice;
  showAccount: boolean;
  onChanged: (n: Note) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function patch(changes: Partial<Draft & { done: boolean }>) {
    onChanged(await adminFetch<Note>(`/api/admin/notes/${note.id}`, { method: "PUT", body: changes }));
  }

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await adminFetch(`/api/admin/notes/${note.id}`, { method: "DELETE" });
      onDeleted(note.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not delete.");
    }
  }

  if (editing) {
    return (
      <li className="note-item">
        <NoteEditor
          initial={{ body: note.body, username: note.username, tickets: note.tickets }}
          account={account.kind === "fixed" && note.username && note.username !== account.username ? { kind: "fixed", username: note.username } : account}
          submitLabel="Save"
          onSubmit={async (d) => {
            await patch(d);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className={`note-item${note.done ? " done" : ""}`}>
      <div className="note-body">{note.body}</div>
      <div className="row small" style={{ marginTop: 6 }}>
        {(showAccount || !note.username) &&
          (note.username ? (
            <Link className="pill in_progress" href={`/admin/accounts/${encodeURIComponent(note.username)}`}>👤 {note.username}</Link>
          ) : (
            <span className="pill todo">General</span>
          ))}
        {note.tickets.map((k) => {
          const t = ticketRef(k);
          return (
            <Link key={k} className="pill todo" href={`/sprints/${t.sprintId}/tickets/${t.id}`} title={t.title} target="_blank">
              {t.id}
            </Link>
          );
        })}
        <span className="muted" title={note.updated_at !== note.created_at ? `Edited ${fmtTime(note.updated_at)}` : undefined}>
          {fmtTime(note.created_at)}
          {note.updated_at !== note.created_at && " (edited)"}
        </span>
        <span className="spacer" />
        <label>
          <input type="checkbox" checked={note.done} onChange={(e) => patch({ done: e.target.checked }).catch((x) => setErr(String(x.message ?? x)))} /> Done
        </label>
        <button className="btn small ghost" onClick={() => setEditing(true)}>Edit</button>
        <button className={`btn small ${confirmDelete ? "bad" : "ghost"}`} onClick={remove} onBlur={() => setConfirmDelete(false)}>
          {confirmDelete ? "Delete? Click again" : "Delete"}
        </button>
      </div>
      {err && <div className="small" role="alert" style={{ color: "var(--bad)" }}>{err}</div>}
    </li>
  );
}

/** Composer + list. The parent owns the note list so it can show counts per ticket. */
export function NotesPanel({
  notes,
  setNotes,
  account,
  defaults,
  showAccount,
  emptyText,
  onCreated,
}: {
  notes: Note[];
  setNotes: (fn: (prev: Note[]) => Note[]) => void;
  account: AccountChoice;
  defaults: { username: string | null; tickets: string[] };
  showAccount: boolean;
  emptyText: string;
  onCreated?: (n: Note) => void;
}) {
  const [composerKey, setComposerKey] = useState(0);

  return (
    <>
      <div className="card">
        <NoteEditor
          key={composerKey}
          initial={{ body: "", ...defaults }}
          account={account}
          submitLabel="Add note"
          onSubmit={async (d) => {
            const created = await adminFetch<Note>("/api/admin/notes", { method: "POST", body: d });
            setNotes((prev) => [created, ...prev]);
            setComposerKey((k) => k + 1);
            onCreated?.(created);
          }}
        />
      </div>
      {notes.length === 0 ? (
        <p className="muted small">{emptyText}</p>
      ) : (
        <ul className="note-list">
          {notes.map((n) => (
            <NoteItem
              key={n.id}
              note={n}
              account={account}
              showAccount={showAccount}
              onChanged={(u) => setNotes((prev) => prev.map((x) => (x.id === u.id ? u : x)))}
              onDeleted={(id) => setNotes((prev) => prev.filter((x) => x.id !== id))}
            />
          ))}
        </ul>
      )}
    </>
  );
}

/** Shown on admin sub-pages when the password is missing or wrong. */
export function AdminLoginNeeded({ message }: { message?: string }) {
  return (
    <div className="page" style={{ maxWidth: 480 }}>
      <h1>Teacher admin</h1>
      <div className="callout warn" role="alert">{message ?? "Please log in first."}</div>
      <Link className="btn primary" href="/admin">Go to the admin login</Link>
    </div>
  );
}
