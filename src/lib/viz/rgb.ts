/** Color image helpers for the filter lab (display / I/O only, never to compute filter results). */
import { grid, type Gray } from "./image";

export type Rgb = { red: Gray; green: Gray; blue: Gray };

function rgbGrid(rows: number, cols: number, f: (r: number, c: number) => [number, number, number]): Rgb {
  const cells = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => f(r, c)));
  const ch = (k: 0 | 1 | 2) => grid(rows, cols, (r, c) => Math.round(cells[r][c][k]));
  return { red: ch(0), green: ch(1), blue: ch(2) };
}

export const RGB_SAMPLES: Record<string, { label: string; make: () => Rgb }> = {
  stripes: {
    label: "Color bars",
    make: () => {
      const bars: [number, number, number][] = [[255, 255, 255], [255, 255, 0], [0, 255, 255], [0, 255, 0], [255, 0, 255], [255, 0, 0], [0, 0, 255], [0, 0, 0]];
      return rgbGrid(20, 32, (_, c) => bars[Math.floor(c / 4)]);
    },
  },
  sunset: {
    label: "Sunset",
    make: () => rgbGrid(24, 32, (r, c) => {
      const sun = Math.hypot(r - 15, c - 16) < 5;
      if (r > 17) return [20, 40 + r * 3, 90 + r * 4];
      if (sun) return [255, 220, 80];
      return [250 - r * 4, 120 + r * 3 - c, 60 + r * 5];
    }),
  },
  fruit: {
    label: "Fruit",
    make: () => rgbGrid(28, 28, (r, c) => {
      if (Math.hypot(r - 16, c - 9) < 7) return [220, 30, 40];
      if (Math.hypot(r - 16, c - 20) < 6) return [250, 160, 20];
      if (Math.hypot(r - 6, c - 14) < 4) return [60, 180, 60];
      return [235, 230, 215];
    }),
  },
};

export function drawRgb(canvas: HTMLCanvasElement, img: Rgb, scale: number) {
  const rows = img.red.length, cols = img.red[0]?.length ?? 0;
  canvas.width = cols * scale;
  canvas.height = rows * scale;
  const ctx = canvas.getContext("2d")!;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = `rgb(${img.red[r][c]},${img.green[r][c]},${img.blue[r][c]})`;
      ctx.fillRect(c * scale, r * scale, scale, scale);
    }
  }
}

/** Loads a user image file as three channels, downsized to fit maxSide. */
export async function fileToRgb(file: File, maxSide = 40): Promise<Rgb> {
  const url = URL.createObjectURL(file);
  try {
    const im = new Image();
    await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = url; });
    const k = Math.min(1, maxSide / Math.max(im.width, im.height));
    const w = Math.max(1, Math.round(im.width * k)), h = Math.max(1, Math.round(im.height * k));
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d")!;
    ctx.drawImage(im, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    return rgbGrid(h, w, (r, c) => {
      const i = (r * w + c) * 4;
      return [d[i], d[i + 1], d[i + 2]];
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Parses every @@IMG_BEGIN … @@IMG_END block printed by tutor.Img.write, in order. */
export function parseAllImgOutputs(stdout: string): (Gray | null)[] {
  const out: (Gray | null)[] = [];
  for (const m of stdout.matchAll(/@@IMG_BEGIN\n([\s\S]*?)\n?@@IMG_END/g)) {
    const lines = m[1].trim().split("\n");
    if (lines[0].trim() === "null" || lines.slice(1).some((l) => l.trim() === "null")) {
      out.push(null);
      continue;
    }
    out.push(lines.slice(1).map((l) => (l.trim() === "" ? [] : l.trim().split(" ").map(Number))));
  }
  return out;
}
