import type { DbState, Handled } from "@/lib/webmap/mockServer";

/** The pretend database, with the rows the last request touched highlighted. */
export function DataTables({ db, touched, before }: { db: DbState; touched: Handled["touched"]; before?: DbState }) {
  const mark = (table: "shifts" | "signups", id: number) => touched.find((t) => t.table === table && t.id === id)?.change ?? "";
  // Deleted rows only exist in the previous state; show them struck through for one step.
  const goneShifts = (before?.shifts ?? []).filter((s) => !db.shifts.some((x) => x.id === s.id) && mark("shifts", s.id) === "deleted");
  const goneSignups = (before?.signups ?? []).filter((s) => !db.signups.some((x) => x.id === s.id) && mark("signups", s.id) === "deleted");
  return (
    <div className="wm-grid2">
      <div>
        <div className="wm-label">Table: shifts</div>
        <table className="wm-table">
          <thead><tr><th>id</th><th>title</th><th>date</th><th>slots</th></tr></thead>
          <tbody>
            {[...db.shifts, ...goneShifts].sort((a, b) => a.id - b.id).map((s) => (
              <tr key={s.id} className={mark("shifts", s.id)}><td>{s.id}</td><td>{s.title}</td><td>{s.date}</td><td>{s.slots}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <div className="wm-label">Table: signups</div>
        <table className="wm-table">
          <thead><tr><th>id</th><th>shift_id</th><th>volunteer</th></tr></thead>
          <tbody>
            {[...db.signups, ...goneSignups].sort((a, b) => a.id - b.id).map((s) => (
              <tr key={s.id} className={mark("signups", s.id)}><td>{s.id}</td><td>{s.shiftId}</td><td>{s.volunteer}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="small muted" style={{ margin: "6px 0 0" }}>Green = created · yellow = updated · blue = read · red = deleted</p>
      </div>
    </div>
  );
}
