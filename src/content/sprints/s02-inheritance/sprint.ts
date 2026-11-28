import type { Sprint } from "../../types";
import { knowledge } from "./knowledge";
import { tickets } from "./tickets";

export const sprintInheritance: Sprint = {
  id: "inheritance",
  number: 2,
  topic: "Inheritance",
  unit: "Runestone CSJava Unit 10 (enrichment: not on the 2025–26 AP CSA exam)",
  status: "current",
  project: {
    name: "Filter Plugin System",
    company: "PixelForge Studio",
    tagline: "Turn every Mini Photoshop filter into an object, so new filters plug in without touching the editor.",
    description:
      "Back at PixelForge Studio. The editor's filters are a pile of static methods, and every new filter means editing the editor. This sprint you turn filters into objects that share one superclass, so one list can hold any filter in the order the user chooses.",
    techLead: { name: "Mei", role: "Tech Lead", avatar: "👩‍💻" },
  },
  // Board order: two bridge tickets (types, fields and methods), then inheritance.
  tickets,
  knowledge,
};
