import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicket, sprints } from "@/content/registry";

/**
 * Reference solution of one ticket, read from tools/solutions/<mainClass>.java at build time.
 * Not linked anywhere; the AI mentor chat opens it when a student types "skip".
 */
export const dynamicParams = false;
export const metadata: Metadata = { title: "Reference solution", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return sprints.flatMap((s) => s.tickets.map((t) => ({ sprintId: s.id, ticketId: t.id })));
}

function readSolution(mainClass: string): string | null {
  try {
    return readFileSync(join(process.cwd(), "tools", "solutions", `${mainClass}.java`), "utf8");
  } catch {
    return null;
  }
}

export default async function SolutionPage({ params }: { params: Promise<{ sprintId: string; ticketId: string }> }) {
  const { sprintId, ticketId } = await params;
  const found = getTicket(sprintId, ticketId);
  if (!found) notFound();
  const { ticket } = found;
  const code = readSolution(ticket.task.mainClass);
  const others = ticket.task.files.filter((f) => f.readOnly && !f.path.endsWith("Test.java"));
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link href={`/sprints/${sprintId}/tickets/${ticketId}`} className="small">← Back to {ticket.id}</Link>
      <h1 style={{ marginBottom: 4 }}>{ticket.id} reference solution</h1>
      <p className="muted" style={{ marginTop: 0 }}>{ticket.title}</p>
      <div className="callout warn">
        This is one correct way to write <code>{ticket.task.mainClass}.java</code>. Read it, close this tab, and try to write it again yourself without looking: that is where the learning happens.
      </div>
      {code ? (
        <pre className="console" style={{ color: "var(--text)", fontSize: 14 }}>{code}</pre>
      ) : (
        <p className="muted">There is no reference solution for this ticket yet.</p>
      )}
      {others.map((f) => (
        <details key={f.path}>
          <summary className="small muted">{f.path} (given, unchanged)</summary>
          <pre className="console" style={{ color: "var(--text)" }}>{f.content}</pre>
        </details>
      ))}
    </div>
  );
}
