import { reset } from "@cssints/reset" with { type: "cssints" };
import * as css from "cssints" with { type: "cssints" };

import { t } from "./tokens.ts" with { type: "cssints" };

reset();

// Every CSS function is a call that takes parts and checks them against the function's grammar: a token is a part, and a length
// cannot be multiplied by a length or added to a time (the build says so).
const hero = css.cn(
  css.flex().direction("column").justifyContent("flex-end").gap(t.space.sm),
  css.minHeight("14rem"),
  css.padding(css.clamp(t.space.md, "4vw", "2rem")),
  css.maxWidth(css.min("48rem", "100%")),
  css.color(css.lightDark("white", t.color.bg)),
  css.backgroundImage(
    css.linearGradient(
      "to top right",
      [css.colorMix("in oklab", t.color.accent, "black 40%"), "10%"],
      t.color.accent,
    ),
  ),
  css.borderRadius(css.calc(t.space.md, "*", 2)),
);
const button = css.cn(
  css.alignSelf("flex-start"),
  css.padding(t.space.sm, css.calc(t.space.md, "*", 1.5)),
  css.border("0", "none"),
  css.borderRadius("999px"),
  css.bg(css.oklch(0.98, 0.02, 259)),
  css.color(t.color.ink),
  css.transition("transform", t.time.fast, css.cubicBezier(0.2, 0.8, 0.2, 1)),
  css.hover(css.transform(css.translateY("-2px"))),
);

export default function App() {
  return (
    <div className={css.p(4)}>
      <section className={hero}>
        <h1 className={css.margin("0")}>calc, clamp, min, colorMix, linearGradient…</h1>
        <button className={button}>Get started</button>
      </section>
    </div>
  );
}
