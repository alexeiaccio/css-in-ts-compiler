import { type Accessor, createEffect, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

export type PanelsOrientation = "vertical" | "horizontal";

/** One pane of the group. Sizes are percentages of the group (0..100). */
export interface ResizablePaneOptions {
  readonly id?: string;
  /** Smallest expanded size, in percent. */
  readonly min?: number;
  /** Largest size, in percent. */
  readonly max?: number;
  /** The uncontrolled start; defaults to an equal split. */
  readonly defaultSize?: number;
  /** Collapses to `collapsedSize` on Enter and restores the remembered size. */
  readonly collapsible?: boolean;
  readonly collapsedSize?: number;
  /** Accessible name fragment: the separator becomes "Resize <label>". */
  readonly label?: string;
}

/** Options are read lazily: pass an object with getters, never destructured values. */
export interface ResizablePanelsOptions {
  readonly panes: ReadonlyArray<ResizablePaneOptions>;
  readonly orientation?: PanelsOrientation;
  /** Controlled: the host owns the layout. A new array per change. */
  readonly sizes?: ReadonlyArray<number> | undefined;
  /** The uncontrolled start; ignored while `sizes` is set. */
  readonly defaultSizes?: ReadonlyArray<number>;
  /** Keyboard step, in percent. */
  readonly step?: number;
  /** Base for the generated group / pane / separator ids. */
  readonly id?: string;
  /** Accessible name of the group. */
  readonly label?: string | undefined;
  /** Persist the layout in localStorage under this key (host storage, not modelled). */
  readonly storageKey?: string | undefined;
  /** A request to change the layout the host may ignore. */
  readonly onSizesChange?: (sizes: ReadonlyArray<number>) => void;
}

export interface ResizablePanelsGroupProps {
  readonly role: "group";
  readonly "aria-label": string | undefined;
}

export interface ResizablePaneProps {
  readonly id: string;
}

/** Spread onto the focusable `role=separator` bar between pane `index` and `index + 1`. */
export interface ResizableSeparatorProps {
  readonly id: string;
  readonly role: "separator";
  readonly "aria-orientation": PanelsOrientation;
  readonly "aria-valuenow": number;
  readonly "aria-valuemin": number;
  readonly "aria-valuemax": number;
  /** The pane this separator resizes (the one on its left). */
  readonly "aria-controls": string;
  readonly "aria-label": string;
  readonly tabindex: 0;
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onPointerDown: (event: PointerEvent) => void;
  readonly onPointerMove: (event: PointerEvent) => void;
  readonly onPointerUp: (event: PointerEvent) => void;
  readonly onPointerCancel: (event: PointerEvent) => void;
}

export interface ResizablePanels {
  /** The committed layout, in percent; always sums to 100. */
  readonly sizes: Accessor<ReadonlyArray<number>>;
  readonly collapsed: (index: number) => boolean;
  /** The separator being dragged, or `null`. */
  readonly resizing: Accessor<number | null>;
  readonly focusSeparator: Accessor<number | null>;
  readonly setFocusSeparator: (index: number | null) => void;
  readonly keyDown: (index: number, key: string) => void;
  readonly groupProps: ResizablePanelsGroupProps;
  readonly paneProps: (index: number) => ResizablePaneProps;
  readonly separatorProps: (index: number) => ResizableSeparatorProps;
}

const DEFAULT_MIN = 10;
const DEFAULT_MAX = 80;
const DEFAULT_STEP = 10;
const FULL = 100;

const clamp = (value: number, low: number, high: number): number =>
  Math.min(high, Math.max(low, value));

/** Percentages are reported at a hundredth: a pointer delta is never exact. */
const round2 = (value: number): number => Math.round(value * 100) / 100;

const sameSizes = (a: ReadonlyArray<number>, b: ReadonlyArray<number>): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const KEY_TAGS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "Enter",
]);

// Capture throws when the event is synthetic (a test, or a pointer that is not
// active); the drag itself still works, it just does not survive leaving the bar.
const capture = (element: Element, pointerId: number): void => {
  try {
    element.setPointerCapture(pointerId);
  } catch {
    // no active pointer to capture
  }
};

