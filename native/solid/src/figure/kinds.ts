// One spec as a layout: rows of items whose lengths are in **cells**, the unit glyph-kit's figures are authored in and
// the terminal's own (terminal/cells.h: 8x16 px). A pixel target multiplies a cell by 8 across and 16 down — the desktop
// and the browser draw exactly the rectangle a cell would cover on the terminal, so one figure is the same shape at
// 360px and at 80 columns, and a fill's edge lands on a cell boundary rather than between two. That is why the layout
// speaks cells and not pixels: a page that asked for pixels could not be re-cut by a factor without moving a bar.
//
// The eight kinds (and no more than eight here):
//   barChart     one track a row, the fill value/max of it, at least one cell for a positive value and "+" past `max`
//   branchFlow   a column of boxes with a decision's branch drawn to its right, connectors and their words as text
//   compare      two tracks a row, each column scaled by its own maximum
//   flow         one row of boxes joined by arrows
//   funnel       one track a step, value/first of it, so a step's width is its share of the first
//   stateMachine a path's boxes in a column, each transition's event between them, the states off the path below
//   journeyMap   a stage a row: its label, a bar of |feeling|/2, the feeling's word, and its doing and thinking below
//   tree         the root above its children's rows, then each level, with | - + connectors between them
//
// The last two are the ones that need a second row: a tree's level is several boxes on one line, and a journey stage
// is a bar row with a note under it. `text.ts` reads the layout's items and has no kind in it, so both print there
// without a change.
//
// Every drawn thing has an id: `fig-fill-<n>` and `fig-track-<n>` for a bar (the invariant test reads their boxes), the
// text ids for the numbers and the labels, `fig-box-<n>` for a flow's boxes, `fig-state-<n>` for a path's states. A box
// and a text also carry a `role` — step, decision, branch, state, connector, label, note — so a target or a text
// renderer draws what an item is, not only its cells. The page writes every item's width through the value channel each
// frame (a layout length is data, and a style is a literal): `cells * 8` for a box, `fill * 8` for a bar's fill.
import {
  formatValue,
  treeRoot,
  type BarChartSpec,
  type BranchFlowSpec,
  type CompareSpec,
  type FlowSpec,
  type FunnelSpec,
  type JourneyMapSpec,
  type Spec,
  type StateMachineSpec,
  type Tone,
  type TreeSpec,
  type TreeNode,
} from "./spec.ts";

/** A cell: the terminal's unit, and what the pixel targets multiply by (terminal/cells.h). */
export const CELL_WIDTH = 8;
export const CELL_HEIGHT = 16;
/** The figure's own padding, in cells: two either side, one above and below. */
export const PADDING_X = 2;
export const PADDING_Y = 1;
/** glyph-kit's mark for the focus line, so the figure reads without colour. */
export const FOCUS_MARK = "►";

/** What a figure's text is painted by: a role of the tokens, never a colour. */
export type Paint = "title" | "muted" | "ink" | Tone;

/** What a box is, for a target that draws more than its cells: a step, a decision, the end, a branch, a state. */
export type BoxRole = "step" | "decision" | "end" | "branch" | "state" | "start";
/** What a text is: a label, a connector's glyph, a connector's word, or the note under a state machine. */
export type TextRole = "label" | "connector" | "connector-label" | "note";

interface BaseItem {
  /** The id of the box whose width the page writes (the item's cell). */
  id: string;
  /** The item's width, in cells. */
  cells: number;
  paint: Paint;
}
export interface TextItem extends BaseItem {
  kind: "text";
  /** The id of the `text` itself, which is what a focus's colour moves. */
  textId: string;
  text: string;
  role?: TextRole;
}
export interface BoxItem extends BaseItem {
  kind: "box";
  textId: string;
  text: string;
  role: BoxRole;
}
export interface BarItem extends BaseItem {
  kind: "bar";
  fillId: string;
  fill: number;
}
export interface SpaceItem extends BaseItem {
  kind: "space";
}
export type Item = TextItem | BoxItem | BarItem | SpaceItem;
export interface LayoutLine {
  items: Item[];
}

/** One drawn box, in the layout's own record: the invariant test's count and a target's role. */
export interface BoxRecord {
  id: string;
  textId: string;
  text: string;
  role: BoxRole;
}

