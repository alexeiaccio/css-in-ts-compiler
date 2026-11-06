/**
 * The platform layer of `focusgroup="grid"` (V2): two-dimensional directional
 * navigation over a rectangular body, one tab stop, entry / memory — the
 * contract `specs/patterns/focusgrid.qnt` models, and the runtime of its page.
 *
 * **Why we own it.** V2 exists only in the Open UI explainer (last updated
 * 2026-08-10) and in `microsoft/polyfills`' `main` (grid merged 2026-09-29,
 * `focusgroupstart` honoured 2026-10-23). No browser ships it, and npm's latest
 * `@microsoft/focusgroup-polyfill` is still 1.6.0 (2026-07-30), whose token table
 * has no `grid`, no `focusgrouprow` and no grid item collection — its low-level
 * `FocusGroup` with a plain collection navigates a `grid` definition **linearly**.
 * `main` has no built `dist`, so it cannot even be a git dependency. So this file
 * is the runtime; its attribute is the explainer's, and the day a browser or the
 * polyfill ships V2 the same definition renders the attribute the platform reads
 * (`supportsFocusGrid` decides, and this file then writes only the attribute).
 *
 * **One definition, two providers**, exactly like the V1 adapter in
 * `./focusgroup`:
 * - native (`focusGroup.supports("grid")`): the owner gets the `focusgroup`
 *   attribute (and, for `manual`, its rows `focusgrouprow`) and the browser owns
 *   the movement and the tab stop. It writes no `tabindex` of ours, so the host
 *   authors one per cell target, as the explainer's markup does.
 * - otherwise: this file renders the tab stop as `tabindex="0"` / `"-1"` over
 *   the authors' values, and moves focus itself on `keydown`.
 *
 * **What it owns:** the attribute string, the single tab stop, the arrows on
 * both axes, Home / End (row ends) and Ctrl+Home / Ctrl+End (grid ends), the
 * per-axis `wrap` / `flow` edges, the key-conflict guard of a native control,
 * `focusgroupstart` as the entry target, the last-focused memory and `nomemory`,
 * and the `focusgrouprow` markers of a `manual` topology.
 *
 * **What stays the widget's** (`specs/apg/grid.qnt`, `./grid`): spans, ragged
 * rows and gaps (an invalid body here is inert — the explainer's rule), the
 * mount window (virtualisation), edit mode, selection, sort, activation,
 * PageUp / PageDown (a grid defines no page movement), `itemcontrols` (default
 * for a grid, unsupported upstream, so nested controls are not filtered),
 * `aria-rowindex` / `aria-colindex` / role inference, and Tab / Shift+Tab
 * (HTML sequential navigation, which this file only observes as focusout).
 *
 * **Discipline** (the same as `./focusgroup`): no `MutationObserver` — the host
 * re-collects and calls `update()`; `destroy()` restores the authors' `tabindex`
 * values and removes the markers it added; the keydown listener is registered on
 * the owner here, so a host that must consume a key first registers its own
 * listener **before** calling `focusGrid` (a delegated Solid `onKeyDown` runs at
 * the document, too late).
 *
 * **Not modelled:** writing modes and RTL (inline/block follow the owner's
 * computed writing mode in the explainer; this runtime assumes left-to-right,
 * horizontal-tb, like `shared/focusgroup.qnt`); a cell target that is not the
 * item element is the topology's business only through `FocusGridItem.cell`.
 */

/** An edge of one axis: hard (`none`), the opposite end of the same row/column, or the next one. */
export type FocusGridEdge = "none" | "wrap" | "flow";

/**
 * The grid's definition: what the `focusgroup` attribute says, resolved. The
 * token grammar's broad `wrap` / `flow` are the two edges at once, and its
 * conflicts (`wrap flow`, `nowrap` with either) cannot arise because the edges
 * are passed per axis; `focusgridAttribute` emits the narrow canonical tokens.
 */
export interface FocusGridDefinition {
  /** `grid manual`: the rows are `focusgrouprow` children, not a native table. */
  readonly manual?: boolean;
  /** The INLINE edges, when a command passes a row's first or last cell (`rowwrap` / `rowflow`). */
  readonly rowEdge?: FocusGridEdge;
  /** The BLOCK edges, when a command passes a column's first or last row (`colwrap` / `colflow`). */
  readonly colEdge?: FocusGridEdge;
  /** `false` emits `nomemory`: focus leaves on `focusgroupstart` again. */
  readonly memory?: boolean;
}

