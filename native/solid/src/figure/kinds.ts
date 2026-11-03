// One spec as a layout: rows of items whose lengths are in **cells**, the unit glyph-kit's figures are authored in and
// the terminal's own (terminal/cells.h: 8x16 px). A pixel target multiplies a cell by 8 across and 16 down — the desktop
// and the browser draw exactly the rectangle a cell would cover on the terminal, so one figure is the same shape at
// 360px and at 80 columns, and a fill's edge lands on a cell boundary rather than between two. That is why the layout
// speaks cells and not pixels: a page that asked for pixels could not be re-cut by a factor without moving a bar.
//
// The twelve kinds (and no more than twelve here):
//   barChart     one track a row, the fill value/max of it, at least one cell for a positive value and "+" past `max`
//   branchFlow   a column of boxes with a decision's branch drawn to its right, connectors and their words as text
//   compare      two tracks a row, each column scaled by its own maximum
//   contrast     a pair a row: its label, a track of ratio/21, the ratio and its verdict against the pair's floor
//   flow         one row of boxes joined by arrows
//   funnel       one track a step, value/first of it, so a step's width is its share of the first
//   journeyMap   a stage a row: its label, a bar of |feeling|/2, the feeling's word, and its doing and thinking below
//   palette      a step a row, a hue a column: the marker, the step's swatch, its value and its contrast on the page
//   spacingScale a step a row: its name, a bar of value/largest (a 4px step of a 48px scale is half a cell), its pixels
//   stateMachine a path's boxes in a column, each transition's event between them, the states off the path below
//   tree         the root above its children's rows, then each level, with | - + connectors between them
//   typeScale    a size a row: its name, a bar of size/largest, size/lineHeight, and a specimen at its own size
//
// The last two of the first eight are the ones that need a second row: a tree's level is several boxes on one line, and a
// journey stage is a bar row with a note under it. `text.ts` reads the layout's items and has no kind in it, so both print
// there without a change.
//
// The four design-system kinds needed three things the layout did not have, and all three are additions to the *format*,
// not to one target: an item kind `swatch` (a step's own colour, which is the data and not a role), an item kind `marker`
// (the ▲ that marks the first step that reads as words), and a text's `size` with a line's `height` in cells (a 40px line
// of type is three cells tall: a cell is 16px, and a type scale cannot be drawn otherwise). `text.ts` draws all three in
// two branches — a swatch is `██` in its cell, a marker is `▲` — so the text half still has no kind in it.
//
// Every drawn thing has an id: `fig-fill-<n>` and `fig-track-<n>` for a bar (the invariant test reads their boxes), the
// text ids for the numbers and the labels, `fig-box-<n>` for a flow's boxes, `fig-state-<n>` for a path's states, and
// `fig-swatch-<hue>-<step>` and `fig-marker-<hue>-<step>` for a palette's cells. A box and a text also carry a `role` —
// step, decision, branch, state, connector, label, note, value, ratio, marker, swatch — so a target or a text renderer
// draws what an item is, not only its cells. The page writes every item's width through the value channel each frame (a
// layout length is data, and a style is a literal): `cells * 8` for a box, `fill * 8` for a bar's fill, a line's own
// height, and a swatch's `#rrggbb` as the box's background — the one colour a figure carries, because a palette documents
// the colours themselves.
import { contrastOf, shown, WORDS } from "./contrast.ts";
import {
  formatValue,
  treeRoot,
  type BarChartSpec,
  type BranchFlowSpec,
  type CompareSpec,
  type ContrastSpec,
  type FlowSpec,
  type FunnelSpec,
  type JourneyMapSpec,
  type PaletteSpec,
  type SpacingSpec,
  type Spec,
  type StateMachineSpec,
  type Tone,
  type TreeSpec,
  type TreeNode,
  type TypeScaleSpec,
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
/** What a text is: a label, a connector's glyph, a connector's word, the note under a state machine, a palette's value
 *  or contrast, or a contrast pair's verdict. */
export type TextRole = "label" | "connector" | "connector-label" | "note" | "value" | "ratio" | "verdict";

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
  /** The text's own type size in px, on a target that has type: a type scale's specimen. The cells stay the box's. */
  size?: number;
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
/** A palette's step: a `#rrggbb` swatch, the one colour a figure draws as itself (the palette documents the colours). */
export interface SwatchItem extends BaseItem {
  kind: "swatch";
  value: string;
}
/** glyph-kit's `▲`: the first step of a hue that reads as words, a mark a pixel target paints by the `good` role. */
export interface MarkerItem extends BaseItem {
  kind: "marker";
}
export type Item = TextItem | BoxItem | BarItem | SpaceItem | SwatchItem | MarkerItem;
export interface LayoutLine {
  /** The box's id, so a line's own height can travel the value channel (a type scale's rows are not all one cell).
   *  `finish` numbers them `fig-line-<n>`, the title and the source included. */
  id?: string;
  items: Item[];
  /** The line's height in cells: one unless a kind needs more (a 40px type row is three). */
  height?: number;
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

/** One swatch of a palette: the step's colour, its contrast on the page, and whether the row marks it. */
export interface Swatch {
  id: string;
  /** The value text's id, so the frame's own number is what a check reads. */
  textId: string;
  hue: string;
  step: string;
  value: string;
  /** The step's contrast on the page, computed: `contrastOf(value, page)`. */
  contrast: number;
  marked: boolean;
}

/** One pair of a contrast figure: its ratio, the floor it is held to and the verdict the row draws. */
export interface Pair {
  textId: string;
  label: string;
  ratio: number;
  min: number;
  pass: boolean;
  verdictId: string;
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
  /** A palette's steps, one a swatch, in the figure's order. */
  swatches: Swatch[];
  /** A contrast figure's pairs, one a row. */
  pairs: Pair[];
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
/** The cells every kind shares: the title above, the source and the focus line below, each widening the figure. */function finish(
  spec: Spec,
  kind: Layout["kind"],
  width: number,
  lines: LayoutLine[],
  bars: Bar[],
  labels: Layout["labels"],
  boxes: BoxRecord[] = [],
  connectors: Connector[] = [],
  swatches: Swatch[] = [],
  pairs: Pair[] = [],
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
  const numbered = out.map((line, i) => (line.id === undefined ? { ...line, id: `fig-line-${i}` } : line));
  return { kind, width: w, lines: numbered, bars, labels, boxes, connectors, swatches, pairs, focus };
}

/** An exact fill, in cells: no "at least one cell" floor, because a spacing scale's 4px step *is* half a cell. */
const exactFill = (value: number, max: number, track: number): number =>
  value > 0 && max > 0 && track > 0 ? Math.min(track, (track * value) / max) : 0;

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

/**
 * A palette: one row a step, one column a hue — glyph-kit's tonal scale. The cell is the marker (the first step of that
 * hue that reads as words on the page, 4.5 to 1), the step's swatch, its value and its contrast on the page. The contrast
 * is computed from the two colours here, with the same formula `check` refuses by, so a swatch and its number cannot
 * disagree; the swatch itself is the step's `#rrggbb`, the one colour a figure draws as itself.
 */
function palette(spec: PaletteSpec): Layout {
  const focus = focusOf(spec);
  const { hues, page = "#ffffff" } = spec.data;
  const steps: string[] = [];
  for (const hue of hues) for (const step of hue.steps) if (!steps.includes(step.name)) steps.push(step.name);
  const ratios = new Map<string, number>();
  for (const hue of hues)
    for (const step of hue.steps) ratios.set(`${hue.name}\t${step.name}`, contrastOf(step.value, page) ?? 1);
  const ratioTexts = [...ratios.values()].map((r) => shown(r));
  const stepWidth = Math.max(2, longest(steps)) + 2;
  const valueWidth = Math.max(7, longest(hues.flatMap((hue) => hue.steps.map((step) => step.value)))) + 1;
  const ratioWidth = longest(ratioTexts) + 2;
  // the marker (two cells, so the ▲ reads apart from its swatch), the swatch, a cell, the value, the ratio and the gap
  const slot = 2;
  const cell = slot + 2 + 1 + valueWidth + ratioWidth;
  const pad = (text: string, width: number) => text + " ".repeat(Math.max(0, width - cells(text)));
  const head = `${" ".repeat(stepWidth + slot)}${hues.map((hue) => pad(hue.name, cell)).join("")}`;
  const lines: LayoutLine[] = [
    { items: [textItem("fig-hues", head, cells(head), "muted", "label")] },
  ];
  const swatches: Swatch[] = [];
  const labels: Layout["labels"] = [];
  steps.forEach((stepName, row) => {
    const items: Item[] = [textItem(`fig-step-${row}`, stepName, stepWidth, paintOf(focus, stepName), "label")];
    labels.push({ textId: `fig-step-${row}`, text: stepName });
    hues.forEach((hue, h) => {
      const step = hue.steps.find((s) => s.name === stepName);
      if (!step) {
        items.push({ kind: "space", id: `fig-palette-gap-${h}-${row}`, cells: cell, paint: "ink" });
        return;
      }
      const contrast = ratios.get(`${hue.name}\t${step.name}`) ?? 1;
      // the first step of the hue that passes, in the hue's own order
      const marked = hue.steps.find((s) => (ratios.get(`${hue.name}\t${s.name}`) ?? 0) >= WORDS)?.name === step.name;
      items.push(
        marked
          ? { kind: "marker", id: `fig-marker-${h}-${row}`, cells: slot, paint: "good" }
          : textItem(`fig-marker-gap-${h}-${row}`, " ".repeat(slot), slot, "ink"),
        { kind: "swatch", id: `fig-swatch-${h}-${row}`, cells: 2, paint: "ink", value: step.value },
        textItem(`fig-swatch-value-${h}-${row}`, " ", 1, "ink"),
        textItem(`fig-value-${h}-${row}`, step.value, valueWidth, "ink", "value"),
        textItem(`fig-ratio-${h}-${row}`, shown(contrast), ratioWidth, "muted", "ratio"),
      );
      swatches.push({
        id: `fig-swatch-${h}-${row}`,
        textId: `fig-value-${h}-${row}`,
        hue: hue.name,
        step: step.name,
        value: step.value,
        contrast,
        marked,
      });
    });
    lines.push({ items });
  });
  return finish(spec, "palette", stepWidth + cell * hues.length, lines, [], labels, [], [], swatches);
}

/**
 * A contrast check: a pair a row — its label, a track of the ratio against 21:1 (one cell a point), the ratio and its
 * verdict against the pair's floor. A passing pair's row is the `good` role and a failing one the `problem` role, so the
 * verdict reads without reading the numbers; the ratio itself is the engine's, and `check` refuses a pair whose ratio is
 * not the one its colours make.
 */
function contrast(spec: ContrastSpec): Layout {
  const focus = focusOf(spec);
  const pairs = spec.data;
  // the scale runs to 21:1, one cell a point: WCAG's end, which is the same track for every pair
  const track = 21;
  const labelWidth = longest(pairs.map((pair) => pair.label)) + 1;
  const texts = pairs.map((pair) => `${shown(pair.ratio)}:1`);
  const textWidth = longest(texts) + 1;
  const verdicts = pairs.map((pair) => `${pair.ratio >= pair.min ? "pass" : "fails"} ${pair.min}:1`);
  const verdictWidth = longest(verdicts) + 1;
  const width = labelWidth + track + textWidth + verdictWidth;
  const bars: Bar[] = [];
  const records: Pair[] = [];
  const labels: Layout["labels"] = [];
  const lines = pairs.map((pair, i) => {
    const fill = exactFill(pair.ratio, 21, track);
    const pass = pair.ratio >= pair.min;
    const paint: Paint = pass ? "good" : "problem";
    bars.push({
      fillId: `fig-fill-${i}`,
      trackId: `fig-track-${i}`,
      textId: `fig-num-${i}`,
      label: pair.label,
      value: pair.ratio,
      max: 21,
      fill,
      track,
      text: texts[i]!,
    });
    records.push({ textId: `fig-num-${i}`, label: pair.label, ratio: pair.ratio, min: pair.min, pass, verdictId: `fig-verdict-${i}` });
    labels.push({ textId: `fig-label-${i}`, text: pair.label });
    return {
      items: [
        textItem(`fig-label-${i}`, pair.label, labelWidth, paintOf(focus, pair.label)),
        { kind: "bar", id: `fig-track-${i}`, fillId: `fig-fill-${i}`, cells: track, fill, paint },
        textItem(`fig-num-${i}`, texts[i]!, textWidth, paint, "ratio"),
        { kind: "space", id: `fig-verdict-gap-${i}`, cells: 1, paint: "ink" },
        textItem(`fig-verdict-${i}`, verdicts[i]!, verdictWidth, paint, "verdict"),
      ] satisfies Item[],
    };
  });
  return finish(spec, "contrast", width, lines, bars, labels, [], [], [], records);
}

/**
 * A spacing scale: a step a row — its name, a bar of `value/largest`, its pixels. A cell is 8px and the track is the
 * largest step, so the scale maps to cells at its own length: a 4px step of a 48px scale is **half a cell** (`▌` in the
 * text half, 4px of fill on the pixel targets), not "one cell", and every step's fill is exactly its value's.
 */
function spacingScale(spec: SpacingSpec): Layout {
  const focus = focusOf(spec);
  const steps = spec.data;
  const largest = Math.max(...steps.map((step) => step.value));
  const track = Math.max(1, Math.ceil(largest / CELL_WIDTH));
  const labelWidth = longest(steps.map((step) => step.name)) + 1;
  const texts = steps.map((step) => `${step.value}px`);
  const textWidth = longest(texts) + 1;
  const note = `A cell is ${CELL_WIDTH}px: the track is the largest step, ${largest}px.`;
  const width = Math.max(labelWidth + track + textWidth, cells(note));
  const bars: Bar[] = [];
  const labels: Layout["labels"] = [];
  const lines = steps.map((step, i) => {
    const fill = exactFill(step.value, largest, track);
    bars.push({
      fillId: `fig-fill-${i}`,
      trackId: `fig-track-${i}`,
      textId: `fig-num-${i}`,
      label: step.name,
      value: step.value,
      max: largest,
      fill,
      track,
      text: texts[i]!,
    });
    labels.push({ textId: `fig-label-${i}`, text: step.name });
    return barLine(i, step.name, fill, track, texts[i]!, textWidth, labelWidth, paintOf(focus, step.name));
  });
  lines.push({ items: [textItem("fig-note", note, cells(note), "muted", "note")] });
  return finish(spec, "spacingScale", width, lines, bars, labels);
}

/**
 * A type scale: a size a row — its name, a bar of `size/largest`, `size/lineHeight`, and a specimen `Aa` at the size
 * itself. A 40px line is three cells tall (a cell is 16px), so this is the one kind whose rows differ in height: the
 * layout says so in `height`, the page writes it through the value channel, and the terminal draws the row's cells with
 * the text in the first of them. The cell figure cannot draw type at its size — a cell has one size — so it prints the
 * numbers and draws the proportional bar; the specimen's `size` is what a pixel target honours.
 */
function typeScale(spec: TypeScaleSpec): Layout {
  const focus = focusOf(spec);
  const steps = [...spec.data].sort((a, b) => b.size - a.size);
  const largest = steps[0]?.size ?? 1;
  const track = 14;
  const labelWidth = longest(steps.map((step) => step.name)) + 1;
  const numbers = steps.map((step) => `${step.size}/${step.lineHeight}`);
  const numberWidth = longest(numbers) + 1;
  // two glyphs of about 0.7em: enough cells that a 40px "Aa" is not cut by the next item
  const specimenWidth = Math.max(2, ...steps.map((step) => Math.ceil((step.size * 1.4) / CELL_WIDTH))) + 1;
  const width = labelWidth + track + numberWidth + specimenWidth;
  const bars: Bar[] = [];
  const labels: Layout["labels"] = [];
  const lines = steps.map((step, i) => {
    const fill = exactFill(step.size, largest, track);
    bars.push({
      fillId: `fig-fill-${i}`,
      trackId: `fig-track-${i}`,
      textId: `fig-num-${i}`,
      label: step.name,
      value: step.size,
      max: largest,
      fill,
      track,
      text: numbers[i]!,
    });
    labels.push({ textId: `fig-label-${i}`, text: step.name });
    const specimen: TextItem = {
      ...textItem(`fig-type-${i}`, "Aa", specimenWidth, paintOf(focus, step.name), "value"),
      size: step.size,
    };
    const line: LayoutLine = {
      items: [
        textItem(`fig-label-${i}`, step.name, labelWidth, paintOf(focus, step.name)),
        { kind: "bar", id: `fig-track-${i}`, fillId: `fig-fill-${i}`, cells: track, fill, paint: paintOf(focus, step.name) },
        textItem(`fig-num-${i}`, numbers[i]!, numberWidth, "muted", "ratio"),
        { kind: "space", id: `fig-type-gap-${i}`, cells: 1, paint: "ink" },
        specimen,
      ],
      height: Math.max(1, Math.ceil(step.lineHeight / CELL_HEIGHT)),
    };
    return line;
  });
  return finish(spec, "typeScale", width, lines, bars, labels);
}

/** The layout of a checked spec. The twelve kinds are this file's only branches. */
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
    case "contrast":
      return contrast(spec);
    case "flow":
      return flow(spec);
    case "palette":
      return palette(spec);
    case "spacingScale":
      return spacingScale(spec);
    case "stateMachine":
      return stateMachine(spec);
    case "typeScale":
      return typeScale(spec);
    case "journeyMap":
      return journeyMap(spec);
    case "tree":
      return tree(spec);
  }
}

/** The page's size in pixels: the cells times the cell, the padding, and each line's own height (a type scale's rows). */
export function sizeOf(spec: Spec): { width: number; height: number } {
  const l = layout(spec);
  const rows = l.lines.reduce((n, line) => n + (line.height ?? 1), 0);
  return {
    width: (l.width + 2 * PADDING_X) * CELL_WIDTH,
    height: (rows + 2 * PADDING_Y) * CELL_HEIGHT,
  };
}
