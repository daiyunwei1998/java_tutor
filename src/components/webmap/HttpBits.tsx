import type { Method } from "@/lib/webmap/mockServer";

export function MethodTag({ m }: { m: Method | string }) {
  return <span className={`wm-method ${m}`}>{m}</span>;
}

export function StatusTag({ code, text }: { code: number; text?: string }) {
  return <span className={`wm-status s${String(code)[0]}`}>{code}{text ? ` ${text}` : ""}</span>;
}
