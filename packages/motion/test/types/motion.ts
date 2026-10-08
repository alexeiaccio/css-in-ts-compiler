import { motion } from "../../src/index.ts";

export const a = motion().preset("fade-in");
export const b = motion().preset("slide-in-up").duration("300ms").delay("-1s").easing("ease-in");
export const c = motion().easing("cubic-bezier(0.2, 0, 0, 1)");
// @ts-expect-error no such preset
export const e1 = motion().preset("spin");
// @ts-expect-error not a time
export const e2 = motion().duration("300px");
// @ts-expect-error not an easing
export const e3 = motion().easing("fast");
