// One spec as a layout: rows of items whose lengths are in **cells**, the unit glyph-kit's figures are authored in and
// the terminal's own (terminal/cells.h: 8x16 px). A pixel target multiplies a cell by 8 across and 16 down — the desktop
// and the browser draw exactly the rectangle a cell would cover on the terminal, so one figure is the same shape at
// 360px and at 80 columns, and a fill's edge lands on a cell boundary rather than between two. That is why the layout
// speaks cells and not pixels: a page that asked for pixels could not be re-cut by a factor without moving a bar.
//
// The four kinds (and no more than four here):
//   barChart  one track a row, the fill value/max of it, at least one cell for a positive value and "+" past `max`
//   compare   two tracks a row, each column scaled by its own maximum
//   flow      one row of boxes joined by arrows
//   funnel    one track a step, value/first of it, so a step's width is its share of the first
//
// Every drawn thing has an id: `fig-fill-<n>` and `fig-track-<n>` for a bar (the invariant test reads their boxes), the
// text ids for the numbers and the labels, `fig-box-<n>` for a flow's boxes. The page writes every item's width through
// the value channel each frame (a layout length is data, and a style is a literal): `cells * 8` for a box, `fill * 8`
// for a bar's fill.
import { formatValue, type BarChartSpec, type CompareSpec, type FlowSpec, type FunnelSpec, type Spec, type Tone } from "./spec.ts";

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
}
export interface BoxItem extends BaseItem {
  kind: "box";
  textId: string;
  text: string;
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
  focus?: { on: string[]; tone: Tone; say?: string };
}

const cells = (text: string): number => [...text].length;
const longest = (values: readonly string[]): number => Math.max(0, ...values.map(cells));

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

const textItem = (id: string, text: string, width: number, paint: Paint): TextItem => ({
  kind: "text",
  id: `${id}-cell`,
  textId: id,
  text,
  cells: width,
  paint,
});

/** The lines every kind shares: the title above, the source and the focus line below, each widening the figure. */
function finish(
  spec: Spec,
  kind: Layout["kind"],
  width: number,
  lines: LayoutLine[],
  bars: Bar[],
  labels: Layout["labels"],
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
  return { kind, width: w, lines: out, bars, labels, focus };
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
    });
    if (i < labels.length - 1)
      items.push({ kind: "text", id: `fig-arrow-${i}-cell`, textId: `fig-arrow-${i}`, text: " ► ", cells: 3, paint: "muted" });
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

/** The layout of a checked spec. The four kinds are this file's only branches. */
export function layout(spec: Spec): Layout {
  switch (spec.kind) {
    case "barChart":
      return barChart(spec);
    case "funnel":
      return funnel(spec);
    case "compare":
      return compare(spec);
    case "flow":
      return flow(spec);
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
