// The appShell kind, read back from the Sky page and from its own frame: a page's shell bands, each the element the
// capture drew, drawn on the cell grid and labelled with the element's name. The test is the kind's honesty:
//
//   (a) the spec's boxes and texts are a fresh capture of the Sky page, command for command;
//   (b) every band is an element of the capture and its rect is that element's own box — a band is not a rectangle
//       the author drew;
//   (c) the bands do not overlap and their union is the whole page, counted in the page's own pixels;
//   (d) the drawing is the bands' own cell rects: each label on its band's row, each band's rule on its bottom row, at
//       round(x/8), round(y/16), round(w/8), round(h/16) — not at 1/8 on both axes;
//   (e) the refusals, in their sentences;
//   (f) the command golden on the desktop and the terminal's rows;
//   (g) the text half is the same layout.
//
//   bun solid/figure-app-shell.test.ts
import "./plugin.ts";

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { capture } = await import("./dump.ts");
const { CELL_HEIGHT, CELL_WIDTH, PADDING_X, PADDING_Y, layoutOf } = await import("./src/figure/kinds.ts");
const { cellBox, frameOf } = await import("./src/figure/kinds/wireframe.ts");
const { check, parse } = await import("./src/figure/spec.ts");
const { format } = await import("./src/format.ts");
const { cellWidth, render } = await import("./src/figure/text.ts");

import type { AppShellSpec, WireBox } from "./src/figure/spec.ts";

interface Cmd {
  type: string;
  element: string | null;
  box: number[];
  text?: string;
}
interface Dump {
  commands: Cmd[];
  effects: unknown;
  size: [number, number];
}

const spec: AppShellSpec = (() => {
  const parsed = parse(readFileSync(new URL("./specs/app-shell.json", import.meta.url), "utf8"));
  if (!parsed.spec) throw new Error(`solid/specs/app-shell.json: ${parsed.problems.join(" ")}`);
  return parsed.spec as AppShellSpec;
})();

let failed = 0;
let checks = 0;
const ok = (what: string, extra = "") => (checks++, console.log(`ok   ${what}${extra ? ` — ${extra}` : ""}`));
const bad = (what: string, why: string) => (checks++, failed++, console.error(`FAIL ${what}: ${why}`));

const work = mkdtempSync(join(tmpdir(), "cssints-figure-shell-"));
const yes = (okay: boolean, what: string, good: string, why: string) => (okay ? ok(what, good) : bad(what, why));

// (a) the data is the Sky page's frame, captured the way specs/from-frames.ts captures it
const dump = (await capture("sky")) as Dump;
if (dump.size[0] === spec.data.width && dump.size[1] === spec.data.height)
  ok("the page", `sky at ${dump.size[0]}x${dump.size[1]}, the data's own size`);
else bad("the page", `the capture is ${dump.size.join("x")}, the data's ${spec.data.width}x${spec.data.height}`);
const frame = frameOf(dump.commands);
const sameFrame =
  JSON.stringify(frame.boxes) === JSON.stringify(spec.data.boxes) &&
  JSON.stringify(frame.texts) === JSON.stringify(spec.data.texts);
yes(
  sameFrame,
  "the data is the frame",
  `${frame.boxes.length} boxes and ${frame.texts.length} texts, command for command`,
  "the spec's boxes/texts are not the capture's (regenerate with specs/from-frames.ts)",
);

// (b) every band is an element of the capture, at that element's own box
const bands = spec.data.regions;
const wrongBand: string[] = [];
for (const band of bands) {
  const command = dump.commands.find(
    (candidate) =>
      candidate.element === band.element && (candidate.type === "rectangle" || candidate.type === "border"),
  );
  const same =
    command &&
    command.box[0] === band.x &&
    command.box[1] === band.y &&
    command.box[2] === band.width &&
    command.box[3] === band.height;
  if (!same)
    wrongBand.push(`${band.element}: the frame's ${JSON.stringify(command?.box)}, the data's ${band.x},${band.y} ${band.width}x${band.height}`);
}
yes(
  !wrongBand.length,
  "every band is an element of the capture",
  `${bands.map((band) => `${band.band} ${band.element} ${band.width}x${band.height}`).join("; ")}`,
  wrongBand.join("; "),
);

// (c) the bands do not overlap, and the union is the page
const overlapsAt = (a: WireBox, b: WireBox) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const twin: string[] = [];
for (let i = 0; i < bands.length; i++)
  for (let j = i + 1; j < bands.length; j++)
    if (overlapsAt(bands[i]!, bands[j]!)) twin.push(`${bands[i]!.element}/${bands[j]!.element}`);
