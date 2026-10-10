// The system theme (docs/research/tui.md "The system theme"): colour tokens as roles, a hue source and contrast rules,
// solved at run time against what the terminal reports (OSC 10/11/4, the colour-scheme report, COLORFGBG), and the
// parser of those replies for an adapter that reads stdin itself (./bomb.ts). The contrast maths is check.contrast's:
// culori's WCAG 2 luminance of the colour clipped to sRGB.
import {
  clampRgb,
  converter,
  formatHex,
  modeLrgb,
  modeOkhsl,
  modeOklab,
  modeOklch,
  modeRgb,
  parse,
  useMode,
  wcagLuminance,
} from "culori/fn";

import { defineTheme } from "./index.ts";

for (const mode of [modeRgb, modeLrgb, modeOklab, modeOklch, modeOkhsl]) useMode(mode);
const toOkhsl = converter("okhsl");
const toOklch = converter("oklch");
const toRgb = converter("rgb");

/** The 16 ANSI colours, by their index. */
export const SLOTS = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
] as const;
export type Slot = (typeof SLOTS)[number];
/** Where a role takes its hue: an ANSI colour, or the terminal's default foreground or background. */
export type Hue = Slot | "fg" | "bg";
export type Appearance = "dark" | "light";

/** A colour token of `createTokens` (its text at run time: `var(--name)`). */
export type ColourToken = string | { readonly "~token": "color" };
/** A colour token as a role of the system theme. */
export interface Role {
  /** The hue source (default `"fg"`, `"bg"` for a surface). */
  hue?: Hue;
  /** The tokens it sits on (each must have a role). */
  on?: readonly ColourToken[];
  /** The WCAG 2 ratio against each of `on`: the least for text, the exact one (to the first) for a surface. */
  contrast?: number;
  /** A background: placed at `contrast` from its first `on`, toward the foreground; the terminal's background without. */
  surface?: boolean;
  /** What the terminal draws when it reports nothing: an ANSI index, or its default colour. */
  ansi?: number | "default";
}
/** The roles of a token set, in its shape: a role per colour token, any left out. */
export type Roles<T> = {
  [K in keyof T]?: T[K] extends ColourToken
    ? Role
    : T[K] extends { readonly "~token": unknown }
      ? never
      : Roles<T[K]>;
};

/** What a terminal reported: `#rrggbb` colours (`undefined` or `null`: no answer) and its colour scheme. */
export interface Report {
  fg?: string | null;
  bg?: string | null;
  ansi?: readonly (string | null | undefined)[];
  scheme?: Appearance | null;
}
export interface SolveOptions {
  /** Whether the renderer draws ANSI indices (`ansi:N`, `default`); without, a terminal that reports nothing keeps the static theme. */
  indexed?: boolean;
  /** The `COLORFGBG` variable (default: the environment's). */
  colorfgbg?: string;
}
export interface Solved {
  appearance: Appearance;
  /** A colour per token name (`color-bg` for `var(--color-bg)`). */
  values: Record<string, string>;
  /** The static theme under it: what a token without a role, or every token without a palette, keeps. */
  base: string;
}
export interface SystemOptions {
  /** The theme's name for `setTheme` (default `"system"`). */
  name?: string;
  /** The app's own colour per slot, for what the terminal did not report (default: an xterm-like palette). */
  hues?: Partial<Record<Hue, string>>;
  /** The static theme under the system theme, per appearance (default `""`, the default values). */
  themes?: Partial<Record<Appearance, string>>;
}
export interface SystemTheme {
  readonly name: string;
  /** The values of every role for a report. */
  solve(report: Report, options?: SolveOptions): Solved;
  /** `solve`, then `defineTheme(name, values, base)`. */
  apply(report: Report, options?: SolveOptions): Solved;
}

// The hues of a terminal that reports none (VS Code's terminal defaults).
const HUES: Record<Slot, string> = {
  black: "#000000",
  red: "#cd3131",
  green: "#0dbc79",
  yellow: "#e5e510",
  blue: "#2472c8",
  magenta: "#bc3fbc",
  cyan: "#11a8cd",
  white: "#e5e5e5",
  brightBlack: "#666666",
  brightRed: "#f14c4c",
  brightGreen: "#23d18b",
  brightYellow: "#f5f543",
  brightBlue: "#3b8eea",
  brightMagenta: "#d670d6",
  brightCyan: "#29b8db",
  brightWhite: "#e5e5e5",
};

