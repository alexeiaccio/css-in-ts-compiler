import { cn, keyframes, left, margin, opacity, positionTry, token, top, transform } from "cssints" with { type: "cssints" };

const scale = token.number("1", "kf-scale");

// A build-time helper module: the names are imported by components, which carry the at-rules into their own sheets.
export const fade = keyframes({ from: opacity(0), to: opacity(1) });
export const spin = keyframes({
  from: transform("rotate(0deg)"),
  "50%": cn(transform("rotate(180deg)"), opacity(scale)),
  to: transform("rotate(360deg)"),
});
export const above = positionTry(cn(top("anchor(bottom)"), margin(2)));
// the same content is the same name
export const fadeAgain = keyframes({ from: opacity(0), to: opacity(1) });
// never used by a component: it is in no sheet
export const unused = keyframes({ to: opacity(0.5) });