/** One coordinate of the body: its cell target, and the cell when the target is a descendant. */
export interface FocusGridItem {
  /** The cell target: the focusable element that represents the coordinate. */
  readonly element: HTMLElement;
  readonly row: number;
  readonly col: number;
  /**
   * The cell element when `element` is a descendant of it; its parent is the row
   * the `focusgrouprow` marker goes on. Defaults to `element`.
   */
  readonly cell?: HTMLElement;
}

export interface FocusGridOptions {
  readonly definition: FocusGridDefinition;
  /**
   * The body's coordinates, read at construction and again on every `update()`.
   * Row and column are 0-based and dense: the body must be rectangular (every
   * row the same non-zero length, each coordinate once) or the runtime decorates
   * nothing and moves nothing, which is what the explainer says about an invalid
   * grid. The host owns the topology; this runtime never discovers it.
   */
  readonly items: () => ReadonlyArray<FocusGridItem>;
}

export interface FocusGridHandle {
  /** The `focusgroup` attribute string of the definition at construction (`"grid manual rowwrap"`). */
  readonly attribute: string;
  /**
   * Re-collect the items and re-apply the definition. Call it when a row or cell
   * is added or removed, when `focusgroupstart` moves, and when the definition
   * changes; the adapter observes nothing.
   */
  readonly update: (definition?: FocusGridDefinition) => void;
  /** Remove the attribute and the row markers, restore the authors' `tabindex`, release the listeners. Idempotent. */
  readonly destroy: () => void;
}

/**
 * The `focusgroup` attribute a definition maps to: the behavior token, `manual`,
 * then one narrow edge token per axis that is not hard, then `nomemory`. A grid's
 * edges are hard by default (the explainer: wrapping "can disorient users in data
 * grids"), so a hard axis emits nothing; the result is canonical, never `wrap`.
 */
export const focusgridAttribute = (definition: FocusGridDefinition): string => {
  const tokens: string[] = ["grid"];
  if (definition.manual === true) {
    tokens.push("manual");
  }
  if (definition.rowEdge === "wrap") {
    tokens.push("rowwrap");
  } else if (definition.rowEdge === "flow") {
    tokens.push("rowflow");
  }
  if (definition.colEdge === "wrap") {
    tokens.push("colwrap");
  } else if (definition.colEdge === "flow") {
    tokens.push("colflow");
  }
  if (definition.memory === false) {
    tokens.push("nomemory");
  }
  return tokens.join(" ");
};

/**
 * Whether the engine implements V2 grid itself: `focusGroup` exists and its
 * `DOMTokenList.supports()` knows `grid` (and `manual`, for a manual topology).
 * No engine does as of the pins in `specs/patterns/focusgrid.qnt`.
 */
export const supportsFocusGrid = (manual = false): boolean => {
  if (!("focusGroup" in HTMLElement.prototype)) {
    return false;
  }
  const probe = document.createElement("div") as HTMLElement & {
    readonly focusGroup?: { readonly supports?: (token: string) => boolean };
  };
  const api = probe.focusGroup;
  if (typeof api?.supports !== "function" || !api.supports("grid")) {
    return false;
  }
  return !manual || api.supports("manual");
};

/** The body's shape, once the coordinates are known to be a rectangle. */
interface Geometry {
  readonly rows: number;
  readonly cols: number;
  /** Row-major: `row * cols + col`. */
  readonly cells: ReadonlyArray<FocusGridItem>;
}

/** The rectangle the coordinates describe, or `null` when they do not describe one. */
const geometryOf = (items: ReadonlyArray<FocusGridItem>): Geometry | null => {
  if (items.length === 0) {
    return null;
  }
  let rows = 0;
  let cols = 0;
  for (const item of items) {
    if (
      !Number.isInteger(item.row) ||
      !Number.isInteger(item.col) ||
      item.row < 0 ||
      item.col < 0
    ) {
      return null;
    }
    rows = Math.max(rows, item.row + 1);
    cols = Math.max(cols, item.col + 1);
  }
  if (rows * cols !== items.length) {
    return null;
  }
  const cells = new Array<FocusGridItem | undefined>(rows * cols);
  for (const item of items) {
    const index = item.row * cols + item.col;
    if (cells[index] !== undefined) {
      return null;
    }
    cells[index] = item;
  }
  return cells.every((cell) => cell !== undefined)
    ? { rows, cols, cells: cells as FocusGridItem[] }
    : null;
};

