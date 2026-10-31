import {
  createTimeline,
  type TimelineRows,
  type TimelineSpan,
  type TimelineTick,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createEffect, createSignal, For, untrack } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

export type { TimelineSpan };

export interface TimelineProps {
  /**
   * The spans, in display order: a root first, then its children and grandchildren. Read once, when the component is
   * created, so a trace that arrives later is the page's new `<Timeline>`.
   */
  readonly spans: ReadonlyArray<TimelineSpan>;
  /** The unit of `start` and `end`, which the ruler labels its ticks with. @default "ms" */
  readonly unit?: "ms" | "us" | "s" | undefined;
  /** The selected span's id (controlled). Omit it and the primitive keeps the selection. */
  readonly selected?: string | undefined;
  /** A selection request the host may ignore. */
  readonly onSelect?: ((id: string) => void) | undefined;
  /** The name the list announces. @default "Span timeline" */
  readonly label?: string | undefined;
  /** The primitive, once: a page that moves the selection itself. */
  readonly onReady?: ((timeline: TimelineRows) => void) | undefined;
  /** The line under the trace; left out, the keys in one sentence. */
  readonly hint?: string | undefined;
  readonly class?: string | undefined;
}

const DEFAULT_LABEL = "Span timeline";
const DEFAULT_HINT =
  "Keys: ↑ and ↓ move between spans, Home and End jump to the ends, and Enter or Space selects one.";

/** The three columns: the name, the bars' track and the duration, shared by the ruler and every row. */
const COLUMNS = "12rem minmax(0, 1fr) 4.5rem";

const rootClass = css.cn(css.display("grid"), css.gap(t.space._2));

// The frame is the surface: the radius and the border are the kit's, and the dark mode moves the tokens underneath.
const frameClass = css.cn(
  css.overflow("hidden"),
  css.boxSizing("border-box"),
  css.color(t.color.text),
  css.bg(t.color.surface),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.xl),
  css.fontSize(t.font.size),
);

const rulerRowClass = css.cn(
  css.display("grid"),
  css.gridTemplateColumns(COLUMNS),
  css.alignItems("end"),
  css.gap(t.space._3),
  css.minHeight(t.space._8),
  css.padding(t.space._1, t.space._3),
  css.boxSizing("border-box"),
  css.bg(t.color.page),
  css.borderBottom("1px solid", t.color.border),
);

const captionClass = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.muted));

// The ticks are the primitive's `rulerProps.ticks`: a line per tick, and its label on the line.
const rulerTrackClass = css.cn(
  css.position("relative"),
  css.alignSelf("stretch"),
  css.minHeight("1.5rem"),
);

const tickClass = css.cn(
  css.position("absolute"),
  css.top("0"),
  css.bottom("0"),
  css.borderInlineStart("1px solid", t.color.border),
  css.pointerEvents("none"),
);

const tickLabelClass = css.cn(
  css.position("absolute"),
  css.top("0"),
  css.padding("0", "2px"),
  css.bg(t.color.page),
  css.color(t.color.muted),
  css.fontSize("0.6875rem"),
  css.lineHeight("1.4"),
  css.whiteSpace("nowrap"),
);

const listClass = css.cn(
  css.display("grid"),
  css.margin("0"),
  css.padding("0"),
  css.listStyle("none"),
  css.lastChild(css.borderBottom("none")),
);

// Every row is one span: the name column, the track the bar is placed on, and the span's duration. The hierarchy is
// `aria-level` on the listitem and the `--depth` the primitive puts on the label, so a narrow page keeps the name whole.
const rowClass = css.cn(
  css.display("grid"),
  css.gridTemplateColumns(COLUMNS),
  css.alignItems("center"),
  css.gap(t.space._3),
  css.minHeight(t.space._9),
  css.padding(t.space._1, t.space._3),
  css.boxSizing("border-box"),
  css.borderBottom("1px solid", t.color.border),
  css.outline("none"),
  css.cursor("pointer"),
  css.group("timeline-row"),
  css.hover(css.bg(t.color.buttonBackground)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
  css.attr("aria-current", "true")(
    css.bg(t.color.buttonBackgroundPressed),
    css.hover(css.bg(t.color.buttonBackgroundPressed)),
  ),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.transition("background-color 120ms ease-out"),
  ),
);

const labelClass = css.cn(
  css.minWidth("0"),
  css.overflow("hidden"),
  css.whiteSpace("nowrap"),
  css.textOverflow("ellipsis"),
  css.paddingInlineStart("calc(var(--depth) * 0.75rem)"),
);

const trackClass = css.cn(
  css.position("relative"),
  css.height(t.space._2),
  css.minWidth("0"),
  css.borderRadius("999px"),
  css.bg(t.color.buttonBackground),
);

// The bar's geometry is the primitive's `left` / `width` percentages; the tone is the status it carries. `unset` stays
// the muted gray, `ok` takes the accent and `error` the invalid colour, so a failed span reads at a glance.
const barClass = css.cn(
  css.position("absolute"),
  css.top("0"),
  css.height("100%"),
  css.borderRadius("999px"),
  css.bg(t.color.muted),
  css.within(css.attr("data-status", "ok"), "timeline-row")(css.bg(t.color.highlight)),
  css.within(css.attr("data-status", "error"), "timeline-row")(css.bg(t.color.invalid)),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.transition("background-color 120ms ease-out"),
  ),
);

const durationClass = css.cn(
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.fontVariantNumeric("tabular-nums"),
  css.textAlign("end"),
  css.whiteSpace("nowrap"),
);

