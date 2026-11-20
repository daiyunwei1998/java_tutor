"use client";

import type { LessonBlock } from "@/content/types";
import { Markdown } from "./Markdown";

export function LessonBlocks({
  blocks,
  predictions,
  onPredict,
  onOpenViz,
}: {
  blocks: LessonBlock[];
  predictions: Record<string, number>;
  onPredict: (id: string, choice: number) => void;
  onOpenViz: (index: number) => void;
}) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "markdown":
            return <Markdown key={i}>{b.md}</Markdown>;
          case "code":
            return (
              <figure key={i} style={{ margin: "10px 0" }}>
                <pre className="console" style={{ color: "var(--text)" }}>{b.code}</pre>
                {b.caption && <figcaption className="small muted">{b.caption}</figcaption>}
              </figure>
            );
          case "callout":
            return (
              <div key={i} className={`callout ${b.tone}`}>
                <Markdown>{b.md}</Markdown>
              </div>
            );
          case "viz-link":
            return (
              <button key={i} className="btn" style={{ margin: "6px 0", whiteSpace: "normal", textAlign: "left" }} onClick={() => onOpenViz(b.vizIndex)}>
                👉 {b.label}
              </button>
            );
          case "predict": {
            const chosen = predictions[b.id];
            const answered = chosen !== undefined;
            return (
              <div key={i} className="predict" role="group" aria-labelledby={`q-${b.id}`}>
                <div className="small muted">🔮 Predict before reading on (+5 XP)</div>
                <div id={`q-${b.id}`} style={{ fontWeight: 600 }}>{b.question}</div>
                {b.code && <pre className="console" style={{ color: "var(--text)" }}>{b.code}</pre>}
                {b.options.map((opt, k) => {
                  const cls = answered ? (k === b.answer ? "correct" : k === chosen ? "wrong" : "") : "";
                  return (
                    <button key={k} className={`btn opt ${cls}`} disabled={answered} onClick={() => onPredict(b.id, k)} aria-pressed={chosen === k}>
                      {answered && k === b.answer ? "✓ " : answered && k === chosen ? "✗ " : ""}
                      {opt}
                    </button>
                  );
                })}
                {answered && (
                  <div className={`callout ${chosen === b.answer ? "" : "warn"}`}>
                    <strong>{chosen === b.answer ? "Correct!" : "Not quite."}</strong>
                    <Markdown>{b.explain}</Markdown>
                  </div>
                )}
              </div>
            );
          }
        }
      })}
    </>
  );
}
