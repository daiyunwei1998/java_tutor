"use client";

import { useState, type ReactNode } from "react";
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
  answers = {},
  onAnswer,
  showLeftover = true,
}: {
  blocks: LessonBlock[];
  predictions: Record<string, number>;
  onPredict: (id: string, choice: number) => void;
  answers?: Record<string, string>;
  onAnswer?: (id: string, text: string) => void;
  visualizations: VizConfig[];
  renderViz: (index: number) => ReactNode;
  onOpenPreview: () => void;
  /** Visualizations no viz-link points to are appended at the end (only on the last step in step mode). */
  showLeftover?: boolean;
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
          case "step":
            // Only reached when a full lesson is shown at once (e.g. the admin preview).
            return <h3 key={i} className="step-heading">Step: {b.title}</h3>;
          case "short-answer":
            return <ShortAnswer key={i} block={b} saved={answers[b.id]} onSave={(text) => onAnswer?.(b.id, text)} />;
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
      {showLeftover && leftover.map(({ i }) => embed(`extra-${i}`, i))}
    </>
  );
}

/** "Why" question: the student writes first, then compares with a model answer. Never graded. */
function ShortAnswer({
  block,
  saved,
  onSave,
}: {
  block: Extract<LessonBlock, { type: "short-answer" }>;
  saved?: string;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(saved ?? "");
  const [editing, setEditing] = useState(saved === undefined);
  const done = saved !== undefined && !editing;
  return (
    <div className="predict" role="group" aria-labelledby={`sa-${block.id}`}>
      <div className="small muted">✍️ In your own words (not graded; your teacher reads it in code review)</div>
      <div id={`sa-${block.id}`} style={{ fontWeight: 600 }}>
        <Markdown>{block.question}</Markdown>
      </div>
      {done ? (
        <>
          <div className="console" style={{ whiteSpace: "pre-wrap", color: "var(--text)" }}>{saved}</div>
          <div className="callout">
            <strong>One good answer</strong> (compare with yours: the same idea in different words is great)
            <Markdown>{block.modelAnswer}</Markdown>
          </div>
          <button className="btn small ghost" onClick={() => setEditing(true)}>Edit my answer</button>
        </>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={block.placeholder}
            rows={3}
            maxLength={1500}
            style={{ width: "100%", marginTop: 6 }}
            aria-label={block.question}
          />
          <button
            className="btn small primary"
            disabled={text.trim().length < 4}
            onClick={() => {
              onSave(text.trim());
              setEditing(false);
            }}
          >
            Save and compare
          </button>
        </>
      )}
    </div>
  );
}
