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
  /** The uncontrolled start; panes that leave it out share what is left equally. */
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
  /**
   * Stick the boundary to the width it is dropped at, once a few drags agree on it. Inside the zone (10 px) the edge lands
   * on the learned width while the pointer keeps moving; hold Alt for the exact width, and the keyboard never snaps. A
   * pointer nicety, like the capture and the storage: the model has no drag at all. Off by default.
   */
  readonly snap?: boolean | undefined;
  /**
   * The marks a host kept from `onSnapMark` — one list per separator, oldest first — so a preferred width survives a reload.
   * Age is a count of drags and not of days: a week without a drag moves nothing, and replaying the marks fades them exactly
   * as if they had never been put down.
   */
  readonly snapMarks?: ReadonlyArray<ReadonlyArray<number>> | undefined;
  /** Called on every release with that separator's marks (at most 24, oldest first): what a host persists. */
  readonly onSnapMark?: (index: number, marks: ReadonlyArray<number>) => void;
}

export interface ResizablePanelsGroupProps {
  readonly "data-part": string;
  readonly role: "group";
  readonly "aria-label": string | undefined;
}

export interface ResizablePaneProps {
  readonly "data-part": string;
  readonly id: string;
}

/** Spread onto the focusable `role=separator` bar between pane `index` and `index + 1`. */
export interface ResizableSeparatorProps {
  readonly "data-part": string;
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
  /** The learned width of pane `index`, in percent, or `undefined` until about three drags agree. */
  readonly snapPoint: (index: number) => number | undefined;
  readonly groupProps: ResizablePanelsGroupProps;
  readonly paneProps: (index: number) => ResizablePaneProps;
  readonly separatorProps: (index: number) => ResizableSeparatorProps;
}

const DEFAULT_MIN = 10;
/** The magnet's zone: how close to the learned width, in px, the edge sticks. */
const SNAP_ZONE = 10;
/** The histogram's grid: half a percent, the widths a pointer cannot tell apart. */
const SNAP_STEP = 0.5;
/** A mark's weight halves every five drags, so a new habit takes over within a few. */
const SNAP_DECAY = 2 ** (-1 / 5);
/** The weight of about three recent drags standing on one hill: 1 + 0.87 + 0.76. */
const SNAP_MIN = 2;
/** How many marks a separator keeps: past this a mark weighs under 0.05, which no hill can use. */
const SNAP_MARKS = 24;

/** The bucket a width falls in: half a percent, the distance a pointer cannot tell apart. */
const bucketOf = (size: number): number => Math.round(size / SNAP_STEP) * SNAP_STEP;

/** The hills of one separator, rebuilt from its marks (oldest first): a mark weighs half as much every five behind it. */
const tallestHill = (marks: ReadonlyArray<number>): number | undefined => {
  const hills = new Map<number, number>();
  const newest = marks.length - 1;
  marks.forEach((size, position) => {
    const at = bucketOf(size);
    hills.set(at, (hills.get(at) ?? 0) + SNAP_DECAY ** (newest - position));
  });
  let best: number | undefined;
  let top = 0;
  for (const [at, weight] of hills) {
    if (weight > top) {
      top = weight;
      best = at;
    }
  }
  return top < SNAP_MIN ? undefined : best;
};
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
 * With `snap` on, a release leaves a mark and the boundary sticks to the width
 * the marks agree on: a histogram on a half-percent grid, a mark's weight
 * halving every five drags, a point only once about three recent drags stand
 * under one hill, and a point that does not move while the tallest hill stays
 * inside its zone. Alt during a drag asks for the exact width, so the widths
 * beside the point stay reachable, and `keyDown` never snaps: the keys are
 * exact by contract. The marks are the whole state — `onSnapMark` hands them to
 * a host and `snapMarks` takes them back, so the habit survives a reload. The
 * model has none of this, like the capture and the storage — it has no drag.
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

  /** The start: the sizes the panes name, and the rest shared by the panes that name none. */
  const defaults = (): ReadonlyArray<number> => {
    const named = panes().map((pane) => pane.defaultSize);
    const given = named.reduce<number>((sum, value) => sum + (value ?? 0), 0);
    const open = named.filter((value) => value === undefined).length;
    const share = open === 0 ? 0 : round2((FULL - given) / open);
    return named.map((value) => value ?? share);
  };

  const initialSizes = (): ReadonlyArray<number> => {
    const stored =
      options.storageKey === undefined ? undefined : readStored(options.storageKey, count());
    return fit(stored ?? options.defaultSizes ?? defaults());
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
  // The learned widths: the widths each separator was dropped at, oldest first, and the point the magnet uses. The marks
  // are the whole state — the hills are rebuilt from them, so a host that keeps `onSnapMark` gets the same habit back.
  const kept = options.snap === true ? (options.snapMarks ?? []) : [];
  const marks: Array<ReadonlyArray<number>> = kept.map((list) => [...list].slice(-SNAP_MARKS));
  const [snapPoints, setSnapPoints] = createSignal<ReadonlyArray<number | undefined>>(
    marks.map((list) => tallestHill(list)),
  );
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

  /** The magnet's zone in percent, from the group's own length: a zone in percent would be 200 px on a wide group. */
  const zonePercent = (length: number): number | undefined =>
    options.snap === true && length > 0 ? (SNAP_ZONE / length) * FULL : undefined;

  /**
   * A release is a mark. The point is the tallest hill once about three recent drags stand under it, and it is sticky: a
   * winner already inside the old point's zone leaves the point where it is, so it cannot drift a pixel with every drag.
   */
  const learn = (index: number, size: number, length: number): void => {
    const zone = zonePercent(length);
    if (zone === undefined) {
      return;
    }
    const list = [...(marks[index] ?? []), size].slice(-SNAP_MARKS);
    marks[index] = list;
    const best = tallestHill(list);
    const current = snapPoints()[index];
    const next =
      best === undefined || (current !== undefined && Math.abs(best - current) <= zone)
        ? current
        : best;
    if (next !== current) {
      setSnapPoints((all) => {
        const copy = [...all];
        copy[index] = next;
        return copy;
      });
    }
    options.onSnapMark?.(index, list);
  };

  /** The magnet: an edge inside the zone lands on the learned width. Alt asks for the exact width and the keys never snap. */
  const magnet = (
    index: number,
    next: ReadonlyArray<number>,
    length: number,
    bypass: boolean,
  ): ReadonlyArray<number> => {
    const point = snapPoints()[index];
    const zone = zonePercent(length);
    if (bypass || point === undefined || zone === undefined) {
      return next;
    }
    const size = next[index] ?? 0;
    return Math.abs(size - point) > zone ? next : movePair(next, index, point - size);
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
    const moved = movePair(drag.from, drag.separator, delta);
    commit(magnet(drag.separator, moved, drag.length, event.altKey));
  };

  const onPointerEnd = (event: PointerEvent): void => {
    if (drag === undefined || drag.pointerId !== event.pointerId) {
      return;
    }
    const ended = drag;
    drag = undefined;
    setResizing(null);
    release(event.currentTarget as Element, event.pointerId);
    const size = sizes()[ended.separator] ?? 0;
    // a click is not a drag: nothing moved, so there is no mark to leave
    if (size !== (ended.from[ended.separator] ?? 0)) {
      learn(ended.separator, size, ended.length);
    }
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
    "data-part": "separator",
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
    snapPoint: (index) => snapPoints()[index],
    groupProps: {
      "data-part": "group",
      role: "group",
      get "aria-label"() {
        return options.label;
      },
    },
    paneProps: (index) => ({ "data-part": "pane", id: paneId(index) }),
    separatorProps,
  };
};
