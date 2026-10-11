import { reset } from "@cssints/reset" with { type: "cssints" };
import {
  bg,
  cn,
  color,
  flex,
  fontSize,
  height,
  hover,
  p,
  width,
} from "cssints" with { type: "cssints" };
import { squircle } from "@cssints/squircle" with { type: "cssints" };

reset();

// squircle() rounds a corner with a superellipse, as app icons are: corner-shape where the browser has it, a clip-path where it
// does not. The radius is a length; a condition can change it.
const icon = cn(
  squircle().radius("24px"),
  bg("tomato"),
  color("white"),
  width("6rem"),
  height("6rem"),
  fontSize("2rem"),
);
const card = cn(squircle(), hover(squircle().radius("2rem")), bg("#e0e7ff"), p(6));
const center = flex().alignItems("center").justifyContent("center");

export default function App() {
  return (
    <div className={cn(flex().gap(4), p(4))}>
      <div className={cn(icon, center)}>★</div>
      <div className={card}>Hover me: the radius grows</div>
    </div>
  );
}
