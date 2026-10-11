import {
  bg,
  border,
  borderRadius,
  cn,
  color,
  flex,
  p,
  transition,
} from "cssints" with { type: "cssints" };

import { op, rx } from "./tokens.ts" with { type: "cssints" };

const card = cn(
  flex().direction("column").gap(op.size._3),
  p(4),
  bg(rx.radix.gray._2),
  color(rx.radix.gray._12),
  borderRadius(op.radius._3),
  border("1px", "solid", rx.radix.gray._6),
);
const action = cn(
  p(2),
  bg(rx.radix.blue._9),
  color("white"),
  borderRadius(op.radius._2),
  border("0", "none"),
  transition("transform", "200ms", op.ease._3),
);

export default function App() {
  return (
    <div className={cn(p(4), bg(op.gray._1))}>
      <div className={card}>
        <strong className={color(op.blue._7)}>Open Props and Radix</strong>
        <span>Spacing, radius and easing from Open Props; greys and blue from Radix.</span>
        <button className={action}>Continue</button>
      </div>
    </div>
  );
}
