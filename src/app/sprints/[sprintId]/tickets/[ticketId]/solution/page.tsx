import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTicket, sprints } from "@/content/registry";
import { readSolutionFiles } from "@/lib/solution";

/**
 * Reference solution of one ticket, read from tools/solutions/ at build time (see lib/solution.ts).
 * Not linked anywhere; the AI mentor chat opens it when a student types "skip".
 */
export const dynamicParams = false;
export const metadata: Metadata = { title: "Reference solution", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return sprints.flatMap((s) => s.tickets.map((t) => ({ sprintId: s.id, ticketId: t.id })));
}

export default async function SolutionPage({ params }: { params: Promise<{ sprintId: string; ticketId: string }> }) {
  const { sprintId, ticketId } = await params;
  const found = getTicket(sprintId, ticketId);
  if (!found) notFound();
  const { ticket } = found;
  const solPath = ticket.task.solution ?? ticket.task.mainClass;
  const solFiles = readSolutionFiles(solPath);
  const solNames = new Set(solFiles.map((f) => f.name));
  const others = ticket.task.files.filter((f) => f.readOnly && !f.path.endsWith("Test.java") && !solNames.has(f.path));
  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <Link href={`/sprints/${sprintId}/tickets/${ticketId}`} className="small">← Back to {ticket.id}</Link>
      <h1 style={{ marginBottom: 4 }}>{ticket.id} reference solution</h1>
      <p className="muted" style={{ marginTop: 0 }}>{ticket.title}</p>
      <div className="callout warn">
        This is one correct way to write {solFiles.length > 0 ? solFiles.map((f, i) => <span key={f.name}>{i > 0 ? ", " : ""}<code>{f.name}</code></span>) : "this ticket"}. Read it, close this tab, and try to write it again yourself without looking: that is where the learning happens.
      </div>
      {solFiles.length > 0 ? (
        solFiles.map((f) => (
          <div key={f.name}>
            {solFiles.length > 1 && <h3 style={{ marginBottom: 4 }}>{f.name}</h3>}
            <pre className="console" style={{ color: "var(--text)", fontSize: 14 }}>{f.content}</pre>
          </div>
        ))
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
