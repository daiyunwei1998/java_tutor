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
  return out;
}

// ---------- scroll regions ----------

export function scrollRegionOf(el: Element): string | null {
  if (el.classList.contains("cm-scroller")) return "editor";
  return el.getAttribute("data-live-scroll");
}

export function findScrollRegion(name: string): HTMLElement | null {
  const root = liveRoot();
  if (!root) return null;
  if (name === "editor") return currentEditor()?.view.scrollDOM ?? null;
  return root.querySelector<HTMLElement>(`[data-live-scroll="${name}"]`);
}

export function elementPath(el: Element): number[] | null {
  const root = liveRoot();
  return root ? pathOf(root, el) : null;
}

export function elementAt(p: number[]): Element | null {
  const root = liveRoot();
  return root ? resolve(root, p) : null;
}
