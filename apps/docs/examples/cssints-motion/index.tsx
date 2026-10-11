import { reset } from "@cssints/reset" with { type: "cssints" };
import { bg, borderRadius, cn, color, flex, hover, p } from "cssints" with { type: "cssints" };
import { motion } from "@cssints/motion" with { type: "cssints" };

reset();

// motion() names a preset (a keyframes with its defaults); the methods change the duration, the delay and the easing. The
// keyframes are written once however many elements use them.
const toast = cn(
  motion().preset("slide-in-up").duration("500ms").delay("100ms").easing("ease-out"),
  p(3),
  bg("#0f172a"),
  color("white"),
  borderRadius("10px"),
);
const leaving = cn(
  motion().preset("fade-out").duration("2s"),
  p(3),
  bg("#fecaca"),
  color("#0f172a"),
  borderRadius("10px"),
);
const tile = cn(
  motion().preset("scale-in"),
  hover(motion().duration("1s")),
  p(3),
  bg("#bfdbfe"),
  color("#0f172a"),
  borderRadius("10px"),
);

export default function App() {
  return (
    <div className={cn(flex().direction("column").gap(3), p(4))}>
      <div className={toast}>Saved: slides in from below</div>
      <div className={leaving}>Removed: fades out</div>
      <div className={tile}>Hover: the same animation, slower</div>
    </div>
  );
}
