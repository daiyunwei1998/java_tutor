import type { Sprint } from "../../types";
import { knowledge } from "./knowledge";
import { tickets } from "./tickets";
import { tickets as filterTickets } from "./tickets-filters";

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
  tickets: [...tickets, ...filterTickets],
  knowledge,
};
