import type { Trace } from "@/lib/trace";

/**
 * Content model. Projects and tickets are plain data: no React, no executable JS inside content.
 * Visualizations are referenced by registered type name + validated config (see components/viz/registry.tsx).
 */

export type VizConfig =
  | { type: "array-memory"; title?: string; presets: ArrayMemoryPresetId[] }
  | { type: "traversal"; title?: string; modes: TraversalMode[]; rows: number; cols: number }
  | { type: "matrix-algo"; title?: string; algorithms: MatrixAlgorithmId[] }
  | { type: "image-lab"; title?: string; filter: ImageFilterId }
  | { type: "filter-lab"; title?: string; filter: FilterLabId }
  | { type: "concept"; title?: string; concept: ConceptId };

export type ArrayMemoryPresetId = "jagged" | "rectangular" | "alias" | "shared-row" | "null-row";
export type TraversalMode = "row-major" | "column-major" | "enhanced-for";
export type MatrixAlgorithmId = "row-sum" | "column-sum" | "main-diagonal" | "anti-diagonal" | "max" | "transpose";
export type ImageFilterId = "brighten";
/** Filters of the PF-2xx tickets, previewed by components/viz/FilterLab.tsx. */
export type FilterLabId = "grayscale" | "flip" | "blur" | "edges" | "pipeline";
/** Worked-example explanations with real photos and numbers (components/viz/concepts/). */
export type ConceptId = "rgb-grayscale" | "flip-mapping" | "box-blur" | "sobel" | "pipeline-frames";

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
  xp: number;
  /** Message from the tech lead that frames the task as real work. */
  briefing: string;
  objectives: string[];
  blocks: LessonBlock[];
  visualizations: VizConfig[];
  task: CodeTask;
};

/** A block on a Knowledge Space page (one topic = one single-column page). */
export type KnowledgeSection =
  | { type: "markdown"; md: string }
  | { type: "callout"; tone: "info" | "warn"; md: string }
  | { type: "trace"; trace: Trace; caption?: string }
  | { type: "traversal-lab"; modes: TraversalMode[]; rows: number; cols: number };

/** Supplementary material that goes beyond the textbook; never required for tickets. */
export type KnowledgeTopic = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  sections: KnowledgeSection[];
};

/** The story a sprint's tickets live in. Each sprint can have its own fitting mini project. */
export type MiniProject = {
  name: string; // e.g. "Mini Photoshop"
  company: string; // fictional team, e.g. "PixelForge Studio"
  tagline: string;
  description: string;
  techLead: { name: string; role: string; avatar: string };
};

/**
 * A sprint is the unit the teacher assigns (e.g. one week = 2D arrays).
 * To add one: create src/content/sprints/<id>/{sprint,tickets}.ts and list it in src/content/registry.ts.
 */
export type Sprint = {
  id: string; // URL slug, e.g. "2d-arrays"
  number: number; // Sprint 1, 2, …
  topic: string; // e.g. "2D Arrays"
  unit: string; // e.g. "AP CSA Unit 9"
  /** current = assigned now; done = earlier sprints (still open for review); upcoming = shown as coming soon. */
  status: "current" | "done" | "upcoming";
  dates?: string; // e.g. "11/24 – 11/30"
  project: MiniProject;
  tickets: Ticket[];
  /** Tickets planned for later, shown greyed out on the board. */
  /** Deeper, optional material for this sprint's topic (see KnowledgeTopic). */
  knowledge?: KnowledgeTopic[];
};
