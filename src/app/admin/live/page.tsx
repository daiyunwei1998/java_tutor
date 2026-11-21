"use client";

import { useAdmin } from "@/components/admin/AdminShell";
import { LiveLobby } from "@/components/live/LiveLobby";

export default function AdminLivePage() {
  const { lobby } = useAdmin();
  return (
    <div className="page" style={{ maxWidth: 1000 }}>
      <h1>🔴 Live sessions</h1>
      <p className="muted small" style={{ marginTop: 0 }}>
        Students who have a ticket open right now. Join one to see their workspace: they see your pointer and highlights, and you can scroll, edit their code and press Run / Run tests for them.
      </p>
      <LiveLobby lobby={lobby} />
    </div>
  );
}
