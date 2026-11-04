// A sparkline: samples over time as one line, drawn by CSS. No SVG and no canvas: every item owns the segment back to the
// sample before it — a 2px bar as long as hypot(step, dy) and turned by atan2(dy, step) — so its thickness stays even
// however steep the line is. The markup is an ordered list of numbers; with the stylesheet off it still reads as one.
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the list, `data-part` and the caller's class merged in. */
export type SparklinePartProps = PartProps;

export interface SparklineProps extends Renderable<SparklinePartProps, void> {
  /** The samples, oldest first: each is a point, and the line joins it to the one before it. */
  readonly values: ReadonlyArray<number>;
  /** The list's name, which is also what a reader hears: "Requests per second, the last 20 samples". */
  readonly label: string;
  /** The bottom of the scale; left out, the smallest sample. */
  readonly min?: number;
  /** The top of the scale; left out, the largest sample. */
  readonly max?: number;
  /** The rail's height, a CSS length. @default "3rem" */
  readonly height?: string;
  /** `accent` draws in the highlight colour, `muted` in the second text colour. */
  readonly tone?: "accent" | "muted";
  /** A sample as a reader sees it on hover; left out, the number itself. */
  readonly format?: (value: number) => string;
  readonly class?: string;
}

// The list is the plot. Its items share the width evenly, and each is a size container so its children can measure it in
// `cqw`/`cqh`. The count is `--n` and not `sibling-count()`: the caller knows how many samples it has, and the CSS function
// is new enough that a target without it would lose the first item's half-step offset.
const list = css.cn(
  css.display("flex"),
  css.alignItems("stretch"),
  css.width("100%"),
  css.margin(0),
  css.padding(0),
  css.listStyle("none"),
  css.position("relative"),
);

// The item is one sample's column: the point sits on its middle, and its `::before` is the segment that arrives at it. The
// first column hangs back half a step, so the line starts at the rail's left edge; the count is `--n` and not
// `sibling-count()`, because the caller knows how many samples it has.
const sample = css.cn(
  // `group()` is the marker the value label reads with `within(hover)`; the marks themselves are pseudo-elements of this
  // item, so their state is the item's own (`hover(after(...))`).
  css.group(),
  css.flex("1"),
  css.minWidth("0"),
  css.position("relative"),
  css.containerType("size"),
  css.firstChild(css.marginLeft("calc(-50% / var(--n))")),
  // the segment back to the previous sample: from the previous point, 2px thick and as long as the distance between the two
  css.before(
    css.content('""'),
    css.position("absolute"),
    css.height("2px"),
    css.left("calc(-50cqw - 1px)"),
    css.bottom("calc(var(--y0) * 100% - 1px)"),
    css.width("calc(hypot(100cqw, (var(--y1) - var(--y0)) * 100cqh) + 3px)"),
    css.transformOrigin("1px 50%"),
    css.rotate("calc(atan2((var(--y0) - var(--y1)) * 100cqh, 100cqw))"),
    css.borderRadius("1px"),
    css.bg(t.color.highlight),
  ),
  // the dot on this sample: shown while the sample is hovered, and always on the last one (the line's head)
  css.after(
    css.content('""'),
    css.boxSizing("border-box"),
    css.position("absolute"),
    css.left("50%"),
    css.bottom("calc(var(--y1) * 100% - 3px)"),
    css.width("6px"),
    css.height("6px"),
    css.marginLeft("-3px"),
    css.borderRadius("999px"),
    css.border("2px solid", t.color.surface),
    css.bg(t.color.highlight),
    css.opacity(0),
  ),
  css.hover(css.after(css.opacity(1))),
  css.lastChild(css.after(css.opacity(1))),
);

// The quiet tone repaints both marks and changes nothing else.
const sampleMuted = css.cn(
  sample,
  css.before(css.bg(t.color.muted)),
  css.after(css.bg(t.color.muted)),
);

// The value above its point, while the sample is hovered: `pointer-events: none` keeps it from stealing the hover, and the
// room it needs is the item's own, so nothing moves.
const value = css.cn(
  css.position("absolute"),
  css.left("50%"),
  css.bottom("calc(var(--y1) * 100% + 6px)"),
  css.transform("translateX(-50%)"),
  css.padding("2px 6px"),
  css.borderRadius("4px"),
  css.whiteSpace("nowrap"),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.text),
  css.bg(t.color.surface),
  css.border("1px solid", t.color.border),
  css.opacity(0),
  css.pointerEvents("none"),
  css.within(css.hover)(css.opacity(1)),
);

const number = (sampleValue: number): string => String(sampleValue);

/**
 * A sparkline: the last samples of a series, one line, and the value under the pointer.
 *
 * The scale is the caller's (`min`/`max`) or the samples' own, so two sparklines that read against the same axis say so.
 * The normalised heights are computed in CSS from `--min` and `--max`: the markup carries the numbers a reader would want,
 * not percentages.
 */
export const Sparkline = (props: SparklineProps): JSX.Element => {
  const low = (): number => props.min ?? Math.min(...props.values);
  const high = (): number => {
    const top = props.max ?? Math.max(...props.values);
    // a flat line has no range to divide by: give it one, so every point sits on the middle of the rail
    return top === low() ? low() + 1 : top;
  };
  const samples = (): ReadonlyArray<number> => props.values;
  const mutedTone = (): boolean => props.tone === "muted";

  const own = {
    "data-part": "sparkline",
    get class() {
      return css.cn(list, props.class);
    },
    get style() {
      return {
        "--min": low(),
        "--max": high(),
        "--n": Math.max(1, samples().length),
        height: props.height ?? "3rem",
      } as never;
    },
    "aria-label": props.label,
  } as unknown as PartProps;

  return renderPart(props, own, undefined, (part) => (
    <ol {...part}>
      <For each={samples()}>
        {(sampleValue, index) => {
          const before = (): number => samples()[index() - 1] ?? sampleValue;
          return (
            <li
              data-part="sparkline-sample"
              class={mutedTone() ? sampleMuted : sample}
              style={
                {
                  "--a": before(),
                  "--b": sampleValue,
                  "--y0": "calc((var(--a) - var(--min)) / (var(--max) - var(--min)))",
                  "--y1": "calc((var(--b) - var(--min)) / (var(--max) - var(--min)))",
                } as never
              }
            >
              <data value={number(sampleValue)} class={value} data-part="sparkline-value">
                {(props.format ?? number)(sampleValue)}
              </data>
            </li>
          );
        }}
      </For>
    </ol>
  ));
};
