// The Figure page's invariants, read back from the frame and not from a string: for every spec in solid/specs (the six
// kinds), the bar's fill box against its track's, the number's text command, the rows' order, the funnel's ratios, the
// branch flow's boxes and connectors, the state machine's path; then `check`'s own refusals in their sentences; then the
// same spec on the terminal, cell for cell.
//
// The geometry comes from `solid/dump.ts`'s `capture` — the same last frame solid/goldens stores — so a bar is the box
// Clay laid out, not the number the layout asked for. The error is in **cells** (the layout's unit): one cell is 8px
// across, and a fill may round to the nearest half cell of the ratio it should show.
//
//   bun solid/figure.test.ts
import "./plugin.ts";

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { capture } = await import("./dump.ts");
const { layout, CELL_WIDTH } = await import("./src/figure/kinds.ts");
const { check, parse } = await import("./src/figure/spec.ts");
const { variant } = await import("./src/pack.ts");
const { format } = await import("./src/format.ts");
const styles = await import("./app/Figure.styles.ts");

/** A bar may round to the nearest half cell of its ratio: the layout rounds a cell, and that is the whole tolerance. */
const HALF_CELL = 0.5;
const SPECS = ["bars", "funnel", "compare", "pipeline", "branch-flow", "state-machine"] as const;
/** The two new kinds' command goldens: one frame each, stored by the same capture this test reads. */
const GOLDENS: Partial<Record<(typeof SPECS)[number], string>> = {
  "branch-flow": "figure-branch-flow",
  "state-machine": "figure-state-machine",
};
let failed = 0;
let checks = 0;
const ok = (what: string, extra = "") => (checks++, console.log(`ok   ${what}${extra ? ` — ${extra}` : ""}`));
const bad = (what: string, why: string) => (checks++, failed++, console.error(`FAIL ${what}: ${why}`));
const spec = (name: string) => {
  const parsed = parse(readFileSync(new URL(`./specs/${name}.json`, import.meta.url), "utf8"));
  if (!parsed.spec) throw new Error(`solid/specs/${name}.json: ${parsed.problems.join(" ")}`);
  return parsed.spec;
};
/** One command of a captured frame, as the test reads it. */
interface Cmd {
  element: string | null;
  type: string;
  box: number[];
  text?: string;
  color?: number[];
}
const commandOf = (dump: { commands: Cmd[] }, id: string) => dump.commands.find((c) => c.element === id);
/** A text command's row: a line is one cell down. */
const rowOf = (box: number[]) => Math.round(box[1]! / 16);
/** The figure's lines as words: each row's text commands, left to right. */
function rowsOfFrame(dump: { commands: Cmd[] }): string[] {
  const rows = new Map<number, { x: number; text: string }[]>();
  for (const c of dump.commands)
    if (c.type === "text" && c.text !== undefined) {
      const row = rowOf(c.box);
      const parts = rows.get(row) ?? [];
      parts.push({ x: c.box[0]!, text: c.text });
      rows.set(row, parts);
    }
  return [...rows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, parts]) => parts.sort((a, b) => a.x - b.x).map((p) => p.text).join(" "))
    .map((line) => line.replace(/\s+/g, " ").trim());
}
/** A fill is "." and a full stop is a full stop: both sides of the terminal comparison lose their dots, so a run of dots
 *  (a bar, a box) and a sentence's own period read the same on the cells and in Clay's text commands. The numbers' exact
 *  text is (b)'s check, on the frame's own commands. */
const stripDots = (line: string) => line.replace(/\./g, " ").replace(/\s+/g, " ").trim();
/** The terminal's dump as the figure's lines: the colour table under the grid is not a row. */
function rowsOfCells(text: string): string[] {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => line.startsWith("# colours"));
  return lines
    .slice(0, at < 0 ? lines.length : at)
    .map(stripDots)
    .filter(Boolean);
}

const work = mkdtempSync(join(tmpdir(), "cssints-figure-"));
let worstError = 0;
let worstWhere = "";

