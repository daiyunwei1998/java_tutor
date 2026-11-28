"use client";

import Link from "next/link";
import { Markdown } from "@/components/Markdown";
import { getWebTopic, MAP_NODES, topicsFor, WEB_TOPICS, type WebWidgetId } from "@/content/webmap";
import { Quiz } from "./Quiz";
import { AuthDemo } from "./widgets/AuthDemo";
import { CrudTable } from "./widgets/CrudTable";
import { DnsLookup } from "./widgets/DnsLookup";
import { HtmlPlayground } from "./widgets/HtmlPlayground";
import { HttpPlayground } from "./widgets/HttpPlayground";
import { JsonJava } from "./widgets/JsonJava";
import { NetworkPanel } from "./widgets/NetworkPanel";
import { RestDesigner } from "./widgets/RestDesigner";

function Widget({ id }: { id: WebWidgetId }) {
  switch (id) {
    case "http-playground": return <HttpPlayground />;
    case "rest-designer": return <RestDesigner />;
    case "html-playground": return <HtmlPlayground />;
    case "json-java": return <JsonJava />;
    case "crud-table": return <CrudTable />;
    case "dns-lookup": return <DnsLookup />;
    case "auth-demo": return <AuthDemo />;
    case "network-panel": return <NetworkPanel />;
  }
}

/** One Web Map topic: a single scrolling page of explanations, hands-on widgets and quizzes. */
export function WebTopicPage({ topicId }: { topicId: string }) {
  const topic = getWebTopic(topicId)!;
  const node = MAP_NODES.find((n) => n.id === topic.node)!;
  const siblings = topicsFor(topic.node).filter((t) => t.id !== topic.id);
  const idx = WEB_TOPICS.findIndex((t) => t.id === topic.id);
  const prev = WEB_TOPICS[idx - 1];
  const next = WEB_TOPICS[idx + 1];

  return (
    <article className="page wm-topic">
      <p className="muted small" style={{ margin: 0 }}>
        <Link href={`/web-map?node=${node.id}`}>← Web Map</Link> · {node.icon} {node.label} · {topic.minutes} min
      </p>
      <h1>{topic.title}</h1>
      <p className="muted k-lead">{topic.summary}</p>
      {topic.sections.map((s, i) => {
        switch (s.type) {
          case "markdown":
            return <Markdown key={i}>{s.md}</Markdown>;
          case "callout":
            return <div key={i} className={`callout ${s.tone}`}><Markdown>{s.md}</Markdown></div>;
          case "widget":
            return <Widget key={i} id={s.widget} />;
          case "quiz":
            return <Quiz key={i} id={s.id} title={s.title} questions={s.questions} />;
        }
      })}
      {siblings.length > 0 && (
        <>
          <h3>More about {node.label}</h3>
          {siblings.map((t) => (
            <Link key={t.id} href={`/web-map/${t.id}`} className="wm-topic-link"><strong>{t.title}</strong><div className="small muted">{t.summary}</div></Link>
          ))}
        </>
      )}
      <div className="row" style={{ justifyContent: "space-between", marginTop: 24, flexWrap: "wrap", gap: 8 }}>
        {prev ? <Link className="btn" href={`/web-map/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next ? <Link className="btn primary" href={`/web-map/${next.id}`}>{next.title} →</Link> : <Link className="btn primary" href="/web-map">Back to the map</Link>}
      </div>
    </article>
  );
}
