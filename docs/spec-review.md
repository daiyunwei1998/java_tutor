# Spec review and recommendations

Scope: Spec B (Interactive CS Learning Platform) and Spec A (Unit 9 — 2D Arrays Interactive Lab)
Date: 2026-11-21

Both specs are thorough, and the teaching loop (Learn → Predict → Implement → Execute → Visualize → Test → Improve)
is clear. Below are my recommended changes, ordered by impact, and how the demo handles each one.

> Some items below were later superseded: progress now syncs to the backend per account, the workspace uses two
> columns (one collapsible) instead of three, and the whole interface and AI mentor are in English.

---

## 1. Decisions to make first (they change scope)

### 1.1 Java in the browser vs. the backend sandbox in Spec B §6
Spec B §10 says Java should run in the browser and not be sent to the backend, but §6 describes a Spring Boot +
container sandbox. These contradict each other. I recommend rewriting §6 as:

- **Mode B = real Java in the browser**: CheerpJ (a JVM compiled to WebAssembly) + the Eclipse compiler ecj compile,
  run and test code in the student's own browser. Student code never runs on your server, so most of the §6
  "Runtime security" list (containers, non-root, network isolation…) **is no longer needed**. The security model
  becomes "a student can only break their own tab".
- Infinite loops: Java runs in a hidden iframe; on timeout the iframe is destroyed and rebuilt (implemented, 10 s default).
- Move the backend sandbox to "Deferred / future options", only needed if grades must be verified server-side.

**Trade-offs (please confirm these are acceptable):**
1. The first load downloads the JVM runtime (tens of MB, cached by the browser afterwards), about 10–30 s the first time.
2. **Hidden tests cannot really be hidden**: everything runs in the student's browser, so a student who knows
   DevTools can see them. For one tutor and a few students this is usually fine; for formal grading, add a
   "teacher re-runs the tests" feature later.
3. **License**: the free CheerpJ Community license has conditions (personal / non-commercial, etc.). If the tutoring
   is paid, check Leaning Technologies' license terms before launch and buy a license if needed.
4. Network access to the CheerpJ CDN (`cjrtnc.leaningtech.com`) is required.

### 1.2 Put "project-based learning / Junior Developer" into the spec
The new direction (students are Junior Developers who pick up tickets and merge PRs) is good, but it changes the
information architecture, so it should be written into Spec B:

- Make **Project → Sprint → Ticket** the main navigation instead of Course → Lesson; lessons become content blocks
  inside tickets. Spec A's six lessons map onto the Mini Photoshop onboarding sprint and feature sprint.
- Map the Spec B §12 states: Viewed = *In Progress*, Attempted = has a run, Passed automated tests = *Tests Passed* →
  the student clicks *Merge PR*, Tutor verified = *the teacher's code review passed*. This keeps the principle
  "passing tests ≠ understanding the concept".
- Keep gamification modest: XP + levels (Junior Developer I/II/III → Developer), no leaderboard (avoids comparison pressure).

### 1.3 Spec for the AI mentor (missing from Spec B)
Spec B §16 says AI grading is not the main grading mechanism, but it does not describe an AI mentor. Add a section:

- **Role**: a mentor, not an answer machine. The system prompt requires: point to the location → explain why → ask a
  guiding question; never give the full solution; example snippets at most 3 lines.
- **Two entry points**: the site-wide "Ask a Senior Dev" chat, and the "AI Debug" button on each exercise (it attaches
  the code and the latest compile error / exception / test result).
- **Cost control (three layers)**: the OpenAI project's monthly hard limit (already set) + a per-student 24-hour limit
  (`AI_DAILY_LIMIT_PER_STUDENT`, default 60) + an input length limit.
- **Quota used up**: when OpenAI returns 429, the student sees "The AI mentor has used up this month's quota. Please
  contact your teacher." and the admin page shows a red warning.
- **Observability**: every call logs the student, type, ticket, tokens and status, visible on the admin page.
- **Privacy**: only the student's account name and code are sent to OpenAI; remind students not to type personal
  information into the chat.

### 1.4 Deployment: Vercel + Postgres (replaces the Spring Boot architecture in Spec B)
- Next.js and FastAPI live in one repo and one Vercel project; FastAPI runs as a Vercel Python function (`api/index.py`).
- Because Java runs in the browser, Vercel never needs a JVM, so serverless fits well.
- AI usage and student progress are stored in Postgres (Neon) from the Vercel Marketplace via `DATABASE_URL`;
  locally, without a database, SQLite is used.