// (a)-(d) the layout read back from each frame: the bars' geometry, the numbers' text, the rows' order, the funnel's ratios
for (const name of SPECS) {
  const s = spec(name);
  const l = layout(s);
  const dump = await capture("figure", undefined, { spec: s, warm: 2 });
  const lines = rowsOfFrame(dump);
  const kind = s.kind;
  if (dump.commands.length === 0) {
    bad(`${name}: the frame`, "no commands");
    continue;
  }

  // (a) each bar's fill ÷ its track, against value/max, in cells — the frame's boxes, not the layout's numbers
  for (const bar of l.bars) {
    const fill = commandOf(dump, bar.fillId);
    const track = commandOf(dump, bar.trackId);
    if (!fill || !track) {
      bad(`${name}: ${bar.label}'s bar`, `the frame has no ${bar.fillId} or ${bar.trackId}`);
      continue;
    }
    const error = Math.abs(fill.box[2]! - (track.box[2]! * bar.value) / bar.max) / CELL_WIDTH;
    if (error > worstError) (worstError = error), (worstWhere = `${name} ${bar.label} ${bar.textId}`);
    if (error > HALF_CELL)
      bad(`${name}: ${bar.label}`, `the fill is ${(fill.box[2]! / CELL_WIDTH).toFixed(2)} cells of ` +
        `${(track.box[2]! / CELL_WIDTH).toFixed(2)}, ${error.toFixed(2)} cells off ${bar.value}/${bar.max} (half a cell allowed)`);
    // (b) the number's text is the spec's text (or the value the layout formatted)
    const number = dump.commands.find((c) => c.type === "text" && c.text === bar.text);
    if (!number) bad(`${name}: ${bar.label}'s number`, `no text command reads ${JSON.stringify(bar.text)}`);
  }
  if (l.bars.length) ok(`${name}: ${l.bars.length} bar(s)`, `every fill is value/max and every number its text`);

  // (c) the rows are the data's, in order: each label's text command, from the top down — a flow is one row of boxes, so
  // there the order is left to right. A state machine may draw the same state twice (the path is the walk), so a label
  // consumes the next command that carries its text, not the first.
  const axis = kind === "flow" ? 0 : 1;
  const used = new Set<Cmd>();
  const labelRows = l.labels.map((label) => {
    const command = dump.commands.find((c) => c.type === "text" && c.text === label.text && !used.has(c));
    if (command) used.add(command);
    return command;
  });
  const inOrder = labelRows.every(
    (command, i) => command && (i === 0 || command.box[axis]! > labelRows[i - 1]!.box[axis]!),
  );
  if (inOrder) ok(`${name}: the rows`, `${l.labels.map((label) => label.text).join(", ")} — the data's order`);
  else bad(`${name}: the rows`, JSON.stringify(labelRows.map((c) => [c?.text, c?.box[axis]])));

  // (c2) a branch flow: one box a step, one connector a decision's branch, and the branch's word is drawn
  if (s.kind === "branchFlow") {
    const steps = s.data;
    const spine = l.boxes.filter((box) => box.role !== "branch");
    const decisions = steps.filter((step) => step.type === "decision");
    const branches = l.connectors.filter((connector) => connector.role === "branch");
    if (spine.length === steps.length)
      ok(`${name}: the steps`, `${spine.length} boxes, one a step (${steps.map((step) => step.label).join(", ")})`);
    else bad(`${name}: the steps`, `${spine.length} boxes for ${steps.length} steps`);
    if (branches.length === decisions.length)
      ok(`${name}: the branches`, `${branches.length} connector(s), one a decision (${branches.map((b) => b.from).join(", ")})`);
    else bad(`${name}: the branches`, `${branches.length} connectors for ${decisions.length} decisions`);
    const branchesDrawn = branches.filter((branch) =>
      dump.commands.some((command) => command.type === "text" && command.text === `-- ${branch.text} -->`),
    );
    if (branchesDrawn.length === branches.length)
      ok(`${name}: the branch words`, `"-- no -->" on every branch (${branches.length})`);
    else bad(`${name}: the branch words`, `${branchesDrawn.length} of ${branches.length} have their "-- ${branches[0]?.text ?? "no"} -->" in the frame`);
  }

  // (c3) a state machine: one box a path step, one connector a transition the path walks, the labels the path's order
  if (s.kind === "stateMachine") {
    const path = s.options?.path ?? [s.data.states[0]!];
    if (l.boxes.length === path.length)
      ok(`${name}: the path's boxes`, `${l.boxes.length} boxes, the path's ${path.length}`);
    else bad(`${name}: the path's boxes`, `${l.boxes.length} boxes for the path's ${path.length}`);
    if (l.connectors.length === path.length - 1)
      ok(`${name}: the path's transitions`, `${l.connectors.length} connector(s), one a step pair`);
    else bad(`${name}: the path's transitions`, `${l.connectors.length} connectors for ${path.length - 1} steps`);
    const walked = l.labels.map((label) => label.text).join(" → ");
    if (walked === path.join(" → ")) ok(`${name}: the path's labels`, walked);
    else bad(`${name}: the path's labels`, `${walked} is not ${path.join(" → ")}`);
    const off = s.data.states.filter((state) => !path.includes(state));
    if (!off.length) ok(`${name}: the footer`, "every state is on the path");
    else if (dump.commands.some((command) => command.type === "text" && command.text === `not on the path: ${off.join(", ")}`))
      ok(`${name}: the footer`, `not on the path: ${off.join(", ")}`);
    else bad(`${name}: the footer`, `no text command reads "not on the path: ${off.join(", ")}"`);
  }

  // (c4) the new kinds' command goldens: the same capture, stored as solid/goldens/<name>.json
  const goldenName = GOLDENS[name];
  if (goldenName) {
    const want = readFileSync(new URL(`./goldens/${goldenName}.json`, import.meta.url), "utf8").trim();
    const got = format({ commands: dump.commands, effects: dump.effects });
    if (got === want) ok(`${name}: the golden`, `solid/goldens/${goldenName}.json, every command field identical`);
    else {
      const at = got.split("\n").findIndex((line, i) => line !== want.split("\n")[i]);
      bad(
        `${name}: the golden`,
        `solid/goldens/${goldenName}.json differs at line ${at + 1}: ` +
          `${JSON.stringify(got.split("\n")[at])} is not ${JSON.stringify(want.split("\n")[at])}`,
      );
    }
  }

  // (d) a funnel never grows, and each step's width is value/first
  if (kind === "funnel") {
    const bars = l.bars;
    const first = bars[0]!.value;
    for (let i = 1; i < bars.length; i++)
      if (bars[i]!.value > bars[i - 1]!.value) bad(`${name}: a growing step`, `${bars[i]!.label} ${bars[i]!.value} after ${bars[i - 1]!.value}`);
    for (const bar of bars) {
      const fill = commandOf(dump, bar.fillId)!;
      const track = commandOf(dump, bar.trackId)!;
      const error = Math.abs(fill.box[2]! - (track.box[2]! * bar.value) / first) / CELL_WIDTH;
      if (error > HALF_CELL) bad(`${name}: ${bar.label}'s share`, `${error.toFixed(2)} cells off ${bar.value}/${first}`);
    }
    ok(`${name}: the steps`, `${bars.length} steps, none larger than the one before it, each value/first`);
  }

  // (f) the same spec on the terminal: the cells' rows are the pixel figure's rows, in text and count
  const rows = l.lines.length + 2;
  const out = join(work, `${name}.txt`);
  const run = spawnSync(
    "bun",
    ["terminal/solid.ts", "--page", "figure", "--spec", new URL(`./specs/${name}.json`, import.meta.url).pathname,
      "--cols", "80", "--rows", String(rows), "--dump", out],
    { cwd: new URL("..", import.meta.url).pathname, encoding: "utf8" },
  );
  if (run.status !== 0) {
    bad(`${name}: the terminal`, `exit ${run.status}: ${run.stderr.trim()}`);
    continue;
  }
  const cells = rowsOfCells(readFileSync(out, "utf8"));
  const pixel = lines.map(stripDots);
  if (cells.length !== pixel.length)
    bad(`${name}: the terminal's rows`, `${cells.length} rows, the pixel figure's ${pixel.length}`);
  else if (cells.some((line, i) => line !== pixel[i]))
    bad(
      `${name}: the terminal's rows`,
      `${JSON.stringify(cells.find((line, i) => line !== pixel[i]))} is not ${JSON.stringify(pixel.find((l2, i) => l2 !== cells[i]))}`,
    );
  else ok(`${name}: the terminal's rows`, `${cells.length} rows, the pixel figure's words (cells, not pixels)`);
}

