// The text headline: ThorVG's raster of the sheet page (app/Sheet.tsx) against the same strings drawn by other
// rasterisers, line by line — the ink weight and the structural similarity of textmetric.ts (Rune's method, their
// research item 6). Three references, two densities, one verdict: the desktop's text weighs what the platform's does, and
// the web target's is the outlier.
//
//   CoreText, 1x            frames/text-oracle.png       the platform's own rasteriser: the number the renderer is held to
//   CoreText, 2x            frames/text-oracle-2x.png    the same on a Retina screen, where the window actually draws
//   Chrome's Canvas2D, 1x   frames/text-canvas.png       the browser target's rasteriser: 1.37x our ink, recorded, not matched
//
// The test needs no Swift and no browser: the references are stored PNGs, the frame is drawn in-process. Re-store them
// with `bun solid/text-oracle.ts --update [--density 2] [--canvas]` when the sheet or a renderer deliberately changes; a
// drift the renderer did not intend fails here before a frame comparison does, and says which line and by how much.
import "./plugin.ts";

const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { El, render } = await import("./src/renderer.ts");
const { Sheet, ROWS, size } = await import("./app/Sheet.tsx");
const { align, coverage, inkOf, scoreLines, shift, ssim } = await import("./src/textmetric.ts");

ui.init(size.width, size.height);
ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname);

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};
const within = (what: string, got: number, lo: number, hi: number) => {
  if (!(got >= lo && got <= hi)) failed++, console.error(`FAIL ${what}: ${got}, wanted ${lo}..${hi}`);
};

// the sheet's own colours: the page's and the ink's, as the page declares them
const BG = [16, 18, 24];
const FG = [235, 235, 240];
/** The one line that must not match: ThorVG sets no fallback font, so its ⅓ is the empty box (see the note at the end). */
const FALLBACK = "Wm ¼ ⅓ — “quotes”";

const root = new El("root");
render(() => Sheet(), root);
const frame = createFrame(root, {});
const file = (name: string) => new URL(`./frames/${name}`, import.meta.url).pathname;

interface Reference {
  readonly what: string;
  readonly png: string;
  /** Device pixels per Clay unit the reference was drawn at: the frame is measured at the same density. */
  readonly density: number;
  /** The ink weight band, and the SSIM floor: what this rasteriser's lines are held to. */
  readonly weight: readonly [number, number];
  readonly ssim: number;
}

const REFERENCES: readonly Reference[] = [
  { what: "CoreText", png: file("text-oracle.png"), density: 1, weight: [0.95, 1.06], ssim: 0.95 },
  { what: "CoreText at 2x", png: file("text-oracle-2x.png"), density: 2, weight: [0.95, 1.06], ssim: 0.95 },
  // the web target's own rasteriser is heavier than the platform's by a third (its gamma, not the glyph): the band
  // records the gap, so a change on either side is a failing line and not a surprise
  { what: "Chrome's Canvas2D", png: file("text-canvas.png"), density: 1, weight: [0.68, 0.8], ssim: 0.8 },
];

