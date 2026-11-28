import type { Trace } from "@/lib/trace";
import type { TraceId } from "./types";
import { sprint2Traces } from "./sprints/s02-inheritance/traces";

/**
 * Traces that tickets can embed with `{ type: "trace", traceId }`. They live here, not inside the ticket
 * files, so tickets stay plain data (tools/verify-content.mjs loads ticket files with plain Node).
 */
export const TRACES: Record<TraceId, Trace> = { ...sprint2Traces };