/** One connector the data asked for: a decision's branch, or a transition the path walks. */
export interface Connector {
  /** The text id of the drawn connector run: its glyph and its word, in one item. */
  textId: string;
  text: string;
  from: string;
  to: string;
  role: "branch" | "transition";
}

/** One drawn bar, in cells: the invariant test's own record of what the frame should hold. */
export interface Bar {
  fillId: string;
  trackId: string;
  textId: string;
  label: string;
  value: number;
  /** The ratio's denominator: `options.max` for a bar chart, the first step for a funnel, the column's max for compare. */
  max: number;
  fill: number;
  track: number;
  text: string;
}

export interface Layout {
  kind: Spec["kind"];
  /** The content's width in cells; the root adds the padding. */
  width: number;
  lines: LayoutLine[];
  bars: Bar[];
  /** The label texts in the data's order, for the order invariant. */
  labels: { textId: string; text: string }[];
  /** The spine's boxes — a flow's steps, a state machine's path — in drawing order. */
  boxes: BoxRecord[];
  /** A decision's branch and a path's transitions: one a branch or transition the data names. */
  connectors: Connector[];
  focus?: { on: string[]; tone: Tone; say?: string };
}

const cells = (text: string): number => [...text].length;
const longest = (values: readonly string[]): number => Math.max(0, ...values.map(cells));

/** The glyphs our cells and pixels both have: Roboto has no │ ─ ► ▼ → (ThorVG has no fallback), so the connectors are
 *  ASCII and the same figure reads on all three targets. */
const GLYPH = { down: "v", right: ">", vertical: "|", line: "-" } as const;
/** A branch's run to its box: one cell of label either side, so "no" reads inside the line. */
const arrowOf = (label: string): string => `${GLYPH.line}${GLYPH.line} ${label} ${GLYPH.line}${GLYPH.line}${GLYPH.right}`;

/** The text a row's number prints: its own, or the value formatted (with "+" when it runs past the scale). */
const numberText = (row: { value: number; text?: string }, max: number): string =>
  row.text ?? `${formatValue(row.value)}${row.value > max ? "+" : ""}`;

/** A bar's fill, in whole cells: value/max of the track, at least one cell for a positive value. */
function fillOf(value: number, max: number, track: number): number {
  if (!(value > 0) || !(max > 0)) return 0;
  return Math.max(1, Math.min(track, Math.round((track * value) / max)));
}

const focusOf = (spec: Spec): Layout["focus"] => {
  const focus = spec.focus;
  if (!focus) return undefined;
  const on = typeof focus.on === "string" ? [focus.on] : [...focus.on];
  return { on, tone: focus.tone ?? "plain", say: focus.say };
};

/** The paint a row's label takes: its focus's role, or the ink every other row is. */
const paintOf = (focus: Layout["focus"], label: string): Paint => {
  if (!focus || !focus.on.includes(label)) return "ink";
  return focus.tone === "plain" ? "ink" : focus.tone;
};

const textItem = (id: string, text: string, width: number, paint: Paint, role?: TextRole): TextItem => ({
  kind: "text",
  id: `${id}-cell`,
  textId: id,
  text,
  cells: width,
  paint,
  ...(role === undefined ? {} : { role }),
});
/** The cells every kind shares: the title above, the source and the focus line below, each widening the figure. */
function finish(
  spec: Spec,
  kind: Layout["kind"],
  width: number,
  lines: LayoutLine[],
  bars: Bar[],
  labels: Layout["labels"],
  boxes: BoxRecord[] = [],
  connectors: Connector[] = [],
): Layout {
  const focus = focusOf(spec);
  const focusLine = focus ? `${FOCUS_MARK} ${focus.say ?? focus.on.join(", ")}` : undefined;
  const w = Math.max(width, longest([spec.title ?? "", spec.source ?? "", focusLine ?? ""]));
  const out: LayoutLine[] = [];
  if (spec.title) out.push({ items: [textItem("fig-title", spec.title, w, "title")] });
  out.push(...lines);
  if (spec.source) out.push({ items: [textItem("fig-source", spec.source, w, "muted")] });
  if (focus && focusLine)
    out.push({ items: [textItem("fig-focus", focusLine, w, focus.tone === "plain" ? "ink" : focus.tone)] });
  return { kind, width: w, lines: out, bars, labels, boxes, connectors, focus };
}

