"use client";

import { toggleStar } from "@/lib/progress";

/** Star toggle. Safe inside a <Link>: it stops the click from opening the ticket. */
export function StarButton({ ticketKey, starred, label }: { ticketKey: string; starred: boolean; label: string }) {
  return (
    <button
      type="button"
      className={`star-btn${starred ? " on" : ""}`}
      aria-pressed={starred}
      aria-label={starred ? `Unstar ${label}` : `Star ${label}`}
      title={starred ? "Starred: click to unstar" : "Star this ticket to find it again"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleStar(ticketKey);
      }}
    >
      {starred ? "★" : "☆"}
    </button>
  );
}