- Serverless functions cannot keep local files, so server-side progress must go through the database (see 2.2).

## 2. Recommended changes (same scope, smoother implementation)

| # | Where | Problem | Recommendation |
|---|-------|---------|----------------|
| 2.1 | Spec B §3, §11 | No identity design, but the tutor dashboard and AI usage need to know who is who | Implemented as simple named accounts (`stu`, `test`) with password = username; add real sign-in later if needed |
| 2.2 | Spec B §12, §15-9 | "Progress retained between sessions" does not say where | Implemented: progress syncs to FastAPI + Postgres per account; localStorage is only a cache |
| 2.3 | Spec B §5 | The lesson schema has `exercises: string[]`, but Exercise itself is not defined | Define `CodeTask = { files[], mainClass, testClass, testLabels, hints[] }`; the test file is visible to students (read-only). See `src/content/types.ts` |
| 2.4 | Spec B §6 | `RunResponse.status` has `queued/running`, which mean nothing in the browser (runs are synchronous) | Use `completed / compile_error / runtime_error / timeout`, and also return `compileMs / runMs` |
| 2.5 | Spec B §7 | The relation between visualizations and student code is easy to confuse | Every simulated visualization shows a "Simulation · not running your code" label; only Mini Photoshop results say "computed by your Java code" (implemented, follows your consistency rule) |
| 2.6 | Spec B §13 | Phase 1 and Phase 2 are hard to deliver separately (2D arrays are the first demo) | Merge into "Phase 1: platform skeleton + Unit 9 Sprint 1"; Phase 2 becomes "Unit 9 Sprint 2: convolution + the remaining Mini Photoshop filters" |
| 2.7 | Spec A Lesson 5 | Introducing RGB early conflicts with task 3 (Grayscale) on grayscale `int[][]` | Sprint 1 uses grayscale `int[][]` throughout; the Grayscale task becomes "packed RGB int → gray" in Sprint 2 |
| 2.8 | Spec A §3 | No maximum input image size for Mini Photoshop tasks | Fixed limit (40×40 in the demo; uploaded images are scaled down) so the in-browser JVM never handles huge arrays |
| 2.9 | Spec A Lesson 6 | Sobel output range is not defined | Specify `min(255, (int) Math.round(Math.sqrt(gx*gx + gy*gy)))` so the tests have one correct answer |
| 2.10 | Spec A §5 | "Every concept has a prediction question" is good, but it does not say what happens on a wrong answer | No penalty for wrong answers; show the explanation immediately; answering gives a little XP (demo: +5 XP) |
| 2.11 | Spec B §14 accessibility | Good, but the interface language is not specified | The interface, instructions and AI mentor are in English; code, identifiers and error messages stay as Java prints them |

---

## 3. What the demo covers (against the acceptance criteria)

Spec B §15:
1. ✅ Open a ticket from the project board.
2. ✅ Instructions and editor are visible at the same time (two columns, one collapsible; tabs on phones).
3. ✅ Java compiles and runs (in the browser).
4. ✅ Console, compile errors (click to jump to the line) and exception stack traces are shown.
5. ✅ Visualizations have their own controls (play / pause / step / back / reset / speed).
6. ✅ The side panel can be resized and collapsed.
7. ✅ Students can edit code, and it is saved automatically.
8. ✅ Exercises run automated tests.
9. ✅ Progress survives a reload (and syncs to the backend per account).
10. ✅ Unit 9 is content data, not hard-coded into the layout (`src/content/`).
11. ✅ A project has several TODO tickets.
12. ✅ Students can apply their own Java image-processing method to a preview image (PF-105 brightness).

Spec A: the core visualizations of Lessons 1–4 (array vs. memory, row/column-major traversal, enhanced for, matrix
algorithms with access counts and complexity) and the Lesson 5 pixel inspector are done. The contiguous-memory and
cache model moved to the sprint's Knowledge Space. Lesson 6 (convolution) and the remaining Mini Photoshop tasks are
in the board's backlog.

## 4. Suggested next steps
1. Sprint 2: a convolution visualization (3×3 kernel, cell by cell) + Flip / Blur / Sobel tickets.
2. A teacher "Code review passed" button on the admin page.
3. More Knowledge Space traces (ArrayList, linked nodes, recursion frames) using the same `Tracer`.
