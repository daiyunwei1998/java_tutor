"use client";

import { useEffect, useRef, useState } from "react";
import { askMentor, isAiError } from "@/lib/ai";
import { useStore } from "@/lib/progress";
import { Markdown } from "./Markdown";
import { useWorkspace } from "./WorkspaceContext";

type Msg = { role: "user" | "assistant"; content: string } | { role: "error"; content: string };

const STORAGE = "java-tutor.chat";

/** Global "Ask a Senior Dev" chatbot. Knows the current ticket and code when opened from a workspace. */
export function ChatWidget() {
  const store = useStore();
  const { info } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [includeCode, setIncludeCode] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE);
      if (raw) setMsgs(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE, JSON.stringify(msgs.slice(-30)));
    } catch {}
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs, open]);

  if (!store?.profile) return null;
  const profile = store.profile;

  async function send() {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setText("");
    setBusy(true);
    const history = next.filter((m): m is { role: "user" | "assistant"; content: string } => m.role !== "error").slice(-12);
    const res = await askMentor({
      student: { id: profile.id, name: profile.name },
      ticket: info?.ticket ?? null,
      files: includeCode && info ? info.files.filter((f) => !f.path.endsWith("Test.java")) : [],
      messages: history,
    });
    setBusy(false);
    setMsgs((m) => [...m, isAiError(res) ? { role: "error", content: res.message } : { role: "assistant", content: res.reply }]);
  }

  if (!open) {
    return (
      <button className="btn primary chat-fab" onClick={() => setOpen(true)} aria-label="Open AI mentor chat">
        💬 Ask Senior Dev
      </button>
    );
  }

  return (
    <section className="chat-panel" aria-label="AI mentor chat">
      <div className="chat-head">
        <span style={{ fontSize: 22 }} aria-hidden>🧑‍🏫</span>
        <div style={{ flex: 1 }}>
          <strong>Senior Dev (AI mentor)</strong>
          <div className="small muted">{info ? `Looking at: ${info.ticket.id} ${info.ticket.title}` : "Ask any Java question"}</div>
        </div>
        <button className="btn small ghost" onClick={() => setMsgs([])} title="Clear chat">Clear</button>
        <button className="btn small ghost" onClick={() => setOpen(false)} aria-label="Close">✕</button>
      </div>
      <div className="chat-log" ref={logRef} aria-live="polite">
        {msgs.length === 0 && (
          <div className="bubble assistant">
            Hi {profile.name}! I'm the team's Senior Dev. Ask me when you're stuck, for example:
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              <li>What does this error message mean?</li>
              <li>Why does my loop go out of bounds?</li>
              <li>What's the difference between row-major and column-major?</li>
            </ul>
            <div className="small muted" style={{ marginTop: 6 }}>I'll guide you to the answer instead of handing you the full solution 😉</div>
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="bubble user">{m.content}</div>
          ) : m.role === "error" ? (
            <div key={i} className="bubble error" role="alert">⚠️ {m.content}</div>
          ) : (
            <div key={i} className="bubble assistant"><Markdown>{m.content}</Markdown></div>
          ),
        )}
        {busy && <div className="bubble assistant muted">Thinking…</div>}
      </div>
      {info && (
        <label className="small muted" style={{ padding: "0 12px" }}>
          <input type="checkbox" checked={includeCode} onChange={(e) => setIncludeCode(e.target.checked)} /> Include my current code
        </label>
      )}
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type a question (Enter to send, Shift+Enter for a new line)"
          aria-label="Your question"
        />
        <button className="btn primary" type="submit" disabled={busy || !text.trim()}>Send</button>
      </form>
    </section>
  );
}
