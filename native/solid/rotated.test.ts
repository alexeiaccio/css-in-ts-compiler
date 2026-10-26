// A gradient and a clip inside a *rotated* group — no page has one yet (the Dialog's menu is the one rotated group and has
// neither), so a hand-built tree proves it: the clip's edge is tilted (the clip paint lives in the transformed scene, so
// ThorVG turns it with the group), the gradient is rotated with its shape, and the dither after the frame stipples the
// gradient's own quad and nothing else — an axis-aligned mark stippled the page around the quad (2216 of the 5637 pixels
// its +1s moved, before the fix) and missed the quad's tips (none of them).
//
// The frame: a 240x200 window, a dark page, and a 180x140 group turned 30° about its own centre, holding a 60x100 clip
// element with a wider bright child (its right edge is what the clip cuts) and a 90x100 box with a 0° linear gradient
// (white to black, so a row across it is constant while it is unrotated and a ramp once it is not).
import { ui } from "./src/ffi.ts";
import { FIELDS, packBox } from "./src/pack.ts";

const W = 240,
  H = 200;
ui.init(W, H);

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};

const id = (s: string) => Buffer.from(s);
const ROT = 30; // degrees, clockwise on screen (y runs down)
const PAGE = [20, 20, 20]; // the page behind the group
const GROUP = [10, 10, 10]; // the group's own fill: what the page is inside the rotated group
const BRIGHT = [220, 60, 60]; // the clipped child

const box = (
  w: number,
  h: number,
  fill: { r: number; g: number; b: number; a: number },
  opts: { clip?: boolean; padding?: { left: number; right: number; top: number; bottom: number }; gap?: number } = {},
) =>
  packBox({
    layout: {
      sizing: { width: { type: "FIXED", min: w, max: w }, height: { type: "FIXED", min: h, max: h } },
      padding: opts.padding,
      childGap: opts.gap,
    },
    backgroundColor: fill,
    clip: opts.clip ? { horizontal: true, vertical: true } : undefined,
  });

const rootStyle = box(W, H, { r: PAGE[0]!, g: PAGE[1]!, b: PAGE[2]!, a: 255 }, { padding: { left: 30, right: 0, top: 20, bottom: 0 } });
const groupStyle = box(180, 140, { r: GROUP[0]!, g: GROUP[1]!, b: GROUP[2]!, a: 255 }, {
  padding: { left: 10, right: 10, top: 10, bottom: 10 },
  gap: 10,
});
const clipStyle = box(60, 100, { r: GROUP[0]!, g: GROUP[1]!, b: GROUP[2]!, a: 255 }, { clip: true });
const brightStyle = box(120, 100, { r: BRIGHT[0]!, g: BRIGHT[1]!, b: BRIGHT[2]!, a: 255 });
const gradStyle = box(90, 100, { r: 0, g: 0, b: 0, a: 255 });
const solidStyle = box(90, 100, { r: 0, g: 0, b: 0, a: 255 }); // the dither's reference: no gradient, so no dither

/** The gradient's stops: a 0° ramp (white at the bottom to black at the top) or a flat black — the raster leaves a flat
 *  black gradient exactly as a black fill, so the only pixels that differ from `solid` are the dither's own. */
const stops = (kind: "colour" | "flat"): Float32Array =>
  kind === "colour"
    ? new Float32Array([0, 255, 255, 255, 255, 1, 0, 0, 0, 255])
    : new Float32Array([0, 0, 0, 0, 255, 1, 0, 0, 0, 255]);

/** The tree, drawn: the group turned `rotate` degrees, the clip and the gradient inside it. */
function draw(kind: "colour" | "flat" | null, rotate = ROT) {
  ui.begin(-1, -1, 0, 1 / 60);
  if (rotate) ui.value(id("turn"), FIELDS.ROTATE, rotate);
  ui.open(id("root"), rootStyle);
  ui.open(id("turn"), groupStyle);
  ui.open(id("clip"), clipStyle);
  ui.open(id("clipIn"), brightStyle);
  ui.close();
  ui.close();
  if (kind) {
    ui.backgroundImage(1, 0, 2, stops(kind));
    ui.open(id("grad"), gradStyle);
  } else ui.open(id("grad"), solidStyle);
  ui.close();
  ui.close();
  ui.close();
  ui.end(1 / 60);
  ui.draw();
}

