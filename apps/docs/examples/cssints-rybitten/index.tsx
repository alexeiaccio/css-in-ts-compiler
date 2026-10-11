import { bg, check, cn, color, flex, p } from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts" with { type: "cssints" };

check.contrast(t.paper._3, t.paper._1, { min: 12 }); // the ink on the paper, light and dark

const page = cn(bg(t.paper._1), color(t.paper._3), p(4), flex().direction("column").gap(3));
const wheel = flex().wrap("wrap").gap(2);
const dots = [
  cn(bg(t.hue._1), p(5)),
  cn(bg(t.hue._2), p(5)),
  cn(bg(t.hue._3), p(5)),
  cn(bg(t.hue._4), p(5)),
  cn(bg(t.hue._5), p(5)),
  cn(bg(t.hue._6), p(5)),
  cn(bg(t.hue._7), p(5)),
  cn(bg(t.hue._8), p(5)),
  cn(bg(t.hue._9), p(5)),
  cn(bg(t.hue._10), p(5)),
  cn(bg(t.hue._11), p(5)),
  cn(bg(t.hue._12), p(5)),
];

export default function App() {
  return (
    <div className={page}>
      <p>
        The wheel has red, yellow and blue as primaries; the paper and the ink swap in the dark.
      </p>
      <div className={wheel}>
        {dots.map((c, n) => (
          <div className={c} title={`hue ${n + 1}`} />
        ))}
      </div>
    </div>
  );
}
