// What user code sees of the condition wrappers: `tsgo -p tsconfig.json` checks this file (`bun run typecheck`).
import { cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { hover, media, p, supports } from "cssints" with { type: "cssints" };

const md = css.media("(width >= 40rem)");
const [tablet, wide] = css.media("(width >= 40rem)", "(width >= 60rem)");
const { sm, lg } = media({ sm: "(width >= 30rem)", lg: "(width >= 60rem)" });
const narrow = css.container("sidebar (width < 30rem)");
const grid = supports("(display: grid)");

// Wrappers take styles and return styles, so they nest and mix with cx.
export const ok: string = cx(
  p(2),
  md(css.pl("8ch"), hover(css.bg("#eee"))),
  tablet(md(hover(p(1)))),
  wide(p(3)),
  sm(p(1)),
  lg(p(2)),
  narrow(p(1)),
  grid(css.display("grid")),
);

// @ts-expect-error min-width needs parentheses
media("screen and min-width > 40rem");
// @ts-expect-error a range needs its value
css.media("(width >= )");
// @ts-expect-error no such value
supports("(display: grdi)");
// @ts-expect-error one bad query of a tuple
css.media("(width >= 40rem)", "(width >= )");
// @ts-expect-error one bad query of an object
css.media({ md: "(width >= 40rem)", lg: "(width >= )" });
// @ts-expect-error a wrapper takes styles, not values
md(1);
// @ts-expect-error a wrapper is not a query
media(md);
