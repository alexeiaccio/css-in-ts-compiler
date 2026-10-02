// A plugin module on the public helpers: a typed property, and a context whose runtime is for a feature every test target
// has (the runtime of one the targets lack is frame()'s).
import { context, method, property } from "cssints/plugin";

export const smoothing = property(
  "-webkit-font-smoothing",
  "auto | none | antialiased | subpixel-antialiased",
);

export const lit = context({
  name: "lit",
  marker: "_l",
  kernel: { key: "lit@1", css: "._l{--lit-c:1}" },
  runtime: {
    polyfills: ["css.properties.color"],
    parentVars: [{ marker: "_l", read: "--lit-r", write: "--lit-w" }],
    css: "._l{--lit-fallback:1}",
  },
  methods: { color: method({ grammar: "<color>", emit: (v) => [["--lit-c", v]] }) },
});
