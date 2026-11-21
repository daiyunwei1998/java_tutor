"use client";

import { useEffect, useRef, useState } from "react";
import { getTicketState, ticketKey, type TicketState, updateTicket, useStore } from "@/lib/progress";
import { connectLive, type LiveChannel, type LiveClient } from "@/lib/live/transport";
import { LiveProvider, LiveSession, useLive, useLiveEvent, useLivePeer } from "./LiveContext";
import { LiveLayer, sendHighlight } from "./LiveLayer";

export type Snapshot = { sprintId: string; ticketId: string; title: string; ticket: TicketState; ui: Record<string, unknown>; ackSeq: number };
export type Patch = { key: string; seq: number; patch: Partial<TicketState> };

// One connection per browser tab, shared by every ticket page the student opens.
let clientPromise: Promise<LiveClient | null> | null = null;
let clientToken = "";
function getClient(token: string) {
  if (!clientPromise || clientToken !== token) {
    clientPromise?.then((c) => c?.close());
    clientToken = token;
    clientPromise = connectLive({ kind: "student", token });
  }
  return clientPromise;
}

/**
 * Student side of a live session. While the student is on a ticket page, they are listed in the teacher's lobby;
 * once the teacher joins, this tab streams its workspace state and applies the teacher's edits and button presses.
 */
export function StudentLive({ sprintId, ticketId, title, children }: { sprintId: string; ticketId: string; title: string; children: React.ReactNode }) {
  const store = useStore();
  const auth = store?.auth;
  const [session, setSession] = useState<LiveSession | null>(null);
  const lobby = useRef<LiveChannel | null>(null);
  const since = useRef(new Date().toISOString());

  useEffect(() => {
    if (!auth?.token) return;
    let cancelled = false;
    let s: LiveSession | null = null;
    let lb: LiveChannel | null = null;
    getClient(auth.token).then((client) => {
      if (cancelled || !client) return;
      s = new LiveSession("student", "Teacher", client.channel(`live:${auth.username}`));
      lb = client.channel("live-lobby");
      lobby.current = lb;
      setSession(s);
    });
    const onHide = () => {
      s?.close();
      lb?.close();
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onHide);
      onHide();
      lobby.current = null;
      setSession(null);
    };
  }, [auth?.token, auth?.username]);

  // Announce where the student is, so the teacher's admin page can list them.
  useEffect(() => {
    if (!session || !lobby.current || !auth) return;
    lobby.current.enter({ role: "student", username: auth.username, sprintId, ticketId, title, since: since.current });
  }, [session, auth, sprintId, ticketId, title]);

  if (!session) return <>{children}</>;
  return (
    <LiveProvider value={session}>
      <StudentSync sprintId={sprintId} ticketId={ticketId} title={title} />
      {children}
    </LiveProvider>
  );
}

function StudentSync({ sprintId, ticketId, title }: { sprintId: string; ticketId: string; title: string }) {
  const live = useLive();
  const store = useStore();
  const key = ticketKey(sprintId, ticketId);
  const st = getTicketState(store, key);
  const peer = useLivePeer();
  const [ackSeq, setAckSeq] = useState(0);

  const snapshot = (): Snapshot => ({
    sprintId, ticketId, title, ticket: st, ui: Object.fromEntries(live?.ui ?? []), ackSeq,
  });
  const snapRef = useRef(snapshot);
  snapRef.current = snapshot;

  // Teacher arrived, or the student opened another ticket: send everything.
  useEffect(() => {
    if (!live || !peer) return;
    // Let child components register their UI values first.
    const t = setTimeout(() => live.send("snap", snapRef.current()), 30);
    return () => clearTimeout(t);
  }, [live, peer, key]);
  useLiveEvent("hello", () => live?.send("snap", snapRef.current(), true));

  // Stream ticket state changes (code, hints, predictions, status). Each message acknowledges the teacher's edits.
  const stJson = JSON.stringify(st);
  useEffect(() => {
    if (!live || !peer) return;
    const t = setTimeout(() => live.send("state", { key, ticket: snapRef.current().ticket, ackSeq: snapRef.current().ackSeq }), 50);
    return () => clearTimeout(t);
  }, [live, peer, stJson, key, ackSeq]);

  // The teacher edited something.
  useLiveEvent<Patch>("patch", (p) => {
    if (p.key !== key) return;
    updateTicket(key, (t) => ({ ...t, ...p.patch }));
    setAckSeq((a) => Math.max(a, p.seq));
  });

  // Clear marks when the student moves on to another ticket.
  useEffect(() => {
    if (live) live.emit("hl", { op: "clear" });
  }, [live, key]);

  if (!live) return null;
  return (
    <>
      <LiveLayer peerLabel="Teacher" />
      {peer && (
        <div className="live-banner student" role="status">
          <span className="live-dot" aria-hidden /> <strong>Your teacher is connected.</strong>
          <span className="live-banner-sub">They can see your screen, point, highlight and edit your code.</span>
          <button className="btn small ghost" onClick={() => sendHighlight(live, { op: "clear" })}>Clear highlights</button>
        </div>
      )}
    </>
  );
}

