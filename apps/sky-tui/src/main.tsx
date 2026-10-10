// `bun dist/main.js` runs the app; the tests import the same file for App and OpenTUI's test renderer, so they drive the
// build that ships (one copy of Solid, the one the renderer uses).
import { setTheme } from "@cssints/tui/opentui";
import { render, testRender } from "@opentui/solid";

import { App } from "./App.tsx";

export { App, testRender };

// autoFocus off: a click would focus the scrollbox, which then moves on the arrows too
export const options = { autoFocus: false, exitOnCtrlC: true } as const;

if (import.meta.main) {
  if (process.argv.includes("--light")) setTheme("light");
  await render(() => <App />, { ...options, onDestroy: () => process.exit(0) });
}
