// The wireframe area: a page's own last frame, cut into the cell grid. Two kinds, one file, their layouts and their
// refusals side by side, because that is what a kind costs here (a layout, a check, one `register` at the bottom):
//
//   screen          one page (its name and its size) as boxes and text runs, at 1/8 of a cell across and 1/16 down
//   responsivePair  the same page captured at two widths, side by side when they fit, above/below when they do not
//
// The data is **not a drawing**: `solid/specs/from-page.ts` captures each page with `solid/dump.ts`'s `capture` — the
// same call the goldens are stored with — and writes the frame's own boxes and texts into the spec. `solid/test.sh`
// regenerates those two specs into a temp dir and `cmp`s them, so a page's layout change changes the wireframe in the
// same commit. A spec's `source` names the page and the size it was captured at.
//
// What counts as a box, and what is skipped:
//   — `rectangle` and `border` commands are the boxes. A rectangle is a filled panel, a border is a line, and either way
//     the page drew a rectangle there; the wireframe outlines it. A box the page draws twice (a filled row and its ring,
//     the same box) is two commands and two boxes here: the capture's count is the count.
//   — a box whose cells round below 2 across or 1 down is skipped: `round(width/8)` of a 1px rule is 0, and there is no
//     outline to draw in no cells. A 20x20 control is 3x1 cells and is drawn as one `+--+` row: a panel one cell tall.
//   — `text` commands are the page's own runs, in the page's order (top-down, then left-to-right as Clay laid them out).
//   — `image`, `scissor-start`/`-end`, `overlay-color-start`/`-end` and `custom` are skipped: an image is not a rectangle
//     (its box is the picture, not a panel), a scissor is a clip, an overlay is a blend, and a custom command is the host's.
//
// The reconciliation is the whole honesty of the kind: a cell is the terminal's 8x16px (registry.ts, terminal/cells.h),
// so a box's cell rect is `round(x/8)`, `round(y/16)`, `round(w/8)`, `round(h/16)` of the page's own box. One cell across
// is 8px, one down is 16px, so a wireframe at 1/8 scale is **not pixel-accurate**: an edge is up to half a cell out (4px
// across, 8px down), a 4px inset does not exist, and a 1px rule rounds away. The text half says the same thing about
// runs: one cell holds one character, a wide (CJK) character two, and a run with less room than its cells ends in `…`.
//
// A wireframe is drawn with ASCII (`+ - |`) because Roboto has no box-drawing glyph and ThorVG has no fallback (the same
// reason flows.ts's connectors are ASCII). A border run is a `connector` role (muted) and the page's own run a `label`
// (ink), so the pixel targets paint a line drawing and its words, not one grey rectangle.
import type { BoxRecord, Item, Layout, LayoutLine } from "../registry.ts";
import { register } from "../registry.ts";
import type { ResponsivePairSpec, ScreenSpec, WireBox, WireSide, WireText } from "../spec.ts";
import { cells, finish, isObject, number, rowsOf, say } from "./shared.ts";

/** The pages `solid/dump.ts` captures: a static page at rest, with no loader and no argument of its own. `figure` is
 *  not one: a wireframe of the wireframe's own page would recurse through a spec the frame has not drawn yet. */
export const KNOWN_PAGES = ["dialog", "list", "sensors", "sheet", "sky", "widgets"] as const;

/** One command of a captured frame, as much of it as a wireframe reads. */
export interface WireCommand {
  type: string;
  box: readonly number[];
  text?: string;
}

/** The most a wireframe may be drawn at, when a spec does not say: a README's fence. */
const DEFAULT_WIDTH = 80;
/** The cells between the two halves of a pair drawn side by side. */
const PAIR_GAP = 2;

/** One cell's width and height, in the page's pixels (registry.ts's constants, restated so this file has no other
 *  dependency on the cell grid than the numbers a reader can check). */
const CELL_X = 8;
const CELL_Y = 16;

/** The east Asian ranges `text.ts` gives two cells: a run's width must be that width, not its `length`. */
const WIDE: readonly (readonly [number, number])[] = [
  [0x1100, 0x115f],
  [0x2e80, 0xa4cf],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe10, 0xfe19],
  [0xfe30, 0xfe6f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x1f300, 0x1f64f],
  [0x1f900, 0x1f9ff],
  [0x20000, 0x3fffd],
];

/** One code point's width: 2 in the wide ranges, 1 otherwise (text.ts's `cellWidth`, copied here so this file imports
 *  no renderer; `figure-wireframe.test.ts` holds the copy to it on every page run). */
