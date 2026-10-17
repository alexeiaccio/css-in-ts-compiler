// The maths of @cssints/gradient-2d: plain code with no imports, shared by the build (index.ts) and the runtime, and run
// by the tests in Node. A mesh is a grid of colour stops: rows from the top of the box down, stops from the left, the
// corners of the grid at the corners of the box. A point of the box is a bicubic (Catmull-Rom) of the 4 x 4 stops around
// it, in the working space (oklab, or srgb when asked). This is the package's own algorithm, not the spec's tensor-product
// patch with Bézier control points.

/** A colour: red, green, blue and alpha, each 0 to 1 (sRGB), or the same in the working space. */
export type Quad = [number, number, number, number];
export type Space = "oklab" | "srgb";

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

// Björn Ottosson's oklab matrices (https://bottosson.github.io/posts/oklab/)
export const toOklab = ([r, g, b, a]: Quad) => {
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    a,
  ] satisfies Quad;
};

export const toSrgb = ([L, A, B, a]: Quad) => {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    gam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a,
  ] satisfies Quad;
};

// An sRGB colour in the working space, and a colour of the working space back in sRGB (not clamped).
export const toSpace = (space: Space, q: Quad) => (space === "oklab" ? toOklab(q) : q);
export const fromSpace = (space: Space, q: Quad) => (space === "oklab" ? toSrgb(q) : q);

// The mean of colours, channel by channel.
export const mean = (qs: Quad[]) =>
  [0, 1, 2, 3].map((k) => qs.reduce((s, q) => s + q[k]!, 0) / qs.length) as Quad;

// Catmull-Rom through p1 and p2 at t in [0, 1]: it passes through the stops, so a corner is its own colour.
const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));

// The mesh at (u, v) of its box, each 0 to 1 from the top left; `g` is the grid in the working space.
export const sample = (g: Quad[][], u: number, v: number) => {
  const rows = g.length;
  const cols = g[0]!.length;
  const x = u * (cols - 1);
  const y = v * (rows - 1);
  const i = Math.min(Math.floor(x), cols - 2);
  const j = Math.min(Math.floor(y), rows - 2);
  const tx = x - i;
  const ty = y - j;
  const at = (r: number, c: number) =>
    g[Math.min(Math.max(r, 0), rows - 1)]![Math.min(Math.max(c, 0), cols - 1)]!;
  const line = (r: number) => {
    const p = [-1, 0, 1, 2].map((d) => at(r, i + d));
    return [0, 1, 2, 3].map((k) => cr(p[0]![k]!, p[1]![k]!, p[2]![k]!, p[3]![k]!, tx)) as Quad;
  };
  const q = [-1, 0, 1, 2].map((d) => line(j + d));
  return [0, 1, 2, 3].map((k) => cr(q[0]![k]!, q[1]![k]!, q[2]![k]!, q[3]![k]!, ty)) as Quad;
};
