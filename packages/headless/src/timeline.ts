import { type Accessor, createSignal } from "solid-js";
import { createControllable } from "./controllable";

/**
 * APG has no waterfall pattern. This is the span timeline the o11y dashboard
 * needs: spans laid out on a shared tick axis with nesting/indentation, a
 * duration ruler, single selection, per-parent collapse and a zoom window.
 *
 * State plus attribute objects, no elements, no styling. Behaviour is checked
 * against `specs/apg/timeline.qnt` by the scenario bridge, not by running the
 * generated machine here.
 *
 * Request/commit (map ticket `rt1p`): the selected row is the value. It is
 * uncontrolled by default (`defaultValue` / `defaultSelected`); pass `value` +
 * `onValueChange` to own it. `select`, a click and Enter are requests the host
 * may ignore. The zoom window (`viewStart`/`viewEnd`) is not the controlled
 * value and stays uncontrolled.
 *
 * ponytail: the fixed 5-span tree is a demo fixture; a real consumer owns the
 * span list (layout is theirs). Roving tabindex only — a consumer must call
 * `focus()` on the row whose `tabindex` is 0 after arrow navigation (the tests'
 * fixture does this with an effect).
 */

/** One span row: a fraction of the parent span on a shared 0..1 axis. */
export interface TimelineRow {
  readonly id: number;
  readonly level: number;
  readonly parent: number;
  readonly start: number;
  readonly end: number;
  /** A parent whose children are hidden. */
  readonly collapsed: boolean;
}

export interface TimelineOptions {
  /** Node ids whose children start expanded. */
  readonly defaultExpanded?: ReadonlyArray<number>;
  /** Controlled: the host owns the selection and this is the only thing that changes it. */
  readonly value?: number | undefined;
  /** Uncontrolled starting selection (0 = none); alias of `defaultSelected`. */
  readonly defaultValue?: number;
  /** Initially selected node id (0 = none). */
  readonly defaultSelected?: number;
  readonly viewStart?: number;
  readonly viewEnd?: number;
  /** Base for generated ids. */
  readonly id?: string;
  /**
   * A request to change the selection, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: (id: number) => void;
  /** Alias of `onValueChange`. */
  readonly onSelectedChange?: (id: number) => void;
}

export interface TimelineTreeProps {
  readonly role: "tree";
  readonly "aria-label": string;
  readonly "aria-multiselectable": "false";
}

