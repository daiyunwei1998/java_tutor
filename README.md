# Java Dev Sprints

A project-based Java / AP CSA learning platform. Work is organized in **sprints** (for example, this week = 2D Arrays).
Each sprint has its own mini project and story (Sprint 1: the Mini Photoshop at PixelForge Studio). Students are
**Junior Developers**: they move a sprint forward by picking up tickets, passing the tests and merging the PR.

- **Java compiles and runs in the student's browser** (CheerpJ + Eclipse ecj). Student code never runs on the server.
- **AI mentor** (OpenAI): a site-wide "Ask a Senior Dev" chat, plus an "AI Debug" button on every exercise.
- **Knowledge Space** per sprint (`/sprints/<id>/knowledge`): supplementary, deeper material that extends the
  Runestone CSJava book instead of repeating it. Each topic is a short single-page tutorial with an interactive
  code ↔ memory trace (stack frames, heap objects, reference arrows).
- **Accounts**: `stu` and `test` by default (password = username; it only tells accounts apart). Progress is stored
  in the database, so it follows the student to another computer. To add accounts, set
  `SEED_ACCOUNTS=stu,test,newname` in Vercel and redeploy; they are created automatically (password = username).
- **Teacher admin** at `/admin` (no link on the site; type the URL): AI usage, progress per account,
  "Reset test" and "Sync stu → test".
- Spec review and recommendations: [docs/spec-review.md](docs/spec-review.md)
- Tests: `node --experimental-strip-types tools/verify-content.mjs` (needs a JDK) and `python tools/test_api.py`

## Deployment (Vercel)
- One Vercel project serves both the Next.js frontend and FastAPI (`api/index.py` is a Vercel Python function;
  `vercel.json` routes `/api/*` to it).
- Database: Postgres (Neon) from the Vercel Marketplace. Connecting it sets `DATABASE_URL`; the backend creates
  its tables on first start.
- Environment variables on the Vercel project: `OPENAI_API_KEY` and `ADMIN_PASSWORD` (required). Optional ones are
  listed in `.env.example`.
- Pushing to `main` deploys automatically.

## Local development
Requires Node.js 20+ and Python 3.10+. Put a `.env` in the project root (see `.env.example`; it is ignored by git):

```
OPENAI_API_KEY=sk-...
ADMIN_PASSWORD=choose-a-password
# Optional: without DATABASE_URL a local SQLite file is used (.data/usage.db)
```

On Windows, double-click `start-dev.bat`, or run it by hand:
```
py -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt
.venv\Scripts\python -m uvicorn api.index:app --port 8000
npm install
npm run dev
```
Open http://localhost:3000 (teacher admin: http://localhost:3000/admin). The API key is read only by the backend
and is never sent to the browser.

## Architecture
```
src/content/             Course content (plain data): sprints, mini-project stories, tickets, starter code, tests, hints, knowledge topics
src/components/          Workspace (two columns: instructions/visualization | code; tabs on phones), editor, AI chat
src/components/viz/      Visualization components (registered by type; content refers to type + config only)
src/components/knowledge/ Knowledge Space page and the code ↔ memory TraceViewer
src/lib/trace.ts         Generic trace builder (frames, heap arrays/objects, references), reusable for future data structures
src/lib/java-runner.ts   Browser-side Java execution API
src/lib/progress.ts      Student progress: stored on the backend per account; localStorage is only a cache
public/java-runner.html  Runs CheerpJ in a hidden iframe; rebuilds the iframe on timeout (infinite-loop guard)
public/java/             ecj.jar (Eclipse Java compiler), tutor-runtime.jar (compile/run/test bridge)
api/index.py             FastAPI: AI, login, progress sync, admin (usage / accounts), /api/health
api/_core/               Settings, AI usage log, accounts/progress (Postgres or SQLite), AI mentor prompts
runtime-java/            Source of tutor-runtime.jar (Bridge, Check assertions, Img image I/O)
tools/                   Content verification, API smoke test, reference solutions
```

## Adding a sprint
1. Copy `src/content/sprints/s01-2d-arrays/` to a new folder (for example `s02-recursion/`).
2. In `sprint.ts`, change `id`, `number`, `topic`, `unit` and `project` (this sprint's mini-project story), and set `status: "current"`.
3. Add it to `sprints` in `src/content/registry.ts` and set the previous sprint to `status: "done"`.
4. Write the tickets in `tickets.ts` (see the next section) and, optionally, Knowledge Space topics in `knowledge.ts`.

The site name is `SITE_NAME` in `src/content/registry.ts`.

## Adding a ticket
Add a `Ticket` object to the sprint's `tickets.ts` (instructions, prediction questions, starter code, read-only test
file, hints). Every `static void testXxx()` method in the test class is one test; assert with `tutor.Check`.
Put the reference solution in `tools/solutions/` and run `node --experimental-strip-types tools/verify-content.mjs`.

## Adding a Knowledge Space topic
Topics live in the sprint's `knowledge.ts`. A topic is a list of sections: `markdown`, `callout`, `trace` or
`traversal-lab`. A trace is built with `Tracer` from `src/lib/trace.ts`: mutate the model the way the program would
(`set`, `newArray`, `newObject`, `setItem`, `setField`, `call`, `ret`, `collect`) and call `step(line, note)` after
each line. Add `ask` to a step to make the student predict before the result is shown.

## AI error handling
| Situation | What the student sees |
|-----------|-----------------------|
| OpenAI quota used up (429 / insufficient_quota, including the monthly hard limit) | "The AI mentor has used up this month's quota. Please contact your teacher." |
| Too many requests (429 rate limit) | "Please wait 30 seconds and try again. If this keeps happening, contact your teacher." |
| Per-student daily limit reached | "You have used all of today's AI questions." |
| No API key / invalid key | "The AI mentor is not set up yet. Please contact your teacher." |

Every request (including failures) is logged and visible to the teacher at `/admin`.

## Notes
- CheerpJ downloads the JVM on first load (cached afterwards) and needs access to `cjrtnc.leaningtech.com`.
- The free CheerpJ license has conditions; check the license before using it for paid tutoring.
- `tools/solutions/` contains reference solutions. If the repo is public, students can see them; make the repo private if needed.
