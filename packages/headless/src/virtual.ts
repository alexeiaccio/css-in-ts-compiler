import { type Accessor, createMemo, createSignal } from "solid-js";

// A DOM virtualiser: which items a scrolling element declares this frame. A list of thousands costs what the screen
// shows if the host renders only the visible items plus an overscan, and two spacer boxes stand in for the items above
// and below them: the content height, and so the scroll's clamp and the thumb, stay the real list's.
//
// Ported from the native renderer (`native/solid/src/virtual.ts`, `fixedWindow` and `measuredWindow`): `itemSize` as a
// number is the arithmetic window (the nth item starts at `n·(item + gap)`); a function (or no `itemSize` at all) is
// the measured one, where a height per index arrives from a `ResizeObserver` on the rendered items and a fallback
// stands in for the ones not measured yet. It **measures once, then virtualises**: while any height is unknown the
// whole column is declared, so one frame pays the whole list's layout and every frame after it has exact heights —
// the content height, the clamp and the thumb do not move as items are first seen.
//
// The items and the spacers are children of one gap-spaced column, so a spacer's own gap is taken out of its height
// (`above = first·slot - gap`): the first declared item starts at `first·slot`, and the items above are `first·slot`
// worth of content. At an end there is no spacer at all — a zero-height box would still add its gap — so a host
// renders a spacer only while its height is positive.
//
// **There is no APG pattern for virtualisation and no Quint machine**: the state is pixels, not items. The contract is
// WAI-ARIA — every declared item still announces its place in the whole set (`aria-setsize` / `aria-posinset`) — and
// `test/virtual.browser.test.tsx` is the oracle.
//
// **Focus is the host's.** A focused item that leaves the window unmounts, and no primitive can hold DOM focus on an
// element that is not there. The host moves focus with its own keys and calls `scrollToIndex` first, so the item is
// declared before focus lands; the ARIA indexes stay right while it is.
//
// ponytail: the measured window builds a prefix sum over every index on each call (O(n) a frame; n is a feed, not a
// dataset). A persistent prefix sum maintained as heights arrive, or a binary search over a running total, is the
// upgrade if hundreds of thousands of rows ever matter. Horizontal virtualisation is not here, and neither is a sticky
// header: the arithmetic starts at the content's 0, so the scrollport and its column must have no padding, and a
// header is the host's sibling above the scrollport.

/** The items declared either side of the viewport, on top of the ones it shows. */
export const OVERSCAN = 2;

/** The measured mode's last-resort estimate, as in the native module: 190 px. */
const FALLBACK = 190;

const clamp = (value: number, low: number, high: number): number =>
  Math.min(Math.max(value, low), high);

/**
 * A window: the indexes to declare (`first..last`, inclusive), the spacer heights above and below them, and the real
 * content height of *all* the items and the gaps between them (the clamp's and the thumb's, not the declared subset's).
 */
export interface VirtualWindow {
  /** The first item to declare, 0..count-1 (`last < first` when there is nothing). */
  readonly first: number;
  /** The last item to declare, inclusive. */
  readonly last: number;
  /** The top spacer's height, px: 0 when `first` is 0 and there is no spacer. */
  readonly above: number;
  /** The bottom spacer's height, px: 0 when `last` is the last item and there is no spacer. */
  readonly below: number;
  /** Every item and every gap between them, not just the declared ones' (the scroll's clamp and its thumb). */
  readonly content: number;
}

const NONE: VirtualWindow = { first: 0, last: -1, above: 0, below: 0, content: 0 };

export interface VirtualizerOptions {
  /** The full row count: a number, or a getter read on every window calculation. */
  readonly count: number | (() => number);
  /**
   * A fixed row height in px — the arithmetic window — or `(index) => number`, the
   * per-row estimate of the measured mode. Omit it to measure every row and place
   * the unseen ones at the mean of the measured, the native module's rule.
   */
  readonly itemSize?: number | ((index: number) => number) | undefined;
  /** The gap between rows in the column, px. @default 0 */
  readonly gap?: number | undefined;
  /** The declaration either side of the viewport. @default OVERSCAN */
  readonly overscan?: number | undefined;
  /**
   * One height, px, for every row not measured yet. It overrides both the
   * per-row estimate and the mean of the measured ones. @default undefined
   */
  readonly estimate?: number | undefined;
}

