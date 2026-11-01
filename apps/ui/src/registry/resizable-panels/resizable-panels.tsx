import {
  createResizablePanels,
  type PanelsOrientation,
  type ResizablePaneOptions,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { For, merge, Show } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

/** One pane: the primitive's bounds plus what the skin puts inside it. */
export interface ResizablePane extends ResizablePaneOptions {
  /** The visible heading at the top of the pane; left out, the pane has no heading. */
  readonly title?: string | undefined;
  readonly children?: JSX.Element | undefined;
}

export interface ResizablePanelsProps {
  /** The panes, in order. Sizes are percentages of the group and always sum to 100. */
  readonly panes: ReadonlyArray<ResizablePane>;
  /** `vertical` puts the panes side by side; `horizontal` stacks them. @default "vertical" */
  readonly orientation?: PanelsOrientation | undefined;
  /** Controlled: the host owns the layout, and a new array is a new layout. */
  readonly sizes?: ReadonlyArray<number> | undefined;
  /** The uncontrolled start; ignored while `sizes` is set. */
  readonly defaultSizes?: ReadonlyArray<number> | undefined;
  /** Keyboard step, in percent. @default 10 */
  readonly step?: number | undefined;
  /** The group's accessible name. */
  readonly label?: string | undefined;
  /** Persist the layout in localStorage under this key (the host's namespace). */
  readonly storageKey?: string | undefined;
  /** A request to change the layout the host may ignore. */
  readonly onSizesChange?: ((sizes: ReadonlyArray<number>) => void) | undefined;
  /** The group's height in CSS, since a percentage layout needs one. @default "18rem" */
  readonly height?: string | undefined;
  readonly class?: string | undefined;
}

const DEFAULT_HEIGHT = "18rem";

// The frame: the group is a grid, the panes are surfaces on the page, and the bars are the tracks between them.
const groupClass = css.cn(
  css.display("grid"),
  css.width("100%"),
  css.boxSizing("border-box"),
  css.overflow("hidden"),
  css.padding(t.space._2),
  css.gap(t.space._1),
  css.bg(t.color.page),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.xl),
  css.color(t.color.text),
  css.fontSize(t.font.size),
);

// The sizes are the primitive's percentages as grid fractions; a separator is an auto track of its own width. A layout
// change eases in only for a reader who allows motion, and never while the pointer is dragging the bar.
const groupMotion = css.cn(
  css.media("(prefers-reduced-motion: no-preference)")(
    css.transition("grid-template-columns 160ms ease-out, grid-template-rows 160ms ease-out"),
  ),
  css.attr("data-resizing", "true")(css.transition("none")),
);

const paneClass = css.cn(
  css.boxSizing("border-box"),
  css.minWidth("0"),
  css.minHeight("0"),
  css.overflow("auto"),
  css.padding(t.space._3),
  css.bg(t.color.surface),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.lg),
  css.color(t.color.text),
);

const paneTitleClass = css.cn(
  css.margin("0"),
  css.marginBlockEnd(t.space._2),
  css.fontSize(t.font.sizeSm),
  css.fontWeight("600"),
  css.letterSpacing("0.04em"),
  css.textTransform("uppercase"),
  css.color(t.color.muted),
);

// The bar is the focusable separator itself, not a button wrapped around one: its whole 12 px width is the target, and the
// grip inside it is the visible handle.
const separatorClass = css.cn(
  css.position("relative"),
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.boxSizing("border-box"),
  css.margin("0"),
  css.padding("0"),
  css.border("none"),
  css.borderRadius("999px"),
  css.bg("transparent"),
  css.outline("none"),
  css.touchAction("none"),
  css.userSelect("none"),
  css.group("resizable-separator"),
  css.hover(css.bg(t.color.buttonBackground)),
  css.focusVisible(
    css.bg(t.color.buttonBackground),
    css.outline("2px solid", t.color.focusRing),
    css.outlineOffset("-2px"),
  ),
  css.attr("data-resizing", "true")(css.bg(t.color.buttonBackgroundPressed)),
);

const separatorVerticalClass = css.cn(
  css.width(t.space._3),
  css.height("100%"),
  css.cursor("col-resize"),
);

const separatorHorizontalClass = css.cn(
  css.width("100%"),
  css.height(t.space._3),
  css.cursor("row-resize"),
);

