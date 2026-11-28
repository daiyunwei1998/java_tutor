"use client";

import type { Ticket } from "@/content/types";
import { runJava, type RunResult } from "@/lib/java-runner";
import { GAME_BRIDGE_SOURCE } from "./bridgeSource";

/** What GameBridge.java prints: the world after replaying the student's clicks. */
export type GameProp = { name: string; type: string; access: string; declaredIn: string; readable: boolean; via: string | null; value: unknown };
export type GameObject = { cls: string; chain: string[]; props: GameProp[]; str: string | null } | null;
export type GameField = { name: string; type: string; access: string; static: boolean; final: boolean; value: unknown };
export type GameMethod = { name: string; returns: string; params: string[]; access: string; static: boolean; overrides: boolean; staticValue: unknown };
export type GameClass = { name: string; extends: string | null; fields: GameField[]; methods: GameMethod[]; ctors: { params: string[]; access: string }[] };
export type GameResult = { action: string; ok: boolean; result?: string | null; error?: string; out: string };
export type GameState = { setupError: string | null; setupOut: string; results: GameResult[]; objects: GameObject[]; classes: GameClass[] };

export type GameRun =
  | { kind: "ok"; state: GameState }
  | { kind: "compile_error"; message: string }
  | { kind: "error"; message: string; raw?: RunResult };

/** One click in the game, in the harness's line format: index|kind|name|args. */
export function actionLine(index: number, kind: "call" | "set" | "tryset", name: string, args: string[]): string {
  const clean = (a: string) => a.replace(/[\n\r|\u001f]/g, " ");
  return `${index}|${kind}|${name}|${args.map(clean).join("\u001f")}`;
}

/**
 * Compiles the student's code with the ticket's read-only classes and the hidden harness, then replays the
 * actions. Test files and the files listed in ticket.game.exclude (scratch files such as Main.java) are left out,
 * so an experiment that does not compile there never breaks the game.
 */
export async function runGame(ticket: Ticket, files: Record<string, string>, actions: string[]): Promise<GameRun> {
  const exclude = new Set(ticket.game?.exclude ?? []);
  const src = ticket.task.files
    .filter((f) => !/Test\.java$/.test(f.path) && !exclude.has(f.path))
    .map((f) => ({ path: f.path, content: f.readOnly ? f.content : files[f.path] ?? f.content }));
  const r = await runJava({
    files: [...src, { path: "GameBridge.java", content: GAME_BRIDGE_SOURCE }],
    mode: "run",
    mainClass: "GameBridge",
    dataFiles: [{ name: "game-actions.txt", content: actions.join("\n") }],
    timeoutMs: 10_000,
  });
  if (r.status === "compile_error") return { kind: "compile_error", message: r.stderr };
  const m = r.stdout.match(/@@GAME([\s\S]*)@@END/);
  if (!m) return { kind: "error", message: r.status === "timeout" ? "Your code ran too long (an endless loop?)." : r.stderr || "The game could not read your classes.", raw: r };
  try {
    return { kind: "ok", state: JSON.parse(m[1]) as GameState };
  } catch {
    return { kind: "error", message: "The game could not read your classes.", raw: r };
  }
}

/** A readable value of an object's field (via a public field or a public getter), or undefined if outside code can't read it. */
export function readProp(o: GameObject, name: string): unknown {
  const p = o?.props.find((x) => x.name === name);
  return p && p.readable ? p.value : undefined;
}
