// A bar list whose scale is its own largest value, and no JavaScript computes it: the values are laid out as marks in one
// `auto` grid column, so the browser's own maximum sizes the column; a query container in that column reads its width back as
// a number (`round(100cqw / 1px)` into a registered `@property`) and every bar divides by it. A counter prints the number,
// because `content` cannot interpolate a custom property. Where container units are missing there are no bars — the numbers
// are the text of the list either way, so the table is still read.
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For } from "solid-js";

import "./scale.css";
import { t } from "../theme.ts" with { type: "cssints" };

/** One value: what it is called and its number, which is also the bar's length. */
export interface ScaleItem {
  readonly label: string;
  readonly value: number;
}

export interface ScaleProps {
  /** The values, in reading order; the largest one sets the scale. */
  readonly items: ReadonlyArray<ScaleItem>;
  /** The figure's caption, which is also the chart's name. */
  readonly label: string;
  readonly class?: string | undefined;
}

const rootClass = css.cn(css.display("grid"), css.gap(t.space._2), css.width("100%"));

const captionClass = css.cn(css.fontSize(t.font.sizeSm), css.color(t.color.muted));

// The computation's furniture: one `auto` column, its width the largest mark. `inline-grid` keeps the calculation as narrow as
// its answer instead of stretching across the page, and the marks are zero-high blocks whose width is the value in px.
const rulerClass = css.cn(
  css.display("inline-grid"),
  css.gridTemplateColumns("auto"),
  css.justifyItems("stretch"),
  css.width("max-content"),
);

const markClass = css.cn(css.blockSize("0"), css.margin("0"));

// The query container: a grid item stretched to the column, and `container-type` means its own content never widens it, so it
// measures the marks and not the chart inside it.
const probeClass = css.cn(css.containerType("inline-size"), css.minInlineSize("0"));

// Where the number is read and printed. `--scale` is set from a plain inline style (a dynamic value is inline, as everywhere),
// and it inherits from here down into the bars.
const gaugeClass = css.cn(css.display("grid"), css.gap(t.space._1));

const listClass = css.cn(
  css.display("grid"),
  css.gap(t.space._1),
  css.margin("0"),
  css.padding("0"),
  css.listStyle("none"),
);

const rowClass = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("7rem 1fr auto"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.fontSize(t.font.sizeSm),
);

const nameClass = css.cn(css.color(t.color.muted), css.overflowWrap("anywhere"));

const trackClass = css.cn(
  css.display("block"),
  css.blockSize(t.space._2),
  css.borderRadius("999px"),
  css.bg(t.color.buttonBackground),
  css.overflow("hidden"),
  // without container units there is no scale to divide by: a bar of no length would be a guess, so there is no bar
  css.supports("not (width: 1cqw)")(css.display("none")),
);

// The one place the number is used: the value's share of the largest one, which is the whole chart's arithmetic.
const barClass = css.cn(
  css.display("block"),
  css.blockSize("100%"),
  css.bg(t.color.highlight),
  css.inlineSize("calc(var(--value) / var(--scale) * 100%)"),
);

const numberClass = css.cn(css.fontVariantNumeric("tabular-nums"), css.textAlign("end"));

const readoutClass = css.cn(
  css.display("flex"),
  css.alignItems("baseline"),
  css.gap(t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  // the printed number comes from the counter below; without a scale it would print 0
  css.supports("not (width: 1cqw)")(css.display("none")),
);

// A counter is how a number is printed: `content` takes a counter, not a custom property, so the value is reset into one.
const printClass = css.cn(
  css.counterReset("result var(--scale)"),
  css.before(css.content("counter(result)")),
  css.color(t.color.text),
  css.fontVariantNumeric("tabular-nums"),
);

/**
 * A bar list scaled by its own largest value, computed by layout rather than by a script.
 *
 * The marks are the values as widths (`value` px), laid out in one `auto` grid column: the grid algorithm finds the widest to
 * place them, and the query container beside them reads that width back as a number — `round(100cqw / 1px)` into the
 * registered `--scale` — which every bar divides its own `--value` by. Nothing is compared in a formula and nothing is
 * measured by hand; adding a value adds work for the browser, not a term.
 *
 * Two things are raw: `scale.css` registers the property (a global, per-name thing, where cssints's unit is a class), and the
 * read is an inline style (a value computed by the browser, not by the build).
 */
export const Scale = (props: ScaleProps): JSX.Element => (
  <figure data-part="scale" class={css.cn(rootClass, props.class)}>
    <figcaption class={captionClass}>{props.label}</figcaption>
    <div data-part="scale-ruler" class={rulerClass}>
      <For each={props.items}>
        {(item) => (
          <span
            data-part="scale-mark"
            class={markClass}
            style={{ "inline-size": `${item.value}px` }}
            aria-hidden="true"
          />
        )}
      </For>
      <div data-part="scale-probe" class={probeClass}>
        <div
          data-part="scale-gauge"
          class={gaugeClass}
          style={{ "--scale": "round(100cqw / 1px)" }}
        >
          <ol data-part="scale-list" class={listClass}>
            <For each={props.items}>
              {(item) => (
                <li data-part="scale-row" class={rowClass} style={{ "--value": `${item.value}` }}>
                  <span class={nameClass}>{item.label}</span>
                  <span data-part="scale-track" class={trackClass} aria-hidden="true">
                    <span data-part="scale-bar" class={barClass} />
                  </span>
                  <span class={numberClass}>{item.value}</span>
                </li>
              )}
            </For>
          </ol>
          <p class={readoutClass}>
            <span>Scale</span>
            <output data-part="scale-print" class={printClass} />
          </p>
        </div>
      </div>
    </div>
  </figure>
);
