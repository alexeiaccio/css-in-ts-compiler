import assert from "node:assert/strict";

import { _cv, cx } from "../src/runtime.mjs";

assert.equal(cx("a", false, null, undefined, 0, ["b", [false, "c"]], "d"), "a b c d");
const b = _cv({ base: "x", variants: { size: { sm: "s", lg: "l" } }, defaultVariants: { size: "sm" } });
assert.equal(b(), "x s");
assert.equal(b({ size: "lg" }), "x l");
