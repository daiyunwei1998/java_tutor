"use client";

import type { ConceptId } from "@/content/types";
import { BlurConcept } from "./BlurConcept";
import { FlipConcept } from "./FlipConcept";
import { GrayscaleConcept } from "./GrayscaleConcept";
import { LoopBoundsConcept } from "./LoopBoundsConcept";
import { PipelineConcept } from "./PipelineConcept";
import { SobelConcept } from "./SobelConcept";

/** Concept explanations referenced from ticket content by id. */
export function ConceptViz({ concept }: { concept: ConceptId }) {
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
  }
}
