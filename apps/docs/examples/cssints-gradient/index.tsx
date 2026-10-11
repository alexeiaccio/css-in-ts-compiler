import { reset } from "@cssints/reset" with { type: "cssints" };
import {
  backgroundImage,
  bg,
  cn,
  color,
  flex,
  fontSize,
  minHeight,
  p,
} from "cssints" with { type: "cssints" };
import { gradient } from "@cssints/gradient" with { type: "cssints" };

reset();

// gradient(kind, direction, from, to, easing, stops) writes the stops of an eased gradient: no band where a plain two-colour
// gradient ends in a hard edge.
const hero = cn(
  flex().direction("column").justifyContent("flex-end"),
  minHeight("18rem"),
  p(6),
  color("white"),
  bg("#1e3a8a"),
  backgroundImage(gradient("linear", "to bottom", "transparent", "#020617", "ease-in-out", 6)),
);
const glow = cn(
  minHeight("8rem"),
  backgroundImage(
    gradient("radial", "circle at top", "#f472b6", "#1e1b4b", "cubic-bezier(0.5, 0, 0.5, 1)", 5),
  ),
);

export default function App() {
  return (
    <div className={cn(flex().direction("column").gap(3), p(4))}>
      <section className={hero}>
        <h1 className={cn(fontSize("2rem"))}>Eased overlay</h1>
      </section>
      <section className={glow} />
    </div>
  );
}
