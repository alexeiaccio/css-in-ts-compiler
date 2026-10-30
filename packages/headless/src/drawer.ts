import { type Accessor, createEffect, createUniqueId, onCleanup } from "solid-js";
import { createControllable } from "./controllable";
import {
  claimOverlay,
  cycleFocus,
  firstFocusable,
  isTopOverlay,
  lockScroll,
} from "./overlay-shell";

/** The edge a drawer occupies. `side()` reads the option at call time. */
export type DrawerSide = "left" | "right" | "bottom";

export interface DrawerOptions {
  /** Base for the generated trigger / content / backdrop ids. */
  readonly id?: string | undefined;
  /** Controlled: the host owns the open state and this is the only thing that changes it. */
  readonly open?: boolean | undefined;
  /** Uncontrolled starting state; ignored while `open` is set. */
  readonly defaultOpen?: boolean | undefined;
  /**
   * The edge the panel is anchored to. @default "right"
   *
   * Presentation only: a `bottom` panel is a sheet, `left` / `right` is a side
   * rail, and the same drawer is one API either way.
   */
  readonly side?: DrawerSide | undefined;
  /**
   * Whether the panel is modal: `aria-modal`, the Tab cycle, the scroll lock and
   * the backdrop. @default true
   *
   * This is the switch a breakpoint flips: below it a panel is a sheet and
   * modal, above it a side rail may not be. It is read on every attribute read,
   * so the host may change it while the drawer is open (crossing the
   * breakpoint) and the backdrop, `aria-modal` and the lock follow.
   */
  readonly modal?: boolean | undefined;
  /**
   * The width in px at which the host switches `side` and `modal` (a sheet
   * below it, a dialog above). **Not read here**: the primitive has no viewport
   * to measure and no `matchMedia`, so it only documents the pattern, and the
   * host watches the breakpoint and passes `modal` / `side`. A host that wants
   * the sheet drag behaviour composes CSS scroll snap around this, as
   * [docs/bottom-sheet.md](../docs/bottom-sheet.md) lays out.
   */
  readonly breakpoint?: number | undefined;
  /** A backdrop click or an outside `pointerdown` closes the drawer. @default true */
  readonly dismissable?: boolean | undefined;
  /** Id of the element naming the panel (`aria-labelledby`); a dialog without a name is unusable. */
  readonly labelledby?: string | undefined;
  /** A request to change the open state, called when the intent differs. */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
}

