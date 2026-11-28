/**
 * Original 8-bit sprites for Pixel Arena, 12 × 14 pixels. Each row is a string; each character is a colour
 * from the sprite's palette ("." = transparent). Drawn as SVG rects by components/game/Sprite.tsx.
 */
export type SpriteDef = { rows: string[]; palette: Record<string, string> };

const base: Record<string, string> = {
  k: "#2b2a28", // outline
  s: "#f1c79d", // skin
  b: "#7a4a24", // hair
  d: "#3b3d5c", // trousers
  w: "#d4dadf", // steel
  y: "#d9a54a", // gold / wood
  e: "#2b2a28", // eyes
};

export const SPRITES: Record<string, SpriteDef> = {
  hero: {
    palette: { ...base, c: "#3d6b8a" },
    rows: [
      "....kkkk....",
      "...kbbbbk...",
      "..kbbbbbbk..",
      "..kssssssk..",
      "..ksessesk..",
      "..kssssssk..",
      "...kssssk...",
      "..kcccccck..",
      ".kcccyycccck",
      ".kscccccccsk",
      "..kcccccck..",
      "..kddkkddk..",
      "..kddk.kddk.",
      "..kkk...kkk.",
    ],
  },
  warrior: {
    palette: { ...base, c: "#a84a3f" },
    rows: [
      "....kkkk...w",
      "...kwwwwk.kw",
      "..kwwwwwwkkw",
      "..kssssssk.w",
      "..ksessesk.w",
      "..kssssssk.w",
      "...kssssk.ky",
      "..kccccccky.",
      ".kccwccccck.",
      ".kscccccccsk",
      "..kccccccck.",
      "..kddkkddk..",
      "..kddk.kddk.",
      "..kkk...kkk.",
    ],
  },
  mage: {
    palette: { ...base, c: "#6b4f9c", p: "#6b4f9c" },
    rows: [
      ".....kk.....",
      "....kppk...y",
      "...kppppk..y",
      "..kppppppk.y",
      ".kkkkkkkkkky",
      "..ksessesk.y",
      "...kssssk..y",
      "..kcccccckky",
      ".kccccyccck.",
      ".kscccccccsk",
      ".kcccccccck.",
      ".kcccccccck.",
      "..kcccccck..",
      "..kkkkkkkk..",
    ],
  },
  healer: {
    palette: { ...base, c: "#ece6d8", g: "#3f7a4f" },
    rows: [
      "....kkkk....",
      "...kccccck..",
      "..kccccccck.",
      "..kcssssck..",
      "..kseesesk..",
      "..kcssssck..",
      "...kccccck..",
      "..kccggcccck",
      ".kcggggggcck",
      ".kscccgcccsk",
      "..kcccgccck.",
      "..kcccccck..",
      "..kcccccck..",
      "..kkkkkkkk..",
    ],
  },
  archer: {
    palette: { ...base, c: "#3f7a4f", g: "#2f5c3b" },
    rows: [
      "....kkkk..y.",
      "...kggggk.ky",
      "..kggggggk.y",
      "..kgssssgk.y",
      "..ksessesk.y",
      "..kssssssk.y",
      "...kssssk..y",
      "..kcccccckky",
      ".kcccbcccck.",
      ".kscccccccsk",
      "..kcccccck..",
      "..kddkkddk..",
      "..kddk.kddk.",
      "..kkk...kkk.",
    ],
  },
  weapon: {
    palette: { ...base, s: "#d8dee6", h: "#ffffff", b: "#8a5a2b" },
    rows: [
      "..........k.",
      ".........ksk",
      "........kshk",
      ".......kshk.",
      "......kshk..",
      ".....kshk...",
      "..k.kshk....",
      "..kkshk.....",
      "...kyk......",
      "..kbkyk.....",
      ".kbk.kk.....",
      "kbk.........",
      "kk..........",
      "............",
    ],
  },
  party: {
    palette: { ...base, f: "#3f6fc9", h: "#8fb0f0", p: "#8a5a2b" },
    rows: [
      ".kk.........",
      ".kpkkkkkkkk.",
      ".kpffffffffk",
      ".kpfhfffyffk",
      ".kpffffyyyfk",
      ".kpfhffffyfk",
      ".kpffffffffk",
      ".kpkkkkkkkk.",
      ".kpk........",
      ".kpk........",
      ".kpk........",
      ".kpk........",
      "kkkkk.......",
      "............",
    ],
  },
  potion: {
    palette: { ...base, r: "#c94a3f", h: "#f3b0a8", g: "#cfe0e6" },
    rows: [
      "............",
      "....kkkk....",
      "....kyyk....",
      ".....kk.....",
      "....kggk....",
      "...kggggk...",
      "..kgrrrrgk..",
      ".kgrhrrrrgk.",
      ".kgrrrrrrgk.",
      ".kgrrrrrrgk.",
      ".kgrrrrrrgk.",
      "..kgrrrrgk..",
      "...kkkkkk...",
      "............",
    ],
  },
  unknown: {
    palette: { ...base, c: "#8a8a8a" },
    rows: [
      "....kkkk....",
      "...kccccck..",
      "..kcccccccck",
      "..kckkkkkck.",
      "..kcccckcck.",
      "..kccckccck.",
      "...kcckcck..",
      "...kccccck..",
      "...kcckcck..",
      "....kkkkk...",
      "............",
      "............",
      "............",
      "............",
    ],
  },
};

/** Picks a sprite from an object's class chain (Mage extends Hero → mage). */
export function spriteFor(chain: string[]): SpriteDef {
  for (const c of chain) {
    const k = c.toLowerCase();
    if (SPRITES[k]) return SPRITES[k];
    if (k.includes("potion") || k.includes("item")) return SPRITES.potion;
  }
  return SPRITES.unknown;
}
