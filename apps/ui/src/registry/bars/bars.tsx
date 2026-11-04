// A multi-series bar chart: one row per category, one cell per series, and the bar is the cell's own background — as wide as
// the value's share of the scale, with left padding of the same width so the number starts where the bar ends. The markup is
// a table: the column headers are the legend (each with a checkbox that hides its series), every number is the cell's text,
// and the colours are decoration over the numbers a reader already hears.
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createSignal, createUniqueId, For } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the table, `data-part` and the caller's class merged in. */
export type BarsPartProps = PartProps;

/** One series: its key, which the caller hides it by, and the name the legend shows. */
export interface BarsSeries {
  readonly key: string;
  readonly label: string;
}

export interface BarsProps extends Renderable<BarsPartProps, void> {
  /** The series, in reading order; each is a column and a legend entry. */
  readonly series: ReadonlyArray<BarsSeries>;
  /** The categories, one row each. */
  readonly categories: ReadonlyArray<string>;
  /** The values, one row per category and one number per series; a missing number is an empty cell. */
  readonly values: ReadonlyArray<ReadonlyArray<number>>;
  /** The table's caption, which also names the chart: "Response time by region". */
  readonly label: string;
  /** The top of the scale; left out, the largest value. */
  readonly max?: number;
  /** A value as a reader sees it; left out, the number itself. */
  readonly format?: (value: number) => string;
  /** The series keys to hide; with `onHiddenChange`, the page owns this, otherwise it only seeds the component. */
  readonly hidden?: ReadonlyArray<string>;
  /** Called with the new set when a legend box moves; given, the component reads `hidden` instead of its own state. */
  readonly onHiddenChange?: (hidden: ReadonlyArray<string>) => void;
  readonly class?: string;
}

// The bar's paint: the highlight at a fifth of its strength, over the surface. One tint for every series — the columns and
// their headers carry the series, so colour never has to, and a number that runs under a long bar still reads.
const BAR = css.colorMix("in oklab", [t.color.highlight, "22%"], t.color.surface);

// Every row is a grid of its own with the same tracks (the label, then one per series), so a hidden cell leaves no hole and
// the columns stay aligned across the sections: the tracks are the row's, not the whole table's.
const table = css.cn(
  css.display("block"),
  css.width("100%"),
  css.borderCollapse("collapse"),
  css.fontSize(t.font.size),
  css.color(t.color.text),
);

