// What user code sees of cssints/frame: `tsgo -p tsconfig.json` checks this file (`bun run typecheck`). Each method is
// typed from its grammar, takes a token, and leaves the chain without itself; a lone number is a step only where it says.
import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };

const radius = css.token.length("12px", { var: "radius-lg", inherit: false });
const space = css.token.length("8px", { var: "space-md", inherit: false });
const ink = css.token.color("#111", "ink");

export const ok: Style = frame().radius("1rem").padding(4).border("1px").margin(2);
export const tokens: Style = frame().radius(radius).padding(space).border(space).margin(space);
export const anyOrder: Style = frame()
  .margin("-4px")
  .border("2px")
  .padding("1em")
  .radius("calc(1rem + 2px)");
export const inCn: Style = css.cn(
  frame().radius(radius),
  css.color(ink),
  css.hover(frame().radius("2px")),
);

frame().radius(
  // @ts-expect-error a colour is not a length
  ink,
);
frame().radius(
  // @ts-expect-error not a length
  "red",
);
frame().radius(
  // @ts-expect-error a bare number is a length only in padding and margin
  4,
);
frame().border(
  // @ts-expect-error a bare number is a length only in padding and margin
  1,
);
frame().padding(
  // @ts-expect-error no percentages: it must be a length
  "5%",
);
// a negative padding or radius is the build's to reject, not the types' (test/frame.mjs: the range of <length [0,∞]>)
frame().padding("-1px");
frame().margin(
  // @ts-expect-error not a length
  "auto",
);
// @ts-expect-error a method is used once
frame().radius("1px").radius("2px");
// @ts-expect-error a method is used once, in any position
frame().padding(1).margin(1).padding(2);
// @ts-expect-error a frame chains its own methods only
frame().color("red");
// @ts-expect-error a style is not a value
frame().padding(css.p(1));