/** The same landing math as `specs/patterns/focusgrid.qnt` (`inlineLand`, `blockLand`). */
const inlineLand = (index: number, d: number, geometry: Geometry, edge: FocusGridEdge): number => {
  const row = Math.floor(index / geometry.cols);
  const col = index % geometry.cols;
  if (col + d >= 0 && col + d < geometry.cols) {
    return index + d;
  }
  if (edge === "none") {
    return index;
  }
  if (edge === "wrap") {
    return row * geometry.cols + (d > 0 ? 0 : geometry.cols - 1);
  }
  const nextRow = row + d < 0 ? geometry.rows - 1 : row + d < geometry.rows ? row + d : 0;
  return nextRow * geometry.cols + (d > 0 ? 0 : geometry.cols - 1);
};

const blockLand = (index: number, d: number, geometry: Geometry, edge: FocusGridEdge): number => {
  const row = Math.floor(index / geometry.cols);
  const col = index % geometry.cols;
  if (row + d >= 0 && row + d < geometry.rows) {
    return index + d * geometry.cols;
  }
  if (edge === "none") {
    return index;
  }
  if (edge === "wrap") {
    return (d > 0 ? 0 : geometry.rows - 1) * geometry.cols + col;
  }
  const nextCol = col + d < 0 ? geometry.cols - 1 : col + d < geometry.cols ? col + d : 0;
  return (d > 0 ? 0 : geometry.rows - 1) * geometry.cols + nextCol;
};

/** Where a command lands: the row's ends, the grid's ends, or one step along an axis. */
const land = (
  key: string,
  index: number,
  geometry: Geometry,
  definition: FocusGridDefinition,
): number => {
  const row = Math.floor(index / geometry.cols);
  if (key === "Home") {
    return row * geometry.cols;
  }
  if (key === "End") {
    return row * geometry.cols + geometry.cols - 1;
  }
  const d =
    key === "ArrowRight" || key === "ArrowDown"
      ? 1
      : key === "ArrowLeft" || key === "ArrowUp"
        ? -1
        : 0;
  if (d === 0) {
    return index;
  }
  return key === "ArrowLeft" || key === "ArrowRight"
    ? inlineLand(index, d, geometry, definition.rowEdge ?? "none")
    : blockLand(index, d, geometry, definition.colEdge ?? "none");
};

/**
 * A native control keeps the keys its own behaviour claims: an `<input>` (except
 * a checkbox or radio), `<textarea>`, `<select>`, a `contenteditable`, an
 * `<iframe>` / `<object>`, a `<video>` / `<audio>` with controls. The same list
 * `shared/focusgroup.qnt` records for V1 and the polyfill guards.
 */
const isKeyConflict = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  if (target instanceof HTMLInputElement) {
    return target.type !== "checkbox" && target.type !== "radio";
  }
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return true;
  }
  if (target instanceof HTMLMediaElement) {
    return target.hasAttribute("controls");
  }
  return target.tagName === "IFRAME" || target.tagName === "OBJECT";
};

/**
 * Attach the V2 grid contract to `owner` with the best provider the engine has.
 * Call it once the owner element exists (a Solid `ref`, `onMount`), with an
 * `items` reader that answers from the live DOM; then call `update()` whenever
 * the body, the markers or the definition change.
 */
