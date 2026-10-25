import { sx, cn, hover, keyframes, media, opacity } from "cssints" with { type: "cssints" };
import { cv } from "cssints" with { type: "cssints" };

// A chain is a site on its own, in a condition, in cn(), in cv(), and in a variable.
export const base = sx().p(2).bg("red");
export const merged = cn(sx().flex().gap(2), sx().p(4));
export const under = hover(sx().bg("blue"));
export const narrow = media("(width >= 40rem)")(sx().p(4));
export const button = cv({
  base: sx().p(2),
  variants: { size: { lg: sx().p(4).fontSize("1.25rem") } },
});
const fade = keyframes({ from: opacity(0), to: opacity(1) });
export const animated = sx().animationName(fade).animationDuration("1s");
export const row = () => sx().flex().flexDirection("column").gap(1);

// A chain in the runtime half of a cn(): the static one is the head, the chain under `on &&` is a part.
export const maybe = (on: boolean) => cn(sx().p(2), on && sx().p(4), "own");
