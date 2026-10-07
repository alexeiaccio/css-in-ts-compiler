import { useState } from "react";
import { cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import {
  CSS,
  CSSColorValue,
  active,
  animation,
  bg,
  cn,
  color,
  container,
  cv,
  disabled,
  flex,
  focusVisible,
  grid,
  hover,
  m,
  media,
  p,
  pt,
  supports,
  token,
} from "cssints" with { type: "cssints" };

import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

import { pulse, stack } from "../helpers.ts" with { type: "cssints" };
import { t } from "../theme.ts" with { type: "cssints" };

// Conditions: a tuple and an object of media queries, a container query, a supports query.
const [md, lg] = media("(width >= 40rem)", "(width >= 60rem)");
const { reduced } = media({ reduced: "(prefers-reduced-motion: reduce)" });
const narrow = container("card (width < 24rem)");
const hasGrid = supports("(display: grid)");

// A length token, read by a class.
const radius = token.length("8px", "radius");

// cn merges at build time into one class string: no cx, nothing at runtime.
const panel = cn(
  p(4),
  pt(6),
  m(0),
  bg(t.color.surface()),
  css.color(t.color.text()),
  css.borderRadius(radius),
  css.border("1px solid", new CSSColorValue("#9ca3af")),
);

// Short names and a bare number: p(4) is 1rem, pt(6) is 1.5rem, css.opacity(0.9) is a <number>.
const names = cn(panel, css.opacity(0.9));

// A bare layout context chain, and a grid that adds columns at two breakpoints.
const chips = cn(
  flex().direction("row").wrap("wrap").alignItems("center").justifyContent("space-between").gap(2),
  css.listStyle("none"),
);
const chip = cn(css.fontSize("0.875rem"), css.color(t.color.muted()));
const columns = cn(
  grid().templateColumns("1fr").gap(2),
  md(css.gridTemplateColumns("1fr 1fr")),
  lg(css.gridTemplateColumns("repeat(3, 1fr)")),
);
const wide = md(css.gridColumn("span 2"));
const cell = cn(p(2), bg(t.color.surface()), css.borderRadius(radius), css.color(t.color.text()));

// Pseudo-class wrappers, and one inside a breakpoint (two conditions). colorMix() takes the accent token, which a
// template string cannot: the hover is the accent darkened in oklab.
const action = cn(
  p(2),
  css.cursor("pointer"),
  css.color("white"),
  bg(t.color.accent()),
  css.border("none"),
  css.borderRadius(radius),
  hover(bg(css.colorMix("oklab", t.color.accent(), "black 15%"))),
  lg(hover(bg(css.colorMix("oklab", t.color.accent(), "black 30%")))),
  focusVisible(css.outline("2px solid", t.color.accent()), css.outlineOffset("2px")),
  active(css.transform("scale(0.97)")),
  disabled(css.opacity(0.5)),
  reduced(css.transform("none")),
);

// A container query: the same class in a narrow and a wide box.
const cardBox = cn(css.containerType("inline-size"), css.containerName("card"));
const cardBoxNarrow = css.width("16rem");
const cardBoxWide = css.width("32rem");
const cardBody = cn(
  p(2),
  bg("#dbeafe"),
  css.color("#1e3a8a"),
  narrow(bg("#fee2e2"), css.color("#7f1d1d")),
);

// keyframes() from a helper module: the name goes where animation wants one, the rule comes with it.
const pulsing = cn(
  css.color(t.color.text()),
  animation(pulse, "1.5s", "ease-in-out", "infinite"),
  reduced(animation("none")),
);

// supports(): bold where CSS grid exists.
const feature = cn(
  css.color(t.color.text()),
  css.fontWeight("400"),
  hasGrid(css.fontWeight("700")),
);

// Typed parts and math: Typed OM values as parts, and calc() as a string, min() and clamp() as calls.
const typed = cn(
  css.color(t.color.text()),
  css.padding(CSS.rem(0.5), CSS.rem(1.5)),
  css.borderRadius(CSS.percent(10)),
  css.border("2px solid", new CSSColorValue("#2563eb")),
  css.width(css.min("100%", "24rem")),
  css.fontSize(css.clamp("1rem", "2.5vw", "1.5rem")),
  css.marginInline("calc(1rem + 2%)"),
);

// frame(): the field's radius is the card's less the card's padding and border (24 - 16 - 1 = 7px), with no wiring. The
// colours of the border are plain styles; padding, margin and border-radius would be a build error beside frame().
// surface(): the card's background is the surface token, a tonal step lighter on hover (visible in the dark theme; bg()
// beside it would be a build error).
const framed = cn(
  frame().radius("1.5rem").padding(4).border("1px"),
  surface().color(t.color.surface()),
  hover(surface().lighten(0.04)),
  css.borderColor("#9ca3af"),
);
const framedField = cn(
  frame().padding(2).border("1px"),
  bg(t.color.page()),
  css.borderColor("#9ca3af"),
  css.color(t.color.text()),
);

// A theme for a selector: `.compact` makes --space-md 8px. The token fits padding like a length.
const themed = cn(css.padding(t.space.md()), bg(t.color.page()), css.color(t.color.link()));

// cv: variants are css values, including a flex() chain and a condition.
const badge = cv({
  base: cn(css.fontWeight("600"), css.fontSize("0.75rem"), css.borderRadius("999px")),
  variants: {
    tone: {
      info: cn(bg("#dbeafe"), color("#1e3a8a")),
      danger: cn(bg("#fee2e2"), color("#7f1d1d")),
    },
    size: { sm: p(1), lg: cn(p(2), md(css.fontSize("1rem"))) },
    layout: { row: flex().gap(1).alignItems("center") },
  },
  defaultVariants: { tone: "info", size: "sm" },
});

export function Showcase() {
  const [compact, setCompact] = useState(false);
  return (
    <section data-demo="showcase" className={cx(stack(3), compact && "compact")}>
      <p data-demo="names" className={names}>
        Short names and numbers: p(4), pt(6), m(0), opacity(0.9)
      </p>

      <ul data-demo="flex" className={chips}>
        <li className={chip}>flex()</li>
        <li className={chip}>direction("row")</li>
        <li className={chip}>wrap("wrap")</li>
        <li className={chip}>justifyContent("space-between")</li>
      </ul>

      <div data-demo="grid" className={columns}>
        <div className={cx(cell, wide)}>grid(), spans 2 columns from 40rem</div>
        <div className={cell}>1 column, 2 from 40rem</div>
        <div className={cell}>3 from 60rem</div>
      </div>

      <div data-demo="pseudo" className={chips}>
        <button className={action}>hover, focusVisible, active</button>
        <button className={action} disabled>
          disabled
        </button>
      </div>

      <div data-demo="container" className={chips}>
        <div data-box="narrow" className={cx(cardBox, cardBoxNarrow)}>
          <p className={cardBody}>container query, 16rem</p>
        </div>
        <div data-box="wide" className={cx(cardBox, cardBoxWide)}>
          <p className={cardBody}>container query, 32rem</p>
        </div>
      </div>

      <p data-demo="keyframes" className={pulsing}>
        keyframes() in a helper module, off under prefers-reduced-motion
      </p>

      <p data-demo="supports" className={feature}>
        supports(display: grid)
      </p>

      <p data-demo="typed" className={typed}>
        CSS.rem(), CSSColorValue, min(), clamp(), calc()
      </p>

      <div data-demo="theme" className={themed}>
        <button data-demo="compact" className={action} onClick={() => setCompact((on) => !on)}>
          Toggle .compact
        </button>{" "}
        padding is a token; the theme sets it for .compact, and the link colour is an alias
      </div>

      <div data-demo="frame" className={framed}>
        <div data-field className={framedField}>
          frame(): the radius of this field is concentric with the card around it
        </div>
      </div>

      <div data-demo="badges" className={chips}>
        <span className={badge()}>info</span>
        <span className={badge({ tone: "danger", size: "lg" })}>danger</span>
        <span className={badge({ layout: "row" })}>row</span>
      </div>
    </section>
  );
}
