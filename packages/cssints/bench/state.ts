// The cost of css.global(), attr(), group() and within() as user code writes them: 12 globals with selectors of every
// kind, 12 attribute states, 12 ancestor states. Checked next to plugins.ts by `bun run bench`.
import {
  attr,
  boxSizing,
  cn,
  color,
  colorScheme,
  fontFamily,
  global,
  group,
  hover,
  focusVisible,
  margin,
  media,
  opacity,
  padding,
  within,
} from "cssints" with { type: "cssints" };

const dark = media("(prefers-color-scheme: dark)");

global("*, *::before, *::after", boxSizing("border-box"));
global("html", margin("0"));
global("body", margin("0"), fontFamily("system-ui"));
global(":root", colorScheme("light"), dark(colorScheme("dark")));
global(":root.dim, :root.dark", colorScheme("dark"));
global(":root:not(.light)", colorScheme("dark"));
global("button", fontFamily("inherit"));
global("a[href^='http'] > b", color("red"));
global("ul > li + li ~ li", margin("0"));
global("input::placeholder", opacity(0.5));
global("li:nth-child(2n + 1)", padding("0"));
global('a:not([href="a)b"])', color("blue"));

export const states = [
  attr("aria-current", "page")(color("red")),
  attr("aria-selected", "true")(color("red")),
  attr("aria-expanded", "false")(color("red")),
  attr("disabled")(opacity(0.5)),
  attr("hidden")(opacity(0)),
  attr("data-state", "open")(color("blue")),
  attr("lang", "en", "|=")(color("blue")),
  attr("class", "x", "~=")(color("blue")),
  attr("href", "https", "^=")(color("blue")),
  attr("href", ".pdf", "$=")(color("blue")),
  attr("href", "ex", "*=")(color("blue")),
  hover(attr("data-x", "y")(padding(1))),
];

export const groups = [
  group(),
  group("row"),
  group("card"),
  cn(group(), padding(2)),
  within(hover)(color("red")),
  within(hover, "row")(color("red")),
  within(focusVisible, "card")(color("red")),
  within(attr("aria-expanded", "true"), "row")(padding(1)),
  within(hover)(opacity(1), color("blue")),
  within(hover, "row")(opacity(0.5), color("blue")),
  hover(within(hover)(color("red"))),
  media("(width >= 40rem)")(within(hover)(color("red"))),
];
