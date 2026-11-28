/**
 * A tiny pretend web server that runs in the browser, for the Web Map tutorials.
 * It speaks REST over a fake "volunteer shifts" database so students can send requests and watch
 * status codes, headers, JSON and table rows change. Nothing leaves the page.
 * Pure functions: handle() takes a state and a request and returns the new state and a response.
 */

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export type Shift = { id: number; title: string; date: string; slots: number };
export type Signup = { id: number; shiftId: number; volunteer: string };
export type DbState = {
  shifts: Shift[];
  signups: Signup[];
  sessions: Record<string, string>; // session id -> username
  nextShiftId: number;
  nextSignupId: number;
  nextSession: number;
};

export type HttpRequest = { method: Method; path: string; headers?: Record<string, string>; body?: string };
export type HttpResponse = { status: number; statusText: string; headers: Record<string, string>; body?: unknown };
export type Handled = {
  state: DbState;
  response: HttpResponse;
  /** The SQL a real server would run for this request (for the database tutorial). */
  sql: string[];
  /** Which table rows were touched, for highlighting. */
  touched: { table: "shifts" | "signups"; id: number; change: "read" | "created" | "updated" | "deleted" }[];
};

export const STATUS_TEXT: Record<number, string> = {
  200: "OK",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  404: "Not Found",
  405: "Method Not Allowed",
  409: "Conflict",
};

/** Safe = does not change data. Idempotent = sending it twice leaves the data the same as sending it once. */
export const METHOD_INFO: Record<Method, { safe: boolean; idempotent: boolean; meaning: string }> = {
  GET: { safe: true, idempotent: true, meaning: "Read a resource. Never changes data." },
  POST: { safe: false, idempotent: false, meaning: "Create something new (or run an action). Sending it twice creates two." },
  PUT: { safe: false, idempotent: true, meaning: "Replace a resource with exactly what you send. Sending it twice gives the same result." },
  PATCH: { safe: false, idempotent: false, meaning: "Change some fields of a resource. Not guaranteed idempotent (e.g. \"add 1 slot\")." },
  DELETE: { safe: false, idempotent: true, meaning: "Remove a resource. The second time it is already gone, so the data ends up the same." },
};

export function initialDb(): DbState {
  return {
    shifts: [
      { id: 1, title: "Food bank: sorting", date: "2026-12-05", slots: 4 },
      { id: 2, title: "Park clean-up", date: "2026-12-06", slots: 6 },
      { id: 3, title: "Reading buddies", date: "2026-12-07", slots: 2 },
    ],
    signups: [
      { id: 1, shiftId: 1, volunteer: "Amy" },
      { id: 2, shiftId: 3, volunteer: "Ben" },
    ],
    sessions: {},
    nextShiftId: 4,
    nextSignupId: 3,
    nextSession: 1,
  };
}

const json = { "Content-Type": "application/json" };

function res(status: number, body?: unknown, headers: Record<string, string> = {}): HttpResponse {
  return { status, statusText: STATUS_TEXT[status] ?? "", headers: body === undefined ? headers : { ...json, ...headers }, body };
}

function parseBody(req: HttpRequest): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const text = (req.body ?? "").trim();
  if (!text) return { ok: false, error: "This request needs a JSON body." };
  try {
    const v = JSON.parse(text);
    if (v === null || typeof v !== "object" || Array.isArray(v)) return { ok: false, error: "The body must be a JSON object like {\"title\": \"…\"}." };
    return { ok: true, value: v };
  } catch (e) {
    return { ok: false, error: `The body is not valid JSON (${e instanceof Error ? e.message : "parse error"}). Check quotes and commas.` };
  }
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isSlots = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 100;

function validateShift(v: Record<string, unknown>, partial: boolean): string | null {
  const known = ["title", "date", "slots"];
  const extra = Object.keys(v).filter((k) => !known.includes(k) && k !== "id");
  if (extra.length) return `Unknown field(s): ${extra.join(", ")}. A shift has title, date and slots.`;
  if (!partial) {
    const missing = known.filter((k) => !(k in v));
    if (missing.length) return `Missing field(s): ${missing.join(", ")}. ${partial ? "" : "PUT and POST need the whole shift."}`.trim();
  }
  if ("title" in v && (typeof v.title !== "string" || !v.title.trim())) return "title must be a non-empty string.";
  if ("date" in v && !isDate(v.date)) return "date must look like \"2026-12-05\".";
  if ("slots" in v && !isSlots(v.slots)) return "slots must be a whole number from 1 to 100.";
  if (partial && Object.keys(v).filter((k) => known.includes(k)).length === 0) return "PATCH needs at least one field to change.";
  return null;
}