function codeWidth(code: number): number {
  for (const [from, to] of WIDE) if (code >= from && code <= to) return 2;
  return 1;
}

/** A string's width in display cells. */
export function wireCells(text: string): number {
  let width = 0;
  for (const ch of text) width += codeWidth(ch.codePointAt(0) ?? 0);
  return width;
}

/** A box's cell rect: the layout's unit, and the reconciliation the kind documents. */
export interface CellBox extends WireBox {
  col: number;
  row: number;
  cols: number;
  rows: number;
}
export const cellBox = (box: WireBox): CellBox => ({
  ...box,
  col: Math.round(box.x / CELL_X),
  row: Math.round(box.y / CELL_Y),
  cols: Math.max(1, Math.round(box.width / CELL_X)),
  rows: Math.max(1, Math.round(box.height / CELL_Y)),
});

/**
 * A captured frame as the data a wireframe draws: its boxes and its texts, with the commands this kind does not draw
 * left out (see the header). `from-page.ts` writes it and the test reads it back from another capture, so the spec's
 * stream is the page's, not a transcription of it.
 */
export function frameOf(commands: readonly WireCommand[]): { boxes: WireBox[]; texts: WireText[] } {
  const boxes: WireBox[] = [];
  const texts: WireText[] = [];
  for (const command of commands) {
    if (!Array.isArray(command.box) || command.box.length < 4) continue;
    const [x, y, width, height] = command.box.map(Number) as [number, number, number, number];
    if (![x, y, width, height].every(Number.isFinite)) continue;
    if (command.type === "rectangle" || command.type === "border") {
      // a rule under a cell rounds to no outline: a 1px line is 0 rows, and 4px across is half a cell
      if (width > 0 && height > 0 && Math.round(width / CELL_X) >= 2 && Math.round(height / CELL_Y) >= 1)
        boxes.push({ x, y, width, height });
    } else if (command.type === "text" && typeof command.text === "string" && command.text.trim())
      texts.push({ x, y, text: command.text });
  }
  return { boxes, texts };
}

/** One text run the wireframe draws, and the page's own string it came from. */
export interface DrawnText {
  /** The page's string, as its command carries it. */
  text: string;
  /** The cells the wireframe draws: the page's string, or its prefix in `…`. */
  drawn: string;
  /** Did the run have less room than its cells? The `…` is the mark. */
  shortened: boolean;
  col: number;
  row: number;
  /** The drawn run's width in cells. */
  cols: number;
}

/** A wireframe as a grid: the page's cell size, its boxes' rects, and the texts it could place. */
export interface Wireframe {
  width: number;
  height: number;
  boxes: CellBox[];
  texts: DrawnText[];
  /** The border characters, a cell at a time: what each row draws before the text runs are put on it. */
  edges: string[][];
}

/** A run cut to `room` cells: its own string when it fits, else a prefix and the `…` marker (one cell). */
function shorten(text: string, room: number): { drawn: string; shortened: boolean } {
  if (room < 1) return { drawn: "", shortened: true };
  if (wireCells(text) <= room) return { drawn: text, shortened: false };
  let drawn = "";
  let used = 0;
  for (const ch of text) {
    const width = codeWidth(ch.codePointAt(0) ?? 0);
    if (used + width > room - 1) break;
    drawn += ch;
    used += width;
  }
  return { drawn: `${drawn}…`, shortened: true };
}

/** The clip a box's rect gets on a grid: a box that ends at the page's edge keeps its last cell. */
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

/** Draw one box's outline in ASCII: `+` the corners, `-` across, `|` down, and a one-cell-tall panel as `+--+`. */
function outline(edges: string[][], box: CellBox, width: number, height: number): void {
  const left = clamp(box.col, 0, width - 1);
  const right = clamp(box.col + box.cols - 1, left, width - 1);
  const top = clamp(box.row, 0, height - 1);
  const bottom = clamp(box.row + box.rows - 1, top, height - 1);
  if (box.rows === 1) {
    for (let x = left; x <= right; x++) edges[top]![x] = x === left || x === right ? "+" : "-";
    return;
  }
  for (let x = left; x <= right; x++) {
    const corner = x === left || x === right;
    edges[top]![x] = corner ? "+" : "-";
    edges[bottom]![x] = corner ? "+" : "-";
  }
  for (let y = top + 1; y < bottom; y++) {
    edges[y]![left] = "|";
    edges[y]![right] = "|";
  }
}

