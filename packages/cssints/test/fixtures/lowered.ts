import {
  backdropFilter,
  color,
  hover,
  height,
  style,
  textWrap,
  token,
} from "cssints" with { type: "cssints" };

const brand = token.color("#0057b8", "lowered-brand");

// LightningCSS lowers these for the targets of the test (chrome 100, safari 15.2): no warning
export const a = color("oklch(55% 0.18 250)");
export const b = color("light-dark(oklch(0.9 0 0), oklch(0.2 0 0))");
export const c = color("oklch(from red l c h)");
export const d = height("round(10.4px, 1px)");
// a vendor prefix is a lowering too: safari 15.2 has only -webkit-backdrop-filter
export const e = backdropFilter("blur(2px)");
export const f = hover(color("oklch(55% 0.18 250)"));

// not lowered: an inline style never goes through LightningCSS
export const i = style(color("lab(40% 20 -50)"));

// not lowered: a var() inside is unknown to LightningCSS (two warnings: oklch() and the relative syntax)
export const g = color(`oklch(from ${brand} l c h)`);
// not lowered: LightningCSS cannot prefix text-wrap, it has no prefixed form
export const h = textWrap("balance");
