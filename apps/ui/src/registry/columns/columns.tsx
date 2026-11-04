// A column chart: one bar per category, its height the value's share of the scale. It is an ordered list of the categories,
// so with the stylesheet off it reads as a list of numbers with their names; the bar is a box whose height is CSS, and the
// value sits above it in text, not in a tooltip — a reader can read the chart without a pointer.
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the list, `data-part` and the caller's class merged in. */
export type ColumnsPartProps = PartProps;

/** One bar: its name and its value. */
export interface ColumnPoint {
  readonly label: string;
  readonly value: number;
}

export interface ColumnsProps extends Renderable<ColumnsPartProps, void> {
  /** The bars, in reading order. */
  readonly points: ReadonlyArray<ColumnPoint>;
  /** The chart's name, which also names the list: "Requests per 25 ms bucket". */
  readonly label: string;
  /** The top of the scale; left out, the largest value. */
  readonly max?: number;
  /** The plot's height, a CSS length. @default "10rem" */
  readonly height?: string;
  /** A value as a reader sees it; left out, the number itself. */
  readonly format?: (value: number) => string;
  readonly class?: string;
}

// The list is the chart's frame: the bars share the width evenly and stand on one baseline.
const list = css.cn(
  css.display("flex"),
  css.alignItems("flex-end"),
  css.gap(t.space._1),
  css.width("100%"),
  css.margin(0),
  css.padding(0),
  css.listStyle("none"),
);

// One category: the plot above, the name below. `group()` is what a child reads to know the category is hovered.
const item = css.cn(
  css.group(),
  css.flex("1"),
  css.minWidth("0"),
  css.display("flex"),
  css.flexDirection("column"),
  css.alignItems("center"),
  css.gap(t.space._1),
);

// The plot: the value and the bar, bottom-aligned, so the value rides on top of whatever height the bar has.
const plot = css.cn(
  css.display("flex"),
  css.width("100%"),
  css.flexDirection("column"),
  css.justifyContent("flex-end"),
  css.alignItems("center"),
  css.height("var(--columns-height)"),
  css.borderBottom("1px solid", t.color.border),
);

// The bar: the value's share of the scale, of the plot's height less the room the value's own line takes, so the tallest
// bar never pushes its number out of the frame.
const bar = css.cn(
  css.width("100%"),
  css.height("calc(var(--v) / var(--max) * (var(--columns-height) - 1.5em))"),
  css.minHeight("1px"),
  css.bg(t.color.highlight),
  css.borderRadius("2px 2px 0 0"),
  css.transition("background-color 120ms"),
  css.within(css.hover)(css.bg(t.color.highlightPressed)),
);

const value = css.cn(
  css.fontSize(t.font.sizeSm),
  css.fontVariantNumeric("tabular-nums"),
  css.color(t.color.text),
);

// The name wraps rather than clip: a truncated category is a lost value. Its `order` puts it under the bar for the eye while
// the reading order stays "the name, then its value".
const label = css.cn(
  css.order(1),
  css.maxWidth("100%"),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.textAlign("center"),
  css.overflowWrap("anywhere"),
);

// The figure is the whole chart: the caption names it and says what the numbers are, and the list under it is the data.
const frame = css.cn(css.display("grid"), css.width("100%"), css.margin(0), css.gap(t.space._1));
const caption = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.textAlign("center"),
);

const number = (point: number): string => String(point);

/**
 * A column chart: categories along the bottom, the value as the height of each bar.
 *
 * The scale is the caller's (`max`) or the bars' own. The value is text above each bar, so the chart reads without a pointer,
 * and the list is the data: with the stylesheet off it is the same numbers with their names.
 */
export const Columns = (props: ColumnsProps): JSX.Element => {
  const top = (): number => {
    const largest = props.max ?? Math.max(0, ...props.points.map((point) => point.value));
    // one range for a flat chart: every bar lands on the same height instead of dividing by nothing
    return largest === 0 ? 1 : largest;
  };
  const show = (point: number): string => (props.format ?? number)(point);

  const own = {
    "data-part": "columns",
    get class() {
      return css.cn(list, props.class);
    },
    get style() {
      return {
        "--max": top(),
        "--columns-height": props.height ?? "10rem",
      } as never;
    },
  } as unknown as PartProps;

  return (
    <figure data-part="columns-frame" class={frame}>
      <figcaption data-part="columns-caption" class={caption}>
        {props.label}
      </figcaption>
      {renderPart(props, own, undefined, (part) => (
        <ol {...part}>
          <For each={props.points}>
            {(point) => (
              <li
                data-part="columns-bar"
                class={item}
                style={
                  {
                    "--v": point.value,
                  } as never
                }
              >
                {/* the reading order is the name and then its value; `order` below puts the name under the bar */}
                <span class={label} data-part="columns-label">
                  {point.label}
                </span>
                <span class={plot} data-part="columns-plot">
                  <span class={value} data-part="columns-value">
                    {show(point.value)}
                  </span>
                  <span class={bar} data-part="columns-fill" aria-hidden="true" />
                </span>
              </li>
            )}
          </For>
        </ol>
      ))}
    </figure>
  );
};
