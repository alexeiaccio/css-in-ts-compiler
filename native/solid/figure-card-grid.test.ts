// The cardGrid kind, read back from the Sky page and from its own frame: the feed's repeated post cards, each the
// element the capture drew, each at its own box with its index, and the grid its boxes make. The test is the kind's
// honesty:
//
//   (a) the spec's boxes and texts are a fresh capture of the Sky page, command for command;
//   (b) the cards are the capture's elements whose names start with the prefix — their count, their indices and their
//       boxes, not a list the author wrote;
//   (c) the columns and the two gaps are the cards' boxes' (`gridOf`), with the row gap every gap down the column;
//   (d) the drawing is each card's own cell rect with its index on it, and the grid's numbers are the note under it;
//   (e) the refusals, in their sentences;
//   (f) the command golden on the desktop and the terminal's rows;
//   (g) the text half is the same layout.
//
//   bun solid/figure-card-grid.test.ts
import "./plugin.ts";

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { capture } = await import("./dump.ts");
const { CELL_HEIGHT, CELL_WIDTH, PADDING_X, PADDING_Y, layoutOf } = await import("./src/figure/kinds.ts");
const { cellBox, frameOf, gridOf } = await import("./src/figure/kinds/wireframe.ts");
const { check, parse } = await import("./src/figure/spec.ts");
const { format } = await import("./src/format.ts");
const { cellWidth, render } = await import("./src/figure/text.ts");

import type { CardGridSpec } from "./src/figure/spec.ts";

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

const spec: CardGridSpec = (() => {
  const parsed = parse(readFileSync(new URL("./specs/card-grid.json", import.meta.url), "utf8"));
  if (!parsed.spec) throw new Error(`solid/specs/card-grid.json: ${parsed.problems.join(" ")}`);
  return parsed.spec as CardGridSpec;
})();

let failed = 0;
let checks = 0;
const ok = (what: string, extra = "") => (checks++, console.log(`ok   ${what}${extra ? ` — ${extra}` : ""}`));
const bad = (what: string, why: string) => (checks++, failed++, console.error(`FAIL ${what}: ${why}`));
const yes = (okay: boolean, what: string, good: string, why: string) => (okay ? ok(what, good) : bad(what, why));

const work = mkdtempSync(join(tmpdir(), "cssints-figure-grid-"));
const { width, height, prefix, cards } = spec.data;

// (a) the data is the Sky page's frame, captured the way specs/from-frames.ts captures it
const dump = (await capture("sky")) as Dump;
if (dump.size[0] === width && dump.size[1] === height)
  ok("the page", `sky at ${dump.size[0]}x${dump.size[1]}, the data's own size`);
else bad("the page", `the capture is ${dump.size.join("x")}, the data's ${width}x${height}`);
const frame = frameOf(dump.commands);
yes(
  JSON.stringify(frame.boxes) === JSON.stringify(spec.data.boxes) &&
    JSON.stringify(frame.texts) === JSON.stringify(spec.data.texts),
  "the data is the frame",
  `${frame.boxes.length} boxes and ${frame.texts.length} texts, command for command`,
  "the spec's boxes/texts are not the capture's (regenerate with specs/from-frames.ts)",
);

// (b) the cards are the capture's elements with the prefix: the count, the indices and the boxes
const seen = new Set<string>();
const fromCapture: { index: number; element: string; x: number; y: number; width: number; height: number }[] = [];
for (const command of dump.commands) {
  const element = command.element;
  if (command.type !== "rectangle" && command.type !== "border") continue;
  if (!element || !element.startsWith(prefix) || seen.has(element)) continue;
  seen.add(element);
  fromCapture.push({
    index: Number(element.slice(prefix.length)),
    element,
    x: command.box[0]!,
    y: command.box[1]!,
    width: command.box[2]!,
    height: command.box[3]!,
  });
}
fromCapture.sort((a, b) => a.index - b.index);
const sameCards = JSON.stringify(fromCapture) === JSON.stringify(cards);
yes(
  sameCards,
  "the cards are the elements with the prefix",
  `${cards.length} cards, ${JSON.stringify(prefix)}: ${cards.map((card) => `${card.element} ${card.width}x${card.height}`).join(", ")}`,
  `the capture's ${JSON.stringify(fromCapture.map((card) => card.element))}, the data's ${JSON.stringify(cards.map((card) => card.element))}`,
);

// (c) the columns and the gaps are the boxes'
const grid = gridOf(cards);
yes(
  grid.columns === spec.data.columns &&
    grid.gaps.every((gap) => gap === spec.data.gap) &&
    grid.columnGap === spec.data.columnGap,
  "the grid is the cards' boxes",
  `${grid.columns} column, ${[...new Set(grid.gaps)].join("px, ")}px between rows, ${grid.columnGap}px between columns`,
  `${JSON.stringify(grid)} is not ${JSON.stringify({ columns: spec.data.columns, gap: spec.data.gap, columnGap: spec.data.columnGap })}`,
);

