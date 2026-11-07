// The listDetail kind, read back from the wide Sky page and from its own frame: a page's list pane and its detail pane,
// each the element the capture drew, on the cell grid and labelled with the element's name. The test is the kind's
// honesty, in `figure-app-shell.test.ts`'s shape:
//
//   (a) the spec's boxes and texts are a fresh capture of the wide Sky page with the thread open — the same call
//       `specs/from-frames.ts` writes the spec with, so the data is the page's frame and not a transcription;
//   (b) the list pane and the detail pane are elements of that capture and their rects are those elements' own boxes;
//   (c) the panes do not overlap and their union is the whole 720x760 page, counted in the page's own pixels;
//   (d) the drawing is the panes' own cell rects: each label on its pane's row, each rule on the pane's top and bottom
//       rows, at round(x/8), round(y/16) — and the two boxes under it;
//   (e) the refusals, in their sentences, and the mutation that matters: a pane 4px off the frame's box is refused;
//   (f) the command golden on the desktop and the terminal's rows;
//   (g) the text half is the same layout.
//
//   bun solid/figure-list-detail.test.ts
import "./plugin.ts";

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { capture } = await import("./dump.ts");
const { offlineLoader, LIST_DETAIL_CLICK, LIST_DETAIL_SETTLE, LIST_DETAIL_WIDTH } = await import(
  "./specs/from-frames.ts"
);
const { CELL_HEIGHT, CELL_WIDTH, PADDING_X, PADDING_Y, layoutOf } = await import("./src/figure/kinds.ts");
const { cellBox } = await import("./src/figure/kinds/wireframe.ts");
const { check, parse } = await import("./src/figure/spec.ts");
const { format } = await import("./src/format.ts");
const { cellWidth, render } = await import("./src/figure/text.ts");

import type { ListDetailSpec, WireBox } from "./src/figure/spec.ts";

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

const spec: ListDetailSpec = (() => {
  const parsed = parse(readFileSync(new URL("./specs/list-detail.json", import.meta.url), "utf8"), {
    dir: new URL("./specs/", import.meta.url).pathname,
  });
  if (!parsed.spec) throw new Error(`solid/specs/list-detail.json: ${parsed.problems.join(" ")}`);
  return parsed.spec as ListDetailSpec;
})();

let failed = 0;
let checks = 0;
const ok = (what: string, extra = "") => (checks++, console.log(`ok   ${what}${extra ? ` — ${extra}` : ""}`));
const bad = (what: string, why: string) => (checks++, failed++, console.error(`FAIL ${what}: ${why}`));
const yes = (okay: boolean, what: string, good: string, why: string) => (okay ? ok(what, good) : bad(what, why));

const work = mkdtempSync(join(tmpdir(), "cssints-figure-list-"));

// (a) the data is the wide Sky page's frame, captured the way specs/from-frames.ts captures it: 720px, the second card's
// body pressed, the recording as the loader, forty frames at rest
const dump = (await capture("sky", undefined, {
  width: LIST_DETAIL_WIDTH,
  clickOn: LIST_DETAIL_CLICK,
  settle: LIST_DETAIL_SETTLE,
  load: offlineLoader(),
})) as Dump;
const frameOf = (commands: readonly Cmd[]) => {
  const boxes: WireBox[] = [];
  const texts: { x: number; y: number; text: string }[] = [];
  for (const command of commands) {
    if (!Array.isArray(command.box) || command.box.length < 4) continue;
    const [x, y, width, height] = command.box.map(Number) as [number, number, number, number];
    if (![x, y, width, height].every(Number.isFinite)) continue;
    if (command.type === "rectangle" || command.type === "border") {
      if (width > 0 && height > 0 && Math.round(width / CELL_WIDTH) >= 2 && Math.round(height / CELL_HEIGHT) >= 1)
        boxes.push({ x, y, width, height });
    } else if (command.type === "text" && typeof command.text === "string" && command.text.trim())
      texts.push({ x, y, text: command.text });
  }
  return { boxes, texts };
};
const frame = frameOf(dump.commands);
if (dump.size[0] === spec.data.width && dump.size[1] === spec.data.height)
  ok("the page", `sky at ${dump.size[0]}x${dump.size[1]}, the data's own size`);
