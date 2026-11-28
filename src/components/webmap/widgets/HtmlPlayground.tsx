"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const START = `<h2>Sign up for a shift</h2>
<form action="/api/signups" method="post">
  <label>Your name
    <input name="volunteer" value="Amy">
  </label>
  <label>Shift
    <select name="shift">
      <option value="1">Food bank: sorting</option>
      <option value="3">Reading buddies</option>
    </select>
  </label>
  <label>
    <input type="checkbox" name="newsletter" value="yes"> Send me news
  </label>
  <button>Sign up</button>
</form>`;

// Injected into the preview: stops the real submit and tells the parent page what would have been sent.
const SPY = `<script>
document.addEventListener("submit", function (e) {
  e.preventDefault();
  var f = e.target, fd = new FormData(f), pairs = [];
  fd.forEach(function (v, k) { pairs.push([k, String(v)]); });
  parent.postMessage({ source: "wm-html", method: (f.getAttribute("method") || "get").toLowerCase(), action: f.getAttribute("action") || "", pairs: pairs }, "*");
}, true);
document.addEventListener("click", function (e) {
  var a = e.target.closest && e.target.closest("a[href]");
  if (!a) return;
  e.preventDefault();
  parent.postMessage({ source: "wm-html", method: "get", action: a.getAttribute("href"), pairs: [], link: true }, "*");
}, true);
</script>`;

const STYLE = `<style>body{font-family:system-ui,sans-serif;font-size:14px;padding:8px;color:#2e2c28;background:#fbf9f4}
label{display:block;margin:8px 0}input,select,button{font:inherit;margin-left:4px}button{padding:4px 12px}</style>`;

type Sent = { method: string; action: string; pairs: [string, string][]; link?: boolean };

/** Live HTML editor. Submitting the form in the preview shows the HTTP request it would produce. */
export function HtmlPlayground() {
  const [html, setHtml] = useState(START);
  const [sent, setSent] = useState<Sent | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const doc = useMemo(() => `<!doctype html><html><head>${STYLE}</head><body>${html}${SPY}</body></html>`, [html]);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || e.data?.source !== "wm-html") return;
      setSent({ method: e.data.method, action: e.data.action, pairs: e.data.pairs, link: e.data.link });
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, []);

  let request = "";
  if (sent) {
    const qs = new URLSearchParams(sent.pairs).toString();
    const path = sent.action || "/(this page)";
    if (sent.method === "post") {
      request = `POST ${path} HTTP/1.1\nHost: volunteer.example.org\nContent-Type: application/x-www-form-urlencoded\n\n${qs}`;
    } else {
      request = `GET ${path}${qs ? (path.includes("?") ? "&" : "?") + qs : ""} HTTP/1.1\nHost: volunteer.example.org`;
    }
  }

  return (
    <div className="wm-widget">
      <h4>🧩 HTML playground</h4>
      <div className="wm-grid2">
        <div>
          <div className="wm-label">HTML (edit me)</div>
          <textarea className="wm-input" value={html} onChange={(e) => { setHtml(e.target.value); setSent(null); }} rows={16} style={{ width: "100%" }} spellCheck={false} aria-label="HTML code" />
          <button className="btn small ghost" onClick={() => { setHtml(START); setSent(null); }}>Reset HTML</button>
        </div>
        <div>
          <div className="wm-label">Preview (submit the form)</div>
          <iframe ref={frame} title="HTML preview" sandbox="allow-scripts allow-forms" srcDoc={doc} style={{ width: "100%", height: 230, border: "1px solid var(--border)", borderRadius: 8, background: "#fbf9f4" }} />
          <div className="wm-label">The request the browser would send</div>
          <pre className="wm-msg" style={{ minHeight: 70 }}>{request || "Submit the form in the preview to see it."}</pre>
        </div>
      </div>
      <p className="small muted" style={{ marginBottom: 0 }}>
        Try: change <code>method=&quot;post&quot;</code> to <code>method=&quot;get&quot;</code>; remove the <code>name</code> from an input; untick the checkbox. A plain HTML form sends <code>name=value</code> pairs; apps that send JSON do it with JavaScript (<code>fetch</code>).
      </p>
    </div>
  );
}
