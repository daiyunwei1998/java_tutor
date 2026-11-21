"use client";

import { sprints } from "@/content/registry";
import { ticketKey } from "./progress";

/**
 * The admin password is kept in localStorage after logging in on any /admin page, so every admin page
 * and every new tab shares one login. (It used to be sessionStorage, which a new tab does not see.)
 */
export const ADMIN_KEY = "jt.admin";

export function adminPassword(): string | null {
  try {
    const pw = localStorage.getItem(ADMIN_KEY) ?? sessionStorage.getItem(ADMIN_KEY);
    if (pw) localStorage.setItem(ADMIN_KEY, pw);
    return pw;
  } catch {
    return null;
  }
}

export function setAdminPassword(pw: string | null) {
  try {
    if (pw) localStorage.setItem(ADMIN_KEY, pw);
    else localStorage.removeItem(ADMIN_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
  } catch {
    /* storage blocked: the login just won't persist */
  }
  window.dispatchEvent(new Event(ADMIN_EVENT));
}

/** Fired on this tab whenever the admin login changes, so the admin layout can show the login form again. */
export const ADMIN_EVENT = "jt-admin-auth";

export class AdminError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function adminFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const pw = adminPassword();
  if (!pw) throw new AdminError("Not logged in.", 401);
  const res = await fetch(path, {
    method: init.method ?? "GET",
    headers: { "X-Admin-Password": pw, ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = typeof body?.detail === "string" ? body.detail : `Error ${res.status}`;
    if (res.status === 401) setAdminPassword(null);
    throw new AdminError(detail, res.status);
  }
  return body as T;
}

export type Note = {
  id: string;
  username: string | null;
  body: string;
  /** "sprintId/ticketId" keys, the same keys student progress uses. */
  tickets: string[];
  done: boolean;
  created_at: string;
  updated_at: string;
};

export type TicketRef = { key: string; id: string; title: string; sprintId: string; sprintLabel: string };

/** Every ticket of every sprint, in board order. */
export const allTickets: TicketRef[] = sprints.flatMap((s) =>
  s.tickets.map((t) => ({
    key: ticketKey(s.id, t.id),
    id: t.id,
    title: t.title,
    sprintId: s.id,
    sprintLabel: `Sprint ${s.number}: ${s.topic}`,
  })),
);

const byKey = new Map(allTickets.map((t) => [t.key, t]));

export function ticketRef(key: string): TicketRef {
  const known = byKey.get(key);
  if (known) return known;
  const [sprintId = "", id = key] = key.split("/");
  return { key, id, title: "(ticket no longer in the content)", sprintId, sprintLabel: sprintId };
}

export const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { hour12: false }) : "—");
