// The maths of src/grid.ts in Node: every stop is the colour at its own corner, the centre of a 2 x 2 mesh is the mean of
// its corners, and oklab and srgb give different midpoints. Run: node test/maths.mjs
import assert from "node:assert/strict";

import { fromSpace, mean, sample, toOklab, toSpace, toSrgb } from "../src/grid.ts";

const close = (a, b, eps, what) =>
  a.forEach((x, i) => assert.ok(Math.abs(x - b[i]) <= eps, `${what}: ${a} vs ${b}`));

// sRGB and back
for (const q of [
  [1, 0, 0, 1],
  [0, 0, 1, 1],
  [0.2, 0.7, 0.4, 0.5],
  [1, 1, 1, 1],
  [0, 0, 0, 1],
]) {
  close(toSrgb(toOklab(q)), q, 1e-5, "oklab round trip");
}

// (a) each stop is the colour at its own corner, in both spaces: Catmull-Rom passes through the stops
const grid3 = [
  [
    [1, 0, 0, 1],
    [0, 1, 0, 1],
    [0, 0, 1, 1],
  ],
  [
    [1, 1, 0, 1],
    [0.5, 0.5, 0.5, 0.8],
    [0, 1, 1, 1],
  ],
  [
    [0, 0, 0, 1],
    [1, 0, 1, 1],
    [1, 1, 1, 1],
  ],
];
for (const space of ["oklab", "srgb"]) {
  const g = grid3.map((row) => row.map((q) => toSpace(space, q)));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const at = sample(g, c / 2, r / 2);
      close(fromSpace(space, at), grid3[r][c], 1e-5, `${space} stop ${r},${c}`);
    }
}

// (b) the centre of a 2 x 2 mesh is the mean of its corners (each edge is a straight line through two stops)
const corners = [
  [
    [1, 0, 0, 1],
    [0, 0, 1, 1],
  ],
  [
    [0, 1, 0, 1],
    [1, 1, 0, 1],
  ],
];
const g2 = corners.map((row) => row.map((q) => toOklab(q)));
close(sample(g2, 0.5, 0.5), mean(g2.flat()), 1e-9, "centre is the mean of the corners");

// (c) the midpoint of red and blue on the top edge: oklab is not srgb's mean (0.5, 0, 0.5)
const top = [
  [
    [1, 0, 0, 1],
    [0, 0, 1, 1],
  ],
  [
    [1, 0, 0, 1],
    [0, 0, 1, 1],
  ],
].map((row) => row.map((q) => toOklab(q)));
const mid = fromSpace("oklab", sample(top, 0.5, 0));
const srgbMid = [0.5, 0, 0.5];
assert.ok(
  Math.max(...mid.slice(0, 3).map((x, i) => Math.abs(x - srgbMid[i]))) > 0.05,
  `oklab midpoint ${mid.join(", ")} is the srgb one`,
);
console.log("maths ok");
