"use client";

import type { EditorView } from "@codemirror/view";

/**
 * Layout-independent positions. Teacher and student render the same workspace, but their windows differ in size,
 * so a pointer or a highlight is sent relative to *content*: an element path inside the workspace plus a fraction
 * of that element's box, or a character position inside the code editor.
 */

export type PointAnchor =
  | { k: "el"; p: number[]; fx: number; fy: number }
  | { k: "cm"; file: string; pos: number; dx: number; dy: number }
  | { k: "win"; fx: number; fy: number };

export type NodeRef = { p: number[]; t: number; o: number };
export type RangeAnchor = { k: "dom"; s: NodeRef; e: NodeRef } | { k: "cm"; file: string; from: number; to: number };

// ---------- the code editor (registered by CodePanel) ----------

let editor: { view: EditorView; file: string } | null = null;
export function registerEditor(view: EditorView | undefined, file: string) {
  editor = view ? { view, file } : null;
}
export const currentEditor = () => (editor && editor.view.dom.isConnected ? editor : null);

export const liveRoot = () => document.querySelector<HTMLElement>("[data-live-root]");

function pathOf(root: Element, el: Element): number[] | null {
  const p: number[] = [];
  let cur: Element | null = el;
  while (cur && cur !== root) {
    const parent: Element | null = cur.parentElement;
    if (!parent) return null;
    p.unshift(Array.prototype.indexOf.call(parent.children, cur));
    cur = parent;
  }
  return cur === root ? p : null;
}

function resolve(root: Element, p: number[]): Element | null {
  let cur: Element | null = root;
  for (const i of p) {
    cur = cur?.children[i] ?? null;
    if (!cur) return null;
  }
  return cur;
}

export function encodePoint(x: number, y: number): PointAnchor {
  const root = liveRoot();
  const win: PointAnchor = { k: "win", fx: x / window.innerWidth, fy: y / window.innerHeight };
  if (!root) return win;
  const el = document.elementFromPoint(x, y);
  if (!el || !root.contains(el)) return win;
  const ed = currentEditor();
  if (ed && ed.view.contentDOM.parentElement?.contains(el)) {
    const pos = ed.view.posAtCoords({ x, y }, false);
    const c = ed.view.coordsAtPos(pos);
    if (c) return { k: "cm", file: ed.file, pos, dx: x - c.left, dy: y - c.top };
  }
  const p = pathOf(root, el);
  if (!p) return win;
  const r = el.getBoundingClientRect();
  return { k: "el", p, fx: r.width ? (x - r.left) / r.width : 0, fy: r.height ? (y - r.top) / r.height : 0 };
}

export function decodePoint(a: PointAnchor): { x: number; y: number } | null {
  if (a.k === "win") return { x: a.fx * window.innerWidth, y: a.fy * window.innerHeight };
  if (a.k === "cm") {
    const ed = currentEditor();
    if (!ed || ed.file !== a.file || a.pos > ed.view.state.doc.length) return null;
    const c = ed.view.coordsAtPos(a.pos);
    const box = ed.view.scrollDOM.getBoundingClientRect();
    return c && c.top >= box.top - 2 && c.bottom <= box.bottom + 2 ? { x: c.left + a.dx, y: c.top + a.dy } : null;
  }
  const root = liveRoot();
  const el = root && resolve(root, a.p);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const pt = { x: r.left + a.fx * r.width, y: r.top + a.fy * r.height };
  // Hide the pointer while what it points at is scrolled out of its pane on this screen.
  const box = el.closest(".cm-scroller, [data-live-scroll]")?.getBoundingClientRect();
  if (box && (pt.y < box.top || pt.y > box.bottom || pt.x < box.left || pt.x > box.right)) return null;
  return pt;
}

function nodeRef(root: Element, node: Node, offset: number): NodeRef | null {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const p = pathOf(root, node as Element);
    return p && { p, t: -1, o: offset };
  }
  const parent = node.parentElement;
  const p = parent && pathOf(root, parent);
  return p && { p, t: Array.prototype.indexOf.call(parent!.childNodes, node), o: offset };
}

function refNode(root: Element, r: NodeRef): [Node, number] | null {
  const el = resolve(root, r.p);
  if (!el) return null;
  if (r.t < 0) return [el, Math.min(r.o, el.childNodes.length)];
  const n = el.childNodes[r.t];
  return n ? [n, Math.min(r.o, n.textContent?.length ?? 0)] : null;
}

/** The current text selection as an anchor, or null (collapsed, or outside the workspace). */
export function encodeSelection(): RangeAnchor | null {
  const root = liveRoot();
  const sel = window.getSelection();
  if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  const ed = currentEditor();
  if (ed && ed.view.dom.contains(range.commonAncestorContainer)) return null; // the editor reports its own selection
  const s = nodeRef(root, range.startContainer, range.startOffset);
  const e = nodeRef(root, range.endContainer, range.endOffset);
  return s && e ? { k: "dom", s, e } : null;
}

