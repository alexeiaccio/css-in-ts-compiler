import {
  type Popover as PopoverController,
  type PopoverPlacement,
  createPopover,
} from "@cssints/headless";
import { Portal } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, merge, omit, onCleanup, useContext } from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

export interface PopoverProps {
  /** The accessible name of the content: the primitive announces a `role="dialog"` and a dialog needs one. */
  readonly label: string;
  /** Where the panel opens; the primitive flips it to the other side when the viewport has no room. */
  readonly placement?: PopoverPlacement;
  /** The gap to the trigger, in px. */
  readonly offset?: number;
  /** Controlled: the host owns the open state and this is the only thing that opens or closes it. */
  readonly open?: boolean;
  /** Open at mount; ignored while `open` is set. */
  readonly defaultOpen?: boolean;
  /** A request to change the open state: uncontrolled it is accepted, controlled the host may ignore it. */
  readonly onOpenChange?: (open: boolean) => void;
  readonly id?: string;
  readonly children?: JSX.Element;
}

export type PopoverTriggerPartProps = PartProps;

export interface PopoverTriggerProps extends Renderable<PopoverTriggerPartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

export type PopoverContentPartProps = PartProps;

export interface PopoverContentProps extends Renderable<PopoverContentPartProps, void> {
  readonly class?: string;
  readonly children?: JSX.Element;
}

const PopoverContext = createContext<{
  readonly popover: PopoverController;
  readonly label: () => string;
  /** The two refs the primitive's `attach` needs: it wires them once both exist. */
  readonly connect: (part: "trigger" | "content", element: HTMLElement) => void;
}>();

// The panel is portalled to `document.body`, unlike the menu's, the select's and the tooltip's: the primitive writes
// page-space `top` / `left` (`attach` measures against the viewport and adds the scroll) for a `position: absolute` panel,
// and that is only true in the initial containing block. A `position: relative` anchor around the trigger would make the
// panel absolute in that box and put it at the page's top-left. The portal also keeps the panel out of an ancestor's
// `overflow: hidden` or `transform`, which is the other half of the same problem. The cost: the panel is a client-only
// island (no server paint) and it is not where the trigger is in the DOM, so the primitive measures the trigger once per
// open and again on resize, scroll and a `ResizeObserver`.
//
// No `display` here on purpose: the primitive hides the panel with the `hidden` attribute, and a display declaration in this
// class would override the UA's `[hidden] { display: none }`. The position comes from the primitive's `contentStyle()`.
const contentClass = css.cn(
  css.zIndex("var(--z-popover)"),
  css.minWidth("max-content"),
  css.maxWidth("min(24rem, calc(100vw - 2rem))"),
  css.padding(t.space._3),
  css.bg(t.color.overlayBackground),
  css.color(t.color.text),
  css.border("1px solid", t.color.overlayBorder),
  css.borderRadius(t.radius.lg),
  css.boxShadow(t.shadow.popover),
  // the content takes focus with `tabindex="-1"` when it holds nothing focusable: a ring around the whole panel is noise
  css.outline("none"),
);

/**
 * A non-modal popover, styled: `Popover.Trigger` opens `Popover.Content`, a floating panel with `role="dialog"` and no
 * `aria-modal`. `createPopover` owns the open state (controlled by `open`), the trigger's `aria-haspopup` / `aria-expanded` /
 * `aria-controls`, Enter, Space and ArrowDown to open, Escape to close, the placement and its flip at the viewport edge, the
 * outside `pointerdown` that light-dismisses, and the focus into the panel and back to the trigger. The kit adds the surface,
 * the accessible name, and the portal the primitive's page-space placement needs.
 *
 * Not modal, deliberately: the page behind keeps its focus, its clicks and its scroll, and Tab leaves the panel. The content is
 * the caller's — a form, a few controls — and nothing here is a menu: `Menu` owns a menu's roving focus and can sit inside
 * this panel.
 */
export const Popover = (props: PopoverProps): JSX.Element => {
  const popover = createPopover({
    id: props.id,
    get placement() {
      return props.placement;
    },
    get offset() {
      return props.offset;
    },
    get open() {
      return props.open;
    },
    defaultOpen: props.defaultOpen,
    get onOpenChange() {
      return props.onOpenChange;
    },
  });
  // The primitive wires two elements and creates an effect, so it is attached from the parts' refs: `ref` travels with the
  // props, so a `render` that spreads them keeps the wiring. Its teardown runs with the root.
  let trigger: HTMLElement | undefined;
  let content: HTMLElement | undefined;
  let detach: (() => void) | undefined;
  const connect = (part: "trigger" | "content", element: HTMLElement): void => {
    if (part === "trigger") {
      trigger = element;
    } else {
      content = element;
    }
    if (trigger !== undefined && content !== undefined && detach === undefined) {
      detach = popover.attach(trigger, content);
    }
  };
  onCleanup(() => {
    detach?.();
    detach = undefined;
  });
  return (
    <PopoverContext value={{ popover, label: () => props.label, connect }}>
      {props.children}
    </PopoverContext>
  );
};

/** The button that opens the panel: `Button` unless `render` says otherwise. It is the element with `aria-haspopup`. */
export const PopoverTrigger = (props: PopoverTriggerProps): JSX.Element => {
  const { popover, connect } = useContext(PopoverContext);
  const rest = omit(props, "render", "class", "children");
  // no `data-part` of its own: the part renders a `Button`, which owns the attribute, as `Dialog.Trigger` does
  const merged = merge(rest, popover.triggerProps, () => ({
    get class() {
      return css.cn(props.class);
    },
    ref: (element: HTMLElement) => {
      connect("trigger", element);
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <Button {...part}>{props.children}</Button>
  ));
};

/**
 * The panel, portalled to the body and placed by the primitive. It stays in the DOM and `hidden` while the popover is closed,
 * because `aria-controls` names it (and the primitive needs the element to measure and to move focus into on open).
 */
export const PopoverContent = (props: PopoverContentProps): JSX.Element => {
  const { popover, label, connect } = useContext(PopoverContext);
  const merged = merge(omit(props, "render", "class", "children"), popover.contentProps, () => ({
    "aria-label": label(),
    "data-part": "popover",
    get class() {
      return css.cn(contentClass, props.class);
    },
    ref: (element: HTMLElement) => {
      connect("content", element);
    },
  }));
  return (
    <Portal>
      {renderPart(props, merged, undefined, (part) => (
        <div {...part} style={popover.contentStyle()}>
          {props.children}
        </div>
      ))}
    </Portal>
  );
};
