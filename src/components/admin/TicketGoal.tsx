import type { LearningGoal, Ticket } from "@/content/types";

const LEVEL_LABEL: Record<LearningGoal["level"], string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const LEVEL_PILL: Record<LearningGoal["level"], string> = { easy: "merged", medium: "in_progress", hard: "in_review" };

export function LevelPill({ level }: { level: LearningGoal["level"] }) {
  return <span className={`pill ${LEVEL_PILL[level]}`} title="Difficulty">{LEVEL_LABEL[level]}</span>;
}

/**
 * Teacher-only: what a ticket is designed to teach (its learning goal and key techniques).
 * Use it only in /admin views; students never see it.
 */
export function TicketGoal({ ticket, compact = false }: { ticket: Ticket; compact?: boolean }) {
  const g = ticket.learningGoal;
  return (
    <div className="ticket-goal">
      <div className="row" style={{ gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
        <strong className="small">Designed to teach</strong>
        <LevelPill level={g.level} />
      </div>
      <p style={{ margin: "4px 0 6px" }}>{g.goal}</p>
      {!compact && (
        <div className="row small" style={{ gap: 6, flexWrap: "wrap" }}>
          {g.techniques.map((t) => <span key={t} className="pill todo">{t}</span>)}
        </div>
      )}
    </div>
  );
}
