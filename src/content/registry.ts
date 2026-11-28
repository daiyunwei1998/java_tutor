import type { Sprint, Ticket } from "./types";
import { sprint2dArrays } from "./sprints/s01-2d-arrays/sprint";
import { sprintInheritance } from "./sprints/s02-inheritance/sprint";

/** Site name shown in the top bar and browser tab. Sprint-specific stories live in each sprint's `project`. */
export const SITE_NAME = "Java Dev Sprints";

/**
 * All sprints, in order. To assign a new week: add a folder under src/content/sprints/, import it here,
 * set it to status "current" and the previous one to "done".
 */
export const sprints: Sprint[] = [sprint2dArrays, sprintInheritance];

export function getSprint(id: string): Sprint | undefined {
  return sprints.find((s) => s.id === id);
}

export function currentSprint(): Sprint | undefined {
  return sprints.find((s) => s.status === "current") ?? sprints.find((s) => s.status !== "upcoming");
}

export function getTicket(sprintId: string, ticketId: string): { sprint: Sprint; ticket: Ticket } | undefined {
  const sprint = getSprint(sprintId);
  const ticket = sprint?.tickets.find((t) => t.id === ticketId);
  return sprint && ticket ? { sprint, ticket } : undefined;
}