/** Screen rectangles of a range anchor, clipped to the scroll box it lives in. */
export function rangeRects(a: RangeAnchor): DOMRect[] {
  let range: Range | null = null;
  try {
    if (a.k === "cm") {
      const ed = currentEditor();
      if (!ed || ed.file !== a.file) return [];
      const len = ed.view.state.doc.length;
      const vp = ed.view.viewport;
      const from = Math.max(Math.min(a.from, len), vp.from);
      const to = Math.min(a.to, len, vp.to);
      if (to <= from) return [];
      const s = ed.view.domAtPos(from);
      const e = ed.view.domAtPos(to);
      range = document.createRange();
      range.setStart(s.node, s.offset);
      range.setEnd(e.node, e.offset);
    } else {
      const root = liveRoot();
      if (!root) return [];
      const s = refNode(root, a.s);
      const e = refNode(root, a.e);
      if (!s || !e) return [];
      range = document.createRange();
      range.setStart(s[0], s[1]);
      range.setEnd(e[0], e[1]);
    }
  } catch {
    return [];
  }
  const start = range.startContainer;
  const host = (start.nodeType === Node.ELEMENT_NODE ? (start as Element) : start.parentElement)?.closest(".cm-scroller, [data-live-scroll]");
  const clip = host?.getBoundingClientRect();
  const out: DOMRect[] = [];
  for (const r of Array.from(range.getClientRects())) {
    if (r.width < 1 || r.height < 1) continue;
    if (!clip) {
      out.push(r);
      continue;
    }
    const top = Math.max(r.top, clip.top);
    const bottom = Math.min(r.bottom, clip.bottom);
    const left = Math.max(r.left, clip.left);
    const right = Math.min(r.right, clip.right);
    if (bottom > top && right > left) out.push(new DOMRect(left, top, right - left, bottom - top));
  }
  // Nested elements (code tokens inside a line) report overlapping boxes; keep only the outer ones so the
  // highlighter color stays even.
  const inside = (a: DOMRect, b: DOMRect) => a !== b && a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5;
  return out.filter((r, i) => !out.some((o, j) => (j < i || !inside(o, r)) && inside(r, o)));
}

// ---------- scroll regions ----------
// A scroll position is sent as "this content is at the top of the pane" (a code line, or an element plus an offset),
// so both screens show the same thing even when their panes have different widths and text wraps differently.

export type ScrollAnchor = { k: "line"; line: number; dy: number } | { k: "el"; p: number[]; fy: number } | { k: "ratio"; r: number };

/** The element that really scrolls the code: CodeMirror's own scroller or the wrapper around it. */
function editorScroller(view: EditorView): HTMLElement {
  for (let el: HTMLElement | null = view.scrollDOM; el && el !== document.body; el = el.parentElement) {
    const o = getComputedStyle(el).overflowY;
    if ((o === "auto" || o === "scroll") && el.scrollHeight > el.clientHeight + 1) return el;
    if (el.classList.contains("editor-wrap")) break;
  }
  return view.scrollDOM;
}

export function scrollRegionOf(el: Element): string | null {
  if (el.classList.contains("cm-scroller") || el.classList.contains("editor-wrap")) return "editor";
  return el.getAttribute("data-live-scroll");
}

export function findScrollRegion(name: string): HTMLElement | null {
  const root = liveRoot();
  if (!root) return null;
  if (name === "editor") {
    const ed = currentEditor();
    return ed ? editorScroller(ed.view) : null;
  }
  return root.querySelector<HTMLElement>(`[data-live-scroll="${name}"]`);
}

export function encodeScroll(region: string, el: Element): ScrollAnchor {
  const max = el.scrollHeight - el.clientHeight;
  const ratio: ScrollAnchor = { k: "ratio", r: max > 0 ? el.scrollTop / max : 0 };
  if (el.scrollTop <= 1 || el.scrollTop >= max - 1) return ratio; // top and bottom are exact as they are
  const box = el.getBoundingClientRect();
  if (region === "editor") {
    const ed = currentEditor();
    if (!ed) return ratio;
    const h = box.top - ed.view.documentTop;
    const block = ed.view.lineBlockAtHeight(h);
    return { k: "line", line: ed.view.state.doc.lineAt(block.from).number, dy: h - block.top };
  }
  const root = liveRoot();
  const hit = document.elementFromPoint(box.left + Math.min(40, box.width / 2), box.top + 6);
  const p = root && hit && el.contains(hit) ? pathOf(root, hit) : null;
  if (!p || !hit) return ratio;
  const r = hit.getBoundingClientRect();
  return { k: "el", p, fy: r.height ? (box.top - r.top) / r.height : 0 };
}

export function applyScroll(region: string, el: HTMLElement, a: ScrollAnchor) {
  const box = el.getBoundingClientRect();
  if (a.k === "line" && region === "editor") {
    const ed = currentEditor();
    if (ed) {
      const doc = ed.view.state.doc;
      const block = ed.view.lineBlockAt(doc.line(Math.min(Math.max(1, a.line), doc.lines)).from);
      el.scrollTop += ed.view.documentTop + block.top + a.dy - box.top;
      return;
    }
  }
  if (a.k === "el") {
    const root = liveRoot();
    const t = root && resolve(root, a.p);
    if (t && el.contains(t)) {
      const r = t.getBoundingClientRect();
      el.scrollTop += r.top + a.fy * r.height - box.top;
      return;
    }
  }
  const max = el.scrollHeight - el.clientHeight;
  el.scrollTop = (a.k === "ratio" ? a.r : 0) * max;
}

export function elementPath(el: Element): number[] | null {
  const root = liveRoot();
  return root ? pathOf(root, el) : null;
}

export function elementAt(p: number[]): Element | null {
  const root = liveRoot();
  return root ? resolve(root, p) : null;
}