const TOKEN = /^var\(--([\w-]+)\)$/;
const nameOf = (token: unknown, where: string): string => {
  const name = typeof token === "string" ? TOKEN.exec(token)?.[1] : undefined;
  if (!name) throw new Error(`cssints: ${where}: ${String(token)} is no token of createTokens`);
  return name;
};

/**
 * The relative luminance of a colour (WCAG 2), as check.contrast reads it.
 *
 * @param {string} hex a colour
 * @returns {number} its luminance, 0 to 1
 */
export const luminance = (hex: string): number => {
  const c = parse(hex);
  if (!c) throw new Error(`cssints: ${hex} is not a colour`);
  return wcagLuminance(clampRgb(c));
};
/**
 * The WCAG 2 contrast ratio of two colours.
 *
 * @param {string} a a colour
 * @param {string} b another
 * @returns {number} the ratio, 1 to 21
 */
export const contrast = (a: string, b: string): number => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

interface Source {
  h: number;
  s: number;
  l: number;
  c: number;
  hex: string;
}
const sourceOf = (hex: string): Source => {
  const c = parse(hex)!;
  const hsl = toOkhsl(c);
  return { h: hsl.h ?? 0, s: hsl.s, l: hsl.l, c: toOklch(c).c, hex: formatHex(c) };
};
// Saturation falls off toward black and white: full at the middle, a hint near the ends.
const bell = (l: number) => Math.sqrt(Math.max(0, 4 * l * (1 - l)));
// The source at OKHSL lightness l: its hue, its saturation under the bell (relative to its own lightness, so an unmoved
// colour is itself), the OKLCH chroma capped at the source's.
const at = (src: Source, l: number): string => {
  const s = src.s * Math.min(1, bell(l) / Math.max(bell(src.l), 1e-6));
  const lch = toOklch({ mode: "okhsl", h: src.h, s, l });
  return formatHex(clampRgb(toRgb({ ...lch, c: Math.min(lch.c, src.c) })));
};

// The lightness nearest the source (`from`, on side `up`) whose colour passes `ok`, by bisection: luminance grows
// with OKHSL lightness at a fixed hue and saturation.
const bisect = (src: Source, ok: (hex: string) => boolean, up: boolean, from = src.l): string => {
  let [lo, hi] = up ? [from, 1] : [0, from];
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (ok(at(src, mid)) === up) hi = mid;
    else lo = mid;
  }
  // the hex is rounded: step on until it passes
  let l = up ? hi : lo;
  let hex = at(src, l);
  for (let i = 0; i < 100 && !ok(hex) && l > 0 && l < 1; i++) {
    l = Math.min(1, Math.max(0, l + (up ? 0.002 : -0.002)));
    hex = at(src, l);
  }
  return hex;
};

// A text colour: the source if it meets every rule, else the lightness of the strictest rule on its own side (the
// other when that one is out of reach).
const text = (src: Source, on: string[], k: number, dark: boolean): string => {
  const meets = (hex: string) => on.every((s) => contrast(hex, s) >= k - 1e-9);
  if (meets(src.hex)) return src.hex;
  const ys = on.map(luminance);
  const y = luminance(src.hex);
  const above = Math.max(...ys.map((v) => (v + 0.05) * k - 0.05));
  const below = Math.min(...ys.map((v) => (v + 0.05) / k - 0.05));
  const first = y >= Math.max(...ys) ? true : y <= Math.min(...ys) ? false : dark;
  for (const up of [first, !first])
    if (up ? above <= 1 : below >= 0)
      return bisect(
        src,
        up ? (h) => luminance(h) >= above && meets(h) : (h) => luminance(h) <= below && meets(h),
        up,
      );
  // out of reach on both sides: the end with the most contrast
  const worst = (hex: string) => Math.min(...on.map((s) => contrast(hex, s)));
  const [white, black] = [at(src, 1), at(src, 0)];
  return worst(white) >= worst(black) ? white : black;
};

