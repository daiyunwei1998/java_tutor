"use client";

import { useEffect, useState } from "react";
import type { Sprint, Ticket } from "@/content/types";
import { ticketKey } from "./progress";

/**
 * Which tickets the teacher has issued to students. Defaults come from the content
 * (Ticket.issuedByDefault); the teacher's overrides live on the server (/api/tickets/issued).
 * Overrides are cached in localStorage so boards don't flicker while the request is in flight.
 */
type Overrides = Record<string, boolean>;

const CACHE_KEY = "jt.issued";
let current: Overrides | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function readCache(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") ?? {};
  } catch {
    return {};
  }
}

function setOverrides(o: Overrides) {
  current = o;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(o));
  } catch {
    /* private mode: fine, just no cache */
  }
  listeners.forEach((l) => l());
}

function refresh(): Promise<void> {
  inflight ??= fetch("/api/tickets/issued")
    .then((r) => (r.ok ? r.json() : null))
    .then((b) => { if (b?.overrides) setOverrides(b.overrides); })
    .catch(() => {})
    .finally(() => { inflight = null; });
  return inflight;
}

export function isIssued(overrides: Overrides, sprintId: string, ticket: Ticket): boolean {
  return overrides[ticketKey(sprintId, ticket.id)] ?? ticket.issuedByDefault !== false;
}

/** Overrides, refreshed from the server on mount. Starts from the local cache (or the content defaults). */
export function useIssueOverrides(): Overrides {
  const [o, setO] = useState<Overrides>(() => current ?? {});
  useEffect(() => {
    if (!current) current = readCache();
    setO(current);
    const l = () => setO(current ?? {});
    listeners.add(l);
    refresh();
    return () => { listeners.delete(l); };
  }, []);
  return o;
}

/** The sprint's tickets that students see, in board order. */
export function useIssuedTickets(sprint: Sprint): Ticket[] {
  const o = useIssueOverrides();
  return sprint.tickets.filter((t) => isIssued(o, sprint.id, t));
}

/** Teacher only: issue or hide one ticket. issued=null goes back to the content default. */
export async function setIssued(adminFetch: <T>(path: string, init?: { method?: string; body?: unknown }) => Promise<T>, key: string, issued: boolean | null) {
  const b = await adminFetch<{ overrides: Overrides }>("/api/admin/tickets/issued", { method: "PUT", body: { ticket: key, issued } });
  setOverrides(b.overrides);
}
