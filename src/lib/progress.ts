"use client";

import { useSyncExternalStore } from "react";

/**
 * Student progress. The server (FastAPI + Postgres) is the source of truth per account ("stu", "test", ...);
 * localStorage is a cache so the page works instantly and survives a flaky connection.
 * Statuses follow the spec: viewed → attempted → passed automated tests → (tutor verified, later).
 */
export type TicketStatus = "todo" | "in_progress" | "in_review" | "merged";

export type TicketState = {
  status: TicketStatus;
  attempts: number;
  lastTest?: { passed: number; total: number; at: string };
  files: Record<string, string>;
  predictions: Record<string, number>;
  hintsShown: number;
  mergedAt?: string;
  tutorVerified?: boolean;
};

export type Profile = { id: string; name: string; createdAt: string };

export type Auth = { username: string; token: string; rev: number; dirty: boolean };

export type Store = { version: 1; profile: Profile | null; tickets: Record<string, TicketState>; auth?: Auth | null };

const KEY = "java-tutor.v2";
const EMPTY: Store = { version: 1, profile: null, tickets: {} };
const listeners = new Set<() => void>();
let cache: Store | null = null;

function read(): Store {
  if (cache) return cache;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(next: Store, opts: { local?: boolean } = {}) {
  if (!opts.local && next.auth) {
    next = { ...next, auth: { ...next.auth, dirty: true } };
    editSeq++;
    schedulePush();
  }
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: keep in memory */
  }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useStore(): Store | null {
  // null during SSR / first hydration pass, so pages render a neutral shell.
  return useSyncExternalStore(subscribe, read, () => null);
}

export const ticketKey = (sprintId: string, ticketId: string) => `${sprintId}/${ticketId}`;

const blank = (): TicketState => ({ status: "todo", attempts: 0, files: {}, predictions: {}, hintsShown: 0 });

export function getTicketState(store: Store | null, key: string): TicketState {
  return store?.tickets[key] ?? blank();
}

export function updateTicket(key: string, fn: (t: TicketState) => TicketState) {
  const s = read();
  write({ ...s, tickets: { ...s.tickets, [key]: fn(s.tickets[key] ?? blank()) } });
}

// ---------- accounts + server sync ----------

let editSeq = 0;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;

function schedulePush(delay = 800) {
  if (typeof window === "undefined") return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(push, delay);
}

function applyServer(username: string, token: string, data: { tickets?: Record<string, TicketState> }, rev: number) {
  write(
    {
      version: 1,
      profile: { id: username, name: username, createdAt: read().profile?.createdAt ?? new Date().toISOString() },
      tickets: data?.tickets ?? {},
      auth: { username, token, rev, dirty: false },
    },
    { local: true },
  );
}

async function push() {
  const s = read();
  if (!s.auth || !s.auth.dirty) return;
  if (pushing) return schedulePush(500);
  pushing = true;
  const seq = editSeq;
  const { username, token, rev } = s.auth;
  try {
    const res = await fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: { tickets: s.tickets }, base_rev: rev }),
    });
    if (res.status === 401) return logout();
    if (!res.ok) throw new Error(String(res.status));
    const body = await res.json();
    const now = read();
    if (!now.auth || now.auth.username !== username) return;
    if (body.conflict) {
      // The teacher reset/synced this account (or another device saved first): the server copy wins.
      applyServer(username, token, body.data, body.rev);
    } else {
      const stillDirty = editSeq !== seq;
      write({ ...now, auth: { ...now.auth, rev: body.rev, dirty: stillDirty } }, { local: true });
      if (stillDirty) schedulePush(300);
    }
  } catch {
    schedulePush(5000); // offline: keep the local copy and retry
  } finally {
    pushing = false;
  }
}

/** Fetches the server copy; used on load and when the tab gets focus. Local unsaved edits are pushed instead. */
export async function pull() {
  const s = read();
  if (!s.auth) return;
  if (s.auth.dirty) return schedulePush(0);
  const { username, token } = s.auth;
  try {
    const res = await fetch("/api/progress", { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) return logout();
    if (!res.ok) return;
    const body = await res.json();
    const now = read();
    if (now.auth?.username === username && !now.auth.dirty && body.rev !== now.auth.rev) {
      applyServer(username, token, body.data, body.rev);
    }
  } catch {
    /* offline: keep using the cache */
  }
}

export async function login(username: string, password: string): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return body?.detail ?? `Login failed (${res.status})`;
    const prog = await fetch("/api/progress", { headers: { Authorization: `Bearer ${body.token}` } }).then((r) => r.json());
    applyServer(body.username, body.token, prog.data, prog.rev);
    return null;
  } catch {
    return "Cannot reach the server. Check your connection and try again.";
  }
}

export function logout() {
  if (pushTimer) clearTimeout(pushTimer);
  write(EMPTY, { local: true });
}

if (typeof window !== "undefined") {
  setTimeout(pull, 0);
  window.addEventListener("focus", () => pull());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") pull();
    else push();
  });
}

/** XP and level: purely motivational. */
export function xpOf(store: Store | null, xpByKey: Record<string, number>): number {
  if (!store) return 0;
  let xp = 0;
  for (const [k, t] of Object.entries(store.tickets)) {
    if (t.status === "merged") xp += xpByKey[k] ?? 0;
    xp += Object.keys(t.predictions).length * 5;
  }
  return xp;
}

export const LEVELS = [
  { min: 0, title: "Junior Developer I" },
  { min: 250, title: "Junior Developer II" },
  { min: 550, title: "Junior Developer III" },
  { min: 800, title: "Developer" },
];

export function levelOf(xp: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (xp >= l.min) idx = i;
  });
  const next = LEVELS[idx + 1];
  return { ...LEVELS[idx], index: idx, next, progress: next ? (xp - LEVELS[idx].min) / (next.min - LEVELS[idx].min) : 1 };
}