// A surface: exactly `k` from `under`, toward the foreground (away from it when that is out of reach).
const surface = (src: Source, under: string, k: number, dark: boolean): string => {
  const y = luminance(under);
  for (const up of [dark, !dark]) {
    const target = up ? (y + 0.05) * k - 0.05 : (y + 0.05) / k - 0.05;
    if (up ? target <= 1 : target >= 0)
      return bisect(
        src,
        up ? (h) => luminance(h) >= target : (h) => luminance(h) <= target,
        up,
        up ? 0 : 1,
      );
  }
  return src.hex;
};

const appearanceOf = (report: Report, colorfgbg: string | undefined): Appearance => {
  if (report.bg) {
    const y = luminance(report.bg);
    return (report.fg ? y < luminance(report.fg) : y < 0.18) ? "dark" : "light";
  }
  if (report.scheme) return report.scheme;
  const last = colorfgbg?.split(";").at(-1);
  if (last && /^\d+$/.test(last)) return Number(last) <= 6 || Number(last) === 8 ? "dark" : "light";
  return "dark";
};

interface Entry {
  name: string;
  role: Role;
  on: string[];
}

/**
 * A system theme: each token of `roles` takes its hue from a colour of the terminal and its lightness from its contrast
 * rules against the tokens it sits on. Checks the roles (an `on` without a role, a cycle) and orders them.
 *
 * @param {object} tokens the tokens of `createTokens` (cssints/tui)
 * @param {Roles} roles a role per colour token, in the shape of `tokens`
 * @param {SystemOptions} options the name, the app's own hues, the static theme under it
 * @returns {SystemTheme} the theme, for `followSystemTheme` of an adapter, or `solve` and `apply`
 */
export const createSystemTheme = <T extends object>(
  tokens: T,
  roles: Roles<T>,
  options: SystemOptions = {},
): SystemTheme => {
  const entries = new Map<string, Entry>();
  const walk = (t: Record<string, unknown>, r: Record<string, unknown>, path: string) => {
    for (const [k, role] of Object.entries(r)) {
      const token = t[k];
      if (typeof token === "string") {
        const name = nameOf(token, `${path}${k}`);
        const on = ((role as Role).on ?? []).map((o) => nameOf(o, `${path}${k}.on`));
        entries.set(name, { name, role: role as Role, on });
      } else if (token && typeof token === "object" && role && typeof role === "object")
        walk(token as Record<string, unknown>, role as Record<string, unknown>, `${path}${k}.`);
      else throw new Error(`cssints: ${path}${k} is no token of createTokens`);
    }
  };
  walk(tokens as Record<string, unknown>, roles, "");
  // the roles in the order of `on`: a surface before what sits on it
  const order: Entry[] = [];
  const state = new Map<string, "visiting" | "done">();
  const visit = (e: Entry) => {
    if (state.get(e.name) === "done") return;
    if (state.get(e.name) === "visiting")
      throw new Error(`cssints: the roles of ${e.name} sit on each other (a cycle of on)`);
    state.set(e.name, "visiting");
    for (const o of e.on) {
      const dep = entries.get(o);
      if (!dep) throw new Error(`cssints: ${e.name} sits on ${o}, which has no role`);
      visit(dep);
    }
    state.set(e.name, "done");
    order.push(e);
  };
  for (const e of entries.values()) visit(e);

  const name = options.name ?? "system";
  const solve = (report: Report, { indexed = false, colorfgbg }: SolveOptions = {}): Solved => {
    // @effect-diagnostics-next-line processEnv:off -- plain run-time code of a terminal app (plainCode), no Effect
    const appearance = appearanceOf(report, colorfgbg ?? globalThis.process?.env.COLORFGBG);
    const base = options.themes?.[appearance] ?? "";
    const values: Record<string, string> = {};
    if (!report.bg) {
      if (indexed)
        for (const { name: n, role } of order) {
          const hue = role.hue ?? (role.surface ? "bg" : "fg");
          const slot = SLOTS.indexOf(hue as Slot);
          const ansi = role.ansi ?? (role.surface || slot < 0 ? "default" : slot);
          values[n] = ansi === "default" ? "default" : `ansi:${ansi}`;
        }
      return { appearance, values, base };
    }
    const dark = appearance === "dark";
    const hex = (hue: Hue): string => {
      if (hue === "bg") return report.bg!;
      if (hue === "fg") return report.fg ?? options.hues?.fg ?? (dark ? "#ffffff" : "#000000");
      const i = SLOTS.indexOf(hue);
      return report.ansi?.[i] ?? options.hues?.[hue] ?? HUES[hue];
    };
    for (const { name: n, role, on } of order) {
      const src = sourceOf(hex(role.hue ?? (role.surface ? "bg" : "fg")));
      const under = on.map((o) => values[o]!);
      const k = role.contrast;
      values[n] =
        k === undefined || !under.length
          ? src.hex
          : role.surface
            ? surface(src, under[0]!, k, dark)
            : text(src, under, k, dark);
    }
    return { appearance, values, base };
  };
  return {
    name,
    solve,
    apply: (report, o) => {
      const solved = solve(report, o);
      defineTheme(name, solved.values, solved.base);
      return solved;
    },
  };
};

