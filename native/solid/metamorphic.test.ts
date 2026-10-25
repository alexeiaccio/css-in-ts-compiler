// Metamorphic relations: properties a frame must hold without an oracle (Rune's research 14, item 5). They catch the
// bug classes this stack actually has: a layer, a scene or a clip that shifts a subtree, a wrapper that changes layout, a
// text that re-wraps when nothing about it changed, and a tree that does not render the same twice in one process.
//
// Run: bun solid/metamorphic.test.ts
import "./plugin.ts";

const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render } = await import("./src/renderer.ts");
const page = await import("./metamorphic-page.tsx");

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};

const FONT = new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname;
const PAGE = page.PAGE;

/** A page drawn once: a window of w x h, the pixels as packed u32, and the bounds of the ids it named. */
function draw(w: number, h: number, tree: () => unknown, ids: readonly string[] = []) {
  ui.init(w, h);
  ui.font(FONT);
  const root = new El("root");
  const input = createInput();
  const dispose = render(tree as never, root);
  const frame = createFrame(root, { onPressMiss: () => input.pressMiss() });
  frame(-1, -1, false, 1 / 60);
  const px = new Uint32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) px[y * w + x] = ui.pixel(x, y).reduce((v, c, i) => v | (c << (i * 8)), 0) >>> 0;
  const boxes = Object.fromEntries(ids.map((id) => [id, [...(ui.bounds(Buffer.from(id)) ?? [])]]));
  dispose();
  return { px, w, h, boxes };
}

/** Pixels of a's region at (x0, y0) against b's same region from (0, 0). */
function sameRegion(a: { px: Uint32Array; w: number }, b: { px: Uint32Array; w: number }, x0: number, y0: number, w: number, h: number) {
  let diff = 0;
  let worst = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [p, q] = [a.px[(y + y0) * a.w + x + x0]!, b.px[y * b.w + x]!];
      if (p === q) continue;
      diff++;
      for (const shift of [0, 8, 16, 24]) worst = Math.max(worst, Math.abs(((p >>> shift) & 255) - ((q >>> shift) & 255)));
    }
  return { diff, worst };
}

// --- 1. A pass-through container does not change the page: wrapping the tree in a box that only fixes the same size
// leaves every pixel. Catches a layer, a scene or a clip that shifts or clips a subtree on the way in.
{
  const plain = draw(PAGE, PAGE, page.plain);
  const wrapped = draw(PAGE, PAGE, page.wrapped);
  const r = sameRegion(wrapped, plain, 0, 0, PAGE, PAGE);
  check("wrapping the page in a fixed-size box leaves the pixels identical", r.diff, 0);
  console.log(`wrap: ${r.diff} of ${PAGE * PAGE} pixels differ, worst channel ${r.worst}`);
}

// --- 2. Translation invariance: the same page inside a padded frame, by whole pixels, is the same picture shifted.
// Catches absolute coordinates that ignore the element's place (a gradient, a shadow or a blur in the wrong space) and
// text that re-shapes when its origin moves.
{
  const [dx, dy] = [13, 7];
  const plain = draw(PAGE, PAGE, page.plain);
  const shifted = draw(PAGE + dx, PAGE + dy, page.shifted);
  const r = sameRegion(shifted, plain, dx, dy, PAGE, PAGE);
  check(`the page moved by (${dx}, ${dy}) is the same pixels there`, r.diff, 0);
  console.log(`translate: ${r.diff} pixels differ, worst channel ${r.worst}`);
}

// --- 3. A wider container never adds a line of text: wrap monotonicity. A body in a fixed-width box is measured by the
// box's height; widening may remove a line, never add one.
{
  const narrow = draw(PAGE, PAGE, page.narrow, ["p"]).boxes.p![3]!;
  const wide = draw(PAGE, PAGE, page.wide, ["p"]).boxes.p![3]!;
  check("the narrow box is taller than the wide one", narrow > wide, true);
  console.log(`wrap monotonicity: ${narrow}px at 160 wide, ${wide}px at 300`);
}

// --- 4. The same page drawn twice in one process is the same frame: Clay keeps scroll offsets, the renderer keeps
// picture and shadow caches, and a second frame that differs means stale state carried over.
{
  const a = draw(PAGE, PAGE, page.plain);
  const b = draw(PAGE, PAGE, page.plain);
  const r = sameRegion(b, a, 0, 0, PAGE, PAGE);
  check("the same page drawn twice is the same frame", r.diff, 0);
  console.log(`twice: ${r.diff} pixels differ`);
}

if (failed) process.exit(1);
console.log("metamorphic: ok");