const release = (element: Element, pointerId: number): void => {
  try {
    element.releasePointerCapture(pointerId);
  } catch {
    // capture never happened
  }
};

const readStored = (key: string, count: number): ReadonlyArray<number> | undefined => {
  if (typeof localStorage === "undefined") {
    return undefined;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return undefined;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length === count &&
      parsed.every((value) => typeof value === "number" && Number.isFinite(value))
    ) {
      return parsed as ReadonlyArray<number>;
    }
  } catch {
    // unreadable storage is the same as no storage
  }
  return undefined;
};

const writeStored = (key: string, sizes: ReadonlyArray<number>): void => {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(sizes));
  } catch {
    // quota or a blocked store: persistence is best effort
  }
};

/**
 * A group of N panes and N-1 separators, react-resizable-panels' model on the
 * APG window splitter's keyboard: sizes in percent of the group, always summing
 * to 100, each pane within `min..max`, a collapsible pane landing on
 * `collapsedSize`. The separator is the focusable widget (`role=separator`,
 * its `aria-valuenow` is the pane on its left); arrows/Home/End move the pair
 * around a separator and Enter collapses / restores, all as requests.
 *
 * A move only ever changes the separator's two neighbours, clamped by both
 * bounds. Collapsing hands the pane's space to the nearest pane that can take
 * it and cascades outward; restoring takes it back in the same order. The drag
 * is snapshot + delta: pointerdown remembers the layout, every move re-solves
 * from it, so dragging back past a clamp recovers exactly.
 *
 * Behaviour is `packages/apg-specs/specs/patterns/resizable-panels.qnt`; the
 * DOM is checked against it by the differential walk.
 */