// ---------- the terminal's replies

/** OSC 10 and 11 (the default colours), OSC 4 for the 16 ANSI colours, and the colour-scheme report (`CSI ? 996 n`). */
export const QUERY = [
  "\x1b]10;?\x1b\\",
  "\x1b]11;?\x1b\\",
  ...SLOTS.map((_, i) => `\x1b]4;${i};?\x1b\\`),
  "\x1b[?996n",
].join("");
/** Mode 2031 on: the terminal sends `CSI ? 997 ; 1|2 n` when its palette changes. */
export const NOTIFY = "\x1b[?2031h";
/** Mode 2031 off. */
export const UNNOTIFY = "\x1b[?2031l";

/** What one chunk of input held of the terminal's replies. */
export interface Replies {
  fg?: string;
  bg?: string;
  /** The ANSI colours it reported, by index. */
  ansi: Map<number, string>;
  /** The colour scheme of a `CSI ? 997 ; 1|2 n` (a reply to the query, or a notification of a change). */
  scheme?: Appearance;
}

const REPLY =
  // eslint-disable-next-line no-control-regex
  /\x1b\](10|11|4;(\d+));(?:rgba?:([0-9a-f]{1,4})\/([0-9a-f]{1,4})\/([0-9a-f]{1,4})(?:\/[0-9a-f]{1,4})?|#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{12}))(?:\x07|\x1b\\)|\x1b\[\?997;([12])n/gi;
// a reply cut off at the end of a chunk: kept for the next one
// eslint-disable-next-line no-control-regex
const CUT = /\x1b(?:\][^\x07\x1b]*(?:\x1b)?|\[\?(?:9(?:9(?:7(?:;\d?)?)?)?)?)$/;

const channel = (h: string) => Math.round((Number.parseInt(h, 16) / (16 ** h.length - 1)) * 255);
const hexOf = (r: string, g: string, b: string) =>
  `#${[r, g, b].map((h) => channel(h).toString(16).padStart(2, "0")).join("")}`;

/**
 * Takes the terminal's replies (OSC 10, 11 and 4, `CSI ? 997 n`) out of a chunk of input, as text of one char per byte.
 *
 * @param {string} text the chunk, after what `tail` of the last one kept
 * @returns {object} the replies, the rest of the input (keys, mouse), and the tail of a reply cut off at the end
 */
export const scan = (text: string): { replies: Replies; rest: string; tail: string } => {
  const replies: Replies = { ansi: new Map() };
  const cut = CUT.exec(text);
  const tail = cut ? cut[0] : "";
  const body = cut ? text.slice(0, cut.index) : text;
  const rest = body.replace(REPLY, (...m: (string | undefined)[]) => {
    const [, what, index, r = "", g = "", b = "", hash, scheme] = m;
    if (scheme) {
      replies.scheme = scheme === "1" ? "dark" : "light";
      return "";
    }
    let colour: string;
    if (hash) {
      const n = hash.length / 3;
      colour = hexOf(hash.slice(0, n), hash.slice(n, 2 * n), hash.slice(2 * n));
    } else colour = hexOf(r, g, b);
    if (what === "10") replies.fg = colour;
    else if (what === "11") replies.bg = colour;
    else if (Number(index) < 16) replies.ansi.set(Number(index), colour);
    return "";
  });
  return { replies, rest, tail };
};
