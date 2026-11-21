"use client";

import { useEffect, useRef } from "react";
import {
  currentEditor,
  decodePoint,
  elementAt,
  elementPath,
  encodePoint,
  encodeSelection,
  applyScroll,
  encodeScroll,
  findScrollRegion,
  liveRoot,
  type ScrollAnchor,
  type PointAnchor,
  type RangeAnchor,
  rangeRects,
  scrollRegionOf,
} from "@/lib/live/anchor";
import { type LiveRole, type LiveSession, useLive } from "./LiveContext";

export type Highlight = { id: string; by: LiveRole; a: RangeAnchor };
type HlMsg = { op: "add"; h: Highlight } | { op: "clear" };

const COLORS: Record<LiveRole, { cursor: string; hl: string; sel: string }> = {
  teacher: { cursor: "#e8590c", hl: "rgba(255, 212, 0, 0.42)", sel: "rgba(232, 89, 12, 0.22)" },
  student: { cursor: "#1c7ed6", hl: "rgba(116, 192, 252, 0.40)", sel: "rgba(28, 126, 214, 0.22)" },
};

/** Adds a highlight on both screens (or clears them). */
export function sendHighlight(live: LiveSession, msg: HlMsg) {
  live.emit("hl", msg);
  live.send("hl", msg);
}

/**
 * Everything both screens share while a teacher is connected: the other person's pointer, highlighter marks,
 * code-selection, scroll positions of the panes, and button presses inside visualizations.
 * Drawn imperatively in a fixed overlay so 20 updates per second don't re-render React.
 */
