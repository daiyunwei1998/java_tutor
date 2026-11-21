"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { TicketState } from "@/lib/progress";
import type { LiveChannel } from "@/lib/live/transport";

export type LiveRole = "student" | "teacher";

/**
 * One student's live session channel, seen from either side. Messages carry the sender's role so a second tab of
 * the same role ignores them. Everything is a no-op until the other side is present.
 */
export class LiveSession {
  peer = false;
  /** Latest local value of every synced UI key (sent to the teacher in the snapshot). */
  ui = new Map<string, unknown>();
  /** Latest values received from the other side. */
  remoteUi = new Map<string, unknown>();
  private handlers = new Map<string, Set<(d: never) => void>>();
  private offs: (() => void)[] = [];

  constructor(public role: LiveRole, public peerName: string, private ch: LiveChannel) {
    this.offs.push(
      ch.subscribe((name, raw) => {
        const msg = raw as { r?: LiveRole; d?: unknown } | null;
        if (!msg || msg.r === role) return;
        if (name === "ui") {
          const { key, value } = msg.d as { key: string; value: unknown };
          this.remoteUi.set(key, value);
        }
        this.emit(name, msg.d);
      }),
      ch.onMembers((ms) => {
        const p = ms.some((m) => m.data?.role && m.data.role !== role);
        if (p !== this.peer) {
          this.peer = p;
          this.emit("_peer", p);
        }
      }),
    );
    ch.enter({ role });
  }

  send(name: string, data: unknown, force = false) {
    if (this.peer || force) this.ch.publish(name, { r: this.role, d: data });
  }

  on<T = unknown>(name: string, cb: (d: T) => void): () => void {
    let set = this.handlers.get(name);
    if (!set) this.handlers.set(name, (set = new Set()));
    set.add(cb as (d: never) => void);
    return () => set!.delete(cb as (d: never) => void);
  }

  emit(name: string, d: unknown) {
    this.handlers.get(name)?.forEach((cb) => cb(d as never));
  }

  close() {
    this.offs.forEach((f) => f());
    this.ch.close();
  }
}

const Ctx = createContext<LiveSession | null>(null);
export const LiveProvider = Ctx.Provider;
export const useLive = () => useContext(Ctx);

/** Re-renders when the other side joins or leaves. */
export function useLivePeer(): boolean {
  const live = useLive();
  const [peer, setPeer] = useState(live?.peer ?? false);
  useEffect(() => {
    if (!live) return;
    setPeer(live.peer);
    return live.on<boolean>("_peer", setPeer);
  }, [live]);
  return peer;
}

const NONE = Symbol("none");

/**
 * Keeps one piece of UI state (a tab, the active file, a run result…) the same on both screens.
 * Local changes are sent; remote changes are applied with `apply`. The teacher's view adopts the student's
 * value on mount instead of sending its own default.
 */
export function useLiveSync<T>(key: string, value: T, apply: (v: T) => void) {
  const live = useLive();
  const lastRemote = useRef<unknown>(NONE);
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const mounted = useRef(false);

  useEffect(() => {
    if (!live) return;
    return live.on<{ key: string; value: T }>("ui", (d) => {
      if (d.key !== key) return;
      lastRemote.current = d.value;
      applyRef.current(d.value);
    });
  }, [live, key]);

  useEffect(() => {
    if (!live) return;
    if (!mounted.current) {
      mounted.current = true;
      if (live.role === "teacher" && live.remoteUi.has(key)) {
        const v = live.remoteUi.get(key) as T;
        lastRemote.current = v;
        if (v !== value) {
          applyRef.current(v);
          return;
        }
      }
    }
    live.ui.set(key, value);
    if (value === lastRemote.current) return;
    lastRemote.current = NONE;
    live.send("ui", { key, value });
  }, [live, key, value]);
}

/** Subscribes to one message type; the callback may change between renders. */
export function useLiveEvent<T>(name: string, cb: (d: T) => void) {
  const live = useLive();
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => live?.on<T>(name, (d) => ref.current(d)), [live, name]);
}

// ---------- ticket data: local store for students, the student's mirrored state for the teacher ----------

export type RemoteTicket = {
  key: string;
  st: TicketState;
  update: (fn: (t: TicketState) => TicketState) => void;
  /**
   * Where the workspace's own links (back to the board, next ticket) go. Without it those links are hidden,
   * so the teacher's views never drop into the student site (which would ask for a student login).
   */
  links?: { board: string; ticket: (ticketId: string) => string; boardLabel: string };
};
const RemoteTicketCtx = createContext<RemoteTicket | null>(null);
export const RemoteTicketProvider = RemoteTicketCtx.Provider;
export const useRemoteTicket = () => useContext(RemoteTicketCtx);
