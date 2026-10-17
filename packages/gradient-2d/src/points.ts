// The freeform maths of @cssints/gradient-2d: plain code, no imports beyond grid.ts's colour spaces, shared by the
// runtime (runtime.ts) and the tests in Node. A freeform gradient is a list of points, each a colour at a position with a
// spread. This package's rule is inverse-distance weighting: the colour at (u, v) is the weighted mean of the points in
// the working space (oklab, or srgb when asked), the weight of a point `spread / d²`. The spec's own rendering rule is
// not public (docs/research/2d-gradients.md), so this is this package's algorithm, not a browser's.
import type { Quad } from "./grid.ts";

/** A point of a freeform gradient: its colour in the working space, its position in the box (0 to 1, top left first), and its spread. */
export type FreePoint = { u: number; v: number; spread: number; q: Quad };

// The colour at (u, v) of the box, `points` in the working space. `ratio` is height / width: a distance is measured in
// the box's pixels, so a point's influence is a circle on screen, as the CSS fallback's radial layers are. At a point's
// own position its colour is exact; a point whose spread is 0 or less never pulls.
export const freeform = (points: FreePoint[], u: number, v: number, ratio = 1) => {
  const ws = points.map((p) => {
    const du = u - p.u;
    const dv = (v - p.v) * ratio;
    return { p, d2: du * du + dv * dv };
  });
  const hit = ws.find((x) => x.d2 < 1e-12);
  if (hit) return hit.p.q;
  const w = ws.map((x) => Math.max(0, x.p.spread) / x.d2);
  const sum = w.reduce((s, x) => s + x, 0);
  if (!(sum > 0)) return points[0]!.q;
  return [0, 1, 2, 3].map((k) => ws.reduce((s, x, i) => s + w[i]! * x.p.q[k]!, 0) / sum) as Quad;
};
