"use client";

/**
 * Realtime transport for live teacher sessions.
 *
 * Production: Ably (Vercel functions cannot hold WebSockets). The backend signs short-lived token requests at
 * /api/live/token, so the Ably key never reaches the browser.
 * Local dev without ABLY_API_KEY: a BroadcastChannel fallback that links tabs of the same browser, so the whole
 * feature can be tried with two tabs (one student, one /admin).
 */

export type Member = { clientId: string; connectionId: string; data: Record<string, unknown> | null };

export interface LiveChannel {
  publish(name: string, data: unknown): void;
  subscribe(cb: (name: string, data: unknown) => void): () => void;
  enter(data: Record<string, unknown>): void;
  update(data: Record<string, unknown>): void;
  onMembers(cb: (members: Member[]) => void): () => void;
  close(): void;
}

export interface LiveClient {
  kind: "ably" | "local";
  channel(name: string): LiveChannel;
  close(): void;
}

export type LiveAuth = { kind: "student"; token: string } | { kind: "teacher"; password: string };

async function fetchTokenRequest(auth: LiveAuth): Promise<Response> {
  return fetch("/api/live/token", {
    method: "POST",
    headers: auth.kind === "teacher" ? { "X-Admin-Password": auth.password } : { Authorization: `Bearer ${auth.token}` },
  });
}

const isLocalHost = () => typeof window !== "undefined" && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

/** Returns null when live sessions are not available (not configured, logged out, or offline). */
export async function connectLive(auth: LiveAuth): Promise<LiveClient | null> {
  let first: Response;
  try {
    first = await fetchTokenRequest(auth);
  } catch {
    return null;
  }
  if (first.status === 503 && isLocalHost()) return localClient(auth.kind === "teacher" ? "teacher" : "student");
  if (!first.ok) return null;
  const firstToken = await first.json();
  // Ably's device SDK: accounts billed by monthly active users reject the older `ably` package (error 40168).
  // Our tokens always carry a clientId, which device connections require.
  const { createClient } = await import("@ably/pubsub-device");
  let cached: unknown = firstToken;
  const rt = createClient({
    echoMessages: false,
    authCallback: async (_params, cb) => {
      try {
        if (cached) {
          const t = cached;
          cached = null;
          return cb(null, t as never);
        }
        const res = await fetchTokenRequest(auth);
        if (!res.ok) return cb(`token ${res.status}`, null);
        cb(null, await res.json());
      } catch (e) {
        cb(String(e), null);
      }
    },
  });
  return {
    kind: "ably",
    channel(name) {
      const ch = rt.channels.get(name);
      const memberSubs = new Set<(m: Member[]) => void>();
      const refresh = async () => {
        try {
          const list = await ch.presence.get();
          const ms = list.map((p) => ({ clientId: p.clientId, connectionId: p.connectionId, data: (p.data as Member["data"]) ?? null }));
          memberSubs.forEach((cb) => cb(ms));
        } catch {
          /* channel detached or no permission */
        }
      };
      let presenceWatched = false;
      return {
        publish: (n, d) => void ch.publish(n, d).catch(() => {}),
        subscribe(cb) {
          const l = (m: { name?: string; data?: unknown }) => cb(m.name ?? "", m.data);
          void ch.subscribe(l).catch(() => {});
          return () => ch.unsubscribe(l);
        },
        enter: (d) => void ch.presence.enter(d).catch(() => {}),
        update: (d) => void ch.presence.update(d).catch(() => {}),
        onMembers(cb) {
          memberSubs.add(cb);
          if (!presenceWatched) {
            presenceWatched = true;
            void ch.presence.subscribe(() => void refresh()).catch(() => {});
          }
          void refresh();
          return () => memberSubs.delete(cb);
        },
        close() {
          memberSubs.clear();
          void ch.presence.leave().catch(() => {});
          ch.unsubscribe();
          ch.presence.unsubscribe();
          void ch.detach().catch(() => {});
        },
      };
    },
    close: () => rt.close(),
  };
}

// ---------- local fallback (BroadcastChannel, dev only) ----------

function localClient(clientId: string): LiveClient {
  const connectionId = Math.random().toString(36).slice(2);
  const open: LiveChannel[] = [];
  return {
    kind: "local",
    channel(name) {
      const real = new BroadcastChannel(`jt-live:${name}`);
      let closed = false;
      const bc = { postMessage: (m: unknown) => !closed && real.postMessage(m), close: () => { closed = true; real.close(); } };
      const subs = new Set<(n: string, d: unknown) => void>();
      const memberSubs = new Set<(m: Member[]) => void>();
      const members = new Map<string, Member & { seen: number }>();
      let mine: Record<string, unknown> | null = null;
      const emitMembers = () => {
        const list = [...members.values()].map(({ seen: _s, ...m }) => m);
        if (mine) list.push({ clientId, connectionId, data: mine });
        memberSubs.forEach((cb) => cb(list));
      };
      const announce = () => mine && bc.postMessage({ k: "p", clientId, connectionId, data: mine });
      real.onmessage = (e) => {
        const m = e.data;
        if (m.k === "m") subs.forEach((cb) => cb(m.name, m.data));
        else if (m.k === "p") {
          const isNew = !members.has(m.connectionId) || JSON.stringify(members.get(m.connectionId)!.data) !== JSON.stringify(m.data);
          members.set(m.connectionId, { clientId: m.clientId, connectionId: m.connectionId, data: m.data, seen: Date.now() });
          if (isNew) emitMembers();
        } else if (m.k === "l") {
          if (members.delete(m.connectionId)) emitMembers();
        } else if (m.k === "q") announce();
      };
      const hb = setInterval(() => {
        announce();
        let changed = false;
        for (const [id, m] of members) if (Date.now() - m.seen > 6000) changed = members.delete(id) || changed;
        if (changed) emitMembers();
      }, 2000);
      bc.postMessage({ k: "q" });
      const ch: LiveChannel = {
        publish: (n, d) => bc.postMessage({ k: "m", name: n, data: JSON.parse(JSON.stringify(d ?? null)) }),
        subscribe(cb) {
          subs.add(cb);
          return () => subs.delete(cb);
        },
        enter(d) {
          mine = d;
          announce();
          emitMembers();
        },
        update(d) {
          mine = d;
          announce();
          emitMembers();
        },
        onMembers(cb) {
          memberSubs.add(cb);
          emitMembers();
          return () => memberSubs.delete(cb);
        },
        close() {
          clearInterval(hb);
          if (mine) bc.postMessage({ k: "l", connectionId });
          bc.close();
        },
      };
      open.push(ch);
      return ch;
    },
    close: () => open.forEach((c) => c.close()),
  };
}