/**
 * One side of a wireframe: its grid, its outlines, and the page's texts placed by their commands. A text's room is the
 * grid's edge, the next border to its right, or the next text on its row, whichever comes first — a cell holds one
 * character, so a run that does not fit is cut with `…` and never overwrites a panel's edge or the run beside it.
 */
export function wireframeOf(side: WireSide): Wireframe {
  const width = Math.max(1, Math.round(side.width / CELL_X));
  const height = Math.max(1, Math.round(side.height / CELL_Y));
  const edges: string[][] = Array.from({ length: height }, () => Array.from({ length: width }, () => " "));
  const boxes = side.boxes.map(cellBox);
  for (const box of boxes) outline(edges, box, width, height);
  const rows: DrawnText[][] = Array.from({ length: height }, () => []);
  const texts: DrawnText[] = [];
  for (const text of side.texts) {
    const row = Math.round(text.y / CELL_Y);
    const col = Math.round(text.x / CELL_X);
    if (row < 0 || row >= height || col < 0 || col >= width) continue;
    let end = width;
    // a run is stopped by a panel's *vertical* edge, not by the dashes of a horizontal one: a page's content row can
    // land on a box's rounded bottom edge, and there the run is what should be read
    for (let x = col + 1; x < width; x++)
      if (edges[row]![x] === "|" || edges[row]![x] === "+") {
        end = x;
        break;
      }
    for (const other of rows[row]!) if (other.col > col) end = Math.min(end, other.col);
    // two runs rounding to the same cell is the page's later one on top: the earlier is covered, not drawn twice
    for (const other of rows[row]!)
      if (other.col === col) {
        other.drawn = "";
        other.cols = 0;
        other.shortened = true;
      }
    const drawn = shorten(text.text, end - col);
    const entry: DrawnText = { text: text.text, ...drawn, col, row, cols: wireCells(drawn.drawn) };
    rows[row]!.push(entry);
    texts.push(entry);
  }
  return { width, height, boxes, texts, edges };
}

/**
 * One grid row as items: the border runs as `connector` (a line, muted), the page's runs as `label` (its words, ink),
 * and a gap of nothing but blanks as a space. A pair of two pages is past ThorVG's 1,024-node tree with an item a cell,
 * so the row is split by role rather than by cell: a border segment is one item, however long.
 */
function lineOf(wire: Wireframe, row: number, prefix: string): LayoutLine {
  const starts = new Map(wire.texts.filter((text) => text.row === row && text.cols > 0).map((text) => [text.col, text]));
  const items: Item[] = [];
  let col = 0;
  while (col < wire.width) {
    const run = starts.get(col);
    if (run) {
      items.push({
        kind: "text",
        id: `${prefix}-${row}-${col}-label-cell`,
        textId: `${prefix}-${row}-${col}-label`,
        text: run.drawn,
        cells: run.cols,
        paint: "ink",
        role: "label",
      });
      col += run.cols;
      continue;
    }
    let end = col + 1;
    while (end < wire.width && !starts.has(end)) end++;
    const segment = wire.edges[row]!.slice(col, end).join("");
    if (segment.trim() === "")
      items.push({ kind: "space", id: `${prefix}-${row}-${col}-gap`, cells: end - col, paint: "ink" });
    else
      items.push({
        kind: "text",
        id: `${prefix}-${row}-${col}-edge-cell`,
        textId: `${prefix}-${row}-${col}-edge`,
        text: segment,
        cells: end - col,
        paint: "muted",
        role: "connector",
      });
    col = end;
  }
  return { items };
}

/** The boxes as the layout's records: one a page rectangle, in the drawing order. */
const boxRecords = (wire: Wireframe, prefix = "fig-wire-box"): BoxRecord[] =>
  wire.boxes.map((box, i) => ({
    id: `${prefix}-${i}`,
    textId: `${prefix}-text-${i}`,
    text: "",
    role: "step",
  }));

/** The page's runs in its order, for the focus: a wireframe's names are the words it draws. */
const labelsOf = (side: WireSide, prefix: string): Layout["labels"] =>
  side.texts.map((text, i) => ({ textId: `${prefix}-label-${i}`, text: text.text }));

/** A page's width in cells, the number a spec's `options.width` is held against. */
const cellsAcross = (width: number) => Math.round(width / CELL_X);

/** The width a spec may be drawn at: its `options.width`, or a README's 80 cells. */
function limitOf(options: unknown): number {
  const width = isObject(options) ? number(options.width) : undefined;
  return width ?? DEFAULT_WIDTH;
}

