// The intentCard kind, read back from the Sky page's own frames and from its own frame: one animation as a card — the
// preset whose fields it moves, the two properties and the values they run between, the 100ms it waits, and the frames
// the page actually took, a bar a property a frame.
//
//   (a) the data is the page's: the spec is what `intentCardOf` makes of a fresh capture at each of its frames, so the
//       alpha and the y are the group effects the page drew, not a model's samples;
//   (b) the preset is the package's name for the card's field set (`slide-in-up`: opacity and a positive y), the duration
//       is `CARD_ENTRY.time` and the delay `CARD_INDEX` steps of it;
//   (c) the frames start at the values the entry comes from and end at its settle;
//   (d) the drawing is the card's: a bar a property a frame, whose fill is the frame's own progress, read back from the
//       frame's boxes;
//   (e) the refusals, in their sentences;
//   (f) the command golden, the stored frame, the terminal's rows and the text half;
//   (g) a mutation: a frame's alpha changed is no longer the page's frame, named where the two differ.
//
//   bun solid/figure-intent-card.test.ts
import "./plugin.ts";

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CARD_ENTRY } from "./src/animations.ts";
import { CELL_HEIGHT, CELL_WIDTH, PADDING_X, PADDING_Y, layoutOf } from "./src/figure/kinds.ts";
import { shownValue } from "./src/figure/kinds/motion.ts";
import { check, parse, type IntentCardSpec } from "./src/figure/spec.ts";
import { format } from "./src/format.ts";
import { cellWidth, render } from "./src/figure/text.ts";
import { CARD_FRAMES, CARD_INDEX, intentCardOf, presetOf } from "./specs/from-frames.ts";

const { capture } = await import("./dump.ts");

interface Cmd {
  type: string;
  element: string | null;
  box: number[];
  text?: string;
}
interface Dump {
  commands: Cmd[];
  effects: unknown;
}

const spec: IntentCardSpec = (() => {
  const parsed = parse(readFileSync(new URL("./specs/intent-card.json", import.meta.url), "utf8"), {
    dir: new URL("./specs/", import.meta.url).pathname,
  });
  if (!parsed.spec) throw new Error(`solid/specs/intent-card.json: ${parsed.problems.join(" ")}`);
  return parsed.spec as IntentCardSpec;
})();

let failed = 0;
let checks = 0;
const ok = (what: string, extra = "") => (checks++, console.log(`ok   ${what}${extra ? ` — ${extra}` : ""}`));
const bad = (what: string, why: string) => (checks++, failed++, console.error(`FAIL ${what}: ${why}`));
const yes = (fine: boolean, what: string, good: string, why: string) => (fine ? ok(what, good) : bad(what, why));
const work = mkdtempSync(join(tmpdir(), "cssints-figure-card-"));

// (a) the data is the page's: the spec is what the same capture makes of the card, frame for frame
const captures = [];
for (const n of CARD_FRAMES) captures.push({ frame: await capture("sky", undefined, { warm: 0, settle: n }), n });
const again = intentCardOf(captures);
{
  const same = JSON.stringify(again) === JSON.stringify(spec.data);
  yes(
    same,
    "the data is the page's frames",
    `${spec.data.frames.length} frames of ${spec.data.label} (${spec.data.frames
      .map((frame) => `${frame.ms}ms`)
      .join(", ")}), the group's alpha and y, command for effect row`,
    `the spec is not what specs/from-frames.ts captures (regenerate it); the capture says ${JSON.stringify(again.frames[0])}`,
  );
}

// (b) the preset, the duration and the delay are the page's and the package's
{
  const fields = spec.data.properties.map((property) => (property.name === "translate y" ? "y" : property.name));
  const preset = presetOf(fields, "in", { y: CARD_ENTRY.y });
  const duration = Math.round(CARD_ENTRY.time * 1000);
  const delay = Math.round(CARD_INDEX * CARD_ENTRY.delay * 1000);
  yes(
    spec.data.preset === preset && spec.data.duration === duration && spec.data.delay === delay,
    "the preset, the duration and the delay",
    `${spec.data.preset} for the fields ${fields.join(", ")}; ${spec.data.duration}ms, ${spec.data.delay}ms late ` +
      `(CARD_ENTRY's ${duration}ms, card ${CARD_INDEX + 1}'s ${delay}ms)`,
    `the spec says ${spec.data.preset} ${spec.data.duration}ms ${spec.data.delay}ms, the page ${preset} ${duration}ms ${delay}ms`,
  );
}

