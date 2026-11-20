"use client";

export type AiError = { error_code: string; message: string };
export type AiReply = { reply: string } | AiError;

async function post(path: string, body: unknown): Promise<AiReply> {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (res.ok && data && typeof data.reply === "string") return { reply: data.reply };
    if (data && data.error_code) return data as AiError;
    if (res.status === 422) return { error_code: "invalid", message: "訊息太長或格式不對，請縮短一點再試。" };
    return { error_code: "error", message: "AI 助教暫時無法回應，請稍後再試。如果一直失敗，請聯絡老師。" };
  } catch {
    return { error_code: "offline", message: "連不到後端伺服器（FastAPI）。請確認後端有在執行，或聯絡老師。" };
  }
}

export const isAiError = (r: AiReply): r is AiError => "error_code" in r;

export function askMentor(body: unknown) {
  return post("/api/ai/chat", body);
}

export function askDebug(body: unknown) {
  return post("/api/ai/debug", body);
}