// (d) the drawing: each card's own cell rect, its index on it, and the grid's numbers in the note
const layout = layoutOf(spec);
const start = spec.title ? 1 : 0;
const gridRows = Math.round(height / CELL_HEIGHT);
const rowText = (line: (typeof layout.lines)[number]) =>
  line.items.map((item) => (item.kind === "text" ? item.text : " ".repeat(item.cells))).join("");
const lines = layout.lines.slice(start, start + gridRows).map(rowText);
const note = rowText(layout.lines[start + gridRows]!);
const ruleAt = (row: number, left: number, width: number) => /^\+-+\+$/.test((lines[row] ?? "").slice(left, left + width));
let drawnWrong: string[] = [];
for (const card of cards) {
  const box = cellBox(card);
  const labelRow = box.rows >= 3 ? box.row + 1 : box.row;
  const bottom = box.row + box.rows - 1;
  if (!(lines[labelRow] ?? "").includes(`#${card.index} ${card.element}`))
    drawnWrong.push(`${card.element}'s index is not on row ${labelRow}`);
  if (!ruleAt(bottom, box.col, box.cols)) drawnWrong.push(`${card.element}'s rule is not on row ${bottom}`);
}
const wantNote = `${cards.length} cards in ${grid.columns} column${grid.columns === 1 ? "" : "s"}, ${grid.gap}px between rows`;
yes(
  lines.length === gridRows && note === wantNote && !drawnWrong.length,
  "the drawing is the cards' own cells",
  `${gridRows} rows of ${Math.round(width / CELL_WIDTH)} cells; "${note}" under them; each card's index on its own row`,
  `${drawnWrong.join("; ")}${note === wantNote ? "" : `; the note is ${JSON.stringify(note)}, not ${JSON.stringify(wantNote)}`}`,
);

// (g) the text half: the title first, no line over the fence's width
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
const source = "Sample: the Sky feed's cards";
refuses(
  "a page this repository does not have",
  { kind: "cardGrid", source, data: { ...clone(spec.data), page: "pieChart" } },
  'A wireframe\'s page is one this repository draws — dialog, list, sensors, sheet, sky, widgets — not "pieChart".',
);
const moved = clone(spec.data);
moved.cards[0]!.width += 8;
refuses(
  "a card that is not a frame box",
  { kind: "cardGrid", source, data: moved },
  `Card sky-card-0 ${moved.cards[0]!.x},${moved.cards[0]!.y} ${moved.cards[0]!.width}x${moved.cards[0]!.height} is not one of ` +
    "its frame's boxes: a card is an element the frame drew.",
);
const twice = clone(spec.data);
twice.cards[1]!.index = 0;
refuses("two cards on one index", { kind: "cardGrid", source, data: twice }, "Card 0 is numbered twice: one index, one card.");
const columns = clone(spec.data);
columns.columns = cards.length;
refuses(
  "columns that are not the boxes'",
  { kind: "cardGrid", source, data: columns },
  `The card grid says ${cards.length} columns, but its cards' boxes make ${grid.columns}: the columns are the boxes'.`,
);
const gap = clone(spec.data);
gap.gap = 10;
refuses(
  "a gap that is not the boxes'",
  { kind: "cardGrid", source, data: gap },
  `The card grid says a 10px gap, but its cards' boxes are ${[...new Set(grid.gaps)].join("px, ")}px apart: the gap is the boxes'.`,
);
const one = clone(spec.data);
one.cards = one.cards.slice(0, 1) as typeof one.cards;
refuses(
  "one card is not a grid",
  { kind: "cardGrid", source, data: one },
  "A card grid needs at least two cards — the page's repeated elements — not 1.",
);

// (f) the golden and the terminal's rows
const figureFrame = (await capture("figure", undefined, { spec, warm: 2 })) as Dump;
const golden = readFileSync(new URL("./goldens/figure-card-grid.json", import.meta.url), "utf8").trim();
const got = format({ commands: figureFrame.commands, effects: figureFrame.effects });
if (got === golden) ok("the golden", "solid/goldens/figure-card-grid.json, every command field identical");
else {
  const at = got.split("\n").findIndex((line, i) => line !== golden.split("\n")[i]);
  bad("the golden", `solid/goldens/figure-card-grid.json differs at line ${at + 1}: ${JSON.stringify(got.split("\n")[at])}`);
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
const out = join(work, "card-grid.txt");
const run = spawnSync(
  "bun",
  [
    "terminal/solid.ts", "--page", "figure",
    "--spec", new URL("./specs/card-grid.json", import.meta.url).pathname,
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

// (g) the mutation: the columns are the cards' boxes' (one x), not the cards' count
if (grid.columns === 1 && cards.length > 1)
  ok(
    "mutation: a column per card",
    `${cards.length} cards at one x are ${grid.columns} column, not ${cards.length}: the check refuses columns ${cards.length}`,
  );
else bad("mutation: a column per card", `the grid says ${grid.columns} column(s) for ${cards.length} cards`);

console.log(`\n${checks} checks, ${failed} failed`);
if (failed) process.exit(1);
