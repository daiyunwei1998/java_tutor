"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import { getTicket } from "@/content/registry";
import type { RunResult } from "@/lib/java-runner";
import { getTicketState, type TicketState, ticketKey, updateTicket as updateLocal, useStore } from "@/lib/progress";
import { STATUS_LABEL } from "@/lib/ticket-status";
import { useIssuedTickets } from "@/lib/issued";
import { useActiveTime } from "@/lib/time-tracking";
import { CodePanel } from "./CodePanel";
import { GameStage } from "./game/GameStage";
import { LessonBlocks } from "./LessonBlocks";
import { useLiveSync, useRemoteTicket } from "./live/LiveContext";
import { StudentLive } from "./live/StudentLive";
import { Markdown } from "./Markdown";
import { useWorkspace } from "./WorkspaceContext";
import { StarButton } from "./StarButton";
import { renderViz } from "./viz/VizPanel";

type MobileTab = "learn" | "code" | "game" | "tasks";

export function Workspace({ sprintId, ticketId }: { sprintId: string; ticketId: string }) {
  const remote = useRemoteTicket();
  const inner = <WorkspaceInner sprintId={sprintId} ticketId={ticketId} />;
  // The teacher's live view already provides the session; a student's page announces itself for live help.
  if (remote) return inner;
  const { ticket } = getTicket(sprintId, ticketId)!;
  return <StudentLive sprintId={sprintId} ticketId={ticketId} title={ticket.title}>{inner}</StudentLive>;
}