const caption = css.cn(
  css.display("block"),
  css.paddingBlock(t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);
const head = css.cn(css.display("block"));
const body = css.cn(css.display("block"));
const row = css.cn(css.display("grid"), css.alignItems("center"), css.group());

// The header row is the legend: a checkbox that hides its series, and the name.
const seriesHead = css.cn(
  css.padding("2px 0"),
  css.paddingInlineEnd(t.space._2),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("400"),
  css.color(t.color.muted),
  css.textAlign("start"),
);
const legend = css.cn(
  css.display("inline-flex"),
  css.alignItems("center"),
  css.gap(t.space._1),
  css.cursor("pointer"),
  css.minWidth("0"),
  css.overflowWrap("anywhere"),
);
const box = css.cn(
  css.accentColor(t.color.highlight),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

const label = css.cn(
  css.paddingBlock("0.15rem"),
  css.paddingInlineEnd(t.space._2),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("500"),
  css.textAlign("start"),
  css.overflowWrap("anywhere"),
  css.within(css.hover)(css.color(t.color.textHover)),
);

// One bar. The value's share of the scale is the background's width, and the same width of left padding moves the number
// past the bar's end. `min()` stops a long label leaving the plot: a bar longer than the room the label needs runs under it
// instead, which is why the bar is a tint and not a solid.
const cell = css.cn(
  css.paddingBlock("0.15rem"),
  css.paddingInlineEnd(t.space._1),
  css.paddingInlineStart("min(calc(var(--v) / var(--max) * 100% + 0.35rem), calc(100% - 4.5rem))"),
  css.fontSize(t.font.sizeSm),
  css.fontVariantNumeric("tabular-nums"),
  css.minWidth("0"),
  css.overflowWrap("anywhere"),
  css.borderRadius("2px"),
  css.backgroundImage(css.linearGradient(BAR, BAR)),
  css.backgroundRepeat("no-repeat"),
  css.backgroundPosition("0 50%"),
  // the bar's own gap is drawn inside it, so the row's hover area is one strip and nothing flickers between cells
  css.backgroundSize("calc(var(--v) / var(--max) * 100%) calc(100% - 0.25rem)"),
  css.transition("background-color 120ms"),
  css.within(css.hover)(css.backgroundColor(t.color.buttonBackground)),
);

const frame = css.cn(css.display("grid"), css.width("100%"), css.margin(0));

const number = (value: number): string => String(value);

/**
 * A multi-series bar chart: one row per category, one bar per series, each bar a background sized by its value.
 *
 * The header row is the legend: its checkboxes hide a column, and because the hiding is state the component (or the page)
 * owns, the hidden cells leave the table too instead of sitting there empty. The numbers are the cells' text, so the chart
 * reads without a pointer, and with the stylesheet off it is the table underneath.
 */
export const Bars = (props: BarsProps): JSX.Element => {
  const base = createUniqueId();
  const [ownHidden, setOwnHidden] = createSignal<ReadonlyArray<string>>(props.hidden ?? []);
  // the page owns the state when it gave a handler; otherwise the component does, seeded by `hidden`
  const hidden = (): ReadonlyArray<string> =>
    props.onHiddenChange ? (props.hidden ?? []) : ownHidden();
  const isHidden = (key: string): boolean => hidden().includes(key);
  const toggle = (key: string, shown: boolean): void => {
    const next = shown ? hidden().filter((entry) => entry !== key) : [...hidden(), key];
    if (props.onHiddenChange) {
      props.onHiddenChange(next);
    } else {
      setOwnHidden(next);
    }
  };
  const top = (): number => {
    const largest = props.max ?? Math.max(0, ...props.values.flat());
    // one scale for a flat chart, so a bar with no height does not divide by nothing
    return largest <= 0 ? 1 : largest;
  };
  const show = (value: number): string => (props.format ?? number)(value);
  // the tracks every row shares: the label column, then one per series that is still shown
  const shown = (): number =>
    Math.max(1, props.series.filter((series) => !isHidden(series.key)).length);
  const tracks = (): string => `min(7rem, 30%) repeat(${shown()}, minmax(0, 1fr))`;
  // the header's id ties a cell to its series for a reader; the key only has to be unique within this chart
  const headerId = (key: string): string => `${base}-${key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  const own = {
    "data-part": "bars",
    get class() {
      return css.cn(table, props.class);
    },
    get style() {
      return { "--max": top() } as never;
    },
  } as unknown as PartProps;

  return (
    <figure data-part="bars-frame" class={frame}>
      {renderPart(props, own, undefined, (part) => (
        <table {...part}>
          <caption class={caption}>{props.label}</caption>
          <thead class={head}>
            <tr class={row} style={{ "grid-template-columns": tracks() } as never}>
              {/* the corner is the grid's first cell and says nothing: the row headers name the rows */}
              <td aria-hidden="true" />
              <For each={props.series}>
                {(series) => (
                  <th
                    scope="col"
                    id={headerId(series.key)}
                    data-part="bars-series"
                    data-series={series.key}
                    class={seriesHead}
                    hidden={isHidden(series.key)}
                  >
                    <label class={legend}>
                      <input
                        type="checkbox"
                        class={box}
                        checked={!isHidden(series.key)}
                        onChange={(event) => toggle(series.key, event.currentTarget.checked)}
                      />
                      {series.label}
                    </label>
                  </th>
                )}
              </For>
            </tr>
          </thead>
          <tbody class={body}>
            <For each={props.categories}>
              {(category, line) => (
                <tr class={row} style={{ "grid-template-columns": tracks() } as never}>
                  <th scope="row" class={label}>
                    {category}
                  </th>
                  <For each={props.series}>
                    {(series, column) => {
                      const value = (): number | undefined => props.values[line()]?.[column()];
                      return (
                        <td
                          data-part="bars-cell"
                          data-series={series.key}
                          headers={headerId(series.key)}
                          class={cell}
                          hidden={isHidden(series.key)}
                          style={{ "--v": value() ?? 0 } as never}
                        >
                          {value() === undefined ? "" : show(value() as number)}
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
    </figure>
  );
};
