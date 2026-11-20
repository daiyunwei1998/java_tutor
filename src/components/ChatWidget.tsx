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
      <button className="btn primary chat-fab" onClick={() => setOpen(true)} aria-label="打開 AI 導師聊天">
        💬 問 Senior Dev
      </button>
    );
  }

  return (
    <section className="chat-panel" aria-label="AI 導師聊天">
      <div className="chat-head">
        <span style={{ fontSize: 22 }} aria-hidden>🧑‍🏫</span>
        <div style={{ flex: 1 }}>
          <strong>Senior Dev（AI 導師）</strong>
          <div className="small muted">{info ? `正在看：${info.ticket.id} ${info.ticket.title}` : "可以問任何 Java 問題"}</div>
        </div>
        <button className="btn small ghost" onClick={() => setMsgs([])} title="清除對話">清除</button>
        <button className="btn small ghost" onClick={() => setOpen(false)} aria-label="關閉">✕</button>
      </div>
      <div className="chat-log" ref={logRef} aria-live="polite">
        {msgs.length === 0 && (
          <div className="bubble assistant">
            嗨 {profile.name}！我是團隊的 Senior Dev。卡住的時候可以問我，例如：
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              <li>這個錯誤訊息是什麼意思？</li>
              <li>為什麼我的迴圈會 out of bounds？</li>
              <li>row-major 跟 column-major 差在哪？</li>
            </ul>
            <div className="small muted" style={{ marginTop: 6 }}>我會引導你自己找到答案，不會直接給完整解答 😉</div>
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
        {busy && <div className="bubble assistant muted">思考中…</div>}
      </div>
      {info && (
        <label className="small muted" style={{ padding: "0 12px" }}>
          <input type="checkbox" checked={includeCode} onChange={(e) => setIncludeCode(e.target.checked)} /> 附上我目前的程式碼
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
          placeholder="輸入問題（Enter 送出，Shift+Enter 換行）"
          aria-label="輸入問題"
        />
        <button className="btn primary" type="submit" disabled={busy || !text.trim()}>送出</button>
      </form>
    </section>
  );
}