// (e) `check`'s refusals, with their sentences: every problem, in the kit's voice
const refuses = (what: string, input: unknown, sentence: string) => {
  const problems = check(input);
  if (problems.some((p) => p === sentence || p.includes(sentence))) ok(`check: ${what}`, sentence);
  else bad(`check: ${what}`, `no refusal with ${JSON.stringify(sentence)}: ${JSON.stringify(problems)}`);
};
refuses("a funnel that grows", {
  kind: "funnel",
  source: "Sample",
  data: [{ label: "visited", value: 12400 }, { label: "signed up", value: 13000 }],
}, "signed up 13000 is more than visited 12400; a funnel never grows");
refuses("a number with no source", {
  kind: "barChart",
  data: [{ label: "Design QA", value: 42 }],
}, "These numbers need a source: where did they come from?");
refuses("a focus name not in the figure", {
  kind: "barChart",
  source: "Sample",
  data: [{ label: "Design QA", value: 42 }],
  focus: { on: ["Q3"] },
}, 'Focus names "Q3", which isn\'t in the figure. Use a row label or a column heading as it is drawn.');
refuses("an unknown kind", { kind: "pieChart", data: [] },
  'unknown kind "pieChart": the ones here are barChart, branchFlow, compare, flow, funnel, stateMachine.');
