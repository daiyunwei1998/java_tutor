"use client";

import { MAX_NOTE_CHARS, setNote, useStore } from "@/lib/progress";

/** A plain-text note bound to one key. Saves as you type (synced to the account like progress). */
export function NoteEditor({ noteKey, placeholder, className, autoFocus }: { noteKey: string; placeholder?: string; className?: string; autoFocus?: boolean }) {
  const store = useStore();
  const note = store?.notes?.[noteKey];
  return (
    <textarea
      className={`note-text${className ? ` ${className}` : ""}`}
      value={note?.text ?? ""}
      maxLength={MAX_NOTE_CHARS}
      onChange={(e) => setNote(noteKey, e.target.value)}
      placeholder={placeholder ?? "Write anything: what you learned, a bug you hit, a question for class…"}
      aria-label="Note"
      autoFocus={autoFocus}
      spellCheck
    />
  );
}

export function savedLabel(iso: string | undefined) {
  if (!iso) return "Not saved yet";
  return `Saved ${new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}`;
}
