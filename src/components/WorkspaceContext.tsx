"use client";

import { createContext, useContext, useState } from "react";
import type { RunResult } from "@/lib/java-runner";

/** What the student is currently working on, shared with the global AI mentor chat. */
export type WorkspaceInfo = {
  ticket: { id: string; title: string; task: string };
  files: { path: string; content: string }[];
  lastResult: RunResult | null;
} | null;

const Ctx = createContext<{ info: WorkspaceInfo; setInfo: (i: WorkspaceInfo) => void }>({ info: null, setInfo: () => {} });

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [info, setInfo] = useState<WorkspaceInfo>(null);
  return <Ctx.Provider value={{ info, setInfo }}>{children}</Ctx.Provider>;
}

export const useWorkspace = () => useContext(Ctx);
