/**
 * Web Map: a big clickable diagram of how a web app works, for the software-engineering project
 * (docs/spec-swe-project.md). Each part of the diagram opens one or more topics; each topic is a single
 * page of short explanations and hands-on widgets. Plain data: widgets are referenced by id.
 * The running example is a volunteer-shift sign-up app, the kind of tool the project may build.
 */

export type WebWidgetId =
  | "http-playground"
  | "rest-designer"
  | "html-playground"
  | "json-java"
  | "crud-table"
  | "dns-lookup"
  | "auth-demo"
  | "network-panel";

export type QuizQuestion = { q: string; code?: string; options: string[]; answer: number; explain: string };

export type WebSection =
  | { type: "markdown"; md: string }
  | { type: "callout"; tone: "info" | "warn" | "lead"; md: string }
  | { type: "widget"; widget: WebWidgetId }
  | { type: "quiz"; id: string; title?: string; questions: QuizQuestion[] };

export type WebTopic = { id: string; node: MapNodeId; title: string; summary: string; minutes: number; sections: WebSection[] };

export type MapNodeId = "browser" | "dns" | "internet" | "api" | "auth" | "db" | "hosting";
export type MapZone = "client" | "network" | "server" | "data" | "ops";

export type MapNode = {
  id: MapNodeId;
  label: string;
  sub: string;
  icon: string;
  zone: MapZone;
  /** Center of the node in the 1200 × 660 diagram. */
  x: number;
  y: number;
  /** One sentence shown in the side panel when the node is selected. */
  blurb: string;
};

export const MAP_ZONES: { id: MapZone; label: string; x: number; w: number; y: number; h: number }[] = [
  { id: "client", label: "Your device", x: 20, w: 300, y: 20, h: 470 },
  { id: "network", label: "The internet", x: 340, w: 260, y: 20, h: 470 },
  { id: "server", label: "Server side", x: 620, w: 300, y: 20, h: 470 },
  { id: "data", label: "Data", x: 940, w: 240, y: 20, h: 470 },
  { id: "ops", label: "Where it all runs", x: 20, w: 1160, y: 510, h: 130 },
];

export const MAP_NODES: MapNode[] = [
  { id: "browser", label: "Browser", sub: "HTML · CSS · JS · DevTools", icon: "🖥️", zone: "client", x: 170, y: 255, blurb: "Shows the page, runs the front-end code, and sends requests when you click. DevTools lets you watch it all happen." },
  { id: "dns", label: "DNS", sub: "name → address", icon: "📖", zone: "network", x: 470, y: 120, blurb: "Turns a name like volunteer.example.org into the server's IP address, like a phone book." },
  { id: "internet", label: "HTTP", sub: "requests & responses", icon: "✉️", zone: "network", x: 470, y: 330, blurb: "The language browser and server speak: a request (method, path, headers, body) and a response (status, headers, body)." },
  { id: "api", label: "API server", sub: "REST · JSON", icon: "⚙️", zone: "server", x: 770, y: 255, blurb: "Back-end code that receives requests, checks them, runs the rules, talks to the database and answers in JSON." },
  { id: "auth", label: "Login & sessions", sub: "who is asking?", icon: "🔑", zone: "server", x: 770, y: 420, blurb: "Remembers who you are between requests, with a session cookie or a token." },
  { id: "db", label: "Database", sub: "tables · SQL · CRUD", icon: "🗄️", zone: "data", x: 1060, y: 255, blurb: "Stores data permanently and shares it between all users: create, read, update, delete." },
  { id: "hosting", label: "Hosting & deploy", sub: "Git → build → live", icon: "☁️", zone: "ops", x: 600, y: 580, blurb: "The computers the server and database run on, and how your code gets there from GitHub." },
];

