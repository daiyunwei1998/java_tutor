import type { Project } from "../types";
import { sprint1Tickets } from "./tickets-sprint1";

export const pixelforge: Project = {
  id: "mini-photoshop",
  title: "Mini Photoshop",
  company: "PixelForge Studio",
  tagline: "在瀏覽器裡打造一個影像編輯器，從 2D 陣列開始。",
  description:
    "你是 PixelForge Studio 新進的 Junior Developer。團隊正在開發一個網頁版 Mini Photoshop，每一張影像在程式裡都是 int[][]。完成 ticket、通過測試、merge 你的程式碼，一步步把產品做出來。",
  course: "Java · AP CSA",
  unit: "Unit 9 — 2D Arrays",
  techLead: { name: "Mei", role: "Tech Lead", avatar: "👩‍💻" },
  tickets: sprint1Tickets,
  upcoming: [
    { title: "PF-201 灰階轉換 (Grayscale)", note: "Sprint 2：RGB → 灰階" },
    { title: "PF-202 水平翻轉 (Flip)", note: "Sprint 2：反轉每一列" },
    { title: "PF-203 模糊濾鏡 (Box Blur)", note: "Sprint 2：3×3 convolution" },
    { title: "PF-204 邊緣偵測 (Sobel)", note: "Sprint 2：Gx、Gy 與梯度大小" },
    { title: "PF-205 濾鏡管線 (Pipeline)", note: "Bonus：串接多個濾鏡" },
  ],
};
