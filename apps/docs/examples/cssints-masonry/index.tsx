import { reset } from "@cssints/reset" with { type: "cssints" };
import { borderRadius, cn, color, flex, fontWeight, p } from "cssints" with { type: "cssints" };
import { masonry } from "@cssints/masonry" with { type: "cssints" };

reset();

// masonry() is CSS grid-lanes where the browser has it and a small runtime where it does not. Tiles of different heights pack
// into columns of the given width.
const wall = cn(masonry().columns("9rem").gap(3), p(4));
const tile = cn(
  borderRadius("10px"),
  color("white"),
  fontWeight(700),
  p(3),
  flex().alignItems("flex-end"),
);

const tiles = [
  ["#2563eb", 6],
  ["#db2777", 10],
  ["#16a34a", 8],
  ["#d97706", 5],
  ["#7c3aed", 12],
  ["#0891b2", 7],
  ["#dc2626", 9],
] as const;

export default function App() {
  return (
    <div className={wall}>
      {tiles.map(([colour, height], n) => (
        <div className={tile} style={{ height: `${height}rem`, "background-color": colour }}>
          {n + 1}
        </div>
      ))}
    </div>
  );
}
