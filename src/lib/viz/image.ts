/** Grayscale image helpers for the Mini Photoshop preview. Only used for display / I/O — never to compute filter results. */
export type Gray = number[][];

export const SAMPLES: Record<string, { label: string; make: () => Gray }> = {
  gradient: { label: "Gradient", make: () => grid(24, 32, (r, c) => Math.round((c / 31) * 230 + (r / 23) * 20)) },
  circle: {
    label: "Circle",
    make: () => grid(28, 28, (r, c) => {
      const d = Math.hypot(r - 13.5, c - 13.5);
      return d < 9 ? 220 : d < 11 ? 140 : 40;
    }),
  },
  checker: { label: "Checkerboard", make: () => grid(24, 24, (r, c) => ((Math.floor(r / 4) + Math.floor(c / 4)) % 2 ? 210 : 60)) },
  smiley: {
    label: "Smiley",
    make: () => grid(28, 28, (r, c) => {
      const d = Math.hypot(r - 13.5, c - 13.5);
      if (d > 12.5) return 30;
      if (Math.hypot(r - 10, c - 9) < 2 || Math.hypot(r - 10, c - 18) < 2) return 20;
      if (r > 16 && r < 19 && Math.abs(Math.hypot(r - 12, c - 13.5) - 6) < 1.2) return 20;
      return 200;
    }),
  },
};

export function grid(rows: number, cols: number, f: (r: number, c: number) => number): Gray {
  return Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => Math.max(0, Math.min(255, f(r, c)))));
}

export function toText(img: Gray): string {
  return `${img.length} ${img[0]?.length ?? 0}\n` + img.map((row) => row.join(" ")).join("\n") + "\n";
}

/** Parses the @@IMG_BEGIN … @@IMG_END block printed by tutor.Img.write. */
export function parseImgOutput(stdout: string): { img: Gray | null; error?: string } {
  const m = stdout.match(/@@IMG_BEGIN\n([\s\S]*?)\n?@@IMG_END/);
  if (!m) return { img: null, error: "No output image found." };
  const lines = m[1].trim().split("\n");
  if (lines[0].trim() === "null") return { img: null, error: "Your method returned null." };
  const img: Gray = [];
  for (const line of lines.slice(1)) {
    if (line.trim() === "null") return { img: null, error: "A row in the returned image is null." };
    img.push(line.trim() === "" ? [] : line.trim().split(" ").map(Number));
  }
  return { img };
}

export function validate(input: Gray, out: Gray): string[] {
  const issues: string[] = [];
  if (out.length !== input.length) issues.push(`Wrong height: expected ${input.length} rows, got ${out.length}.`);
  out.forEach((row, r) => {
    if (input[r] && row.length !== input[r].length) issues.push(`Row ${r} has the wrong length: expected ${input[r].length}, got ${row.length}.`);
  });
  let bad = 0, example = "";
  out.forEach((row, r) => row.forEach((v, c) => {
    if (v < 0 || v > 255) {
      bad++;
      if (!example) example = `(${r}, ${c}) = ${v}`;
    }
  }));
  if (bad) issues.push(`${bad} pixels are outside 0–255, e.g. ${example}. They get cut off when shown, so remember to clamp!`);
  return issues.slice(0, 4);
}

export function drawGray(canvas: HTMLCanvasElement, img: Gray, scale: number, highlight?: { r: number; c: number } | null) {
  const rows = img.length, cols = Math.max(0, ...img.map((r) => r.length));
  canvas.width = cols * scale;
  canvas.height = rows * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  img.forEach((row, r) => row.forEach((v, c) => {
    const g = Math.max(0, Math.min(255, Math.round(v)));
    ctx.fillStyle = `rgb(${g},${g},${g})`;
    ctx.fillRect(c * scale, r * scale, scale, scale);
  }));
  if (highlight) {
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.strokeRect(highlight.c * scale + 1, highlight.r * scale + 1, scale - 2, scale - 2);
  }
}

/** Loads a user image file, downsizes to fit maxSide, converts to grayscale (luma 0.299/0.587/0.114). */
export async function fileToGray(file: File, maxSide = 40): Promise<Gray> {
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
    return grid(h, w, (r, c) => {
      const i = (r * w + c) * 4;
      return Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
