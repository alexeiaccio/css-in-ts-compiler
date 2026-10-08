import { backgroundImage, color, createTokens, maskImage } from "cssints";

import { gradient } from "../../src/index.ts";

const t = createTokens({
  color: { $type: "color", ink: { $value: "#111111" } },
  space: { $type: "dimension", md: { $value: "16px" } },
});

export const a = backgroundImage(gradient("linear", "to bottom", "#000", "transparent"));
export const b = backgroundImage(
  gradient("radial", "circle at top", "red", "blue", "cubic-bezier(0.5, 0, 0.5, 1)", 8),
);
export const c = maskImage(gradient("conic", "from 90deg", "black", "transparent", "linear", 3));
export const d = backgroundImage(gradient("linear", "45deg", t.color.ink, "white", "ease-in"));

// @ts-expect-error not a kind of gradient
export const e1 = gradient("repeating", "to bottom", "red", "blue");
// @ts-expect-error a direction first
export const e2 = gradient("linear", "red", "blue");
// @ts-expect-error not a colour
export const e3 = gradient("linear", "to bottom", "red", "banana");
// @ts-expect-error a length is not a colour
export const e4 = gradient("linear", "to bottom", t.space.md, "red");
// @ts-expect-error steps() is not an easing here
export const e5 = gradient("linear", "to bottom", "red", "blue", "steps(4)");
// the range of the stops is the build's (bad-stops.ts)
export const e6 = gradient("linear", "to bottom", "red", "blue", "ease", 1);
// @ts-expect-error an image is not a colour
export const e7 = color(gradient("linear", "to bottom", "red", "blue"));
