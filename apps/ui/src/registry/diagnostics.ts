/**
 * Turns Solid 2's dev diagnostics into failures.
 *
 * They come from `@solidjs/signals`' dev build, and most of them only report: an error-severity
 * finding halts the reactive system, a warning-severity one is printed and the test that reads
 * the stale value afterwards still passes. Either way a rule violation reads as "the widget
 * sometimes does nothing" in a user's app, so the suite here has to say so first.
 *
 * The subscription is the structured channel (`OBSERVE.diagnostics`), not `console`: matching
 * the printed text meant throwing from inside Solid's own reporter, which turned every finding
 * into `[REACTIVITY_HALTED]` and hid the one that mattered. Errors are raised after the test;
 * warnings are left to the console for now (the kit's skins trip `STRICT_READ_UNTRACKED` in
 * places this change does not touch).
 */
import { OBSERVE } from "solid-js";
import { afterEach } from "vite-plus/test";

const errors: string[] = [];

OBSERVE?.diagnostics.subscribe((event) => {
  if (event.severity === "error") {
    errors.push(`[${event.code}] ${event.message}`);
  }
});

afterEach(() => {
  const diagnosed = errors.splice(0);
  if (diagnosed.length > 0) {
    throw new Error(`Solid diagnosed ${[...new Set(diagnosed)].join(" | ")}`);
  }
});
