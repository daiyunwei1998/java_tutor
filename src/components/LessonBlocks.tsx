"use client";

import type { ReactNode } from "react";
import type { LessonBlock, VizConfig } from "@/content/types";
import { Markdown } from "./Markdown";
import { isPreviewViz } from "./viz/VizPanel";

/**
 * Renders a ticket's lesson. A viz-link block embeds that visualization right here in the lesson
 * (once; later links to the same one are skipped). Links to the "run my code on an image" preview
 * point to the preview button next to Run main instead, because that preview runs the student's code.
 */
export function LessonBlocks({
  blocks,
  predictions,
  onPredict,
  visualizations,
  renderViz,
  onOpenPreview,
}: {
  blocks: LessonBlock[];
  predictions: Record<string, number>;
  onPredict: (id: string, choice: number) => void;
  visualizations: VizConfig[];
  renderViz: (index: number) => ReactNode;
  onOpenPreview: () => void;
}) {
  const embedded = new Set<number>();
  const referenced = new Set(blocks.flatMap((b) => (b.type === "viz-link" ? [b.vizIndex] : [])));
  const leftover = visualizations.map((v, i) => ({ v, i })).filter(({ v, i }) => !referenced.has(i) && !isPreviewViz(v));
  const embed = (key: string | number, index: number, label?: string) => {
    const v = visualizations[index];
    if (!v || embedded.has(index)) return null;
    embedded.add(index);
    return (
      <figure key={key} className="inline-viz" aria-label={v.title ?? "Visualization"}>
        <figcaption className="inline-viz-head">
          <strong>🔬 {v.title ?? "Visualization"}</strong>
          {label && <span className="small muted">{label}</span>}
        </figcaption>
        <div className="inline-viz-body" data-live-clicks>{renderViz(index)}</div>
      </figure>
    );
  };
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
          case "viz-link": {
            const v = visualizations[b.vizIndex];
            if (v && isPreviewViz(v)) {
              return (
                <div key={i} className="callout lead">
                  <strong>🖼 Try it with your own code:</strong> {b.label}.{" "}
                  <button className="btn small" onClick={onOpenPreview}>🖼 Open the image preview</button>
                  <div className="small muted" style={{ marginTop: 4 }}>It is also next to ▶ Run main. Whatever you see there is computed by your Java code.</div>
                </div>
              );
            }
            return embed(i, b.vizIndex, b.label);
          }
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
      {leftover.map(({ i }) => embed(`extra-${i}`, i))}
    </>
  );
}
