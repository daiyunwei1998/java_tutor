"use client";

import { useState } from "react";

/** Edit an object's fields; see the same data as a Java object and as JSON. Plus a JSON checker. */
export function JsonJava() {
  const [name, setName] = useState("Amy");
  const [hours, setHours] = useState(12);
  const [active, setActive] = useState(true);
  const [skills, setSkills] = useState("reading, sorting");
  const list = skills.split(",").map((s) => s.trim()).filter(Boolean);
  const obj = { name, hours, active, skills: list };
  const javaList = list.length ? `List.of(${list.map((s) => JSON.stringify(s)).join(", ")})` : "List.of()";
  const [raw, setRaw] = useState('{"name": "Ben", "hours": 3, "active": false}');
  let check = "";
  try {
    const v = JSON.parse(raw);
    check = `✅ Valid JSON: ${Array.isArray(v) ? "an array" : typeof v === "object" && v ? `an object with ${Object.keys(v).length} field(s)` : typeof v}`;
  } catch (e) {
    check = `❌ ${e instanceof Error ? e.message : "Not valid JSON"}`;
  }
  return (
    <div className="wm-widget">
      <h4>🔁 One volunteer, two ways of writing it</h4>
      <div className="wm-row">
        <label className="small">name <input className="wm-input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="small">hours <input className="wm-input" type="number" value={hours} onChange={(e) => setHours(Number(e.target.value) || 0)} style={{ width: 70 }} /></label>
        <label className="small"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> active</label>
        <label className="small">skills <input className="wm-input" value={skills} onChange={(e) => setSkills(e.target.value)} /></label>
      </div>
      <div className="wm-grid2">
        <div>
          <div className="wm-label">Java (in the server program)</div>
          <pre className="wm-msg">{`public class Volunteer {
    private String name;
    private int hours;
    private boolean active;
    private List<String> skills;
    ...
}

Volunteer v = new Volunteer(${JSON.stringify(name)}, ${hours}, ${active},
                            ${javaList});`}</pre>
        </div>
        <div>
          <div className="wm-label">JSON (on the network)</div>
          <pre className="wm-msg">{JSON.stringify(obj, null, 2)}</pre>
          <p className="small muted">Strings get double quotes; numbers and true/false don&apos;t; a list becomes [ … ]. Field names become keys.</p>
        </div>
      </div>
      <div className="wm-label">JSON checker: type or paste JSON</div>
      <textarea className="wm-input" value={raw} onChange={(e) => setRaw(e.target.value)} rows={3} style={{ width: "100%" }} spellCheck={false} aria-label="JSON to check" />
      <div className="small">{check}</div>
    </div>
  );
}