/** A bar row: the label's cell, the track (with its fill), and the number's cell. */
function barLine(
  i: number,
  label: string,
  fill: number,
  track: number,
  text: string,
  textWidth: number,
  labelWidth: number,
  paint: Paint,
): LayoutLine {
  return {
    items: [
      textItem(`fig-label-${i}`, label, labelWidth, paint),
      { kind: "bar", id: `fig-track-${i}`, fillId: `fig-fill-${i}`, cells: track, fill, paint },
      textItem(`fig-num-${i}`, text, textWidth, paint),
    ],
  };
}

function barChart(spec: BarChartSpec): Layout {
  const focus = focusOf(spec);
  const rows = spec.data;
  const max = spec.options?.max ?? Math.max(...rows.map((r) => r.value));
  const track = spec.options?.width ?? 24;
  const labelWidth = longest(rows.map((r) => r.label)) + 1;
  const texts = rows.map((r) => numberText(r, max));
  const textWidth = longest(texts) + 1;
  const width = labelWidth + track + textWidth;
  const bars: Bar[] = [];
  const labels: Layout["labels"] = [];
  const lines = rows.map((row, i) => {
    const paint = paintOf(focus, row.label);
    const fill = fillOf(row.value, max, track);
    bars.push({
      fillId: `fig-fill-${i}`,
      trackId: `fig-track-${i}`,
      textId: `fig-num-${i}`,
      label: row.label,
      value: row.value,
      max,
      fill,
      track,
      text: texts[i]!,
    });
    labels.push({ textId: `fig-label-${i}`, text: row.label });
    return barLine(i, row.label, fill, track, texts[i]!, textWidth, labelWidth, paint);
  });
  return finish(spec, "barChart", width, lines, bars, labels);
}

function funnel(spec: FunnelSpec): Layout {
  const focus = focusOf(spec);
  const rows = spec.data;
  const first = rows[0]!.value;
  const track = spec.options?.width ?? 30;
  const labelWidth = longest(rows.map((r) => r.label)) + 1;
  const texts = rows.map((r) => `${formatValue(r.value)}  ${Math.round((100 * r.value) / first)}%`);
  const textWidth = longest(texts) + 1;
  const width = labelWidth + track + textWidth;
  const bars: Bar[] = [];
  const labels: Layout["labels"] = [];
  const lines = rows.map((row, i) => {
    const paint = paintOf(focus, row.label);
    const fill = fillOf(row.value, first, track);
    bars.push({
      fillId: `fig-fill-${i}`,
      trackId: `fig-track-${i}`,
      textId: `fig-num-${i}`,
      label: row.label,
      value: row.value,
      max: first,
      fill,
      track,
      text: texts[i]!,
    });
    labels.push({ textId: `fig-label-${i}`, text: row.label });
    return barLine(i, row.label, fill, track, texts[i]!, textWidth, labelWidth, paint);
  });
  return finish(spec, "funnel", width, lines, bars, labels);
}

