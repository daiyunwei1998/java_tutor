"use client";

export type AiError = { error_code: string; message: string };
export type AiReply = { reply: string } | AiError;

async function post(path: string, body: unknown): Promise<AiReply> {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (res.ok && data && typeof data.reply === "string") return { reply: data.reply };
    if (data && data.error_code) return data as AiError;
    if (res.status === 422) return { error_code: "invalid", message: "The message is too long or malformed. Please shorten it and try again." };
    return { error_code: "error", message: "The AI tutor cannot answer right now. Please try again later. If it keeps failing, contact your teacher." };
  } catch {
    return { error_code: "offline", message: "Cannot reach the server. Check your connection, or contact your teacher." };
  }
}

export const isAiError = (r: AiReply): r is AiError => "error_code" in r;

export function askMentor(body: unknown) {
  return post("/api/ai/chat", body);
}

export function askDebug(body: unknown) {
  return post("/api/ai/debug", body);
}
