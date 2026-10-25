import { chain, cn, hover, keyframes, media, opacity } from "cssints" with { type: "cssints" };
import { cv } from "cssints" with { type: "cssints" };

// A chain is a site on its own, in a condition, in cn(), in cv(), and in a variable.
export const base = chain().p(2).bg("red");
export const merged = cn(chain().flex().gap(2), chain().p(4));
export const under = hover(chain().bg("blue"));
export const narrow = media("(width >= 40rem)")(chain().p(4));
export const button = cv({
  base: chain().p(2),
  variants: { size: { lg: chain().p(4).fontSize("1.25rem") } },
});
const fade = keyframes({ from: opacity(0), to: opacity(1) });
export const animated = chain().animationName(fade).animationDuration("1s");
export const row = () => chain().flex().flexDirection("column").gap(1);

// A chain in the runtime half of a cn(): the static one is the head, the chain under `on &&` is a part.
export const maybe = (on: boolean) => cn(chain().p(2), on && chain().p(4), "own");
