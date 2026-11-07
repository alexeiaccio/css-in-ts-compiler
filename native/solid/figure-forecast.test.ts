// The forecast kind, read back from the repository's own `CHANGELOG.md` and from its frame: the dated releases are a
// daily series, and the figure draws the days that happened as columns, then the next seven at the trailing fortnight's
// mean inside the band its spread puts around them. The test is the kind's honesty:
//
//   (a) the spec's samples are a fresh count of CHANGELOG.md's release headings, a day a count with a quiet day as a
//       zero, so the figure cannot drift from the cadence it projects;
//   (b) the fit is re-derived here — the mean of the last 14 days, their population sd, and `mean ± 1 sd` clamped at
//       zero a projected day — so the model cannot drift from its own data;
//   (c) the drawing: the series' maximum at the top and `0` on the baseline, a named day's column its count of cells,
//       the projected days painted by the `good` role at their own height, the band by `muted`, and the legend and the
//       fit's words;
//   (d) the six refusals, in their sentences;
//   (e) two mutations that fail: the band drawn as the projection's own sd (one cell, not five) and a projected day one
//       cell up (the band's cell, not the projection's);
//   (f) the command golden on the desktop and the terminal's rows being the pixel figure's words.
//
//   bun solid/figure-forecast.test.ts
import "./plugin.ts";

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { capture } = await import("./dump.ts");
const { CELL_HEIGHT, CELL_WIDTH, PADDING_X, PADDING_Y, layoutOf } = await import("./src/figure/kinds.ts");
const { check, parse } = await import("./src/figure/spec.ts");
const { cellWidth } = await import("./src/figure/text.ts");
const { format } = await import("./src/format.ts");

import type { ForecastSpec } from "./src/figure/spec.ts";
import type { Item, LayoutLine, Paint } from "./src/figure/registry.ts";

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

const spec: ForecastSpec = (() => {
  const parsed = parse(readFileSync(new URL("./specs/forecast.json", import.meta.url), "utf8"), {
    dir: new URL("./specs/", import.meta.url).pathname,
  });
  if (!parsed.spec) throw new Error(`solid/specs/forecast.json: ${parsed.problems.join(" ")}`);
  return parsed.spec as ForecastSpec;
})();

let failed = 0;
let checks = 0;
const ok = (what: string, extra = "") => (checks++, console.log(`ok   ${what}${extra ? ` — ${extra}` : ""}`));
const bad = (what: string, why: string) => (checks++, failed++, console.error(`FAIL ${what}: ${why}`));
const yes = (okay: boolean, what: string, good: string, why: string) => (okay ? ok(what, good) : bad(what, why));

const work = mkdtempSync(join(tmpdir(), "cssints-figure-forecast-"));

