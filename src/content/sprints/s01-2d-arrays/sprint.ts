import type { Sprint, Ticket } from "../../types";
import { knowledge } from "./knowledge";
import { tickets } from "./tickets";
import { tickets as filterTickets } from "./tickets-filters";
import { tickets as classicTickets } from "./tickets-classics";

/** Puts tickets in the given order; fails the build if an id is missing or left out. */
function byId(all: Ticket[], order: string[]): Ticket[] {
  const out = order.map((id) => {
    const t = all.find((x) => x.id === id);
    if (!t) throw new Error(`Unknown ticket ${id}`);
    return t;
  });
  if (out.length !== all.length) throw new Error("Every ticket must be listed in the sprint order");
  return out;
}

export const sprint2dArrays: Sprint = {
  id: "2d-arrays",
  number: 1,
  topic: "2D Arrays",
  unit: "AP CSA Unit 9",
  status: "current",
  project: {
    name: "Mini Photoshop",
    company: "PixelForge Studio",
    tagline: "Build an image editor in the browser, starting with 2D arrays.",
    description:
      "This sprint you join PixelForge Studio. The team is building a web-based Mini Photoshop, and every image in the code is an int[][]. Finish tickets, pass the tests, and merge your code to build the product step by step.",
    techLead: { name: "Mei", role: "Tech Lead", avatar: "👩‍💻" },
  },
  // Board order = difficulty ramp. Tickets with issuedByDefault: false (duplicates and extras) go last.
  tickets: byId([...tickets, ...filterTickets, ...classicTickets], [
    "PF-101", "PF-102", "PF-103", "PF-104", "PF-202", "PF-203", "PF-209", "PF-206", "PF-208",
    "PF-105", "PF-201", "PF-204", "PF-205", "PF-207",
  ]),
  knowledge,
};
