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
  | { type: "concept"; title?: string; concept: ConceptId; /** Which topic of a multi-topic concept to open on. */ start?: string }
  /** A code ↔ memory trace (frames, heap, arrows), looked up by id in src/content/traces.ts. Simulated, not the student's code. */
  | { type: "trace"; title?: string; traceId: TraceId; caption?: string };

export type ArrayMemoryPresetId = "jagged" | "rectangular" | "alias" | "shared-row" | "null-row";
export type TraversalMode = "row-major" | "column-major" | "enhanced-for";
export type MatrixAlgorithmId = "row-sum" | "column-sum" | "main-diagonal" | "anti-diagonal" | "max" | "transpose";
export type ImageFilterId = "brighten";
/** Filters of the PF-2xx tickets, previewed by components/viz/FilterLab.tsx. */
export type FilterLabId = "grayscale" | "flip" | "blur" | "edges" | "pipeline" | "selection";
/** Worked-example explanations with real photos and numbers (components/viz/concepts/). */
/** Hand-written traces registered in src/content/traces.ts. */
export type TraceId = "prim-vs-ref" | "field-vs-local" | "two-objects" | "shadowing" | "super-chain" | "dispatch-overload";
export type ConceptId = "rgb-grayscale" | "flip-mapping" | "box-blur" | "sobel" | "pipeline-frames" | "loop-bounds"
  | "life-neighbors" | "spiral-bounds" | "pascal-triangle";

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
  /**
   * A "why" question answered in the student's own words. Never auto-graded: after saving, the student sees a
   * model answer to compare with, and the teacher sees the answer in the ticket summary on /admin.
   */
  | { type: "short-answer"; id: string; question: string; placeholder?: string; modelAnswer: string }
  | { type: "callout"; tone: "info" | "warn" | "lead"; md: string }
  /**
   * Starts a new step: the workspace shows one step at a time with ◀ Back / Next ▶ (blocks before the first
   * step marker, plus the briefing and objectives, belong to step 1). `focus` picks the layout of that step:
   * read = the lesson alone; game = lesson | game; code = lesson | code; build = lesson above the game | code.
   * Tickets without step markers keep the classic lesson | code workspace.
   */
  | { type: "step"; title: string; focus: StepFocus }
  /**
   * A long read-only program with a concept panel beside it (components/CodeMap.tsx): clicking a concept
   * highlights its lines; "spot check" names a random concept and the student clicks a line that shows it.
   */
  | { type: "code-map"; title?: string; code: string; concepts: CodeConcept[]; mode?: "explore" | "quiz" };

/** One concept on a code map. ranges are 1-based inclusive line ranges in the map's code. */
export type CodeConcept = { id: string; label: string; group: string; explain: string; ranges: [number, number][] };

export type StepFocus = "read" | "game" | "code" | "build";

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
  /**
   * Reference solution, as a path under tools/solutions/ without ".java" (default: mainClass).
   * Use a folder when several tickets have a class with the same name, e.g. "QF-203/Hero".
   */
  solution?: string;
  /** Review tickets: the starter already passes every test (tools/verify-content.mjs then expects all tests to pass). */
  review?: boolean;
};

/**
 * Pixel Arena game preview (components/game/GameStage.tsx). The ticket must include a read-only Arena.java with
 * `public static List<Object> setup()` that creates the objects shown in the game.
 */
export type GameConfig = {
  /** Files left out of the game build, e.g. a scratch Main.java where students try code that may not compile. */
  exclude?: string[];
};

/** Why a ticket exists: the one skill it is designed to teach, for planning and trimming a sprint. */
export type LearningGoal = {
  level: "easy" | "medium" | "hard";
  /** One sentence: what the student should be able to do after this ticket. */
  goal: string;
  /** Key techniques the ticket practices, most important first. */
  techniques: string[];
};

export type Ticket = {
  id: string; // e.g. PF-101
  slug: string;
  title: string;
  xp: number;
  /** Teacher-only: what this ticket is designed to teach. Shown in /admin, never in the student UI. */
  learningGoal: LearningGoal;
  /**
   * Whether students see this ticket before the teacher changes it on /admin/tickets (default true).
   * false keeps a ticket in the content but hidden, e.g. a duplicate or an optional extra.
   */
  issuedByDefault?: boolean;
  /** Message from the tech lead that frames the task as real work. */
  briefing: string;
  objectives: string[];
  blocks: LessonBlock[];
  visualizations: VizConfig[];
  task: CodeTask;
  /** When set, the workspace shows the Pixel Arena game and the class preview next to the lesson and code. */
  game?: GameConfig;
};

/** A block on a Knowledge Space page (one topic = one single-column page). */
export type KnowledgeSection =
  | { type: "markdown"; md: string }
  | { type: "callout"; tone: "info" | "warn"; md: string }
  | { type: "trace"; trace: Trace; caption?: string }
  | { type: "traversal-lab"; modes: TraversalMode[]; rows: number; cols: number }
  | { type: "code-map"; title?: string; code: string; concepts: CodeConcept[]; mode?: "explore" | "quiz" };

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