yes(
  !twin.length,
  "the bands do not overlap",
  `${bands.length} bands, every pair apart`,
  `overlapping: ${twin.join(", ")}`,
);
const area = bands.reduce((sum, band) => sum + band.width * band.height, 0);
const pageArea = spec.data.width * spec.data.height;
const inside = bands.every(
  (band) => band.x >= 0 && band.y >= 0 && band.x + band.width <= spec.data.width && band.y + band.height <= spec.data.height,
);
yes(
  inside && area === pageArea && !twin.length,
  "the bands' union is the page",
  `${area} of the page's ${pageArea} px: ${bands.length} bands tile it`,
  `${area} of ${pageArea} px (inside ${inside})`,
);

// (d) the drawing: each band's own cell rect, at 8px across and 16px down
const layout = layoutOf(spec);
const start = spec.title ? 1 : 0;
const gridRows = Math.round(spec.data.height / CELL_HEIGHT);
const rowText = (line: (typeof layout.lines)[number]) =>
  line.items.map((item) => (item.kind === "text" ? item.text : " ".repeat(item.cells))).join("");
const lines = layout.lines.slice(start, start + gridRows).map(rowText);
const ruleAt = (row: number, left: number, width: number) => {
  const slice = (lines[row] ?? "").slice(left, left + width);
  return /^\+-+\+$/.test(slice) ? slice : undefined;
};
let drawnWrong: string[] = [];
for (const band of bands) {
  const box = cellBox(band);
  const labelRow = box.rows >= 3 ? box.row + 1 : box.row;
  const bottom = box.row + box.rows - 1;
  if (!(lines[labelRow] ?? "").includes(`${band.band} ${band.element}`))
    drawnWrong.push(`${band.element}'s label is not on row ${labelRow}`);
  if (!ruleAt(bottom, box.col, box.cols)) drawnWrong.push(`${band.element}'s rule is not on row ${bottom}`);
  if (box.rows >= 3 && !ruleAt(box.row, box.col, box.cols))
    drawnWrong.push(`${band.element}'s top rule is not on row ${box.row}`);
}
yes(
  lines.length === gridRows && !drawnWrong.length,
  "the drawing is the bands' own cells",
  `${gridRows} rows of ${Math.round(spec.data.width / CELL_WIDTH)} cells; each label on its band's row, each rule on its own`,
  drawnWrong.join("; "),
);

// (g) the text half: the title first, the drawing's width, no line over the fence's width
const fence = Math.max(80, layout.width + 2 * PADDING_X);
const text = render(spec, { width: fence }).split("\n");
yes(
  text[0] === spec.title && text.every((line) => cellWidth(line) <= fence),
  "the text half",
  `${text.length} lines, the title first, the widest ${Math.max(...text.map(cellWidth))} cells`,
  `the first line is ${JSON.stringify(text[0])}`,
);

// (e) the refusals, in their sentences
const refuses = (what: string, input: unknown, sentence: string) => {
  const problems = check(input);
  yes(
    problems.some((problem) => problem === sentence || problem.includes(sentence)),
    `check: ${what}`,
    sentence,
    `no refusal with ${JSON.stringify(sentence)}: ${JSON.stringify(problems)}`,
  );
};
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const source = "Sample: the Sky page's shell";
refuses(
  "a page this repository does not have",
  { kind: "appShell", source, data: { ...clone(spec.data), page: "pieChart" } },
  'A wireframe\'s page is one this repository draws — dialog, list, sensors, sheet, sky, widgets — not "pieChart".',
);
const moved = clone(spec.data);
moved.regions[0]!.height = 72;
refuses(
  "a band that is not a frame box",
  { kind: "appShell", source, data: moved },
  "The shell's band sky-bar 0,0 360x72 is not one of its frame's boxes: a band is an element the frame drew.",
);
const stacked = clone(spec.data);
stacked.regions[2] = { ...stacked.regions[2]!, y: 0, height: 64 };
refuses(
  "two bands that overlap",
  { kind: "appShell", source, data: stacked },
  "The shell's bands sky-bar and sky-status overlap: a page's bands do not.",
);
const partial = clone(spec.data);
partial.regions = partial.regions.slice(0, 2) as typeof partial.regions;
refuses(
  "bands that do not tile the page",
  { kind: "appShell", source, data: partial },
  `The shell's bands cover ${360 * 64 + 360 * 664} of the page's ${360 * 760} pixels: a shell's bands tile the page.`,
);
const outside = clone(spec.data);
outside.regions[0]!.x = -8;
refuses(
  "a band outside the page",
  { kind: "appShell", source, data: outside },
  "The shell's band sky-bar -8,0 360x64 is outside the 360x760 page: a band is a part of the page.",
);