const statusClass = css.cn(
  css.margin("0"),
  css.padding("0", t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.text),
);

const hintClass = css.cn(
  css.margin("0"),
  css.padding("0", t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);

/** A tick's label sits on its line: left-aligned at the start, centred in the middle and ending at the last tick. */
const tickShift = (index: number, count: number): string =>
  index === 0 ? "translateX(0)" : index === count - 1 ? "translateX(-100%)" : "translateX(-50%)";

/**
 * A trace waterfall, styled: `createTimeline({ rows })` owns the extent (so every bar is a percentage of the whole
 * trace), each row's `aria-level` and `aria-current`, the `data-status` hook, the roving tab stop and the keys that move
 * it, the selection request, the `--depth` of the label and the ruler's ticks and labels.
 *
 * The skin owns the frame (surface, border, radius and the theme's tokens in light and dark), the name column and its
 * indent, the track and the bar's tone per status, the ruler's lines and labels, the duration column derived from
 * `start` / `end`, the selected and hover looks, the focus ring, and the polite status line that reads the selected span.
 * It also moves the real DOM focus to the row the primitive made its tab stop, as the primitive leaves that to the host.
 *
 * The rows mode has no zoom (the demo tree does); a trace that ships zoom is a page's own window over the same rows.
 */
export const Timeline = (props: TimelineProps): JSX.Element => {
  const timeline = createTimeline({
    rows: props.spans,
    get axis() {
      return props.unit === undefined ? undefined : { unit: props.unit };
    },
    get selected() {
      return props.selected;
    },
    get onSelect() {
      return props.onSelect;
    },
  });
  untrack(() => props.onReady)?.(timeline);

  let list: HTMLUListElement | undefined;
  // The primitive changes the tab stop; the skin moves the real focus, but only once the reader is in the list, so
  // mounting the trace does not take the page's focus.
  const [engaged, setEngaged] = createSignal(false);

  createEffect(
    () => ({ id: timeline.focusedId(), engaged: engaged() }),
    (state) => {
      if (state.id === undefined || !state.engaged || list === undefined) {
        return;
      }
      const row = list.querySelector<HTMLElement>(`[data-id="${CSS.escape(state.id)}"]`);
      if (row !== null && row !== document.activeElement) {
        row.focus();
      }
    },
  );

  const unit = (): string => props.unit ?? "ms";
  const total = (): number => {
    const extent = timeline.extent();
    return extent.end - extent.start;
  };
  // One formatter for a duration and for a tick's axis, rounded to the thousandth the geometry uses.
  const format = (value: number): string => `${Math.round(value * 1000) / 1000} ${unit()}`;

  const selectedSpan = (): TimelineSpan | undefined => {
    const id = timeline.selectedId();
    return id === undefined ? undefined : props.spans.find((span) => span.id === id);
  };

  // The announced value is the selected span, not the cursor: the cursor is the tab stop (and what a screen reader
  // reads as the focused listitem), while Enter, Space or a click is the selection this line repeats.
  const status = (): string => {
    const span = selectedSpan();
    if (span === undefined) {
      return "No span selected.";
    }
    return `${span.label} — ${format(span.end - span.start)} of ${format(total())}.`;
  };

  const ticks = (): ReadonlyArray<TimelineTick> => timeline.rulerProps.ticks;

  return (
    <div data-part="timeline-root" class={css.cn(rootClass, props.class)}>
      <div data-part="timeline-frame" class={frameClass}>
        <div data-part="timeline-ruler-row" aria-hidden="true" class={rulerRowClass}>
          <span class={captionClass}>Span</span>
          <div {...timeline.rulerProps} data-part="timeline-ruler" class={rulerTrackClass}>
            <For each={ticks()}>
              {(tick, index) => (
                <span data-part="timeline-tick" class={tickClass} style={{ left: `${tick.left}%` }}>
                  <span
                    class={tickLabelClass}
                    style={{ transform: tickShift(index(), ticks().length) }}
                  >
                    {tick.label}
                  </span>
                </span>
              )}
            </For>
          </div>
          <span class={css.cn(captionClass, durationClass)}>Duration</span>
        </div>
        <ul
          {...timeline.listProps}
          data-part="timeline-list"
          aria-label={props.label ?? DEFAULT_LABEL}
          class={listClass}
          ref={(node: HTMLUListElement) => {
            list = node;
          }}
          onPointerDown={() => setEngaged(true)}
          onFocusIn={() => setEngaged(true)}
        >
          <For each={props.spans}>
            {(span) => (
              <li
                {...timeline.rowProps(span.id)}
                data-part="timeline-row"
                data-id={span.id}
                class={rowClass}
              >
                <span
                  {...timeline.labelProps(span.id)}
                  data-part="timeline-label"
                  class={labelClass}
                >
                  {span.label}
                </span>
                <span class={trackClass}>
                  <span
                    {...timeline.barProps(span.id)}
                    data-part="timeline-bar"
                    class={barClass}
                    style={timeline.barProps(span.id).style}
                  />
                </span>
                <span data-part="timeline-duration" class={durationClass}>
                  {format(span.end - span.start)}
                </span>
              </li>
            )}
          </For>
        </ul>
      </div>
      <p data-part="timeline-status" role="status" aria-live="polite" class={statusClass}>
        {status()}
      </p>
      <p data-part="timeline-hint" class={hintClass}>
        {props.hint ?? DEFAULT_HINT}
      </p>
    </div>
  );
};
