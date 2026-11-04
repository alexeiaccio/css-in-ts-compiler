// A stat tile: a headline number, how it moved against the previous value, and the samples behind it as a sparkline. The
// markup is an `<article>` — the heading names the metric, the value is a `<data>`, the change is a sentence — and the numbers
// the article's tile publishes are on the element: `--value`, `--previous`, `--better` and the percentage as `--pct`, a
// `calc()` of them. The sign is text in the markup and not a `@counter-style`: the browser takes the counter, but
// `@counter-style` is an at-rule with no selector and `global()` takes a selector, so the engine cannot write it — and a
// pseudo-element's content is not text a screen reader reads, so the sentence would be in the markup either way.
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { Sparkline } from "../sparkline/sparkline.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the article, `data-part` and the caller's class merged in. */
export type StatPartProps = PartProps;

export interface StatProps extends Renderable<StatPartProps, void> {
  /** The metric's name, which is the tile's heading: "Requests per second". */
  readonly label: string;
  /** The value now. */
  readonly value: number;
  /** The value it is compared with; left out, the tile has no change line. */
  readonly previous?: number;
  /** Which way is good news: `1` when higher is better, `-1` when lower is. @default 1 */
  readonly better?: 1 | -1;
  /** What the value is in, printed after it: "ms", "req/s". */
  readonly unit?: string;
  /** The recent samples, oldest first, drawn as the sparkline under the change. */
  readonly samples?: ReadonlyArray<number>;
  /** A number as a reader sees it; left out, the number itself. */
  readonly format?: (value: number) => string;
  readonly class?: string;
}

// The tile is a card: a surface one step off the page, a frame that hands its radius and padding down.
const tile = css.cn(
  frame().radius(t.radius.xl).padding(t.space._4).border("1px"),
  surface().color(t.color.surface),
  css.borderColor(t.color.border),
  css.color(t.color.text),
  css.display("flex"),
  css.flexDirection("column"),
  css.gap(t.space._2),
  css.minWidth("0"),
);

// The metric's name: secondary text, and it wraps rather than clips — a cut name is a lost metric.
const label = css.cn(
  css.margin(0),
  css.fontSize(t.font.sizeSm),
  css.fontWeight(500),
  css.color(t.color.muted),
  css.overflowWrap("anywhere"),
);

// The number is the tile's largest text and the one thing a reader looks for; tabular figures keep a live value from
// reflowing, and it wraps at 320px with 200% text instead of overflowing the card.
const value = css.cn(
  css.display("block"),
  css.fontSize("2rem"),
  css.fontWeight(600),
  css.lineHeight(1.1),
  css.fontVariantNumeric("tabular-nums"),
  css.overflowWrap("anywhere"),
);

const unit = css.cn(
  css.marginInlineStart(t.space._1),
  css.fontSize(t.font.size),
  css.fontWeight(400),
  css.color(t.color.muted),
);

// The chip: the good tone is the theme's accent and the bad one its invalid colour, both painted with `onHighlight`, white in
// either mode, so the chip reads the same on a dark surface as on the page. The tokens are named here, not written as
// `var(--color-…)` strings: a token is in the sheet only when a class uses it (a raw name is a build warning that says so),
// so a `color-mix()` over two strings would leave the mix with nothing to read.
const change = css.cn(
  css.alignSelf("flex-start"),
  css.display("inline-flex"),
  css.alignItems("center"),
  css.gap(t.space._1),
  css.margin(0),
  css.paddingBlock("2px"),
  css.paddingInline(t.space._2),
  css.borderRadius(t.radius.sm),
  css.fontSize(t.font.sizeSm),
  css.fontVariantNumeric("tabular-nums"),
  css.backgroundColor(t.color.highlight),
  css.color(t.color.onHighlight),
  css.attr("data-tone", "bad")(css.backgroundColor(t.color.invalid)),
  // a value that did not move has no tone: a chip of its own, so neither signal colour claims it
  css.attr("data-tone", "flat")(
    css.backgroundColor(t.color.buttonBackground),
    css.color(t.color.text),
  ),
);

