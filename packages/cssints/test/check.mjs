// cssints/check: the engine's checks as functions for tools. Run: node check.mjs
import assert from "node:assert/strict";

import { Effect, Exit } from "effect";

import { contrast } from "../src/check.ts";

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
assert.match(current.cause.reasons[0].error.message, /"currentColor" is not a colour the check can read/);

console.log("check: contrast as css.check.contrast computes it");
