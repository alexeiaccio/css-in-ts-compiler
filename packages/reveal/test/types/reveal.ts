import { appear, reveal } from "../../src/index.ts";

export const a = reveal().preset("fade-in");
export const b = reveal()
  .preset("slide-in-up")
  .range("entry 0% entry 100%")
  .duration("300ms")
  .easing("ease-in");
export const c = reveal().range("cover 10% contain 50%, exit");
// @ts-expect-error an exit preset: reveal() is an entrance
export const e1 = reveal().preset("fade-out");
// @ts-expect-error not a range
export const e2 = reveal().range("sideways");
// @ts-expect-error not a time
export const e3 = reveal().duration("300px");

export const d = appear().preset("fade-in");
export const e = appear()
  .preset("slide-in-up")
  .range("entry 100% exit 0%")
  .duration("600ms")
  .easing("linear")
  .inOut();
// @ts-expect-error an exit preset: appear() is an entrance
export const f1 = appear().preset("fade-out");
// @ts-expect-error not a range
export const f2 = appear().range("sideways");
