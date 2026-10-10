import { luminance, ramp, ratio } from "../../../packages/ramp/src/index.ts";
import { color, shades } from "../../../packages/rybitten/src/index.ts";
import type { Hex } from "../../../packages/rybitten/src/index.ts";
import { flexoki } from "../../../packages/tokens/src/flexoki.ts";
import { colors as openProps } from "../../../packages/tokens/src/open-props.ts";
import { dark as radixDark, light as radixLight } from "../../../packages/tokens/src/radix.ts";
import { reasonableColors } from "../../../packages/tokens/src/reasonable-colors.ts";

// The palettes of the settings panel, as plain data computed when the module is evaluated (theme.ts at build time, the contrast
// test in Node): the colours of the three modes, light, dark and dim, for a palette and a hue. Nothing here ships to the browser.
// The packages are imported by path: they have no dist in the repository, which the build's own module runner would need.
// A RYBitten palette takes its paper, ink and hues from a cube of RYBitten (@cssints/rybitten) and finds the text and accent
// steps that hold the contrast floors with @cssints/ramp; a set of @cssints/tokens is mapped by hand, step by step.
export const NEUTRALS = [
  "bg",
  "bgSubtle",
  "bgMuted",
  "border",
  "borderStrong",
  "textLow",
  "textMedium",
  "text",
] as const;
export const ACCENTS = ["accent", "accentSoft", "accentStrong", "link", "onAccent"] as const;
export type Neutral = (typeof NEUTRALS)[number];
export type Accent = (typeof ACCENTS)[number];
export type Colors = Record<Neutral | Accent, Hex>;
/** Dim is dark with lifted neutrals: the page has both classes, so its accents are the dark ones. */
export interface Palette {
  readonly light: Colors;
  readonly dark: Colors;
  readonly dim: Record<Neutral, Hex>;
}

/** The ids of the settings panel, in its order. */
export const IDS = [
  "cssints",
  "itten",
  "munsell",
  "albers",
  "radix",
  "flexoki",
  "open-props",
  "reasonable-colors",
] as const;
export type Id = (typeof IDS)[number];
/** The palettes of a RYBitten cube: their accent is a step of a wheel of HUES (30 degrees of RYB each). */
export const CUBES = ["itten", "munsell", "albers"] as const;
export const HUES = 12;
/** 270 degrees: Itten's indigo. */
export const DEFAULT_HUE = 9;

const hex = (g: unknown): Hex => (g as { $value: Hex }).$value;
const step = (r: unknown): Hex => hex((r as Record<string, unknown>)["1"]);
const contrast = (base: string, background: string, min: number) =>
  step(ramp(base, { mode: "contrast", ratios: [min], background }));
// black or white, whichever reads better on a fill (never under 4.58)
const onAccent = (fill: string): Hex =>
  ratio(luminance(fill), 0) >= ratio(luminance(fill), 1) ? "#000000" : "#ffffff";

// ---- RYBitten: the lightness of paper, borders and fills in the cube, from its white (1) to its black (0)
const LIGHTNESS = {
  light: [1, 0.94, 0.89, 0.84, 0.72],
  dark: [0, 0.08, 0.15, 0.22, 0.35],
  dim: [0.08, 0.14, 0.2, 0.26, 0.36],
} as const;

// The neutrals of a mode: the cube's own greys for paper and borders, an ink of the same tint with the ratios the site needs
// (7 and 4.5 on every paper for text and medium; low is held to 4.5 on bg and bgSubtle).
const neutrals = (cube: string, mode: keyof typeof LIGHTNESS): Record<Neutral, Hex> => {
  const g = shades(0, LIGHTNESS[mode], { cube, saturation: 0 });
  const [bg, bgSubtle, bgMuted, border, borderStrong] = (["1", "2", "3", "4", "5"] as const).map(
    (k) => hex(g[k]),
  ) as [Hex, Hex, Hex, Hex, Hex];
  const ink = color(0, { cube, saturation: 0, lightness: 0.5 });
  return {
    bg,
    bgSubtle,
    bgMuted,
    border,
    borderStrong,
    textLow: contrast(ink, bgSubtle, 4.6),
    textMedium: contrast(ink, bgMuted, 6),
    text: contrast(ink, bgMuted, 9),
  };
};

