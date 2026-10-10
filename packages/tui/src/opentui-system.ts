// The system theme on OpenTUI (docs/research/tui.md "The system theme"): OpenTUI queries the palette itself
// (`renderer.getPalette`: OSC 4, 10, 11), follows mode 2031 and emits `theme_mode` and `palette`; this feeds them to the
// theme. OpenTUI draws ANSI indices, so a terminal that reports nothing gets `ansi:N` and `default` colours.
// @effect-diagnostics asyncFunction:off -- plain run-time code of a terminal app (plainCode), no Effect
import { setTimeout as sleep } from "node:timers/promises";

import type { CliRenderer, TerminalColors, ThemeMode } from "@opentui/core";

import { setTheme } from "./index.ts";
import type { Report, SystemTheme } from "./system.ts";

/**
 * The report of OpenTUI's palette and theme mode.
 *
 * @param {TerminalColors} colors what `renderer.getPalette()` gave (none yet: `undefined`)
 * @param {ThemeMode} mode `renderer.themeMode`
 * @returns {Report} the report for `theme.solve`
 */
export const reportOf = (colors: TerminalColors | undefined, mode: ThemeMode | null): Report => ({
  fg: colors?.defaultForeground,
  bg: colors?.defaultBackground,
  ansi: colors?.palette ?? [],
  scheme: mode,
});

/**
 * Follows the terminal's colours: sets the system theme (`setTheme`) with the fallback at once, asks OpenTUI for the
 * palette, and rebuilds the theme when it comes, on a `palette` event and on a `theme_mode` change.
 *
 * @param {CliRenderer} renderer the renderer
 * @param {SystemTheme} theme the theme of `createSystemTheme`
 * @param {object} options `wait`: how long to wait for the palette, in ms (default 100)
 * @returns {Promise<Function>} after the palette or `wait`, whichever is first: the function that stops following
 */
export const followSystemTheme = async (
  renderer: CliRenderer,
  theme: SystemTheme,
  options: { wait?: number } = {},
): Promise<() => void> => {
  let colors: TerminalColors | undefined;
  const apply = () => theme.apply(reportOf(colors, renderer.themeMode), { indexed: true });
  const onPalette = (c: TerminalColors) => {
    colors = c;
    apply();
  };
  const query = () =>
    renderer.getPalette({ size: 16 }).then(onPalette, () => {
      // a suspended or destroyed renderer: the theme stays as it is
    });
  // OpenTUI clears its palette cache on a change of mode; the colours of the new scheme come with `palette`
  const onMode = () => {
    apply();
    void query();
  };
  renderer.on("palette", onPalette);
  renderer.on("theme_mode", onMode);
  const stop = () => {
    renderer.off("palette", onPalette);
    renderer.off("theme_mode", onMode);
  };
  renderer.once("destroy", stop);
  apply();
  setTheme(theme.name);
  await Promise.race([query(), sleep(options.wait ?? 100, undefined, { ref: false })]);
  return stop;
};
