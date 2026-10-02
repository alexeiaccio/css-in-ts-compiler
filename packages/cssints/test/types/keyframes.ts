// keyframes() and positionTry(): a typed name that fits where the grammar wants a <custom-ident> (animation,
// animationName) or a <dashed-ident> (positionTryFallbacks), and nowhere else. Steps are styles, checked at their call.
import {
  animation,
  animationName,
  cn,
  keyframes,
  margin,
  opacity,
  positionTry,
  positionTryFallbacks,
  token,
  top,
  transform,
  width,
} from "cssints" with { type: "cssints" };

const fade = keyframes({ from: opacity(0), to: opacity(1) });
const spin = keyframes({ from: transform("rotate(0deg)"), "50%": cn(opacity(0.5)), "99.5%": opacity(1) });
const above = positionTry(cn(top("anchor(bottom)"), margin(2)));
const ident = token.customIdent("x", "an-ident");

export const ok = [
  animation(spin, "1s", "linear", "infinite"),
  animation("1s", fade),
  animationName(fade),
  animationName(ident),
  positionTryFallbacks(above),
  positionTryFallbacks(above, "flip-block"),
  positionTryFallbacks("flip-block", above),
  // `position-try` is a property too: value parts are the shorthand
  positionTry("flip-block"),
  positionTry("most-width", above),
];

// @ts-expect-error a position-area cannot be combined with a name
positionTryFallbacks(above, "top");
// @ts-expect-error a name is not a width
width(fade);
// @ts-expect-error a keyframes name is not a dashed ident
positionTryFallbacks(fade);
// @ts-expect-error a position-try name is not a custom ident
animationName(above);
// @ts-expect-error a step is "from", "to" or a percentage
keyframes({ halfway: opacity(0) });
// @ts-expect-error a step is a style, not a CSS string
keyframes({ from: "opacity: 0" });
// @ts-expect-error a bad declaration is an error at its member call
keyframes({ from: opacity("lots") });
// @ts-expect-error a bad value of the shorthand is still an error
positionTry("sideways");
// @ts-expect-error not a string
const bad: string = fade;
