"use client";

import Link from "next/link";
import { getSprint } from "@/content/registry";
import { CodeMap } from "@/components/CodeMap";
import { Markdown } from "@/components/Markdown";
import { TraversalViz } from "@/components/viz/TraversalViz";
import { TraceViewer } from "./TraceViewer";

/** One Knowledge Space topic: a single scrolling page (no panels), text and interactive examples in order. */
export function KnowledgePage({ sprintId, topicId }: { sprintId: string; topicId: string }) {
  const sprint = getSprint(sprintId)!;
  const topics = sprint.knowledge ?? [];
  const idx = topics.findIndex((k) => k.id === topicId);
  const topic = topics[idx];
  const prev = topics[idx - 1];
  const next = topics[idx + 1];

  return (
    <article className="page k-page">
      <p className="muted small" style={{ margin: 0 }}>
        <Link href={`/sprints/${sprint.id}/knowledge`}>← Knowledge Space · Sprint {sprint.number}</Link> · {topic.minutes} min
      </p>
      <h1>{topic.title}</h1>
      <p className="muted k-lead">{topic.summary}</p>

      {topic.sections.map((s, i) => {
        switch (s.type) {
          case "markdown":
            return <Markdown key={i}>{s.md}</Markdown>;
          case "callout":
            return (
              <div key={i} className={`callout ${s.tone}`}>
                <Markdown>{s.md}</Markdown>
              </div>
            );
          case "trace":
            return <TraceViewer key={i} trace={s.trace} caption={s.caption} />;
          case "code-map":
            return <CodeMap key={i} code={s.code} concepts={s.concepts} title={s.title} mode={s.mode} />;
          case "traversal-lab":
            return (
              <div key={i} className="card" style={{ margin: "18px 0" }}>
                <TraversalViz modes={s.modes} rows={s.rows} cols={s.cols} showMemory />
              </div>
            );
        }
      })}

      <nav className="k-pager" aria-label="Topics">
        {prev ? <Link className="btn" href={`/sprints/${sprint.id}/knowledge/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next ? <Link className="btn primary" href={`/sprints/${sprint.id}/knowledge/${next.id}`}>{next.title} →</Link> : <Link className="btn" href={`/sprints/${sprint.id}`}>Back to the sprint board</Link>}
      </nav>
    </article>
  );
}
