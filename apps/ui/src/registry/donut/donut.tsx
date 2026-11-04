// A donut chart: parts of a whole. The markup is an ordered list — one item per slice, its name and its share as text — so
// with the stylesheet off it reads as a list of shares. The ring is the items' own `::before`: a full circle painted by a
// `conic-gradient()` only between the item's two angles, masked to a ring and clipped to its own wedge, and the legend row is
// the item itself, so hovering a slice and hovering its row are the same gesture.
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the list, `data-part` and the caller's class merged in. */
export type DonutPartProps = PartProps;

/** One slice: its name and its amount. The shares are the component's, not the caller's. */
export interface DonutSlice {
  readonly label: string;
  readonly value: number;
}

export interface DonutProps extends Renderable<DonutPartProps, void> {
  /** The slices, clockwise from twelve o'clock. */
  readonly slices: ReadonlyArray<DonutSlice>;
  /** The chart's name, which also names the list: "Traffic by region". */
  readonly label: string;
  /** A slice as a reader sees it; the second number is its share of the whole, in percent. */
  readonly format?: (value: number, share: number) => string;
  /** The ring's diameter, a CSS length; it shrinks with a narrow page. @default "11rem" */
  readonly size?: string;
  readonly class?: string;
}

// The theme's own colours, in the order the slices take them: the accent first, then the neutral ramp around it. A slice's
// colour is its index, so two charts of the same data paint the same slices. Colour is never the only channel: each row names
// its slice and its share. The fallbacks are the theme's light values: a page without the registered tint tokens (a bare
// stylesheet, a test page) still paints the ring.
const SLICE_COLORS: ReadonlyArray<string> = [
  "var(--color-highlight, #717171)",
  "var(--color-gray-700)",
  "var(--color-gray-1000)",
  "var(--color-gray-1300)",
  "var(--color-gray-500)",
  "var(--color-link, #4a4a4a)",
];

// The points of a wedge, a quarter of the arc apart: the centre and five steps on the circle. Placed with `sin()`/`cos()` on
// the item's own angles, so one rule draws every slice. The 71% radius reaches the corners of the box, so the polygon covers
// the arc at every step of 90° or less.
const arcPoint = (step: number): string =>
  `calc(50% + 71% * sin(var(--f) + var(--s) * ${step})) calc(50% - 71% * cos(var(--f) + var(--s) * ${step}))`;
const wedge = `polygon(50% 50%, ${[0, 1, 2, 3, 4].map(arcPoint).join(", ")})`;

// The list is the legend, and the ring is drawn in the room its inline start padding keeps. `--donut` is the ring's diameter,
// capped by the viewport so a narrow page scales the ring down instead of clipping the legend. A narrow page stacks instead:
// the ring above, the legend at full width below, so a long name keeps its words.
const list = css.cn(
  css.position("relative"),
  css.display("grid"),
  css.alignContent("center"),
  css.gap(t.space._1),
  css.minHeight("var(--donut)"),
  css.margin(0),
  css.padding(0),
  css.paddingInlineStart("calc(var(--donut) + 2rem)"),
  css.listStyle("square inside"),
  css.fontSize(t.font.size),
  css.color(t.color.text),
  css.overflowWrap("anywhere"),
  css.media("(max-width: 30rem)")(
    css.paddingInlineStart("0"),
    css.paddingBlockStart("calc(var(--donut) + 2rem)"),
  ),
);

// One slice: a marker in the slice's colour, its name, and its share pushed to the end of the row. The slice itself is the
// `::before` — positioned against the list, not the row — so the rows stay a legend and the ring stays one circle. The clip
// shapes the hit area too: without it the transparent rest of each circle would catch the pointer and the last one would win
// every hover.
const item = css.cn(
  css.markerElement(css.color("var(--c)")),
  css.cursor("default"),
  css.paddingBlock("2px"),
  css.hover(css.before(css.scale("1.05"))),
  css.before(
    css.content('""'),
    css.position("absolute"),
    css.left("0"),
    css.top("calc(50% - var(--donut) / 2)"),
    css.width("var(--donut)"),
    css.aspectRatio("1"),
    css.borderRadius("50%"),
    css.background(
      "conic-gradient(var(--c) calc(var(--f) + .6deg) calc(var(--t) - .6deg), transparent 0)",
    ),
    css.mask("radial-gradient(closest-side, transparent 58%, #000 calc(58% + 1px))"),
    css.clipPath(wedge),
    // stacked, the ring sits above the legend, centred in the list's own width
    css.media("(max-width: 30rem)")(
      css.top("0"),
      css.left("50%"),
      css.marginLeft("calc(var(--donut) / -2)"),
    ),
    css.media("(prefers-reduced-motion: no-preference)")(css.transition("scale 150ms")),
  ),
);