refuses("a bar chart with no positive value", {
  kind: "barChart",
  source: "Sample",
  data: [{ label: "Design QA", value: 0 }, { label: "Copy", value: -1 }],
}, "A bar chart needs a value above zero: every row is 0 or less.");
refuses("a flow wider than its width", {
  kind: "flow",
  source: "Sample",
  data: ["declaration", "Clay", "commands", "ThorVG / cells / Canvas2D"],
  options: { width: 20 },
}, "These 4 boxes need 65 cells with their arrows; the width is 20. Shorten a label or raise options.width.");
refuses("a decision with no branch", {
  kind: "branchFlow",
  source: "Sample",
  data: [{ label: "read the spec" }, { label: "has data", type: "decision" }],
}, 'has data has no "no" branch.');
refuses("a branch target that is not a step", {
  kind: "branchFlow",
  source: "Sample",
  data: [
    { label: "has data", type: "decision", no: { label: "empty state", to: "import data" } },
    { label: "a frame" },
  ],
}, 'has data\'s "no" goes to "import data", which is not a step.');
refuses("a transition naming a state that does not exist", {
  kind: "stateMachine",
  source: "Sample",
  data: {
    states: ["idle", "saving"],
    transitions: [{ from: "idle", to: "saving", on: "submit" }, { from: "saving", to: "saved", on: "ok" }],
  },
  options: { path: ["idle", "saving"] },
}, 'saving goes to saved on "ok", but "saved" isn\'t one of the states.');
refuses("a path that skips a transition", {
  kind: "stateMachine",
  source: "Sample",
  data: {
    states: ["happened", "paid", "refunded"],
    transitions: [{ from: "paid", to: "refunded", on: "refund" }],
  },
  options: { path: ["happened", "paid", "refunded"] },
}, "The path goes happened → paid, but no transition connects them.");
refuses("a path that does not start at the first state", {
  kind: "stateMachine",
  source: "Sample",
  data: { states: ["idle", "saving"], transitions: [{ from: "idle", to: "saving", on: "submit" }] },
  options: { path: ["saving"] },
}, "The path starts at saving, but the machine's first state is idle.");
refuses("a machine with no states", { kind: "stateMachine", data: { states: [], transitions: [] } },
  'A state machine needs its states: ["closed", "opening", "open", "closing"].');
