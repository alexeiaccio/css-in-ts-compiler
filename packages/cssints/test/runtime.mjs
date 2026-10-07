import assert from "node:assert/strict";

import { _cv, cx } from "../src/runtime.ts";

assert.equal(cx("a", false, null, undefined, 0, ["b", [false, "c"]], "d"), "a b c d");
const b = _cv({
  base: "x",
  variants: { size: { sm: "s", lg: "l" } },
  defaultVariants: { size: "sm" },
});
assert.equal(b(), "x s");
assert.equal(b({ size: "lg" }), "x l");
assert.equal(b({ size: undefined }), "x s", "undefined is the default");
assert.equal(b({ other: "x" }), "x s", "an unknown prop is ignored");

// boolean variants: the keys are "true" and "false"; false is a value, not a missing one
const bool = _cv({
  base: "x",
  variants: { on: { true: "t", false: "f" } },
  defaultVariants: { on: true },
});
assert.equal(bool(), "x t");
assert.equal(bool({ on: false }), "x f", "false overrides a default of true");
assert.equal(
  _cv({ base: "x", variants: { on: { true: "t" } }, defaultVariants: {} })({ on: false }),
  "x",
);

// compound variants: added when every value matches (a boolean by its text); drops leave classes out of the whole string
const c = _cv({
  base: "x y",
  variants: { size: { sm: "s", lg: "l" }, on: { true: "t" } },
  defaultVariants: { size: "sm" },
  drops: { size: { lg: "y" } },
  compound: [
    { when: { size: "lg", on: "true" }, class: "c", drops: "l" },
    { when: { size: "sm" }, class: "d" },
  ],
});
assert.equal(c(), "x y s d");
assert.equal(c({ size: "lg" }), "x l");
assert.equal(c({ size: "lg", on: true }), "x t c", "the compound drops a variant's class");
assert.equal(c({ on: true }), "x y s t d");