const px = (x: number, y: number) => ui.pixel(x, y).slice(0, 3);
const frame = (): number[][][] => {
  const out: number[][][] = [];
  for (let y = 0; y < H; y++) {
    const row: number[][] = [];
    for (let x = 0; x < W; x++) row.push(px(x, y));
    out.push(row);
  }
  return out;
};

/** The gradient's box, from the layout (the renderer's mark is the box's four corners through the group's map). */
draw("colour");
const grad = [...ui.bounds(id("grad"))!] as [number, number, number, number];
const group = [...ui.bounds(id("turn"))!] as [number, number, number, number];
const [CX, CY] = [group[0] + group[2] / 2, group[1] + group[3] / 2];
const rad = (ROT * Math.PI) / 180;
/** A point of the gradient's own space in the target's, as Clay_ThorVG_SettleGroup composes it. */
const turn = ([x, y]: [number, number]): [number, number] => {
  const [dx, dy] = [x - CX, y - CY];
  return [CX + dx * Math.cos(rad) - dy * Math.sin(rad), CY + dx * Math.sin(rad) + dy * Math.cos(rad)];
};
/** The four corners of a box after the group's turn. */
const quadOf = (b: number[]): [number, number][] =>
  (
    [
      [b[0]!, b[1]!],
      [b[0]! + b[2]!, b[1]!],
      [b[0]! + b[2]!, b[1]! + b[3]!],
      [b[0]!, b[1]! + b[3]!],
    ] as [number, number][]
  ).map(turn);
const quad = quadOf(grad);
/** Is the pixel at x, y inside a convex quad (its centre, by the four edges' cross products)? */
const inQuadOf = (q: [number, number][], x: number, y: number): boolean => {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = q[i]!,
      [bx, by] = q[(i + 1) % 4]!;
    const cross = (bx - ax) * (y + 0.5 - ay) - (by - ay) * (x + 0.5 - ax);
    if (cross !== 0) {
      const s = Math.sign(cross);
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
  }
  return true;
};
const inQuad = (x: number, y: number) => inQuadOf(quad, x, y);
/** Is the pixel inside the gradient's *unrotated* box (where the dither used to write)? */
const inBox = (x: number, y: number) =>
  x + 0.5 >= grad[0] && x + 0.5 <= grad[0] + grad[2] && y + 0.5 >= grad[1] && y + 0.5 <= grad[1] + grad[3];

// --- the groups: every box is the layout's on every frame (a rotation is drawn, never laid out)
{
  check("the gradient's box is the layout's", grad, [110, 30, 90, 100]);
  check("and the group's", group, [30, 20, 180, 140]);
  check("the rotated quad leaves the box: its corners are outside it", quad.some(([x, y]) => x < grad[0] || x > grad[0] + grad[2] || y < grad[1] || y > grad[1] + grad[3]), true);
}

// --- the clip: its paint is a scene inside the group's, so ThorVG turns it with the group. Two rows of the clipped child
//     then end at different x — a tilted edge, not a vertical one
{
  const edge = (y: number): number => {
    let last = -1;
    for (let x = 0; x < W; x++) {
      const c = px(x, y);
      if (Math.abs(c[0]! - BRIGHT[0]!) <= 30 && Math.abs(c[1]! - BRIGHT[1]!) <= 30) last = x;
    }
    return last;
  };
  const [a, b] = [edge(80), edge(100)];
  check("the clipped child is drawn", a > 0 && b > 0, true);
  check("the clip's edge is tilted: two rows end at different x", Math.abs(a - b) > 5, true);
  console.log(`solid/rotated.test.ts: the clip's right edge at x ${a} on row 80 and x ${b} on row 100`);
}