// (a) the samples are CHANGELOG.md's dated releases, a calendar day a count
const changelog = readFileSync(new URL("../../CHANGELOG.md", import.meta.url), "utf8");
const dated = [...changelog.matchAll(/^## \d+\.\d+\.\d+ \((\d{4}-\d{2}-\d{2})\)$/gm)].map((match) => match[1]!);
const counts = new Map<string, number>();
for (const date of dated) counts.set(date, (counts.get(date) ?? 0) + 1);
const first = [...counts.keys()].sort()[0]!;
const last = [...counts.keys()].sort().at(-1)!;
const days: { date: string; value: number }[] = [];
for (let ms = Date.parse(`${first}T00:00:00Z`); ms <= Date.parse(`${last}T00:00:00Z`); ms += 86_400_000) {
  const date = new Date(ms).toISOString().slice(0, 10);
  days.push({ date, value: counts.get(date) ?? 0 });
}
const samples = spec.data.samples;
yes(
  days.length === samples.length &&
    days.every((day, i) => day.date === samples[i]!.date && day.value === samples[i]!.value),
  "the data is CHANGELOG.md's series",
  `${days.length} days from ${first} to ${last}, a day a count, quiet days as zeros`,
  `the spec's ${samples.length} days are not a fresh count of CHANGELOG.md's ${dated.length} dated headings`,
);
yes(
  dated.length === 40 && days.reduce((sum, day) => sum + day.value, 0) === 40,
  "the releases",
  `${dated.length} headings counted, ${days.reduce((sum, day) => sum + day.value, 0)} releases over ${days.length} days`,
  `${dated.length} headings, ${days.reduce((sum, day) => sum + day.value, 0)} in the series`,
);

// (b) the fit: the trailing window's mean and population sd, and the band `mean ± 1 sd`, clamped at zero
const window = days.slice(-spec.data.window);
const mean = window.reduce((sum, day) => sum + day.value, 0) / window.length;
const sd = Math.sqrt(window.reduce((sum, day) => sum + (day.value - mean) ** 2, 0) / window.length);
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;
yes(
  close(mean, spec.data.mean),
  "the mean",
  `${mean.toFixed(2)} a day over the last ${window.length} days`,
  `the spec's ${spec.data.mean} is not ${mean} (${spec.data.window} days)`,
);
yes(
  close(sd, spec.data.sd),
  "the sd",
  `${sd} (the population sd of those ${window.length} days)`,
  `the spec's ${spec.data.sd} is not ${sd}`,
);
const low = Math.max(0, mean - sd);
const high = mean + sd;
const wrongBand = spec.data.projection.filter(
  (day) => !close(day.low, low) || !close(day.high, high) || !close(day.value, mean),
);
yes(
  !wrongBand.length && spec.data.projection.length === spec.data.horizon,
  "the projection's band",
  `${spec.data.projection.length} days at ${mean.toFixed(2)}, each ${low.toFixed(2)} to ${high.toFixed(2)}`,
  `${wrongBand.length} projected days are not ${low.toFixed(2)}-${high.toFixed(2)} at ${mean} (horizon ${spec.data.horizon})`,
);
const next = spec.data.projection.map((day) => day.date);
const after = next.every((date) => date > last) && next.every((date, i) => i === 0 || date > next[i - 1]!);
yes(
  after,
  "the days ahead",
  `${next[0]} to ${next[next.length - 1]}, each after the last sample (${last})`,
  `the projection's dates are ${next.join(", ")}`,
);

// (c) the drawing, on the cell grid: the max at the top, `0` on the baseline, a column a day
const layout = layoutOf(spec);
const max = Math.max(...days.map((day) => day.value));
const level = (value: number) => Math.max(1, Math.min(max, Math.round(value)));
/** A line as the characters it draws: a text in its cells, a space as blanks. */
const lineText = (line: LayoutLine): string =>
  line.items
    .map((item) =>
      item.kind === "text" ? item.text + " ".repeat(Math.max(0, item.cells - cellWidth(item.text))) : " ".repeat(item.cells),
    )
    .join("");
const itemOf = (line: LayoutLine, textId: string): Item | undefined =>
  line.items.find((item) => (item.kind === "text" || item.kind === "box") && item.textId === textId);
const zeroLine = layout.lines.find((line) => itemOf(line, "fig-zero"))!;
const gutter = zeroLine.items[0]!.cells;
const start = spec.title ? 1 : 0;
const plot = layout.lines.slice(start, start + max).map(lineText);
const column = (index: number) => plot.map((row) => [...row][gutter + index] ?? " ");
const gap = 1;
const peak = days.reduce((best, day, i) => (day.value > days[best]!.value ? i : best), 0);
yes(
  plot[0]!.startsWith(String(max)) && column(peak).filter((ch) => ch === "#").length === max,
  "the y scale",
  `${max} at the top, 0 on the baseline, ${days[peak]!.date} reaching the ${max}th cell`,
  `the top row is ${JSON.stringify(plot[0])} and the peak's column ${JSON.stringify(column(peak))}`,
);
const named = samples.findIndex((day) => day.value === 3);
const quiet = samples.findIndex((day) => day.value === 0);
yes(
  column(named).filter((ch) => ch === "#").length === 3 &&
    column(quiet).filter((ch) => ch === "#").length === 0,
  "a named day's column",
  `${samples[named]!.date} is three cells, ${samples[quiet]!.date} is none`,
  `${samples[named]!.date} is ${JSON.stringify(column(named))}, ${samples[quiet]!.date} ${JSON.stringify(column(quiet))}`,
);
const projectedAt = samples.length + gap;
const projected = column(projectedAt);
const projectedLevel = level(mean);
const projectedPaint = (painted: Paint) =>
  layout.lines
    .slice(start, start + max)
    .flatMap((line) => line.items)
    .some((item) => item.kind === "text" && item.text.includes("=") && item.paint === painted);
yes(
  projected[max - projectedLevel] === "=" &&
    projected.filter((ch) => ch === "=").length === 1 &&
    projectedPaint("good") &&
    projected.every((ch) => ch === "=" || ch === ":" || ch === " "),
  "the projected days",
  `${spec.data.projection.length} columns at ${projectedLevel} cells, \`=\` painted by the good role, \`:\` the band`,
  `${JSON.stringify(projected)}; the \`=\` at ${projected[max - projectedLevel]}`,
);
const bandLow = level(low);
const bandHigh = level(high);
const bandCells = projected.filter((ch) => ch === ":" || ch === "=").length;
yes(
  bandCells === bandHigh - bandLow + 1 && bandHigh > bandLow,
  "the band",
  `${bandCells} cells, ${bandLow} to ${bandHigh}, the trailing ${spec.data.window} days' spread`,
  `${bandCells} cells for ${bandLow} to ${bandHigh}: the band is not the window's`,
);
const legendLine = layout.lines.find((line) => itemOf(line, "fig-legend-actual"))!;
const legend = lineText(legendLine);
const fitLine = layout.lines.find((line) => itemOf(line, "fig-fit"))!;
const fit = itemOf(fitLine, "fig-fit") as { text: string };
yes(
  legend.includes("actual") &&
    legend.includes("projected") &&
    legend.includes("the band") &&
    legend.includes("#") &&
    legend.includes("=") &&
    legend.includes(":") &&
    fit.text === `mean ${mean.toFixed(2)} a day, sd ${sd.toFixed(2)}: the last ${window.length}, the next ${spec.data.horizon}`,
  "the legend and the fit",
  `"${legend.slice(gutter)}"; "${fit.text}"`,
  `the legend is ${JSON.stringify(legend)} and the fit ${JSON.stringify(fit.text)}`,
);

// (d) the refusals, in their sentences
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const source = spec.source;
const refuses = (what: string, data: unknown, sentence: string) => {
  const problems = check({ kind: "forecast", source, data });
  yes(
    problems.some((problem) => problem === sentence || problem.includes(sentence)),
    `check: ${what}`,
    sentence,
    `no refusal with ${JSON.stringify(sentence)}: ${JSON.stringify(problems)}`,
  );
};
refuses(
  "no samples",
  { ...clone(spec.data), samples: [] },
  "A forecast needs its samples: the days that happened, one a date and a count, a quiet day a zero.",
);
const backwards = clone(spec.data);
backwards.samples[3]!.date = backwards.samples[2]!.date;
refuses(
  "dates that do not run forward",
  backwards,
  `Sample 4's date ${backwards.samples[3]!.date} is not after ${backwards.samples[2]!.date}: a forecast's days run forward.`,
);
refuses("a horizon of zero", { ...clone(spec.data), horizon: 0 }, "A forecast's horizon is 0: a whole number of days above zero.");
refuses(
  "a horizon of a day and a half",
  { ...clone(spec.data), horizon: 1.5 },
  "A forecast's horizon is 1.5: a whole number of days above zero.",
);
const upsideDown = clone(spec.data);
upsideDown.projection[0] = { ...upsideDown.projection[0]!, low: 5, high: 4 };
refuses(
  "a band upside down",
  upsideDown,
  `${upsideDown.projection[0]!.date}'s band runs 5 to 4: its low is above its high.`,
);
const belowZero = clone(spec.data);
belowZero.projection[0] = { ...belowZero.projection[0]!, low: -2, high: 1 };
refuses(
  "a band below zero",
  belowZero,
  `${belowZero.projection[0]!.date}'s band starts at -2: a count is not negative.`,
);
refuses(
  "a model with no sentence",
  { ...clone(spec.data), model: "  " },
  "A forecast needs its model: which window and which fit, in a sentence, so the projection can be argued with.",
);

// (e) the mutations: what a wrong band or a shifted projected day would draw
const ownSd = 0;
const ownBand = Math.max(1, level(mean + ownSd)) - Math.max(1, level(mean - ownSd)) + 1;
yes(
  ownBand !== bandCells,
  "mutation: the band from the projection's own sd",
  `the projection's days have no spread (${ownBand} cell), the trailing window's ${bandCells}: the drawing is the window's`,
  `both bands are ${bandCells} cells`,
);
const shifted = max - (projectedLevel + 1);
yes(
  (plot[shifted] ? [...plot[shifted]!][gutter + projectedAt] : undefined) === ":" &&
    projected[max - projectedLevel] === "=",
  "mutation: a projected day shifted one cell up",
  `one cell up is the band's \`:\`; the model's \`=\` is at ${max - projectedLevel} of ${max}`,
  `row ${shifted} is ${JSON.stringify(plot[shifted])}`,
);

// (f) the golden and the terminal's rows
const figureFrame = (await capture("figure", undefined, { spec, warm: 2 })) as Dump;
const golden = readFileSync(new URL("./goldens/figure-forecast.json", import.meta.url), "utf8").trim();
const got = format({ commands: figureFrame.commands, effects: figureFrame.effects });
if (got === golden) ok("the golden", "solid/goldens/figure-forecast.json, every command field identical");
else {
  const at = got.split("\n").findIndex((line, i) => line !== golden.split("\n")[i]);
  bad("the golden", `solid/goldens/figure-forecast.json differs at line ${at + 1}: ${JSON.stringify(got.split("\n")[at])}`);
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
const out = join(work, "forecast.txt");
const run = spawnSync(
  "bun",
  [
    "terminal/solid.ts", "--page", "figure",
    "--spec", new URL("./specs/forecast.json", import.meta.url).pathname,
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

console.log(`\n${checks} checks, ${failed} failed`);
if (failed) process.exit(1);
