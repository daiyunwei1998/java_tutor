import type { Sprint } from "../../types";
import { knowledge } from "./knowledge";
import { tickets } from "./tickets";

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
  tickets,
  knowledge,
  backlog: [
    { title: "PF-201 Grayscale", note: "RGB → grayscale" },
    { title: "PF-202 Horizontal flip", note: "Reverse every row" },
    { title: "PF-203 Box blur", note: "3×3 convolution" },
    { title: "PF-204 Edge detection (Sobel)", note: "Gx, Gy and gradient magnitude" },
    { title: "PF-205 Filter pipeline", note: "Bonus: chain several filters" },
  ],
};
