// @cssints/balance: `text-wrap: balance` and `text-wrap: pretty` as members (cssints/plugin `scope()`). `balance()` is a
// kernel of `text-wrap: balance` and, for targets that lack it (BCD), a fallback: a flag in `@supports not` that the
// script of `@cssints/balance/runtime` (delivered by the runtime) reads to balance the element itself. `pretty()` is `text-wrap: pretty` and nothing
// else: a target without it wraps as usual, which is what pretty improves on, so it neither warns nor ships a runtime.
// `balance()`'s kernel is written as styles: the runtime covers its support warnings, and its conflicts are derived.
// `pretty()`'s is raw CSS: written as styles it would warn for `text-wrap`, and nothing covers that by design.
import { scope } from "cssints/plugin";

const balanceScope = scope("balance", {
  "#core": { css: (css) => css.textWrap("balance") },
  "#prettyCore": { css: "&{text-wrap:pretty}" },
  // Only in the sheet when a target lacks balance, and only on in a browser that lacks it.
  "#script": {
    polyfills: ["css.properties.text-wrap", "css.properties.text-wrap.balance"],
    css: "@supports not (text-wrap:balance){&{--_js:1}}",
    script: "@cssints/balance/runtime",
  },
  // pretty()'s conflicts: a raw kernel derives none
  "#wrap": {
    props: ["text-wrap", /^text-wrap-/, "white-space"],
    message: "it sets text-wrap",
  },
  balance: { args: [], uses: ["core", "script"] },
  pretty: { args: [], uses: ["prettyCore", "wrap"] },
}).build({ balance: () => ({}), pretty: () => ({}) });
// named through the scope, as mise-en-mode's look: the inferred type is too long to print (TS7056)
type Members = ReturnType<typeof balanceScope.export>;
const members: Members = balanceScope.export();
/** `text-wrap: balance`, with a script fallback for targets that lack it (delivered with the styles). */
export const balance: Members["balance"] = members.balance;
/** `text-wrap: pretty`; a target without it wraps as usual. */
export const pretty: Members["pretty"] = members.pretty;