function compare(spec: CompareSpec): Layout {
  const focus = focusOf(spec);
  const rows = spec.data;
  const track = spec.options?.width ?? 10;
  const labelWidth = longest(rows.map((r) => r.label)) + 1;
  const aTexts = rows.map((r) => r.aText ?? formatValue(r.a));
  const bTexts = rows.map((r) => r.bText ?? formatValue(r.b));
  const aWidth = longest(aTexts) + 1;
  const bWidth = longest(bTexts) + 1;
  // a cell between the two columns, so the before pair and the after pair read apart
  const width = labelWidth + track + aWidth + 1 + track + bWidth;
  const bars: Bar[] = [];
  const labels: Layout["labels"] = [];
  const lines: LayoutLine[] = [];
  const headers = spec.options?.headers;
  if (headers)
    lines.push({
      items: [
        textItem("fig-head-label", headers[0] ?? "", labelWidth, "muted"),
        textItem("fig-head-a", headers[1] ?? "", track + aWidth + 1, "muted"),
        textItem("fig-head-b", headers[2] ?? "", track + bWidth, "muted"),
      ],
    });
  rows.forEach((row, i) => {
    const paint = paintOf(focus, row.label);
    // a row's two bars share one scale, as glyph-kit's do: the row is the comparison (2.7 s against 7.7 s is a row's
    // own pair, not the column's), so a before and an after can be read against each other
    const max = Math.max(Math.abs(row.a), Math.abs(row.b), 0);
    const fillA = fillOf(Math.abs(row.a), max, track);
    const fillB = fillOf(Math.abs(row.b), max, track);
    // the two columns' bars are bars[2i] and bars[2i+1]: a row's own order is the data's
    bars.push(
      {
        fillId: `fig-fill-a-${i}`,
        trackId: `fig-track-a-${i}`,
        textId: `fig-num-a-${i}`,
        label: row.label,
        value: Math.abs(row.a),
        max,
        fill: fillA,
        track,
        text: aTexts[i]!,
      },
      {
        fillId: `fig-fill-b-${i}`,
        trackId: `fig-track-b-${i}`,
        textId: `fig-num-b-${i}`,
        label: row.label,
        value: Math.abs(row.b),
        max,
        fill: fillB,
        track,
        text: bTexts[i]!,
      },
    );
    labels.push({ textId: `fig-label-${i}`, text: row.label });
    lines.push({
      items: [
        textItem(`fig-label-${i}`, row.label, labelWidth, paint),
        { kind: "bar", id: `fig-track-a-${i}`, fillId: `fig-fill-a-${i}`, cells: track, fill: fillA, paint },
        textItem(`fig-num-a-${i}`, aTexts[i]!, aWidth, paint),
        { kind: "space", id: `fig-gap-${i}`, cells: 1, paint: "ink" },
        { kind: "bar", id: `fig-track-b-${i}`, fillId: `fig-fill-b-${i}`, cells: track, fill: fillB, paint },
        textItem(`fig-num-b-${i}`, bTexts[i]!, bWidth, paint),
      ],
    });
  });
  return finish(spec, "compare", width, lines, bars, labels);
}

function flow(spec: FlowSpec): Layout {
  const focus = focusOf(spec);
  const labels = spec.data;
  const boxes = labels.map((label) => cells(label) + 2);
  const width = boxes.reduce((n, box) => n + box, 0) + Math.max(0, labels.length - 1) * 3;
  const items: Item[] = [];
  labels.forEach((label, i) => {
    items.push({
      kind: "box",
      id: `fig-box-${i}`,
      textId: `fig-box-text-${i}`,
      text: label,
      cells: boxes[i]!,
      paint: paintOf(focus, label),
      role: "step",
    });
    if (i < labels.length - 1)
      items.push({ kind: "text", id: `fig-arrow-${i}-cell`, textId: `fig-arrow-${i}`, text: " ► ", cells: 3, paint: "muted", role: "connector" });
  });
  return finish(
    spec,
    "flow",
    width,
    [{ items }],
    [],
    labels.map((label, i) => ({ textId: `fig-box-text-${i}`, text: label })),
  );
}

/**
 * A branch flow: one column of boxes, a decision's `no` box to its right, and the words as text. The main path goes down
 * as "yes"; the branch's arrow runs right from the decision's edge.
 */