/** Spread onto the scrollport. `attach` already listens; this is for hosts that wire scrolling themselves. */
export interface VirtualScrollProps {
  readonly onScroll: (event: Event) => void;
}

/**
 * Spread onto a declared item (a `role="listitem"`, or a `<tr>` of a grid). The
 * ARIA pair is the whole set, so a screen reader announces "row 4,321 of
 * 10,000" while only a screenful exists.
 *
 * `ref` is the measured mode's wiring: it hands the element to the
 * `ResizeObserver`. It is a no-op in the fixed mode.
 */
export interface VirtualItemProps {
  readonly "aria-setsize": number;
  readonly "aria-posinset": number;
  readonly ref: (element: HTMLElement) => void;
}

/**
 * Spread onto a spacer box in the same gap-spaced column as the items. A
 * zero-height box still takes the column's gap, so render it only while its
 * height is positive (`window().above > 0` / `window().below > 0`).
 */
export interface VirtualSpacerProps {
  readonly "aria-hidden": "true";
  readonly style: { readonly height: string };
}

export type VirtualSpacerPosition = "start" | "end";

export interface Virtualizer {
  /** The current window. Reads the scrollport's `scrollTop` and `clientHeight` signals. */
  readonly window: Accessor<VirtualWindow>;
  /** How many items the window declares (0..count). */
  readonly rangeCount: Accessor<number>;
  readonly scrollProps: VirtualScrollProps;
  readonly itemProps: (index: number) => VirtualItemProps;
  readonly spacerProps: (position: VirtualSpacerPosition) => VirtualSpacerProps;
  /**
   * The least scroll that shows item `index`: it does not move when the item is
   * already fully visible. The host calls it before moving focus to an item the
   * window may not declare.
   */
  readonly scrollToIndex: (index: number) => void;
  /**
   * DOM wiring: record the scrollport, listen to its `scroll` and its size, and
   * observe the rendered items (measured mode). It creates no computation, so a
   * host may call it from a `ref`; it returns the teardown.
   */
  readonly attach: (element: HTMLElement) => () => void;
}

/** The resolved heights and their prefix sums, gaps included. */
interface Layout {
  readonly heights: number[];
  /** `tops[i]` is item `i`'s top in the content's coordinates; `tops[count]` is the content plus the last gap. */
  readonly tops: number[];
  readonly content: number;
  /** Some index has no height from the DOM yet: the measuring pass. */
  readonly unknown: boolean;
}

/**
 * A virtualiser: `count` rows of one height (arithmetic) or of measured heights,
 * `gap` between them, in a scrollport the host passes to `attach`.
 *
 * Plain Solid signals, no elements, no styling; the `ResizeObserver` is created
 * in `attach` and not at setup, so creating the primitive on a server is safe.
 * Each item's `ref` queues its element and the observer is attached when the
 * port arrives, so the order of the refs does not matter.
 */
