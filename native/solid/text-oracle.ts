// The text oracle's driver: render the sheet page (app/Sheet.tsx) with ThorVG, draw the same strings at the same places
// with CoreText (text-oracle.swift), and print the metric of textmetric.ts line by line — the ink weight against
// CoreText's and the structural similarity at the best whole-pixel shift.
//
//   bun solid/text-oracle.ts                  measure the frame as it is drawn (the numbers the suite checks)
//   bun solid/text-oracle.ts --weight 0.5     the same with the renderer's text weight at 0.5 Clay units
//   bun solid/text-oracle.ts --sweep          a table of weights against the one reference raster
//   bun solid/text-oracle.ts --update         re-store frames/text-sheet.png and frames/text-oracle.png from this run
//
// CoreText is the platform's rasteriser: the reference is what the same Roboto at the same sizes looks like when macOS
// draws it (font smoothing off; antialiasing and subpixel positioning on). The stored oracle is what text.test.ts
// compares against, so the suite needs neither Swift nor Chrome.
import "./plugin.ts";
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";

const ROOT = new URL(".", import.meta.url).pathname;
const FRAMES = `${ROOT}frames/`;
const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? undefined : process.argv[i + 1];
};

const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { El, render } = await import("./src/renderer.ts");
const { Sheet, ROWS, size } = await import("./app/Sheet.tsx");
const { scoreLines } = await import("./src/textmetric.ts");
import type { Bitmap } from "./src/textmetric.ts";

if (ui.init(size.width, size.height) || ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname) < 0) {
  console.error("ui_init or ui_font failed (is thorvg installed, and build/solid/libui.dylib built?)");
  process.exit(1);
}
const root = new El("root");
render(() => Sheet(), root);
const frame = createFrame(root, {});
const weight = Number(arg("--weight") ?? 0);
const update = process.argv.includes("--update");
const sweep = process.argv.includes("--sweep");

// the sheet's own colours: the page's and the ink's, as the page declares them
const BG = [16, 18, 24];
const FG = [235, 235, 240];

/** Lays out and draws one frame at `weight`, and returns the frame's pixels. */
function draw(weight: number): Uint8Array {
  ui.textWeight(weight);
  frame(0, 0, false, 1 / 60, true);
  return ui.pixels(size.width, size.height);
}

frame(0, 0, false, 1 / 60, true);
const boxes = ROWS.map((r) => {
  const box = ui.bounds(Buffer.from(r.id));
  if (!box) throw new Error(`no bounds for ${r.id}`);
  return { id: r.id, text: r.text, size: r.size, box: { x: box[0]!, y: box[1]!, w: box[2]!, h: box[3]! } };
});

// the oracle: the same lines through CoreText, into the stored PNG
const tool = new URL("../build/solid/text-oracle", import.meta.url).pathname;
if (!existsSync(tool)) {
  console.log(`text-oracle: building ${tool}`);
  execFileSync("swiftc", ["-O", `${ROOT}text-oracle.swift`, "-o", tool], { stdio: "inherit" });
}
const spec = {
  width: size.width,
  height: size.height,
  bg: BG,
  fg: FG,
  font: new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname,
  out: `${FRAMES}text-oracle.png`,
  rows: boxes.map((b) => ({ text: b.text, size: b.size, x: b.box.x, y: b.box.y })),
};
const specPath = `${process.env.TMPDIR ?? "/tmp"}/cssints-text-oracle.json`;
writeFileSync(specPath, JSON.stringify(spec));
execFileSync(tool, [specPath], { stdio: "inherit" });

const oracle = ui.png(spec.out);
if (!oracle) throw new Error(`cannot read ${spec.out}`);
const reference: Bitmap = { width: oracle.width, height: oracle.height, pixels: oracle.pixels };

const show = (label: string, scores: ReturnType<typeof scoreLines>) => {
  console.log(`\n${label}`);
  console.log("  line                    size     ink   coretext  weight   ssim  shift   width");
  for (const s of scores)
    console.log(
      `  ${s.text.padEnd(22)} ${String(s.size).padStart(3)} ${s.ink.toFixed(0).padStart(8)} ${s.reference
        .toFixed(0)
        .padStart(9)} ${s.weight.toFixed(3).padStart(8)} ${s.ssim.toFixed(3).padStart(6)}  ${s.dx},${s.dy}  ${String(
        s.width,
      ).padStart(3)}/${s.referenceWidth}`,
    );
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  console.log(
    `  mean weight ${mean(scores.map((s) => s.weight)).toFixed(3)}, mean ssim ${mean(scores.map((s) => s.ssim)).toFixed(3)},` +
      ` thinnest ${Math.min(...scores.map((s) => s.weight)).toFixed(3)}, fattest ${Math.max(...scores.map((s) => s.weight)).toFixed(3)}`,
  );
};

if (sweep) {
  const prints: Uint8Array[] = [];
  for (const w of [0, 0.25, 0.5, 0.75, 1, 1.5]) {
    prints.push(draw(w));
    const scores = scoreLines(boxes, { width: size.width, height: size.height, pixels: prints.at(-1)! }, reference, BG, FG);
    show(`text weight ${w}`, scores);
  }
} else {
  const pixels = draw(weight);
  const scores = scoreLines(boxes, { width: size.width, height: size.height, pixels }, reference, BG, FG);
  show(`text weight ${weight}`, scores);
  if (update) {
    ui.textWeight(weight);
    frame(0, 0, false, 1 / 60, true);
    if (!ui.savePng(`${FRAMES}text-sheet.png`)) throw new Error("cannot write frames/text-sheet.png");
    console.log(`\ntext-oracle: stored frames/text-sheet.png and frames/text-oracle.png`);
  }
}
