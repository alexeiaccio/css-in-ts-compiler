// node test/shape.ts — the engine of shape(): the check the twin runs, and the SVG path an app draws where the browser
// has no border-shape. The values are the ones of the article the feature came from (dynamic and static connectors).
import { deepStrictEqual, throws } from "node:assert/strict";

import { shapePath, shapeValid } from "../src/shape.ts";

const ok = (value: string, expected: string) => {
  const box = { width: 100, height: 100 };
  const path = shapePath(value, box);
  deepStrictEqual([path.d, path.viewBox], [expected, null], value);
};

// the dynamic connector: a curve from a corner to the center, then a smooth one to the other corner
ok(
  "shape(from 0 0, curve to 50% 50% with 50% 50%, smooth to 100% 100%)",
  "M 0 0 Q 50 50 50 50 Q 50 50 100 100",
);
// the static connector: px offsets, and a calc() for the other end
ok(
  "shape(from 60px 0, curve to 50% 50% with 50% 50%, smooth to calc(100% - 60px) 100%)",
  "M 60 0 Q 50 50 50 50 Q 50 50 40 100",
);
// the spec's speech bubble, minus the px it keeps for the arrow
ok(
  "shape(from 5% 0, hline to calc(100% - 5%), curve to 100% 5% with 100% 0, vline to calc(100% - 3%), line by -2% 3%, line by -2% -3%, hline to 5%, close)",
  "M 5 0 H 95 Q 100 0 100 5 V 97 L 98 100 L 96 97 H 5 Z",
);
// a curve after a line: the smooth command reflects the start point, not a phantom control point
ok("shape(from 0 0, line to 50% 50%, smooth to 100% 100%)", "M 0 0 L 50 50 Q 50 50 100 100");
// two control points make a cubic; `from end` moves the reference point of a relative control point
ok(
  "shape(from 10% 10%, curve by 20% 30% with 5% 5% / 10% 10% from end)",
  "M 10 10 C 15 15 40 50 30 40",
);
// the keywords of a position, and a cubic through a second control point
ok(
  "shape(from left top, line to right bottom, hline to center, vline to 50%)",
  "M 0 0 L 100 100 H 50 V 50",
);
// an arc: cw large, rotated; one radius is a circle, a percentage against the direction-agnostic size
ok(
  "shape(from 0 0, arc to 100% 100% of 10% 20% cw large rotate 30deg)",
  "M 0 0 A 10 20 30 1 1 100 100",
);
ok("shape(from 0 0, arc to 100% 100% of 10%)", "M 0 0 A 10 10 0 0 0 100 100");
// the spec's defaults for an arc: ccw, small; a radius keeps its sign off
ok("shape(from 0 0, arc to 50% 50% of -10px)", "M 0 0 A 10 10 0 0 0 50 50");

// no box: percentages resolve against 100, and the path asks for that viewBox
deepStrictEqual(shapePath("shape(from 0 0, line to 100% 100%)"), {
  d: "M 0 0 L 100 100",
  viewBox: "0 0 100 100",
});
// px without a box cannot be scaled to a viewBox
throws(
  () => shapePath("shape(from 60px 0, line to 100% 100%)"),
  /"60px" is in px; give the box's size/,
);
// a var() is valid CSS and an unresolvable path
throws(() => shapePath("shape(from var(--x) 0, line to 100% 100%)"), /var\(\) cannot be resolved/);
shapeValid("from var(--x) top, hline to calc(100% - var(--x)), curve to right top with right top");

// what the twin rejects: the messages are the build's
throws(() => shapeValid("from 0 0, curve to 10% 10%)"), /curve needs with <control-point>/);
throws(() => shapeValid("from 0 0, nope to 1px 1px"), /"nope" is not a shape command/);
throws(() => shapeValid("0 0, line to 1px 1px"), /expected "from"/);
throws(() => shapeValid("from 0 0, line to 1px 2px 3px"), /is not a position/);
throws(() => shapeValid("from 0 0, line to red"), /is not a length/);
throws(() => shapeValid("from 0 0, arc to 1px 1px rotate x"), /is not an angle/);
throws(() => shapeValid("from 0 0, line to 10 10"), /needs a unit/);
throws(() => shapeValid(""), /a shape needs from <position>/);
// the value must be a shape() and closed
throws(() => shapePath("path(from 0 0)"), /expected shape\(\.\.\.\)/);
throws(() => shapePath("shape(from 0 0"), /expected shape\(\.\.\.\)/);

console.log("shape ok");
