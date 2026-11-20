import type { Sprint } from "../../types";
import { tickets } from "./tickets";
import { tickets as backlogTickets } from "./tickets-backlog";

export const sprint2dArrays: Sprint = {
  id: "2d-arrays",
  number: 1,
  topic: "2D Arrays",
  unit: "AP CSA Unit 9",
  status: "current",
  project: {
    name: "Mini Photoshop",
    company: "PixelForge Studio",
    tagline: "在瀏覽器裡打造一個影像編輯器，從 2D 陣列開始。",
    description:
      "這個 Sprint 你加入 PixelForge Studio，團隊正在開發一個網頁版 Mini Photoshop，每一張影像在程式裡都是 int[][]。完成 ticket、通過測試、merge 你的程式碼，一步步把產品做出來。",
    techLead: { name: "Mei", role: "Tech Lead", avatar: "👩‍💻" },
  },
  tickets: [...tickets, ...backlogTickets],
  backlog: [],
};
