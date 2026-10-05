// Plugin modules on scope(): a typed property and value functions (a Typed OM result, a string, a function that throws, one
// that returns nothing), and a chain whose runtime is for a feature every test target has (the runtime of one the targets
// lack is frame()'s).
import { CSSColorValue } from "@cssints/css-grammar/values";
import { scope } from "cssints/plugin";

export const {
  webkitFontSmoothing: smoothing,
  mix,
  quad,
  boom,
  nothing,
} = scope("pk", {
  "-webkit-font-smoothing": "auto | none | antialiased | subpixel-antialiased",
  mix: {
    args: "<color> <color>",
    value: ([a, b]) => new CSSColorValue(`color-mix(in oklab, ${a}, ${b})`),
  },
  quad: { args: "<number>", value: ([n]) => `${Number(n) * 4}px` },
  boom: {
    args: "<number>",
    value: () => {
      throw new Error("cssints: boom: no luck");
    },
  },
  nothing: { args: "<number>", value: (() => 1) as never },
}).export();

export const { lit } = scope("lit", {
  core: { css: "& { --lit-c: 1 }" },
  fallback: {
    polyfills: ["css.properties.color"],
    parentVars: [{ marker: "&", read: "--_r", write: "--_w" }],
    css: "& { --_fallback: 1 }",
  },
  lit: { uses: ["core", "fallback"], chain: { color: { args: "<color>", emit: (v) => [["--_c", v]] } } },
}).export();
