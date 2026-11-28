import { notFound } from "next/navigation";
import { getTicket, sprints } from "@/content/registry";
import { readSolution } from "@/lib/solution";
import { TicketPreview } from "@/components/admin/TicketPreview";

export const metadata = { title: "Ticket preview", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return sprints.flatMap((s) => s.tickets.map((t) => ({ sprintId: s.id, ticketId: t.id })));
}

export default async function AdminTicketPage({ params }: { params: Promise<{ sprintId: string; ticketId: string }> }) {
  const { sprintId, ticketId } = await params;
  const found = getTicket(sprintId, ticketId);
  if (!found) notFound();
  return <TicketPreview sprintId={sprintId} ticketId={ticketId} solution={readSolution(found.ticket.task.solution ?? found.ticket.task.mainClass)} />;
}