// (f) the golden and the terminal's rows
const figureFrame = (await capture("figure", undefined, { spec, warm: 2 })) as Dump;
const golden = readFileSync(new URL("./goldens/figure-app-shell.json", import.meta.url), "utf8").trim();
const got = format({ commands: figureFrame.commands, effects: figureFrame.effects });
if (got === golden) ok("the golden", "solid/goldens/figure-app-shell.json, every command field identical");
else {
  const at = got.split("\n").findIndex((line, i) => line !== golden.split("\n")[i]);
  bad("the golden", `solid/goldens/figure-app-shell.json differs at line ${at + 1}: ${JSON.stringify(got.split("\n")[at])}`);
}

/** The terminal's dump as rows: above the colour table, dots and runs of blanks dropped (figure.test.ts's reading). */
function rowsOfCells(text: string): string[] {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => line.startsWith("# colours"));
  return lines
    .slice(0, at < 0 ? lines.length : at)
    .map((line) => line.replace(/\./g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
/** The frame's rows as characters, each text command at its own cell column. */
function rowsOfFrame(dump: Dump): string[] {
  const rows = new Map<number, Cmd[]>();
  for (const command of dump.commands)
    if (command.type === "text" && command.text !== undefined) {
      const row = Math.round(command.box[1]! / CELL_HEIGHT);
      const parts = rows.get(row) ?? [];
      parts.push(command);
      rows.set(row, parts);
    }
  return [...rows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, parts]) => {
      let line = "";
      for (const part of parts.sort((a, b) => a.box[0]! - b.box[0]!)) {
        const col = Math.round((part.box[0]! - PADDING_X * CELL_WIDTH) / CELL_WIDTH);
        line += " ".repeat(Math.max(0, col - cellWidth(line))) + (part.text ?? "");
      }
      return line;
    });
}
const normalise = (line: string) => line.replace(/\./g, " ").replace(/\s+/g, " ").trim();
const rows = layout.lines.reduce((n, line) => n + (line.height ?? 1), 0) + 2 * PADDING_Y;
const cols = Math.max(80, layout.width + 2 * PADDING_X);
const out = join(work, "app-shell.txt");
const run = spawnSync(
  "bun",
  [
    "terminal/solid.ts", "--page", "figure",
    "--spec", new URL("./specs/app-shell.json", import.meta.url).pathname,
    "--cols", String(cols), "--rows", String(rows), "--dump", out,
  ],
  { cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" },
);
if (run.status !== 0) bad("the terminal", `exit ${run.status}: ${run.stderr.trim()}`);
else {
  const cells = rowsOfCells(readFileSync(out, "utf8"));
  const pixel = rowsOfFrame(figureFrame).map(normalise).filter(Boolean);
  let differ = -1;
  for (let i = 0; i < cells.length && i < pixel.length; i++)
    if (cells[i] !== pixel[i]) {
      differ = i;
      break;
    }
  if (cells.length !== pixel.length) bad("the terminal's rows", `${cells.length} rows, the pixel figure's ${pixel.length}`);
  else if (differ >= 0)
    bad("the terminal's rows", `row ${differ + 1}: ${JSON.stringify(cells[differ])} is not ${JSON.stringify(pixel[differ])}`);
  else ok("the terminal's rows", `${cells.length} rows, the pixel figure's words; ${cols} columns`);
}

// (g) the mutation: a band read at 8px down as well as across lands on another row
const feed = bands[1]!;
const cellRow = Math.round(feed.y / CELL_HEIGHT) + 1;
const wrongRow = Math.round(feed.y / CELL_WIDTH);
if (cellRow !== wrongRow && lines[cellRow]!.includes(`content ${feed.element}`) && !lines[wrongRow]!.includes(`content ${feed.element}`))
  ok(
    "mutation: a band's row read at 8px down",
    `${feed.element} at y ${feed.y} is row ${cellRow} at 16px a cell and row ${wrongRow} at 8px: the drawing is on ${cellRow}`,
  );
else bad("mutation: a band's row read at 8px down", `rows ${cellRow} against ${wrongRow}`);

console.log(`\n${checks} checks, ${failed} failed`);
if (failed) process.exit(1);