function WorkspaceInner({ sprintId, ticketId }: { sprintId: string; ticketId: string }) {
  const { sprint, ticket } = getTicket(sprintId, ticketId)!;
  const key = ticketKey(sprintId, ticketId);
  const store = useStore();
  // In the teacher's live view the ticket state is the student's, and edits are sent to the student.
  const remote = useRemoteTicket();
  const st = remote ? remote.st : getTicketState(store, key);
  const updateTicket = (k: string, fn: (t: TicketState) => TicketState) => (remote ? remote.update(fn) : updateLocal(k, fn));
  const { setInfo } = useWorkspace();
  useActiveTime(remote ? null : key); // teacher views never count as student time
  const [result, setResult] = useState<RunResult | null>(null);
  const [previewSignal, setPreviewSignal] = useState(0);
  const [mobileTab, setMobileTab] = useState<MobileTab>("learn");
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [layout, setLayout, applyLayout] = useLayout();
  useLiveSync("result", result, setResult);
  useLiveSync("previewSignal", previewSignal, setPreviewSignal);
  useLiveSync("layout", layout.id, (id) => applyLayout(id));
  useLiveSync("sideCollapsed", sideCollapsed, (c) => (c ? sidePanel.current?.collapse() : sidePanel.current?.expand()));
  const swap = layout.id === "code-left";
  // "Focus on code" starts with the side panel folded away.
  useEffect(() => {
    if (layout.id === "focus") setTimeout(() => sidePanel.current?.collapse(), 0);
    else if (sidePanel.current?.isCollapsed()) sidePanel.current.expand();
  }, [layout.id, layout.v]);
  const sidePanel = useRef<ImperativePanelHandle>(null);
  const issuedTickets = useIssuedTickets(sprint);
  const pos = issuedTickets.findIndex((t) => t.id === ticket.id);
  const nextTicket = pos < 0 ? undefined : issuedTickets[pos + 1];

  const files: Record<string, string> = Object.fromEntries(
    ticket.task.files.filter((f) => !f.readOnly).map((f) => [f.path, st.files[f.path] ?? f.content]),
  );

  // Opening a ticket = "viewed" → In Progress.
  useEffect(() => {
    if (!remote && store && getTicketState(store, key).status === "todo") updateLocal(key, (t) => ({ ...t, status: "in_progress" }));
  }, [store, key, remote]);

  // Share context with the AI mentor chat.
  const filesJson = JSON.stringify(files);
  useEffect(() => {
    setInfo({
      ticket: { id: ticket.id, title: ticket.title, task: ticket.task.instructions },
      solutionUrl: `/sprints/${sprint.id}/tickets/${ticket.id}/solution`,
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
    setToast(`🎉 PR merged! +${ticket.xp} XP`);
    setTimeout(() => setToast(null), 3500);
  }

  /** Shows the "run my code on an image" preview in the code panel's output area. */
  function openPreview() {
    setMobileTab("code");
    setPreviewSignal((n) => n + 1);
  }

  const learn = (
    <div className="pane-pad">
      <div className="briefing">
        <div className="who" aria-hidden>{sprint.project.techLead.avatar}</div>
        <div>
          <div className="small muted">{sprint.project.techLead.name} · {sprint.project.techLead.role} assigned you this</div>
          <Markdown>{ticket.briefing}</Markdown>
        </div>
      </div>
      <h3 style={{ marginTop: 0 }}>After this ticket you will be able to…</h3>
      <ul className="objectives">
        {ticket.objectives.map((o) => <li key={o}>{o}</li>)}
      </ul>
      <LessonBlocks
        blocks={ticket.blocks}
        predictions={st.predictions}
        onPredict={(id, choice) => updateTicket(key, (t) => ({ ...t, predictions: { ...t.predictions, [id]: choice } }))}
        answers={st.answers ?? {}}
        onAnswer={(id, text) => updateTicket(key, (t) => ({ ...t, answers: { ...(t.answers ?? {}), [id]: text } }))}
        visualizations={ticket.visualizations}
        renderViz={(i) => renderViz(ticket.visualizations[i], ticket, files)}
        onOpenPreview={openPreview}
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
          <li>{lt && lt.total > 0 && lt.passed === lt.total ? "✅" : "⬜"} All automated tests pass {lt ? `(now ${lt.passed}/${lt.total})` : ""}</li>
          <li>{st.status === "merged" ? "✅" : "⬜"} Merge PR</li>
          <li>{st.tutorVerified ? "✅" : "⬜"} Teacher code review (passing tests doesn't mean every idea is clear yet, so your teacher checks too)</li>
        </ul>
        {st.status === "in_review" && (
          <button className="btn ok" onClick={merge}>🚀 Open PR &amp; Merge (+{ticket.xp} XP)</button>
        )}
        {st.status === "merged" && nextTicket && (!remote || remote.links) && (
          <Link className="btn primary" href={remote?.links ? remote.links.ticket(nextTicket.id) : `/sprints/${sprint.id}/tickets/${nextTicket.id}`}>Next ticket: {nextTicket.id} →</Link>
        )}
        {st.status === "merged" && !nextTicket && <div className="callout lead">All tickets in this sprint are done! 🎉 Your teacher will review them, and the next sprint will show up on your dashboard.</div>}
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
      split={!isMobileNow()}
      outputSide={layout.id === "output-right" ? "right" : "below"}
      previewSignal={previewSignal}
    />
  );

  const game = ticket.game ? <div className="game-pane"><GameStage ticket={ticket} files={files} /></div> : null;

  return (
    <div className="ws" data-live-root>
      <div className="ws-head">
        {!remote ? (
          <Link href={`/sprints/${sprint.id}`} className="small">← Sprint {sprint.number} board</Link>
        ) : remote.links ? (
          <Link href={remote.links.board} className="small">← {remote.links.boardLabel}</Link>
        ) : null}
        <span className="ticket-id">{ticket.id}</span>
        {store && !remote && <StarButton ticketKey={key} starred={!!st.starred} label={ticket.id} />}
        <strong style={{ flex: 1, minWidth: 200 }}>{ticket.title}</strong>
        <span className={`pill ${st.status}`}>{STATUS_LABEL[st.status]}</span>
        <span className="small muted">{ticket.xp} XP</span>
        {!game && <LayoutMenu layout={layout} onChange={setLayout} />}
      </div>

      <div className="ws-tabs" role="tablist" aria-label="Workspace">
        {((game ? ["learn", "code", "game", "tasks"] : ["learn", "code", "tasks"]) as MobileTab[]).map((t) => (
          <button key={t} role="tab" className="btn small" aria-selected={mobileTab === t} onClick={() => setMobileTab(t)}>
            {{ learn: "📖 Learn", code: "⌨️ Code", game: "🎮 Game", tasks: "✅ Tasks" }[t]}
          </button>
        ))}
      </div>

      <div className="ws-body">
        <MediaSwitch
          desktop={game ? (
            // Game tickets: lesson above code on the left; the game and the class preview on the right.
            <PanelGroup direction="horizontal" autoSaveId="ws-layout-game">
              <Panel id="work" defaultSize={52} minSize={35} order={1}>
                <PanelGroup direction="vertical" autoSaveId="ws-layout-game-left">
                  <Panel id="lesson" defaultSize={50} minSize={20} order={1}>
                    <div className="pane" data-live-scroll="side">{learn}</div>
                  </Panel>
                  <PanelResizeHandle className="resize-handle horiz" aria-label="Resize" />
                  <Panel id="code" defaultSize={50} minSize={25} order={2}>
                    <div className="pane">{code}</div>
                  </Panel>
                </PanelGroup>
              </Panel>
              <PanelResizeHandle className="resize-handle" aria-label="Resize" />
              <Panel id="game" defaultSize={48} minSize={30} order={2}>
                <div className="pane">{game}</div>
              </Panel>
            </PanelGroup>
          ) : (
            <PanelGroup key={`${layout.id}-${layout.v}`} direction="horizontal" autoSaveId={swap ? "ws-layout-2col-swap" : "ws-layout-2col"}>
              {swap ? (
                <>
              <Panel id="code" defaultSize={56} minSize={35} order={swap ? 1 : 2}>
                <div className="pane">{code}</div>
              </Panel>
              <PanelResizeHandle className="resize-handle" aria-label="Resize" />
              <Panel
                ref={sidePanel}
                defaultSize={44}
                minSize={28}
                collapsible
                collapsedSize={3}
                id="side"
                order={swap ? 2 : 1}
                onCollapse={() => setSideCollapsed(true)}
                onExpand={() => setSideCollapsed(false)}
              >
                {sideCollapsed ? (
                  <div className="collapsed-strip">
                    <button className="btn small" onClick={() => sidePanel.current?.expand()} aria-label="Show lesson" title="Lesson">📖</button>
                  </div>
                ) : (
                  <div className="side">
                    <div className="side-tabs" role="tablist" aria-label="Side panel">
                      <button role="tab" aria-selected>📖 Lesson & task</button>
                      <div className="spacer" />
                      <button className="btn small ghost" onClick={() => sidePanel.current?.collapse()} aria-label="Collapse the side panel to widen the code" title="Collapse to widen the code">{swap ? "⇥" : "⇤"}</button>
                    </div>
                    <div className="pane" data-live-scroll="side">{learn}</div>
                  </div>
                )}
              </Panel>
                </>
              ) : (
                <>
              <Panel
                ref={sidePanel}
                defaultSize={44}
                minSize={28}
                collapsible
                collapsedSize={3}
                id="side"
                order={swap ? 2 : 1}
                onCollapse={() => setSideCollapsed(true)}
                onExpand={() => setSideCollapsed(false)}
              >
                {sideCollapsed ? (
                  <div className="collapsed-strip">
                    <button className="btn small" onClick={() => sidePanel.current?.expand()} aria-label="Show lesson" title="Lesson">📖</button>
                  </div>
                ) : (
                  <div className="side">
                    <div className="side-tabs" role="tablist" aria-label="Side panel">
                      <button role="tab" aria-selected>📖 Lesson & task</button>
                      <div className="spacer" />
                      <button className="btn small ghost" onClick={() => sidePanel.current?.collapse()} aria-label="Collapse the side panel to widen the code" title="Collapse to widen the code">{swap ? "⇥" : "⇤"}</button>
                    </div>
                    <div className="pane" data-live-scroll="side">{learn}</div>
                  </div>
                )}
              </Panel>
              <PanelResizeHandle className="resize-handle" aria-label="Resize" />
              <Panel id="code" defaultSize={56} minSize={35} order={swap ? 1 : 2}>
                <div className="pane">{code}</div>
              </Panel>
                </>
              )}
            </PanelGroup>
          )}
          mobile={
            <div className="pane" data-live-scroll="mobile">
              {mobileTab === "learn" && learn}
              {mobileTab === "code" && code}
              {mobileTab === "game" && game}
              {mobileTab === "tasks" && <div className="pane-pad">{tasksBox()}</div>}
            </div>
          }
        />
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

/** Two resizable columns on desktop (lesson with inline visualizations | code), tabs on phones. */
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

const LAYOUT_KEY = "java-tutor.layout";
type LayoutId = "classic" | "code-left" | "output-right" | "focus";
type Layout = { id: LayoutId; v: number };

const LAYOUTS: { id: LayoutId; label: string; hint: string; cells: string[] }[] = [
  { id: "classic", label: "Lesson | Code", hint: "Lesson on the left, output under the code", cells: ["L", "C/O"] },
  { id: "code-left", label: "Code | Lesson", hint: "Code on the left, lesson on the right", cells: ["C/O", "L"] },
  { id: "output-right", label: "Output beside code", hint: "Lesson, code and output side by side (good for wide screens)", cells: ["L", "C", "O"] },
  { id: "focus", label: "Focus on code", hint: "Lesson folded away; open it from the strip on the left", cells: ["·", "C/O"] },
];

/** Per-browser workspace layout preset. Panel sizes inside each preset are saved by react-resizable-panels. */
function useLayout(): [Layout, (l: Layout, resetSizes?: boolean) => void, (id: LayoutId) => void] {
  const [layout, setState] = useState<Layout>({ id: "classic", v: 0 });
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? "null");
      if (saved && LAYOUTS.some((l) => l.id === saved.id)) setState({ id: saved.id, v: 0 });
    } catch {}
  }, []);
  const set = (l: Layout, resetSizes = false) => {
    try {
      if (resetSizes) {
        Object.keys(localStorage).filter((k) => k.startsWith("react-resizable-panels:ws-")).forEach((k) => localStorage.removeItem(k));
      }
      localStorage.setItem(LAYOUT_KEY, JSON.stringify({ id: l.id }));
    } catch {}
    setState(l);
  };
  // Live sessions: follow the other screen's layout without changing this browser's saved choice.
  const apply = (id: LayoutId) => LAYOUTS.some((l) => l.id === id) && setState((l) => (l.id === id ? l : { id, v: l.v + 1 }));
  return [layout, set, apply];
}

function LayoutMenu({ layout, onChange }: { layout: Layout; onChange: (l: Layout, resetSizes?: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return (
    <div className="layout-menu" ref={box}>
      <button className="btn small" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} title="Choose a layout">▦ Layout ▾</button>
      {open && (
        <div className="layout-pop" role="menu" aria-label="Layouts">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              role="menuitemradio"
              aria-checked={layout.id === l.id}
              className="layout-opt"
              onClick={() => { onChange({ id: l.id, v: layout.v + 1 }); setOpen(false); }}
              title={l.hint}
            >
              <span className="layout-pic" aria-hidden>
                {l.cells.map((c, i) => (
                  <span key={i} className={c === "·" ? "thin" : ""}>
                    {c.includes("/") ? <><i>{c.split("/")[0]}</i><i>{c.split("/")[1]}</i></> : <i>{c === "·" ? "" : c}</i>}
                  </span>
                ))}
              </span>
              <span>
                <strong>{l.label}</strong>
                <span className="small muted" style={{ display: "block" }}>{l.hint}</span>
              </span>
            </button>
          ))}
          <hr />
          <button role="menuitem" className="layout-opt reset" onClick={() => { onChange({ ...layout, v: layout.v + 1 }, true); setOpen(false); }}>
            ↺ Reset panel sizes
          </button>
          <div className="small muted" style={{ padding: "4px 8px" }}>Drag any divider to resize. Your choice is saved in this browser.</div>
        </div>
      )}
    </div>
  );
}

function isMobileNow() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches;
}