function sessionUser(state: DbState, req: HttpRequest): string | null {
  const cookie = req.headers?.Cookie ?? req.headers?.cookie ?? "";
  const m = cookie.match(/session=([\w-]+)/);
  return m ? state.sessions[m[1]] ?? null : null;
}

/** Route table: path pattern → allowed methods. Used for 404 vs 405. */
const ROUTES: { re: RegExp; methods: Method[] }[] = [
  { re: /^\/api\/shifts$/, methods: ["GET", "POST"] },
  { re: /^\/api\/shifts\/(\d+)$/, methods: ["GET", "PUT", "PATCH", "DELETE"] },
  { re: /^\/api\/shifts\/(\d+)\/signups$/, methods: ["GET", "POST"] },
  { re: /^\/api\/signups\/(\d+)$/, methods: ["DELETE"] },
  { re: /^\/api\/login$/, methods: ["POST"] },
  { re: /^\/api\/logout$/, methods: ["POST"] },
  { re: /^\/api\/me$/, methods: ["GET"] },
];

export function handle(state0: DbState, req: HttpRequest): Handled {
  const state: DbState = JSON.parse(JSON.stringify(state0));
  const path = req.path.split("?")[0].replace(/\/+$/, "") || "/";
  const out = (response: HttpResponse, sql: string[] = [], touched: Handled["touched"] = []): Handled => ({ state, response, sql, touched });

  const route = ROUTES.find((r) => r.re.test(path));
  if (!route) return out(res(404, { error: `No resource at ${path}. Try /api/shifts.` }));
  if (!route.methods.includes(req.method)) {
    return out(res(405, { error: `${req.method} is not allowed on ${path}.` }, { Allow: route.methods.join(", ") }));
  }
  const id = Number(path.match(/\/(\d+)(?:\/|$)/)?.[1]);

  // ---------- /api/shifts ----------
  if (/^\/api\/shifts$/.test(path)) {
    if (req.method === "GET") {
      return out(res(200, state.shifts), ["SELECT * FROM shifts;"], state.shifts.map((s) => ({ table: "shifts" as const, id: s.id, change: "read" as const })));
    }
    const b = parseBody(req);
    if (!b.ok) return out(res(400, { error: b.error }));
    const err = validateShift(b.value, false);
    if (err) return out(res(400, { error: err }));
    const shift: Shift = { id: state.nextShiftId++, title: String(b.value.title), date: String(b.value.date), slots: Number(b.value.slots) };
    state.shifts.push(shift);
    return out(
      res(201, shift, { Location: `/api/shifts/${shift.id}` }),
      [`INSERT INTO shifts (title, date, slots) VALUES (${q(shift.title)}, ${q(shift.date)}, ${shift.slots});`],
      [{ table: "shifts", id: shift.id, change: "created" }],
    );
  }

  // ---------- /api/shifts/:id ----------
  if (/^\/api\/shifts\/\d+$/.test(path)) {
    const i = state.shifts.findIndex((s) => s.id === id);
    const select = `SELECT * FROM shifts WHERE id = ${id};`;
    if (i < 0) return out(res(404, { error: `There is no shift with id ${id}.` }), [select]);
    if (req.method === "GET") return out(res(200, state.shifts[i]), [select], [{ table: "shifts", id, change: "read" }]);
    if (req.method === "DELETE") {
      state.shifts.splice(i, 1);
      const removed = state.signups.filter((s) => s.shiftId === id);
      state.signups = state.signups.filter((s) => s.shiftId !== id);
      return out(
        res(204),
        [`DELETE FROM signups WHERE shift_id = ${id};`, `DELETE FROM shifts WHERE id = ${id};`],
        [{ table: "shifts", id, change: "deleted" }, ...removed.map((s) => ({ table: "signups" as const, id: s.id, change: "deleted" as const }))],
      );
    }
    const b = parseBody(req);
    if (!b.ok) return out(res(400, { error: b.error }));
    const err = validateShift(b.value, req.method === "PATCH");
    if (err) return out(res(400, { error: err }));
    const cur = state.shifts[i];
    const next: Shift =
      req.method === "PUT"
        ? { id, title: String(b.value.title), date: String(b.value.date), slots: Number(b.value.slots) }
        : { ...cur, ...(b.value as Partial<Shift>), id };
    const taken = state.signups.filter((s) => s.shiftId === id).length;
    if (next.slots < taken) return out(res(409, { error: `${taken} volunteers already signed up; slots cannot go below ${taken}.` }));
    state.shifts[i] = next;
    const sets = (req.method === "PUT" ? ["title", "date", "slots"] : Object.keys(b.value).filter((k) => k !== "id"))
      .map((k) => `${k} = ${k === "slots" ? next.slots : q(String(next[k as keyof Shift]))}`)
      .join(", ");
    return out(res(200, next), [`UPDATE shifts SET ${sets} WHERE id = ${id};`], [{ table: "shifts", id, change: "updated" }]);
  }

  // ---------- /api/shifts/:id/signups ----------
  if (/^\/api\/shifts\/\d+\/signups$/.test(path)) {
    const shift = state.shifts.find((s) => s.id === id);
    if (!shift) return out(res(404, { error: `There is no shift with id ${id}.` }), [`SELECT * FROM shifts WHERE id = ${id};`]);
    const list = state.signups.filter((s) => s.shiftId === id);
    if (req.method === "GET") {
      return out(res(200, list), [`SELECT * FROM signups WHERE shift_id = ${id};`], list.map((s) => ({ table: "signups" as const, id: s.id, change: "read" as const })));
    }
    const b = parseBody(req);
    if (!b.ok) return out(res(400, { error: b.error }));
    const name = b.value.volunteer;
    if (typeof name !== "string" || !name.trim()) return out(res(400, { error: "Send {\"volunteer\": \"your name\"}." }));
    if (list.some((s) => s.volunteer.toLowerCase() === name.trim().toLowerCase())) {
      return out(res(409, { error: `${name.trim()} is already signed up for this shift.` }), [`SELECT * FROM signups WHERE shift_id = ${id};`]);
    }
    if (list.length >= shift.slots) return out(res(409, { error: `Shift ${id} is full (${shift.slots} slots).` }), [`SELECT * FROM signups WHERE shift_id = ${id};`]);
    const s: Signup = { id: state.nextSignupId++, shiftId: id, volunteer: name.trim() };
    state.signups.push(s);
    return out(
      res(201, s, { Location: `/api/signups/${s.id}` }),
      [`INSERT INTO signups (shift_id, volunteer) VALUES (${id}, ${q(s.volunteer)});`],
      [{ table: "signups", id: s.id, change: "created" }],
    );
  }

  // ---------- /api/signups/:id ----------
  if (/^\/api\/signups\/\d+$/.test(path)) {
    const i = state.signups.findIndex((s) => s.id === id);
    if (i < 0) return out(res(404, { error: `There is no signup with id ${id}.` }), [`SELECT * FROM signups WHERE id = ${id};`]);
    state.signups.splice(i, 1);
    return out(res(204), [`DELETE FROM signups WHERE id = ${id};`], [{ table: "signups", id, change: "deleted" }]);
  }

  // ---------- login / logout / me ----------
  if (path === "/api/login") {
    const b = parseBody(req);
    if (!b.ok) return out(res(400, { error: b.error }));
    const u = b.value.username;
    if (typeof u !== "string" || !u.trim()) return out(res(400, { error: "Send {\"username\": \"…\", \"password\": \"…\"}." }));
    if (b.value.password !== "volunteer") return out(res(401, { error: "Wrong username or password. (In this demo the password is volunteer.)" }));
    const sid = `s${state.nextSession++}x${(u.length * 7919) % 1000}`;
    state.sessions[sid] = u.trim();
    return out(res(200, { username: u.trim() }, { "Set-Cookie": `session=${sid}; HttpOnly; Secure; SameSite=Lax` }), [`INSERT INTO sessions (id, username) VALUES (${q(sid)}, ${q(u.trim())});`]);
  }
  if (path === "/api/logout") {
    const cookie = req.headers?.Cookie ?? "";
    const sid = cookie.match(/session=([\w-]+)/)?.[1];
    if (sid) delete state.sessions[sid];
    return out(res(204, undefined, { "Set-Cookie": "session=; Max-Age=0" }), sid ? [`DELETE FROM sessions WHERE id = ${q(sid)};`] : []);
  }
  // /api/me
  const user = sessionUser(state, req);
  if (!user) return out(res(401, { error: "Not logged in: no valid session cookie was sent." }));
  return out(res(200, { username: user }), [`SELECT username FROM sessions WHERE id = …;`]);
}

/** The request as it would travel over the network (HTTP/1.1 text form). */
export function requestText(req: HttpRequest, host = "volunteer.example.org"): string {
  const hasBody = req.body !== undefined && req.body.trim() !== "" && req.method !== "GET" && req.method !== "DELETE";
  const lines = [`${req.method} ${req.path} HTTP/1.1`, `Host: ${host}`];
  for (const [k, v] of Object.entries(req.headers ?? {})) if (v) lines.push(`${k}: ${v}`);
  if (hasBody) lines.push("Content-Type: application/json");
  return lines.join("\n") + (hasBody ? `\n\n${req.body!.trim()}` : "");
}

export function responseText(r: HttpResponse): string {
  const lines = [`HTTP/1.1 ${r.status} ${r.statusText}`];
  for (const [k, v] of Object.entries(r.headers)) lines.push(`${k}: ${v}`);
  return lines.join("\n") + (r.body !== undefined ? `\n\n${JSON.stringify(r.body, null, 2)}` : "");
}