else bad("the page", `the capture is ${dump.size.join("x")}, the data's ${spec.data.width}x${spec.data.height}`);
const sameFrame =
  JSON.stringify(frame.boxes) === JSON.stringify(spec.data.boxes) &&
  JSON.stringify(frame.texts) === JSON.stringify(spec.data.texts);
yes(
  sameFrame,
  "the data is the frame",
  `${frame.boxes.length} boxes and ${frame.texts.length} texts, command for command`,
  "the spec's boxes/texts are not the capture's (regenerate with specs/from-frames.ts)",
);

// (b) each pane is an element of the capture, at that element's own box
const panes = [spec.data.list, spec.data.detail];
const elementOf = (element: string) =>
  dump.commands.find(
    (candidate) => candidate.element === element && (candidate.type === "rectangle" || candidate.type === "border"),
  );
const wrong = panes.filter((pane) => {
  const command = elementOf(pane.element);
  return !(
    command &&
    command.box[0] === pane.x &&
    command.box[1] === pane.y &&
    command.box[2] === pane.width &&
    command.box[3] === pane.height
  );
});
yes(
  !wrong.length,
  "each pane is an element of the capture",
  panes.map((pane) => `${pane.element} ${pane.x},${pane.y} ${pane.width}x${pane.height}`).join("; "),
  wrong.map((pane) => `${pane.element} is not the frame's ${JSON.stringify(elementOf(pane.element)?.box)}`).join("; "),
);
yes(
  panes[0]!.element !== panes[1]!.element && panes.every((pane) => pane.width > 0 && pane.height > 0),
  "the two panes are two elements",
  `${panes[0]!.element} and ${panes[1]!.element}, one each`,
  `the panes are ${JSON.stringify(panes.map((pane) => pane.element))}`,
);

// (c) the panes do not overlap, and the union is the page
const overlapsAt = (a: WireBox, b: WireBox) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
yes(
  !overlapsAt(spec.data.list, spec.data.detail),
  "the panes do not overlap",
  "the list's right edge is the detail's left, at the page's top",
  `${spec.data.list.element} and ${spec.data.detail.element} share a pixel`,
);
const area = panes.reduce((sum, pane) => sum + pane.width * pane.height, 0);
const pageArea = spec.data.width * spec.data.height;
const inside = panes.every(
  (pane) => pane.x >= 0 && pane.y >= 0 && pane.x + pane.width <= spec.data.width && pane.y + pane.height <= spec.data.height,
);
yes(
  inside && area === pageArea,
  "the panes' union is the page",
  `${area} of the page's ${pageArea} px: ${panes.length} panes tile it`,
  `${area} of ${pageArea} px (inside ${inside})`,
);

