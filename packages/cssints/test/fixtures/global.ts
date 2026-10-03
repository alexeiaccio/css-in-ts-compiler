import * as css from "cssints" with { type: "cssints" };

const dark = css.media("(prefers-color-scheme: dark)");
const page = css.token.color("#ffffff", "page-bg");

css.global("*, *::before, *::after", css.boxSizing("border-box"));
css.global("html", css.bg(page), css.margin("1px"), css.margin("0")); // the later margin wins
css.global(":root", css.colorScheme("light"), dark(css.colorScheme("dark")));
css.global("a[href^='http'] > b", css.minHeight(css.firstThatWorks("100dvh", "100vh")));
