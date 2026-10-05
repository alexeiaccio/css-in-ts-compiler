// The cost of cssints/surface as user code writes it: 30 chains over its five methods, with steps, colours and tokens.
// Checked next to frame.ts by `bun run bench`.
import { cn, hover, media, token } from "cssints";
import { surface } from "../examples/surface.ts";

const base = token.color("#2b3a67", "base");
const accent = token.color("#e11d48", "accent");

export const calls = [
  surface().lighten(0.06),
  surface().darken(0.1),
  surface().contrast(0.15),
  surface().color("#2b3a67"),
  surface().color("white").lighten(0.02),
  surface().color("oklch(0.4 0.1 250)").darken(0.05).ink(),
  surface().color("oklch(from #123 l c h)").contrast(0.1),
  surface().ink(),
  surface().lighten(0.04).ink(),
  surface().ink().darken(0.2),
  surface().color(base).lighten(0.06),
  surface().color(base).darken(0.1).ink(),
  surface().color(accent).contrast(0.15).ink(),
  surface().color(accent),
  surface().ink().color(base),
  surface().contrast(0.3).color("rebeccapurple"),
  surface().color("#fff").ink(),
  surface().darken(0.03),
  surface().lighten(1),
  surface().contrast(0),
  cn(surface().lighten(0.02), hover(surface().lighten(0.06))),
  cn(surface().color(base), media("(width >= 40rem)")(surface().darken(0.05))),
  cn(surface().color("black").ink(), hover(surface().lighten(0.1))),
  surface().color("hsl(220 40% 30%)").lighten(0.06),
  surface().color("color-mix(in oklch, red, blue)").darken(0.1),
  surface().color("Canvas").lighten(0.04),
  surface().color("light-dark(white, black)").contrast(0.1),
  surface().darken(0.5).ink(),
  surface().lighten(0.25).ink(),
  surface().contrast(0.05).ink(),
];
