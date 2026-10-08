// @cssints/balance: `text-wrap: balance` and `text-wrap: pretty` as members (cssints/plugin `scope()`). `balance()` is a
// kernel of `text-wrap: balance` and, for targets that lack it (BCD), a fallback: a flag in `@supports not` that the
// script of `@cssints/balance/runtime` reads to balance the element itself. `pretty()` is `text-wrap: pretty` and nothing
// else: a target without it wraps as usual, which is what pretty improves on, so it neither warns nor ships a runtime.
// The kernels are raw CSS: one written as styles warns for `text-wrap` itself, which the runtime does not cover.
import { scope } from "cssints/plugin";

export const { balance, pretty } = scope("balance", {
  "#core": { css: "&{text-wrap:balance}", requires: ["css.properties.text-wrap.balance"] },
  "#prettyCore": { css: "&{text-wrap:pretty}" },
  // Only in the sheet when a target lacks balance, and only on in a browser that lacks it.
  "#script": {
    polyfills: ["css.properties.text-wrap.balance"],
    css: "@supports not (text-wrap:balance){&{--_js:1}}",
  },
  "#wrap": {
    props: ["text-wrap", /^text-wrap-/, "white-space"],
    message: "it sets text-wrap",
  },
  balance: { args: [], uses: ["core", "script", "wrap"] },
  pretty: { args: [], uses: ["prettyCore", "wrap"] },
})
  .build({ balance: () => ({}), pretty: () => ({}) })
  .export();
