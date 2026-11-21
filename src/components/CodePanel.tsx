"use client";

import { java } from "@codemirror/lang-java";
import { Prec, type StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import CodeMirror, { ExternalChange, type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import type { Ticket } from "@/content/types";
import { askDebug, isAiError } from "@/lib/ai";
import { breakpointSpec, type Breakpoints, buildDebugTrace, type DebugTrace, MAX_DEBUG_STEPS } from "@/lib/debugger";
import { debugExtensions, setBreakpoints, setDebugLines } from "@/lib/editor-debug";
import { debugJava, onRunnerState, parseDiagnostics, type RunResult, type RunnerState, runJava, warmUp } from "@/lib/java-runner";
import { useStore } from "@/lib/progress";
import { registerEditor } from "@/lib/live/anchor";
import { useResolvedTheme } from "@/lib/theme";
import { useLive, useLiveEvent, useLiveSync } from "./live/LiveContext";
import { DebugPanel } from "./DebugPanel";
import { Markdown } from "./Markdown";
import { isPreviewViz, renderViz } from "./viz/VizPanel";

export function CodePanel({
  ticket,
  files,
  onChangeFile,
  onReset,
  result,
  onResult,
  hintsShown,
  onShowHint,
  split = false,
  outputSide = "below",
  previewSignal = 0,
}: {
  ticket: Ticket;
  files: Record<string, string>;
  onChangeFile: (path: string, content: string) => void;
  onReset: () => void;
  result: RunResult | null;
  onResult: (r: RunResult, mode: "run" | "test") => void;
  hintsShown: number;
  onShowHint: () => void;
  /** Desktop: a draggable divider between the editor and the output/tests panel. */
  split?: boolean;
  /** Where the output/tests panel sits next to the editor on desktop. */
  outputSide?: "below" | "right";
  /** Incremented by the lesson's "Open the image preview" button. */
  previewSignal?: number;
}) {
  const store = useStore();
  const theme = useResolvedTheme();
  const task = ticket.task;
  const [active, setActive] = useState(task.files[0].path);
  const [runner, setRunner] = useState<{ s: RunnerState; err: string }>({ s: "idle", err: "" });
  const [running, setRunning] = useState<null | "run" | "test">(null);
  const [lastMode, setLastMode] = useState<"run" | "test" | null>(null);
  const [ai, setAi] = useState<{ busy: boolean; text?: string; error?: string }>({ busy: false });
  const [aiQuestion, setAiQuestion] = useState("");
  const cm = useRef<ReactCodeMirrorRef>(null);
  const outPanel = useRef<ImperativePanelHandle>(null);
  const [outCollapsed, setOutCollapsed] = useState(false);
  // Tickets with an image preview get a second output tab that runs the student's code on a real image.
  const previewViz = ticket.visualizations.find(isPreviewViz);
  const [outTab, setOutTab] = useState<"console" | "preview" | "debug">("console");

  // Step-through debugger: breakpoints per file (1-based lines), the recorded run, and the step being shown.
  const [bps, setBps] = useState<Breakpoints>({});
  const [dbg, setDbg] = useState<{ trace: DebugTrace; i: number; code: string } | null>(null);
  const [debugging, setDebugging] = useState(false);
  const activeRef = useRef(active);
  activeRef.current = active;

  // Live session: both screens show the same file, output tab and run state. In the teacher's view, Run / Test /
  // AI are pressed on the student's computer (their browser runs the Java, their account asks the AI).
  const live = useLive();
  const isTeacher = live?.role === "teacher";
  useLiveSync("activeFile", active, setActive);
  useLiveSync("running", running, setRunning);
  useLiveSync("lastMode", lastMode, setLastMode);
  useLiveSync("ai", ai, setAi);
  useLiveSync("aiQuestion", aiQuestion, setAiQuestion);
  useLiveSync("outTab", outTab, setOutTab);
  useLiveEvent<{ action: "run" | "test" | "ai" }>("action", (d) => {
    if (isTeacher || running) return;
    if (d.action === "ai") debugWithAi();
    else exec(d.action);
  });

  function openPreview() {
    setOutTab("preview");
    const p = outPanel.current;
    if (p) {
      if (p.isCollapsed()) p.expand();
      if (p.getSize() < 50) p.resize(55);
    }
  }
  useEffect(() => {
    if (previewSignal > 0) openPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewSignal]);

  useEffect(() => onRunnerState((s, err) => setRunner({ s, err })), []);
  useEffect(() => {
    // Start downloading the JVM as soon as a workspace opens, so the first Run is faster.
    if (!isTeacher) warmUp().catch(() => {});
  }, [isTeacher]);

  const activeFile = task.files.find((f) => f.path === active)!;
  const extensions = useMemo(
    () => [
      java(),
      EditorView.lineWrapping,
      Prec.highest(debugExtensions((lines) => setBps((b) => ({ ...b, [activeRef.current]: lines })), () => true)),
    ],
    [],
  );
  const editorValue = activeFile.readOnly ? activeFile.content : files[active] ?? activeFile.content;

  // When the code changes from outside (the teacher typing, a progress sync), apply only the changed span so the
  // local cursor stays where it was. Runs before the editor's own effect, which would replace the whole document.
  useLayoutEffect(() => {
    const view = cm.current?.view;
    if (!view) return;
    const cur = view.state.doc.toString();
    if (cur === editorValue) return;
    let a = 0;
    while (a < cur.length && a < editorValue.length && cur[a] === editorValue[a]) a++;
    let b = 0;
    while (b < cur.length - a && b < editorValue.length - a && cur[cur.length - 1 - b] === editorValue[editorValue.length - 1 - b]) b++;
    view.dispatch({ changes: { from: a, to: cur.length - b, insert: editorValue.slice(a, editorValue.length - b) }, annotations: [ExternalChange.of(true)] });
  }, [editorValue]);
  useEffect(() => {
    registerEditor(cm.current?.view, active);
    return () => registerEditor(undefined, active);
  }, [active]);
  const allFiles = task.files.map((f) => ({ path: f.path, content: f.readOnly ? f.content : files[f.path] ?? f.content }));
  const codeKey = JSON.stringify(allFiles.map((f) => f.content));
  const dbgStep = dbg?.trace.steps[dbg.i];

  // Breakpoints of the file that is open (the editor shows one file at a time).
  useEffect(() => {
    cm.current?.view?.dispatch({ effects: setBreakpoints.of(bps[active] ?? []) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Debugger: open the file of the paused line, highlight that line and keep it in view.
  useEffect(() => {
    if (dbgStep && dbgStep.file >= 0) {
      const f = dbg!.trace.files[dbgStep.file];
      if (f && f !== active) {
        setActive(f);
        return;
      }
    }
    const view = cm.current?.view;
    if (!view) return;
    const steps = dbg?.trace.steps ?? [];
    const prevStep = dbg && dbg.i > 0 ? steps[dbg.i - 1] : undefined;
    const fileIdx = task.files.findIndex((f) => f.path === active);
    const now = dbgStep && dbgStep.file === fileIdx ? dbgStep.line : 0;
    const was = prevStep && prevStep.file === fileIdx ? prevStep.line : 0;
    const effects: StateEffect<unknown>[] = [setDebugLines.of({ now, was })];
    if (now > 0 && now <= view.state.doc.lines) effects.push(EditorView.scrollIntoView(view.state.doc.line(now).from, { y: "nearest", yMargin: 60 }));
    view.dispatch({ effects });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbgStep, active]);

  function updateBreakpoint(file: string, line: number, change: { cond?: string } | null) {
    const list = (bps[file] ?? []).flatMap((b) => (b.line !== line ? [b] : change ? [{ line, cond: change.cond?.trim() || undefined }] : []));
    setBps({ ...bps, [file]: list });
    if (file === active) cm.current?.view?.dispatch({ effects: setBreakpoints.of(list) });
  }

  async function debug(fromStart = false) {
    // The memory picture needs room: open the output panel to at least about half.
    const p = outPanel.current;
    if (p) {
      if (p.isCollapsed()) p.expand();
      if (p.getSize() < 50) p.resize(58);
    }
    setOutTab("debug");
    setDebugging(true);
    setDbg(null);
    const paths = task.files.map((f) => f.path);
    const r = await debugJava({ files: allFiles, mainClass: task.mainClass, breakpoints: fromStart ? "" : breakpointSpec(paths, bps), maxSteps: MAX_DEBUG_STEPS });
    setDebugging(false);
    if (r.status === "compile_error") {
      // Same as Run: show the compile errors in the console.
      setOutTab("console");
      setLastMode("run");
      onResult(r as RunResult, "run");
      return;
    }
    setDbg({ trace: buildDebugTrace(r, paths), i: 0, code: codeKey });
  }
  const diagnostics = result?.status === "compile_error" ? parseDiagnostics(result.stderr) : [];

  async function exec(mode: "run" | "test") {
    if (isTeacher) return live!.send("action", { action: mode });
    if (outPanel.current?.isCollapsed()) outPanel.current.expand();
    setOutTab("console");
    setRunning(mode);
    setAi({ busy: false });
    const r = await runJava({ files: allFiles, mode, mainClass: task.mainClass, testClass: task.testClass });
    setRunning(null);
    setLastMode(mode);
    onResult(r, mode);
  }

  function jumpTo(file: string, line: number) {
    setActive(file);
    setTimeout(() => {
      const view = cm.current?.view;
      if (!view) return;
      const l = view.state.doc.line(Math.min(line, view.state.doc.lines));
      view.dispatch({ selection: { anchor: l.from, head: l.to }, scrollIntoView: true });
      view.focus();
    }, 30);
  }

  async function debugWithAi() {
    if (isTeacher) return live!.send("action", { action: "ai" });
    if (!store?.profile) return;
    setAi({ busy: true });
    const res = await askDebug({
      student: { id: store.profile.id, name: store.profile.name },
      ticket: { id: ticket.id, title: ticket.title, task: ticket.task.instructions + "\n\n" + extractTaskText(ticket) },
      files: allFiles,
      result: result
        ? { status: result.status, stdout: result.stdout.slice(0, 8000), stderr: result.stderr.slice(0, 8000), tests: (result.tests ?? []).map((t) => ({ ...t, name: task.testLabels[t.name] ?? t.name })) }
        : null,
      question: aiQuestion,
    });
    setAi(isAiError(res) ? { busy: false, error: res.message } : { busy: false, text: res.reply });
  }

  const passed = result?.tests?.filter((t) => t.passed).length ?? 0;
  const total = result?.tests?.length ?? 0;

  const editorPart = (
    <div className="code-top">
      <div className="file-tabs" role="tablist" aria-label="Files">
        {task.files.map((f) => (
          <button key={f.path} role="tab" aria-selected={f.path === active} className="file-tab" onClick={() => setActive(f.path)}>
            {f.readOnly ? "🔒 " : ""}{f.path}
          </button>
        ))}
      </div>
      {activeFile.readOnly && <div className="small muted" style={{ padding: "4px 10px", background: "var(--surface-2)" }}>This is the test file (read-only). Reading what the tests check helps you understand the requirements.</div>}
      <div className="editor-wrap">
        <CodeMirror
          ref={cm}
          value={editorValue}
          onCreateEditor={(view) => registerEditor(view, active)}
          editable={!activeFile.readOnly}
          readOnly={activeFile.readOnly}
          extensions={extensions}
          theme={theme}
          onChange={(v) => !activeFile.readOnly && onChangeFile(active, v)}
          basicSetup={{ tabSize: 4, indentOnInput: true, lineNumbers: false }}
          aria-label={`Code editor: ${active}`}
        />
      </div>
      {Object.values(bps).some((l) => l.length > 0) && (
        <div className="bp-bar" aria-label="Breakpoints">
          <span className="small muted">Breakpoints</span>
          {task.files.flatMap((f) =>
            (bps[f.path] ?? []).map((b) => (
              <span key={f.path + b.line} className={`bp-chip${b.cond ? " cond" : ""}`}>
                <button className="bp-go" onClick={() => jumpTo(f.path, b.line)} title="Show this line">
                  <span className="cm-bp-dot" aria-hidden /> {task.files.length > 1 ? `${f.path}:` : "line "}{b.line}
                </button>
                <label className="bp-cond">
                  <span>when</span>
                  <input
                    key={b.cond ?? ""}
                    type="text"
                    defaultValue={b.cond ?? ""}
                    placeholder="always"
                    spellCheck={false}
                    aria-label={`Condition for the breakpoint on line ${b.line}, for example row == 7`}
                    title="Optional Java condition, e.g. row == 7. The debugger then pauses here only when it is true."
                    onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                    onBlur={(e) => e.target.value.trim() !== (b.cond ?? "") && updateBreakpoint(f.path, b.line, { cond: e.target.value })}
                  />
                </label>
                <button className="bp-x" onClick={() => updateBreakpoint(f.path, b.line, null)} aria-label={`Remove the breakpoint on line ${b.line}`} title="Remove">✕</button>
              </span>
            )),
          )}
        </div>
      )}
      <div className="toolbar">
        <button className="btn" onClick={() => exec("run")} disabled={!!running || runner.s === "error"}>
          {running === "run" ? "⏳ Running…" : "▶ Run main"}
        </button>
        <button className="btn primary" onClick={() => exec("test")} disabled={!!running || runner.s === "error"}>
          {running === "test" ? "⏳ Testing…" : "✓ Run tests"}
        </button>
        <button
          className="btn"
          onClick={() => debug()}
          disabled={!!running || debugging || runner.s === "error"}
          title="Run main one step at a time and watch the variables. Click left of a line number to set a breakpoint where it should pause first."
        >
          {debugging ? "⏳ Recording…" : "🐞 Debug"}
        </button>
        {previewViz && (
          <button className="btn" onClick={openPreview} title="Run your code on a real image and see the result">🖼 Try on an image</button>
        )}
        <button className="btn" onClick={debugWithAi} disabled={ai.busy} title="Send your code and the latest error to the AI mentor">
          {ai.busy ? "🤖 Thinking…" : "🤖 AI Debug Help"}
        </button>
        <div className="spacer" />
        <span className="small muted row" style={{ gap: 6 }} aria-live="polite">
          <span className={`status-dot ${runner.s}`} />
          {runner.s === "loading" ? "Loading Java (first time ~10–30 s)" : runner.s === "error" ? "Java error" : runner.s === "busy" ? "Running" : "Java 17 · runs in your browser"}
        </span>
        {split && (
          <button className="btn small ghost" onClick={() => (outCollapsed ? outPanel.current?.expand() : outPanel.current?.collapse())} title={outCollapsed ? "Show the output panel" : "Hide the output panel to see more code"} aria-label="Toggle output panel">
            {outCollapsed ? "▴ Output" : "▾ Output"}
          </button>
        )}
        <button className="btn small ghost" onClick={() => confirm("Reset the code to the starter version? Your changes will be lost.") && onReset()}>↺ Reset</button>
      </div>
    </div>
  );

  const showDebugTab = debugging || !!dbg;
  const outputTabs = (previewViz || showDebugTab) && (
    <div className="out-tabs" role="tablist" aria-label="Output">
      <button role="tab" aria-selected={outTab === "console"} onClick={() => setOutTab("console")}>Console &amp; tests</button>
      {showDebugTab && <button role="tab" aria-selected={outTab === "debug"} onClick={() => setOutTab("debug")}>🐞 Debugger</button>}
      {previewViz && <button role="tab" aria-selected={outTab === "preview"} onClick={() => setOutTab("preview")}>🖼 Image preview (your code)</button>}
    </div>
  );

  const outputPart = outTab === "debug" && showDebugTab ? (
      <div className="output debug-output">
        {outputTabs}
        {debugging || !dbg ? (
          <p className="muted small">⏳ Running your program and recording every step{runner.s === "loading" ? " (loading Java first)" : ""}…</p>
        ) : (
          <DebugPanel
            trace={dbg.trace}
            i={dbg.i}
            onStep={(i) => setDbg((d) => (d ? { ...d, i } : d))}
            breakpoints={bps}
            stale={dbg.code !== codeKey}
            onRestart={() => debug()}
            onFromStart={() => debug(true)}
            onStop={() => {
              setDbg(null);
              setOutTab("console");
            }}
          />
        )}
      </div>
  ) : previewViz && outTab === "preview" ? (
      <div className="output">
        {outputTabs}
        {renderViz(previewViz, ticket, files)}
      </div>
  ) : (
      <div className="output" aria-live="polite" data-live-scroll="output">
        {outputTabs}
        {runner.s === "error" && <div className="console err">{runner.err}</div>}
        {!result && !ai.text && !ai.error && (
          <p className="muted small" style={{ margin: 0 }}>
            Press <strong>▶ Run main</strong> to see output, or <strong>✓ Run tests</strong> to check your work. Stuck? Open a hint, press 🤖,
            or press <strong>🐞 Debug</strong> to run your code step by step (click left of a line number first to choose where it pauses).
          </p>
        )}
        {result && (
          <div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>
                {result.status === "compile_error" && "❌ Compile error"}
                {result.status === "runtime_error" && "💥 Runtime error (exception)"}
                {result.status === "timeout" && "⏱️ Time limit exceeded"}
                {result.status === "completed" && (lastMode === "test" ? (passed === total ? `✅ All tests passed (${passed}/${total})` : `🧪 ${passed}/${total} tests passed`) : "✅ Finished")}
              </strong>
              {result.compileMs !== undefined && <span className="small muted">compile {result.compileMs} ms{result.runMs !== undefined ? ` · run ${result.runMs} ms` : ""}</span>}
            </div>
            {diagnostics.length > 0 && (
              <ul className="small" style={{ paddingLeft: 18 }}>
                {diagnostics.map((d, i) => (
                  <li key={i}>
                    <button className="btn small ghost" style={{ color: "var(--bad)" }} onClick={() => jumpTo(d.file, d.line)}>
                      {d.file} line {d.line}
                    </button>
                    : {d.message}
                  </li>
                ))}
              </ul>
            )}
            {result.tests && result.tests.length > 0 && (
              <div style={{ margin: "6px 0" }}>
                {result.tests.map((t) => (
                  <div key={t.name} className="test-row">
                    <span aria-label={t.passed ? "passed" : "failed"}>{t.passed ? "✅" : "❌"}</span>
                    <div>
                      <div>{task.testLabels[t.name] ?? t.name}</div>
                      {!t.passed && <div className="msg">{t.message}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {result.stdout && <div className="console">{result.stdout}</div>}
            {result.stderr && (result.status !== "compile_error" || diagnostics.length === 0) && <div className="console err">{result.stderr}</div>}
            {result.status === "compile_error" && diagnostics.length > 0 && (
              <details>
                <summary className="small muted">Full compiler output</summary>
                <div className="console err">{result.stderr}</div>
              </details>
            )}
          </div>
        )}
        <details style={{ marginTop: 8 }}>
          <summary className="small muted">Add a note for the AI? (optional)</summary>
          <input type="text" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} maxLength={500} placeholder="e.g. I don't get why the column goes out of range" style={{ width: "100%", marginTop: 6 }} />
        </details>
        {ai.error && <div className="ai-box error" role="alert">⚠️ {ai.error}</div>}
        {ai.text && (
          <div className="ai-box">
            <div className="small muted">🤖 Senior Dev says</div>
            <Markdown>{ai.text}</Markdown>
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          {task.hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="callout"><strong>Hint {i + 1}:</strong><Markdown>{h}</Markdown></div>
          ))}
          {hintsShown < task.hints.length && (
            <button className="btn small" onClick={onShowHint}>💡 Hint {hintsShown + 1} / {task.hints.length}</button>
          )}
        </div>
      </div>
  );

  if (!split) {
    return (
      <div className="code-panel">
        {editorPart}
        {outputPart}
      </div>
    );
  }

  return (
    <PanelGroup
      key={outputSide}
      direction={outputSide === "right" ? "horizontal" : "vertical"}
      autoSaveId={outputSide === "right" ? "ws-code-split-right" : "ws-code-split"}
      className="code-panel"
    >
      <Panel id="editor" order={1} defaultSize={outputSide === "right" ? 58 : 62} minSize={25}>
        {editorPart}
      </Panel>
      <PanelResizeHandle className={`resize-handle${outputSide === "right" ? "" : " horiz"}`} aria-label="Resize the output panel" />
      <Panel
        id="output"
        order={2}
        ref={outPanel}
        defaultSize={outputSide === "right" ? 42 : 38}
        minSize={12}
        collapsible
        collapsedSize={0}
        onCollapse={() => setOutCollapsed(true)}
        onExpand={() => setOutCollapsed(false)}
      >
        {outputPart}
      </Panel>
    </PanelGroup>
  );
}

function extractTaskText(t: Ticket): string {
  return t.blocks.filter((b) => b.type === "markdown").map((b) => (b as { md: string }).md).slice(-1).join("\n");
}