// The accent of a hue on a mode's papers: accent 3 on the lighter-to-read paper (graphics), link 4.6, accentStrong 4.6 on
// accentSoft, a soft tint at one lightness. `paper` is the paper that the foreground reads worst on.
const accents = (base: string, paper: string, soft: number): Record<Accent, Hex> => {
  const accentSoft = step(ramp(base, { mode: "lightness", steps: 1, lightness: [soft, soft] }));
  const accent = contrast(base, paper, 3.1);
  return {
    accent,
    accentSoft,
    accentStrong: contrast(base, accentSoft, 4.6),
    link: contrast(base, paper, 4.6),
    onAccent: onAccent(accent),
  };
};

const cache = new Map<string, Palette>();
const cube = (name: string, hue: number): Palette => {
  const key = `${name}:${hue}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const light = neutrals(name, "light");
  const dark = neutrals(name, "dark");
  const dim = neutrals(name, "dim");
  const base = color(hue * (360 / HUES), { cube: name });
  const p: Palette = {
    // the papers an accent reads worst on: light's bgSubtle, and dim's (the lightest of the dark and the dim papers)
    light: { ...light, ...accents(base, light.bgSubtle, 0.95) },
    dark: { ...dark, ...accents(base, dim.bgSubtle, 0.27) },
    dim,
  };
  cache.set(key, p);
  return p;
};

// ---- the sets of @cssints/tokens, by hand: a role is "scale.step" of the set or a hex colour. Radix's steps have a meaning (1
// app background, 3 component, 6 and 7 borders, 11 and 12 text); Flexoki and Open Props are one scale each; Reasonable Colors
// has six steps a scale, so its papers are flat.
type Set = Record<string, Record<string, unknown>>;
type Roles = Record<Exclude<Neutral | Accent, "onAccent">, string>;
const set = (light: Set, dark: Set, roles: { light: Roles; dark: Roles; dim: Partial<Roles> }) => {
  const get = (s: Set, role: string): Hex => {
    if (role.startsWith("#")) return role as Hex;
    const [scale, k] = role.split(".") as [string, string];
    // Radix's dark theme is overrides (`_1: "#111111"`), its other sets are groups (`"1": { $value }`)
    const v = s[scale]?.[k] ?? s[scale]?.[`_${k}`];
    if (!v) throw new Error(`palettes: no ${role}`);
    return typeof v === "string" ? (v as Hex) : hex(v);
  };
  const colors = (s: Set, r: Roles): Colors => {
    const c = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, get(s, v)])) as Record<
      Exclude<Neutral | Accent, "onAccent">,
      Hex
    >;
    return { ...c, onAccent: onAccent(c.accent) };
  };
  const d = colors(dark, roles.dark);
  const dim = Object.fromEntries(
    NEUTRALS.map((k) => [k, roles.dim[k] ? get(dark, roles.dim[k]) : d[k]]),
  ) as Record<Neutral, Hex>;
  return (): Palette => ({ light: colors(light, roles.light), dark: d, dim });
};

const radix = {
  bg: "gray.1",
  bgSubtle: "gray.2",
  bgMuted: "gray.3",
  border: "gray.6",
  borderStrong: "gray.7",
  textLow: "gray.11",
  textMedium: "gray.11",
  text: "gray.12",
  accent: "indigo.9",
  accentSoft: "indigo.3",
  accentStrong: "indigo.11",
  link: "indigo.11",
} satisfies Roles;
const flexokiLight = {
  bg: "base.paper",
  bgSubtle: "base.50",
  bgMuted: "base.100",
  border: "base.150",
  borderStrong: "base.300",
  textLow: "base.700",
  textMedium: "base.800",
  text: "base.black",
  accent: "blue.600",
  accentSoft: "blue.50",
  accentStrong: "blue.800",
  link: "blue.700",
} satisfies Roles;
const openPropsLight = {
  bg: "gray.0",
  bgSubtle: "gray.1",
  bgMuted: "gray.2",
  border: "gray.3",
  borderStrong: "gray.5",
  textLow: "gray.7",
  textMedium: "gray.8",
  text: "gray.12",
  accent: "blue.7",
  accentSoft: "blue.0",
  accentStrong: "blue.10",
  link: "blue.8",
} satisfies Roles;
const reasonableLight = {
  bg: "#ffffff",
  bgSubtle: "gray.1",
  bgMuted: "gray.2",
  border: "gray.2",
  borderStrong: "gray.3",
  textLow: "gray.4",
  textMedium: "gray.5",
  text: "gray.6",
  accent: "azure.4",
  accentSoft: "azure.1",
  accentStrong: "azure.5",
  link: "azure.4",
} satisfies Roles;

// ---- cssints: the logo. The neutrals are tinted with its purple (#663399, hue 303 in OKLCH), the accent is its TypeScript blue
// (#3178C6) as it is on light paper; the dark modes take it lighter (as the wordmark does), and the steps that must read as text
// are found by contrast like the cubes' are.
const TS = "#3178c6";
const logo = (): Palette => {
  const light: Record<Neutral, Hex> = {
    bg: "#fefdff",
    bgSubtle: "#f7f5fa",
    bgMuted: "#eeebf5",
    border: "#e5e0ed",
    borderStrong: "#cdc5d9",
    textLow: "#685e76",
    textMedium: "#494057",
    text: "#1c1426",
  };
  const dark: Record<Neutral, Hex> = {
    bg: "#110d17",
    bgSubtle: "#18131f",
    bgMuted: "#241e2e",
    border: "#312a3c",
    borderStrong: "#4c435a",
    textLow: "#a399b3",
    textMedium: "#bfb6ce",
    text: "#ede9f2",
  };
  const dim: Record<Neutral, Hex> = {
    bg: "#211b29",
    bgSubtle: "#292333",
    bgMuted: "#362e42",
    border: "#443b51",
    borderStrong: "#5d526d",
    textLow: "#b0a5c0",
    textMedium: "#c8bfd7",
    text: "#f0edf5",
  };
  const soft = step(ramp(TS, { mode: "lightness", steps: 1, lightness: [0.95, 0.95] }));
  const darkSoft = step(ramp(TS, { mode: "lightness", steps: 1, lightness: [0.27, 0.27] }));
  return {
    light: {
      ...light,
      accent: TS,
      accentSoft: soft,
      accentStrong: contrast(TS, soft, 4.6),
      link: contrast(TS, light.bgSubtle, 4.6),
      onAccent: onAccent(TS),
    },
    // the papers an accent reads worst on in the dark modes are dim's
    dark: { ...dark, ...accents("#5b9be0", dim.bgSubtle, 0.27), accentSoft: darkSoft },
    dim,
  };
};

/** A palette at a hue (a step of the wheel, 0 to HUES - 1); the sets of tokens have one accent and ignore it. */
export const palettes: Record<Id, (hue: number) => Palette> = {
  cssints: logo,
  itten: (hue) => cube("itten", hue),
  munsell: (hue) => cube("munsell", hue),
  albers: (hue) => cube("albers", hue),
  radix: set(radixLight, radixDark, {
    light: radix,
    dark: radix,
    dim: {
      bg: "gray.2",
      bgSubtle: "gray.3",
      bgMuted: "gray.4",
      border: "gray.7",
      borderStrong: "gray.8",
    },
  }),
  flexoki: set(flexoki, flexoki, {
    light: flexokiLight,
    dark: {
      bg: "base.black",
      bgSubtle: "base.950",
      bgMuted: "base.900",
      border: "base.850",
      borderStrong: "base.700",
      textLow: "base.500",
      textMedium: "base.300",
      text: "base.200",
      accent: "blue.400",
      accentSoft: "blue.950",
      accentStrong: "blue.200",
      link: "blue.300",
    },
    dim: {
      bg: "base.950",
      bgSubtle: "base.900",
      bgMuted: "base.850",
      border: "base.800",
      borderStrong: "base.700",
      textLow: "base.400",
    },
  }),
  "open-props": set(openProps, openProps, {
    light: openPropsLight,
    dark: {
      bg: "gray.12",
      bgSubtle: "gray.11",
      bgMuted: "gray.10",
      border: "gray.9",
      borderStrong: "gray.8",
      textLow: "gray.5",
      textMedium: "gray.3",
      text: "gray.1",
      accent: "blue.4",
      accentSoft: "blue.12",
      accentStrong: "blue.2",
      link: "blue.3",
    },
    dim: {
      bg: "gray.11",
      bgSubtle: "gray.10",
      bgMuted: "gray.9",
      border: "gray.8",
      borderStrong: "gray.7",
    },
  }),
  "reasonable-colors": set(reasonableColors, reasonableColors, {
    light: reasonableLight,
    dark: {
      bg: "gray.6",
      bgSubtle: "gray.5",
      bgMuted: "gray.5",
      border: "gray.4",
      borderStrong: "gray.3",
      textLow: "gray.2",
      textMedium: "gray.2",
      text: "gray.1",
      accent: "azure.3",
      accentSoft: "azure.6",
      accentStrong: "azure.1",
      link: "azure.2",
    },
    dim: {
      bg: "gray.5",
      bgSubtle: "gray.5",
      bgMuted: "gray.5",
      border: "gray.4",
      borderStrong: "gray.3",
    },
  }),
};
