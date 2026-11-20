import type { Sprint } from "../../types";
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
    tagline: "在瀏覽器裡打造一個影像編輯器，從 2D 陣列開始。",
    description:
      "這個 Sprint 你加入 PixelForge Studio，團隊正在開發一個網頁版 Mini Photoshop，每一張影像在程式裡都是 int[][]。完成 ticket、通過測試、merge 你的程式碼，一步步把產品做出來。",
    techLead: { name: "Mei", role: "Tech Lead", avatar: "👩‍💻" },
  },
  tickets,
  backlog: [
    { title: "PF-201 灰階轉換 (Grayscale)", note: "RGB → 灰階" },
    { title: "PF-202 水平翻轉 (Flip)", note: "反轉每一列" },
    { title: "PF-203 模糊濾鏡 (Box Blur)", note: "3×3 convolution" },
    { title: "PF-204 邊緣偵測 (Sobel)", note: "Gx、Gy 與梯度大小" },
    { title: "PF-205 濾鏡管線 (Pipeline)", note: "Bonus：串接多個濾鏡" },
  ],
};
