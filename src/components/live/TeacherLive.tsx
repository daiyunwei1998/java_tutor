"use client";

import Link from "next/link";
import { adminPassword } from "@/lib/admin";
import { useCallback, useEffect, useRef, useState } from "react";
import { getTicket } from "@/content/registry";
import type { TicketState } from "@/lib/progress";
import { connectLive, type LiveClient } from "@/lib/live/transport";
import { Workspace } from "../Workspace";
import { LiveProvider, LiveSession, RemoteTicketProvider } from "./LiveContext";
import { LiveLayer, sendHighlight } from "./LiveLayer";
import type { Patch, Snapshot } from "./StudentLive";

type Mirror = { sprintId: string; ticketId: string; title: string; key: string; st: TicketState };

/**
 * The teacher's copy of one student's workspace. It renders the same Workspace with the student's ticket state;
 * edits become patches the student's tab applies (the student's tab stays the source of truth), and Run / Test /
 * AI buttons are pressed on the student's side.
 */
export function TeacherLive({ username }: { username: string }) {
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<LiveSession | null>(null);
  const [peer, setPeer] = useState(false);
  const [mirror, setMirror] = useState<Mirror | null>(null);
  const [highlighter, setHighlighter] = useState(true);
  const seq = useRef(0);
  const pending = useRef<{ key: string; patch: Partial<TicketState> } | null>(null);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const password = adminPassword();
    if (!password) {
      setError("Log in on the admin page first.");
      return;
    }
    let client: LiveClient | null = null;
    let s: LiveSession | null = null;
    let cancelled = false;
    connectLive({ kind: "teacher", password }).then((c) => {
      if (cancelled) return c?.close();
      if (!c) return setError("Live sessions are not available. Check that ABLY_API_KEY is set on the server.");
      client = c;
      s = new LiveSession("teacher", username, c.channel(`live:${username}`));
      s.on<boolean>("_peer", (p) => {
        setPeer(p);
        if (p) s!.send("hello", null, true);
      });
      s.on<Snapshot>("snap", (d) => {
        Object.entries(d.ui).forEach(([k, v]) => s!.remoteUi.set(k, v));
        const key = `${d.sprintId}/${d.ticketId}`;
        seq.current = Math.max(seq.current, d.ackSeq);
        setMirror((m) => {
          if (m && m.key !== key) s!.emit("hl", { op: "clear" });
          return { sprintId: d.sprintId, ticketId: d.ticketId, title: d.title, key, st: d.ticket };
        });
      });
      s.on<{ key: string; ticket: TicketState; ackSeq: number }>("state", (d) => {
        // Ignore echoes that don't include our latest edits yet; the next state will.
        if (d.ackSeq < seq.current || pending.current) return;
        setMirror((m) => (m && m.key === d.key ? { ...m, st: d.ticket } : m));
      });
      s.send("hello", null, true);
      setSession(s);
    });
    return () => {
      cancelled = true;
      s?.close();
      client?.close();
    };
  }, [username]);

  const flush = useCallback(() => {
    flushTimer.current = null;
    const p = pending.current;
    if (!p || !session) return;
    pending.current = null;
    seq.current += 1;
    session.send("patch", { key: p.key, seq: seq.current, patch: p.patch } satisfies Patch);
  }, [session]);

  const update = useCallback((fn: (t: TicketState) => TicketState) => {
    setMirror((m) => {
      if (!m) return m;
      const next = fn(m.st);
      const changed: Partial<TicketState> = {};
      for (const k of Object.keys({ ...m.st, ...next }) as (keyof TicketState)[]) {
        if (JSON.stringify(m.st[k]) !== JSON.stringify(next[k])) (changed as Record<string, unknown>)[k] = next[k];
      }
      if (Object.keys(changed).length) {
        const prev = pending.current?.key === m.key ? pending.current.patch : {};
        pending.current = { key: m.key, patch: { ...prev, ...changed } };
        if (!flushTimer.current) flushTimer.current = setTimeout(flush, 60);
      }
      return { ...m, st: next };
    });
  }, [flush]);

  const known = mirror && getTicket(mirror.sprintId, mirror.ticketId);

  return (
    <>
      <div className="live-banner teacher" role="status">
        <span className={`live-dot${peer ? "" : " off"}`} aria-hidden />
        <strong>{peer ? `Live with ${username}` : `Waiting for ${username}…`}</strong>
        {mirror && <span className="live-banner-sub">{mirror.ticketId} · {mirror.title}</span>}
        <label className="small row" style={{ gap: 4 }} title="Drag over lesson text to highlight it on the student's screen">
          <input type="checkbox" checked={highlighter} onChange={(e) => setHighlighter(e.target.checked)} /> 🖍 Highlighter
        </label>
        {session && <button className="btn small ghost" onClick={() => sendHighlight(session, { op: "clear" })}>Clear highlights</button>}
        <Link className="btn small" href="/admin/live">Leave</Link>
      </div>
      {error && <div className="page"><div className="callout warn" role="alert">{error}</div></div>}
      {!error && !peer && (
        <div className="page" style={{ maxWidth: 640 }}>
          <p className="muted">
            {mirror ? `${username} left the ticket page. Their workspace will come back here when they open a ticket again.` : `Connecting to ${username}… They need to have a ticket page open.`}
          </p>
        </div>
      )}
      {session && peer && mirror && known && (
        <LiveProvider value={session}>
          <RemoteTicketProvider value={{ key: mirror.key, st: mirror.st, update }}>
            <Workspace key={mirror.key} sprintId={mirror.sprintId} ticketId={mirror.ticketId} />
          </RemoteTicketProvider>
          <LiveLayer peerLabel={username} highlighter={highlighter} />
        </LiveProvider>
      )}
      {mirror && !known && <div className="page"><div className="callout warn">This student is on a ticket this page does not know ({mirror.key}). Reload to get the latest version.</div></div>}
    </>
  );
}