/** Connections between parts. `label` is drawn at `at` (diagram coordinates) so it never sits on a line or box. */
export const MAP_EDGES: { from: MapNodeId; to: MapNodeId; label?: string; at?: [number, number] }[] = [
  { from: "browser", to: "dns", label: "where is it?", at: [250, 150] },
  { from: "browser", to: "internet", label: "request ⇄ response", at: [470, 425] },
  { from: "internet", to: "api", label: "request ⇄ response", at: [770, 165] },
  { from: "api", to: "db", label: "SQL", at: [915, 240] },
  { from: "api", to: "auth", label: "check session", at: [782, 342] },
];

/** Dashed "runs on" lines from the hosting node up to the zones it hosts (drawn to the zone border, not through boxes). */
export const MAP_HOSTS: { to: MapZone; x: number }[] = [
  { to: "server", x: 700 },
  { to: "data", x: 1000 },
];

/** One request's journey through the diagram: what a volunteer's single click sets in motion. */
export type JourneyStep = { title: string; nodes: MapNodeId[]; edge?: [MapNodeId, MapNodeId]; note: string; message?: string };

export const JOURNEY: JourneyStep[] = [
  {
    title: "1. Click",
    nodes: ["browser"],
    note: "A volunteer taps **Sign up** for Saturday's \"Reading buddies\" shift. The page's JavaScript prepares a request.",
  },
  {
    title: "2. Find the server",
    nodes: ["browser", "dns"],
    edge: ["browser", "dns"],
    note: "The browser knows the name `volunteer.example.org` but needs a numeric address. DNS answers (and the answer is cached, so this is skipped next time).",
    message: "volunteer.example.org → 203.0.113.42",
  },
  {
    title: "3. Send the request",
    nodes: ["browser", "internet"],
    edge: ["browser", "internet"],
    note: "The browser sends an HTTP request: a **method** (POST = create something), a **path** (which resource), **headers** (extra info, like the session cookie) and a **body** (the data, as JSON).",
    message: 'POST /api/shifts/3/signups HTTP/1.1\nHost: volunteer.example.org\nCookie: session=s1x42\nContent-Type: application/json\n\n{"volunteer": "Amy"}',
  },
  {
    title: "4. Arrive at the API",
    nodes: ["internet", "api"],
    edge: ["internet", "api"],
    note: "The request crosses the internet (encrypted with HTTPS) and reaches the API server, which matches the method + path to a piece of code: \"create a signup for shift 3\".",
  },
  {
    title: "5. Who is asking?",
    nodes: ["api", "auth"],
    edge: ["api", "auth"],
    note: "The server looks up the session cookie to find out who sent the request. No valid session → it would answer **401 Unauthorized** and stop here.",
  },
  {
    title: "6. Save it",
    nodes: ["api", "db"],
    edge: ["api", "db"],
    note: "Business rules first (is the shift full? already signed up?), then the database stores the new row so every other user sees it too.",
    message: "INSERT INTO signups (shift_id, volunteer) VALUES (3, 'Amy');",
  },
  {
    title: "7. Answer",
    nodes: ["api", "internet", "browser"],
    edge: ["api", "internet"],
    note: "The server replies with a **status code** (201 Created) and the new signup as JSON.",
    message: 'HTTP/1.1 201 Created\nContent-Type: application/json\nLocation: /api/signups/7\n\n{"id": 7, "shiftId": 3, "volunteer": "Amy"}',
  },
  {
    title: "8. Update the page",
    nodes: ["browser"],
    note: "The front-end code reads the JSON and updates the page: \"You're signed up!\" The whole trip usually takes well under a second. Open **DevTools → Network** to watch real trips like this one.",
  },
];

