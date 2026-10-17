/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
// The fallback of @cssints/gradient-2d where the browser has no mesh-gradient() or freeform-gradient(): the gradient drawn
// on a canvas, at a quarter of the box (64 px at least), set as the custom property the kernel's background-image reads
// (a blob URL), by the observers of canvas.ts. The rules are this package's (grid.ts's bicubic in oklab, points.ts's
// inverse-distance weighting), not the spec's. Plain code, no Effect; off where CSS.supports says the function is native.
import { resolve, run, type Drawing } from "./canvas.ts";
import { fromSpace, sample, toSpace, type Quad, type Space } from "./grid.ts";
import { freeform, type FreePoint } from "./points.ts";

const mesh: Drawing = {
  marker: "_gradient2d-core",
  fallback: "--gradient2d-fallback",
  native: "mesh-gradient(red, blue; green, yellow)",
  paint: (el, ctx, w, h) => {
    const raw = getComputedStyle(el).getPropertyValue("--gradient2d-data").trim();
    const { space, rows } = JSON.parse(JSON.parse(raw) as string) as {
      space: Space;
      rows: (number[] | string)[][];
    };
    const grid = rows.map((row) =>
      row.map((s) => toSpace(space, typeof s === "string" ? resolve(el, s, ctx) : (s as Quad))),
    );
    const img = ctx.createImageData(w, h);
    Array.from({ length: w * h }, (_, i) => i).forEach((i) => {
      const q = fromSpace(space, sample(grid, ((i % w) + 0.5) / w, (Math.floor(i / w) + 0.5) / h));
      img.data.set([q[0] * 255, q[1] * 255, q[2] * 255, q[3] * 255], 4 * i);
    });
    return img;
  },
};

const points: Drawing = {
  marker: "_gradient2d-ff",
  fallback: "--gradient2d-ff-fallback",
  native: "freeform-gradient(red top left, blue bottom right)",
  paint: (el, ctx, w, h) => {
    const raw = getComputedStyle(el).getPropertyValue("--gradient2d-ff-data").trim();
    const { space, points } = JSON.parse(JSON.parse(raw) as string) as {
      space: Space;
      points: [number, number, number, number[] | string][];
    };
    // height / width: the maths measures a distance in the box's pixels, as the fallback's radial layers do
    const ratio = h / w;
    const ps: FreePoint[] = points.map(([u, v, spread, c]) => ({
      u,
      v,
      spread,
      q: toSpace(space, typeof c === "string" ? resolve(el, c, ctx) : (c as Quad)),
    }));
    const img = ctx.createImageData(w, h);
    Array.from({ length: w * h }, (_, i) => i).forEach((i) => {
      const q = fromSpace(
        space,
        freeform(ps, ((i % w) + 0.5) / w, (Math.floor(i / w) + 0.5) / h, ratio),
      );
      img.data.set([q[0] * 255, q[1] * 255, q[2] * 255, q[3] * 255], 4 * i);
    });
    return img;
  },
};

if (typeof document !== "undefined" && typeof ResizeObserver !== "undefined") run([mesh, points]);