export const focusGrid = (owner: HTMLElement, options: FocusGridOptions): FocusGridHandle => {
  let definition = options.definition;
  let attribute = focusgridAttribute(definition);
  const native = supportsFocusGrid(definition.manual === true);
  const abort = new AbortController();
  const authors = new Map<HTMLElement, string | null>();
  const markers = new Set<HTMLElement>();
  let current: HTMLElement | null = null;
  let destroyed = false;

  owner.setAttribute("focusgroup", attribute);

  const startItem = (items: ReadonlyArray<FocusGridItem>): HTMLElement | null => {
    const marked = items.find((item) => item.element.hasAttribute("focusgroupstart"));
    return marked?.element ?? items[0]?.element ?? null;
  };

  /** The item whose cell target is (or contains) `element`. */
  const itemOf = (items: ReadonlyArray<FocusGridItem>, element: Node): FocusGridItem | undefined =>
    items.find((item) => item.element === element || item.element.contains(element));

  /** Write the single tab stop over the authors' values, saving them once. */
  const setStop = (stop: HTMLElement, items: ReadonlyArray<FocusGridItem>): void => {
    for (const item of items) {
      if (!authors.has(item.element)) {
        authors.set(item.element, item.element.getAttribute("tabindex"));
      }
      item.element.tabIndex = item.element === stop ? 0 : -1;
    }
  };

  /** Give the authors their values back, and take back only the row markers we added. */
  const undecorate = (): void => {
    for (const [element, author] of authors) {
      if (author === null) {
        element.removeAttribute("tabindex");
      } else {
        element.setAttribute("tabindex", author);
      }
    }
    authors.clear();
    for (const row of markers) {
      row.removeAttribute("focusgrouprow");
    }
    markers.clear();
  };

  /** `focusgrouprow` marks a manual topology's rows; a native table needs none. */
  const markRows = (items: ReadonlyArray<FocusGridItem>): void => {
    const rows = new Set<HTMLElement>();
    for (const item of items) {
      const row = (item.cell ?? item.element).parentElement;
      if (row !== null) {
        rows.add(row);
      }
    }
    for (const row of [...markers]) {
      if (!rows.has(row) || definition.manual !== true) {
        row.removeAttribute("focusgrouprow");
        markers.delete(row);
      }
    }
    if (definition.manual === true) {
      for (const row of rows) {
        if (!row.hasAttribute("focusgrouprow")) {
          row.setAttribute("focusgrouprow", "");
          markers.add(row);
        }
      }
    }
  };

  const focusWithin = (): boolean => {
    const active = document.activeElement;
    return active instanceof HTMLElement && owner.contains(active);
  };

  const apply = (): void => {
    if (destroyed) {
      return;
    }
    const items = options.items();
    const geometry = geometryOf(items);
    if (geometry === null) {
      undecorate();
      return;
    }
    markRows(items);
    if (native) {
      return;
    }
    const elements = items.map((item) => item.element);
    if (current === null || !elements.includes(current)) {
      current = null;
    }
    const start = startItem(items);
    const stop = focusWithin() || definition.memory !== false ? (current ?? start) : start;
    if (stop !== null) {
      setStop(stop, items);
    }
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) {
      return;
    }
    // the command modifier is Ctrl or Meta alone: Shift/Alt (or both) never move
    const command =
      event.ctrlKey !== event.metaKey && (event.ctrlKey || event.metaKey)
        ? !event.shiftKey && !event.altKey
        : false;
    const plain = !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
    if (!plain && !command) {
      return;
    }
    const items = options.items();
    const geometry = geometryOf(items);
    if (geometry === null) {
      return;
    }
    const item = itemOf(items, event.target as Node);
    if (item === undefined || isKeyConflict(event.target)) {
      return;
    }
    const index = item.row * geometry.cols + item.col;
    const landing = command
      ? event.key === "Home"
        ? 0
        : event.key === "End"
          ? geometry.cells.length - 1
          : index
      : land(event.key, index, geometry, definition);
    // a blocked command is not consumed: the page keeps it
    if (landing === index) {
      return;
    }
    const next = geometry.cells[landing];
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    current = next.element;
    setStop(next.element, items);
    next.element.focus();
  };

  const onFocusIn = (event: FocusEvent): void => {
    const items = options.items();
    const item = itemOf(items, event.target as Node);
    if (item === undefined) {
      return;
    }
    current = item.element;
    setStop(item.element, items);
  };

  const onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget;
    if (next instanceof Node && owner.contains(next)) {
      return;
    }
    // memory keeps the stop on the cell that had focus; without it, focusgroupstart
    if (definition.memory === false) {
      const items = options.items();
      const start = startItem(items);
      if (start !== null) {
        setStop(start, items);
      }
    }
  };

  if (!native) {
    const signal = abort.signal;
    owner.addEventListener("keydown", onKeyDown, { signal });
    owner.addEventListener("focusin", onFocusIn, { signal });
    owner.addEventListener("focusout", onFocusOut, { signal });
  }
  apply();

  return {
    attribute,
    update: (next) => {
      if (destroyed) {
        return;
      }
      if (next !== undefined) {
        definition = next;
        attribute = focusgridAttribute(next);
        owner.setAttribute("focusgroup", attribute);
      }
      apply();
    },
    destroy: () => {
      if (destroyed) {
        return;
      }
      destroyed = true;
      abort.abort();
      undecorate();
      owner.removeAttribute("focusgroup");
      current = null;
    },
  };
};