// The name takes the row's start; the share floats to its end, so a long name wraps under itself instead of under the number.
const name = css.cn(css.fontWeight("500"));
const share = css.cn(
  css.float("right"),
  css.paddingInlineStart(t.space._2),
  css.color(t.color.muted),
);

// The figure is the whole chart: the caption names it, and the list under it is the data.
const frame = css.cn(css.display("grid"), css.width("100%"), css.margin(0), css.gap(t.space._1));
const caption = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.muted));

const weight = (slice: DonutSlice): number =>
  Number.isFinite(slice.value) && slice.value > 0 ? slice.value : 0;

// what a row's `<data value>` says: the same number its text shows, as the article's own markup does
const shown = (shareOf: number): number => Math.round(shareOf * 10) / 10;
const percent = (shareOf: number): string => `${shown(shareOf)}%`;

/**
 * A donut chart: parts of a whole, as a ring beside the shares it is made of.
 *
 * The caller gives the amounts; the component adds them up and states each slice's start and end in percent, because CSS
 * cannot add up earlier siblings. The ring is decoration painted by the rows' pseudo-elements, and every value is text in its
 * row, so a reader without a pointer — or without the stylesheet — still gets the whole chart.
 */
export const Donut = (props: DonutProps): JSX.Element => {
  const total = (): number => props.slices.reduce((sum, slice) => sum + weight(slice), 0);
  const shareOf = (slice: DonutSlice): number => {
    const sum = total();
    return sum === 0 ? 0 : (weight(slice) / sum) * 100;
  };
  // The bands tile the circle: each starts where the one before it ended, and the last ends on 100. A chart of zeroes paints
  // nothing instead of a full ring.
  const bands = (): ReadonlyArray<{ from: number; to: number }> => {
    const sum = total();
    let reached = 0;
    return props.slices.map((slice, index) => {
      const from = sum === 0 ? 0 : (reached / sum) * 100;
      reached += weight(slice);
      const last = index === props.slices.length - 1;
      return { from, to: sum === 0 ? 0 : last ? 100 : (reached / sum) * 100 };
    });
  };
  const show = (slice: DonutSlice): string =>
    (props.format ?? ((_, shareOfSlice: number) => percent(shareOfSlice)))(
      weight(slice),
      shareOf(slice),
    );
  const size = (): string => props.size ?? "11rem";

  const own = {
    "data-part": "donut",
    get class() {
      return css.cn(list, props.class);
    },
    get style() {
      return {
        "--donut-size": size(),
        "--donut": "min(var(--donut-size), 45vw)",
      } as never;
    },
  } as unknown as PartProps;

  return (
    <figure data-part="donut-frame" class={frame}>
      <figcaption data-part="donut-caption" class={caption}>
        {props.label}
      </figcaption>
      {renderPart(props, own, undefined, (part) => (
        <ol {...part}>
          <For each={props.slices}>
            {(slice, index) => {
              const band = (): { from: number; to: number } =>
                bands()[index()] ?? { from: 0, to: 0 };
              return (
                <li
                  data-part="donut-slice"
                  class={item}
                  style={
                    {
                      "--from": band().from,
                      "--to": band().to,
                      // the angles the ring and its clip are drawn from, as the article computes them
                      "--f": "calc(var(--from) * 3.6deg)",
                      "--t": "calc(var(--to) * 3.6deg)",
                      "--s": "calc((var(--t) - var(--f)) / 4)",
                      "--c": SLICE_COLORS[index() % SLICE_COLORS.length],
                    } as never
                  }
                >
                  <span data-part="donut-label" class={name}>
                    {slice.label}
                  </span>{" "}
                  <data data-part="donut-share" class={share} value={String(shown(shareOf(slice)))}>
                    {show(slice)}
                  </data>
                </li>
              );
            }}
          </For>
        </ol>
      ))}
    </figure>
  );
};
