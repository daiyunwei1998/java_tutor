"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { connectLive, type Member } from "@/lib/live/transport";

type Entry = { username: string; ticketId: string; title: string; since: string };

export type LobbyEntry = Entry;
export type Lobby = { state: "connecting" | "off" | "ok"; local: boolean; entries: Entry[] };

/** Students who have a ticket page open right now (presence on the "live-lobby" channel). */
export function useLiveLobby(password: string | null): Lobby {
  const [state, setState] = useState<"connecting" | "off" | "ok">("connecting");
  const [local, setLocal] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    if (!password) return;
    let cancelled = false;
    let close = () => {};
    connectLive({ kind: "teacher", password }).then((client) => {
      if (cancelled) return client?.close();
      if (!client) return setState("off");
      setState("ok");
      setLocal(client.kind === "local");
      const lobby = client.channel("live-lobby");
      lobby.onMembers((ms: Member[]) => {
        const byUser = new Map<string, Entry>();
        for (const m of ms) {
          const d = m.data as Partial<Entry> & { role?: string } | null;
          if (d?.role !== "student" || !d.username) continue;
          byUser.set(d.username, { username: d.username, ticketId: d.ticketId ?? "", title: d.title ?? "", since: d.since ?? "" });
        }
        setEntries([...byUser.values()].sort((a, b) => a.username.localeCompare(b.username)));
      });
      close = () => {
        lobby.close();
        client.close();
      };
    });
    return () => {
      cancelled = true;
      close();
    };
  }, [password]);

  return { state, local, entries };
}

/** Admin card: the students in the lobby, with a button to join each one. */
export function LiveLobby({ lobby }: { lobby: Lobby }) {
  const { state, local, entries } = lobby;
  return (
    <div className="card">
      {state === "connecting" && <p className="muted small" style={{ margin: 0 }}>Connecting…</p>}
      {state === "off" && (
        <p className="small" style={{ margin: 0 }}>
          Live sessions are off. Add <code>ABLY_API_KEY</code> to the Vercel project's environment variables and redeploy.
        </p>
      )}
      {state === "ok" && entries.length === 0 && <p className="muted small" style={{ margin: 0 }}>No student has a ticket open right now.</p>}
      {state === "ok" && entries.length > 0 && (
        <table className="data">
          <thead><tr><th>Student</th><th>Ticket</th><th>On the page since</th><th /></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.username}>
                <td><span className="live-dot" aria-hidden /> <strong>{e.username}</strong></td>
                <td>{e.ticketId} · {e.title}</td>
                <td className="small">{e.since ? new Date(e.since).toLocaleTimeString("en-US", { hour12: false }) : "—"}</td>
                <td><Link className="btn small primary" href={`/admin/live/${encodeURIComponent(e.username)}`}>Join session →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {local && <p className="small muted" style={{ marginBottom: 0 }}>Local test mode (no ABLY_API_KEY): only tabs in this browser can see each other.</p>}
    </div>
  );
}