function branchFlow(spec: BranchFlowSpec): Layout {
  const focus = focusOf(spec);
  const steps = spec.data;
  const branchOf = (step: (typeof steps)[number]) => (step.type === "decision" ? step.no : undefined);
  const branchText = (step: (typeof steps)[number]) => {
    const no = branchOf(step);
    return no ? `${no.label} -> ${no.to}` : "";
  };
  const W = Math.max(3, longest(steps.map((step) => step.label)) + 2);
  const center = Math.floor((W - 1) / 2);
  const lines: LayoutLine[] = [];
  const boxes: BoxRecord[] = [];
  const connectors: Connector[] = [];
  const labels: Layout["labels"] = [];
  let widest = W;
  steps.forEach((step, i) => {
    const no = branchOf(step);
    const role: BoxRole = i === steps.length - 1 ? "end" : step.type === "decision" ? "decision" : "step";
    const items: Item[] = [
      {
        kind: "box",
        id: `fig-box-${i}`,
        textId: `fig-box-text-${i}`,
        text: step.label,
        cells: W,
        paint: paintOf(focus, step.label),
        role,
      },
    ];
    boxes.push({ id: `fig-box-${i}`, textId: `fig-box-text-${i}`, text: step.label, role });
    labels.push({ textId: `fig-box-text-${i}`, text: step.label });
    if (no) {
      const arrow = arrowOf("no");
      const branch = branchText(step);
      const branchCells = cells(branch) + 2;
      items.push(textItem(`fig-arrow-${i}`, arrow, cells(arrow), "muted", "connector-label"));
      items.push({
        kind: "box",
        id: `fig-branch-${i}`,
        textId: `fig-branch-text-${i}`,
        text: branch,
        cells: branchCells,
        paint: paintOf(focus, no.label),
        role: "branch",
      });
      connectors.push({ textId: `fig-arrow-${i}`, text: "no", from: step.label, to: no.to, role: "branch" });
    }
    const width = items.reduce((n, item) => n + item.cells, 0);
    widest = Math.max(widest, width);
    lines.push({ items });
    if (i < steps.length - 1) {
      const word = step.type === "decision" ? " yes" : "";
      const down = `${" ".repeat(center)}${GLYPH.vertical}${word}`;
      widest = Math.max(widest, cells(down));
      lines.push({ items: [textItem(`fig-spine-${i}`, down, cells(down), "muted", "connector")] });
      const arrow = `${" ".repeat(center)}${GLYPH.down}`;
      lines.push({ items: [textItem(`fig-spine-down-${i}`, arrow, cells(arrow), "muted", "connector")] });
    }
  });
  return finish(spec, "branchFlow", widest, lines, [], labels, boxes, connectors);
}

/**
 * A state machine: the path's states in a column, each transition's event between them, and the states the path does not
 * visit listed under it. A state the path visits twice is drawn twice: it is the walk, not the set.
 */
function stateMachine(spec: StateMachineSpec): Layout {
  const focus = focusOf(spec);
  const states = spec.data.states;
  const transitions = spec.data.transitions;
  const path = spec.options?.path ?? [states[0]!];
  const W = Math.max(3, longest(states) + 2);
  const center = Math.floor((W - 1) / 2);
  const lines: LayoutLine[] = [];
  const boxes: BoxRecord[] = [];
  const connectors: Connector[] = [];
  const labels: Layout["labels"] = [];
  let widest = W;
  path.forEach((name, i) => {
    const role: BoxRole = i === 0 ? "start" : "state";
    lines.push({
      items: [
        {
          kind: "box",
          id: `fig-state-${i}`,
          textId: `fig-state-text-${i}`,
          text: name,
          cells: W,
          paint: paintOf(focus, name),
          role,
        },
      ],
    });
    boxes.push({ id: `fig-state-${i}`, textId: `fig-state-text-${i}`, text: name, role });
    labels.push({ textId: `fig-state-text-${i}`, text: name });
    if (i === path.length - 1) return;
    const next = path[i + 1]!;
    const event = transitions.find((t) => t.from === name && t.to === next)?.on ?? "";
    const word = event ? ` ${event}` : "";
    const edge = `${" ".repeat(center)}${GLYPH.vertical}${word}`;
    widest = Math.max(widest, cells(edge));
    lines.push({ items: [textItem(`fig-edge-${i}`, edge, cells(edge), "muted", "connector")] });
    const arrow = `${" ".repeat(center)}${GLYPH.down}`;
    lines.push({ items: [textItem(`fig-edge-down-${i}`, arrow, cells(arrow), "muted", "connector")] });
    connectors.push({ textId: `fig-edge-${i}`, text: event, from: name, to: next, role: "transition" });
  });
  const unvisited = states.filter((state) => !path.includes(state));
  if (unvisited.length) {
    const note = `not on the path: ${unvisited.join(", ")}`;
    widest = Math.max(widest, cells(note));
    lines.push({ items: [textItem("fig-unvisited", note, cells(note), "muted", "note")] });
  }
  return finish(spec, "stateMachine", widest, lines, [], labels, boxes, connectors);
}

/** The feeling's word, on the kit's scale: -2 bad, -1 poor, 0 neutral, 1 good, 2 great (a fraction rounds). */
const FEELING_WORDS = ["bad", "poor", "neutral", "good", "great"] as const;
const feelingWord = (feeling: number): string =>
  FEELING_WORDS[Math.max(-2, Math.min(2, Math.round(feeling))) + 2] ?? "neutral";
