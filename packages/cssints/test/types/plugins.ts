// What a plugin author and user see of cssints/plugin: `tsgo -p tsconfig.json` checks this file (`bun run typecheck`).
// Members are class strings; a value is checked against the grammar of the method (or property) it is passed to, the
// error lands on the bad argument, a method is used once.
import { CSSColorValue } from "@cssints/css-grammar/values";
import { color, width, type Style } from "cssints";
import { context, fn, method, property, style, type GlobalRule } from "cssints/plugin";

import type { CheckIn } from "../../src/parts.ts";

const len = "<length [0,∞]>" as const;
const frame = context({
  name: "frame",
  marker: "_f",
  kernel: { key: "frame@1", css: "._f{border-radius:var(--r)}" },
  methods: {
    radius: method({ grammar: len, emit: (v) => [["--r", v]] }),
    padding: method({ grammar: len, spacing: true, emit: (v) => [["--p", v]] }),
    ratio: method({ grammar: "<number> | auto", emit: (v) => [["--k", v]] }),
  },
});

// the chain is a class string at every step; the methods come in any order
export const ok: Style = frame().radius("8px").padding(4);
export const other: Style = frame().padding("1rem").radius("2px");
// @ts-expect-error a method is used once
frame().radius("1px").radius("2px");
frame().radius(
  // @ts-expect-error not a length
  "red",
);
frame().padding(
  // @ts-expect-error a number is the spacing scale only where the method says so
  frame().radius(4),
);
// @ts-expect-error a number is a length only with `spacing`
frame().radius(4);
// @ts-expect-error no such method
frame().margin("1px");
frame().ratio("auto");
// the label of the message is `name.method`, with the grammar of the method
type Bad = CheckIn<"frame.radius", typeof len, false, ["red"]>;
export const message: Bad extends [infer M] ? M : never =
  'frame.radius: unexpected "red" in "red", grammar <length [0,∞]>';

// a grammar in a plain const (not `as const`) keeps its literal type, inline in the context too
const plain = "<length [0,∞]>";
const box = context({
  name: "box",
  marker: "_b",
  kernel: { key: "box@1", css: "" },
  methods: { size: method({ grammar: plain, emit: (v) => [["--s", v]] }) },
});
box().size(
  // @ts-expect-error not a length
  "red",
);

// property(): the grammar of the name; the label is the property
const smoothing = property(
  "-webkit-font-smoothing",
  "auto | none | antialiased | subpixel-antialiased",
);
export const s: Style = smoothing("antialiased");
smoothing(
  // @ts-expect-error not in the grammar
  "bold",
);
// @ts-expect-error a value is expected
smoothing();

// style(): parts of its grammar, joined; the build gets them as one string
const icon = style("home | star", (name) => ({ decls: [["--svg", name]] }));
export const i: Style = icon("home");
icon(
  // @ts-expect-error not in the grammar
  "moon",
);

// fn(): the parts are checked against the grammar; a Typed OM result keeps its type, a string is opaque
const mix = fn(
  "<color> <color>",
  ([a, b]) => new CSSColorValue(`color-mix(in oklab, ${a}, ${b})`),
  "mix",
);
const quad = fn("<number>", ([n]) => `${Number(n) * 4}px`, "quad");
export const m: Style = color(mix("red", "blue"));
export const q: Style = width(quad(2));
// @ts-expect-error not a color
mix("red", "solid");
// @ts-expect-error not a number
quad("red");
// @ts-expect-error a CSSColorValue is a <color>, not a <length>
width(mix("red", "blue"));
export const typed: CSSColorValue = mix("red", "blue");
export const opaque: string = quad(1);
// the label of the message is the name
type BadFn = CheckIn<"mix", "<color> <color>", false, ["red", "solid"]>;
export const fnMessage: BadFn extends [infer M, unknown] ? M : never =
  'mix: unexpected "red" in "red solid", grammar <color> <color>';

// Built: global rules by content, declared layers, and themes over a token set the member got from its caller
const looks = (tokens: object) =>
  style("<custom-ident>", (name) => ({
    decls: [],
    layers: ["app", "viewer"],
    globals: [{ css: `[data-mode="${name}"]{--k:1}`, layer: "app" }, { css: "a{--k:2}" }],
    themes: [
      {
        tokens,
        overrides: { color: { bg: "#000" } },
        selector: `.${name}`,
        layer: "viewer",
        scope: "main",
      },
    ],
  }));
export const look: Style = looks({})("dark");
// @ts-expect-error a global has no key any more: it is its content
export const keyed: GlobalRule = { key: "k", css: "a{}" };
style("<custom-ident>", () => ({
  decls: [],
  // @ts-expect-error `null` (a verbatim rule) is gone: declare the layers with `layers`
  globals: [{ css: "@layer a, b;", layer: null }],
}));
style("<custom-ident>", () => ({
  decls: [],
  // @ts-expect-error a theme needs its tokens, overrides and selector
  themes: [{ selector: ".a" }],
}));
