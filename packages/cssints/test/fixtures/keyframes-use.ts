import { animation, animationName, cn, hover, keyframes, opacity, positionTryFallbacks } from "cssints" with { type: "cssints" };

import { above, fade, fadeAgain, spin } from "./keyframes-kit.ts" with { type: "cssints" };

export const a = animation(spin, "1s", "linear", "infinite");
export const b = animationName(fade);
export const c = cn(animationName(fadeAgain), hover(animation("2s", fade)));
export const d = positionTryFallbacks(above, "flip-block");
// a client module can make its own: the same content as fade, so the same name
export const own = keyframes({ from: opacity(0), to: opacity(1) });
