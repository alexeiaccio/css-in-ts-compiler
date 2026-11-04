// The charts area, one file for its kinds — their layout and their own refusals side by side, because that is what the
// next kind of this area costs: a layout function, a check, one `register` at the bottom, and nothing else.
//
//   sparkline  a series in a row: a point is an eighth-height bar (`▁`..`█`), its min and max under it, the last point
//              printed after the row
//   meter      one value against its range (0..max, a cell a point) and a floor: the track, the fill `value/max`, the
//              value, and its verdict (the engine's ratio against the floor)
//   heatmap    a matrix of ratios: a row an ink, a column a page, a cell one of four shades by the value's WCAG band
//
// The kit has all three (`areas/metrics.md`): a sparkline's "print the first and last values; a sparkline has no axis", a
// meter's "over 100%, the bar stays full and the word over says the rest", a heatmap's "five levels is the limit people
// can tell apart" (we use four). Its published `check`s refuse a heatmap cell outside 0..1 and a meter's negative value
// or cap; ours are the repository's own, in its voice: a sparkline with fewer than two points or a point that is not a
// number, a meter whose value is outside its range or is not the ratio its colours make, a heatmap with ragged rows, a
// cell outside 1..21, a ratio its pair does not make, or a colour that is not `#rrggbb`.
//
// The two item kinds these needed are additions to the *format*, beside a palette's `swatch` and `marker`: `spark` (a
// point's `eighth`, a bar on a pixel target and a `▁`..`█` in text) and `shade` (one of four levels, `░▒▓█` in text and a
// step of `Figure.styles.ts`'s ramp on a pixel target). `text.ts` draws both in two branches and knows no kind.
import { contrastOf, HEX, shown } from "../contrast.ts";
import type { Bar, Item, Layout, LayoutLine, Paint, Pair } from "../registry.ts";
import { register } from "../registry.ts";
import type { HeatmapSpec, MeterSpec, SparklineSpec } from "../spec.ts";
import {
  cells,
  exactFill,
  finish,
  focusOf,
  formatValue,
  isObject,
  labelOf,
  longest,
  number,
  paintOf,
  rowsOf,
  say,
  textItem,
} from "./shared.ts";

/** One point's eighth of a cell: 0 is `▁` and 7 is `█`, the same step glyph-kit's sparkline rounds a value to. */
export function sparkEighth(value: number, lo: number, hi: number): number {
  const span = hi - lo || 1;
  return Math.max(0, Math.min(7, Math.round(((value - lo) / span) * 7)));
}

/** WCAG's floors: a heatmap's four bands are under 3, 3 to 4.5, 4.5 to 7, and 7 and over. */
export const HEATMAP_BANDS = [3, 4.5, 7] as const;

/** A ratio's band as a shade: 0 under 3:1, 1 to 4.5, 2 to 7, 3 from 7:1 up (the floors themselves are the next band). */
export function shadeOf(value: number): 0 | 1 | 2 | 3 {
  if (value < HEATMAP_BANDS[0]) return 0;
  if (value < HEATMAP_BANDS[1]) return 1;
  if (value < HEATMAP_BANDS[2]) return 2;
  return 3;
}

const pad = (text: string, width: number): string => text + " ".repeat(Math.max(0, width - cells(text)));

/**
 * A sparkline: the series in one row, a point an eighth of a cell (`▁`..`█`), and the last value printed after it. The
 * min and max are labelled under the row: a sparkline has no axis, so those two numbers are the scale it is read on.
 */