export interface DrawerTriggerProps {
  readonly id: string;
  readonly "aria-haspopup": "dialog";
  readonly "aria-expanded": "true" | "false";
  readonly "aria-controls": string;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface DrawerBackdropProps {
  readonly id: string;
  /** Always hidden when the drawer is closed or not modal: a non-modal drawer keeps the page clickable. */
  readonly hidden: boolean;
  readonly onClick: () => void;
}

export interface DrawerContentProps {
  readonly id: string;
  readonly role: "dialog";
  readonly "aria-modal": "true" | undefined;
  readonly "aria-labelledby": string | undefined;
  readonly tabindex: -1;
  readonly hidden: boolean;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

/** A bottom sheet's grab handle. Decorative: there is no drag, so it says nothing. */
export interface DrawerHandleProps {
  readonly "aria-hidden": "true";
}

export interface Drawer {
  readonly open: Accessor<boolean>;
  readonly side: Accessor<DrawerSide>;
  readonly triggerProps: DrawerTriggerProps;
  readonly backdropProps: DrawerBackdropProps;
  readonly contentProps: DrawerContentProps;
  readonly handleProps: DrawerHandleProps;
}

/**
 * The shell for a drawer / bottom sheet: an edge-anchored panel over the
 * Dialog (Modal) semantics (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/),
 * with the same shell as `createConfirm` — focus into the panel on open and back
 * to the trigger on close, Tab cycling while modal, Escape read from the
 * document (so it closes wherever focus is), a counted scroll lock and an
 * outside dismissal.
 *
 * **Compose, do not add a sheet primitive.** [docs/bottom-sheet.md](../docs/bottom-sheet.md)
 * settled it: the semantics are Dialog (Modal), the position, the slide and the
 * snap points are the host's CSS (native scroll snap), and the panel that both
 * need is this shell. `side` and `modal` are the whole presentation API: a sheet
 * is `{ side: "bottom", modal: true }`, a side rail is `{ side: "right" }` and a
 * non-modal rail is `{ side: "right", modal: false }`.
 *
 * **No drag-to-dismiss.** A drag is not a dialog interaction, it is a scroll
 * snap the platform runs off the main thread, and it belongs to the host's
 * scroll-snap CSS (see bottom-sheet.md: `scroll-snap-type: y mandatory`, snap
 * markers, `scrollsnapchange`). Mirroring a native snap in JS would be the
 * gesture re-implementation that the platform research forbids, and a pointer
 * gesture would exist on top of the snap that already moved the panel. So the
 * handle is decoration (`aria-hidden`, no pointer handlers): the ways out are
 * the backdrop, Escape, the close control the host puts in the panel, and the
 * trigger. Swipe-to-dismiss is a separate decision with its own oracle.
 *
 * The panel is edge-anchored, so there is **no `attach`**: nothing is measured
 * and no placement is computed. Focus and Tab find the panel through
 * `contentProps.id`, like `createConfirm` does, so the host only spreads
 * attributes onto its own elements.
 *
 * Not checked against a Quint spec: the dialog is, and this is its shell, so
 * `test/drawer.browser.test.tsx` is the oracle. A pointerdown outside the panel
 * closes it when `dismissable` (that is the backdrop click too, and the only
 * dismissal a non-modal drawer has); closing returns focus to the trigger.
 */
export const createDrawer = (options: DrawerOptions = {}): Drawer => {
  const base = options.id ?? createUniqueId();
  const triggerId = `${base}-trigger`;
  const contentId = `${base}-content`;
  const backdropId = `${base}-backdrop`;
  const self = Symbol(base);
  let wasOpen = false;

  const isModal = (): boolean => options.modal ?? true;
  const dismissable = (): boolean => options.dismissable ?? true;
  const content = (): HTMLElement | null => document.getElementById(contentId);
  const trigger = (): HTMLElement | null => document.getElementById(triggerId);

  const [open, requestOpen] = createControllable({
    value: () => options.open,
    initial: options.defaultOpen ?? false,
    onChange: () => options.onOpenChange,
  });

  const onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (!isTopOverlay(self) || !open()) {
      return;
    }
    if (event.key === "Escape") {
      // stops at the drawer: a dialog it sits in does not see it
      event.preventDefault();
      event.stopPropagation();
      requestOpen(false);
      return;
    }
    if (event.key !== "Tab" || !isModal()) {
      return;
    }
    const panel = content();
    if (panel !== null) {
      cycleFocus(event, panel);
    }
  };

  createEffect(
    () => open(),
    (isOpen) => {
      if (isOpen) {
        wasOpen = true;
        const panel = content();
        if (panel !== null) {
          (firstFocusable(panel) ?? panel).focus();
        }
        const release = claimOverlay(self);
        document.addEventListener("keydown", onDocumentKeyDown, true);
        return () => {
          document.removeEventListener("keydown", onDocumentKeyDown, true);
          release();
        };
      }
      // not on mount, only on a close: the trigger may be gone with the tree
      if (wasOpen) {
        wasOpen = false;
        const back = trigger();
        if (back !== null && back.isConnected) {
          back.focus();
        }
      }
    },
  );

  createEffect(
    () => open() && isModal(),
    (locked) => {
      if (locked) {
        return lockScroll();
      }
    },
  );

  const onPointerDown = (event: PointerEvent): void => {
    if (!open() || !dismissable()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (content()?.contains(target) === true || trigger()?.contains(target) === true) {
      return;
    }
    requestOpen(false);
  };
  document.addEventListener("pointerdown", onPointerDown, true);
  onCleanup(() => document.removeEventListener("pointerdown", onPointerDown, true));

  return {
    open,
    side: () => options.side ?? "right",
    triggerProps: {
      id: triggerId,
      "aria-haspopup": "dialog",
      get "aria-expanded"() {
        return open() ? "true" : "false";
      },
      "aria-controls": contentId,
      // a drawer trigger is a hamburger: it toggles
      onClick: () => requestOpen(!open()),
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          // without this a native button fires its click too, and the two
          // requests cancel out
          event.preventDefault();
          requestOpen(true);
        }
      },
    },
    backdropProps: {
      id: backdropId,
      get hidden() {
        return !open() || !isModal();
      },
      onClick: () => {
        if (dismissable()) {
          requestOpen(false);
        }
      },
    },
    contentProps: {
      id: contentId,
      role: "dialog",
      get "aria-modal"() {
        return isModal() && open() ? "true" : undefined;
      },
      "aria-labelledby": options.labelledby,
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
    handleProps: { "aria-hidden": "true" },
  };
};
