"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { sprints } from "@/content/registry";
import { adminPassword } from "@/lib/admin";
import { AdminLoginNeeded } from "./Notes";
import { LevelPill, TicketGoal } from "./TicketGoal";

/** Teacher-only overview: every ticket of every sprint with what it is designed to teach, in board order. */
export function TicketGuide() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  useEffect(() => setLoggedIn(!!adminPassword()), []);

  if (loggedIn === null) return <div className="page muted">Loading…</div>;
  if (!loggedIn) return <AdminLoginNeeded />;

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link href="/admin" className="small">← Teacher admin</Link>
      <h1 style={{ marginTop: 6 }}>🎯 Ticket guide</h1>
      <p className="muted small" style={{ marginTop: 0 }}>
        What each ticket is designed to teach, with its difficulty and key techniques. Only you see this; students never do.
      </p>
      {sprints.map((s) => (
        <section key={s.id} style={{ marginTop: 18 }}>
          <h2 style={{ marginBottom: 4 }}>Sprint {s.number}: {s.topic}</h2>
          <p className="small muted" style={{ marginTop: 0 }}>
            {s.tickets.length} tickets · difficulty in board order:{" "}
            {s.tickets.map((t) => (
              <span key={t.id} style={{ marginRight: 4 }} title={t.id}><LevelPill level={t.learningGoal.level} /></span>
            ))}
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {s.tickets.map((t) => (
              <div key={t.id} className="card">
                <div style={{ marginBottom: 6 }}>
                  <Link href={`/sprints/${s.id}/tickets/${t.id}`}><strong>{t.id}</strong> {t.title}</Link>
                </div>
                <TicketGoal ticket={t} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
