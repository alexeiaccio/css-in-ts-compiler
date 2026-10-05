// analog of bench/plugins.ts (51k): a 4-leaf context, a property, a member, 30 calls, one file, imports cssints/plugin only
import { plugin, property } from "cssints/plugin";

const p = plugin("frame");
const tokens = p.tokens({
  radius: { $type: "dimension", $value: "0px" },
  padding: { $type: "dimension", $value: "0px" },
  border: { $type: "dimension", $value: "0px" },
  margin: { $type: "dimension", $value: "0px" },
});
export const frame = p.context(tokens, {
  spacing: ["padding", "margin"],
  kernel: { css: "._f{border-radius:var(--frame-radius)}" },
});
export const smoothing = property(
  "-webkit-font-smoothing",
  "auto | none | antialiased | subpixel-antialiased",
);
export const icon = p.member("home | star | moon", () => {});

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