function sparkline(spec: SparklineSpec): Layout {
  const focus = focusOf(spec);
  const { label, values } = spec.data;
  const unit = spec.data.unit ? ` ${spec.data.unit}` : "";
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const paint = paintOf(focus, label);
  const labelWidth = cells(label) + 1;
  const last = `${formatValue(values[values.length - 1]!)}${unit}`;
  const lastWidth = cells(last) + 1;
  const note = `min ${formatValue(lo)}${unit}  max ${formatValue(hi)}${unit}`;
  const width = Math.max(labelWidth + values.length + 1 + lastWidth, cells(note));
  const points: Item[] = values.map((value, i) => ({
    kind: "spark",
    id: `fig-spark-${i}`,
    fillId: `fig-spark-fill-${i}`,
    textId: `fig-spark-text-${i}`,
    cells: 1,
    paint,
    eighth: sparkEighth(value, lo, hi),
  }));
  const lines: LayoutLine[] = [
    {
      items: [
        textItem("fig-label-0", label, labelWidth, paint),
        ...points,
        { kind: "space", id: "fig-last-gap", cells: 1, paint: "ink" },
        textItem("fig-last", last, lastWidth, "ink", "value"),
      ],
    },
    { items: [textItem("fig-spark-note", note, cells(note), "muted", "note")] },
  ];
  return finish(spec, "sparkline", width, lines, [], [{ textId: "fig-label-0", text: label }]);
}

/**
 * A meter: one value against its range and a floor — the track of 21 cells (a cell a point of a contrast ratio), the
 * fill `value/max` of it, the value and its verdict. The value is the engine's ratio of its two colours (the generated
 * `meter.json` writes it), and the verdict is the comparison `value >= min`, painted by the `good` or `problem` role.
 */
function meter(spec: MeterSpec): Layout {
  const focus = focusOf(spec);
  const { label, value, min } = spec.data;
  const max = spec.data.max ?? 21;
  const track = 21;
  const fill = exactFill(value, max, track);
  const pass = value >= min;
  const paint: Paint = pass ? "good" : "problem";
  const valueText = `${shown(value)}:1`;
  const verdict = `${pass ? "pass" : "fails"} ${min}:1`;
  const labelWidth = cells(label) + 1;
  const valueWidth = cells(valueText) + 1;
  const verdictWidth = cells(verdict) + 1;
  const width = labelWidth + track + valueWidth + 1 + verdictWidth;
  const bar: Bar = {
    fillId: "fig-fill-0",
    trackId: "fig-track-0",
    textId: "fig-num-0",
    label,
    value,
    max,
    fill,
    track,
    text: valueText,
  };
  const pair: Pair = { textId: "fig-num-0", label, ratio: value, min, pass, verdictId: "fig-verdict-0" };
  const lines: LayoutLine[] = [
    {
      items: [
        textItem("fig-label-0", label, labelWidth, paintOf(focus, label)),
        { kind: "bar", id: "fig-track-0", fillId: "fig-fill-0", cells: track, fill, paint },
        textItem("fig-num-0", valueText, valueWidth, paint, "ratio"),
        { kind: "space", id: "fig-gap-0", cells: 1, paint: "ink" },
        textItem("fig-verdict-0", verdict, verdictWidth, paint, "verdict"),
      ] satisfies Item[],
    },
  ];
  return finish(spec, "meter", width, lines, [bar], [{ textId: "fig-label-0", text: label }], [], [], [], [pair]);
}

/**
 * A heatmap: a row an ink, a column a page, and a cell the contrast ratio the two make as one of four shades (the band
 * table `shadeOf`). The value is written by `specs/from-charts.ts` from the engine's own ratio, and `check` refuses a
 * cell that is not the ratio its pair makes — so a shade is a number and a number is the engine's.
 */