// (d) the drawing: each pane's own cell rect, at 8px across and 16px down, and the two boxes under it
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
const drawnWrong: string[] = [];
for (const pane of panes) {
  const box = cellBox(pane);
  const labelRow = box.rows >= 3 ? box.row + 1 : box.row;
  const bottom = box.row + box.rows - 1;
  const role = pane === spec.data.list ? "list" : "detail";
  if (!(lines[labelRow] ?? "").includes(`${role} ${pane.element}`))
    drawnWrong.push(`${pane.element}'s label is not on row ${labelRow}`);
  if (!ruleAt(bottom, box.col, box.cols)) drawnWrong.push(`${pane.element}'s rule is not on row ${bottom}`);
  if (box.rows >= 3 && !ruleAt(box.row, box.col, box.cols))
    drawnWrong.push(`${pane.element}'s top rule is not on row ${box.row}`);
}
yes(
  lines.length === gridRows && !drawnWrong.length,
  "the drawing is the panes' own cells",
  `${gridRows} rows of ${Math.round(spec.data.width / CELL_WIDTH)} cells; each label on its pane's row, each rule on its own`,
  drawnWrong.join("; "),
);
const note = rowText(layout.lines[start + gridRows]!);
const wantNote = `${panes[0]!.element} ${panes[0]!.width}x${panes[0]!.height} at ${panes[0]!.x},${panes[0]!.y}, ${panes[1]!.element} ${panes[1]!.width}x${panes[1]!.height} at ${panes[1]!.x},${panes[1]!.y}`;
if (note === wantNote) ok("the note", `"${note}" under the drawing`);
else bad("the note", `${JSON.stringify(note)} is not ${JSON.stringify(wantNote)}`);

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
const source = "Sample: the Sky page's thread, beside its feed";
refuses(
  "a page this repository does not have",
  { kind: "listDetail", source, data: { ...clone(spec.data), page: "pieChart" } },
  'A wireframe\'s page is one this repository draws — dialog, list, sensors, sheet, sky, widgets — not "pieChart".',
);
refuses(
  "a pane the frame did not draw",
  { kind: "listDetail", source, data: { ...clone(spec.data), list: { ...clone(spec.data.list), x: 4 } } },
  "The list pane sky-feed-pane 4,0 360x760 is not one of its frame's boxes: a pane is an element the frame drew.",
);
refuses(
  "a pane outside the page",
  { kind: "listDetail", source, data: { ...clone(spec.data), list: { ...clone(spec.data.list), x: -8 } } },
  `The list pane sky-feed-pane -8,0 360x760 is outside the ${spec.data.width}x${spec.data.height} page: a pane is a ` +
    "part of the page.",
);
const stacked = clone(spec.data);
stacked.detail = { ...stacked.detail, x: 0 };
refuses(
  "two panes that overlap",
  { kind: "listDetail", source, data: stacked },
  "The list pane sky-feed-pane and the detail pane sky-thread overlap: two panes of one page do not.",
);
const partial = clone(spec.data);
partial.detail = { ...partial.detail, width: 200 };
refuses(
  "panes that do not tile the page",
  { kind: "listDetail", source, data: partial },
  `The panes cover ${360 * 760 + 200 * 760} of the page's ${720 * 760} pixels: a list and a detail pane tile the page.`,
);
const twice = clone(spec.data);
twice.detail = { ...twice.detail, element: "sky-feed-pane" };
refuses(
  "one element for both panes",
  { kind: "listDetail", source, data: twice },
  'A page\'s list and detail panes are two elements, not "sky-feed-pane" twice.',
);

// (f) the golden and the terminal's rows
const figureFrame = (await capture("figure", undefined, { spec, warm: 2 })) as Dump;
const golden = readFileSync(new URL("./goldens/figure-list-detail.json", import.meta.url), "utf8").trim();
const got = format({ commands: figureFrame.commands, effects: figureFrame.effects });
if (got === golden) ok("the golden", "solid/goldens/figure-list-detail.json, every command field identical");
else {
  const at = got.split("\n").findIndex((line, i) => line !== golden.split("\n")[i]);
  bad("the golden", `solid/goldens/figure-list-detail.json differs at line ${at + 1}: ${JSON.stringify(got.split("\n")[at])}`);
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
const out = join(work, "list-detail.txt");
const run = spawnSync(
  "bun",
  [
    "terminal/solid.ts", "--page", "figure",
    "--spec", new URL("./specs/list-detail.json", import.meta.url).pathname,
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

// (e) the mutation: a pane 4px off its element's box — the one thing a figure of a frame cannot afford — reads as a
// different rule column, and the check refuses it (the block above is that refusal, in its sentence)
const list = cellBox(spec.data.list);
const shifted = cellBox({ ...spec.data.list, x: spec.data.list.x + 4 });
const mutation = shifted.col !== list.col;
yes(
  mutation,
  "mutation: a pane 4px off the frame's box",
  `${spec.data.list.element} at x ${spec.data.list.x} is column ${list.col}; 4px right is column ${shifted.col}, and the check refuses it`,
  "the 4px offset rounds to the same cell, so the drawing could not show it",
);

console.log(`\n${checks} checks, ${failed} failed`);
if (failed) process.exit(1);
