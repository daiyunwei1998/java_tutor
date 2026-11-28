"use client";

import { useEffect, useState } from "react";
import { Markdown } from "@/components/Markdown";
import type { QuizQuestion } from "@/content/webmap";

const KEY = (id: string) => `jt.webmap.quiz.${id}`;

/** Multiple-choice questions answered by doing something first (in a widget, or in real DevTools). Saved in this browser only. */
export function Quiz({ id, title, questions }: { id: string; title?: string; questions: QuizQuestion[] }) {
  const [picks, setPicks] = useState<Record<number, number>>({});
  useEffect(() => {
    try {
      setPicks(JSON.parse(localStorage.getItem(KEY(id)) ?? "{}") ?? {});
    } catch {
      /* storage blocked: answers just aren't remembered */
    }
  }, [id]);
  const pick = (i: number, k: number) => {
    const next = { ...picks, [i]: k };
    setPicks(next);
    try {
      localStorage.setItem(KEY(id), JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  const answered = Object.keys(picks).length;
  const correct = questions.filter((q, i) => picks[i] === q.answer).length;
  return (
    <section className="wm-widget" aria-labelledby={`quiz-${id}`}>
      <div className="wm-row" style={{ justifyContent: "space-between" }}>
        <h4 id={`quiz-${id}`}>📝 {title ?? "Check yourself"}</h4>
        <span className="small muted">
          {answered}/{questions.length} answered{answered ? ` · ${correct} correct` : ""}
          {answered > 0 && (
            <button className="btn small ghost" onClick={() => { setPicks({}); try { localStorage.removeItem(KEY(id)); } catch { /* ignore */ } }}>Reset</button>
          )}
        </span>
      </div>
      {questions.map((q, i) => {
        const chosen = picks[i];
        const done = chosen !== undefined;
        return (
          <div key={i} className="wm-quiz-q" role="group" aria-label={`Question ${i + 1}`}>
            <div style={{ fontWeight: 600 }}>
              <Markdown>{`${i + 1}. ${q.q}`}</Markdown>
            </div>
            {q.code && <pre className="wm-msg">{q.code}</pre>}
            <div className="predict" style={{ border: 0, padding: 0, margin: "6px 0 0", background: "none" }}>
              {q.options.map((o, k) => {
                const cls = done ? (k === q.answer ? "correct" : k === chosen ? "wrong" : "") : "";
                return (
                  <button key={k} className={`btn opt ${cls}`} disabled={done} onClick={() => pick(i, k)} aria-pressed={chosen === k}>
                    {done && k === q.answer ? "✓ " : done && k === chosen ? "✗ " : ""}
                    {o}
                  </button>
                );
              })}
            </div>
            {done && (
              <div className={`callout ${chosen === q.answer ? "" : "warn"}`}>
                <strong>{chosen === q.answer ? "Correct." : "Not quite."}</strong> <Markdown>{q.explain}</Markdown>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