// --- the gradient: it is the shape's fill, so it turns with the shape. A 0° gradient is constant along a row while the
//     group is square, and a ramp along it once the group is turned
{
  const row = (y: number, from: number, to: number): number[] => {
    const out: number[] = [];
    for (let x = from; x <= to; x++) out.push(px(x, y)[0]!);
    return out;
  };
  const spread = (v: number[]) => Math.max(...v) - Math.min(...v);
  draw("colour", 0);
  const flat = spread(row(80, 115, 195));
  draw("colour", ROT);
  const tilted = spread(row(80, 115, 195));
  check("unrotated, a row across the gradient is one colour (the dither's two levels at most)", flat <= 2, true);
  check("rotated, the same row is a ramp: the gradient turned with its shape", tilted > 100, true);
  console.log(`solid/rotated.test.ts: a row across the gradient spreads ${flat}/255 unrotated and ${tilted}/255 at 30°`);
}

// --- the dither: after the frame it stipples the pixels the gradient drew, and now that the group is turned those are the
//     quad's, not the unrotated box's. A flat black gradient against a black fill differs only where the dither wrote
//     (its ±1 clamps at 0, so a stipple is a 1), which makes the dither's own pixels measurable
{
  draw("flat");
  const flat = frame();
  draw(null);
  const solid = frame();
  let changed = 0,
    outside = 0,
    tips = 0,
    worst = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const a = flat[y]![x]!,
        b = solid[y]![x]!;
      if (a.join() === b.join()) continue;
      changed++;
      worst = Math.max(worst, ...a.map((v, i) => Math.abs(v - b[i]!)));
      if (!inQuad(x, y)) outside++;
      else if (!inBox(x, y)) tips++;
    }
  check("the dither ran", changed > 1000, true);
  check("every pixel it touched is inside the gradient's rotated quad, none on the page around it", outside, 0);
  check("and it reached the quad's tips, which the unrotated box would have missed", tips > 100, true);
  check("with a step of one level either way at most", worst <= 1, true);
  console.log(
    `solid/rotated.test.ts: the dither ${changed}px, none outside the quad, ${tips} of them in its tips ` +
      `(outside the unrotated box), worst ${worst}/255`,
  );
}

// --- the clip and the dither together: the same tree with the gradient *inside* the clipped subtree — the mark is cut to
//     the clip (its quad's bounding box, the conservative bound) and to the gradient's own quad, so no page pixel outside
//     the gradient's quad is stippled
{
  const withClip = (gradient: boolean) => {
    ui.begin(-1, -1, 0, 1 / 60);
    ui.value(id("turn"), FIELDS.ROTATE, ROT);
    ui.open(id("root"), rootStyle);
    ui.open(id("turn"), groupStyle);
    ui.open(id("clip"), clipStyle);
    if (gradient) {
      ui.backgroundImage(1, 0, 2, stops("flat"));
      ui.open(id("grad"), gradStyle); // the same box, now inside the clip: 60 of its 90 px show
    } else ui.open(id("grad"), solidStyle);
    ui.close();
    ui.close();
    ui.close();
    ui.close();
    ui.end(1 / 60);
    ui.draw();
  };
  withClip(true);
  const clipped = frame();
  // the gradient's box in this tree (inside the clip, so another place): its own quad
  const inClipQuad = quadOf([...ui.bounds(id("grad"))!] as number[]);
  withClip(false);
  const solid = frame();
  let outside = 0,
    changed = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const a = clipped[y]![x]!,
        b = solid[y]![x]!;
      if (a.join() === b.join()) continue;
      changed++;
      if (!inQuadOf(inClipQuad, x, y)) outside++;
    }
  check("a gradient inside a rotated clip is stippled inside its own quad, never on the page around it", changed > 100 && outside === 0, true);
  console.log(`solid/rotated.test.ts: inside the clip ${changed}px of stipple, ${outside} of them outside the gradient's quad`);
}

if (failed) process.exit(1);
console.log(
  "solid/rotated.test.ts: a gradient and a clip in a rotated group — the clip's edge tilted, the gradient turned with " +
    "its shape, the dither's pixels inside the rotated quad and nowhere else",
);
process.exit(0);
