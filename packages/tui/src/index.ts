// The renderer-neutral runtime of cssints/tui styles (docs/research/tui.md): the props of a style in a state and a theme,
// the theme in use, and the run-time theme table (`defineTheme`, which the system theme fills: ./system.ts). An adapter
// (./opentui.ts, ./bomb.ts) sets what `resolve` gives on its renderables. Plain, no imports.
import type { TuiLayer, TuiProps, TuiShape } from "cssints/tui";

export type { TuiProps, TuiShape } from "cssints/tui";

/** The states a renderable is in. */
export interface TuiState {
  hover?: boolean;
  focus?: boolean;
  active?: boolean;
}

const STATES = [":hover", ":focus", ":active"] as const;

const own = (out: Record<string, unknown>, layer: TuiLayer | undefined) => {
  if (layer)
    for (const [k, v] of Object.entries(layer))
      if (k !== "themes" && k !== "vars" && !k.startsWith(":")) out[k] = v;
};

/** The token of each colour prop set to one, per state, as a site of cssints/tui holds it. */
type Vars = Record<string, string | Record<string, string> | undefined>;
type Shape = TuiShape & { vars?: Vars };

let current = "";
const listeners = new Set<(name: string) => void>();
const table = new Map<string, { values: Record<string, string>; base: string }>();

/**
 * The theme in use.
 *
 * @returns {string} a name of `createGlobalTheme(tokens, name, ...)`, `""` for the default values
 */
export const theme = (): string => current;

/**
 * Swaps the theme of every renderable an adapter has attached: their props are resolved again.
 *
 * @param {string} name a name of `createGlobalTheme(tokens, name, ...)`, `""` for the default values
 */
export const setTheme = (name: string): void => {
  if (name === current) return;
  current = name;
  for (const l of listeners) l(name);
};

/**
 * Registers (or replaces) a theme of the run-time table: the value of each token, by name (`color-bg` for `var(--color-bg)`), laid over
 * the static theme `base` (`""`: the default values) for every prop a site set to that token. A token it leaves out
 * keeps the value of `base`. When `name` is the theme in use, every attached renderable is resolved again.
 *
 * @param {string} name the theme, for `setTheme(name)`
 * @param {Record<string, string>} values a colour (`#rrggbb`, `ansi:N` or `default`) per token name
 * @param {string} base a name of `createGlobalTheme(tokens, name, ...)`, `""` for the default values
 */
export const defineTheme = (name: string, values: Record<string, string>, base = ""): void => {
  table.set(name, { values, base });
  if (name === current) for (const l of listeners) l(name);
};

/**
 * Calls `fn` on every theme change.
 *
 * @param {Function} fn called with the name of the new theme
 * @returns {Function} the function that stops it
 */
export const onTheme = (fn: (name: string) => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/**
 * The props of `style` in `state` and theme `name` (default: the one in use): the props, then what the theme changes,
 * then the `:hover`, `:focus` and `:active` overlays that are on, in that order, each with the theme's.
 *
 * @param {TuiShape} style a style of cssints/tui
 * @param {TuiState} state the states that are on
 * @param {string} name the theme
 * @returns {TuiProps} the props, renderer-neutral
 */
export const resolve = (style: TuiShape, state: TuiState = {}, name = current): TuiProps => {
  const run = table.get(name);
  const base = run ? run.base : name;
  const themed = base ? style.themes?.[base] : undefined;
  const vars = (style as Shape).vars;
  const out: Record<string, unknown> = {};
  const tokens = (layer: Vars | undefined) => {
    if (run && layer)
      for (const [k, v] of Object.entries(layer))
        if (typeof v === "string" && Object.hasOwn(run.values, v)) out[k] = run.values[v];
  };
  own(out, style);
  own(out, themed);
  tokens(vars);
  for (const s of STATES)
    if (state[s === ":hover" ? "hover" : s === ":focus" ? "focus" : "active"]) {
      own(out, style[s]);
      own(out, themed?.[s]);
      tokens(vars?.[s] as Vars | undefined);
    }
  return out;
};