/** The number as the row prints it: "-2 bad", "0 neutral", "+2 great". */
const feelingText = (feeling: number): string => `${feeling > 0 ? "+" : ""}${feeling} ${feelingWord(feeling)}`;
/** A bad stage is the problem role, a good one the good role, and a flat one the ink. */
const feelingPaint = (feeling: number): Paint => (feeling > 0 ? "good" : feeling < 0 ? "problem" : "ink");

/**
 * A journey map: a stage a row, its label, a bar of |feeling|/2 (the kit's -2 to 2 scale), the feeling's word, and the
 * stage's doing and thinking under it. The bar is the magnitude, so a bad and a great stage are the same length and
 * their word and their role tell them apart.
 */
function journeyMap(spec: JourneyMapSpec): Layout {
  const focus = focusOf(spec);
  const stages = spec.data;
  const track = spec.options?.width ?? 8;
  const labelWidth = longest(stages.map((stage) => stage.label)) + 1;
  const texts = stages.map((stage) => feelingText(stage.feeling));
  const textWidth = longest(texts) + 1;
  const notes = stages.flatMap((stage) => [
    stage.doing ? `${" ".repeat(labelWidth)}${stage.doing}` : "",
    stage.thinking ? `${" ".repeat(labelWidth)}"${stage.thinking}"` : "",
  ]);
  const width = Math.max(labelWidth + track + textWidth, longest(notes));
  const bars: Bar[] = [];
  const labels: Layout["labels"] = [];
  const lines: LayoutLine[] = [];
  stages.forEach((stage, i) => {
    const value = Math.abs(stage.feeling);
    const fill = fillOf(value, 2, track);
    const paint = feelingPaint(stage.feeling);
    bars.push({
      fillId: `fig-fill-${i}`,
      trackId: `fig-track-${i}`,
      textId: `fig-num-${i}`,
      label: stage.label,
      value,
      max: 2,
      fill,
      track,
      text: texts[i]!,
    });
    labels.push({ textId: `fig-label-${i}`, text: stage.label });
    lines.push({
      items: [
        textItem(`fig-label-${i}`, stage.label, labelWidth, paintOf(focus, stage.label)),
        { kind: "bar", id: `fig-track-${i}`, fillId: `fig-fill-${i}`, cells: track, fill, paint },
        textItem(`fig-num-${i}`, texts[i]!, textWidth, paint),
      ],
    });
    if (stage.doing) {
      const note = `${" ".repeat(labelWidth)}${stage.doing}`;
      lines.push({ items: [textItem(`fig-doing-${i}`, note, cells(note), "muted", "note")] });
    }
    if (stage.thinking) {
      const note = `${" ".repeat(labelWidth)}"${stage.thinking}"`;
      lines.push({ items: [textItem(`fig-thinking-${i}`, note, cells(note), "muted", "note")] });
    }
  });
  return finish(spec, "journeyMap", width, lines, bars, labels);
}

/** A node of a tree, placed on the cell grid: its box's left cell and width, and its children's placements. */
interface Placed {
  node: TreeNode;
  depth: number;
  left: number;
  width: number;
  children: Placed[];
  index: number;
}

/**
 * A tree: the root above a row of its children, then each level under its parent, with three connector rows between
 * two levels — the parents' stems, the bracket that joins the children's centres, and the children's stems down. Cells
 * have no box drawing (Roboto has no `┌ ┬ ┐`; ThorVG has no fallback), so the bracket is `-` and `+` and the stems are
 * `|`, the same ASCII the other kinds' connectors use.
 */
