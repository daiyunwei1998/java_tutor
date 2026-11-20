/**
 * Content model. Projects and tickets are plain data: no React, no executable JS inside content.
 * Visualizations are referenced by registered type name + validated config (see components/viz/registry.tsx).
 */

export type VizConfig =
  | { type: "array-memory"; title?: string; presets: ArrayMemoryPresetId[] }
  | { type: "traversal"; title?: string; modes: TraversalMode[]; rows: number; cols: number }
  | { type: "matrix-algo"; title?: string; algorithms: MatrixAlgorithmId[] }
  | { type: "image-lab"; title?: string; filter: ImageFilterId };

export type ArrayMemoryPresetId = "jagged" | "rectangular" | "alias" | "shared-row" | "null-row";
export type TraversalMode = "row-major" | "column-major" | "enhanced-for";
export type MatrixAlgorithmId = "row-sum" | "column-sum" | "main-diagonal" | "anti-diagonal" | "max" | "transpose";
export type ImageFilterId = "brighten";

export type LessonBlock =
  | { type: "markdown"; md: string }
  | { type: "code"; code: string; caption?: string }
  | {
      type: "predict";
      id: string;
      question: string;
      code?: string;
      options: string[];
      answer: number;
      explain: string;
    }
  | { type: "viz-link"; vizIndex: number; label: string }
  | { type: "callout"; tone: "info" | "warn" | "lead"; md: string };

export type SourceFile = { path: string; content: string; readOnly?: boolean };

export type CodeTask = {
  /** Shown above the editor. Markdown. */
  instructions: string;
  /** Editable files (student) + read-only files (visible tests). */
  files: SourceFile[];
  /** Class with main() for the ▶ Run button. */
  mainClass: string;
  /** Class whose static test* methods are run by the ✓ Test button. */
  testClass: string;
  /** Human-readable labels for test methods. */
  testLabels: Record<string, string>;
  hints: string[];
};

export type Ticket = {
  id: string; // e.g. PF-101
  slug: string;
  title: string;
  sprint: string;
  xp: number;
  /** Message from the tech lead that frames the task as real work. */
  briefing: string;
  objectives: string[];
  blocks: LessonBlock[];
  visualizations: VizConfig[];
  task: CodeTask;
  /** Ticket ids that should be merged first (soft lock in the UI). */
  dependsOn: string[];
};

export type Project = {
  id: string;
  title: string;
  company: string;
  tagline: string;
  description: string;
  course: string;
  unit: string;
  techLead: { name: string; role: string; avatar: string };
  tickets: Ticket[];
  upcoming: { title: string; note: string }[];
};