/**
 * A screen: one page's own frame as a wireframe. The page's name and size are the data's identity, and the boxes and
 * texts beside them are the frame `from-page.ts` captured, so this function is a cut of what the page drew and never a
 * list of what a wireframe should hold.
 */
function screen(spec: ScreenSpec): Layout {
  const wire = wireframeOf(spec.data);
  const lines = Array.from({ length: wire.height }, (_, row) => lineOf(wire, row, "fig-wire"));
  return finish(spec, "screen", wire.width, lines, [], labelsOf(spec.data, "fig-wire"), boxRecords(wire));
}

/** A captioned side's rows, each padded to the side's own width. */
function sideLines(side: WireSide, caption: string, prefix: string): { caption: LayoutLine; rows: LayoutLine[]; wire: Wireframe } {
  const wire = wireframeOf(side);
  const rows = Array.from({ length: wire.height }, (_, row) => {
    const line = lineOf(wire, row, prefix);
    const used = line.items.reduce((n, item) => n + item.cells, 0);
    if (used < wire.width) line.items.push({ kind: "space", id: `${prefix}-pad-${row}`, cells: wire.width - used, paint: "ink" });
    return line;
  });
  return {
    caption: {
      items: [{ kind: "text", id: `${prefix}-caption-cell`, textId: `${prefix}-caption`, text: caption, cells: cells(caption), paint: "muted", role: "label" }],
    },
    rows,
    wire,
  };
}

/**
 * The same page at two widths, each side its own captured frame and its own caption. Side by side when the two grids
 * and their gap fit `options.width`, above/below when they do not — a narrow README stacks the same two panels.
 */
function responsivePair(spec: ResponsivePairSpec): Layout {
  const { narrow, wide } = spec.data;
  const n = sideLines(narrow, `narrow ${narrow.width}x${narrow.height}`, "fig-wire-narrow");
  const w = sideLines(wide, `wide ${wide.width}x${wide.height}`, "fig-wire-wide");
  const sideBySide = n.wire.width + PAIR_GAP + w.wire.width <= limitOf(spec.options);
  const lines: LayoutLine[] = [];
  const boxes: BoxRecord[] = [...boxRecords(n.wire, "fig-wire-narrow-box"), ...boxRecords(w.wire, "fig-wire-wide-box")];
  const labels = [...labelsOf(narrow, "fig-wire-narrow"), ...labelsOf(wide, "fig-wire-wide")];
  if (sideBySide) {
    lines.push({ items: [...n.caption.items, { kind: "space", id: "fig-wire-pair-gap", cells: PAIR_GAP, paint: "ink" }, ...w.caption.items] });
    const rows = Math.max(n.rows.length, w.rows.length);
    for (let row = 0; row < rows; row++) {
      const items: Item[] = [];
      const a = n.rows[row];
      const b = w.rows[row];
      if (a) items.push(...a.items);
      else items.push({ kind: "space", id: `fig-wire-narrow-blank-${row}`, cells: n.wire.width, paint: "ink" });
      items.push({ kind: "space", id: `fig-wire-pair-gap-${row}`, cells: PAIR_GAP, paint: "ink" });
      if (b) items.push(...b.items);
      else items.push({ kind: "space", id: `fig-wire-wide-blank-${row}`, cells: w.wire.width, paint: "ink" });
      lines.push({ items });
    }
  } else {
    lines.push(n.caption, ...n.rows);
    lines.push({ items: [{ kind: "space", id: "fig-wire-pair-space", cells: 1, paint: "ink" }] });
    lines.push(w.caption, ...w.rows);
  }
  const width = Math.max(
    n.wire.width,
    w.wire.width,
    ...lines.map((line) => line.items.reduce((sum, item) => sum + item.cells, 0)),
  );
  return finish(spec, "responsivePair", width, lines, [], labels, boxes);
}

/** A page this repository has, or the sentence that names the ones it does. */
function pageProblem(page: unknown): string | undefined {
  if (typeof page === "string" && (KNOWN_PAGES as readonly string[]).includes(page)) return undefined;
  return `A wireframe's page is one this repository draws — ${KNOWN_PAGES.join(", ")} — not ${say(page)}.`;
}

/** One side's size and frame, as `check` reads it before it is a `WireSide`. */
interface RawSide {
  width?: number;
  height?: number;
  boxes: unknown[];
  texts: unknown[];
  problems: string[];
}

