"use client";

import type { ConceptId } from "@/content/types";
import { BlurConcept } from "./BlurConcept";
import { FlipConcept } from "./FlipConcept";
import { GrayscaleConcept } from "./GrayscaleConcept";
import { LifeConcept } from "./LifeConcept";
import { LoopBoundsConcept } from "./LoopBoundsConcept";
import { PascalConcept } from "./PascalConcept";
import { PipelineConcept } from "./PipelineConcept";
import { SobelConcept } from "./SobelConcept";
import { SpiralConcept } from "./SpiralConcept";

/** Concept explanations referenced from ticket content by id. */
export function ConceptViz({ concept, start }: { concept: ConceptId; start?: string }) {
  switch (concept) {
    case "rgb-grayscale":
      return <GrayscaleConcept />;
    case "flip-mapping":
      return <FlipConcept />;
    case "box-blur":
      return <BlurConcept />;
    case "sobel":
      return <SobelConcept />;
    case "pipeline-frames":
      return <PipelineConcept />;
    case "loop-bounds":
      return <LoopBoundsConcept />;
    case "life-neighbors":
      return <LifeConcept start={start} />;
    case "spiral-bounds":
      return <SpiralConcept start={start} />;
    case "pascal-triangle":
      return <PascalConcept start={start} />;
  }
}
