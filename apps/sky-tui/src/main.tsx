// `bun dist/main.js` runs the app; the tests import the same file for App and OpenTUI's test renderer, so they drive the
// build that ships (one copy of Solid, the one the renderer uses).
import { followSystemTheme, setTheme } from "@cssints/tui/opentui";
import { createCliRenderer } from "@opentui/core";
import { render, testRender } from "@opentui/solid";

import { App } from "./App.tsx";
import { system } from "./system.ts";

export { App, followSystemTheme, system, testRender };

// autoFocus off: a click would focus the scrollbox, which then moves on the arrows too
export const options = { autoFocus: false, exitOnCtrlC: true } as const;

// the terminal's own colours by default (the system theme); --light and --dark: the app's static themes
if (import.meta.main) {
  const renderer = await createCliRenderer({ ...options, onDestroy: () => process.exit(0) });
  if (process.argv.includes("--light")) setTheme("light");
  else if (!process.argv.includes("--dark")) await followSystemTheme(renderer, system);
  await render(() => <App />, renderer);
}
