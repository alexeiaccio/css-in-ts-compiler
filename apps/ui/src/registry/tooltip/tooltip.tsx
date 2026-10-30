import { type TooltipGroup, createTooltipGroup } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, merge, omit, onCleanup, useContext } from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

export interface TooltipProps {
  /** No tooltip while `true`, and no `aria-describedby`. */
  readonly disabled?: boolean;
  readonly children?: JSX.Element;
}

export type TooltipTriggerPartProps = PartProps;

export interface TooltipTriggerProps extends Renderable<TooltipTriggerPartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export interface TooltipContentProps extends Renderable<PartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

const TooltipContext = createContext<{
  readonly group: TooltipGroup;
  /** Hide after the primitive's hide delay: the bubble sits below the trigger, and a pointer crossing the gap leaves it. */
  readonly hideLater: () => void;
  readonly cancelHide: () => void;
}>();

const anchorClass = css.cn(css.position("relative"), css.display("inline-flex"));

// An anchor, not a measured layer: the bubble is absolute in the box around the trigger, so it needs no rect, no
// scroll or resize listener, and no portal. The cost is the wrapper and an `overflow: hidden` ancestor clipping it.
// No `display` here on purpose: the primitive hides the bubble with the `hidden` attribute, and a display declaration
// in the class would override the UA's `[hidden] { display: none }`.
const contentClass = css.cn(
  css.position("absolute"),
  css.insetBlockStart("100%"),
  css.insetInlineStart("0"),
  css.marginBlockStart(t.space._1),
  css.zIndex("var(--z-popover)"),
  css.width("max-content"),
  css.maxWidth("min(20rem, 100%)"),
  css.padding(t.space._1, t.space._2),
  css.borderRadius(t.radius.sm),
  css.bg(t.color.text),
  css.color(t.color.page),
  css.fontSize(t.font.sizeSm),
  css.boxShadow(t.shadow.popover),
);

/**
 * APG tooltip, styled: `Tooltip.Trigger` is the element the pointer or the focus lands on, `Tooltip.Content` is the text
 * bubble it describes. `createTooltipGroup` owns the visible state and wires `aria-describedby` to the bubble's id; the
 * kit adds the anchor the bubble floats from, the bubble's look, and the hide delay that keeps it hoverable (WCAG
 * 1.4.13): the primitive's own pointer handler hides at once, which a pointer crossing the few pixels between the
 * trigger and the bubble would never survive.
 *
 * The bubble is always in the DOM and `hidden` while the tooltip is off, because `aria-describedby` names it.
 */
export const Tooltip = (props: TooltipProps): JSX.Element => {
  const group = createTooltipGroup({
    triggers: [{}],
    get disabled() {
      return props.disabled;
    },
    // both immediate: the show delay is not wired, the primitive exposes it (`showDelayMs`) for a denser page
    openOnFocus: true,
    openOnHover: true,
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancelHide = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
  };
  const hideLater = (): void => {
    cancelHide();
    timer = setTimeout(() => {
      timer = undefined;
      group.hideTimer();
    }, group.hideDelayMs());
  };
  onCleanup(cancelHide);
  return (
    <TooltipContext value={{ group, hideLater, cancelHide }}>
      <div data-part="tooltip-anchor" class={anchorClass}>
        {props.children}
      </div>
    </TooltipContext>
  );
};

/** The described element: a `Button` unless `render` says otherwise. It carries the `aria-describedby`. */
export const TooltipTrigger = (props: TooltipTriggerProps): JSX.Element => {
  const { group, hideLater, cancelHide } = useContext(TooltipContext);
  const rest = omit(props, "render", "class", "children");
  // no `data-part` of its own: the part renders a `Button`, which owns the attribute, as `Dialog.Trigger` does
  const merged = merge(rest, group.triggerProps(0), () => ({
    get class() {
      return css.cn(props.class);
    },
    // focus never waits: the tooltip went with the focus, so it goes with it
    onBlur: () => {
      cancelHide();
      group.blur();
      group.hideTimer();
    },
    onPointerLeave: () => {
      group.pointerLeave();
      hideLater();
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <Button {...part}>{props.children}</Button>
  ));
};

/** The text bubble: `role="tooltip"`, hidden while the trigger is not described by it. */
export const TooltipContent = (props: TooltipContentProps): JSX.Element => {
  const { group, hideLater, cancelHide } = useContext(TooltipContext);
  const merged = merge(group.tooltipProps(0), () => ({
    "data-part": "tooltip",
    get class() {
      return css.cn(contentClass, props.class);
    },
    // hovering the bubble keeps it open (the primitive's own handler would hide it as the pointer arrives)
    onPointerEnter: () => {
      cancelHide();
      group.pointerEnterTip();
    },
    onPointerLeave: () => {
      group.pointerLeave();
      hideLater();
    },
  }));
  return renderPart(props, merged, undefined, (part) => <span {...part}>{props.children}</span>);
};
