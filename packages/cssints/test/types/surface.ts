// What user code sees of cssints/surface: `tsgo -p tsconfig.json` checks this file (`bun run typecheck`). Each method is
// typed from its grammar and takes a token; lighten, darken and contrast leave the chain together, `ink()` takes no value.
import type { Style } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

const base = css.token.color("#2b3a67", "base");
const gap = css.token.length("8px", { var: "gap", inherit: false });

export const ok: Style = surface().color("#2b3a67").lighten(0.06).ink();
export const token: Style = surface().color(base).darken(1);
export const relative: Style = surface().color("oklch(from #123 l c h)").contrast(0);
export const anyOrder: Style = surface().ink().contrast(0.15).color("white");
export const alone: Style = surface();
export const inCn: Style = css.cn(
  surface().lighten(0.02),
  css.hover(surface().lighten(0.06)),
  css.color("red"),
);

surface().color(
  // @ts-expect-error not a colour
  "wide",
);
surface().color(
  // @ts-expect-error a length token is not a colour
  gap,
);
// @ts-expect-error a step is in <number [0,1]> (the build too, test/surface.mjs)
surface().lighten(2);
// @ts-expect-error a step is in <number [0,1]>
surface().contrast(-0.5);
surface().darken(
  // @ts-expect-error a step is a number, not a length
  "1px",
);
// @ts-expect-error darken takes lighten and contrast out of the chain
surface().darken(0.1).lighten(0.1);
// @ts-expect-error lighten takes darken and contrast out of the chain
surface().lighten(0.1).darken(0.1);
// @ts-expect-error contrast takes lighten and darken out of the chain, whatever comes between
surface().contrast(0.1).ink().lighten(0.1);
// @ts-expect-error a method is used once
surface().lighten(0.1).lighten(0.2);
// @ts-expect-error a method is used once
surface().color("red").color("blue");
// @ts-expect-error ink takes no value
surface().ink("black");
// @ts-expect-error ink is used once
surface().ink().ink();
// @ts-expect-error a surface chains its own methods only
surface().radius("1px");
// @ts-expect-error a style is not a value
surface().color(css.bg("red"));
