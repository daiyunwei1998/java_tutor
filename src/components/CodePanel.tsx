"use client";

import { java } from "@codemirror/lang-java";
import { EditorView } from "@codemirror/view";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Ticket } from "@/content/types";
import { askDebug, isAiError } from "@/lib/ai";
import { onRunnerState, parseDiagnostics, type RunResult, type RunnerState, runJava, warmUp } from "@/lib/java-runner";
import { useStore } from "@/lib/progress";
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
}: {
  ticket: Ticket;
  files: Record<string, string>;
  onChangeFile: (path: string, content: string) => void;
  onReset: () => void;
  result: RunResult | null;
  onResult: (r: RunResult, mode: "run" | "test") => void;
  hintsShown: number;
  onShowHint: () => void;
}) {
  const store = useStore();
  const task = ticket.task;
  const [active, setActive] = useState(task.files[0].path);
  const [runner, setRunner] = useState<{ s: RunnerState; err: string }>({ s: "idle", err: "" });
  const [running, setRunning] = useState<null | "run" | "test">(null);
  const [lastMode, setLastMode] = useState<"run" | "test" | null>(null);
  const [ai, setAi] = useState<{ busy: boolean; text?: string; error?: string }>({ busy: false });
  const [aiQuestion, setAiQuestion] = useState("");
  const cm = useRef<ReactCodeMirrorRef>(null);

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

  return (
    <div className="code-panel">
      <div className="file-tabs" role="tablist" aria-label="檔案">
        {task.files.map((f) => (
          <button key={f.path} role="tab" aria-selected={f.path === active} className="file-tab" onClick={() => setActive(f.path)}>
            {f.readOnly ? "🔒 " : ""}{f.path}
          </button>
        ))}
      </div>
      {activeFile.readOnly && <div className="small muted" style={{ padding: "4px 10px", background: "var(--surface-2)" }}>這是測試檔（唯讀）。看看測試在檢查什麼，可以幫你理解需求。</div>}
      <div className="editor-wrap">
        <CodeMirror
          ref={cm}
          value={activeFile.readOnly ? activeFile.content : files[active] ?? activeFile.content}
          editable={!activeFile.readOnly}
          readOnly={activeFile.readOnly}
          extensions={extensions}
          theme={typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"}
          onChange={(v) => !activeFile.readOnly && onChangeFile(active, v)}
          basicSetup={{ tabSize: 4, indentOnInput: true }}
          aria-label={`程式碼編輯器：${active}`}
        />
      </div>
      <div className="toolbar">
        <button className="btn" onClick={() => exec("run")} disabled={!!running || runner.s === "error"}>
          {running === "run" ? "⏳ 執行中…" : "▶ 執行 main"}
        </button>
        <button className="btn primary" onClick={() => exec("test")} disabled={!!running || runner.s === "error"}>
          {running === "test" ? "⏳ 測試中…" : "✓ 執行測試"}
        </button>
        <button className="btn" onClick={debugWithAi} disabled={ai.busy} title="把程式碼和最近一次的錯誤送給 AI 導師">
          {ai.busy ? "🤖 分析中…" : "🤖 AI 協助 Debug"}
        </button>
        <div className="spacer" />
        <span className="small muted row" style={{ gap: 6 }} aria-live="polite">
          <span className={`status-dot ${runner.s}`} />
          {runner.s === "loading" ? "Java 環境載入中（第一次約 10–30 秒）" : runner.s === "error" ? "Java 環境錯誤" : runner.s === "busy" ? "執行中" : "Java 17 · 在你的瀏覽器執行"}
        </span>
        <button className="btn small ghost" onClick={() => confirm("確定要把程式碼還原成一開始的版本嗎？你的修改會不見。") && onReset()}>↺ 還原</button>
      </div>
      <div className="output" aria-live="polite">
        {runner.s === "error" && <div className="console err">{runner.err}</div>}
        {!result && !ai.text && !ai.error && (
          <p className="muted small" style={{ margin: 0 }}>
            按 <strong>▶ 執行 main</strong> 看輸出，或按 <strong>✓ 執行測試</strong> 檢查你的實作。卡住了可以看提示或按 🤖。
          </p>
        )}
        {result && (
          <div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>
                {result.status === "compile_error" && "❌ 編譯錯誤"}
                {result.status === "runtime_error" && "💥 執行時錯誤 (Exception)"}
                {result.status === "timeout" && "⏱️ 執行逾時"}
                {result.status === "completed" && (lastMode === "test" ? (passed === total ? `✅ 測試全部通過 (${passed}/${total})` : `🧪 測試 ${passed}/${total} 通過`) : "✅ 執行完成")}
              </strong>
              {result.compileMs !== undefined && <span className="small muted">編譯 {result.compileMs} ms{result.runMs !== undefined ? ` · 執行 ${result.runMs} ms` : ""}</span>}
            </div>
            {diagnostics.length > 0 && (
              <ul className="small" style={{ paddingLeft: 18 }}>
                {diagnostics.map((d, i) => (
                  <li key={i}>
                    <button className="btn small ghost" style={{ color: "var(--bad)" }} onClick={() => jumpTo(d.file, d.line)}>
                      {d.file} 第 {d.line} 行
                    </button>
                    ：{d.message}
                  </li>
                ))}
              </ul>
            )}
            {result.tests && result.tests.length > 0 && (
              <div style={{ margin: "6px 0" }}>
                {result.tests.map((t) => (
                  <div key={t.name} className="test-row">
                    <span aria-label={t.passed ? "通過" : "失敗"}>{t.passed ? "✅" : "❌"}</span>
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
                <summary className="small muted">完整編譯器訊息</summary>
                <div className="console err">{result.stderr}</div>
              </details>
            )}
          </div>
        )}
        <details style={{ marginTop: 8 }}>
          <summary className="small muted">想跟 AI 補充說明你的問題？（選填）</summary>
          <input type="text" value={aiQuestion} onChange={(e) => setAiQuestion(e.target.value)} maxLength={500} placeholder="例如：我不懂為什麼 column 會超出範圍" style={{ width: "100%", marginTop: 6 }} />
        </details>
        {ai.error && <div className="ai-box error" role="alert">⚠️ {ai.error}</div>}
        {ai.text && (
          <div className="ai-box">
            <div className="small muted">🤖 Senior Dev 的建議</div>
            <Markdown>{ai.text}</Markdown>
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          {task.hints.slice(0, hintsShown).map((h, i) => (
            <div key={i} className="callout"><strong>提示 {i + 1}：</strong><Markdown>{h}</Markdown></div>
          ))}
          {hintsShown < task.hints.length && (
            <button className="btn small" onClick={onShowHint}>💡 看提示 {hintsShown + 1} / {task.hints.length}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function extractTaskText(t: Ticket): string {
  return t.blocks.filter((b) => b.type === "markdown").map((b) => (b as { md: string }).md).slice(-1).join("\n");
}