// the invalid file itself: the funnel solid/test.sh gives the desktop's `--spec`, refused with the sentence
const invalid = parse(readFileSync(new URL("./specs/invalid-funnel.json", import.meta.url), "utf8"));
if (invalid.problems.includes("signed up 12600 is more than visited 12400; a funnel never grows"))
  ok("solid/specs/invalid-funnel.json", invalid.problems[0]!);
else bad("solid/specs/invalid-funnel.json", JSON.stringify(invalid.problems));
for (const [file, sentence] of [
  ["invalid-branch.json", 'check the data has no "no" branch.'],
  ["invalid-state.json", "The path goes happened → paid, but no transition connects them."],
] as const) {
  const refused = parse(readFileSync(new URL(`./specs/${file}`, import.meta.url), "utf8"));
  if (refused.problems.includes(sentence)) ok(`solid/specs/${file}`, sentence);
  else bad(`solid/specs/${file}`, JSON.stringify(refused.problems));
}

// (g) the states the path does not visit: a walk that stops before the machine's last state lists it under the path
{
  const partly = layout({
    kind: "stateMachine",
    data: {
      states: ["idle", "saving", "saved", "failed"],
      transitions: [
        { from: "idle", to: "saving", on: "submit" },
        { from: "saving", to: "saved", on: "ok" },
        { from: "saving", to: "failed", on: "error" },
      ],
    },
    options: { path: ["idle", "saving", "saved"] },
  });
  const note = partly.lines.flatMap((line) => line.items).find((item) => item.kind === "text" && item.role === "note");
  if (note && note.kind === "text" && note.text === "not on the path: failed")
    ok("a state machine's footer", `"${note.text}"`);
  else bad("a state machine's footer", `no note reads "not on the path: failed": ${JSON.stringify(note)}`);
}

// (h) the mutations, as the asserts they break: a branch drawn without its connector, a path that skips a transition
// with the sentence the check must print, and a path with a box dropped
{
  const branch = layout(spec("branch-flow"));
  const branches = branch.connectors.filter((connector) => connector.role === "branch").length;
  const countBranches = (connectors: readonly { role: string }[]) =>
    connectors.filter((connector) => connector.role === "branch").length === branches;
  if (countBranches(branch.connectors)) ok("mutation: the branch connectors", `${branches} branches, ${branches} connectors`);
  else bad("mutation: the branch connectors", "the intact layout failed its own count");
  const drawnWithout = branch.connectors.slice(1);
  const left = drawnWithout.filter((connector) => connector.role === "branch").length;
  if (!countBranches(drawnWithout))
    ok(
      "mutation: a branch without its connector",
      `${branches} branches, ${left} connector${left === 1 ? "" : "s"}: the count fails`,
    );
  else bad("mutation: a branch without its connector", "the count did not move");

  const skip = {
    kind: "stateMachine",
    source: "Sample",
    data: {
      states: ["happened", "paid", "refunded"],
      transitions: [{ from: "paid", to: "refunded", on: "refund" }],
    },
    options: { path: ["happened", "paid", "refunded"] },
  } as const;
  const skipSentence = "The path goes happened → paid, but no transition connects them.";
  if (check(skip).includes(skipSentence)) ok("mutation: a path that skips a transition", skipSentence);
  else bad("mutation: a path that skips a transition", `the check printed no ${JSON.stringify(skipSentence)}`);

  const machine = layout(spec("state-machine"));
  const path = machine.labels.length;
  if (machine.boxes.length === path) ok("mutation: the state boxes", `${path} states on the path, ${machine.boxes.length} boxes`);
  else bad("mutation: the state boxes", `${path} states on the path, ${machine.boxes.length} boxes`);
  const dropped = machine.boxes.slice(0, -1);
  if (dropped.length !== path)
    ok("mutation: a dropped state box", `${path} states on the path, ${dropped.length} boxes: the count differs`);
  else bad("mutation: a dropped state box", "the count did not move");
}

