// The cost of cssints/frame as user code writes it: 30 chains over its four methods, with spacing steps, lengths and tokens.
// Checked next to plugins.ts by `bun run bench`.
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };

const radius = css.token.length("12px", { var: "radius-lg", inherit: false });
const space = css.token.length("8px", { var: "space-md", inherit: false });

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
  frame().radius(radius).padding(space),
  frame().radius(radius).padding(4).border("1px"),
  frame().radius(radius).padding(space).border(space).margin(space),
  frame().padding(space),
  frame().margin(space).radius(radius),
  frame().radius("50px").padding(1),
  frame().border("3px").radius("6px"),
  frame().margin(4).border("1px"),
  frame().radius("8px").padding(4),
  frame().radius("1rem").padding(4).border("1px").margin(2),
  css.cn(frame().radius(radius).padding(4), css.color("red")),
  css.cn(frame().radius("4px"), css.hover(frame().radius("2px"))),
  css.cn(frame().padding(2), css.media("(width >= 40rem)")(frame().padding(6))),
  frame().radius("12px").padding(3),
  frame().radius("16px").padding(5),
  frame().radius("2rem").padding(6),
  frame().radius("2px"),
  frame().padding(8),
  frame().margin("0.25rem"),
  frame().radius(radius),
];
