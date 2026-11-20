import type { Project, Ticket } from "@/content/types";
import { getTicketState, ticketKey, type TicketStatus, useStore } from "./progress";

export const STATUS_LABEL: Record<TicketStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "Tests Passed",
  merged: "Merged",
};

export function isLocked(store: ReturnType<typeof useStore>, project: Project, t: Ticket) {
  return t.dependsOn.some((d) => getTicketState(store, ticketKey(project.id, d)).status !== "merged");
}
