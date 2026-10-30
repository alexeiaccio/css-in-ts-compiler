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
 * The fixed 5-span tree is the demo fixture (the differential walk's oracle).
 * A real consumer passes `rows`: span data on one shared axis, laid out by
 * `barProps` as percentages of the rows' extent. No roles are borrowed from
 * APG: a trace waterfall is a list of spans in time, so the rows mode is
 * `role="list"` / `role="listitem"` (with `aria-level` for the depth) and the
 * current row is `aria-current="true"`, which every element may carry.
 *
 * Roving tabindex only — a consumer must call `focus()` on the row whose
 * `tabindex` is 0 after arrow navigation (the tests' fixture does this with an
 * effect; the rows mode's span rows are reached by tabbing to the current one).
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

/** One span of a real trace: a point on a shared axis, labelled, at a depth. */
export interface TimelineSpan {
  readonly id: string;
  readonly label: string;
  /** Offset on the axis, in the axis' unit; `end` is the same axis, not a duration. */
  readonly start: number;
  readonly end: number;
  /** Nesting level, 0 for a root span. */
  readonly depth?: number;
  readonly status?: "ok" | "error" | "unset";
}

export interface TimelineAxis {
  /** The unit the numbers are in; the ruler labels its ticks with it. */
  readonly unit?: "ms" | "us" | "s";
}

/** The rows mode: real span data, read lazily like every other option. */
export interface TimelineRowsOptions {
  readonly rows: ReadonlyArray<TimelineSpan>;
  readonly axis?: TimelineAxis | undefined;
  /** Controlled: the host owns the selection. */
  readonly selected?: string | undefined;
  /** A request to change the selection the host may ignore. */
  readonly onSelect?: ((id: string) => void) | undefined;
}

export interface TimelineTick {
  readonly value: number;
  readonly left: number;
  readonly label: string;
}

export interface TimelineListProps {
  readonly role: "list";
  readonly "aria-label": string;
}

export interface TimelineSpanRowProps {
  readonly role: "listitem";
  /** `depth + 1`: the nesting a flat list cannot show in the DOM. */
  readonly "aria-level": number;
  readonly "aria-current": "true" | undefined;
  /** A styling hook: the status the span ended with. */
  readonly "data-status": "ok" | "error" | "unset";
  readonly tabindex: number;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface TimelineBarProps {
  readonly "aria-hidden": "true";
  /** `left` / `width` are percentages of the extent; `--depth` is the row's depth. */
  readonly style: {
    readonly left: string;
    readonly width: string;
    readonly "--depth": string;
  };
}

export interface TimelineLabelProps {
  /** `--depth`, so the host indents the label (`padding-inline-start: calc(var(--depth) * 1rem)`) instead of nesting it. */
  readonly style: { readonly "--depth": string };
}

export interface TimelineRulerRowsProps {
  readonly role: "presentation";
  readonly "aria-hidden": "true";
  /** Ticks of a nice step across the extent; render them as children. */
  readonly ticks: ReadonlyArray<TimelineTick>;
}

export interface TimelineRows {
  /** `{ start, end }` across the rows; `{ 0, 0 }` when there are none. */
  readonly extent: () => { readonly start: number; readonly end: number };
  readonly depthOf: (id: string) => number;
  readonly listProps: TimelineListProps;
  readonly rowProps: (id: string) => TimelineSpanRowProps;
  readonly barProps: (id: string) => TimelineBarProps;
  readonly labelProps: (id: string) => TimelineLabelProps;
  readonly rulerProps: TimelineRulerRowsProps;
  /** Programmatic selection request; a controlled host may ignore it. */
  readonly select: (id: string) => void;
  readonly selectedId: Accessor<string | undefined>;
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
 * The demo tree: five fixed spans, collapsing, zoom. Its oracle is
 * `specs/apg/timeline.qnt` through the differential walk.
 */
const createDemoTimeline = (options: TimelineOptions = {}): Timeline => {
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

/** A zero-length span still paints: at least half a percent of the track. */
const MIN_BAR_WIDTH = 0.5;
/** Aim for about five ticks, whatever the extent. */
const TICK_TARGET = 5;

const percent = (value: number): string => `${Math.round(value * 1000) / 1000}%`;

/** 1, 2 or 5 times a power of ten, the step that makes the fewest labels fit. */
const niceStep = (span: number): number => {
  const raw = span / TICK_TARGET;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return factor * magnitude;
};

const formatTick = (value: number, step: number, unit: string): string => {
  const decimals = step >= 1 ? 0 : Math.min(6, Math.ceil(-Math.log10(step)));
  return `${value.toFixed(decimals)} ${unit}`;
};

/**
 * The rows mode: real span data on one axis. Everything hangs off `options.rows`
 * read at attribute-read time, so the host may pass a getter and a trace may
 * arrive after mount.
 */
const createRowsTimeline = (options: TimelineRowsOptions): TimelineRows => {
  const rows = (): ReadonlyArray<TimelineSpan> => options.rows;
  // ponytail: a linear scan per attribute read; a Map over a thousand-span
  // trace if that ever shows up in a profile.
  const rowOf = (id: string): TimelineSpan => {
    const row = rows().find((candidate) => candidate.id === id);
    if (row === undefined) {
      throw new Error(`createTimeline: no row ${id}`);
    }
    return row;
  };
  const [selectedId, requestSelected] = createControllable<string | undefined>({
    value: () => options.selected,
    initial: undefined,
    onChange: () => (id) => {
      if (id !== undefined) {
        options.onSelect?.(id);
      }
    },
  });
  const [focus, setFocus] = createSignal<string | undefined>(undefined);
  const currentFocus = (): string | undefined => focus() ?? rows()[0]?.id;

  const select = (id: string): void => {
    requestSelected(id);
  };

  const extent = (): { readonly start: number; readonly end: number } => {
    let start = Number.POSITIVE_INFINITY;
    let end = Number.NEGATIVE_INFINITY;
    for (const row of rows()) {
      start = Math.min(start, row.start);
      end = Math.max(end, row.end);
    }
    return start <= end ? { start, end } : { start: 0, end: 0 };
  };

  const ticks = (): ReadonlyArray<TimelineTick> => {
    const list = rows();
    if (list.length === 0) {
      return [];
    }
    const { start, end } = extent();
    const unit = options.axis?.unit ?? "ms";
    const span = end - start;
    if (!(span > 0)) {
      return [{ value: start, left: 0, label: formatTick(start, 1, unit) }];
    }
    const step = niceStep(span);
    const out: TimelineTick[] = [];
    for (let value = Math.ceil(start / step) * step; value <= end; value += step) {
      out.push({
        value,
        left: ((value - start) / span) * 100,
        label: formatTick(value, step, unit),
      });
    }
    return out;
  };

  const barStyle = (id: string): TimelineBarProps["style"] => {
    const row = rowOf(id);
    const depth = String(row.depth ?? 0);
    const { start, end } = extent();
    const span = end - start;
    if (!(span > 0)) {
      return { left: "0%", width: percent(MIN_BAR_WIDTH), "--depth": depth };
    }
    const left = Math.max(0, ((row.start - start) / span) * 100);
    const width = Math.max(MIN_BAR_WIDTH, ((row.end - row.start) / span) * 100);
    return { left: percent(left), width: percent(width), "--depth": depth };
  };

  const onKeyDown = (id: string, event: KeyboardEvent): void => {
    const list = rows();
    const index = list.findIndex((row) => row.id === id);
    switch (event.key) {
      case "ArrowDown":
        setFocus(list[Math.min(index + 1, list.length - 1)]?.id);
        break;
      case "ArrowUp":
        setFocus(list[Math.max(index - 1, 0)]?.id);
        break;
      case "Home":
        setFocus(list[0]?.id);
        break;
      case "End":
        setFocus(list[list.length - 1]?.id);
        break;
      case "Enter":
      case " ":
        select(id);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return {
    extent,
    depthOf: (id) => rowOf(id).depth ?? 0,
    listProps: {
      role: "list",
      "aria-label": "Span timeline",
    },
    rowProps: (id) => ({
      role: "listitem",
      get "aria-level"() {
        return (rowOf(id).depth ?? 0) + 1;
      },
      get "aria-current"() {
        return selectedId() === id ? "true" : undefined;
      },
      get "data-status"() {
        return rowOf(id).status ?? "unset";
      },
      get tabindex() {
        return currentFocus() === id ? 0 : -1;
      },
      onClick: () => {
        setFocus(id);
        select(id);
      },
      onKeyDown: (event) => onKeyDown(id, event),
    }),
    barProps: (id) => ({
      "aria-hidden": "true",
      get style() {
        return barStyle(id);
      },
    }),
    labelProps: (id) => ({
      get style() {
        return { "--depth": String(rowOf(id).depth ?? 0) };
      },
    }),
    rulerProps: {
      role: "presentation",
      "aria-hidden": "true",
      get ticks() {
        return ticks();
      },
    },
    select,
    selectedId,
  };
};

/** The demo five-span tree (`rows` absent) or real span data (`rows` given). */
export function createTimeline(options: TimelineRowsOptions): TimelineRows;
export function createTimeline(options?: TimelineOptions): Timeline;
export function createTimeline(
  options: TimelineOptions | TimelineRowsOptions = {},
): Timeline | TimelineRows {
  return "rows" in options ? createRowsTimeline(options) : createDemoTimeline(options);
}
