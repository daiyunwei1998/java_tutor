import { notFound } from "next/navigation";
import { getTicket, sprints } from "@/content/registry";
import { IssuedGate } from "@/components/IssuedGate";
import { Workspace } from "@/components/Workspace";

export function generateStaticParams() {
  return sprints.flatMap((s) => s.tickets.map((t) => ({ sprintId: s.id, ticketId: t.id })));
}

export default async function TicketPage({ params }: { params: Promise<{ sprintId: string; ticketId: string }> }) {
  const { sprintId, ticketId } = await params;
  if (!getTicket(sprintId, ticketId)) notFound();
  return (
    <IssuedGate sprintId={sprintId} ticketId={ticketId}>
      <Workspace sprintId={sprintId} ticketId={ticketId} />
    </IssuedGate>
  );
}