for (const ref of REFERENCES) {
  // the frame at the reference's density, and its rows' crops in device pixels
  if (!ui.density(ref.density)) throw new Error(`cannot set the density to ${ref.density}`);
  frame(0, 0, false, 1 / 60, true);
  const lines = ROWS.map((r) => {
    const box = ui.bounds(Buffer.from(r.id));
    if (!box) throw new Error(`no bounds for ${r.id}`);
    return {
      id: r.id,
      text: r.text,
      size: r.size,
      box: { x: box[0]! * ref.density, y: box[1]! * ref.density, w: box[2]! * ref.density, h: box[3]! * ref.density },
    };
  });
  const png = ui.png(ref.png);
  if (!png) throw new Error(`${ref.png} is missing: run \`bun solid/text-oracle.ts --update\``);
  check(`${ref.what}: the reference is the page at its density`, [png.width, png.height], [
    size.width * ref.density,
    size.height * ref.density,
  ]);
  const reference = { width: png.width, height: png.height, pixels: png.pixels };
  const pixels = ui.pixels(png.width, png.height);
  const scores = scoreLines(lines, { width: png.width, height: png.height, pixels }, reference, BG, FG);

  console.log(`solid/text.test.ts: ${ref.what} (ink in pixels of the text's colour)`);
  console.log("  line                    size     ink   reference weight   ssim  shift   width");
  for (const s of scores)
    console.log(
      `  ${s.text.padEnd(22)} ${String(s.size).padStart(3)} ${s.ink.toFixed(0).padStart(8)} ${s.reference
        .toFixed(0)
        .padStart(10)} ${s.weight.toFixed(3).padStart(7)} ${s.ssim.toFixed(3).padStart(6)}  ${s.dx},${s.dy}  ${String(
        s.width,
      ).padStart(3)}/${s.referenceWidth}`,
    );

  for (const s of scores) {
    if (s.text === FALLBACK) continue;
    // a line is where the reference puts it: a hinting drift would show as a shift, and the raster is not allowed one
    check(`${ref.what}: ${s.text} at ${s.size}px is where the reference puts it`, [s.dx, s.dy], [0, 0]);
    within(`${ref.what}: ${s.text} at ${s.size}px, the ink weight`, s.weight, ref.weight[0], ref.weight[1]);
    within(`${ref.what}: ${s.text} at ${s.size}px, the shape`, s.ssim, ref.ssim, 1.0);
    check(
      `${ref.what}: ${s.text} at ${s.size}px, the line's extent within ${ref.density} px`,
      Math.abs(s.width - s.referenceWidth) <= ref.density,
      true,
    );
  }
  const kept = scores.filter((s) => s.text !== FALLBACK);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const weights = kept.map((s) => s.weight);
  console.log(
    `solid/text.test.ts: ${ref.what}: mean weight ${mean(weights).toFixed(3)}, thinnest ` +
      `${Math.min(...weights).toFixed(3)}, fattest ${Math.max(...weights).toFixed(3)}, mean ssim ` +
      `${mean(kept.map((s) => s.ssim)).toFixed(3)}`,
  );
}

// The missing glyph, the one difference no weight would catch — asserted here rather than left out of the sheet: the ⅓
// has no glyph in the font ThorVG sets, so it draws the empty box where CoreText falls back to another face.
{
  if (!ui.density(1)) throw new Error("cannot set the density to 1");
  frame(0, 0, false, 1 / 60, true);
  const png = ui.png(file("text-oracle.png"))!;
  const lines = ROWS.map((r) => {
    const box = ui.bounds(Buffer.from(r.id))!;
    return { id: r.id, text: r.text, size: r.size, box: { x: box[0]!, y: box[1]!, w: box[2]!, h: box[3]! } };
  });
  const scores = scoreLines(lines, { width: png.width, height: png.height, pixels: ui.pixels(png.width, png.height) }, png, BG, FG);
  const fallback = scores.find((s) => s.text === FALLBACK)!;
  within("the missing glyph is the one difference: its SSIM is low", fallback.ssim, 0, 0.7);
  console.log(`solid/text.test.ts: ${FALLBACK} at ${fallback.ssim.toFixed(3)} (no fallback font)`);
}

// --- the metric can see a difference: a line moved a pixel is not the same line, and a fatter one weighs more. Without
//     this the checks above could pass on a metric that always says 1.0
{
  if (!ui.density(1)) throw new Error("cannot set the density to 1");
  frame(0, 0, false, 1 / 60, true);
  const png = ui.png(file("text-oracle.png"))!;
  const box = (() => {
    const b = ui.bounds(Buffer.from(ROWS[0]!.id))!;
    return { x: b[0]!, y: b[1]!, w: b[2]!, h: b[3]! };
  })();
  const a = coverage({ width: png.width, height: png.height, pixels: ui.pixels(png.width, png.height) }, box, BG, FG);
  const b = coverage(png, box, BG, FG);
  const { dx, dy } = align(a, b, box.w, box.h);
  within("a line against itself: SSIM 1", ssim(a, a, box.w, box.h), 0.999, 1);
  const moved = ssim(a, shift(b, box.w, box.h, dx + 1, dy), box.w, box.h);
  within("a line against a copy moved a pixel: SSIM falls", moved, 0, 0.9);
  // the coverage cannot go past a solid pixel, so the same 20% on every pixel weighs a little less than 20% more
  const fat = Float64Array.from(a, (c) => Math.min(1, c * 1.2));
  within("a 20% fatter line weighs more", inkOf(fat) / inkOf(a), 1.05, 1.2);
  console.log(
    `solid/text.test.ts: the metric sees a 1px move (SSIM ${moved.toFixed(3)}) and more ink ` +
      `(${(inkOf(fat) / inkOf(a)).toFixed(3)})`,
  );
}

if (failed) console.error(`solid/text.test.ts: ${failed} failed`);
else console.log("solid/text.test.ts: three references, two densities, and why the renderer's weight is 0");
