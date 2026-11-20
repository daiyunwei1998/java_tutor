export function SprintProgressBar({ merged, review, total, percent }: { merged: number; review: number; total: number; percent: number }) {
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="small muted">Sprint progress</span>
        <strong>{percent}%</strong>
      </div>
      <div className="progress" style={{ margin: "6px 0 4px" }} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Sprint progress">
        <div style={{ width: `${percent}%` }} />
      </div>
      <div className="small muted">
        {merged} / {total} tickets merged{review > 0 ? `, ${review} passed tests and ready to merge` : ""}
      </div>
    </div>
  );
}
