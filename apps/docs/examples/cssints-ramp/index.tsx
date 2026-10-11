import { reset } from "@cssints/reset" with { type: "cssints" };
import { bg, check, cn, color, flex, fontSize, p } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts" with { type: "cssints" };

reset();

// The steps hold their ratios in light and in dark: the build checks the two that carry text.
check.contrast(t.blue._3, t.bg, { min: 3 }); // borders, large text
check.contrast(t.blue._4, t.bg, { min: 4.5 }); // body text

const page = cn(bg(t.bg), p(4), flex().direction("column").gap(3));
const text = cn(color(t.blue._4), fontSize("1.125rem"));
const steps = flex().gap(2);
const swatches = [
  cn(bg(t.blue._1), p(4), color("#0f172a")),
  cn(bg(t.blue._2), p(4), color("#0f172a")),
  cn(bg(t.blue._3), p(4), color("#0f172a")),
  cn(bg(t.blue._4), p(4), color("white")),
  cn(bg(t.blue._5), p(4), color("white")),
];

export default function App() {
  return (
    <div className={page}>
      <p className={text}>Body text on step 4: 4.5 to 1 against the page, in light and in dark.</p>
      <div className={steps}>
        {swatches.map((c, n) => (
          <div className={c}>{n + 1}</div>
        ))}
      </div>
    </div>
  );
}
