import { spriteFor } from "@/lib/game/sprites";

/** An 8-bit character drawn as SVG pixels. */
export function Sprite({ chain, size = 4, flip = false, hurt = false }: { chain: string[]; size?: number; flip?: boolean; hurt?: boolean }) {
  const s = spriteFor(chain);
  const h = s.rows.length, w = s.rows[0].length;
  return (
    <svg width={w * size} height={h * size} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden style={{ transform: flip ? "scaleX(-1)" : undefined, opacity: hurt ? 0.45 : 1 }}>
      {s.rows.flatMap((row, y) =>
        [...row].map((ch, x) => (ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={s.palette[ch] ?? "#f0f"} />)),
      )}
    </svg>
  );
}
