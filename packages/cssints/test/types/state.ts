// What user code sees of css.global(), attr(), within() and group(): `tsgo -p tsconfig.json` checks this file.
import { cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import {
  attr,
  colorScheme,
  global,
  group,
  hover,
  media,
  p,
  within,
} from "cssints" with { type: "cssints" };

const dark = media("(prefers-color-scheme: dark)");

// global: a selector, then declarations (under media, container or supports), nothing comes back.
export const none: void = global(":root", colorScheme("light"), dark(colorScheme("dark")));
css.global("*, *::before", css.boxSizing("border-box"));
css.global("a[href^='http']:not(.x) > b", css.color("red"), css.m(0));
// @ts-expect-error the selector is empty
global("", p(1));
// @ts-expect-error a bracket is open
global("a[href", p(1));
// @ts-expect-error a parenthesis is not closed
global("a:not(.b", p(1));
// @ts-expect-error a bad value is a bad value
global("a", css.color("blu"));
// @ts-expect-error a string is no style
global("a", "color: red");

// attr: a name, or a name and a string value and an operator; a wrapper like hover.
export const ok: string = cx(
  attr("aria-current", "page")(css.color("red")),
  attr("disabled")(css.opacity(0.5)),
  attr("href", "https", "^=")(css.color("blue")),
  hover(attr("data-x", "y")(p(1))),
);
// @ts-expect-error a name has no space
attr("a b", "x");
// @ts-expect-error a name is not a selector
attr("a[b]");
// @ts-expect-error not an operator
attr("a", "x", "!=");
// @ts-expect-error the value is a string
attr("a", 1);

// within: the state of a marked ancestor.
export const row: string = css.cn(group(), p(2));
export const named: string = group("row");
export const link: string = cx(
  within(hover)(css.color("red")),
  within(hover, "row")(css.color("red")),
  within(attr("aria-expanded", "true"), "row")(p(1)),
);
// @ts-expect-error a media query is not a state
within(media("(width >= 40rem)"));
// @ts-expect-error within is not nested
within(within(hover));
// @ts-expect-error a group name has no space
group("a b");
// @ts-expect-error a wrapper takes styles
within(hover)(1);
