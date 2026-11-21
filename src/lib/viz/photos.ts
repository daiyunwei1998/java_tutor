/** Real sample photos (public/images/samples, CC0) loaded as channel arrays for the concept visualizations. */
import type { Gray } from "./image";
import type { Rgb } from "./rgb";

export const PHOTOS = {
  coffee: { label: "Coffee photo", src: "/images/samples/coffee.png" },
  cat: { label: "Cat photo", src: "/images/samples/cat.png" },
  camera: { label: "Camera photo", src: "/images/samples/camera.png" },
} as const;
export type PhotoId = keyof typeof PHOTOS;

const cache = new Map<string, Promise<Rgb>>();

/** Loads an image URL into three channels, downsized so the longer side is at most maxSide. */
export function loadRgb(src: string, maxSide = 120): Promise<Rgb> {
  const key = `${src}@${maxSide}`;
  if (!cache.has(key)) {
    cache.set(key, new Promise<Rgb>((resolve, reject) => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, maxSide / Math.max(im.width, im.height));
        const w = Math.max(1, Math.round(im.width * k)), h = Math.max(1, Math.round(im.height * k));
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const ctx = cv.getContext("2d")!;
        ctx.drawImage(im, 0, 0, w, h);
        const d = ctx.getImageData(0, 0, w, h).data;
        const ch = (o: number): Gray => Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => d[(r * w + c) * 4 + o]));
        resolve({ red: ch(0), green: ch(1), blue: ch(2) });
      };
      im.onerror = () => { cache.delete(key); reject(new Error("Could not load " + src)); };
      im.src = src;
    }));
  }
  return cache.get(key)!;
}

export function lumaOf(img: Rgb): Gray {
  return img.red.map((row, r) => row.map((v, c) => Math.floor((299 * v + 587 * img.green[r][c] + 114 * img.blue[r][c]) / 1000)));
}

export async function loadGray(id: PhotoId, maxSide = 96): Promise<Gray> {
  return lumaOf(await loadRgb(PHOTOS[id].src, maxSide));
}

/** Same arithmetic the students write, used only to illustrate concepts (never to grade). */
export function boxBlurJs(img: Gray): Gray {
  return img.map((row, r) => row.map((_, c) => {
    let s = 0, n = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const v = img[r + dr]?.[c + dc];
      if (v !== undefined) { s += v; n++; }
    }
    return Math.floor(s / n);
  }));
}

export const GX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
export const GY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

export function kernelAt(img: Gray, r: number, c: number, k: number[][]): number {
  let s = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += k[i][j] * img[r - 1 + i][c - 1 + j];
  return s;
}

export function magnitude(gx: number, gy: number): number {
  return Math.min(255, Math.round(Math.sqrt(gx * gx + gy * gy)));
}

/** which = "both" gives the Sobel magnitude; "gx"/"gy" give |gx| or |gy| clamped, to show what each kernel finds. */
export function sobelJs(img: Gray, which: "both" | "gx" | "gy" = "both"): Gray {
  const R = img.length, C = img[0]?.length ?? 0;
  return img.map((row, r) => row.map((_, c) => {
    if (r === 0 || c === 0 || r === R - 1 || c === C - 1) return 0;
    const gx = kernelAt(img, r, c, GX), gy = kernelAt(img, r, c, GY);
    return which === "both" ? magnitude(gx, gy) : Math.min(255, Math.abs(which === "gx" ? gx : gy));
  }));
}