// (c) the frames start at the entry's values and end at its settle
{
  const first = spec.data.frames[0]!;
  const last = spec.data.frames[spec.data.frames.length - 1]!;
  const starts = spec.data.properties.every((property, p) => Math.abs(first.values[p]! - property.from) <= 0.011);
  const settles = spec.data.properties.every((property, p) => Math.abs(last.values[p]! - property.to) <= 0.011);
  yes(
    starts && settles,
    "the frames' two ends",
    `frame 1 ${first.values.join(", ")} is the entry's from values; frame ${spec.data.frames.length} ` +
      `${last.values.join(", ")} is the settle, at ${last.ms}ms`,
    `frame 1 ${first.values.join(", ")}, the last ${last.values.join(", ")}`,
  );
}

// (d) the drawing: a bar a property a frame, its fill the frame's own progress
const layout = layoutOf(spec);
const dump = (await capture("figure", undefined, { spec, warm: 2 })) as Dump;
{
  const boxes = (id: string) => {
    const command = dump.commands.find((row) => row.element === id);
    return command?.box;
  };
  const wrong: string[] = [];
  let bars = 0;
  for (const bar of layout.bars) {
    bars++;
    const fill = boxes(bar.fillId);
    const track = boxes(bar.trackId);
    if (!fill || !track) {
      wrong.push(`${bar.label} is not a box in the frame`);
      continue;
    }
    if (Math.abs(fill[2]! - bar.fill * CELL_WIDTH) > 0.01 || Math.abs(track[2]! - bar.track * CELL_WIDTH) > 0.01)
      wrong.push(`${bar.label}'s fill is ${fill[2]}px, its ${bar.fill} of ${bar.track} cells`);
    const ratio = bar.max === 0 ? 0 : bar.value / bar.max;
    if (Math.abs(ratio - bar.fill / bar.track) > 0.5 / bar.track)
      wrong.push(`${bar.label}'s fill is ${bar.fill} cells, its value ${bar.value}/${bar.max}`);
  }
  yes(
    !wrong.length && bars === spec.data.frames.length * spec.data.properties.length,
    "the drawing is the card's bars",
    `${bars} bars (${spec.data.frames.length} frames × ${spec.data.properties.length} properties), ` +
      `each fill the frame's progress`,
    wrong.join("; "),
  );
  const drawn = (text: string) =>
    dump.commands.some((command) => command.type === "text" && command.text?.includes(text));
  yes(
    [spec.data.preset, ...spec.data.properties.map((property) => property.name), "frames", `${spec.data.duration}ms`].every(
      drawn,
    ),
    "the card's words",
    `the preset, the properties, the frames' head and the duration are the frame's texts`,
    `missing one of ${JSON.stringify([spec.data.preset, ...spec.data.properties.map((p) => p.name)])}`,
  );
}

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
const source = "Sample: the Sky page's card entry";
const card = (data: unknown) => ({ kind: "intentCard", source, data });
refuses(
  "a duration of nothing",
  card({ ...clone(spec.data), duration: 0 }),
  "the feed's card 3 has a duration of 0ms: an animation's duration is above zero.",
);
refuses(
  "a negative delay",
  card({ ...clone(spec.data), delay: -50 }),
  "the feed's card 3 waits -50ms: a delay is zero or more.",
);
refuses(
  "a property that does not move",
  card({
    ...clone(spec.data),
    properties: [
      { name: "opacity", from: 0, to: 255, unit: "of 255" },
      { name: "translate y", from: 12, to: 12, unit: "px" },
    ],
  }),
  "the feed's card 3's translate y is 12 both from and to: a property an animation changes moves.",
);
refuses(
  "a frame short of its values",
  card({
    ...clone(spec.data),
    frames: [{ ms: 16.67, values: [0, 12] }, { ms: 33.33, values: [0] }],
  }),
  "the feed's card 3's frame 2 has 1 value: the 2 properties it changes.",
);
refuses(
  "a first frame that is not the entry",
  card({
    ...clone(spec.data),
    frames: [{ ms: 16.67, values: [40, 12] }, { ms: 666.67, values: [255, 0] }],
  }),
  "the feed's card 3's first frame is 40.00 opacity: the recording starts at the 0 the animation comes from.",
);
refuses(
  "frames out of order",
  card({
    ...clone(spec.data),
    frames: [{ ms: 16.67, values: [0, 12] }, { ms: 10, values: [255, 0] }],
  }),
  "the feed's card 3's frame 2 is at 10ms, after frame 1's 16.67ms: a card's frames go forward.",
);

