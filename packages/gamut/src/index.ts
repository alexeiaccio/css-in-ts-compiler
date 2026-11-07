// @cssints/gamut: colour maths at build time. `fit` brings a colour into a gamut (sRGB or Display P3), `readable` moves a
// background's colour toward black or white until its WCAG 2 contrast reaches a ratio, and `tones` is a lightness scale of
// one colour as DTCG data for createTokens. The decisions are gamutant's, made in CSS; this package makes them once, when
// the module is evaluated, with culori. sRGB results are hex; a Display P3 result is `color(display-p3 r g b)`, because a
// hex cannot hold a colour sRGB cannot show.
import { clampRgb, converter, formatHex, inGamut, parse, wcagLuminance } from "culori";
import type { Color, Oklch } from "culori";

/** A hex colour: cheap in the types (createTokens checks it without the walk of every colour syntax). */
export type Hex = `#${string}`;

/** The step names of an N-tone scale: `"1"` to `"N"` (`t.blue._1` in code, `--blue-1` in CSS). */
export type Keys<N extends number, A extends string[] = []> = number extends N
  ? `${number}`
  : A["length"] extends N
    ? A[number]
    : Keys<N, [...A, `${[...A, 0]["length"]}`]>;

/** A tone scale: a DTCG colour group whose tokens are the steps, lightest first. */
export type Tones<N extends number> = { readonly $type: "color" } & {
  readonly [P in Keys<N>]: { readonly $value: Hex };
};

/** The options of `fit`. */
export interface FitOptions {
  /** The gamut to fit into. Default "srgb". */
  readonly target?: "srgb" | "display-p3" | undefined;
  /** "chroma" (default) reduces OKLCH chroma at constant lightness and hue; "clip" clips the RGB channels. */
  readonly method?: "chroma" | "clip" | undefined;
}

/** The options of `readable`. */
export interface ReadableOptions {
  /** The WCAG 2 ratio to reach, from 1 to 21; default 4.5. */
  readonly ratio?: number | undefined;
  /** "black" or "white" for that direction; "auto" (default): darker on a light background, lighter on a dark one. */
  readonly toward?: "black" | "white" | "auto" | undefined;
}

const toOklch = converter("oklch");
const toRgb = converter("rgb");
const toP3 = converter("p3");
const inTarget = { srgb: inGamut("rgb"), "display-p3": inGamut("p3") } as const;

const fail = (why: string): never => {
  throw new Error(`@cssints/gamut: ${why}`);
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// The most chroma sRGB holds at a lightness and hue (bisection, the lower bound: always inside).
const maxChroma = (l: number, h: number): number => {
  if (l <= 0 || l >= 1) return 0;
  let lo = 0;
  let hi = 0.5;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inTarget.srgb({ mode: "oklch", l, c: mid, h })) lo = mid;
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

// The hue and the relative chroma of a colour (a grey has neither: a neutral scale), relative to the sRGB gamut.
const shapeOf = (c: Color): { h: number; rel: number } => {
  const o = toOklch(c);
  const h = o.h ?? 0;
  const max = maxChroma(clamp01(o.l), h);
  return { h, rel: max > 0 ? Math.min(1, o.c / max) : 0 };
};

// The colour at a lightness with that hue and that share of the sRGB gamut: in sRGB by construction, never clipped.
const at = (l: number, { h, rel }: { h: number; rel: number }): Hex =>
  formatHex(clampRgb(toRgb({ mode: "oklch", l, c: rel * maxChroma(l, h), h }))) as Hex;

// A channel of `color(display-p3 …)`: four decimals, no trailing zeros, in 0..1.
const channel = (x: number) => String(Math.round(clamp01(x) * 1e4) / 1e4);

const p3String = (c: Color): string => {
  const { r, g, b } = toP3(c);
  return `color(display-p3 ${channel(r)} ${channel(g)} ${channel(b)})`;
};

const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * The nearest colour the target gamut can show.
 * @param {string} color an opaque CSS colour
 * @param {FitOptions} [options] the gamut (`"srgb"` by default) and the method (`"chroma"` by default)
 * @returns {string} a hex colour for sRGB, `color(display-p3 r g b)` for Display P3
 */
export const fit = (
  color: string,
  { target = "srgb", method = "chroma" }: FitOptions = {},
): string => {
  const c = opaque(color, "the colour");
  // already in the gamut: the same colour, in the target's syntax
  if (inTarget[target](c)) return target === "srgb" ? formatHex(clampRgb(c)) : p3String(c);
  // clip: the RGB channels, each held to 0..1 (`p3String` clamps as it formats)
  if (method === "clip") return target === "srgb" ? formatHex(clampRgb(c)) : p3String(c);
  // chroma: hold the lightness and the hue, take the largest chroma the target holds
  const o = toOklch(c);
  const l = clamp01(o.l);
  const h = o.h ?? 0;
  let lo = 0;
  let hi = o.c;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inTarget[target]({ mode: "oklch", l, c: mid, h })) lo = mid;
    else hi = mid;
  }
  const fitted: Oklch = { mode: "oklch", l, c: lo, h };
  return target === "srgb" ? formatHex(clampRgb(toRgb(fitted))) : p3String(fitted);
};

