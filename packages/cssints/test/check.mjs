// cssints/check: the engine's checks as functions for tools. Run: node check.mjs
import assert from "node:assert/strict";

import { Effect, Exit } from "effect";

import { support, targets } from "@cssints/css-grammar/support";

import { contrast, loweredOf } from "../src/check.ts";

const run = (e) => Effect.runPromiseExit(e);

// the ratio of css.check.contrast, cut at two places
const grey = await run(contrast("#777", "white"));
assert.ok(Exit.isSuccess(grey));
assert.equal(grey.value.text, "4.47");
assert.ok(grey.value.ratio > 4.47 && grey.value.ratio < 4.5);
assert.equal((await run(contrast("black", "#fff"))).value.text, "21.00");
// a colour outside sRGB is clipped; a translucent one or one culori cannot read has no contrast
assert.ok(Exit.isSuccess(await run(contrast("color(display-p3 1 0 0)", "white"))));
const glass = await run(contrast("rgb(0 0 0 / 50%)", "white"));
assert.ok(Exit.isFailure(glass));
const e = glass.cause.reasons[0].error;
assert.equal(e._tag, "ContrastError");
assert.equal(e.colour, "rgb(0 0 0 / 50%)");
assert.match(e.message, /is translucent/);
const current = await run(contrast("black", "currentColor"));
assert.match(
  current.cause.reasons[0].error.message,
  /"currentColor" is not a colour the check can read/,
);

// loweredOf: what LightningCSS writes for the targets of a warning, or undefined where it leaves the value
const old = await Effect.runPromise(targets("chrome 100"));
const lower = async (p, v) => {
  const [w] = await Effect.runPromise(support(p, v, old));
  assert.ok(w, `${p}: ${v} warns for chrome 100`);
  return Effect.runPromise(loweredOf(p, v, w));
};
assert.match(await lower("color", "oklch(70% 0.2 330)"), /^#[0-9a-f]{6}$/);
assert.equal(await lower("color", "oklch(from var(--x) l c h)"), undefined);
assert.equal(await lower("text-wrap", "balance"), undefined);

console.log(
  "check: contrast as css.check.contrast computes it, loweredOf as a build drops warnings",
);
