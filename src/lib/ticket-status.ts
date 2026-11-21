import type { Sprint } from "@/content/types";
import { getTicketState, ticketKey, type TicketStatus, useStore } from "./progress";

export const STATUS_LABEL: Record<TicketStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "Tests Passed",
  merged: "Merged",
};

/** Sprint completion: merged tickets count fully, "tests passed" counts half. */
export function sprintProgress(store: ReturnType<typeof useStore>, sprint: Sprint) {
  const states = sprint.tickets.map((t) => getTicketState(store, ticketKey(sprint.id, t.id)).status);
  const merged = states.filter((s) => s === "merged").length;
  const review = states.filter((s) => s === "in_review").length;
  const total = sprint.tickets.length;
  return { merged, review, total, percent: total ? Math.round(((merged + review * 0.5) / total) * 100) : 0 };
}
