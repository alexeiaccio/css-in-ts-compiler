// A heatmap: a table of values shown as colour. The markup is the table — one row per series, one cell per column, every
// value in the cell as text — and the colour is `color-mix()` between two theme colours by the cell's share of the scale.
// No SVG and no canvas: the square is the cell, and the grid is the table's rows joining one grid with `display: contents`.
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For, createSignal } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the table, `data-part` and the caller's class merged in. */
export type HeatmapPartProps = PartProps;

/** One row of the heatmap: its label and its value per column. */
export interface HeatmapRow {
  readonly label: string;
  readonly values: ReadonlyArray<number>;
}

export interface HeatmapProps extends Renderable<HeatmapPartProps, void> {
  /** The rows, in reading order; a missing value is drawn as an empty cell. */
  readonly rows: ReadonlyArray<HeatmapRow>;
  /** The column labels: hours, days, buckets — one per value. */
  readonly columns: ReadonlyArray<string>;
  /** The table's caption, which also names it: "Requests by hour, last week". */
  readonly label: string;
  /** The top of the scale; left out, the largest value. */
  readonly max?: number;
  /** The bottom of the scale; left out, 0. */
  readonly min?: number;
  /** The noun a cell's value is read with, in the caption's second line: "requests". */
  readonly unit?: string;
  /** A cell as a reader sees it on hover; left out, the number itself. */
  readonly format?: (value: number) => string;
  readonly class?: string;
}

// The table is the grid: the label column is as wide as the longest label, every other column shares what is left. The rows
// and their groups are `display: contents`, so the cells are the grid items and the columns stay aligned across the sections
// — a table's own layout, without a table's boxes.
const table = css.cn(
  css.display("grid"),
  css.gap("2px"),
  css.width("100%"),
  css.borderCollapse("collapse"),
  css.fontSize(t.font.size),
  css.color(t.color.text),
);

// the caption is the table's first row, across every column
const caption = css.cn(
  css.gridColumn("1 / -1"),
  css.paddingBlock(t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);
const head = css.cn(css.display("contents"));
const body = css.cn(css.display("contents"));
const row = css.cn(css.display("contents"));

// The column labels are the header row: small, muted, and on the same grid as the cells.
const column = css.cn(
  css.padding("2px 0"),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("400"),
  css.color(t.color.muted),
  css.textAlign("center"),
);

// The row label is a header cell of the grid: it stays put while the squares colour themselves.
const corner = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.muted));
const label = css.cn(
  css.paddingInlineEnd(t.space._2),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("500"),
  css.textAlign("start"),
  css.whiteSpace("nowrap"),
);

// One square. `min-height: 0` lets the value shown on hover overflow a small cell instead of stretching its row; the value
// itself is the cell's text, hidden at rest and shown over the square.
const cell = css.cn(
  css.group(),
  css.position("relative"),
  css.aspectRatio("1"),
  css.minWidth("0"),
  css.minHeight("0"),
  css.borderRadius("2px"),
  css.bg(
    "color-mix(in oklab, var(--heat-hot) calc((var(--v) - var(--min)) / (var(--max) - var(--min)) * 100%), var(--heat-cold))",
  ),
);

// The numbers view: the square grows to its row, the colour steps aside and the value is text in place. It is a class the
// host's own toggle swaps, not a media or attribute condition — the state is a control's, and a checkbox cannot reach a
// sibling without `:has()`, which the engine does not offer.
const cellOpen = css.cn(
  cell,
  css.aspectRatio("auto"),
  css.padding("2px 6px"),
  css.textAlign("end"),
  css.bg(t.color.surface),
  css.border("1px solid", t.color.border),
);

const empty = css.cn(cell, css.bg(t.color.buttonBackground));

// The value is the cell's own text: at rest it is there for a reader and out of the way of the colour, and the pointer's
// sample shows it over the square. It is a span so the hide/show is a rule of its own, and `inset: 0` keeps the square's size.
const text = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.fontSize("0"),
  css.lineHeight(1),
  css.whiteSpace("nowrap"),
  css.color(t.color.text),
  css.pointerEvents("none"),
  css.within(css.hover)(
    css.position("relative"),
    css.zIndex("1"),
    css.paddingInline(t.space._1),
    css.fontSize(t.font.sizeSm),
    css.bg(t.color.surface),
    css.borderRadius("2px"),
  ),
);

