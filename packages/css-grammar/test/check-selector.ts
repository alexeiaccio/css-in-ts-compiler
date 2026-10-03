// node check-selector.ts: the selector recognizer of css.global() and the type-level check that stands before it.
import { throws } from "node:assert/strict";

import type { ValidSelector } from "../src/query.ts";
import { checkSelectorNow } from "../src/selector.ts";

const good = [
  "body",
  "*",
  "*, *::before, *::after",
  ":root",
  ":root.dim, :root.dark",
  ":root:not(.light)",
  "a:hover",
  "ul > li + li ~ li",
  "nav  a[aria-current='page']",
  'a[href^="https://"]',
  "[data-x]",
  "[data-x=y i]",
  "input::placeholder",
  "p::first-line:hover",
  ".a .b>.c",
  "#id.cls:is(a, b):where(:not(.x))",
  "li:nth-child(2n + 1)",
  'a:not([href="a)b"])',
  "svg|a, *|b, |c",
  "table || td",
  "  main  ",
];
for (const s of good) checkSelectorNow(s);

const bad: [string, RegExp][] = [
  ["", /unexpected end in ""/],
  ["a,", /unexpected end/],
  [",a", /unexpected "," in ",a"/],
  ["a >", /unexpected end/],
  ["> a", /unexpected ">"/],
  ["a{}", /unexpected "{}"/],
  ["a; b", /unexpected ";"/],
  ["#1a", /unexpected "#1a"/],
  [".1a", /unexpected "\.1a"/],
  ["a:", /unexpected ":"/],
  ["a:is(", /unexpected "\(" in/],
  ["a:is()", /unexpected "\(\)"/],
  ["a[b", /unexpected "\[b"/],
  ["a[b=]", /unexpected "\[b=\]"/],
  ["&:hover", /unexpected "&:hover"/],
  ["a::before.x", /unexpected "\.x"/],
  ["a b )", /unexpected "\)"/],
];
for (const [s, re] of bad) {
  throws(() => checkSelectorNow(s), re, s);
}

// The type level: balanced brackets and quotes, not empty.
type Ok<S extends string> = ValidSelector<S> extends S ? true : false;
export const types: [Ok<"a:is(.b, .c)">, Ok<'a[href="("]'>, Ok<"a[b">, Ok<"a)">, Ok<" ">, Ok<"">] =
  [true, true, false, false, false, false];
console.log(`ok: ${good.length + bad.length} selector cases`);
