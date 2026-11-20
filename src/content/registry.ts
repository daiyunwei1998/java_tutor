import type { Project, Ticket } from "./types";
import { pixelforge } from "./pixelforge/project";

/** All projects available on the platform. Add new units by adding a project here; layouts never import content directly. */
export const projects: Project[] = [pixelforge];

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}

export function getTicket(projectId: string, ticketId: string): { project: Project; ticket: Ticket } | undefined {
  const project = getProject(projectId);
  const ticket = project?.tickets.find((t) => t.id === ticketId);
  return project && ticket ? { project, ticket } : undefined;
}
