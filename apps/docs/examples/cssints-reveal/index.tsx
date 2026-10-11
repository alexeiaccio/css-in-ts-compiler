import { bg, borderRadius, cn, flex, hover, p } from "cssints" with { type: "cssints" };
import { reveal } from "@cssints/reveal" with { type: "cssints" };

// reveal() animates an element as it scrolls into view (scroll-driven animations, with a small runtime where a target lacks
// them). A preset names the effect; range says which part of the scroll it plays over.
const fade = cn(reveal(), p(6), bg("#e0e7ff"), borderRadius("12px"));
const card = cn(
  reveal().preset("slide-in-up").range("entry 0% entry 100%").duration("500ms").easing("linear"),
  p(6),
  bg("#dbeafe"),
  borderRadius("12px"),
);
const tile = cn(
  reveal().preset("blur-in"),
  hover(reveal().duration("1s")),
  p(6),
  bg("#fce7f3"),
  borderRadius("12px"),
);

export default function App() {
  return (
    <div className={cn(flex().direction("column").gap(10), p(4))}>
      <div style={{ height: "40vh" }}>Scroll down</div>
      <div className={fade}>fade</div>
      <div className={card}>slide-in-up</div>
      <div className={tile}>blur-in</div>
      <div style={{ height: "30vh" }} />
    </div>
  );
}