function tree(spec: TreeSpec): Layout {
  const focus = focusOf(spec);
  const root = treeRoot(spec.data);
  if (!root) return finish(spec, "tree", 0, [], [], []);
  const gap = 2;
  const boxWidth = (node: TreeNode) => cells(node.name) + 2;
  const subtreeWidth = (node: TreeNode): number => {
    const kids = node.children ?? [];
    if (!kids.length) return boxWidth(node);
    return Math.max(boxWidth(node), kids.reduce((n, kid) => n + subtreeWidth(kid), 0) + gap * (kids.length - 1));
  };
  const place = (node: TreeNode, left: number, depth: number): Placed => {
    const width = subtreeWidth(node);
    const own = boxWidth(node);
    const kids = node.children ?? [];
    const kidsWidth = kids.reduce((n, kid) => n + subtreeWidth(kid), 0) + gap * Math.max(0, kids.length - 1);
    let x = left + Math.floor((width - kidsWidth) / 2);
    const children = kids.map((kid) => {
      const placed = place(kid, x, depth + 1);
      x += subtreeWidth(kid) + gap;
      return placed;
    });
    return { node, depth, left: left + Math.floor((width - own) / 2), width: own, children, index: 0 };
  };
  const placed = place(root, 0, 0);
  const gridWidth = subtreeWidth(root);
  const levels: Placed[][] = [];
  const collect = (node: Placed) => {
    (levels[node.depth] ??= []).push(node);
    for (const child of node.children) collect(child);
  };
  collect(placed);
  let index = 0;
  for (const level of levels) for (const node of level) node.index = index++;

  const centerOf = (node: Placed) => node.left + Math.floor((node.width - 1) / 2);
  const connectorLine = (id: string, chars: string[]): LayoutLine => {
    const text = chars.join("");
    return { items: [textItem(id, text, chars.length, "muted", "connector")] };
  };
  const lines: LayoutLine[] = [];
  const boxes: BoxRecord[] = [];
  const labels: Layout["labels"] = [];
  const connectors: Connector[] = [];
  levels.forEach((level, depth) => {
    if (depth > 0) {
      const parents = levels[depth - 1]!.filter((node) => node.children.length);
      const stem: string[] = Array(gridWidth).fill(" ");
      const bracket: string[] = Array(gridWidth).fill(" ");
      const down: string[] = Array(gridWidth).fill(" ");
      for (const parent of parents) {
        stem[centerOf(parent)] = GLYPH.vertical;
        const centres = parent.children.map(centerOf);
        const from = Math.min(...centres);
        const to = Math.max(...centres);
        for (let x = from; x <= to; x++) bracket[x] = GLYPH.line;
        for (const x of centres) bracket[x] = "+";
        bracket[centerOf(parent)] = "+";
        for (const x of centres) down[x] = GLYPH.vertical;
        for (const child of parent.children)
          connectors.push({
            textId: `fig-tree-branch-${depth}`,
            text: GLYPH.vertical,
            from: parent.node.name,
            to: child.node.name,
            role: "transition",
          });
      }
      lines.push(connectorLine(`fig-tree-stem-${depth}`, stem));
      lines.push(connectorLine(`fig-tree-bracket-${depth}`, bracket));
      lines.push(connectorLine(`fig-tree-down-${depth}`, down));
    }
    const items: Item[] = [];
    let x = 0;
    for (const node of level) {
      if (node.left > x)
        items.push({ kind: "space", id: `fig-tree-gap-${depth}-${x}`, cells: node.left - x, paint: "ink" });
      items.push({
        kind: "box",
        id: `fig-node-${node.index}`,
        textId: `fig-node-text-${node.index}`,
        text: node.node.name,
        cells: node.width,
        paint: paintOf(focus, node.node.name),
        role: node.depth === 0 ? "start" : "step",
      });
      boxes.push({
        id: `fig-node-${node.index}`,
        textId: `fig-node-text-${node.index}`,
        text: node.node.name,
        role: node.depth === 0 ? "start" : "step",
      });
      labels.push({ textId: `fig-node-text-${node.index}`, text: node.node.name });
      x = node.left + node.width;
    }
    lines.push({ items });
  });
  return finish(spec, "tree", gridWidth, lines, [], labels, boxes, connectors);
}

/** The layout of a checked spec. The eight kinds are this file's only branches. */
export function layout(spec: Spec): Layout {
  switch (spec.kind) {
    case "barChart":
      return barChart(spec);
    case "branchFlow":
      return branchFlow(spec);
    case "funnel":
      return funnel(spec);
    case "compare":
      return compare(spec);
    case "flow":
      return flow(spec);
    case "stateMachine":
      return stateMachine(spec);
    case "journeyMap":
      return journeyMap(spec);
    case "tree":
      return tree(spec);
  }
}

/** The page's size in pixels: the cells times the cell, and the padding. */
export function sizeOf(spec: Spec): { width: number; height: number } {
  const l = layout(spec);
  return {
    width: (l.width + 2 * PADDING_X) * CELL_WIDTH,
    height: (l.lines.length + 2 * PADDING_Y) * CELL_HEIGHT,
  };
}
