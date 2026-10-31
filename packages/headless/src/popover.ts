import { type Accessor, createEffect, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

export type PopoverPlacement =
  | "bottom-start"
  | "bottom"
  | "bottom-end"
  | "top-start"
  | "top"
  | "top-end";

/** A rect in one space, as `getBoundingClientRect` gives it. */
export interface PopoverRect {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

export interface PopoverViewport {
  readonly width: number;
  readonly height: number;
}

export interface PopoverPosition {
  readonly top: number;
  readonly left: number;
  readonly placement: PopoverPlacement;
}

/** The last measure, as a style object for the content element. */
export interface PopoverStyle {
  readonly position: "absolute";
  readonly top: string;
  readonly left: string;
  /** Custom properties, so the object is assignable to Solid's `style`. */
  readonly [property: `-${string}`]: string | number | undefined;
}

export interface PopoverOptions {
  /** Base for the generated trigger / content ids. */
  readonly id?: string | undefined;
  /** Controlled: the host owns the open state and this is the only thing that changes it. */
  readonly open?: boolean | undefined;
  /** Uncontrolled starting state; ignored while `open` is set. */
  readonly defaultOpen?: boolean | undefined;
  /** @default "bottom" */
  readonly placement?: PopoverPlacement | undefined;
  /** Gap between the trigger and the content, in px. @default 4 */
  readonly offset?: number | undefined;
  /**
   * Only `false`, and it is not read: a popover is the non-modal overlay (the
   * page behind stays interactive, nothing is made `inert`, no scroll lock).
   * A modal surface is `createDialogModal`, which owns `aria-modal` and the
   * focus trap; this option exists only so a host generic over overlays can
   * pass it and get the truth.
   */
  readonly modal?: false;
  /** A request to change the open state, called when the intent differs. */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}

export interface PopoverTriggerProps {
  readonly id: string;
  readonly "aria-haspopup": "dialog";
  readonly "aria-expanded": "true" | "false";
  readonly "aria-controls": string;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface PopoverContentProps {
  readonly id: string;
  readonly role: "dialog";
  /** Always absent: a popover is not modal. */
  readonly "aria-modal": undefined;
  readonly tabindex: -1;
  readonly hidden: boolean;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface Popover {
  readonly open: Accessor<boolean>;
  readonly triggerProps: PopoverTriggerProps;
  readonly contentProps: PopoverContentProps;
  /** `style` for the content element. Reads the last measure. */
  readonly contentStyle: Accessor<PopoverStyle>;
  /** Pure: the content's offset for these rects, flipped when the room is not there. */
  readonly position: (
    triggerRect: PopoverRect,
    contentRect: PopoverRect,
    viewport: PopoverViewport,
  ) => PopoverPosition;
  /**
   * DOM wiring: measure and place on open, focus into the content, return focus
   * to the trigger on close, close on an outside `pointerdown`. Call it from a
   * ref (it creates an effect) and call the teardown it returns on cleanup.
   */
  readonly attach: (trigger: HTMLElement, content: HTMLElement) => () => void;
}

const FLIPPED: Readonly<Record<PopoverPlacement, PopoverPlacement>> = {
  "bottom-start": "top-start",
  bottom: "top",
  "bottom-end": "top-end",
  "top-start": "bottom-start",
  top: "bottom",
  "top-end": "bottom-end",
};

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex], [contenteditable]";

const firstFocusable = (root: HTMLElement): HTMLElement | undefined =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).find(
    (element) =>
      element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length > 0,
  );

/**
 * A non-modal popover on Solid 2: an anchored surface a trigger opens, dismissed
 * by a click on the trigger, an outside pointerdown or Escape, with focus moving
 * into it and back to the trigger. **There is no APG pattern for it** (APG has
 * Dialog, which is modal, and no popover), so there is no Quint spec and
 * `test/popover.browser.test.tsx` is the oracle. Copied from Base UI's Popover
 * (trigger click toggles, Enter / Space / ArrowDown open, light dismiss on an
 * outside `pointerdown` that does not steal focus) and React Aria's
 * `usePopover` (focus into the content on open, back to the trigger on close,
 * `role="dialog"` with no `aria-modal`, a placement that flips at the viewport
 * edge).
 *
 * Not modal, deliberately: the page behind keeps its focus, its clicks and its
 * scroll. No `inert`, no scroll lock, no Tab cycle — `createDialogModal` is the
 * modal one. No roving focus either: this is the base for a menu in a popover
 * (`createMenu` owns the item focus), not a menu itself.
 *
 * Request/commit (map ticket `rt1p`): uncontrolled by default (`defaultOpen`);
 * pass `open` + `onOpenChange` to own the open state.
 */
export const createPopover = (options: PopoverOptions = {}): Popover => {
  const base = options.id ?? createUniqueId();
  const triggerId = `${base}-trigger`;
  const contentId = `${base}-content`;
  const [open, requestOpen] = createControllable({
    value: () => options.open,
    initial: options.defaultOpen ?? false,
    onChange: () => options.onOpenChange,
  });
  const [measured, setMeasured] = createSignal<PopoverPosition | undefined>(undefined);

  const position = (
    triggerRect: PopoverRect,
    contentRect: PopoverRect,
    viewport: PopoverViewport,
  ): PopoverPosition => {
    const requested = options.placement ?? "bottom";
    const gap = options.offset ?? 4;
    const below = triggerRect.top + triggerRect.height + gap;
    const above = triggerRect.top - gap - contentRect.height;
    const fitsBelow = below + contentRect.height <= viewport.height;
    const fitsAbove = above >= 0;
    const wantsBelow = requested.startsWith("bottom");
    // flip only when the requested side is out of room and the other one has it
    const room = wantsBelow ? fitsBelow : fitsAbove;
    const otherRoom = wantsBelow ? fitsAbove : fitsBelow;
    const placement = room || !otherRoom ? requested : FLIPPED[requested];
    const aligned =
      placement.endsWith("-start") === true
        ? triggerRect.left
        : placement.endsWith("-end") === true
          ? triggerRect.left + triggerRect.width - contentRect.width
          : triggerRect.left + (triggerRect.width - contentRect.width) / 2;
    return {
      top: placement.startsWith("top") ? above : below,
      // ponytail: shifted, not flipped, when the side overflows; no second axis
      left: Math.max(0, Math.min(aligned, viewport.width - contentRect.width)),
      placement,
    };
  };

  // The pair `attach` is given, as a signal: the effect below has to run again when a host attaches (and when it detaches),
  // and it cannot be created inside `attach` itself. A host calls `attach` from a `ref`, Solid 2 runs refs in the effect
  // phase, and creating a primitive there belongs to nobody — its dev build throws `PRIMITIVE_IN_EFFECT_CALLBACK` while
  // the production one stays silent, which is how this shipped: this repo's tests and the kit's ran the production build
  // and only a `vite dev` app (and the starter smoke) saw it.
  const [attached, setAttached] = createSignal<
    { trigger: HTMLElement; content: HTMLElement } | undefined
  >(undefined);
  let restoreFocus = true;
  let wasOpen = false;

  const measure = (): void => {
    const pair = attached();
    if (!open() || pair === undefined) {
      return;
    }
    const t = pair.trigger.getBoundingClientRect();
    const c = pair.content.getBoundingClientRect();
    const at = position(
      { top: t.top, left: t.left, width: t.width, height: t.height },
      { top: 0, left: 0, width: c.width, height: c.height },
      { width: window.innerWidth, height: window.innerHeight },
    );
    // measured in client space (that is what the viewport is), written in page space, which is what `position: absolute`
    // on the content means
    setMeasured({
      top: at.top + window.scrollY,
      left: at.left + window.scrollX,
      placement: at.placement,
    });
  };

  createEffect(
    () => [open(), attached()] as const,
    ([isOpen, pair]) => {
      if (pair === undefined) {
        return;
      }
      if (isOpen) {
        restoreFocus = true;
        wasOpen = true;
        measure();
        (firstFocusable(pair.content) ?? pair.content).focus();
      } else if (wasOpen) {
        wasOpen = false;
        if (restoreFocus && pair.trigger.isConnected) {
          pair.trigger.focus();
        }
      }
    },
  );

  const attach = (trigger: HTMLElement, content: HTMLElement): (() => void) => {
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node) || trigger.contains(target) || content.contains(target)) {
        return;
      }
      // the focused element outside keeps the focus: no return to the trigger
      restoreFocus = false;
      requestOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const observer = new ResizeObserver(measure);
    observer.observe(trigger);
    observer.observe(content);
    setAttached({ trigger, content });

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      setAttached(undefined);
    };
  };

  return {
    open,
    triggerProps: {
      id: triggerId,
      "aria-haspopup": "dialog",
      get "aria-expanded"() {
        return open() ? "true" : "false";
      },
      "aria-controls": contentId,
      onClick: () => requestOpen(!open()),
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
          // without this a native button fires its click too, and the two
          // requests cancel out
          event.preventDefault();
          requestOpen(true);
        }
      },
    },
    contentProps: {
      id: contentId,
      role: "dialog",
      "aria-modal": undefined,
      tabindex: -1,
      get hidden() {
        return !open();
      },
      onKeyDown: (event) => {
        if (event.key === "Escape" && open()) {
          event.preventDefault();
          requestOpen(false);
        }
      },
    },
    contentStyle: () => {
      const at = measured();
      return {
        position: "absolute",
        top: `${at?.top ?? 0}px`,
        left: `${at?.left ?? 0}px`,
      };
    },
    position,
    attach,
  };
};
