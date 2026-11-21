"use client";

import { useEffect } from "react";
import { authToken } from "./progress";

/**
 * Records how long a student actively works on a ticket. A second counts only while the tab is visible
 * and the student did something (typed, clicked, scrolled, moved the mouse) within the last IDLE_MS.
 * Time goes to /api/time as small additive heartbeats, separate from the progress blob.
 */
const IDLE_MS = 3 * 60 * 1000; // reading a long explanation without touching anything still counts for a while
const FLUSH_MS = 30 * 1000;
const MAX_POST_MS = 10 * 60 * 1000; // server limit per heartbeat

function send(ticket: string, ms: number) {
  const token = authToken();
  if (!token || ms < 1000) return;
  fetch("/api/time", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ticket, ms: Math.min(Math.round(ms), MAX_POST_MS) }),
    keepalive: true, // lets the last heartbeat survive closing the tab
  }).catch(() => {
    /* offline: drop this slice rather than double-count later */
  });
}

/** Pass null to record nothing (the teacher's preview and live views). */
export function useActiveTime(ticketKey: string | null) {
  useEffect(() => {
    if (!ticketKey) return;
    let lastActivity = Date.now();
    let lastTick = Date.now();
    let pending = 0;

    const onActivity = () => {
      lastActivity = Date.now();
    };
    const tick = () => {
      const now = Date.now();
      const visible = document.visibilityState === "visible";
      // Cap the slice so a sleeping laptop that wakes up does not add hours.
      if (visible && now - lastActivity < IDLE_MS) pending += Math.min(now - lastTick, 5000);
      lastTick = now;
    };
    const flush = () => {
      tick();
      send(ticketKey, pending);
      pending = 0;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        lastActivity = Date.now();
        lastTick = Date.now();
      } else flush();
    };

    const events = ["pointerdown", "pointermove", "keydown", "wheel", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true, capture: true }));
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    const tickTimer = setInterval(tick, 1000);
    const flushTimer = setInterval(flush, FLUSH_MS);

    return () => {
      flush();
      events.forEach((e) => window.removeEventListener(e, onActivity, { capture: true }));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      clearInterval(tickTimer);
      clearInterval(flushTimer);
    };
  }, [ticketKey]);
}
