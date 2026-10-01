// What a plugin author and user see of cssints/plugin: `tsgo -p tsconfig.json` checks this file (`bun run typecheck`).
// Members are class strings; a value is checked against the grammar of the method (or property) it is passed to, the
// error lands on the bad argument, a method is used once.
import type { Style } from "cssints";
import { context, method, property, style } from "cssints/plugin";

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
