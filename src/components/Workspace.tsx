"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import { getTicket } from "@/content/registry";
import type { RunResult } from "@/lib/java-runner";
import { getTicketState, ticketKey, updateTicket, useStore } from "@/lib/progress";
import { isLocked, STATUS_LABEL } from "@/lib/ticket-status";
import { CodePanel } from "./CodePanel";
import { LessonBlocks } from "./LessonBlocks";
import { Markdown } from "./Markdown";
import { useWorkspace } from "./WorkspaceContext";
import { VizPanel } from "./viz/VizPanel";

type MobileTab = "learn" | "code" | "viz" | "tasks";

export function Workspace({ projectId, ticketId }: { projectId: string; ticketId: string }) {
  const { project, ticket } = getTicket(projectId, ticketId)!;
  const key = ticketKey(projectId, ticketId);
  const store = useStore();
  const st = getTicketState(store, key);
  const { setInfo } = useWorkspace();
  const [result, setResult] = useState<RunResult | null>(null);
  const [vizIndex, setVizIndex] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>("learn");
  const [vizCollapsed, setVizCollapsed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const vizPanel = useRef<ImperativePanelHandle>(null);
  const idx = project.tickets.findIndex((t) => t.id === ticket.id);
  const nextTicket = project.tickets[idx + 1];

  const files: Record<string, string> = Object.fromEntries(
    ticket.task.files.filter((f) => !f.readOnly).map((f) => [f.path, st.files[f.path] ?? f.content]),
  );

  // Opening a ticket = "viewed" → In Progress.
  useEffect(() => {
    if (store && getTicketState(store, key).status === "todo") updateTicket(key, (t) => ({ ...t, status: "in_progress" }));
  }, [store, key]);

  // Share context with the AI mentor chat.
  const filesJson = JSON.stringify(files);
  useEffect(() => {
    setInfo({
      ticket: { id: ticket.id, title: ticket.title, task: ticket.task.instructions },
      files: ticket.task.files.map((f) => ({ path: f.path, content: f.readOnly ? f.content : files[f.path] })),
      lastResult: result,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesJson, result, ticket.id]);
  useEffect(() => () => setInfo(null), [setInfo]);

  function onResult(r: RunResult, mode: "run" | "test") {
    setResult(r);
    updateTicket(key, (t) => {
      const next = { ...t, attempts: t.attempts + 1 };
      if (mode === "test") {
        const tests = r.tests ?? [];
        const passed = r.status === "completed" ? tests.filter((x) => x.passed).length : 0;
        next.lastTest = { passed, total: tests.length || next.lastTest?.total || 0, at: new Date().toISOString() };
        const allPass = r.status === "completed" && tests.length > 0 && passed === tests.length;
        // A failed run never marks a task complete; a merged ticket stays merged.
        if (t.status !== "merged") next.status = allPass ? "in_review" : "in_progress";
      }
      return next;
    });
  }

  function merge() {
    updateTicket(key, (t) => ({ ...t, status: "merged", mergedAt: new Date().toISOString() }));
    setToast(`🎉 PR merged！+${ticket.xp} XP`);
    setTimeout(() => setToast(null), 3500);
  }

  function openViz(i: number) {
    setVizIndex(i);
    setMobileTab("viz");
    vizPanel.current?.expand();
  }

  const locked = isLocked(store, project, ticket);

  const learn = (
    <div className="pane-pad">
      <div className="briefing">
        <div className="who" aria-hidden>{project.techLead.avatar}</div>
        <div>
          <div className="small muted">{project.techLead.name} · {project.techLead.role} 指派給你</div>
          <Markdown>{ticket.briefing}</Markdown>
        </div>
      </div>
      {locked && <div className="callout warn">🔒 建議先完成 {ticket.dependsOn.join("、")}。你還是可以先看看這張 ticket。</div>}
      <h3 style={{ marginTop: 0 }}>完成這張 ticket 後你會…</h3>
      <ul className="objectives">
        {ticket.objectives.map((o) => <li key={o}>{o}</li>)}
      </ul>
      <LessonBlocks
        blocks={ticket.blocks}
        predictions={st.predictions}
        onPredict={(id, choice) => updateTicket(key, (t) => ({ ...t, predictions: { ...t.predictions, [id]: choice } }))}
        onOpenViz={openViz}
      />
      {tasksBox()}
    </div>
  );

  function tasksBox() {
    const lt = st.lastTest;
    return (
      <div className="card" style={{ marginTop: 18 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>✅ Definition of Done</strong>
          <span className={`pill ${st.status}`}>{STATUS_LABEL[st.status]}</span>
        </div>
        <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
          <li>{lt && lt.total > 0 && lt.passed === lt.total ? "✅" : "⬜"} 所有自動測試通過 {lt ? `（目前 ${lt.passed}/${lt.total}）` : ""}</li>
          <li>{st.status === "merged" ? "✅" : "⬜"} Merge PR</li>
          <li>{st.tutorVerified ? "✅" : "⬜"} 老師 code review（測試通過不代表觀念都懂了，老師會再確認）</li>
        </ul>
        {st.status === "in_review" && (
          <button className="btn ok" onClick={merge}>🚀 Open PR &amp; Merge（+{ticket.xp} XP）</button>
        )}
        {st.status === "merged" && nextTicket && (
          <Link className="btn primary" href={`/projects/${project.id}/tickets/${nextTicket.id}`}>下一張 ticket：{nextTicket.id} →</Link>
        )}
        {st.status === "merged" && !nextTicket && <div className="callout lead">Sprint 1 完成！🎉 Sprint 2 的濾鏡 ticket 即將推出。</div>}
      </div>
    );
  }

  const code = (
    <CodePanel
      ticket={ticket}
      files={files}
      onChangeFile={(path, content) => updateTicket(key, (t) => ({ ...t, files: { ...t.files, [path]: content } }))}
      onReset={() => updateTicket(key, (t) => ({ ...t, files: {} }))}
      result={result}
      onResult={onResult}
      hintsShown={st.hintsShown}
      onShowHint={() => updateTicket(key, (t) => ({ ...t, hintsShown: t.hintsShown + 1 }))}
    />
  );

  const viz = <VizPanel ticket={ticket} index={vizIndex} onIndex={setVizIndex} files={files} />;

  return (
    <div className="ws">
      <div className="ws-head">
        <Link href={`/projects/${project.id}`} className="small">← {project.title} 看板</Link>
        <span className="ticket-id">{ticket.id}</span>
        <strong style={{ flex: 1, minWidth: 200 }}>{ticket.title}</strong>
        <span className={`pill ${st.status}`}>{STATUS_LABEL[st.status]}</span>
        <span className="small muted">{ticket.xp} XP</span>
      </div>

      <div className="ws-tabs" role="tablist" aria-label="工作區">
        {(["learn", "code", "viz", "tasks"] as MobileTab[]).map((t) => (
          <button key={t} role="tab" className="btn small" aria-selected={mobileTab === t} onClick={() => setMobileTab(t)}>
            {{ learn: "📖 Learn", code: "⌨️ Code", viz: "🔬 Visualize", tasks: "✅ Tasks" }[t]}
          </button>
        ))}
      </div>

      <div className="ws-body">
        <MediaSwitch
          desktop={
            <PanelGroup direction="horizontal" autoSaveId="ws-layout">
              <Panel defaultSize={30} minSize={18} order={1}>
                <div className="pane">{learn}</div>
              </Panel>
              <PanelResizeHandle className="resize-handle" aria-label="調整寬度" />
              <Panel defaultSize={38} minSize={25} order={2}>
                <div className="pane">{code}</div>
              </Panel>
              <PanelResizeHandle className="resize-handle" aria-label="調整寬度" />
              <Panel
                ref={vizPanel}
                defaultSize={32}
                minSize={20}
                collapsible
                collapsedSize={3}
                order={3}
                onCollapse={() => setVizCollapsed(true)}
                onExpand={() => setVizCollapsed(false)}
              >
                {vizCollapsed ? (
                  <div className="collapsed-strip">
                    <button className="btn small" onClick={() => vizPanel.current?.expand()} aria-label="展開視覺化面板">🔬</button>
                  </div>
                ) : (
                  <div className="pane" style={{ position: "relative" }}>
                    <button
                      className="btn small ghost"
                      style={{ position: "absolute", right: 6, top: 6, zIndex: 2 }}
                      onClick={() => vizPanel.current?.collapse()}
                      aria-label="收合視覺化面板"
                      title="收合"
                    >
                      ⇥
                    </button>
                    {viz}
                  </div>
                )}
              </Panel>
            </PanelGroup>
          }
          mobile={
            <div className="pane">
              {mobileTab === "learn" && learn}
              {mobileTab === "code" && code}
              {mobileTab === "viz" && viz}
              {mobileTab === "tasks" && <div className="pane-pad">{tasksBox()}</div>}
            </div>
          }
        />
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

/** Three resizable columns on desktop, tabs on phones/tablets in portrait. */
function MediaSwitch({ desktop, mobile }: { desktop: React.ReactNode; mobile: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  if (isMobile === null) return null;
  return <>{isMobile ? mobile : desktop}</>;
}
