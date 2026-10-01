// The cost of plugin calls: a context with four methods (a plugin author's module), a property, a style, and 30 calls of
// them as user code writes them. Checked next to users.ts by `bun run bench`.
import { context, method, property, style } from "cssints/plugin";

const length = "<length [0,∞]>" as const;
export const frame = context({
  name: "frame",
  marker: "_f",
  kernel: { key: "frame@1", css: "._f{border-radius:var(--r)}" },
  methods: {
    radius: method({ grammar: length, emit: (v) => [["--r", v]] }),
    padding: method({ grammar: length, spacing: true, emit: (v) => [["--p", v]] }),
    border: method({ grammar: length, emit: (v) => [["--b", v]] }),
    margin: method({ grammar: length, spacing: true, emit: (v) => [["--m", v]] }),
  },
});
export const smoothing = property(
  "-webkit-font-smoothing",
  "auto | none | antialiased | subpixel-antialiased",
);
export const icon = style("home | star | moon", (name) => ({ decls: [["--svg", name]] }));

export const calls = [
  frame().radius("8px"),
  frame().radius("1rem").padding(4),
  frame().radius("calc(1rem + 2px)").padding("0.5rem").border("1px"),
  frame().padding(2).margin(1).radius("4px").border("2px"),
  frame().border("1px"),
  frame().margin("1rem"),
  frame().margin(2).padding(2),
  frame().radius("0"),
  frame().radius("1em").border("1px").margin(1),
  frame().padding(1).radius("2px"),
  frame().radius("8px").padding(4),
  frame().radius("1rem").padding(4).border("1px").margin(2),
  frame().radius("50px").padding(1),
  frame().border("3px").radius("6px"),
  frame().margin(4).border("1px"),
  smoothing("antialiased"),
  smoothing("auto"),
  smoothing("none"),
  smoothing("subpixel-antialiased"),
  icon("home"),
  icon("star"),
  icon("moon"),
  frame().radius("12px").padding(3),
  frame().radius("16px").padding(5),
  frame().radius("2rem").padding(6),
  frame().radius("2px"),
  frame().padding(8),
  frame().margin("0.25rem"),
  smoothing("antialiased"),
  icon("home"),
];