// The handle is a short line in the bar's middle; it is visible on hover, on keyboard focus and for the whole drag.
const gripClass = css.cn(
  css.display("block"),
  css.pointerEvents("none"),
  css.borderRadius("999px"),
  css.bg(t.color.borderHover),
  css.opacity("0"),
  css.within(css.hover, "resizable-separator")(css.opacity("1")),
  css.within(css.focusVisible, "resizable-separator")(css.opacity("1")),
  css.within(css.attr("data-resizing", "true"), "resizable-separator")(css.opacity("1")),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.transition("opacity 120ms ease-out, background-color 120ms ease-out"),
  ),
);

const gripVerticalClass = css.cn(gripClass, css.width("2px"), css.height(t.space._5));
const gripHorizontalClass = css.cn(gripClass, css.height("2px"), css.width(t.space._5));

/** The primitive's percentages as a grid template; `auto` is the separator between each pair. */
const template = (sizes: ReadonlyArray<number>): string =>
  sizes.map((size, index) => (index < sizes.length - 1 ? `${size}fr auto` : `${size}fr`)).join(" ");

/**
 * A layout of panes with a resizable bar between each pair, styled: `createResizablePanels` owns the whole model — the
 * sizes in percent (always summing to 100), each pane's bounds, the focusable `role=separator` with its `aria-*`, the
 * arrows / Home / End / Enter keys, the pointer drag, collapse and restore, and `storageKey` persistence. The skin owns
 * the grid and the surfaces, paints the primitive's sizes as track fractions, and draws the grab handle, the focus ring
 * and the reduced-motion rules.
 *
 * The separator is the widget a keyboard reader reaches with Tab; it names the pane on its left (`aria-controls`) and
 * resizes that pane and its neighbour. A `collapsible` pane collapses to `collapsedSize` on Enter through the separator
 * before it and returns to the size it left.
 */
export const ResizablePanels = (props: ResizablePanelsProps): JSX.Element => {
  // The pane list carries the host's JSX. It is read once, here: reading it later (inside the primitive's own computation,
  // which asks for its options lazily) would create those components in an effect phase with no owner, and Solid 2's dev
  // build refuses that — `PRIMITIVE_IN_EFFECT_CALLBACK`, a throw in a real `vite dev` app that a production build hides.
  const panes = props.panes;
  const panels = createResizablePanels({
    // the primitive reads the options lazily; the skin's `title` and content are not part of them
    get panes() {
      return panes.map(({ title: _title, children: _children, ...pane }) => pane);
    },
    get orientation() {
      return props.orientation;
    },
    get sizes() {
      return props.sizes;
    },
    get defaultSizes() {
      return props.defaultSizes;
    },
    get step() {
      return props.step;
    },
    get label() {
      return props.label;
    },
    get storageKey() {
      return props.storageKey;
    },
    get onSizesChange() {
      return props.onSizesChange;
    },
  });

  const vertical = (): boolean => (props.orientation ?? "vertical") === "vertical";

  const layout = (): JSX.CSSProperties =>
    vertical()
      ? { "grid-template-columns": template(panels.sizes()) }
      : { "grid-template-rows": template(panels.sizes()) };

  const separator = (index: number) =>
    merge(panels.separatorProps(index), {
      "data-part": "resizable-panels-separator",
      get "data-orientation"() {
        return vertical() ? "vertical" : "horizontal";
      },
      get "data-resizing"() {
        return panels.resizing() === index ? "true" : "false";
      },
      get class() {
        return css.cn(
          separatorClass,
          vertical() ? separatorVerticalClass : separatorHorizontalClass,
        );
      },
    });

  return (
    <div
      {...panels.groupProps}
      data-part="resizable-panels"
      data-orientation={vertical() ? "vertical" : "horizontal"}
      data-resizing={panels.resizing() === null ? "false" : "true"}
      class={css.cn(groupClass, groupMotion, props.class)}
      style={{ ...layout(), height: props.height ?? DEFAULT_HEIGHT }}
    >
      <For each={panes}>
        {(pane, index) => (
          <>
            <div {...panels.paneProps(index())} data-part="resizable-panels-pane" class={paneClass}>
              <Show when={pane.title !== undefined}>
                <h3 class={paneTitleClass}>{pane.title}</h3>
              </Show>
              {pane.children}
            </div>
            <Show when={index() < panes.length - 1}>
              <div {...separator(index())}>
                <span
                  aria-hidden="true"
                  data-part="resizable-panels-grip"
                  class={vertical() ? gripVerticalClass : gripHorizontalClass}
                />
              </div>
            </Show>
          </>
        )}
      </For>
    </div>
  );
};