function heatmap(spec: HeatmapSpec): Layout {
  const focus = focusOf(spec);
  const { rows, columns, values } = spec.data;
  const labelWidth = longest(rows.map((row) => row.label)) + 1;
  const cellWidth = Math.max(2, longest(columns.map((column) => column.label)));
  const columnWidth = cellWidth + 1;
  const header = " ".repeat(labelWidth) + columns.map((column) => pad(column.label, columnWidth)).join("");
  const [graphics, body, aaa] = HEATMAP_BANDS;
  const legend = `shades 0 under ${graphics}:1  1 ${graphics}-${body}  2 ${body}-${aaa}  3 ${aaa}:1+`;
  const width = Math.max(cells(header), cells(legend), labelWidth + columnWidth * columns.length);
  const lines: LayoutLine[] = [{ items: [textItem("fig-cols", header, cells(header), "muted", "label")] }];
  const labels: Layout["labels"] = [];
  rows.forEach((row, r) => {
    const items: Item[] = [textItem(`fig-label-${r}`, row.label, labelWidth, paintOf(focus, row.label), "label")];
    labels.push({ textId: `fig-label-${r}`, text: row.label });
    columns.forEach((column, c) => {
      const value = values[r]![c]!;
      items.push(
        { kind: "shade", id: `fig-shade-${r}-${c}`, cells: cellWidth, paint: "ink", level: shadeOf(value) },
        { kind: "space", id: `fig-shade-gap-${r}-${c}`, cells: 1, paint: "ink" },
      );
    });
    lines.push({ items });
  });
  lines.push({ items: [textItem("fig-legend", legend, cells(legend), "muted", "note")] });
  return finish(spec, "heatmap", width, lines, [], labels);
}

/** A sparkline: a label and two or more points, every one a number. */
function sparklineProblems(data: unknown): string[] {
  if (!isObject(data) || typeof data.label !== "string" || !data.label.trim())
    return ['A sparkline needs a label and its values: { "label": "draw", "values": [0.33, 0.31], "unit": "ms" }.'];
  const values = rowsOf(data.values);
  if (values.length < 2)
    return [`A sparkline needs at least two points: ${say(data.label)} has ${values.length}.`];
  const out: string[] = [];
  for (const [i, value] of values.entries())
    if (number(value) === undefined)
      out.push(`${say(data.label)} point ${i + 1} is ${say(value)}: a sparkline's points are numbers.`);
  return out;
}

/** WCAG's three floors: a meter held to any other number is not a check anyone can pass. */
const FLOORS = [3, 4.5, 7] as const;

/**
 * A meter: a label, two colours, the floor their ratio is held to, the ratio itself and the range's top. The value must
 * be the ratio the colours make (as a contrast pair's) and must sit in `0..max`; the floor is one of WCAG's three.
 */
function meterProblems(data: unknown): string[] {
  if (!isObject(data))
    return [
      'A meter needs its value: { "label": "link on bgSubtle", "fg": "#1971c2", "bg": "#f1f3f5", "min": 4.5, "value": 4.51, "max": 21 }.',
    ];
  const label = typeof data.label === "string" && data.label.trim() ? data.label : "This meter";
  const out: string[] = [];
  for (const [field, value] of [
    ["fg", data.fg],
    ["bg", data.bg],
  ] as const)
    if (!HEX.test(String(value))) out.push(`${label}'s ${field} is a hex value like #080808, not ${say(value)}.`);
  const min = number(data.min);
  if (min === undefined) out.push(`${label} needs a min: 3, 4.5 or 7, WCAG's three floors.`);
  else if (!(FLOORS as readonly number[]).includes(min))
    out.push(`${label}'s min is ${min}: a minimum is 3, 4.5 or 7, WCAG's three floors.`);
  const max = data.max === undefined ? 21 : number(data.max);
  if (max === undefined || !(max > 0)) out.push(`${label}'s max is ${say(data.max)}: a meter's range ends above zero.`);
  const value = number(data.value);
  if (value === undefined) {
    out.push(`${label} needs its value: the number of ${say(data.fg)} on ${say(data.bg)}, to two places.`);
    return out;
  }
  if (max !== undefined && (value < 0 || value > max))
    out.push(`${label} is ${value}, outside 0 to ${max}: a meter's value sits in its range.`);
  const own = contrastOf(data.fg, data.bg);
  if (own !== undefined && Math.abs(own - value) > 0.005)
    out.push(`${label} says ${shown(value)}:1, but ${data.fg} on ${data.bg} makes ${shown(own)}:1.`);
  return out;
}

