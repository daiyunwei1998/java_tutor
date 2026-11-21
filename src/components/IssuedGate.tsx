"use client";

import Link from "next/link";
import { getTicket } from "@/content/registry";
import { isIssued, useIssueOverrides } from "@/lib/issued";

/** Students only reach tickets the teacher has issued; a hidden ticket's URL shows a short note instead. */
export function IssuedGate({ sprintId, ticketId, children }: { sprintId: string; ticketId: string; children: React.ReactNode }) {
  const overrides = useIssueOverrides();
  const { ticket } = getTicket(sprintId, ticketId)!;
  if (isIssued(overrides, sprintId, ticket)) return <>{children}</>;
  return (
    <div className="page" style={{ maxWidth: 560 }}>
      <h1>This ticket isn&apos;t open</h1>
      <p className="muted">Your teacher hasn&apos;t assigned {ticket.id} this sprint. Pick another ticket from the board.</p>
      <Link className="btn primary" href={`/sprints/${sprintId}`}>Back to the sprint board</Link>
    </div>
  );
}
