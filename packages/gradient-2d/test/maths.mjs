// The maths of src/grid.ts and src/points.ts in Node: every stop is the colour at its own corner, the centre of a 2 x 2
// mesh is the mean of its corners, oklab and srgb give different midpoints, and a freeform point is the colour at its own
// position. Run: node test/maths.mjs
import assert from "node:assert/strict";

import { fromSpace, mean, sample, toOklab, toSpace, toSrgb } from "../src/grid.ts";
import { freeform } from "../src/points.ts";

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

// (d) freeform, inverse-distance weighting: a point is its own colour at its own position, in both spaces
const ffPoints = [
  { u: 0.2, v: 0.3, spread: 1, q: [1, 0, 0, 1] },
  { u: 0.6, v: 0.4, spread: 4, q: [0, 1, 0, 0.5] },
  { u: 1, v: 1, spread: 2, q: [0, 0, 1, 1] },
];
for (const space of ["oklab", "srgb"]) {
  const ps = ffPoints.map((p) => ({ ...p, q: toSpace(space, p.q) }));
  ps.forEach((p, i) => {
    close(fromSpace(space, freeform(ps, p.u, p.v)), ffPoints[i].q, 1e-5, `${space} point ${i}`);
  });
}

// (e) inside the hull the colour is a blend: at the midpoint of two points with the same spread, the mean of the two
const pair = [
  { u: 0, v: 0, spread: 1, q: toOklab([1, 0, 0, 1]) },
  { u: 1, v: 1, spread: 1, q: toOklab([0, 0, 1, 1]) },
];
close(
  freeform(pair, 0.5, 0.5),
  mean(pair.map((p) => p.q)),
  1e-9,
  "two points: the midpoint is the mean",
);
const srgbPair = pair.map((p) => ({ ...p, q: fromSpace("oklab", p.q) }));
const ffOklab = fromSpace("oklab", freeform(pair, 0.5, 0.5));
const ffSrgb = freeform(srgbPair, 0.5, 0.5);
assert.ok(
  Math.max(...ffOklab.slice(0, 3).map((x, i) => Math.abs(x - srgbMid[i]))) > 0.05,
  `freeform oklab midpoint ${ffOklab.join(", ")} is the srgb one`,
);
assert.ok(
  Math.max(...ffSrgb.slice(0, 3).map((x, i) => Math.abs(x - srgbMid[i]))) < 1e-6,
  `freeform srgb midpoint ${ffSrgb.join(", ")} is not the srgb mean`,
);

// (f) the spread weighs a point, and the ratio measures the distance in the box's pixels (height / width)
const heavy = [
  { u: 0, v: 0, spread: 1, q: toOklab([1, 0, 0, 1]) },
  { u: 1, v: 1, spread: 4, q: toOklab([0, 0, 1, 1]) },
];
const light = [heavy[0], { ...heavy[1], spread: 1 }];
assert.ok(
  fromSpace("oklab", freeform(heavy, 0.5, 0.5))[2] >
    fromSpace("oklab", freeform(light, 0.5, 0.5))[2],
  "a larger spread pulls the colour of the midpoint toward its point",
);
const diag = pair;
assert.ok(
  Math.abs(freeform(diag, 0.5, 0.25, 0.6)[0] - freeform(diag, 0.5, 0.25, 1)[0]) > 1e-9,
  "the ratio measures the distance in the box's pixels",
);
console.log("maths ok");
