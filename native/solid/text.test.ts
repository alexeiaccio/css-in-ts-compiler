// The text headline: ThorVG's raster of the sheet page (app/Sheet.tsx) against the same strings drawn by CoreText
// (frames/text-oracle.png, from text-oracle.ts), line by line — the ink weight and the structural similarity of
// textmetric.ts. This is Rune's method (their research, item 6) applied to our renderer, and the reason the renderer has
// no weight correction: the numbers below say ThorVG's text already weighs what the platform's does.
//
// The test needs no Swift and no browser: the reference is a stored PNG, the frame is drawn in-process. Re-store both
// with `bun solid/text-oracle.ts --update` when the sheet or the renderer deliberately changes; a drift the renderer did
// not intend fails here before the frame comparison does, and says which line and by how much.
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

const root = new El("root");
render(() => Sheet(), root);
const frame = createFrame(root, {});
frame(0, 0, false, 1 / 60, true);
const boxes = ROWS.map((r) => {
  const box = ui.bounds(Buffer.from(r.id));
  if (!box) throw new Error(`no bounds for ${r.id}`);
  return { id: r.id, text: r.text, size: r.size, box: { x: box[0]!, y: box[1]!, w: box[2]!, h: box[3]! } };
});
const tvg = { width: size.width, height: size.height, pixels: ui.pixels(size.width, size.height) };
const oracle = ui.png(new URL("./frames/text-oracle.png", import.meta.url).pathname);
if (!oracle) throw new Error("frames/text-oracle.png is missing: run `bun solid/text-oracle.ts --update`");
const reference = { width: oracle.width, height: oracle.height, pixels: oracle.pixels };
check("the reference is the page's size", [reference.width, reference.height], [size.width, size.height]);

const scores = scoreLines(boxes, tvg, reference, BG, FG);

// --- the lines. `Wm ¼ ⅓ — “quotes”` is the one that must not match: ThorVG sets no fallback font, so the ⅓ it has no
//     glyph for is the empty box, where CoreText falls back to another face and draws the fraction. It is in the sheet
//     because a weight metric alone would call the line thin; the SSIM is what sees a wrong glyph.
const FALLBACK = "Wm ¼ ⅓ — “quotes”";
console.log("solid/text.test.ts: the sheet against CoreText (ink in pixels of the text's colour)");
console.log("  line                    size     ink   coretext  weight   ssim  shift   width");
for (const s of scores)
  console.log(
    `  ${s.text.padEnd(22)} ${String(s.size).padStart(3)} ${s.ink.toFixed(0).padStart(8)} ${s.reference
      .toFixed(0)
      .padStart(9)} ${s.weight.toFixed(3).padStart(8)} ${s.ssim.toFixed(3).padStart(6)}  ${s.dx},${s.dy}  ${String(
      s.width,
    ).padStart(3)}/${s.referenceWidth}`,
  );

for (const s of scores) {
  if (s.text === FALLBACK) continue;
  // a line is where CoreText puts it: a hinting drift would show as a shift, and the raster is not allowed one
  check(`${s.text} at ${s.size}px: the line is where CoreText puts it`, [s.dx, s.dy], [0, 0]);
  // and it weighs what CoreText weighs, within the 6% a hinting-free raster may spend on the thinnest line here
  within(`${s.text} at ${s.size}px: the ink weight against CoreText`, s.weight, 0.95, 1.06);
  within(`${s.text} at ${s.size}px: the shape against CoreText`, s.ssim, 0.95, 1.0);
  check(`${s.text} at ${s.size}px: the line's extent within a pixel`, Math.abs(s.width - s.referenceWidth) <= 1, true);
}
const weights = scores.filter((s) => s.text !== FALLBACK).map((s) => s.weight);
const mean = weights.reduce((a, b) => a + b, 0) / weights.length;
within("the sheet's mean weight: ThorVG is not thin, and not fat", mean, 0.98, 1.03);
const fallback = scores.find((s) => s.text === FALLBACK)!;
within("the missing glyph is the one difference: its SSIM is low", fallback.ssim, 0, 0.7);
console.log(
  `solid/text.test.ts: mean weight ${mean.toFixed(3)}, thinnest ${Math.min(...weights).toFixed(3)}, fattest ` +
    `${Math.max(...weights).toFixed(3)}; ${FALLBACK} at ${fallback.ssim.toFixed(3)} (no fallback font)`,
);

// --- the metric can see a difference: a line moved a pixel is not the same line, and a fatter one weighs more. Without
//     this the checks above could pass on a metric that always says 1.0
{
  const line = boxes[0]!;
  const a = coverage(tvg, line.box, BG, FG);
  const b = coverage(reference, line.box, BG, FG);
  const { dx, dy } = align(a, b, line.box.w, line.box.h);
  within("a line against itself: SSIM 1", ssim(a, a, line.box.w, line.box.h), 0.999, 1);
  within("a line against a copy moved a pixel: SSIM falls", ssim(a, shift(b, line.box.w, line.box.h, dx + 1, dy), line.box.w, line.box.h), 0, 0.9);
  // the coverage cannot go past a solid pixel, so the same 20% on every pixel weighs a little less than 20% more
  const fat = Float64Array.from(a, (c) => Math.min(1, c * 1.2));
  within("a 20% fatter line weighs more", inkOf(fat) / inkOf(a), 1.05, 1.2);
  console.log(
    `solid/text.test.ts: the metric sees a 1px move (SSIM ${ssim(a, shift(b, line.box.w, line.box.h, dx + 1, dy), line.box.w, line.box.h).toFixed(3)})` +
      ` and 20% more ink (${(inkOf(fat) / inkOf(a)).toFixed(3)})`,
  );
}

if (failed) console.error(`solid/text.test.ts: ${failed} failed`);
else console.log("solid/text.test.ts: the sheet, its weight against CoreText, and the metric that says so");
