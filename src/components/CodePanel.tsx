"use client";

import { java } from "@codemirror/lang-java";
import { EditorView } from "@codemirror/view";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels";
import type { Ticket } from "@/content/types";
import { askDebug, isAiError } from "@/lib/ai";
import { onRunnerState, parseDiagnostics, type RunResult, type RunnerState, runJava, warmUp } from "@/lib/java-runner";
import { useStore } from "@/lib/progress";
import { useResolvedTheme } from "@/lib/theme";
import { Markdown } from "./Markdown";

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

  useEffect(() => onRunnerState((s, err) => setRunner({ s, err })), []);
  useEffect(() => {
    // Start downloading the JVM as soon as a workspace opens, so the first Run is faster.
    warmUp().catch(() => {});
  }, []);

  const activeFile = task.files.find((f) => f.path === active)!;
  const extensions = useMemo(() => [java(), EditorView.lineWrapping], []);
  const allFiles = task.files.map((f) => ({ path: f.path, content: f.readOnly ? f.content : files[f.path] ?? f.content }));
  const diagnostics = result?.status === "compile_error" ? parseDiagnostics(result.stderr) : [];

  async function exec(mode: "run" | "test") {
    if (outPanel.current?.isCollapsed()) outPanel.current.expand();
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
          value={activeFile.readOnly ? activeFile.content : files[active] ?? activeFile.content}
          editable={!activeFile.readOnly}
          readOnly={activeFile.readOnly}
          extensions={extensions}
          theme={theme}
          onChange={(v) => !activeFile.readOnly && onChangeFile(active, v)}
          basicSetup={{ tabSize: 4, indentOnInput: true }}
          aria-label={`Code editor: ${active}`}
        />
      </div>
      <div className="toolbar">
        <button className="btn" onClick={() => exec("run")} disabled={!!running || runner.s === "error"}>
          {running === "run" ? "⏳ Running…" : "▶ Run main"}
        </button>
        <button className="btn primary" onClick={() => exec("test")} disabled={!!running || runner.s === "error"}>
          {running === "test" ? "⏳ Testing…" : "✓ Run tests"}
        </button>
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

  const outputPart = (
      <div className="output" aria-live="polite">
        {runner.s === "error" && <div className="console err">{runner.err}</div>}
        {!result && !ai.text && !ai.error && (
          <p className="muted small" style={{ margin: 0 }}>
            Press <strong>▶ Run main</strong> to see output, or <strong>✓ Run tests</strong> to check your work. Stuck? Open a hint or press 🤖.
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