/** A side's width, height and two lists, with the sentences for whatever is not one. */
function sideProblems(raw: unknown, label: string): RawSide {
  if (!isObject(raw))
    return {
      boxes: [],
      texts: [],
      problems: [`The ${label} needs its size and its frame: { "width": 360, "height": 400, "boxes": [...], "texts": [...] }.`],
    };
  const problems: string[] = [];
  const width = number(raw.width);
  const height = number(raw.height);
  if (width === undefined || !(width > 0) || height === undefined || !(height > 0))
    problems.push(`The ${label} needs its size: 360x400, in pixels, not ${say(raw.width)}x${say(raw.height)}.`);
  const boxes = rowsOf(raw.boxes);
  const texts = rowsOf(raw.texts);
  for (const [i, box] of boxes.entries()) {
    const values = isObject(box) ? [box.x, box.y, box.width, box.height].map(number) : [];
    if (values.length !== 4 || values.some((value) => value === undefined))
      problems.push(`Box ${i + 1} of the ${label} needs x, y, width and height in pixels.`);
  }
  for (const [i, text] of texts.entries()) {
    const ok =
      isObject(text) &&
      typeof text.text === "string" &&
      text.text.trim() !== "" &&
      number(text.x) !== undefined &&
      number(text.y) !== undefined;
    if (!ok) problems.push(`Text ${i + 1} of the ${label} needs x, y and a run.`);
  }
  if (!boxes.length && !texts.length)
    problems.push(`The ${label}'s frame is empty: no command drew a box or a text.`);
  else if (!boxes.length)
    problems.push(`The ${label} has no rectangles or borders, so its wireframe has no box to draw.`);
  return { width, height, boxes, texts, problems };
}

/** A side's cells against `options.width`: a page wider than the figure is refused, with both numbers. */
function widthProblem(side: RawSide, label: string, options: unknown): string[] {
  if (side.width === undefined) return [];
  const across = cellsAcross(side.width);
  const limit = limitOf(options);
  return across > limit
    ? [`The ${label} is ${side.width}px wide, ${across} cells, but options.width is ${limit}: draw it in a narrower figure or raise options.width.`]
    : [];
}

/** A screen: a page this repository draws, its size, and a frame with at least one box. */
function screenProblems(data: unknown, options: unknown): string[] {
  if (!isObject(data))
    return ['A screen needs its page: { "page": "widgets", "width": 360, "height": 760 } and the frame\'s boxes and texts.'];
  const out: string[] = [];
  const page = pageProblem(data.page);
  if (page) out.push(page);
  const label = typeof data.page === "string" ? `${data.page} page` : "page";
  const side = sideProblems(data, label);
  out.push(...side.problems, ...widthProblem(side, label, options));
  return out;
}

/** A pair: two sides of one page, the narrow no wider than the wide, each a frame with a box. */
function pairProblems(data: unknown, options: unknown): string[] {
  if (!isObject(data))
    return ['A responsive pair needs its page and its two sides: { "page": "widgets", "narrow": { ... }, "wide": { ... } }.'];
  const out: string[] = [];
  const page = pageProblem(data.page);
  if (page) out.push(page);
  const narrow = sideProblems(data.narrow, "narrow side");
  const wide = sideProblems(data.wide, "wide side");
  out.push(...narrow.problems, ...wide.problems);
  out.push(...widthProblem(narrow, "narrow side", options), ...widthProblem(wide, "wide side", options));
  if (narrow.width !== undefined && wide.width !== undefined && narrow.width > wide.width)
    out.push(
      `The narrow side is ${narrow.width}px wide and the wide side ${wide.width}px: a responsive pair's narrow is the ` +
        `narrower of the two.`,
    );
  return out;
}

/** A screen's names are its page's runs; a pair's are both sides', in the drawing order. */
function screenNames(data: unknown): string[] {
  return isObject(data) ? rowsOf(data.texts).flatMap((text) => (isObject(text) && typeof text.text === "string" ? [text.text] : [])) : [];
}

function pairNames(data: unknown): string[] {
  if (!isObject(data)) return [];
  const names: string[] = [];
  for (const side of [data.narrow, data.wide])
    if (isObject(side))
      for (const text of rowsOf(side.texts))
        if (isObject(text) && typeof text.text === "string") names.push(text.text);
  return names;
}

register("screen", { layout: screen, check: screenProblems, names: screenNames });
register("responsivePair", { layout: responsivePair, check: pairProblems, names: pairNames });
