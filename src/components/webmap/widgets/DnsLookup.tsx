"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { who: "Browser cache", ask: "Do I already know {d}?", miss: "Not cached.", ms: 0 },
  { who: "Resolver (your ISP or a public DNS)", ask: "Do you know {d}?", miss: "Not cached. I'll ask around.", ms: 4 },
  { who: "Root server", ask: "Who handles .{tld}?", miss: "Ask the .{tld} servers.", ms: 25 },
  { who: ".{tld} server", ask: "Who handles {zone}?", miss: "Ask {zone}'s name server.", ms: 30 },
  { who: "{zone} name server", ask: "What is the address of {d}?", miss: "{ip}", ms: 35 },
];

function fakeIp(d: string) {
  let h = 0;
  for (const ch of d) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return `203.0.113.${(h % 250) + 2}`;
}

/** Step-by-step DNS resolution with a cache, so the second lookup is visibly faster. */
export function DnsLookup() {
  const [domain, setDomain] = useState("volunteer.example.org");
  const [cache, setCache] = useState<Record<string, string>>({});
  const [run, setRun] = useState<{ d: string; cached: boolean; step: number } | null>(null);

  const d = run?.d ?? domain.trim().toLowerCase();
  const parts = d.split(".");
  const tld = parts[parts.length - 1] ?? "org";
  const zone = parts.slice(-2).join(".");
  const ip = cache[d] ?? fakeIp(d);
  const fill = (s: string) => s.replace(/\{d\}/g, d).replace(/\{tld\}/g, tld).replace(/\{zone\}/g, zone).replace(/\{ip\}/g, ip);

  useEffect(() => {
    if (!run || run.cached || run.step >= STEPS.length) return;
    const t = setTimeout(() => setRun((r) => (r ? { ...r, step: r.step + 1 } : r)), 800);
    return () => clearTimeout(t);
  }, [run]);
  useEffect(() => {
    if (run && !run.cached && run.step === STEPS.length) setCache((c) => ({ ...c, [run.d]: fakeIp(run.d) }));
  }, [run]);

  function lookup() {
    const name = domain.trim().toLowerCase();
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(name)) return;
    setRun({ d: name, cached: Boolean(cache[name]), step: cache[name] ? STEPS.length : 0 });
  }

  const total = run ? (run.cached ? 0 : STEPS.slice(0, run.step).reduce((a, s) => a + s.ms, 0)) : 0;
  return (
    <div className="wm-widget">
      <h4>📖 Look up a name</h4>
      <div className="wm-row">
        <input className="wm-input" value={domain} onChange={(e) => setDomain(e.target.value)} aria-label="Domain name" style={{ minWidth: 240 }} spellCheck={false} />
        <button className="btn primary" onClick={lookup} disabled={!!run && !run.cached && run.step < STEPS.length}>Look up</button>
        <button className="btn ghost small" onClick={() => { setCache({}); setRun(null); }}>Clear cache</button>
      </div>
      {run && (
        <>
          {run.cached ? (
            <div className="callout" style={{ marginTop: 10 }}>
              ⚡ <strong>Browser cache hit:</strong> {run.d} → <code>{cache[run.d]}</code> in about 0 ms. No servers were asked.
            </div>
          ) : (
            <div className="wm-dn" style={{ marginTop: 10 }}>
              {STEPS.map((s, i) => (
                <div key={i} className={i === run.step ? "on" : i < run.step ? "done" : ""}>
                  <strong>{fill(s.who)}</strong>
                  {i < run.step && (
                    <>
                      <div className="muted">“{fill(s.ask)}”</div>
                      <div>→ {i === STEPS.length - 1 ? <code>{fill(s.miss)}</code> : fill(s.miss)}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="small muted">
            {run.cached ? "Look up a different name, or clear the cache, to see the full chain again." : run.step < STEPS.length ? "Asking…" : `Done in about ${total} ms (made-up but realistic timings). The answer is now cached; press Look up again.`}
          </p>
        </>
      )}
      <p className="small muted" style={{ marginBottom: 0 }}>Addresses are fake (203.0.113.x is reserved for documentation).</p>
    </div>
  );
}
