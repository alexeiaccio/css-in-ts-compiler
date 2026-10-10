// The renderer-neutral runtime of cssints/tui styles (docs/research/tui.md): the props of a style in a state and a theme,
// and the theme in use. An adapter (./opentui.ts) sets what `resolve` gives on its renderables. Plain, no imports.
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
      if (k !== "themes" && !k.startsWith(":")) out[k] = v;
};

let current = "";
const listeners = new Set<(name: string) => void>();

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
  const themed = name ? style.themes?.[name] : undefined;
  const out: Record<string, unknown> = {};
  own(out, style);
  own(out, themed);
  for (const s of STATES)
    if (state[s === ":hover" ? "hover" : s === ":focus" ? "focus" : "active"]) {
      own(out, style[s]);
      own(out, themed?.[s]);
    }
  return out;
};
