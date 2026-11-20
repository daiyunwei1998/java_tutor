import Link from "next/link";
import { notFound } from "next/navigation";
import { getSprint, sprints } from "@/content/registry";

export function generateStaticParams() {
  return sprints.filter((s) => s.knowledge?.length).map((s) => ({ sprintId: s.id }));
}

export default async function KnowledgeIndex({ params }: { params: Promise<{ sprintId: string }> }) {
  const { sprintId } = await params;
  const sprint = getSprint(sprintId);
  if (!sprint?.knowledge?.length) notFound();
  return (
    <div className="page" style={{ maxWidth: 980 }}>
      <p className="muted small" style={{ margin: 0 }}>
        <Link href={`/sprints/${sprint.id}`}>Sprint {sprint.number} · {sprint.topic}</Link>
      </p>
      <h1>Knowledge Space</h1>
      <p className="muted">
        Optional deep dives that go beyond the textbook. Each page is an interactive example: step through the code and watch memory change.
        None of this is required for the tickets.
      </p>
      <div className="k-list">
        {sprint.knowledge.map((k, i) => (
          <Link key={k.id} href={`/sprints/${sprint.id}/knowledge/${k.id}`} className="card k-card">
            <div className="k-num" aria-hidden>{i + 1}</div>
            <div>
              <div className="k-title">{k.title}</div>
              <div className="muted small">{k.summary}</div>
            </div>
            <div className="small muted k-min">{k.minutes} min</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
