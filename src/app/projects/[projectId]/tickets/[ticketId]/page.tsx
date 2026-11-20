import { notFound } from "next/navigation";
import { getTicket, projects } from "@/content/registry";
import { Workspace } from "@/components/Workspace";

export function generateStaticParams() {
  return projects.flatMap((p) => p.tickets.map((t) => ({ projectId: p.id, ticketId: t.id })));
}

export default async function TicketPage({ params }: { params: Promise<{ projectId: string; ticketId: string }> }) {
  const { projectId, ticketId } = await params;
  if (!getTicket(projectId, ticketId)) notFound();
  return <Workspace projectId={projectId} ticketId={ticketId} />;
}