/** A heatmap: rows of inks, columns of pages, and one value a cell, every ratio the engine's and in 1..21. */
function heatmapProblems(data: unknown): string[] {
  if (!isObject(data))
    return [
      'A heatmap needs its rows, columns and values: { "rows": [{ "label": "grey.7", "fg": "#495057" }], "columns": [{ "label": "bg", "bg": "#f8f9fa" }], "values": [[7.75]] }.',
    ];
  const rows = rowsOf(data.rows);
  const columns = rowsOf(data.columns);
  const grid = rowsOf(data.values);
  if (!rows.length || !columns.length)
    return ['A heatmap needs a row an ink and a column a page: [{ "label": "grey.7", "fg": "#495057" }] and [{ "label": "bg", "bg": "#f8f9fa" }].'];
  const out: string[] = [];
  const rowLabels: string[] = [];
  for (const [i, row] of rows.entries()) {
    if (!isObject(row) || typeof row.label !== "string" || !row.label.trim()) {
      out.push(`Heatmap row ${i + 1} needs a label: the ink's name, like "grey.7".`);
      rowLabels.push(`row ${i + 1}`);
      continue;
    }
    rowLabels.push(row.label);
    if (!HEX.test(String(row.fg))) out.push(`${row.label}'s fg is a hex value like #495057, not ${say(row.fg)}.`);
  }
  const columnLabels: string[] = [];
  for (const [i, column] of columns.entries()) {
    if (!isObject(column) || typeof column.label !== "string" || !column.label.trim()) {
      out.push(`Heatmap column ${i + 1} needs a label: the page's name, like "bg".`);
      columnLabels.push(`column ${i + 1}`);
      continue;
    }
    columnLabels.push(column.label);
    if (!HEX.test(String(column.bg))) out.push(`${column.label}'s bg is a hex value like #f8f9fa, not ${say(column.bg)}.`);
  }
  if (grid.length !== rows.length)
    out.push(`The heatmap has ${grid.length} value row${grid.length === 1 ? "" : "s"} for ${rows.length} ink${rows.length === 1 ? "" : "s"}: a row a foreground.`);
  for (const [r, row] of grid.entries()) {
    const values = rowsOf(row);
    if (values.length !== columns.length) {
      out.push(
        `${rowLabels[r] ?? `row ${r + 1}`} has ${values.length} value${values.length === 1 ? "" : "s"} for ` +
          `${columns.length} background${columns.length === 1 ? "" : "s"}; a heatmap is one value a cell.`,
      );
      continue;
    }
    const ink = rows[r];
    for (const [c, value] of values.entries()) {
      const where = `${rowLabels[r] ?? `row ${r + 1}`} on ${columnLabels[c] ?? `column ${c + 1}`}`;
      const ratio = number(value);
      if (ratio === undefined) {
        out.push(`${where} is ${say(value)}: a heatmap's cell is a ratio, 1 to 21.`);
        continue;
      }
      if (ratio < 1 || ratio > 21) out.push(`${where} is ${ratio}: a ratio runs from 1 to 21.`);
      const page = columns[c];
      if (!isObject(ink) || !isObject(page)) continue;
      const own = contrastOf(ink.fg, page.bg);
      if (own !== undefined && Math.abs(own - ratio) > 0.005)
        out.push(`${where} says ${shown(ratio)}:1, but ${ink.fg} on ${page.bg} makes ${shown(own)}:1.`);
    }
  }
  return out;
}

/** A sparkline's or a meter's focus names its label; a heatmap's names an ink or a page. */
function labelNames(data: unknown): string[] {
  return isObject(data) && typeof data.label === "string" ? [data.label] : [];
}

function heatmapNames(data: unknown): string[] {
  const heatmap = isObject(data) ? data : {};
  return [
    ...rowsOf(heatmap.rows).flatMap((row, i) => (isObject(row) ? [labelOf(row, i)] : [])),
    ...rowsOf(heatmap.columns).flatMap((column, i) => (isObject(column) ? [labelOf(column, i)] : [])),
  ];
}

register("heatmap", { layout: heatmap, check: heatmapProblems, names: heatmapNames });
register("meter", { layout: meter, check: meterProblems, names: labelNames });
register("sparkline", { layout: sparkline, check: sparklineProblems, names: labelNames });