/**
 * A text colour with at least `ratio` WCAG 2 contrast on `bg`: the background's hue, its chroma relative to the sRGB
 * maximum, with the lightness nearest the background that passes.
 * @param {string} bg an opaque CSS colour
 * @param {ReadableOptions} [options] the ratio (4.5 by default) and the direction ("auto" by default)
 * @returns {Hex} a hex colour that reaches the ratio on `bg`
 */
export const readable = (
  bg: string,
  { ratio: want = 4.5, toward = "auto" }: ReadableOptions = {},
): Hex => {
  if (!(want >= 1 && want <= 21)) fail(`a ratio is from 1 to 21, got ${want}`);
  const background = opaque(bg, "the background");
  const bgLum = wcagLuminance(clampRgb(background));
  // the side with more room: darker on a light background, lighter on a dark one
  const darker = toward === "auto" ? ratio(0, bgLum) >= ratio(1, bgLum) : toward === "black";
  const far = darker ? 0 : 1;
  const farRatio = ratio(far, bgLum);
  if (farRatio < want)
    fail(
      `ratio ${want} is out of reach on ${bg}: at most ${farRatio.toFixed(2)} (${darker ? "black" : "white"})`,
    );
  const s = shapeOf(background);
  // nearest the background along the line (bisection on the hex it outputs, as check.contrast reads it)
  let ok = far;
  let no = clamp01(toOklch(background).l);
  for (let i = 0; i < 32; i++) {
    const mid = (ok + no) / 2;
    if (ratio(wcagLuminance(parse(at(mid, s)) as Color), bgLum) >= want) ok = mid;
    else no = mid;
  }
  return at(ok, s);
};

/**
 * `count` tones of one colour as DTCG data for createTokens: OKLCH lightness from 0.95 down to 0.10, evenly, hue held,
 * chroma relative to the sRGB cusp at that lightness, all in sRGB by construction. Steps `"1"` to `"N"`, lightest first.
 * @param {string} color an opaque CSS colour
 * @param {number} count how many tones, from 1
 * @returns {Tones<N>} a DTCG colour group, steps `"1"` to `"N"`
 */
export const tones = <const N extends number>(color: string, count: N): Tones<N> => {
  if (!Number.isInteger(count) || count < 1) fail(`count is a whole number from 1, got ${count}`);
  const s = shapeOf(opaque(color, "the colour"));
  const steps = Array.from({ length: count }, (_, i) =>
    at(count === 1 ? 0.95 : 0.95 - (0.85 * i) / (count - 1), s),
  );
  return Object.fromEntries([
    ["$type", "color"],
    ...steps.map((hex, i) => [String(i + 1), { $value: hex }]),
  ]) as Tones<N>;
};
