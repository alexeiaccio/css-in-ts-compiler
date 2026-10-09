// @cssints/ramp: an OKLCH colour ramp as DTCG data for createTokens, computed when the module is evaluated (build time).
// Every step keeps the base's hue and its chroma relative to the sRGB gamut at its lightness (nutelch's relative chroma:
// the base's chroma over the most that sRGB holds at the base's lightness and hue), so a step follows the gamut's cusp and
// is in sRGB by construction. A lightness ramp spaces OKLCH lightness evenly; a contrast ramp (leonardo's idea) searches
// each step's lightness for the lowest WCAG 2 ratio at or above its target against a background, measured on the hex it
// outputs with the maths of css.check.contrast (culori's wcagLuminance of the colour clipped to sRGB).
import { clampRgb, converter, formatHex, inGamut, parse, wcagLuminance } from "culori";
import type { Color } from "culori";

/** A hex colour: cheap in the types (createTokens checks it without the walk of every colour syntax). */
export type Hex = `#${string}`;

/** The step names of an N-step ramp: `"1"` to `"N"` (`t.blue._1` in code, `--blue-1` in CSS). */
export type Keys<N extends number, A extends string[] = []> = number extends N
  ? `${number}`
  : A["length"] extends N
    ? A[number]
    : Keys<N, [...A, `${[...A, 0]["length"]}`]>;

/** A ramp: a DTCG colour group whose tokens are the steps, lightest first for a lightness ramp. */
export type Ramp<K extends string> = { readonly $type: "color" } & {
  readonly [P in K]: { readonly $value: Hex };
};

/** The overrides of a ramp for createGlobalTheme: a step `"1"` is `_1`, as cssints reads a key that starts with a digit. */
export type RampOverrides<K extends string> = { readonly [P in K as `_${P}`]: Hex };

/** A lightness ramp: `steps` colours from the first lightness to the second, evenly in OKLCH lightness. */
export interface LightnessOptions<N extends number> {
  readonly mode: "lightness";
  readonly steps: N;
  /** OKLCH lightness of the first and the last step, from 0 to 1; default `[0.97, 0.25]`. */
  readonly lightness?: readonly [number, number];
}

/** A contrast ramp: one step per ratio, each the lowest WCAG 2 ratio at or above it against `background`. */
export interface ContrastOptions<R extends readonly number[]> {
  readonly mode: "contrast";
  /** WCAG 2 contrast ratios against the background, from 1 to 21: `[1.2, 1.5, 3, 4.5, 7]`. */
  readonly ratios: R;
  /** An opaque CSS colour; the steps go darker on a light one and lighter on a dark one. */
  readonly background: string;
}

const toOklch = converter("oklch");
const toRgb = converter("rgb");
const inSrgb = inGamut("rgb");

const fail = (why: string): never => {
  throw new Error(`@cssints/ramp: ${why}`);
};

// The most chroma sRGB holds at a lightness and hue (bisection, the lower bound: always inside).
const maxChroma = (l: number, h: number): number => {
  if (l <= 0 || l >= 1) return 0;
  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inSrgb({ mode: "oklch", l, c: mid, h })) lo = mid;
    else hi = mid;
  }
  return lo;
};

const opaque = (text: string, what: string): Color => {
  const c = parse(text);
  if (!c) return fail(`${what} "${text}" is not a colour`);
  if ((c.alpha ?? 1) < 1) return fail(`${what} "${text}" is translucent`);
  return c;
};

// The hue and the relative chroma of the base (a grey has neither: a neutral ramp).
const shape = (base: string): { h: number; rel: number } => {
  const o = toOklch(opaque(base, "the base"));
  const h = o.h ?? 0;
  const max = maxChroma(o.l, h);
  return { h, rel: max > 0 ? Math.min(1, o.c / max) : 0 };
};

const at = (l: number, { h, rel }: { h: number; rel: number }): Hex =>
  formatHex(clampRgb(toRgb({ mode: "oklch", l, c: rel * maxChroma(l, h), h }))) as Hex;

/**
 * The relative luminance of a colour as css.check.contrast reads it (clipped to sRGB).
 * @param {string} text an opaque CSS colour
 * @returns {number} the WCAG 2 relative luminance, from 0 to 1
 */
