"use client";

import { useSyncExternalStore } from "react";

/**
 * Student progress, kept in localStorage for the MVP (one device per student).
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

type Store = { version: 1; profile: Profile | null; tickets: Record<string, TicketState> };

const KEY = "java-tutor.v1";
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

function write(next: Store) {
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

export const ticketKey = (projectId: string, ticketId: string) => `${projectId}/${ticketId}`;

const blank = (): TicketState => ({ status: "todo", attempts: 0, files: {}, predictions: {}, hintsShown: 0 });

export function getTicketState(store: Store | null, key: string): TicketState {
  return store?.tickets[key] ?? blank();
}

export function updateTicket(key: string, fn: (t: TicketState) => TicketState) {
  const s = read();
  write({ ...s, tickets: { ...s.tickets, [key]: fn(s.tickets[key] ?? blank()) } });
}

export function setProfile(name: string) {
  const s = read();
  const id = s.profile?.id ?? (crypto.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  write({ ...s, profile: { id, name: name.trim().slice(0, 40), createdAt: s.profile?.createdAt ?? new Date().toISOString() } });
}

export function resetAll() {
  write({ ...EMPTY, profile: read().profile });
}

export function exportProgress(): string {
  return JSON.stringify(read(), null, 2);
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
