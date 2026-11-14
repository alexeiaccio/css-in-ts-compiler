// A reading-progress bar over a scrolling pane, in two halves on one element: the native scroll timeline (`progress()`
// from @cssints/reveal) scrubs the fill where the browser has scroll-driven animations, and `createScrollProgress`
// (@cssints/headless) keeps the `progressbar` value right and drives the same fill as an inline scale where it has not.
// A running animation beats an inline style in the cascade, so the bar is never drawn twice, and the ARIA value is
// always the JS one — a bar that a screen reader hears is worth the one listener.
import { createScrollProgress } from "@cssints/headless";
import { progress } from "@cssints/reveal" with { type: "cssints" };
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For, onSettled } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

/** One section of the article: a heading and a paragraph. */
export interface ProgressSection {
  readonly title: string;
  readonly text: string;
}

export interface ProgressProps {
  /** The article, in order: the pane scrolls and the bar fills as it does. */
  readonly sections: ReadonlyArray<ProgressSection>;
  /**
   * The bar's accessible name. @default "Reading progress"
   */
  readonly label?: string | undefined;
  readonly class?: string | undefined;
}

const rootClass = css.cn(css.display("grid"), css.gap(t.space._3));

// The pane is the scroll container the bar reads (`scroll(nearest)` and the primitive's `root` are the same element), and
// it takes the focus so it can be scrolled from the keyboard.
const paneClass = css.cn(
  css.position("relative"),
  css.maxBlockSize("22rem"),
  css.overflowY("auto"),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.md),
  css.outlineOffset("2px"),
);

const railClass = css.cn(
  css.position("sticky"),
  css.insetBlockStart("0"),
  css.zIndex("1"),
  css.blockSize("3px"),
  css.background(t.color.border),
);

// The fill: size and colour are the host's, the animation and the origin are progress()'s. Where the timeline is
// missing the animation is inert and the inline scale shows; where it runs, the animation wins.
const barClass = css.cn(
  progress().timeline("scroll(nearest)"),
  css.blockSize("100%"),
  css.inlineSize("100%"),
  css.background(t.color.highlight),
);

const articleClass = css.cn(css.padding(t.space._4), css.display("grid"), css.gap(t.space._4));

const sectionClass = css.cn(css.display("grid"), css.gap(t.space._1));

const titleClass = css.cn(css.margin("0"), css.fontSize(t.font.size), css.fontWeight("600"));

const textClass = css.cn(css.margin("0"), css.color(t.color.muted), css.lineHeight("1.6"));

export const Progress = (props: ProgressProps): JSX.Element => {
  let pane: HTMLDivElement | undefined;
  const reading = createScrollProgress({ root: () => pane });
  onSettled(() => reading.attach());
  return (
    <div data-part="progress" class={css.cn(rootClass, props.class)}>
      <div data-part="progress-pane" class={paneClass} ref={pane} tabindex={0}>
        <div data-part="progress-rail" class={railClass}>
          <div
            data-part="progress-bar"
            class={barClass}
            {...reading.barProps}
            aria-label={props.label ?? "Reading progress"}
            style={`scale: ${reading.progress()} 1`}
          />
        </div>
        <div class={articleClass}>
          <For each={props.sections}>
            {(section) => (
              <section class={sectionClass}>
                <h3 class={titleClass}>{section.title}</h3>
                <p class={textClass}>{section.text}</p>
              </section>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
