/**
 * The page-wide half of a modal overlay: one scroll lock, one stack of open
 * overlays, the tabbables of a panel and the Tab cycle over them. Shared by
 * `createConfirm` and `createDrawer` so that a confirm opened over a drawer (or
 * the reverse) takes Escape and Tab first, and the scroll lock outlives the
 * first of them to close.
 */

const TABBABLE = "a[href], button, input, select, textarea, [tabindex], [contenteditable]";

/** The visible, tabbable elements of `root`, in document order. */
export const tabbables = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (element) =>
      element.tabIndex >= 0 && !element.matches(":disabled") && element.getClientRects().length > 0,
  );

/** The first tabbable element of `root`, if any. */
export const firstFocusable = (root: HTMLElement): HTMLElement | undefined => tabbables(root)[0];

/**
 * Wraps Tab / Shift+Tab inside `root` and pulls a focus that escaped back in
 * on the next Tab. With nothing tabbable the panel itself (which is
 * `tabindex="-1"`) keeps the focus.
 */
export const cycleFocus = (event: KeyboardEvent, root: HTMLElement): void => {
  const items = tabbables(root);
  const first = items[0];
  const last = items.at(-1);
  const active = document.activeElement;
  const inside = root.contains(active);
  if (first === undefined || last === undefined) {
    event.preventDefault();
    root.focus();
  } else if (event.shiftKey && (!inside || active === first || active === root)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (!inside || active === last)) {
    event.preventDefault();
    first.focus();
  }
};

let scrollLocks = 0;
let scrollBefore = "";

/**
 * `overflow: hidden` on the document element, counted: the first holder takes
 * it, the last to release restores what `overflow` was. The returned release is
 * idempotent.
 */
export const lockScroll = (): (() => void) => {
  const root = document.documentElement;
  if (scrollLocks++ === 0) {
    scrollBefore = root.style.overflow;
    root.style.overflow = "hidden";
  }
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    if (--scrollLocks === 0) {
      root.style.overflow = scrollBefore;
    }
  };
};

const openOverlays: symbol[] = [];

/**
 * Joins the open overlays; the last one to claim takes Escape and Tab. Returns
 * the release (idempotent), which may be called in any order.
 */
export const claimOverlay = (self: symbol): (() => void) => {
  openOverlays.push(self);
  let claimed = true;
  return () => {
    if (!claimed) {
      return;
    }
    claimed = false;
    const at = openOverlays.indexOf(self);
    if (at !== -1) {
      openOverlays.splice(at, 1);
    }
  };
};

/** Whether `self` is the overlay that takes Escape and Tab (the one opened last). */
export const isTopOverlay = (self: symbol): boolean => openOverlays.at(-1) === self;