export function LiveLayer({ peerLabel, highlighter = false }: { peerLabel: string; highlighter?: boolean }) {
  const live = useLive();
  const hlOn = useRef(highlighter);
  hlOn.current = highlighter;

  useEffect(() => {
    if (!live) return;
    const me = live.role;
    const them: LiveRole = me === "teacher" ? "student" : "teacher";
    const offs: (() => void)[] = [];
    const listen = <K extends keyof DocumentEventMap>(t: K, fn: (e: DocumentEventMap[K]) => void, capture = true) => {
      document.addEventListener(t, fn as EventListener, capture);
      offs.push(() => document.removeEventListener(t, fn as EventListener, capture));
    };

    // ----- overlay DOM -----
    const layer = document.createElement("div");
    layer.className = "live-layer";
    layer.setAttribute("aria-hidden", "true");
    const hlBox = document.createElement("div");
    layer.appendChild(hlBox);
    const cursor = document.createElement("div");
    cursor.className = "live-cursor";
    cursor.style.setProperty("--live-color", COLORS[them].cursor);
    cursor.innerHTML = `<svg width="18" height="22" viewBox="0 0 18 22"><path d="M1 1 L1 17 L5.5 13 L8.5 20.5 L11.5 19.2 L8.6 12 L15 12 Z" fill="var(--live-color)" stroke="white" stroke-width="1.4" stroke-linejoin="round"/></svg><span></span>`;
    cursor.querySelector("span")!.textContent = peerLabel;
    cursor.style.display = "none";
    layer.appendChild(cursor);
    const caretEl = document.createElement("div");
    caretEl.className = "live-caret";
    caretEl.style.setProperty("--live-color", COLORS[them].cursor);
    caretEl.innerHTML = "<span></span>";
    caretEl.querySelector("span")!.textContent = peerLabel;
    caretEl.style.display = "none";
    layer.appendChild(caretEl);
    document.body.appendChild(layer);
    offs.push(() => layer.remove());

    // ----- state -----
    let remotePointer: PointAnchor | null = null;
    let highlights: Highlight[] = [];
    let remoteSel: RangeAnchor | null = null;
    let remoteCaret: { file: string; pos: number } | null = null;
    const pings: { a: PointAnchor; until: number }[] = [];

    offs.push(
      live.on<{ a: PointAnchor | null }>("cursor", (d) => (remotePointer = d.a)),
      live.on<{ a: PointAnchor }>("ping", (d) => pings.push({ a: d.a, until: Date.now() + 700 })),
      live.on<HlMsg>("hl", (m) => {
        if (m.op === "clear") highlights = [];
        else highlights = [...highlights.filter((h) => h.id !== m.h.id), m.h].slice(-40);
      }),
      live.on<{ a: RangeAnchor | null; caret?: { file: string; pos: number } | null }>("sel", (d) => {
        remoteSel = d.a;
        remoteCaret = d.caret ?? null;
      }),
      live.on<boolean>("_peer", (p) => {
        if (!p) {
          remotePointer = null;
          remoteSel = null;
          remoteCaret = null;
          highlights = [];
        }
      }),
    );

    // ----- my pointer -----
    let lastMove = 0;
    let pendingMove: PointerEvent | null = null;
    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    const sendMove = () => {
      moveTimer = null;
      if (pendingMove) live.send("cursor", { a: encodePoint(pendingMove.clientX, pendingMove.clientY) });
      pendingMove = null;
      lastMove = Date.now();
    };
    listen("pointermove", (e) => {
      if (!live.peer) return;
      pendingMove = e;
      if (!moveTimer) moveTimer = setTimeout(sendMove, Math.max(0, 50 - (Date.now() - lastMove)));
    }, false);
    listen("pointerdown", (e) => {
      if (live.peer && e.isTrusted) live.send("ping", { a: encodePoint(e.clientX, e.clientY) });
    });
    const hide = () => live.send("cursor", { a: null });
    document.documentElement.addEventListener("mouseleave", hide);
    offs.push(() => document.documentElement.removeEventListener("mouseleave", hide));

    // ----- highlighter (teacher drags over lesson text) -----
    listen("mouseup", (e) => {
      if (me !== "teacher" || !hlOn.current || !e.isTrusted) return;
      const target = e.target;
      setTimeout(() => {
        const id = Math.random().toString(36).slice(2);
        // In the code editor: mark the selected code (the selection itself stays, so editing still works).
        const ed = currentEditor();
        if (ed && target instanceof Node && ed.view.dom.contains(target)) {
          const s = ed.view.state.selection.main;
          if (!s.empty) sendHighlight(live, { op: "add", h: { id, by: me, a: { k: "cm", file: ed.file, from: s.from, to: s.to } } });
          return;
        }
        const a = encodeSelection();
        if (!a) return;
        sendHighlight(live, { op: "add", h: { id, by: me, a } });
        window.getSelection()?.removeAllRanges();
      }, 0);
    });

    // ----- scroll sync -----
    const suppressed = new WeakMap<Element, number>();
    const scrollTimers = new Map<string, ReturnType<typeof setTimeout>>();
    listen("scroll", (e) => {
      const el = e.target;
      if (!live.peer || !(el instanceof Element)) return;
      const region = scrollRegionOf(el);
      if (!region || (suppressed.get(el) ?? 0) > Date.now()) return;
      if (scrollTimers.has(region)) return;
      scrollTimers.set(region, setTimeout(() => {
        scrollTimers.delete(region);
        live.send("scroll", { region, a: encodeScroll(region, el) });
      }, 70));
    });
    offs.push(live.on<{ region: string; a: ScrollAnchor }>("scroll", (d) => {
      const el = findScrollRegion(d.region);
      if (!el || !d.a) return;
      suppressed.set(el, Date.now() + 160);
      applyScroll(d.region, el, d.a);
    }));

    // ----- button presses and inputs inside visualizations (their state lives in the components) -----
    const inLiveClicks = (t: EventTarget | null) => (t instanceof Element ? t.closest("[data-live-clicks]") && liveRoot()?.contains(t) : false);
    listen("click", (e) => {
      if (!live.peer || !e.isTrusted || !inLiveClicks(e.target)) return;
      const target = (e.target as Element).closest("button, [role=button], [role=tab], label, a") ?? (e.target as Element);
      if (target instanceof HTMLInputElement) return;
      const p = elementPath(target);
      if (p) live.send("click", { p });
    });
    listen("input", (e) => {
      const t = e.target;
      if (!live.peer || !e.isTrusted || !inLiveClicks(t)) return;
      if (!(t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement)) return;
      const p = elementPath(t);
      if (p) live.send("input", { p, value: t.value, checked: t instanceof HTMLInputElement ? t.checked : undefined });
    });
    offs.push(
      live.on<{ p: number[] }>("click", (d) => (elementAt(d.p) as HTMLElement | null)?.click()),
      live.on<{ p: number[]; value: string; checked?: boolean }>("input", (d) => {
        const el = elementAt(d.p);
        if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) return;
        if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
          if (el.checked !== d.checked) el.click();
          return;
        }
        const proto = Object.getPrototypeOf(el);
        Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, d.value);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }),
    );

    // ----- my code selection (both directions, not sticky) -----
    let lastSel = "";
    let lastSelSent = 0;

    // ----- per-frame drawing -----
    const pool: HTMLDivElement[] = [];
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      // code selection
      const ed = currentEditor();
      if (live.peer && ed && Date.now() - lastSelSent > 100) {
        const s = ed.view.state.selection.main;
        const focused = ed.view.hasFocus;
        const a: RangeAnchor | null = focused && !s.empty ? { k: "cm", file: ed.file, from: s.from, to: s.to } : null;
        const caret = focused ? { file: ed.file, pos: s.head } : null;
        const key = JSON.stringify([a, caret]);
        if (key !== lastSel) {
          lastSel = key;
          lastSelSent = Date.now();
          live.send("sel", { a, caret });
        }
      }
      // highlights
      const boxes: { r: DOMRect; c: string }[] = [];
      for (const h of highlights) for (const r of rangeRects(h.a)) boxes.push({ r, c: COLORS[h.by].hl });
      if (remoteSel) for (const r of rangeRects(remoteSel)) boxes.push({ r, c: COLORS[them].sel });
      const now = Date.now();
      while (pings.length && pings[0].until < now) pings.shift();
      for (const p of pings) {
        const pt = decodePoint(p.a);
        if (pt) boxes.push({ r: new DOMRect(pt.x - 14, pt.y - 14, 28, 28), c: "ping" });
      }
      while (pool.length < boxes.length) {
        const d = document.createElement("div");
        hlBox.appendChild(d);
        pool.push(d);
      }
      pool.forEach((d, i) => {
        const b = boxes[i];
        if (!b) {
          d.style.display = "none";
          return;
        }
        d.style.display = "block";
        d.className = b.c === "ping" ? "live-ping" : "live-hl";
        if (b.c === "ping") d.style.setProperty("--live-color", COLORS[them].cursor);
        else d.style.background = b.c;
        d.style.transform = `translate(${b.r.left}px, ${b.r.top}px)`;
        d.style.width = `${b.r.width}px`;
        d.style.height = `${b.r.height}px`;
      });
      // the other person's typing cursor in the code
      const cr = remoteCaret && ed && ed.file === remoteCaret.file && remoteCaret.pos <= ed.view.state.doc.length ? ed.view.coordsAtPos(remoteCaret.pos) : null;
      const cbox = cr && ed!.view.scrollDOM.getBoundingClientRect();
      if (cr && cbox && cr.top >= cbox.top - 2 && cr.bottom <= cbox.bottom + 2) {
        caretEl.style.display = "block";
        caretEl.style.transform = `translate(${cr.left - 1}px, ${cr.top}px)`;
        caretEl.style.height = `${cr.bottom - cr.top}px`;
      } else caretEl.style.display = "none";
      // pointer
      const pt = remotePointer && decodePoint(remotePointer);
      if (pt) {
        cursor.style.display = "block";
        cursor.style.transform = `translate(${pt.x - 1}px, ${pt.y - 1}px)`;
      } else cursor.style.display = "none";
    };
    raf = requestAnimationFrame(frame);
    offs.push(() => cancelAnimationFrame(raf));

    return () => {
      hide();
      offs.forEach((f) => f());
      if (moveTimer) clearTimeout(moveTimer);
      scrollTimers.forEach((t) => clearTimeout(t));
    };
  }, [live, peerLabel]);

  return null;
}