// In the numbers view every value is visible in place, with nothing to hover.
const textOpen = css.cn(
  text,
  css.position("static"),
  css.fontSize(t.font.size),
  css.bg("transparent"),
  css.pointerEvents("auto"),
  css.opacity(1),
);

// The switch: one button, `aria-pressed` says which view is on, and it is the only state the component owns.
const toggle = css.cn(
  css.width("max-content"),
  css.padding("2px 8px"),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.sm),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.fontSize(t.font.sizeSm),
  css.cursor("pointer"),
  css.attr("aria-pressed", "true")(css.bg(t.color.highlight), css.color(t.color.onHighlight)),
);

const scale = css.cn(css.margin("0"), css.fontSize(t.font.sizeSm), css.color(t.color.muted));
const toggles = css.cn(css.justifySelf("start"));

// The figure fills the page it is on: a table of 24 columns does not shrink to its caption, and the preview centres its items.
const frame = css.cn(css.display("grid"), css.width("100%"), css.margin(0), css.gap(t.space._1));

/**
 * A heatmap: values across two dimensions, as a table whose cells are coloured by their share of the scale.
 *
 * The colours are two theme colours mixed by the value, so a tint or a theme moves the whole map; the table is the data, and
 * a reader on a screen reader or with the stylesheet off gets the rows, the headers and the numbers.
 */
export const Heatmap = (props: HeatmapProps): JSX.Element => {
  // the one thing the component owns: which of the two views is on
  const [numbers, setNumbers] = createSignal(false);
  const values = (): ReadonlyArray<number> =>
    props.rows.flatMap((entry) => entry.values).filter((value) => Number.isFinite(value));
  const low = (): number => props.min ?? 0;
  const high = (): number => {
    const top = props.max ?? Math.max(0, ...values());
    // one range for a flat map: every cell lands on the same colour instead of dividing by nothing
    return top === low() ? low() + 1 : top;
  };
  const columns = (): number => Math.max(1, props.columns.length);
  const show = (value: number): string => (props.format ?? String)(value);

  const own = {
    "data-part": "heatmap",
    get class() {
      return css.cn(table, props.class);
    },
    get style() {
      return {
        // the count is the caller's, so the grid is spelled out: `repeat()` cannot take a custom property (kebab-case: a
        // camelCase key is dropped by the style object's writer, which only sets the names it knows)
        "grid-template-columns": `minmax(2.5rem, max-content) repeat(${columns()}, minmax(0, 1fr))`,
        "--min": low(),
        "--max": high(),
        // a token is build-time text: a run-time style names the custom property the theme declares
        "--heat-hot": "var(--color-highlight)",
        "--heat-cold": "var(--color-button-background)",
      } as never;
    },
  } as unknown as PartProps;

  return (
    <figure data-part="heatmap-frame" class={frame}>
      <button
        type="button"
        data-part="heatmap-toggle"
        class={css.cn(toggle, toggles)}
        aria-pressed={numbers() ? "true" : "false"}
        onClick={() => setNumbers((on) => !on)}
      >
        {numbers() ? "Show the colours" : "Show the numbers"}
      </button>
      {renderPart(props, own, undefined, (part) => (
        <table {...part}>
          <caption data-part="heatmap-caption" class={caption}>
            {props.label}
            {props.unit === undefined ? "" : `, in ${props.unit}`}
          </caption>
          <thead class={head}>
            <tr class={row}>
              {/* the corner is empty and says nothing: it is the grid's first cell, not a header */}
              <td aria-hidden="true" class={corner} />
              <For each={props.columns}>
                {(name) => (
                  <th scope="col" class={column}>
                    {name}
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody class={body}>
            <For each={props.rows}>
              {(entry) => (
                <tr class={row}>
                  <th scope="row" class={label}>
                    {entry.label}
                  </th>
                  <For each={props.columns}>
                    {(_, index) => {
                      const value = (): number | undefined => entry.values[index()];
                      return (
                        <td
                          data-part="heatmap-cell"
                          class={value() === undefined ? empty : numbers() ? cellOpen : cell}
                          style={
                            {
                              "--v": value() ?? low(),
                            } as never
                          }
                        >
                          <span class={numbers() ? textOpen : text}>
                            {value() === undefined ? "" : show(value() as number)}
                          </span>
                        </td>
                      );
                    }}
                  </For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      ))}
      <p data-part="heatmap-scale" class={scale}>
        {`${show(low())} to ${show(high())}${props.unit === undefined ? "" : ` ${props.unit}`}; darker is more.`}
      </p>
    </figure>
  );
};