export interface TimelineRowProps {
  readonly role: "treeitem";
  readonly "aria-level": number;
  /** Absent on leaves, like treeview's aria-expanded. */
  readonly "aria-expanded": "true" | "false" | undefined;
  readonly "aria-selected": "true" | "false";
  readonly tabindex: number;
  readonly hidden: boolean;
  readonly onClick: () => void;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

/** The zoom window as a slider over the fixed 0..100 tick domain. */
export interface TimelineRulerProps {
  readonly role: "slider";
  readonly "aria-label": string;
  readonly "aria-valuemin": number;
  readonly "aria-valuenow": number;
  readonly "aria-valuemax": number;
}

export interface Timeline {
  readonly rows: () => ReadonlyArray<TimelineRow>;
  readonly zoom: () => { readonly start: number; readonly end: number };
  readonly selected: Accessor<number>;
  readonly focus: () => number;
  readonly hasFocus: () => boolean;
  /** Programmatic selection request; a controlled host may ignore it. */
  readonly select: (id: number) => void;
  readonly setFocus: (id: number) => void;
  readonly expand: (id: number) => void;
  readonly collapse: (id: number) => void;
  readonly toggle: (id: number) => void;
  readonly zoomIn: () => void;
  readonly zoomOut: () => void;
  readonly zoomReset: () => void;
  readonly panLeft: () => void;
  readonly panRight: () => void;
  readonly treeProps: TimelineTreeProps;
  readonly rowProps: (id: number) => TimelineRowProps;
  readonly rulerProps: TimelineRulerProps;
}

const LAST_NODE = 5;
const DOMAIN_MIN = 0;
const DOMAIN_MAX = 100;
const MIN_WIDTH = 10;

interface Node {
  readonly id: number;
  readonly level: number;
  readonly parent: number;
  readonly start: number;
  readonly end: number;
}

const NODES: ReadonlyArray<Node> = [
  { id: 1, level: 1, parent: 0, start: 0, end: 1 },
  { id: 2, level: 2, parent: 1, start: 0, end: 0.6 },
  { id: 3, level: 3, parent: 2, start: 0, end: 0.3 },
  { id: 4, level: 3, parent: 2, start: 0.3, end: 0.6 },
  { id: 5, level: 2, parent: 1, start: 0.6, end: 1 },
];

const weight = (n: number): number => 2 ** (n - 1);
// index = node id; 0 = no parent / no children
const PARENT_OF: ReadonlyArray<number> = [0, 0, 1, 2, 2, 1];
const FIRST_CHILD: ReadonlyArray<number> = [0, 2, 3, 0, 0, 0];
const parentOf = (n: number): number => PARENT_OF[n] ?? 0;
const firstChild = (n: number): number => FIRST_CHILD[n] ?? 0;
const isParent = (n: number): boolean => firstChild(n) !== 0;
const bit = (mask: number, n: number): boolean => (mask & weight(n)) !== 0;
const setBit = (mask: number, n: number, on: boolean): number =>
  bit(mask, n) === on ? mask : on ? mask + weight(n) : mask - weight(n);
const toggleBit = (mask: number, n: number): number => setBit(mask, n, !bit(mask, n));

const parentOpen = (n: number, expanded: number): boolean =>
  parentOf(n) === 0 || bit(expanded, parentOf(n));
const visible = (n: number, expanded: number): boolean =>
  n >= 1 && n <= LAST_NODE && parentOpen(n, expanded) && parentOpen(parentOf(n), expanded);

const visibleAfter = (n: number, k: number, e: number): boolean =>
  n + k <= LAST_NODE && visible(n + k, e);
const visibleBefore = (n: number, k: number, e: number): boolean => n - k >= 1 && visible(n - k, e);

const nextVisible = (n: number, e: number): number =>
  visibleAfter(n, 1, e)
    ? n + 1
    : visibleAfter(n, 2, e)
      ? n + 2
      : visibleAfter(n, 3, e)
        ? n + 3
        : visibleAfter(n, 4, e)
          ? n + 4
          : n;

const prevVisible = (n: number, e: number): number =>
  visibleBefore(n, 1, e)
    ? n - 1
    : visibleBefore(n, 2, e)
      ? n - 2
      : visibleBefore(n, 3, e)
        ? n - 3
        : visibleBefore(n, 4, e)
          ? n - 4
          : n;

const lastVisible = (e: number): number =>
  visible(5, e) ? 5 : visible(4, e) ? 4 : visible(3, e) ? 3 : visible(2, e) ? 2 : 1;

const width = (start: number, end: number): number => end - start;

// shrink by a quarter, never below the minimum width
const shrink = (x: number): number =>
  x <= MIN_WIDTH ? x : x - Math.floor(x / 4) < MIN_WIDTH ? MIN_WIDTH : x - Math.floor(x / 4);

// grow by a quarter, never past the domain
const grow = (x: number): number =>
  x >= DOMAIN_MAX ? x : x + Math.floor(x / 4) > DOMAIN_MAX ? DOMAIN_MAX : x + Math.floor(x / 4);

const clampStart = (start: number, w: number): number =>
  start < DOMAIN_MIN ? DOMAIN_MIN : start + w > DOMAIN_MAX ? DOMAIN_MAX - w : start;

/**
 * Headless span timeline on Solid 2. The exported accessors are signals; the
 * prop objects are getter-backed, so spreading them keeps every attribute
 * reactive.
 */
export const createTimeline = (options: TimelineOptions = {}): Timeline => {
  const initialExpanded = (options.defaultExpanded ?? []).reduce(
    (mask, node) => setBit(mask, node, true),
    0,
  );
  const [expanded, setExpanded] = createSignal(initialExpanded);
  const [selected, requestSelected] = createControllable({
    value: () => options.value,
    initial: options.defaultValue ?? options.defaultSelected ?? 0,
    onChange: () => options.onValueChange ?? options.onSelectedChange,
  });
  const [focus, setFocusValue] = createSignal(1);
  const [hasFocus, setHasFocus] = createSignal(false);
  const [viewStart, setViewStart] = createSignal(options.viewStart ?? DOMAIN_MIN);
  const [viewEnd, setViewEnd] = createSignal(options.viewEnd ?? DOMAIN_MAX);

  const isVisible = (id: number): boolean => visible(id, expanded());

  const select = (id: number): void => {
    requestSelected(id);
  };

  const setFocus = (id: number): void => {
    setFocusValue(id);
    setHasFocus(true);
  };

  const applyWindow = (start: number, w: number): void => {
    setViewStart(start);
    setViewEnd(start + w);
  };

  const zoomIn = (): void => {
    const w = width(viewStart(), viewEnd());
    const next = shrink(w);
    const start = clampStart(viewStart() + Math.floor((w - next) / 2), next);
    applyWindow(start, next);
  };

  const zoomOut = (): void => {
    const w = width(viewStart(), viewEnd());
    const next = grow(w);
    const start = clampStart(viewStart() - Math.floor((next - w) / 2), next);
    applyWindow(start, next);
  };

  const zoomReset = (): void => applyWindow(DOMAIN_MIN, DOMAIN_MAX - DOMAIN_MIN);

  const panLeft = (): void => {
    const w = width(viewStart(), viewEnd());
    applyWindow(clampStart(viewStart() - Math.floor(w / 4), w), w);
  };

  const panRight = (): void => {
    const w = width(viewStart(), viewEnd());
    applyWindow(clampStart(viewStart() + Math.floor(w / 4), w), w);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!hasFocus()) {
      return;
    }
    const f = focus();
    const e = expanded();
    switch (event.key) {
      case "ArrowDown":
        setFocus(nextVisible(f, e));
        break;
      case "ArrowUp":
        setFocus(prevVisible(f, e));
        break;
      case "ArrowRight":
        if (isParent(f) && !bit(e, f)) {
          setExpanded(setBit(e, f, true));
        } else if (isParent(f)) {
          setFocus(firstChild(f));
        } else {
          return;
        }
        break;
      case "ArrowLeft":
        if (isParent(f) && bit(e, f)) {
          setExpanded(setBit(e, f, false));
        } else if (parentOf(f) !== 0) {
          setFocus(parentOf(f));
        } else {
          return;
        }
        break;
      case "Home":
        setFocus(1);
        break;
      case "End":
        setFocus(lastVisible(e));
        break;
      case "Enter":
        select(f);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return {
    rows: () =>
      NODES.map((node) => ({
        id: node.id,
        level: node.level,
        parent: node.parent,
        start: node.start,
        end: node.end,
        get collapsed() {
          return isParent(node.id) ? !bit(expanded(), node.id) : false;
        },
      })),
    zoom: () => ({ start: viewStart(), end: viewEnd() }),
    selected,
    focus,
    hasFocus,
    select,
    setFocus,
    expand: (id) => setExpanded((mask) => setBit(mask, id, true)),
    collapse: (id) => setExpanded((mask) => setBit(mask, id, false)),
    toggle: (id) => setExpanded((mask) => toggleBit(mask, id)),
    zoomIn,
    zoomOut,
    zoomReset,
    panLeft,
    panRight,
    treeProps: {
      role: "tree",
      "aria-label": "Span timeline",
      "aria-multiselectable": "false",
    },
    rowProps: (id) => ({
      role: "treeitem",
      "aria-level": NODES.find((node) => node.id === id)?.level ?? 1,
      get "aria-expanded"() {
        return isParent(id) ? (bit(expanded(), id) ? "true" : "false") : undefined;
      },
      get "aria-selected"() {
        return selected() === id ? "true" : "false";
      },
      get tabindex() {
        return focus() === id ? 0 : -1;
      },
      get hidden() {
        return !isVisible(id);
      },
      onClick: () => {
        if (!isVisible(id)) {
          return;
        }
        if (isParent(id)) {
          setExpanded((mask) => toggleBit(mask, id));
        }
        select(id);
        setFocus(id);
      },
      onFocus: () => {
        setFocusValue(id);
        setHasFocus(true);
      },
      onBlur: () => setHasFocus(false),
      onKeyDown,
    }),
    rulerProps: {
      role: "slider",
      "aria-label": "Visible time range",
      get "aria-valuemin"() {
        return viewStart();
      },
      get "aria-valuenow"() {
        return viewStart();
      },
      get "aria-valuemax"() {
        return viewEnd();
      },
    },
  };
};