export const createVirtualizer = (options: VirtualizerOptions): Virtualizer => {
  const [port, setPort] = createSignal<HTMLElement | undefined>(undefined);
  const [offset, setOffset] = createSignal(0);
  const [viewport, setViewport] = createSignal(0);
  // A measurement (or a count change) is not a signal itself: the cache is a Map,
  // and this version is what the window memo tracks.
  const [version, setVersion] = createSignal(0);

  const heights = new Map<number, number>();
  /** Element -> index, for the observer's entries. */
  const indexOf = new Map<Element, number>();
  /** Index -> element, to re-observe after an `attach`. */
  const elementOf = new Map<number, HTMLElement>();
  let observer: ResizeObserver | undefined;
  let cleanup: (() => void) | undefined;

  const count = (): number => {
    const value = typeof options.count === "function" ? options.count() : options.count;
    return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
  };
  const gap = (): number => options.gap ?? 0;
  const overscan = (): number => options.overscan ?? OVERSCAN;
  const measures = (): boolean => typeof options.itemSize !== "number";

  // Drop only what the shrunken count cannot name; a height below the new count
  // stays exact. Growing the count again leaves the new indexes unknown, so the
  // measuring pass runs for them.
  let cached = 0;
  const prune = (total: number): void => {
    if (total < cached) {
      for (const index of heights.keys()) {
        if (index >= total) {
          heights.delete(index);
        }
      }
    }
    cached = total;
    for (const [element, index] of indexOf) {
      if (!element.isConnected) {
        observer?.unobserve(element);
        indexOf.delete(element);
        if (elementOf.get(index) === element) {
          elementOf.delete(index);
        }
      }
    }
  };

  /** Measure and prefix-sum every index; an index without a height resolves to the fallback, not to the pass. */
  const layout = (total: number): Layout => {
    const g = gap();
    let sum = 0;
    let measured = 0;
    let unknown = false;
    for (let index = 0; index < total; index++) {
      const height = heights.get(index);
      if (height !== undefined && height > 0) {
        sum += height;
        measured += 1;
      } else {
        unknown = true;
      }
    }
    const mean = measured > 0 ? sum / measured : 0;
    const estimate = options.estimate;
    const size = options.itemSize;
    const resolved = new Array<number>(total);
    const tops = new Array<number>(total + 1);
    tops[0] = 0;
    for (let index = 0; index < total; index++) {
      const cached = heights.get(index);
      let height: number;
      if (cached !== undefined && cached > 0) {
        height = cached;
      } else if (estimate !== undefined) {
        height = estimate;
      } else {
        const guessed = typeof size === "function" ? size(index) : 0;
        height = guessed > 0 ? guessed : mean > 0 ? mean : FALLBACK;
      }
      resolved[index] = height;
      tops[index + 1] = tops[index]! + height + g;
    }
    return {
      heights: resolved,
      tops,
      content: total > 0 ? tops[total]! - g : 0,
      unknown,
    };
  };

  /** The arithmetic window of the native `fixedWindow`, over the whole list and then the overscan. */
  const fixedWindow = (total: number, item: number): VirtualWindow => {
    if (!(total > 0) || !(item > 0)) {
      return NONE;
    }
    const g = gap();
    const slot = item + g;
    const content = total * item + (total - 1) * g;
    const view = viewport();
    const y = clamp(offset(), 0, Math.max(content - view, 0));
    const firstVisible = Math.min(total - 1, Math.floor(y / slot));
    const lastVisible = Math.min(
      total - 1,
      Math.max(firstVisible, Math.ceil((y + view) / slot) - 1),
    );
    const over = overscan();
    const first = clamp(firstVisible - over, 0, total - 1);
    const last = clamp(lastVisible + over, first, total - 1);
    return {
      first,
      last,
      above: first ? first * slot - g : 0,
      below: last === total - 1 ? 0 : (total - 1 - last) * slot - g,
      content,
    };
  };

  /** The native `measuredWindow`, over the cache and its fallbacks. */
  const measuredWindow = (total: number): VirtualWindow => {
    if (!(total > 0)) {
      return NONE;
    }
    const g = gap();
    const { heights: resolved, tops, content, unknown } = layout(total);
    // measure once, then virtualise: declare the whole column while a height is
    // missing, and the page's next frame has every one of them
    if (unknown) {
      return { first: 0, last: total - 1, above: 0, below: 0, content };
    }
    const view = viewport();
    const y = clamp(offset(), 0, Math.max(content - view, 0));
    let firstVisible = 0;
    while (firstVisible < total - 1 && tops[firstVisible]! + resolved[firstVisible]! <= y) {
      firstVisible += 1;
    }
    let lastVisible = firstVisible;
    while (lastVisible < total - 1 && tops[lastVisible + 1]! < y + view) {
      lastVisible += 1;
    }
    const over = overscan();
    const first = clamp(firstVisible - over, 0, total - 1);
    const last = clamp(lastVisible + over, first, total - 1);
    return {
      first,
      last,
      above: first ? tops[first]! - g : 0,
      below: last === total - 1 ? 0 : content - tops[last]! - resolved[last]! - g,
      content,
    };
  };

  const current = createMemo<VirtualWindow>(() => {
    version();
    const total = count();
    prune(total);
    const size = options.itemSize;
    return typeof size === "number" ? fixedWindow(total, size) : measuredWindow(total);
  });

  const rangeCount = (): number => {
    const at = current();
    return at.last < at.first ? 0 : at.last - at.first + 1;
  };

  const sync = (): void => {
    const element = port();
    if (element === undefined) {
      return;
    }
    setOffset(element.scrollTop);
    setViewport(element.clientHeight);
  };

  /** The measurement: a height per index, and a version bump only when one actually changed. */
  const onResize = (entries: ResizeObserverEntry[]): void => {
    const element = port();
    let changed = false;
    for (const entry of entries) {
      if (entry.target === element) {
        setViewport(element.clientHeight);
        continue;
      }
      const index = indexOf.get(entry.target);
      // a row the count dropped may still report before it unmounts; its height
      // belongs to no index of the list any more
      if (index === undefined || index >= count()) {
        continue;
      }
      const height = entry.target.getBoundingClientRect().height;
      if (!(height > 0)) {
        continue;
      }
      const previous = heights.get(index);
      // a fractional layout wobbles by sub-pixels; 0.5 px is not a new height
      if (previous === undefined || Math.abs(previous - height) > 0.5) {
        heights.set(index, height);
        changed = true;
      }
    }
    if (changed) {
      setVersion((value) => value + 1);
    }
  };

  const register = (index: number, element: HTMLElement): void => {
    const previous = elementOf.get(index);
    if (previous === element) {
      return;
    }
    if (previous !== undefined) {
      observer?.unobserve(previous);
      indexOf.delete(previous);
    }
    elementOf.set(index, element);
    indexOf.set(element, index);
    observer?.observe(element);
  };

  const itemProps = (index: number): VirtualItemProps => ({
    "aria-setsize": count(),
    "aria-posinset": index + 1,
    // Solid calls a ref when the element is created; registering twice is a no-op
    ref: (element) => {
      if (measures()) {
        register(index, element);
      }
    },
  });

  const spacerProps = (position: VirtualSpacerPosition): VirtualSpacerProps => {
    const at = current();
    const height = position === "start" ? (at.first > 0 ? at.above : 0) : at.below;
    return { "aria-hidden": "true", style: { height: `${height}px` } };
  };

  const scrollToIndex = (index: number): void => {
    const element = port();
    const total = count();
    if (element === undefined || total <= 0) {
      return;
    }
    const target = clamp(Math.trunc(index), 0, total - 1);
    const size = options.itemSize;
    const g = gap();
    let top: number;
    let height: number;
    if (typeof size === "number") {
      top = target * (size + g);
      height = size;
    } else {
      const placed = layout(total);
      top = placed.tops[target]!;
      height = placed.heights[target]!;
    }
    const view = element.clientHeight;
    const at = element.scrollTop;
    const next = top < at ? top : top + height > at + view ? top + height - view : at;
    if (next !== at) {
      element.scrollTop = Math.max(0, next);
    }
    sync();
  };

  const attach = (element: HTMLElement): (() => void) => {
    cleanup?.();
    setPort(element);
    sync();
    const listener = (): void => sync();
    element.addEventListener("scroll", listener, { passive: true });
    observer = new ResizeObserver(onResize);
    observer.observe(element);
    for (const item of elementOf.values()) {
      observer.observe(item);
    }
    // a host's own scrollport listener may exist beside this one: both read the
    // same element, so the second write is the same number
    const detach = (): void => {
      element.removeEventListener("scroll", listener);
      observer?.disconnect();
      observer = undefined;
      setPort(undefined);
      cleanup = undefined;
    };
    cleanup = detach;
    return detach;
  };

  return {
    window: current,
    rangeCount,
    scrollProps: { onScroll: () => sync() },
    itemProps,
    spacerProps,
    scrollToIndex,
    attach,
  };
};
