# Spec D — Software Project: from a volunteer-service problem to a working front end

**Status:** Draft v1.0 (2026-11-28)
**Format:** 5 weekly sessions + 1 optional session, about 2 hours each, plus homework between sessions
**Learner:** one high-school student who has finished AP CSA (Java only: no HTML, CSS, JavaScript or web concepts yet)
**Starting point:** the student volunteers and believes parts of the service "could be automated or digitized", but has not yet identified or verified a concrete problem
**Tools:** Claude Code for building, Git/GitHub for version control, the Java Dev Sprints platform for teaching material (not for building the project)

## 1. Goals

By the end, the student should be able to:

1. **Validate before building**: describe a real problem in a volunteer workflow, with evidence from people who have it, and decide whether software is the right answer at all.
2. **Explain how a web app works**: browser, server, database, HTTP requests, front end vs back end, and where data lives.
3. **Write a spec an AI agent can build from** (spec-driven development, SDD): user stories, acceptance criteria, screens, data model, scope.
4. **Choose a tech stack with reasons**: a decision matrix and a short decision record, not "what's popular".
5. **Build a clickable front-end prototype with Claude Code**, reading and checking what the agent produced instead of accepting it blindly.
6. **Test it with real users** and update the spec from what they learn.

### Why this order

- **Problem first.** An AI agent can produce an app in an afternoon, so the scarce skill is no longer typing code. It is knowing what is worth building. A student who skips validation builds a polished answer to a question nobody asked.
- **Spec before code.** A coding agent builds what it is told. A vague request ("make a volunteer app") yields a generic app that fits nobody; a precise spec yields something checkable. So writing the spec *is* the engineering work, and the acceptance criteria are how the student checks the agent's output.
- **Front end first, with fake data.** A clickable prototype is the cheapest thing that real volunteers can react to. A database, logins and deployment are expensive to change, so they come only after users confirm the idea (session 6, or later).

## 2. Course outline

| Session | Theme | Main question | Student leaves with |
|---|---|---|---|
| Homework 0 | Observe | What actually happens during a volunteer shift? | Field notes + photos of current paper forms, spreadsheets, group chats |
| 1 | Problem discovery & validation | Is there a real, frequent, painful problem? | Workflow map, interview notes, problem statement, a go/no-go decision |
| 2 | How the web works | What are the parts of a web app, and which parts does this idea need? | Architecture sketch, first data model |
| 3 | SDD + stack choice | Exactly what will we build, and with what? | `spec.md`, `plan.md` (stack decision), first task list |
| 4 | Build the front end with Claude Code | Can the agent build what the spec says, and how do we check? | A clickable prototype in a GitHub repo, one commit per task |
| 5 | Test with users, iterate, demo | Does it solve the problem for real volunteers? | Usability findings, updated spec, demo, next-step decision |
| 6 (optional) | Persistence & deployment | What changes when data must be saved and shared? | Deployed prototype, data saved in a real database |

## 3. Sessions in detail

### Homework 0 — Observe (before session 1)

During one or two volunteer shifts, the student writes down, without judging yet:

- every task done, who does it, how long it takes, and what tool is used (paper, LINE/WhatsApp group, Excel/Google Sheets, phone calls);
- moments of waiting, repeated copying, double entry, lost information, mistakes;
- photos of real artifacts (sign-up sheets, schedules, hour logs). Blur or crop personal data before sharing.

**Why:** ideas from memory are vague ("scheduling is messy"). Observed facts are specific ("the coordinator spends ~40 minutes every Sunday copying sign-ups from LINE into a spreadsheet").

### Session 1 — Problem discovery & validation

**Activities**

1. **Map the current workflow** from the notes: steps, people, tools, hand-offs. Mark each pain point with how often it happens and how much time or trouble it costs.
2. **Plan 2–3 short interviews** (a coordinator, a regular volunteer, a newcomer). Practise questions about *past behavior*, not opinions about a future app:
   - Good: "Tell me about the last time a shift was short of people. What happened? What did you do?"
   - Weak: "Would you use an app for scheduling?" (people say yes to be polite).
3. **Write the problem statement**: *[who] struggles with [task] because [cause], which costs [time / errors / missed help]. Evidence: […]*.
4. **Is software the answer?** Compare at least three options for the chosen problem:

   | Option | Example | Cost to build | Cost to maintain after the student leaves |
   |---|---|---|---|
   | Change the process | a fixed sign-up deadline | none | none |
   | Existing tools | Google Forms + Sheets, an existing volunteer-management service | low | low |
   | Custom software | the student's own web app | high | needs someone to keep it running |

**Decision gate:** continue only if a custom app clearly beats existing tools for this problem, or if the learning value is worth it **and** the student can say what the custom app adds. "We tried a Google Form and it fails because…" is excellent evidence.

**Teacher's watch-outs:** the student will want to solve everything. Narrow to **one** problem for **one** kind of user.