export const luminance = (text: string): number =>
  wcagLuminance(clampRgb(opaque(text, "the colour")));

/**
 * The WCAG 2 contrast ratio of two relative luminances, as css.check.contrast computes it (not rounded).
 * @param {number} a a relative luminance
 * @param {number} b the other
 * @returns {number} the ratio, from 1 to 21
 */
export const ratio = (a: number, b: number): number =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const group = <K extends string>(steps: readonly Hex[]): Ramp<K> =>
  Object.fromEntries([
    ["$type", "color"],
    ...steps.map((hex, i) => [String(i + 1), { $value: hex }]),
  ]) as Ramp<K>;

const lightnessRamp = (
  base: string,
  { steps, lightness = [0.97, 0.25] }: LightnessOptions<number>,
) => {
  if (!Number.isInteger(steps) || steps < 1) fail(`steps is a whole number from 1, got ${steps}`);
  const [from, to] = lightness;
  if (!(from >= 0 && from <= 1 && to >= 0 && to <= 1))
    fail(`lightness is two numbers from 0 to 1, got [${from}, ${to}]`);
  const s = shape(base);
  return Array.from({ length: steps }, (_, i) =>
    at(steps === 1 ? from : from + ((to - from) * i) / (steps - 1), s),
  );
};

const contrastRamp = (base: string, { ratios, background }: ContrastOptions<readonly number[]>) => {
  const bgL = toOklch(opaque(background, "the background")).l;
  const bg = luminance(background);
  // the side with more room: darker on a light background, lighter on a dark one
  const darker = ratio(0, bg) >= ratio(1, bg);
  const s = shape(base);
  return ratios.map((r) => {
    if (!(r >= 1 && r <= 21)) fail(`a ratio is from 1 to 21, got ${r}`);
    const passes = (l: number) => ratio(luminance(at(l, s)), bg) >= r;
    // the far end passes unless the ratio is out of reach; then bisect between it and the background's lightness for the
    // step nearest the background that passes (`ok` always passes: the guarantee does not rest on the search)
    let ok = darker ? 0 : 1;
    let no = bgL;
    if (!passes(ok))
      fail(
        `ratio ${r} is out of reach on ${background}: at most ${ratio(darker ? 0 : 1, bg).toFixed(2)} (${darker ? "black" : "white"})`,
      );
    for (let i = 0; i < 32; i++) {
      const mid = (ok + no) / 2;
      if (passes(mid)) ok = mid;
      else no = mid;
    }
    return at(ok, s);
  });
};

/**
 * An OKLCH ramp of `base` as a DTCG colour group for createTokens, steps `"1"` to `"N"`, each a hex colour in sRGB.
 * `mode: "lightness"`: `steps` colours spaced evenly in OKLCH lightness. `mode: "contrast"`: one step per ratio, each the
 * colour of the base's hue with the lowest WCAG 2 ratio at or above it against `background`, so
 * `check.contrast(step, background, { min: ratio })` passes. Throws on a colour it cannot read or a ratio out of reach.
 */
export function ramp<const N extends number>(
  base: string,
  options: LightnessOptions<N>,
): Ramp<Keys<N>>;
export function ramp<const R extends readonly number[]>(
  base: string,
  options: ContrastOptions<R>,
): Ramp<Keys<R["length"]>>;
export function ramp(
  base: string,
  options: LightnessOptions<number> | ContrastOptions<readonly number[]>,
): Ramp<string> {
  return group(
    options.mode === "contrast" ? contrastRamp(base, options) : lightnessRamp(base, options),
  );
}

/**
 * A ramp as the overrides of a theme: `createGlobalTheme(t.blue, dark, overrides(ramp(…)))`.
 * @param {Ramp<K>} r a ramp
 * @returns {RampOverrides<K>} its steps as `{ _1: hex, … }`
 */
export const overrides = <K extends string>(r: Ramp<K>): RampOverrides<K> =>
  Object.fromEntries(
    Object.entries(r).flatMap(([k, v]: [string, unknown]) =>
      k === "$type" ? [] : [[`_${k}`, (v as { $value: Hex }).$value]],
    ),
  ) as RampOverrides<K>;
