"use client";

import type { Ticket, VizConfig } from "@/content/types";
import { ArrayMemoryViz } from "./ArrayMemoryViz";
import { ConceptViz } from "./concepts/ConceptViz";
import { FilterLab } from "./FilterLab";
import { ImageLab } from "./ImageLab";
import { MatrixAlgoViz } from "./MatrixAlgoViz";
import { TraversalViz } from "./TraversalViz";

/** Visualization registry: content refers to visualizations by type + config only. */
function renderViz(v: VizConfig, ticket: Ticket, files: Record<string, string>) {
  switch (v.type) {
    case "array-memory":
      return <ArrayMemoryViz presets={v.presets} />;
    case "traversal":
      return <TraversalViz modes={v.modes} rows={v.rows} cols={v.cols} />;
    case "matrix-algo":
      return <MatrixAlgoViz algorithms={v.algorithms} />;
    case "image-lab":
      return <ImageLab ticket={ticket} files={files} />;
    case "concept":
      return <ConceptViz concept={v.concept} />;
    case "filter-lab":
      return <FilterLab key={ticket.id} ticket={ticket} files={files} filter={v.filter} />;
  }
}

export function VizPanel({ ticket, index, onIndex, files }: { ticket: Ticket; index: number; onIndex: (i: number) => void; files: Record<string, string> }) {
  const list = ticket.visualizations;
  const v = list[Math.min(index, list.length - 1)];
  return (
    <div>
      <div className="viz-tabs" role="tablist" aria-label="Visualizations">
        <span aria-hidden>🔬</span>
        {list.map((x, i) => (
          <button key={i} role="tab" aria-selected={i === index} className={`btn small${i === index ? " primary" : " ghost"}`} onClick={() => onIndex(i)}>
            {x.title ?? x.type}
          </button>
        ))}
      </div>
      <div className="viz">{v ? renderViz(v, ticket, files) : <p className="muted">This ticket has no visualization.</p>}</div>
    </div>
  );
}