// The arrow is decoration: the words after it say which way the value went and whether that is good news.
const arrow = css.cn(css.fontSize("0.625rem"));

// The sparkline runs edge to edge: its first item hangs back half a step, so its own `--n` buys the room back here, and the
// line stays inside the card instead of poking through its border.
const plot = css.cn(css.marginTop(t.space._1), css.paddingInline("calc(50% / var(--n))"));

/**
 * A stat tile: the metric's name, its value, the change against the previous value, and the samples behind it.
 *
 * The change is text — "Up 15% — worse" — and `data-tone` is the good, bad or flat chip that colours it, so the judgement is
 * in words, an arrow and a colour rather than a colour alone.
 */
export const Stat = (props: StatProps): JSX.Element => {
  const show = (number: number): string => (props.format ?? String)(number);

  // the change, rounded as CSS `round()` rounds it: one number for the words and the sign
  const percentage = (): number | undefined => {
    const previous = props.previous;
    // no previous value, or nothing to divide by: the comparison is the numbers themselves
    if (previous === undefined || previous === 0) return undefined;
    return Math.round((props.value / previous - 1) * 100);
  };

  const direction = (): "up" | "down" | "flat" => {
    const previous = props.previous ?? 0;
    const changed = percentage();
    if (changed !== undefined) return changed === 0 ? "flat" : changed > 0 ? "up" : "down";
    return props.value === previous ? "flat" : props.value > previous ? "up" : "down";
  };

  const improves = (): boolean =>
    (props.better ?? 1) === 1 ? direction() === "up" : direction() === "down";

  // the sentence a reader gets, and the only place the sign is printed: a counter would print it for the eye alone
  const words = (): string => {
    const changed = percentage();
    if (direction() === "flat") return "No change";
    const way = direction() === "up" ? "Up" : "Down";
    if (changed === undefined) return `${way} from 0`;
    return `${way} ${Math.abs(changed)}% — ${improves() ? "better" : "worse"}`;
  };

  const glyph = (): string => ({ up: "▲", down: "▼", flat: "±" })[direction()];

  const tone = (): "good" | "bad" | "flat" =>
    direction() === "flat" ? "flat" : improves() ? "good" : "bad";

  const own = {
    "data-part": "stat",
    get class() {
      return css.cn(tile, props.class);
    },
    get style() {
      return {
        // a tile with no previous value carries no change: nothing computes a percentage it has no other number for
        ...(props.previous === undefined
          ? {}
          : {
              // the article's numbers on the element, and its percentage computed in CSS: the chip and the words say the
              // change, and a host's own stylesheet can print `--pct` with a counter without redoing the arithmetic
              "--value": props.value,
              "--previous": props.previous,
              "--better": props.better ?? 1,
              "--pct": "calc(round((var(--value) / var(--previous) - 1) * 100))",
            }),
      } as never;
    },
  } as unknown as PartProps;

  return renderPart(props, own, undefined, (part) => (
    <article {...part}>
      <h3 data-part="stat-label" class={label}>
        {props.label}
      </h3>
      <data data-part="stat-value" class={value} value={String(props.value)}>
        {show(props.value)}
        {props.unit === undefined ? undefined : (
          <span data-part="stat-unit" class={unit}>
            {props.unit}
          </span>
        )}
      </data>
      {props.previous === undefined ? undefined : (
        <p data-part="stat-change" data-tone={tone()} class={change}>
          <span data-part="stat-arrow" aria-hidden="true" class={arrow}>
            {glyph()}
          </span>
          {words()}
        </p>
      )}
      {props.samples === undefined ? undefined : (
        <Sparkline
          label={`The last ${props.samples.length} samples`}
          values={props.samples}
          height="2.5rem"
          format={props.format}
          class={plot}
        />
      )}
    </article>
  ));
};