// (f) the golden, the stored frame, the terminal's rows and the text half
{
  const golden = readFileSync(new URL("./goldens/figure-intent-card.json", import.meta.url), "utf8").trim();
  const got = format({ commands: dump.commands, effects: dump.effects });
  if (got === golden) ok("the golden", "solid/goldens/figure-intent-card.json, every command field identical");
  else {
    const line = got.split("\n").findIndex((row, i) => row !== golden.split("\n")[i]);
    bad(
      "the golden",
      `solid/goldens/figure-intent-card.json differs at line ${line + 1}: ${JSON.stringify(got.split("\n")[line])}`,
    );
  }

  const run = spawnSync(
    "bun",
    [
      "solid/main.ts", "figure", "--spec", "solid/specs/intent-card.json",
      "--warm", "30", "--expect", "solid/frames/figure-intent-card.png",
    ],
    { cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" },
  );
  yes(
    run.status === 0,
    "the stored frame",
    `solid/frames/figure-intent-card.png, ${statSync(new URL("./frames/figure-intent-card.png", import.meta.url)).size} B, identical`,
    `exit ${run.status}: ${(run.stderr || run.stdout).trim()}`,
  );

  const rows = layout.lines.reduce((n, line) => n + (line.height ?? 1), 0) + 2 * PADDING_Y;
  const cols = Math.max(80, layout.width + 2 * PADDING_X);
  const out = join(work, "intent-card.txt");
  const terminal = spawnSync(
    "bun",
    [
      "terminal/solid.ts", "--page", "figure",
      "--spec", new URL("./specs/intent-card.json", import.meta.url).pathname,
      "--cols", String(cols), "--rows", String(rows), "--dump", out,
    ],
    { cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" },
  );
  if (terminal.status !== 0) bad("the terminal", `exit ${terminal.status}: ${terminal.stderr.trim()}`);
  else {
    const cells = rowsOfCells(readFileSync(out, "utf8"));
    const pixel = rowsOfFrame(dump).map(normalise).filter(Boolean);
    const at = cells.findIndex((line, i) => line !== pixel[i]);
    if (cells.length !== pixel.length) bad("the terminal's rows", `${cells.length} rows, the pixel figure's ${pixel.length}`);
    else if (at >= 0)
      bad("the terminal's rows", `row ${at + 1}: ${JSON.stringify(cells[at])} is not ${JSON.stringify(pixel[at])}`);
    else ok("the terminal's rows", `${cells.length} rows, the pixel figure's words; ${cols} columns`);
  }

  const text = render(spec, { width: cols }).split("\n");
  yes(
    text[0] === spec.title && text.every((line) => cellWidth(line) <= cols),
    "the text half",
    `${text.length} lines, the title first, the widest ${Math.max(...text.map(cellWidth))} of ${cols} cells`,
    `the first line is ${JSON.stringify(text[0])}`,
  );
}

// (g) the mutation: a frame's alpha changed is no longer the page's frame, at the frame and the value
{
  const mutated = clone(spec.data);
  const last = mutated.frames[mutated.frames.length - 1]!;
  (last as { values: number[] }).values[0] = 200;
  const differs = (a: typeof mutated, b: typeof mutated): string | undefined => {
    for (const [f, frame] of a.frames.entries())
      for (const [p, value] of frame.values.entries())
        if (value !== b.frames[f]!.values[p])
          return `frame ${f + 1} at ${frame.ms}ms: ${value} is not the page's ${b.frames[f]!.values[p]}`;
    return undefined;
  };
  const hit = differs(mutated, again);
  if (hit && check({ kind: "intentCard", source, data: mutated }).length === 0)
    ok(
      "mutation: a frame's alpha changed",
      `${hit}; the checks that hold the card to the page's frames name it (the shape alone still passes, as it should)`,
    );
  else bad("mutation: a frame's alpha changed", `no differing frame, or the shape refused the mutation: ${hit}`);
}

/** The terminal's dump as rows: everything above the colour table, dots dropped, blank rows dropped. */
function rowsOfCells(text: string): string[] {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => line.startsWith("# colours"));
  return lines
    .slice(0, at < 0 ? lines.length : at)
    .map((line) => normalise(line))
    .filter(Boolean);
}
/** The frame's rows as words: each text command at its cell, left to right. */
function rowsOfFrame(dump: Dump): string[] {
  const rows = new Map<number, { x: number; text: string }[]>();
  for (const command of dump.commands)
    if (command.type === "text" && command.text !== undefined) {
      const row = Math.round(command.box[1]! / CELL_HEIGHT);
      const parts = rows.get(row) ?? [];
      parts.push({ x: command.box[0]!, text: command.text });
      rows.set(row, parts);
    }
  return [...rows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, parts]) => parts.sort((a, b) => a.x - b.x).map((part) => part.text).join(" "));
}
function normalise(line: string): string {
  return line.replace(/\./g, " ").replace(/\s+/g, " ").trim();
}

console.log(`\n${checks} checks, ${failed} failed`);
if (failed) process.exit(1);
