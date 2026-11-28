import type { Sprint } from "../../types";
import { knowledge } from "./knowledge";
import { tickets } from "./tickets";

export const sprintInheritance: Sprint = {
  id: "inheritance",
  number: 2,
  topic: "Classes & Inheritance",
  unit: "Runestone CSJava Unit 10, with a review of class design (private, getters/setters, static, overloading)",
  status: "current",
  project: {
    name: "Pixel Arena",
    company: "QuestForge Games",
    tagline: "A turn-based 8-bit battle game where every button runs the Java you just wrote.",
    description:
      "QuestForge Games is building Pixel Arena, a small turn-based RPG. You start with a Hero class that can't even remember its own name, and finish with a party of warriors, mages and archmages fighting a training dummy. The game on the right runs your code: write a method and its button appears.",
    techLead: { name: "Kai", role: "Game Lead", avatar: "🕹️" },
  },
  // Board order: class design first (QF-201..207), then inheritance (QF-208..214, textbook 10.1–10.7).
  tickets,
  knowledge,
};
