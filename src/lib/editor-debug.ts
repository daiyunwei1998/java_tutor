/**
 * CodeMirror pieces for the step-through debugger:
 * - a breakpoint gutter (click a line number area to toggle a red dot); breakpoints move with edits
 * - the "paused here" line (▶ marker + highlighted line) and the previous line (faint)
 */
import { RangeSet, RangeSetBuilder, StateEffect, StateField, type Extension } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, GutterMarker, gutter, lineNumbers } from "@codemirror/view";

export type Breakpoint = { line: number; cond?: string };

class BreakpointMarker extends GutterMarker {
  constructor(readonly cond = "") {
    super();
  }
  eq(other: GutterMarker) {
    return other instanceof BreakpointMarker && other.cond === this.cond;
  }
  toDOM() {
    const el = document.createElement("span");
    el.className = this.cond ? "cm-bp-dot cond" : "cm-bp-dot";
    el.title = this.cond
      ? `Conditional breakpoint: pauses here only when ${this.cond}. Click to remove.`
      : "Breakpoint: the debugger pauses before this line runs. Click to remove.";
    return el;
  }
}
class HereMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement("span");
    el.className = "cm-bp-here";
    el.textContent = "▶";
    return el;
  }
}
const bpMarker = new BreakpointMarker();
const marker = (cond?: string) => (cond?.trim() ? new BreakpointMarker(cond.trim()) : bpMarker);
const hereMarker = new HereMarker();

/** Replaces all breakpoints of the open file (1-based line numbers). */
export const setBreakpoints = StateEffect.define<Breakpoint[]>();
const toggleBreakpoint = StateEffect.define<number>(); // document position of the line start

const breakpointField = StateField.define<RangeSet<GutterMarker>>({
  create: () => RangeSet.empty,
  update(set, tr) {
    set = set.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(toggleBreakpoint)) {
        let has = false;
        set.between(e.value, e.value, () => {
          has = true;
        });
        set = has ? set.update({ filter: (from) => from !== e.value }) : set.update({ add: [bpMarker.range(e.value)] });
      } else if (e.is(setBreakpoints)) {
        const doc = tr.state.doc;
        const seen = new Set<number>();
        const list = e.value.filter((x) => x.line >= 1 && x.line <= doc.lines && !seen.has(x.line) && seen.add(x.line)).sort((a, c) => a.line - c.line);
        const b = new RangeSetBuilder<GutterMarker>();
        list.forEach((x) => b.add(doc.line(x.line).from, doc.line(x.line).from, marker(x.cond)));
        set = b.finish();
      }
    }
    return set;
  },
});

/** Current paused line (1-based) and the one before it; 0 = none. */
export const setDebugLines = StateEffect.define<{ now: number; was: number }>();
const debugLinesField = StateField.define<{ now: number; was: number }>({
  create: () => ({ now: 0, was: 0 }),
  update(v, tr) {
    for (const e of tr.effects) if (e.is(setDebugLines)) v = e.value;
    return v;
  },
});

const lineDeco = EditorView.decorations.compute([debugLinesField, "doc"], (state): DecorationSet => {
  const { now, was } = state.field(debugLinesField);
  const doc = state.doc;
  const b = new RangeSetBuilder<Decoration>();
  const items: [number, string][] = [];
  if (was > 0 && was <= doc.lines && was !== now) items.push([was, "cm-debug-was"]);
  if (now > 0 && now <= doc.lines) items.push([now, "cm-debug-now"]);
  items.sort((a, c) => a[0] - c[0]).forEach(([l, cls]) => b.add(doc.line(l).from, doc.line(l).from, Decoration.line({ class: cls })));
  return b.finish();
});

/** The breakpoints in this editor (1-based lines, with their conditions). */
export function readBreakpoints(view: EditorView): Breakpoint[] {
  const out: Breakpoint[] = [];
  const set = view.state.field(breakpointField, false);
  if (!set) return out;
  const it = set.iter();
  while (it.value) {
    const cond = (it.value as BreakpointMarker).cond;
    out.push(cond ? { line: view.state.doc.lineAt(it.from).number, cond } : { line: view.state.doc.lineAt(it.from).number });
    it.next();
  }
  return out;
}

/**
 * @param onChange called with the new breakpoint lines after the user toggles one or edits move them
 */
export function debugExtensions(onChange: (bps: Breakpoint[]) => void, enabled: () => boolean): Extension[] {
  return [
    breakpointField,
    debugLinesField,
    lineDeco,
    gutter({
      class: "cm-bp-gutter",
      renderEmptyElements: true,
      markers: (view) => {
        const { now } = view.state.field(debugLinesField);
        const bps = view.state.field(breakpointField);
        if (now <= 0 || now > view.state.doc.lines) return bps;
        const pos = view.state.doc.line(now).from;
        return RangeSet.join([bps, RangeSet.of([hereMarker.range(pos)])]);
      },
      initialSpacer: () => bpMarker,
      domEventHandlers: {
        mousedown(view, line) {
          if (!enabled()) return false;
          view.dispatch({ effects: toggleBreakpoint.of(line.from) });
          return true;
        },
      },
    }),
    // Our own line numbers, so clicking a number toggles its breakpoint too (the dot gutter is a small target).
    // The editor's basicSetup must have lineNumbers: false.
    lineNumbers({
      domEventHandlers: {
        mousedown(view, line) {
          if (!enabled()) return false;
          view.dispatch({ effects: toggleBreakpoint.of(line.from) });
          return true;
        },
      },
    }),
    EditorView.updateListener.of((u) => {
      const toggled = u.transactions.some((t) => t.effects.some((e) => e.is(toggleBreakpoint)));
      const userEdit = u.docChanged && u.transactions.some((t) => t.isUserEvent("input") || t.isUserEvent("delete") || t.isUserEvent("undo") || t.isUserEvent("redo") || t.isUserEvent("move"));
      if (toggled || userEdit) onChange(readBreakpoints(u.view));
    }),
  ];
}