export const createResizablePanels = (options: ResizablePanelsOptions): ResizablePanels => {
  const panes = (): ReadonlyArray<ResizablePaneOptions> => options.panes;
  const count = (): number => panes().length;
  const orientation = (): PanelsOrientation => options.orientation ?? "vertical";
  const step = (): number => options.step ?? DEFAULT_STEP;
  const base = options.id ?? createUniqueId();

  const paneId = (index: number): string => panes()[index]?.id ?? `${base}-pane-${index}`;
  const collapsedSize = (index: number): number =>
    panes()[index]?.collapsible === true ? (panes()[index]?.collapsedSize ?? 0) : 0;
  /** The smallest expanded size (a move never collapses through it). */
  const minOf = (index: number): number => panes()[index]?.min ?? DEFAULT_MIN;
  /** The smallest committed size (a collapsible pane may sit at collapsedSize). */
  const lowOf = (index: number): number =>
    panes()[index]?.collapsible === true ? collapsedSize(index) : minOf(index);
  const highOf = (index: number): number => panes()[index]?.max ?? DEFAULT_MAX;

  /** Clamp every pane, then push the residual into the panes in order. */
  const fit = (raw: ReadonlyArray<number>): ReadonlyArray<number> => {
    const next = panes().map((_, index) =>
      clamp(round2(raw[index] ?? FULL / Math.max(count(), 1)), lowOf(index), highOf(index)),
    );
    let residual = round2(FULL - next.reduce((sum, value) => sum + value, 0));
    for (let index = 0; index < next.length && residual !== 0; index += 1) {
      const room =
        residual > 0 ? highOf(index) - (next[index] ?? 0) : (next[index] ?? 0) - lowOf(index);
      const move = residual > 0 ? Math.min(residual, room) : Math.max(residual, -room);
      next[index] = round2((next[index] ?? 0) + move);
      residual = round2(residual - move);
    }
    return next;
  };

  /** Move `amount` percent into pane `index` (negative: out of it), taking from or
   * giving to its neighbours nearest-first (right, then left), each within bounds. */
  const shift = (
    sizes: ReadonlyArray<number>,
    index: number,
    amount: number,
  ): ReadonlyArray<number> => {
    const next = [...sizes];
    let left = round2(amount);
    const order: number[] = [];
    for (let other = index + 1; other < next.length; other += 1) order.push(other);
    for (let other = index - 1; other >= 0; other -= 1) order.push(other);
    for (const other of order) {
      if (left === 0) break;
      const value = next[other] ?? 0;
      const room =
        left > 0 ? Math.max(0, value - minOf(other)) : Math.max(0, highOf(other) - value);
      const move = left > 0 ? Math.min(left, room) : Math.max(left, -room);
      next[other] = round2(value - move);
      left = round2(left - move);
    }
    next[index] = round2((next[index] ?? 0) + (round2(amount) - left));
    return next;
  };

  /** Move the boundary between pane `index` and `index + 1` by `delta`. */
  const movePair = (
    sizes: ReadonlyArray<number>,
    index: number,
    delta: number,
  ): ReadonlyArray<number> => {
    const a = sizes[index] ?? 0;
    const b = sizes[index + 1] ?? 0;
    const low = Math.max(minOf(index), round2(a + b - highOf(index + 1)));
    const high = Math.min(highOf(index), round2(a + b - minOf(index + 1)));
    const nextA = round2(clamp(a + delta, low, high));
    const next = [...sizes];
    next[index] = nextA;
    next[index + 1] = round2(a + b - nextA);
    return next;
  };

  const initialSizes = (): ReadonlyArray<number> => {
    const stored =
      options.storageKey === undefined ? undefined : readStored(options.storageKey, count());
    return fit(
      stored ??
        options.defaultSizes ??
        panes().map((pane) => pane.defaultSize ?? round2(FULL / Math.max(count(), 1))),
    );
  };

  const start = initialSizes();
  const [sizes, request] = createControllable<ReadonlyArray<number>>({
    value: () => options.sizes,
    initial: start,
    onChange: () => options.onSizesChange,
    same: sameSizes,
  });

  const [focusSeparator, setFocusSeparator] = createSignal<number | null>(null);
  const [resizing, setResizing] = createSignal<number | null>(null);
  // the last expanded size of each pane: the value a restore returns to. Derived
  // from the committed layout, so a collapse by any route (Enter, a host write)
  // remembers the size it left.
  const lastExpanded: number[] = start.map((value, index) => Math.max(value, minOf(index)));
  createEffect(
    () => sizes(),
    (now) => {
      now.forEach((value, index) => {
        if (value > collapsedSize(index)) {
          lastExpanded[index] = value;
        }
      });
    },
  );

  const collapsed = (index: number): boolean =>
    panes()[index]?.collapsible === true && (sizes()[index] ?? 0) <= collapsedSize(index);

  const movable = (index: number): boolean =>
    index >= 0 && index + 1 < count() && !collapsed(index) && !collapsed(index + 1);

  let asked: ReadonlyArray<number> | undefined;

  const commit = (next: ReadonlyArray<number>): void => {
    const fitted = fit(next);
    asked = fitted;
    request(fitted);
  };

  const move = (index: number, delta: number): void => {
    if (drag !== undefined || !movable(index)) {
      return;
    }
    commit(movePair(sizes(), index, delta));
  };

  const toggle = (index: number): void => {
    const pane = panes()[index];
    if (drag !== undefined || pane?.collapsible !== true) {
      return;
    }
    if (collapsed(index)) {
      commit(shift(sizes(), index, (lastExpanded[index] ?? lowOf(index)) - (sizes()[index] ?? 0)));
    } else {
      commit(shift(sizes(), index, collapsedSize(index) - (sizes()[index] ?? 0)));
    }
  };

  const keyDown = (index: number, key: string): void => {
    if (!KEY_TAGS.has(key)) {
      return;
    }
    const vertical = orientation() === "vertical";
    switch (key) {
      case "ArrowLeft":
        if (vertical) move(index, 0 - step());
        break;
      case "ArrowRight":
        if (vertical) move(index, step());
        break;
      case "ArrowUp":
        if (!vertical) move(index, 0 - step());
        break;
      case "ArrowDown":
        if (!vertical) move(index, step());
        break;
      case "Home":
        move(index, 0 - FULL);
        break;
      case "End":
        move(index, FULL);
        break;
      default:
        toggle(index);
        break;
    }
  };

  let drag:
    | {
        readonly separator: number;
        readonly element: Element;
        readonly pointerId: number;
        readonly start: number;
        readonly axis: "x" | "y";
        readonly from: ReadonlyArray<number>;
        readonly length: number;
      }
    | undefined;

  // the axis is the separator's at pointerdown: an orientation change mid-drag
  // must not reinterpret the pointer that is already down
  const axisOf = (event: PointerEvent, axis: "x" | "y"): number =>
    axis === "x" ? event.clientX : event.clientY;

  const lengthOf = (element: Element): number => {
    const group = element.parentElement;
    if (group === null) {
      return 0;
    }
    const rect = group.getBoundingClientRect();
    return orientation() === "vertical" ? rect.width : rect.height;
  };

  const onPointerDown = (index: number, event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    // the newest pointer owns the drag: a second pointerdown takes over
    if (drag !== undefined) {
      release(drag.element, drag.pointerId);
      drag = undefined;
      setResizing(null);
    }
    setFocusSeparator(index);
    if (!movable(index)) {
      return;
    }
    const length = lengthOf(event.currentTarget as Element);
    if (length <= 0) {
      return;
    }
    const axis = orientation() === "vertical" ? "x" : "y";
    drag = {
      separator: index,
      element: event.currentTarget as Element,
      pointerId: event.pointerId,
      start: axisOf(event, axis),
      axis,
      from: sizes(),
      length,
    };
    setResizing(index);
    capture(event.currentTarget as Element, event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (drag === undefined || drag.pointerId !== event.pointerId) {
      return;
    }
    const delta = ((axisOf(event, drag.axis) - drag.start) / drag.length) * FULL;
    commit(movePair(drag.from, drag.separator, delta));
  };

  const onPointerEnd = (event: PointerEvent): void => {
    if (drag === undefined || drag.pointerId !== event.pointerId) {
      return;
    }
    drag = undefined;
    setResizing(null);
    release(event.currentTarget as Element, event.pointerId);
  };

  // a host write cancels a running drag: the layout the pointer was dragging is
  // gone (our own accepted request comes back here too, and is not a write)
  createEffect(
    () => options.sizes,
    (now) => {
      if (now === undefined || (asked !== undefined && sameSizes(now, asked))) {
        return;
      }
      drag = undefined;
      setResizing(null);
    },
  );

  if (options.storageKey !== undefined) {
    const storageKey = options.storageKey;
    createEffect(
      () => sizes(),
      (now) => writeStored(storageKey, now),
    );
  }

  const separatorProps = (index: number): ResizableSeparatorProps => ({
    id: `${base}-separator-${index}`,
    role: "separator",
    get "aria-orientation"() {
      return orientation();
    },
    get "aria-valuenow"() {
      return round2(sizes()[index] ?? 0);
    },
    get "aria-valuemin"() {
      return panes()[index]?.min ?? DEFAULT_MIN;
    },
    get "aria-valuemax"() {
      return highOf(index);
    },
    get "aria-controls"() {
      return paneId(index);
    },
    get "aria-label"() {
      const label = panes()[index]?.label;
      return label === undefined ? "Resize" : `Resize ${label}`;
    },
    tabindex: 0,
    onKeyDown: (event) => {
      if (KEY_TAGS.has(event.key)) {
        event.preventDefault();
      }
      keyDown(index, event.key);
    },
    onFocus: () => setFocusSeparator(index),
    onBlur: () => setFocusSeparator(null),
    onPointerDown: (event) => onPointerDown(index, event),
    onPointerMove,
    onPointerUp: onPointerEnd,
    onPointerCancel: onPointerEnd,
  });

  return {
    sizes,
    collapsed,
    resizing,
    focusSeparator,
    setFocusSeparator,
    keyDown,
    groupProps: {
      role: "group",
      get "aria-label"() {
        return options.label;
      },
    },
    paneProps: (index) => ({ id: paneId(index) }),
    separatorProps,
  };
};
