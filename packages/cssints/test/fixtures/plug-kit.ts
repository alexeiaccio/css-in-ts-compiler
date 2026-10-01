// A plugin module on the public helpers: a typed property, a context with a kernel, a runtime for a feature the
// test targets lack (style queries on custom properties) and conflicts; and a context whose runtime is for a feature
// they all have.
import { context, method, property } from "cssints/plugin";

export const smoothing = property(
  "-webkit-font-smoothing",
  "auto | none | antialiased | subpixel-antialiased",
);

const len = "<length [0,∞]>" as const;
export const frame = context({
  name: "frame",
  marker: "_f",
  kernel: {
    key: "frame@1",
    css: "._f{border-radius:var(--fr-r)}",
    atProperty: `@property --fr-r { syntax: "<length>"; inherits: false; initial-value: 0px }`,
  },
  runtime: {
    polyfills: ["css.at-rules.container.style_queries_for_custom_properties"],
    parentVars: [{ marker: "_f", read: "--fr-i", write: "--fr-u", watch: "--fr-t" }],
    css: ":root[data-cssints-poly] ._f{--fr-u:0px}",
  },
  conflicts: {
    props: ["padding", "margin", "border-radius", /^border(-|$)/],
    message: "frame() sets these: use its methods",
  },
  methods: {
    radius: method({ grammar: len, emit: (v) => [["--fr-r", v]] }),
    padding: method({ grammar: len, spacing: true, emit: (v) => [["--fr-p", v]] }),
  },
});

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
