// @cssints/fluid: a length that grows from `min` to `max` between two widths, computed at build time into
// `clamp(min, <slope>vw + <intercept>rem, max)` (cqi in a container). Two value members of cssints/plugin `scope()`, so
// the parts are checked at the call and a failure is a build error there; the result is a Typed OM length. The WCAG 1.4.4 check is fluid-tailwind's (barvian/fluid-tailwind): at 500% zoom the value must reach twice its
// size at 100%, or text cannot be resized to 200%.
import { CSSStyleValue } from "cssints";
import { scope } from "cssints/plugin";

/** A length the build can compute with: px or rem (16px to the rem). */
export type Length = `${number}rem` | `${number}px`;
/** The widths between which the value grows, 20rem and 80rem when left out. */
export interface Range {
  from?: Length;
  to?: Length;
  /** `false` skips the WCAG 1.4.4 check, for a length that is not text (a padding, a gap). */
  zoom?: boolean;
}
/** What `fluid()` gives: a length, for any property that takes one. */
export type Fluid = CSSStyleValue<"length">;

// ponytail: the text of the clamp(), as cssints' own min/max/clamp hold theirs (no CSSMathClamp in the engine's Typed OM).
class Clamp extends CSSStyleValue<"length"> {
  readonly text: string;
  constructor(text: string) {
    super();
    this.text = text;
  }
  override toString() {
    return this.text;
  }
}

const rem = (label: string, text: string) => {
  const m = /^(\d*\.?\d+)(px|rem)$/.exec(text);
  if (!m)
    throw new Error(
      `cssints: ${label}: ${text} is not in px or rem: the slope is computed at build time`,
    );
  return m[2] === "px" ? Number(m[1]) / 16 : Number(m[1]);
};
// 4 decimals, and no `-0`
const num = (n: number) => String(Number(n.toFixed(4)) + 0);

const compute = (label: string, unit: "vw" | "cqi") => (parts: string[]) => {
  const [min = "", max = "", from = "", to = "", unchecked] = parts;
  const [lo = 0, hi = 0, a = 0, b = 0] = [min, max, from, to].map((t) => rem(label, t));
  if (lo === hi)
    throw new Error(
      `cssints: ${label}: ${min} and ${max} are the same size: use the length itself`,
    );
  if (a >= b) throw new Error(`cssints: ${label}: from ${from} must be below to ${to}`);
  const slope = (hi - lo) / (b - a);
  const intercept = lo - slope * a;
  const [low, high] = lo < hi ? [min, max] : [max, min];
  // The size at a width w (rem), and the 1.4.4 check: at 500% zoom the width is w/5 and the size 5x, which must reach
  // twice the size at 100%. Both sides are piecewise linear, so checking at their kinks is checking everywhere.
  const at = (w: number) =>
    Math.min(Math.max(intercept + slope * w, Math.min(lo, hi)), Math.max(lo, hi));
  const fails =
    unchecked === undefined
      ? [a, b, 5 * a, 5 * b].find((w) => 5 * at(w / 5) < 2 * at(w) - 1e-9)
      : undefined;
  if (fails !== undefined)
    throw new Error(
      `cssints: ${label}: ${min} to ${max} between ${from} and ${to} fails WCAG 1.4.4: at ${num(fails)}rem wide, 500% zoom gives ${num(5 * at(fails / 5))}rem, under twice ${num(at(fails))}rem; narrow the range of sizes or widen the widths`,
    );
  const sign = intercept < 0 ? "-" : "+";
  return new Clamp(
    `clamp(${low}, ${num(slope * 100)}${unit} ${sign} ${num(Math.abs(intercept))}rem, ${high})`,
  );
};

const grammar = "<length [0,∞]> <length [0,∞]> <length [0,∞]> <length [0,∞]> unchecked?";
// The members take the four lengths as parts (a value member's arguments are parts), and `unchecked` for `zoom: false`;
// the export gives them names.
const members = scope("fluid", {
  fluid: { args: grammar, value: compute("fluid", "vw") },
  fluidContainer: { args: grammar, value: compute("fluid.container", "cqi") },
}).export() as unknown as Record<
  "fluid" | "fluidContainer",
  (...parts: (Length | "unchecked")[]) => Fluid
>;

const ranged =
  (member: (...parts: (Length | "unchecked")[]) => Fluid) =>
  (min: Length, max: Length, { from = "20rem", to = "80rem", zoom = true }: Range = {}) =>
    zoom ? member(min, max, from, to) : member(min, max, from, to, "unchecked");

/**
 * `fluid(min, max, { from?, to? })`: a length that is `min` at the viewport width `from` (20rem), `max` at `to` (80rem),
 * and grows linearly between, computed at build time into `clamp(min, <slope>vw + <intercept>rem, max)`. Lengths in px or
 * rem. A range that fails WCAG 1.4.4 (500% zoom cannot reach twice the size) is a build error at the call.
 * `fluid.container(...)` is the same against the width of the nearest container (`cqi`).
 */
export const fluid = Object.assign(ranged(members.fluid), {
  container: ranged(members.fluidContainer),
});