export const WEB_TOPICS: WebTopic[] = [
  // ---------------- Browser ----------------
  {
    id: "html-forms",
    node: "browser",
    title: "HTML pages and forms: where requests come from",
    summary: "A page is a tree of HTML elements. A form turns what the user typed into an HTTP request.",
    minutes: 10,
    sections: [
      {
        type: "markdown",
        md: `Every web app starts as **HTML**: a description of what is on the page (headings, buttons, inputs). **CSS** describes how it looks, and **JavaScript** makes it react.

Why care about HTML forms? Because a form is the oldest, simplest way a page sends data to a server, and it shows the two most common HTTP methods side by side:

- \`method="get"\`: the form's values go into the **URL** as a query string (\`?name=Amy&shift=3\`). Fine for searches; bad for anything private, since URLs end up in history and logs.
- \`method="post"\`: the values go in the request **body**. Used for creating or changing data.

Edit the HTML below, then submit the form in the preview. The panel shows the exact request the browser would send. (Nothing is really sent.)`,
      },
      { type: "widget", widget: "html-playground" },
      {
        type: "quiz",
        id: "html-forms-quiz",
        title: "Try it, then answer",
        questions: [
          {
            q: "Switch the form to method=\"get\" and submit it. Where do the values end up?",
            options: ["In the request body", "In the URL, after a ?", "In a cookie"],
            answer: 1,
            explain: "GET has no body, so the browser appends the values to the URL as a query string.",
          },
          {
            q: "Which input attribute decides the name of the value sent to the server?",
            options: ["id", "name", "placeholder"],
            answer: 1,
            explain: "Only inputs with a name are sent, as name=value. id is for CSS/JS and labels; placeholder is only a hint.",
          },
          {
            q: "Why should a sign-up form that stores data use POST rather than GET?",
            options: [
              "POST is faster",
              "GET is meant to only read; data in the URL ends up in history and logs, and a GET can be repeated by accident",
              "GET cannot send text",
            ],
            answer: 1,
            explain: "GET should be safe to repeat (crawlers and browsers prefetch links). Changing data belongs in POST, with the values in the body.",
          },
        ],
      },
    ],
  },
  {
    id: "devtools-network",
    node: "browser",
    title: "DevTools: the Network tab",
    summary: "Watch every request a page makes: method, status, headers, payload and response. Practise on a simulated panel, then on the real thing.",
    minutes: 15,
    sections: [
      {
        type: "markdown",
        md: `When a page "doesn't work", the first question a web developer asks is: **what did the browser send, and what came back?** The Network tab answers exactly that, for every request.

**Open DevTools:** press **F12** (Windows) or **⌘ ⌥ I** (Mac), or right-click the page → *Inspect*. Then pick the **Network** tab.

What you see:

| Column / tab | What it tells you |
|---|---|
| **Name** | the last part of the URL that was requested |
| **Method** | GET, POST, … |
| **Status** | the server's answer: 200, 201, 404, … |
| **Type** | \`document\` (a page), \`fetch\` (a request made by JavaScript), \`script\`, \`stylesheet\`, \`png\` … |
| **Headers** tab | full URL, method, status, request and response headers |
| **Payload** tab | the data the browser sent (query string or body) |
| **Preview / Response** | what the server sent back (formatted / raw) |

Tips: the **Fetch/XHR** filter hides everything except data requests. **Preserve log** keeps the list when the page reloads. The list only records requests made **while DevTools is open**, so open it first, then reload.

## Practice panel

This is a simulated volunteer app with a simulated Network panel. Use the app on the left (load it, sign up, cancel), then inspect the requests to answer the questions below. Every answer can be found in the panel.`,
      },
      { type: "widget", widget: "network-panel" },
      {
        type: "quiz",
        id: "network-sim-quiz",
        title: "Find the answers in the practice panel",
        questions: [
          {
            q: "Press **Load page**. Which request returned the list of shifts, and with which method?",
            options: ["shifts · GET", "shifts · POST", "index.html · GET", "app.js · GET"],
            answer: 0,
            explain: "The page (index.html) and its script (app.js) load first; then the script fetches the data with GET /api/shifts (type fetch).",
          },
          {
            q: "Turn on the **Fetch/XHR** filter after loading the page. How many requests are left?",
            options: ["1", "2", "4"],
            answer: 1,
            explain: "Only requests made by JavaScript remain: shifts and me. The page, the script and the stylesheet are hidden.",
          },
          {
            q: "Sign up for **Reading buddies**. What status code did the sign-up request get?",
            options: ["200 OK", "201 Created", "204 No Content"],
            answer: 1,
            explain: "A POST that creates something answers 201 Created. Look at the Status column or the Headers tab.",
          },
          {
            q: "Open the sign-up request's **Payload** tab. What did the browser send?",
            options: ['{"volunteer": "Amy"}', '{"shiftId": 3}', "Nothing; the data was in the URL"],
            answer: 0,
            explain: "The shift is identified by the path (/api/shifts/3/signups); the body only carries who is signing up.",
          },
          {
            q: "In the same request's response headers, what is the **Location**?",
            options: ["/api/shifts/3", "/api/signups/3", "/api/signups/2"],
            answer: 1,
            explain: "201 Created usually comes with a Location header saying where the new resource lives: the new signup got id 3. (/api/shifts/3 is the shift, not the signup.)",
          },
          {
            q: "Sign up for Reading buddies **again**. What happens, and why?",
            options: ["201 again, a second signup", "409 Conflict: Amy is already signed up", "404 Not Found"],
            answer: 1,
            explain: "409 Conflict means the request was understood but clashes with the current state of the data. The Response tab says why.",
          },
          {
            q: "Cancel the signup. Which method and status does that request show?",
            options: ["POST · 200", "DELETE · 204", "DELETE · 404"],
            answer: 1,
            explain: "DELETE removes the resource; 204 No Content means \"done, nothing to send back\", which is why the Response tab is empty.",
          },
        ],
      },
      {
        type: "markdown",
        md: `## Now the real thing

Do this on **this website**:

1. Open the **Dashboard** in a new tab and open DevTools → **Network**.
2. Reload the page (**F5** or **⌘ R**).
3. Turn on the **Fetch/XHR** filter and click the request named **issued** (its full path is \`/api/tickets/issued\`). It is how the site finds out which tickets your teacher has switched on.
4. Look at its **Headers** and **Preview** tabs to answer the questions.`,
      },
      {
        type: "quiz",
        id: "network-real-quiz",
        title: "On the real Dashboard",
        questions: [
          {
            q: "Which method does the `issued` request use?",
            options: ["GET", "POST", "PUT"],
            answer: 0,
            explain: "It only reads the teacher's settings, so it is a GET.",
          },
          {
            q: "In its **Response Headers**, what is the `content-type`?",
            options: ["text/html", "application/json", "image/png"],
            answer: 1,
            explain: "The API answers with JSON, and says so in the content-type header (charset details may follow).",
          },
          {
            q: "In the **Preview** tab, what is the top-level key of the JSON object?",
            options: ["tickets", "overrides", "issued"],
            answer: 1,
            explain: "The response looks like {\"overrides\": {…}}: ticket ids the teacher switched on or off.",
          },
          {
            q: "The Network list was empty when you first opened DevTools. Why?",
            options: [
              "The page made no requests",
              "DevTools only records requests made while it is open, so you have to reload",
              "Requests are hidden until you log in",
            ],
            answer: 1,
            explain: "Open DevTools first, then reload. Turn on Preserve log if you need requests from before a page navigation.",
          },
        ],
      },
    ],
  },
  {
    id: "front-vs-back",
    node: "browser",
    title: "Front end vs back end: where does code run?",
    summary: "Code in the browser is visible to and changeable by the user; code on the server is not. That decides where each rule must live.",
    minutes: 6,
    sections: [
      {
        type: "markdown",
        md: `A web app is **two programs** talking over HTTP:

- the **front end** runs in each user's browser (HTML, CSS, JavaScript). Anyone can open DevTools, read it, and even change it.
- the **back end** runs on a server you control. Users only see what it sends back.

That one fact decides where things belong:

| Belongs in the front end | Belongs in the back end |
|---|---|
| layout, buttons, animations | the database and its password |
| quick checks to help the user ("this field is empty") | the **real** checks (is the shift full? is this user allowed?) |
| remembering what is open on screen | anything every user must see the same way |

A front-end check is a convenience, not protection: someone can skip the page entirely and send a request with any tool. So every rule that matters is checked again on the server.`,
      },
      {
        type: "quiz",
        id: "front-back-quiz",
        title: "Where should it run?",
        questions: [
          { q: "The rule \"a shift cannot have more volunteers than slots\".", options: ["Front end only", "Back end (front end may also warn early)", "Either; it doesn't matter"], answer: 1, explain: "Users can bypass the page, so only the server can enforce it. Showing \"Full\" on the page is a nice extra." },
          { q: "The database password.", options: ["Front end", "Back end"], answer: 1, explain: "Everything in the front end can be read in DevTools." },
          { q: "Opening and closing a \"details\" panel when a card is clicked.", options: ["Front end", "Back end"], answer: 0, explain: "Pure display, nothing to protect; no reason to ask the server." },
          { q: "Showing a red border while an email field is empty.", options: ["Front end", "Back end"], answer: 0, explain: "Instant feedback for the user. The server still validates the email when the form arrives." },
        ],
      },
    ],
  },
  // ---------------- DNS ----------------
  {
    id: "dns",
    node: "dns",
    title: "DNS: from a name to an address",
    summary: "Computers find each other by IP address. DNS translates names, asking a chain of servers and caching the answer.",
    minutes: 5,
    sections: [
      {
        type: "markdown",
        md: `Computers on the internet find each other by **IP address** (like \`203.0.113.42\`), but people remember names. **DNS** (the Domain Name System) is the internet's phone book.

Why a chain of servers instead of one big list? No single server could handle every lookup in the world, and every organization wants to manage its own names. So the work is split: the **root** knows who handles \`.org\`, the \`.org\` servers know who handles \`example.org\`, and that organization's server knows the actual address.

Why caching? Asking the whole chain every time would be slow. Answers are remembered for a while (the *TTL*), so the second lookup is almost instant.`,
      },
      { type: "widget", widget: "dns-lookup" },
      {
        type: "quiz",
        id: "dns-quiz",
        title: "Check yourself",
        questions: [
          { q: "Run the lookup twice. Why is the second one so much faster?", options: ["The server got faster", "The answer was cached and the chain was skipped", "DNS was turned off"], answer: 1, explain: "Answers are cached for their TTL." },
          { q: "A site changes to a new server address, but some people still reach the old one for a while. Why?", options: ["Their browsers are broken", "Their cached DNS answer has not expired yet", "DNS does not allow changes"], answer: 1, explain: "Until the cached answer's TTL runs out, they keep using the old address." },
        ],
      },
    ],
  },
  // ---------------- HTTP ----------------
  {
    id: "http-methods",
    node: "internet",
    title: "HTTP methods: GET, POST, PUT, PATCH, DELETE",
    summary: "Send real-looking requests to a pretend server and watch the data change. Learn what each method promises, and why that promise matters.",
    minutes: 15,
    sections: [
      {
        type: "markdown",
        md: `Every HTTP request starts with a **method**: a verb saying what kind of thing you want done to the resource named by the **path**.

| Method | Meaning | Safe? | Idempotent? |
|---|---|---|---|
| **GET** | read | ✅ | ✅ |
| **POST** | create (or run an action) | ❌ | ❌ |
| **PUT** | replace with exactly this | ❌ | ✅ |
| **PATCH** | change some fields | ❌ | not guaranteed |
| **DELETE** | remove | ❌ | ✅ |

- **Safe** = never changes data. Browsers, search engines and link previews may send GETs on their own, so a GET must never delete or create anything.
- **Idempotent** = sending it twice leaves the data the same as sending it once. That matters because networks fail: if a request times out, can the app simply send it again? For PUT and DELETE, yes. For POST, a retry might create a duplicate signup.

Try it: send requests to the pretend server below. Use **Send again** to see idempotency for yourself.`,
      },
      { type: "widget", widget: "http-playground" },
      {
        type: "quiz",
        id: "http-methods-quiz",
        title: "Use the playground to answer",
        questions: [
          { q: "Send the POST preset (create a shift) **twice**. How many new shifts exist?", options: ["1", "2"], answer: 1, explain: "POST is not idempotent: each one creates a new resource with a new id." },
          { q: "Send the PUT preset for shift 2 **twice**. What changes after the second time?", options: ["A second copy of shift 2", "Nothing: shift 2 already looks exactly like that", "Shift 2 is deleted"], answer: 1, explain: "PUT replaces the resource with what you send; doing it again gives the same result." },
          { q: "Send `PUT /api/shifts/1` with only `{\"slots\": 8}` in the body. What happens?", options: ["200, only slots change", "400 Bad Request: PUT needs the whole shift", "201 Created"], answer: 1, explain: "PUT means \"replace with exactly this\", so a partial body is incomplete. To change one field, use PATCH." },
          { q: "DELETE shift 3, then send the same DELETE again. What do you get the second time?", options: ["204 again", "404 Not Found", "500 Server Error"], answer: 1, explain: "It is already gone, so 404. The data ends up the same either way, which is why DELETE still counts as idempotent." },
          { q: "Send `DELETE /api/shifts` (no id). What status comes back, and which header tells you what *is* allowed?", options: ["404 · Location", "405 · Allow", "400 · Content-Type"], answer: 1, explain: "The path exists but not with that method: 405 Method Not Allowed, with an Allow header listing GET, POST." },
        ],
      },
    ],
  },
  {
    id: "status-codes",
    node: "internet",
    title: "Status codes: what the server is telling you",
    summary: "The three-digit number at the top of every response. The first digit already says who is at fault.",
    minutes: 6,
    sections: [
      {
        type: "markdown",
        md: `The status code is the server's one-number summary, so the front end can react without reading the whole body. The **first digit** groups them:

| Range | Meaning | Common ones |
|---|---|---|
| **2xx** | it worked | 200 OK · 201 Created · 204 No Content |
| **3xx** | look somewhere else | 301 Moved Permanently · 304 Not Modified |
| **4xx** | **your request** has a problem | 400 Bad Request · 401 Unauthorized · 403 Forbidden · 404 Not Found · 405 Method Not Allowed · 409 Conflict |
| **5xx** | **the server** has a problem | 500 Internal Server Error · 503 Service Unavailable |

Why it matters when debugging: a 4xx means "fix what you sent"; a 5xx means "the server crashed or is down; your request may have been fine".

**401 vs 403:** 401 = "I don't know who you are" (log in). 403 = "I know who you are, and you're not allowed".`,
      },
      {
        type: "quiz",
        id: "status-quiz",
        title: "Which status should the server send?",
        questions: [
          { q: "A volunteer signs up for a shift; the signup is saved.", options: ["200", "201", "204"], answer: 1, explain: "Something new was created: 201 Created." },
          { q: "The app asks for shift 99, which doesn't exist.", options: ["400", "404", "500"], answer: 1, explain: "The request is fine; the resource isn't there." },
          { q: "The JSON body is missing a closing brace.", options: ["400", "409", "500"], answer: 0, explain: "The client sent something the server cannot understand." },
          { q: "Someone not logged in opens the coordinator page's data.", options: ["401", "403", "404"], answer: 0, explain: "The server doesn't know who is asking yet: 401." },
          { q: "A logged-in volunteer tries to delete a shift, which only coordinators may do.", options: ["401", "403", "405"], answer: 1, explain: "Known user, not allowed: 403 Forbidden." },
          { q: "The shift is already full.", options: ["400", "409", "503"], answer: 1, explain: "The request makes sense but conflicts with the current state: 409 Conflict." },
          { q: "The server code throws a NullPointerException while handling the request.", options: ["400", "404", "500"], answer: 2, explain: "A bug on the server side: 500 Internal Server Error." },
        ],
      },
    ],
  },
  // ---------------- API ----------------
  {
    id: "rest-api",
    node: "api",
    title: "Designing a RESTful API",
    summary: "Nouns in the path, verbs in the method. Design the endpoints for the volunteer app and check your choices.",
    minutes: 10,
    sections: [
      {
        type: "markdown",
        md: `An **API** (application programming interface) is the list of requests a server understands. **REST** is a widely used style for designing that list so it is predictable:

- **Paths name things (resources), as plural nouns**: \`/api/shifts\`, \`/api/shifts/3\`, \`/api/shifts/3/signups\`.
- **The method says what to do with them**: GET reads, POST creates, PUT/PATCH change, DELETE removes.
- **Responses use status codes and JSON.**

Why bother? Compare an API someone invented on the fly: \`/getShifts\`, \`/createNewShift\`, \`/shiftDelete?id=3\`, \`/doSignup\`. Every new endpoint is a surprise you have to look up. With REST, once you know the resources, you can guess every request, and so can the next developer, and so can Claude Code when it reads your spec.

The Java bridge: a resource is like a class (\`Shift\`), the collection \`/api/shifts\` is like an \`ArrayList<Shift>\`, and the methods are the operations on it.`,
      },
      { type: "widget", widget: "rest-designer" },
      {
        type: "callout",
        tone: "info",
        md: "REST is a style, not a law. Real APIs bend it (e.g. `POST /api/login` is an action, not a resource). What matters is being consistent, so the API is guessable.",
      },
    ],
  },
  {
    id: "json",
    node: "api",
    title: "JSON: objects as text",
    summary: "How a Java object's fields travel over the network, and the mistakes that break JSON.",
    minutes: 6,
    sections: [
      {
        type: "markdown",
        md: `A request or response can only carry **text**. JSON is the most common way to write an object's fields as text, and almost every language can read and write it.

It maps directly onto what you know from Java: an object's **fields** become \`"name": value\` pairs. Change the fields below and watch both sides.`,
      },
      { type: "widget", widget: "json-java" },
      {
        type: "quiz",
        id: "json-quiz",
        title: "Spot the problem",
        questions: [
          { q: "Which one is valid JSON?", options: ["{name: \"Amy\"}", "{\"name\": \"Amy\"}", "{'name': 'Amy'}"], answer: 1, explain: "JSON keys and strings need double quotes." },
          { q: "What is wrong here?", code: '{"name": "Amy", "hours": 12,}', options: ["Nothing", "The comma after the last field", "hours must be a string"], answer: 1, explain: "JSON does not allow a trailing comma." },
          { q: "A Java field `boolean active = true;` becomes…", options: ["\"active\": \"true\"", "\"active\": true", "\"active\": 1"], answer: 1, explain: "JSON has real booleans: true / false without quotes." },
        ],
      },
    ],
  },
  // ---------------- Auth ----------------
  {
    id: "auth",
    node: "auth",
    title: "Login and sessions: how the server remembers you",
    summary: "HTTP forgets everything between requests. A session cookie is how a server knows the next request is still you.",
    minutes: 8,
    sections: [
      {
        type: "markdown",
        md: `HTTP is **stateless**: each request arrives on its own, and the server does not automatically know that two requests came from the same person. So how does a site stay logged in?

1. You log in once: \`POST /api/login\` with your username and password.
2. The server checks them, creates a **session** (a random id it remembers), and sends it back in a \`Set-Cookie\` header.
3. From then on the browser **automatically attaches the cookie** to every request to that site.
4. The server looks the id up to know who is asking. No cookie, or an unknown one → **401**.

Try it below: request \`/api/me\` before and after logging in, and watch the Cookie header appear.`,
      },
      { type: "widget", widget: "auth-demo" },
      {
        type: "callout",
        tone: "warn",
        md: "Never store passwords as plain text, and never write your own password system for a real app with real people's data. Use a well-tested library or service, and HTTPS everywhere. The demo's password is `volunteer`.",
      },
      {
        type: "quiz",
        id: "auth-quiz",
        title: "Check yourself",
        questions: [
          { q: "After logging in, who adds the Cookie header to each request?", options: ["Your JavaScript code, every time", "The browser, automatically", "The server"], answer: 1, explain: "Once a cookie is set for a site, the browser sends it with every request to that site." },
          { q: "Why is the cookie marked HttpOnly?", options: ["So JavaScript on the page cannot read it, which protects it from injected scripts", "So it is faster", "So it works without internet"], answer: 0, explain: "HttpOnly cookies are sent with requests but are invisible to page scripts." },
        ],
      },
    ],
  },
  // ---------------- Database ----------------
  {
    id: "database-crud",
    node: "db",
    title: "Databases and CRUD",
    summary: "Create, Read, Update, Delete: the four things apps do with data, and how each lines up with an HTTP method and an SQL statement.",
    minutes: 8,
    sections: [
      {
        type: "markdown",
        md: `Why a database instead of variables in the server program? Two reasons you already know from Java:

- variables disappear when the program stops (like a method's local variables when it returns); a database **keeps data** across restarts.
- every user's requests must see **the same data**; a database is the one shared place.

A relational database stores data in **tables**: each row is like one object, each column like a field. Almost everything an app does with data is one of four operations, **CRUD**, and in a REST API each lines up with an HTTP method and an SQL statement:

| CRUD | HTTP | SQL |
|---|---|---|
| **C**reate | POST | \`INSERT\` |
| **R**ead | GET | \`SELECT\` |
| **U**pdate | PUT / PATCH | \`UPDATE\` |
| **D**elete | DELETE | \`DELETE\` |

Press the buttons and watch all three layers at once.`,
      },
      { type: "widget", widget: "crud-table" },
      {
        type: "quiz",
        id: "crud-quiz",
        title: "Check yourself",
        questions: [
          { q: "Delete the shift that has a signup. What happens to its signup row, and why?", options: ["It stays", "It is deleted too, so no signup points at a shift that no longer exists", "The delete fails"], answer: 1, explain: "Rows that refer to other rows must be cleaned up (or the delete refused); here the server deletes the signups first." },
          { q: "Which SQL statement does `PATCH /api/shifts/2` with `{\"slots\": 10}` run?", options: ["INSERT", "SELECT", "UPDATE … SET slots = 10 WHERE id = 2"], answer: 2, explain: "An update of one column in one row." },
        ],
      },
    ],
  },
  // ---------------- Hosting ----------------
  {
    id: "deploy",
    node: "hosting",
    title: "Hosting and deployment",
    summary: "Where the server and database actually run, and how code gets from GitHub to a live URL.",
    minutes: 4,
    sections: [
      {
        type: "markdown",
        md: `Your laptop can run the whole app (\`npm run dev\`), but only you can reach \`localhost\`. To let volunteers use it, it has to run on a computer that is always on and reachable: a **host**.

A typical modern flow (the same one this site uses):

1. You push code to **GitHub**.
2. The host (for example **Vercel**) notices, **builds** the app, and runs its checks.
3. If the build succeeds, the new version goes **live** at a URL. Each pull request also gets a **preview URL** to try before merging.
4. The **database** runs as a separate hosted service (for example Postgres on Neon or Supabase); the app connects with a secret URL kept in **environment variables**, never in the code.

Why the separation? The app's code can be rebuilt and replaced many times a day; the data must survive every deploy.`,
      },
      {
        type: "quiz",
        id: "deploy-quiz",
        title: "Check yourself",
        questions: [
          { q: "Where should the database password live?", options: ["In the code, so the app can find it", "In an environment variable on the host", "In the front end"], answer: 1, explain: "Code is shared (GitHub) and the front end is public; secrets go in environment variables." },
          { q: "Why does each pull request get its own preview URL?", options: ["To test the change for real before it goes live", "To make the site faster", "To back up the database"], answer: 0, explain: "You can click through the change exactly as users will, without touching the live site." },
        ],
      },
    ],
  },
];

export const topicsFor = (node: MapNodeId) => WEB_TOPICS.filter((t) => t.node === node);
export const getWebTopic = (id: string) => WEB_TOPICS.find((t) => t.id === id);
