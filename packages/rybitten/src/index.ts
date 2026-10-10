// @cssints/rybitten: colours of RYBitten (https://rybitten.space, MIT, meodai) as DTCG data for createTokens, computed when
// the module is evaluated (build time). RYBitten maps red-yellow-blue coordinates to RGB through a "cube" (the eight corners
// of a colour model: white, red, yellow, orange, blue, violet, green, black), and ships about 36 historical ones (Itten,
// Munsell, Albers, ...). Here a hue in degrees (0 red, 120 yellow, 240 blue, as a painter's wheel) plus saturation and
// lightness give a hex colour in the cube, a wheel of hues and a run of lightnesses are colour groups, and a theme takes
// their overrides. The output is sRGB hex, so check.contrast reads it as it reads any other token.
import { rybHsl2rgb } from "rybitten";
import { cubes } from "rybitten/cubes";
import type { ColorCube } from "rybitten/cubes";

/** A hex colour: cheap in the types (createTokens checks it without the walk of every colour syntax). */
export type Hex = `#${string}`;

/** The step names of an N-step group: `"1"` to `"N"` (`t.wheel._1` in code, `--wheel-1` in CSS). */
export type Keys<N extends number, A extends string[] = []> = number extends N
  ? `${number}`
  : A["length"] extends N
    ? A[number]
    : Keys<N, [...A, `${[...A, 0]["length"]}`]>;

/** A colour group: a DTCG group whose tokens are the steps. */
export type Palette<K extends string> = { readonly $type: "color" } & {
  readonly [P in K]: { readonly $value: Hex };
};

/** The overrides of a group for createGlobalTheme: a step `"1"` is `_1`, as cssints reads a key that starts with a digit. */
export type PaletteOverrides<K extends string> = { readonly [P in K as `_${P}`]: Hex };

/** Which colours a hue becomes. */
export interface Options {
  /** A key of RYBitten's `cubes` (`"itten"`, `"munsell"`, `"albers"`, ...) or a cube of eight RGB corners; default `"itten"`. */
  readonly cube?: string | ColorCube;
  /** HSL saturation from 0 (the cube's greys) to 1; default 1. */
  readonly saturation?: number;
  /** HSL lightness from 0 (the cube's black) to 1 (its white); default 0.5. */
  readonly lightness?: number;
}

const fail = (why: string): never => {
  throw new Error(`@cssints/rybitten: ${why}`);
};

const cubeOf = (cube: string | ColorCube = "itten"): ColorCube =>
  typeof cube === "string"
    ? (cubes.get(cube)?.cube ?? fail(`no cube "${cube}" in RYBitten's cubes`))
    : cube;

const unit = (x: number, what: string): number =>
  x >= 0 && x <= 1 ? x : fail(`${what} is from 0 to 1, got ${x}`);

const hex = (rgb: readonly number[]): Hex =>
  `#${rgb
    .map((x) =>
      Math.round(Math.min(1, Math.max(0, x)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

/**
 * The sRGB hex colour of a hue in a cube.
 * @param {number} hue degrees on the RYB wheel, any number (360 is 0)
 * @param {Options} options the cube, saturation and lightness
 * @returns {Hex} `#rrggbb`
 */
export const color = (hue: number, options: Options = {}): Hex => {
  const { cube, saturation = 1, lightness = 0.5 } = options;
  if (!Number.isFinite(hue)) fail(`hue is a number of degrees, got ${hue}`);
  return hex(
    rybHsl2rgb(
      [((hue % 360) + 360) % 360, unit(saturation, "saturation"), unit(lightness, "lightness")],
      {
        cube: cubeOf(cube),
      },
    ),
  );
};

const group = <K extends string>(colors: readonly Hex[]): Palette<K> =>
  Object.fromEntries([
    ["$type", "color"],
    ...colors.map((c, i) => [String(i + 1), { $value: c }]),
  ]) as Palette<K>;

/**
 * `steps` hues evenly round the wheel, from `from` degrees (default 0, red), as a colour group `"1"` to `"N"`.
 * @param {number} steps how many hues, a whole number from 1
 * @param {Options & { from?: number }} options the cube, saturation and lightness of every step
 * @returns {Palette<Keys<N>>} a DTCG colour group for createTokens
 */
export const wheel = <const N extends number>(
  steps: N,
  { from = 0, ...options }: Options & { readonly from?: number } = {},
): Palette<Keys<N>> => {
  if (!Number.isInteger(steps) || steps < 1) fail(`steps is a whole number from 1, got ${steps}`);
  return group(Array.from({ length: steps }, (_, i) => color(from + (360 * i) / steps, options)));
};

/**
 * One hue at several lightnesses, one step per value, in the order given (1 is the cube's white, 0 its black).
 * @param {number} hue degrees on the RYB wheel
 * @param {readonly number[]} lightness the lightness of each step, from 0 to 1
 * @param {Omit<Options, "lightness">} options the cube and the saturation
 * @returns {Palette<Keys<R["length"]>>} a DTCG colour group for createTokens
 */
export const shades = <const R extends readonly number[]>(
  hue: number,
  lightness: R,
  options: Omit<Options, "lightness"> = {},
): Palette<Keys<R["length"]>> =>
  group(lightness.map((l) => color(hue, { ...options, lightness: l })));

/**
 * A group as the overrides of a theme: `createGlobalTheme(t.wheel, dark, overrides(wheel(12, { cube: "munsell" })))`.
 * @param {Palette<K>} p a group of `wheel` or `shades`
 * @returns {PaletteOverrides<K>} its steps as `{ _1: hex, … }`
 */
export const overrides = <K extends string>(p: Palette<K>): PaletteOverrides<K> =>
  Object.fromEntries(
    Object.entries(p).flatMap(([k, v]: [string, unknown]) =>
      k === "$type" ? [] : [[`_${k}`, (v as { $value: Hex }).$value]],
    ),
  ) as PaletteOverrides<K>;
