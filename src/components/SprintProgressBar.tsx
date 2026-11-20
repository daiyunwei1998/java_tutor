export function SprintProgressBar({ merged, review, total, percent }: { merged: number; review: number; total: number; percent: number }) {
  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="small muted">Sprint 完成度</span>
        <strong>{percent}%</strong>
      </div>
      <div className="progress" style={{ margin: "6px 0 4px" }} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Sprint 完成度">
        <div style={{ width: `${percent}%` }} />
      </div>
      <div className="small muted">
        {merged} / {total} 張 ticket 已 merge{review > 0 ? `，${review} 張測試已通過、等你 merge` : ""}
      </div>
    </div>
  );
}