// the kind's own two edges, from the layout: a value past `max` fills the track and prints "+", and a positive value
// too small for a cell still draws one
const past = layout({ kind: "barChart", source: "Sample", data: [{ label: "over", value: 50 }], options: { width: 10, max: 10 } });
const tiny = layout({ kind: "barChart", source: "Sample", data: [{ label: "tiny", value: 0.01 }], options: { width: 10, max: 100 } });
if (past.bars[0]!.fill === 10 && past.bars[0]!.text === "50+")
  ok("a bar past max", `fills all 10 cells and prints "${past.bars[0]!.text}"`);
else bad("a bar past max", `${past.bars[0]!.fill}/${past.bars[0]!.track} cells, ${JSON.stringify(past.bars[0]!.text)}`);
if (tiny.bars[0]!.fill === 1 && tiny.bars[0]!.text === "0.01")
  ok("a bar too small to see", `is one cell (${tiny.bars[0]!.fill}), its number "0.01"`);
else bad("a bar too small to see", `${tiny.bars[0]!.fill} cells, ${JSON.stringify(tiny.bars[0]!.text)}`);

// the focus is painted by a role of the tokens, not a literal: the probe's problem colour moves with the theme, and the
// focused label and the focus line are its dark value (a literal would make the two themes the same, and this fails)
const dark = [...(variant(styles.probe.problem, undefined).text ?? [])].slice(0, 3);
const light = [...(variant(styles.probe.problem, "light").text ?? [])].slice(0, 3);
const ink = [...(variant(styles.probe.ink, undefined).text ?? [])].slice(0, 3);
const funnel = layout(spec("funnel"));
const focused = funnel.bars.find((bar) => bar.label === "paid")!;
const focusedDump = await capture("figure", undefined, { spec: spec("funnel"), warm: 2 });
const label = focusedDump.commands.find((c) => c.type === "text" && c.text === focused.label);
const focusLine = focusedDump.commands.find((c) => c.type === "text" && c.text?.startsWith("► "));
const plain = focusedDump.commands.find((c) => c.type === "text" && c.text === "visited");
const same = (colour: unknown, role: number[]) =>
  Array.isArray(colour) && role.length === 3 && colour.slice(0, 3).every((v, i) => Math.abs(Number(v) - role[i]!) <= 1);
if (dark.join() === light.join()) bad("focus: the role", `the probe's problem is ${dark.join()} in both themes: a literal colour`);
else ok("focus: the role", `the probe's problem is ${dark.join()} dark and ${light.join()} light: a token, not a literal`);
// ... and the focus's own style follows the token: a literal at the same value would read the same in both themes, and this
// is the assertion the deliberate break in the report fails
const styleDark = [...(variant(styles.s.text.problem, undefined).text ?? [])].slice(0, 3);
const styleLight = [...(variant(styles.s.text.problem, "light").text ?? [])].slice(0, 3);
if (styleDark.join() === styleLight.join())
  bad("focus: the style's role", `the focus text is ${styleDark.join()} in both themes: a literal colour, not a token`);
else if (styleDark.join() !== dark.join() || styleLight.join() !== light.join())
  bad("focus: the style's role", `the focus text is ${styleDark.join()}/${styleLight.join()}, the token ${dark.join()}/${light.join()}`);
else ok("focus: the style's role", `the focus text follows the problem token (${dark.join()} dark, ${light.join()} light)`);
if (same(label?.color, dark) && same(focusLine?.color, dark))
  ok("focus: the paint", `"paid" and its ► line are the problem role (${dark.join()})`);
else bad("focus: the paint", `label ${JSON.stringify(label?.color)}, line ${JSON.stringify(focusLine?.color)}, wanted ${dark.join()}`);
if (same(plain?.color, ink)) ok("focus: the rest", `"visited" keeps the ink role (${ink.join()})`);
else bad("focus: the rest", `${JSON.stringify(plain?.color)}, wanted the ink ${ink.join()}`);

ok("the worst bar error", `${worstError.toFixed(2)} of a cell (${worstWhere})`);
if (failed) {
  console.error(`solid/figure.test.ts: ${failed} failure(s) of ${checks} checks`);
  process.exit(1);
}
console.log(`solid/figure.test.ts: ${SPECS.length} specs, ${checks} checks, the terminal's rows among them`);