### Session 2 — How the web works

Connect every new idea to what the student already knows from Java.

| Web idea | Java bridge |
|---|---|
| A web page is a program running in the **browser** (front end) | like `main` running on the user's computer |
| The **server** (back end) runs code on another computer and answers requests | a method someone else calls over the network |
| An **HTTP request / response** (`GET /shifts`, `POST /signups`) | a method call with arguments and a return value, sent as text |
| **JSON** | an object's fields written as text |
| A **database table** | an `ArrayList` of objects that survives restarts, shared by every user |
| A **data model** (entities and fields) | class design: what each object must *remember* (Unit 10's fields) |
| Where state lives: page memory vs database | local variable (gone when the method ends) vs field (lives with the object) |

**Activities**

1. Open a familiar site with the browser's DevTools **Network** tab. Find one request, its URL, method, status and JSON response.
2. Draw the architecture of the student's idea: browser ↔ server ↔ database, with arrows labelled by what data flows.
3. Draft the **data model** for the chosen problem (for example `Volunteer`, `Shift`, `Signup`): fields, types, and which fields are personal data.

**Why now:** without this picture, the student cannot read what Claude Code generates, cannot choose a stack, and cannot judge where personal data ends up.

### Session 3 — Spec-driven development and choosing a stack

**SDD in one sentence:** write down *what* to build and *how to check it* before asking an agent to build it, and keep that document up to date as the single source of truth. GitHub's open-source Spec Kit popularized a workflow of this kind (principles → specify → plan → tasks → implement) and works with Claude Code; the course uses the same stages with plain Markdown files, so the student learns the thinking and not only a tool.

The student writes, in their project repo:

1. **`constitution.md`** (a short list of non-negotiable principles), for example:
   - Volunteers' personal data is collected only when needed and never shown to other volunteers.
   - Works on a phone first (volunteers are on their feet).
   - Readable for older volunteers: large text, plain words.
2. **`spec.md`**:
   - Problem statement and evidence (from session 1)
   - Users and their goals
   - User stories: *As a [user], I want [action] so that [benefit]*
   - Acceptance criteria for each story, written so they can be checked: *Given … when … then …*
   - Screens list (one line each) and a rough paper sketch per screen
   - Data model (from session 2)
   - **Out of scope** for this prototype (logins, notifications, payments…)
3. **`plan.md`**: the tech stack and why (decision matrix below), plus folder structure.
4. **`tasks.md`**: small, ordered tasks, each finishable and checkable in one sitting ("Shift list screen with fake data, matches stories 1–2").

**Choosing a stack: a decision matrix.** Score 2–3 candidates against criteria the student weighs themselves:

| Criterion | Why it matters here |
|---|---|
| Can the student read the code? | They must review what the agent writes. Static types (TypeScript) feel familiar after Java. |
| Can the teacher support it? | Help is faster in a stack the teacher already uses. |
| Free tier and hosting | A volunteer group has no budget. |
| Who maintains it later? | The student will graduate; the simplest workable option often wins. |
| Personal-data handling | Where data is stored, who can read it, applicable data-protection rules. |
| Fit for the prototype | Front end only with fake data in sessions 4–5. |

A reasonable default to compare against: **Next.js + TypeScript** for the front end (the teacher's platform uses the same, and TypeScript's types read like Java), **deployed on Vercel**, and later **Postgres** (for example Neon or Supabase) when data must be saved. The point is that the student argues for their choice in `plan.md`, not that they pick this one.

**Why spec before stack:** the stack should follow from the requirements (phone-first, free, maintainable, private), not the other way round.

### Session 4 — Build the front end with Claude Code

**Setup (start of session):** GitHub repo with the spec files; Node.js installed; Claude Code installed and signed in; run `/init` so Claude Code writes a `CLAUDE.md`, then edit it to point at `constitution.md`, `spec.md` and `plan.md` and to say "fake data only, no backend yet".

**The loop, once per task in `tasks.md`:**

1. **Ask for a plan first** (Claude Code's plan mode): "Read spec.md and tasks.md. Plan task 1 only. Don't write code yet."
2. **Review the plan** against the acceptance criteria. Correct it in words.
3. **Let it implement**, then **run it** in the browser.
4. **Check every acceptance criterion by hand.** Anything that fails goes back as a precise request ("Story 2, criterion 3 fails: …"), not "it's broken".
5. **Read the diff.** For anything unclear, ask Claude Code *why* it wrote it that way. The student must be able to explain each file at a high level.
6. **Commit** with a message naming the task.

**Rules for the student**

- One task at a time; never "build the whole app".
- If the agent adds something not in the spec, either remove it or add it to the spec on purpose.
- If the spec turns out to be wrong or unclear, **fix the spec first**, then the code.

**Why this way:** the student learns that their job is to direct and verify. The agent types; the student is responsible for whether the result is right.

### Session 5 — Test with users, iterate, demo

1. **Usability test** with 2–3 real volunteers on a phone: give 3–5 tasks taken from the user stories ("Sign up for Saturday's morning shift"), ask them to think aloud, and **don't help**. Note where they hesitate or fail.
2. **Sort the findings**: the spec was wrong (update `spec.md`), the build doesn't match the spec (new task), or nice-to-have (out of scope list).
3. **Fix one or two of the most important problems** with the same Claude Code loop.
4. **Demo and reflection** (10 minutes): the problem and evidence, a live walkthrough, what users said, what changed, and what the student would do next and why.

**Next-step decision:** stop here (the prototype answered the question), hand the findings to the volunteer group, or continue to session 6.

### Session 6 (optional) — Persistence and deployment

- Replace fake data with a real database for **one** entity, through a small API (or a hosted database's client library).
- Deploy to Vercel and test on a phone over the internet.
- Revisit `constitution.md`: who can now see the data? What happens if the link is shared?

## 4. Assessment

Assessed artifacts: the problem statement with evidence, the decision-gate reasoning, `spec.md` with checkable acceptance criteria, `plan.md` with a reasoned stack choice, the commit history (one task per commit), usability findings, the demo.

What good looks like:

| | Developing | Proficient | Strong |
|---|---|---|---|
| Problem | an idea from personal opinion | a problem with interview evidence | a narrow problem, evidence, and a fair comparison with existing tools |
| Spec | feature list | user stories with acceptance criteria | criteria precise enough that someone else could check the build |
| Stack | "it's popular" | matrix with reasons | matrix with reasons, including maintenance and personal data |
| Working with the agent | accepts output as-is | checks against criteria | checks, explains the code, corrects the spec when it was the spec that was wrong |
| Users | none | tested with users | changed the spec because of what users did |

## 5. Using the Java Dev Sprints platform

The platform is used to **teach** the software-engineering ideas; the project itself is built in the student's own repository with Claude Code.

**Implemented: Web Map (`/web-map`)**, used mainly in sessions 2 and 4. A large clickable architecture diagram (browser, DNS, HTTP, API server, login & sessions, database, hosting) with an animated walkthrough of one request. Each part opens tutorials that run against a pretend REST server in the browser, using a volunteer-shift example:

| Part | Tutorials |
|---|---|
| Browser | HTML pages and forms (live editor; submitting shows the HTTP request), **DevTools Network tab** (a simulated app + Network panel, then a guided exercise in real DevTools on this site), front end vs back end |
| DNS | step-by-step lookup with caching |
| HTTP | methods playground (GET/POST/PUT/PATCH/DELETE, safe vs idempotent, "send again"), status codes |
| API server | REST API design exercise, JSON ↔ Java |
| Login & sessions | log in, see the Set-Cookie and Cookie headers, 401 vs 200 |
| Database | CRUD buttons showing the HTTP request, the SQL and the tables at once |
| Hosting | Git → build → live, environment variables |

Every topic ends with multiple-choice questions that the student answers by *doing* something in the widget or in DevTools; answers are kept in the browser.

Session use: session 2 = the map, "follow one request", HTTP methods, DevTools; session 3 = REST design and status codes while writing the spec; session 4 = DevTools to debug what Claude Code built.

Still a proposal (to be confirmed before implementation):

- A new sprint, **"Software Project"**, with one **milestone** per session instead of a Java ticket. A milestone reuses existing lesson blocks (markdown, predictions, the new "why" short-answer block) and ends with a **deliverable checklist** that the student ticks off and a link field (to `spec.md`, the repo or a PR), instead of Java code and tests.
- **Knowledge Space** topics for the sprint: how a web request travels (with an interactive request/response diagram), front end vs back end vs database, writing acceptance criteria, reading a coding agent's diff, choosing a stack.
- The teacher sees milestones, "why" answers and deliverable links in `/admin`, as for tickets.

Platform changes this would need: a ticket variant without a `CodeTask` (a `deliverables` list and a link field), `tools/verify-content.mjs` skipping it, and the workspace hiding the code panel for it.

## 6. Risks and how to handle them

| Risk | Mitigation |
|---|---|
| No real problem is found in session 1 | That is a valid outcome. Pick the best-evidenced small problem, or build a prototype to *test* a hypothesis with users. |
| Scope grows every week | Keep the out-of-scope list in `spec.md`; one problem, one kind of user. |
| The student accepts everything the agent writes | Acceptance-criteria checks and "explain this file" questions in every session. |
| Personal data of volunteers (possibly minors) | Fake data in the prototype; constitution rules; ask the organization before collecting anything real. |
| Tool setup eats session 4 | Install Node.js, Git and Claude Code as homework after session 3, with a checklist. |
| The organization cannot maintain a custom app | Weigh this in the session 1 decision gate and the stack matrix; a well-documented Google Sheets solution can be the right answer. |
