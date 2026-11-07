import {
  type Accessor,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  onSettled,
} from "solid-js";
import { createControllable } from "./controllable";
import {
  type FocusGridDefinition,
  type FocusGridHandle,
  type FocusGridItem,
  focusGrid,
  focusgridAttribute,
} from "./focusgrid";

/**
 * APG grid primitive on Solid 2: one tab stop, 2-D navigation, edit mode, a
 * cell/row/column selection rectangle and sortable column headers. State plus
 * getter-backed attribute objects; no elements, no styling.
 *
 * Platform: **hybrid**. The body's movement and its roving tab stop are the V2
 * `focusgroup="grid"` contract (`./focusgrid`, `specs/patterns/focusgrid.qnt`):
 * the owner's `ref` builds the runtime, which owns arrows on both axes, Home /
 * End (the row's ends), Ctrl+Home / Ctrl+End (the grid's), the per-axis edges,
 * the last-focused memory and WHICH cell is the tab stop. `row` / `col` are
 * readings of the DOM: the owner's `focusin` maps the focused element back to
 * its coordinate, and the host mirrors programmatic moves (`focus`, `clickCell`,
 * PageUp / PageDown, Shift+Arrow) into DOM focus, as the fixture does. The
 * library keeps the delta: edit mode (`Enter` / `F2` / `a` / `Escape`,
 * `lastEdit`), selection (`specs/apg/grid-selection.qnt`), sortable headers
 * (`specs/apg/grid-sort.qnt`), PageUp / PageDown (a grid defines no page
 * movement, so the runtime never sees those keys), the mount window and the
 * `aria-*` indices.
 *
 * **The wrap mapping is `flow`, not `wrap`.** `wrapCols` means "passing the
 * last column continues into the next row's first cell", and `wrapRows` the
 * same across rows: that is APG's *linear* wrapping (`data-wrap-cols` /
 * `data-wrap-rows` in its layout-grid example), which the runtime spells
 * `flow` — it continues into the adjacent row / column and wraps at the outer
 * edge — not `wrap`, which is the opposite end of the same row / column. So the
 * definition is `{ rowEdge: wrapCols ? "flow" : "none", colEdge: wrapRows ?
 * "flow" : "none", memory: true }`: a data grid is hard on both axes, as APG
 * says, and a layout grid flows only where its options say. `setWrapCols` /
 * `setWrapRows` / `setGridKind` re-apply it through the runtime.
 *
 * **The header row stays out of the group.** The sortable column headers keep
 * their own one-dimensional roving (`headerCol`, `onHeaderKeyDown`,
 * `grid-sort.qnt`), and the APG grid deliberately omits Up/Down between the
 * header row and the body. The runtime — and a native engine — would otherwise
 * pull them into the body's item collection, so `headerProps` marks each header
 * `focusgroup="none"` (the shared contract's opt-out). A future native V2 needs
 * a second owner, or the header segment of a `manual` topology; this primitive
 * does not invent one for the host to render.
 *
 * **The tabindex recipe.** Every cell target carries a constant author
 * `tabindex="0"` — the native engine navigates only items with `tabIndex > -1`,
 * and a `<div role="gridcell">` needs an author value to be focusable at all —
 * and the runtime writes the single stop over it (`0` / `-1`). With
 * `focusTarget: "widget"` the widget set is the item set, so the cells author
 * `-1` and the widgets `0`: exactly one of the two sets is navigable, and the
 * platform still owns which item of it is the stop. A host must not bind
 * `tabindex` reactively after these props. `focusgroupstart` rides on the
 * current coordinate (the cell, or the widget when that is the target): with
 * `memory: true` the platform prefers its own memory once focus has been
 * inside, and the marker is what the first Tab entry lands on.
 *
 * `aria-activedescendant` is still emitted for `focusTarget: "widget"` while
 * the grid holds focus. It is an announcement, not a focus model: the DOM focus
 * is real and sits on the widget.
 *
 * Behaviour mirrors `specs/apg/grid.qnt` (navigation/edit), `grid-selection.qnt`
 * (selection) and `grid-sort.qnt` (sortable headers); the generated machines are
 * the oracles in tests, not runtime dependencies.
 *
 * Request/commit (map ticket `rt1p`): navigation is internal and uncontrolled;
 * the two user-changeable values are the selection and the sort. Both are
 * uncontrolled by default (`defaultValue` / `defaultSortValue`) and can be owned
 * by the host with `value` + `onValueChange` / `sortValue` + `onSortChange`.
 * Programmatic methods (`clickCell`, `setSelectable`, `setSortEnabled` and the
 * keyboard/pointer handlers) are requests; a controlled host may ignore them.
 */

export type GridKind = "data" | "layout";
export type GridFocusTarget = "cell" | "widget";
export type GridSortDirection = "none" | "ascending" | "descending";

/** A mounted row range: rows `[start, start + count)` are rendered. */
export interface GridWindow {
  readonly start: number;
  readonly count: number;
}

export interface GridOptions {
  readonly rows?: number;
  readonly cols?: number;
  readonly gridKind?: GridKind;
  readonly wrapCols?: boolean;
  readonly wrapRows?: boolean;
  readonly focusTarget?: GridFocusTarget;
  readonly gridReadonly?: boolean;
  /** Adds cell selection (`aria-selected`) and the selection keys. */
  readonly selectable?: boolean;
  /** Adds sortable `columnheader`s (`aria-sort`). */
  readonly sortEnabled?: boolean;
  /**
   * Controlled: the host owns the selected rectangle, packed (`0` = nothing
   * selected; see `packSelection`). This is the only thing that changes it.
   */
  readonly value?: number | undefined;
  /** Uncontrolled starting packed selection; ignored while `value` is set. */
  readonly defaultValue?: number;
  /**
   * A request to change the selection, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onValueChange?: (value: number) => void;
  /**
   * Controlled: the host owns the sort, packed (`-1` = unsorted; see
   * `packSort`). This is the only thing that changes it.
   */
  readonly sortValue?: number | undefined;
  /** Uncontrolled starting packed sort; ignored while `sortValue` is set. */
  readonly defaultSortValue?: number;
  /**
   * A request to change the sort, called when the intent differs from the
   * current value. Uncontrolled it is accepted; controlled the host may ignore it.
   */
  readonly onSortChange?: (value: number) => void;
  /** PageUp/PageDown step, in rows (the spec's PAGE constant). */
  readonly page?: number;
  /** Base for generated ids. */
  readonly id?: string;
  /**
   * ponytail: virtualization seam only — a windowed row range; add measurement /
   * overscan when a real scroller drives it. Cell/row indices stay absolute.
   */
  readonly rowWindow?: GridWindow;
  /**
   * `"polyfill"` skips the V2 feature detect and drives the runtime even where
   * the engine has `focusGroup.supports("grid")` (a test, or a host that knows
   * it needs the fallback). `"auto"` by default.
   */
  readonly provider?: "auto" | "polyfill";
}

export interface GridProps {
  readonly role: "grid";
  readonly "aria-rowcount": number;
  readonly "aria-colcount": number;
  readonly "aria-readonly": "true" | "false";
  readonly "aria-activedescendant": string | undefined;
  /** The definition as the `focusgroup` attribute (`"grid rowflow colflow"`). */
  readonly focusgroup: string;
  /** Builds the platform's runtime; the primitive's keydown listener goes on first. */
  readonly ref: (element: HTMLElement) => void;
  readonly onFocusOut: (event: FocusEvent) => void;
}

export interface GridRowProps {
  readonly role: "row";
  readonly id: string;
  readonly "aria-rowindex": number;
}

export interface GridCellProps {
  readonly role: "gridcell";
  readonly id: string;
  /**
   * The constant focusability value (`0` for a cell target, `-1` in widget
   * mode), not the roving stop: the platform owns which cell is the tab stop.
   */
  readonly tabindex: number;
  /** The platform's entry marker, on the current coordinate only. */
  readonly focusgroupstart: "" | undefined;
  readonly ref: (element: HTMLElement) => void;
  readonly "aria-rowindex": number;
  readonly "aria-colindex": number;
  readonly "aria-readonly": "true" | "false";
  readonly "aria-selected": "true" | "false" | undefined;
  readonly onClick: () => void;
}

/** A focusable widget rendered inside a cell (focusTarget = "widget"). */
export interface GridWidgetProps {
  readonly tabindex: number;
  /** The platform's entry marker, on the current coordinate's widget only. */
  readonly focusgroupstart: "" | undefined;
  readonly ref: (element: HTMLElement) => void;
}

export interface GridHeaderProps {
  readonly role: "columnheader";
  readonly id: string;
  /**
   * The header row keeps its own 1-D roving (one `0`, the rest `-1`); it is
   * `focusgroup="none"` so neither provider pulls it into the body's group.
   */
  readonly focusgroup: "none";
  readonly tabindex: number;
  readonly "aria-sort": "none" | "ascending" | "descending" | undefined;
  readonly onClick: () => void;
  readonly onFocus: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface Grid {
  readonly rows: Accessor<number>;
  readonly cols: Accessor<number>;
  readonly row: Accessor<number>;
  readonly col: Accessor<number>;
  readonly hasFocus: Accessor<boolean>;
  readonly mode: Accessor<"navigate" | "edit">;
  readonly gridKind: Accessor<GridKind>;
  readonly wrapCols: Accessor<boolean>;
  readonly wrapRows: Accessor<boolean>;
  readonly focusTarget: Accessor<GridFocusTarget>;
  readonly gridReadonly: Accessor<boolean>;
  readonly lastEdit: Accessor<"none" | "committed" | "cancelled">;
  /** The row indices currently mounted (the virtualization window). */
  readonly renderedRows: Accessor<ReadonlyArray<number>>;
  readonly isSelected: (row: number, col: number) => boolean;
  /** The controlled selection value (packed; `0` = nothing selected). */
  readonly selection: Accessor<number>;
  readonly sortColumn: Accessor<number>;
  readonly sortDirection: Accessor<GridSortDirection>;
  /** The controlled sort value (packed; `-1` = unsorted). */
  readonly sort: Accessor<number>;
  /** The `data-part` target the roving tab stop should focus, for fixtures. */
  readonly focusTargetPart: Accessor<string | null>;
  /** The id of the current cell (the one carrying `focusgroupstart`). */
  readonly currentCellId: Accessor<string>;
  readonly gridProps: GridProps;
  readonly rowProps: (row: number) => GridRowProps;
  readonly cellProps: (row: number, col: number) => GridCellProps;
  readonly widgetProps: (row: number, col: number) => GridWidgetProps;
  readonly headerProps: (col: number) => GridHeaderProps;
  /** Programmatic enter (spec `focus_in`); keeps the roving tab stop. */
  readonly focus: () => void;
  readonly blur: () => void;
  readonly clickCell: (row: number, col: number) => void;
  readonly setGridKind: (kind: GridKind) => void;
  readonly setWrapCols: (flag: boolean) => void;
  readonly setWrapRows: (flag: boolean) => void;
  readonly setFocusTarget: (target: GridFocusTarget) => void;
  readonly setGridReadonly: (flag: boolean) => void;
  readonly setSelectable: (flag: boolean) => void;
  readonly setSortEnabled: (flag: boolean) => void;
}

/** The `data-part` address of a cell/widget/header, shared with the bridge. */
export const cellPart = (row: number, col: number): string => `cell:${row},${col}`;
export const rowPart = (row: number): string => `row:${row}`;
export const headerPart = (col: number): string => `header:${col}`;

/**
 * The controlled selection value (map ticket `rt1p`): `0` = nothing selected,
 * else `1 + r0 + rows*r1 + rows^2*c0 + rows^2*cols*c1` for the active rectangle.
 * Injective over the ordered rectangles of the bounded grid.
 */
export const packSelection = (
  rows: number,
  cols: number,
  active: boolean,
  r0: number,
  r1: number,
  c0: number,
  c1: number,
): number => (active ? 1 + r0 + rows * r1 + rows * rows * c0 + rows * rows * cols * c1 : 0);

const selParts = (rows: number, cols: number, v: number) => ({
  r0: (v - 1) % rows,
  r1: Math.floor((v - 1) / rows) % rows,
  c0: Math.floor((v - 1) / (rows * rows)) % cols,
  c1: Math.floor((v - 1) / (rows * rows * cols)) % cols,
});

const validSelection = (rows: number, cols: number, v: number): boolean => {
  if (!Number.isInteger(v) || v < 0) {
    return false;
  }
  if (v === 0) {
    return true;
  }
  const { r0, r1, c0, c1 } = selParts(rows, cols, v);
  return r0 <= r1 && c0 <= c1;
};

/**
 * The controlled sort value: `-1` = unsorted, else `2*column + (descending ?
 * 1 : 0)`. Injective for the columns the sort spec encodes.
 */
export const packSort = (column: number, dir: GridSortDirection): number =>
  column < 0 ? -1 : 2 * column + (dir === "descending" ? 1 : 0);

/** Values `packSort` can produce for a `cols`-wide header row. */
const validSort = (cols: number, v: number): boolean =>
  v === -1 || (Number.isInteger(v) && v >= 0 && v < 2 * cols);

interface Point {
  readonly row: number;
  readonly col: number;
}

/**
 * Every option is read lazily, so pass props/getters (never a destructured
 * snapshot); `rows`/`cols`/`page` are captured once.
 */
export const createGrid = (options: GridOptions = {}): Grid => {
  const totalRows = Math.max(1, options.rows ?? 4);
  const totalCols = Math.max(1, options.cols ?? 3);
  const page = Math.max(1, options.page ?? 2);
  const lastRow = totalRows - 1;
  const lastCol = totalCols - 1;

  const [row, setRow] = createSignal(0);
  const [col, setCol] = createSignal(0);
  const [hasFocus, setHasFocus] = createSignal(false);
  const [mode, setMode] = createSignal<"navigate" | "edit">("navigate");
  const [dirty, setDirty] = createSignal(false);
  const [lastEdit, setLastEdit] = createSignal<"none" | "committed" | "cancelled">("none");
  const [gridKind, setGridKindValue] = createSignal<GridKind>(options.gridKind ?? "data");
  const [wrapCols, setWrapColsValue] = createSignal(
    (options.gridKind ?? "data") === "layout" ? (options.wrapCols ?? false) : false,
  );
  const [wrapRows, setWrapRowsValue] = createSignal(
    (options.gridKind ?? "data") === "layout" ? (options.wrapRows ?? false) : false,
  );
  const [focusTarget, setFocusTargetValue] = createSignal<GridFocusTarget>(
    options.focusTarget ?? "cell",
  );
  const [gridReadonly, setGridReadonlyValue] = createSignal(options.gridReadonly ?? false);

  const [selectable, setSelectableValue] = createSignal(options.selectable ?? false);
  const [anchorRow, setAnchorRow] = createSignal(0);
  const [anchorCol, setAnchorCol] = createSignal(0);
  // the selected rectangle is the controlled value (map ticket rt1p): a request
  // the host may ignore; the collapsed rectangle is derived, not stored
  const [selection, requestSelection] = createControllable<number>({
    value: () => options.value,
    initial: validSelection(totalRows, totalCols, options.defaultValue ?? 0)
      ? (options.defaultValue ?? 0)
      : 0,
    onChange: () => options.onValueChange,
  });
  const selActive = (): boolean => selection() !== 0;
  const selR0 = (): number => selParts(totalRows, totalCols, selection()).r0;
  const selR1 = (): number => selParts(totalRows, totalCols, selection()).r1;
  const selC0 = (): number => selParts(totalRows, totalCols, selection()).c0;
  const selC1 = (): number => selParts(totalRows, totalCols, selection()).c1;

  const [headerCol, setHeaderCol] = createSignal(0);
  const [headerFocus, setHeaderFocus] = createSignal(false);
  const [sortEnabled, setSortEnabledValue] = createSignal(options.sortEnabled ?? false);
  // the sort is the controlled value too: packed (-1 = unsorted)
  const [sort, requestSort] = createControllable<number>({
    value: () => options.sortValue,
    initial: validSort(totalCols, options.defaultSortValue ?? -1)
      ? (options.defaultSortValue ?? -1)
      : -1,
    onChange: () => options.onSortChange,
  });
  const sortCol = (): number => {
    const v = sort();
    return v < 0 ? -1 : Math.floor(v / 2);
  };
  const sortDir = (): GridSortDirection => {
    const v = sort();
    return v < 0 ? "none" : v % 2 === 1 ? "descending" : "ascending";
  };

  const base = options.id ?? createUniqueId();

  // --- the platform's half (focusgroup="grid") ------------------------------
  const cellKey = (r: number, c: number): string => `${r},${c}`;
  const cellElement = new Map<string, HTMLElement>();
  const widgetElement = new Map<string, HTMLElement>();

  const rowWindowBounds = () => {
    const start = Math.max(0, options.rowWindow?.start ?? 0);
    const count = options.rowWindow?.count ?? totalRows;
    return { start, end: Math.min(totalRows, start + count) };
  };

  const renderedRows = createMemo<ReadonlyArray<number>>(() => {
    const { start, end } = rowWindowBounds();
    const out: number[] = [];
    for (let r = start; r < end; r += 1) {
      out.push(r);
    }
    return out;
  });

  /**
   * The body as the runtime sees it: dense rows relative to the mount window,
   * one item per coordinate, the focus target as `element` and the cell as
   * `cell`. An incomplete body is `[]` and the runtime decorates nothing.
   */
  const items = (): FocusGridItem[] => {
    const { start, end } = rowWindowBounds();
    const out: FocusGridItem[] = [];
    for (let r = start; r < end; r += 1) {
      for (let c = 0; c < totalCols; c += 1) {
        const key = cellKey(r, c);
        const cell = cellElement.get(key);
        const widget = widgetElement.get(key);
        const element = focusTarget() === "widget" ? widget : cell;
        if (cell === undefined || element === undefined || !element.isConnected) {
          return [];
        }
        out.push({ element, row: r - start, col: c, cell });
      }
    }
    return out;
  };

  /**
   * One source for the attribute and the runtime's definition. `wrapCols` /
   * `wrapRows` are APG's linear wrapping, which is the runtime's `flow`; a data
   * grid is hard on both axes.
   */
  const definitionOf = (kind: GridKind, cols: boolean, rows: boolean): FocusGridDefinition => ({
    rowEdge: kind === "layout" && cols ? "flow" : "none",
    colEdge: kind === "layout" && rows ? "flow" : "none",
    memory: true,
  });
  const definition = (): FocusGridDefinition => definitionOf(gridKind(), wrapCols(), wrapRows());

  /** The coordinate of the cell/widget (or a descendant of either) at `target`. */
  const coordinateOf = (target: EventTarget | null): Point | undefined => {
    if (!(target instanceof Node)) {
      return undefined;
    }
    for (const map of [cellElement, widgetElement]) {
      for (const [key, element] of map) {
        if (element.isConnected && (element === target || element.contains(target))) {
          const [r = 0, c = 0] = key.split(",");
          return { row: Number(r), col: Number(c) };
        }
      }
    }
    return undefined;
  };

  let owner: HTMLElement | undefined;
  let group: FocusGridHandle | undefined;

  /** DOM focus moved: the coordinate is a reading of it, and a plain move collapses the selection. */
  const onFocusIn = (event: FocusEvent): void => {
    const point = coordinateOf(event.target);
    if (point === undefined) {
      return;
    }
    const moved = point.row !== row() || point.col !== col();
    setHasFocus(true);
    setHeaderFocus(false);
    setRow(point.row);
    setCol(point.col);
    if (moved && !editing()) {
      collapseSelectionOn(point.row, point.col);
    }
  };

  const attach = (element: HTMLElement): void => {
    if (owner === element) {
      return;
    }
    owner = element;
    // the primitive's listener is registered before the runtime's, so a key it
    // consumes is already `defaultPrevented` when the runtime reads it
    element.addEventListener("keydown", keyDown);
    element.addEventListener("focusin", onFocusIn);
    group = focusGrid(element, { definition: definition(), items, provider: options.provider });
  };

  let reconcilePending = false;
  /** The platform reads the DOM: re-collect after a render writes the authored `tabindex` / markers. */
  const reconcile = (): void => {
    if (reconcilePending) {
      return;
    }
    reconcilePending = true;
    queueMicrotask(() => {
      reconcilePending = false;
      group?.update();
    });
  };

  // a mounted row, the focus-target set or its reactive author values changed
  createEffect(
    () => [renderedRows(), focusTarget()] as const,
    () => {
      reconcile();
    },
  );

  onSettled(() => {
    // the owner's ref may run before its cells' refs, so collect once more after the render
    reconcile();
  });

  onCleanup(() => {
    owner?.removeEventListener("keydown", keyDown);
    owner?.removeEventListener("focusin", onFocusIn);
    group?.destroy();
    group = undefined;
  });

  // --- navigation the runtime does not own ---------------------------------
  const cur = (): number => row() * totalCols + col();
  const editing = (): boolean => mode() === "edit";
  const colReadonly = (c: number): boolean => c === lastCol;
  const canEdit = (): boolean => !gridReadonly() && !colReadonly(col());
  const navigating = (): boolean => hasFocus() && mode() === "navigate";

  const pageDownIdx = (): number =>
    row() + page > lastRow ? lastRow * totalCols + col() : cur() + page * totalCols;
  const pageUpIdx = (): number => (row() < page ? col() : cur() - page * totalCols);

  /** A page-sized move: state only; the host mirrors it into DOM focus. */
  const landOn = (index: number): void => {
    setRow(Math.floor(index / totalCols));
    setCol(index % totalCols);
  };

  const startEdit = (key: string): boolean =>
    navigating() && canEdit() && (key === "Enter" || key === "F2" || key === "a");

  // --- selection (grid-selection.qnt) ---------------------------------------
  const lower = (a: number, b: number): number => (a < b ? a : b);
  const upper = (a: number, b: number): number => (a > b ? a : b);
  const clampRow = (r: number): number => (r < 0 ? 0 : r > lastRow ? lastRow : r);
  const clampCol = (c: number): number => (c < 0 ? 0 : c > lastCol ? lastCol : c);

  const dRow = (key: string): number =>
    key === "ArrowDown" || key === "Shift+ArrowDown"
      ? 1
      : key === "ArrowUp" || key === "Shift+ArrowUp"
        ? -1
        : 0;
  const dCol = (key: string): number =>
    key === "ArrowRight" || key === "Shift+ArrowRight"
      ? 1
      : key === "ArrowLeft" || key === "Shift+ArrowLeft"
        ? -1
        : 0;
  const isShiftArrow = (key: string): boolean =>
    key === "Shift+ArrowRight" ||
    key === "Shift+ArrowLeft" ||
    key === "Shift+ArrowDown" ||
    key === "Shift+ArrowUp";
  const isPlainArrow = (key: string): boolean =>
    key === "ArrowRight" || key === "ArrowLeft" || key === "ArrowDown" || key === "ArrowUp";

  const cellSelected = (r: number, c: number): boolean =>
    selActive() && r >= selR0() && r <= selR1() && c >= selC0() && c <= selC1();

  const applySelectionKey = (key: string, from: Point): void => {
    if (!hasFocus() || editing()) {
      return;
    }
    const has = selectable();
    const extend = has && isShiftArrow(key);
    const collapse = isPlainArrow(key) || (isShiftArrow(key) && !has);
    const selectsRow = has && key === "Shift+Space";
    const selectsCol = has && key === "Control+Space";
    const selectsAll = has && key === "Control+a";
    const clears = key === "Escape";
    const newR = clampRow(from.row + dRow(key));
    const newC = clampCol(from.col + dCol(key));

    if (extend || collapse) {
      // Shift+Arrow is not the runtime's (a modified key), so the primitive
      // moves focus itself. A plain arrow is the platform's: this only settles
      // the selection on the clamped cell, and the focusin reading settles it
      // on the true landing when a flow edge made the two differ.
      landOn(newR * totalCols + newC);
    }
    if (collapse) {
      setAnchorRow(newR);
      setAnchorCol(newC);
    } else if (selectsRow || selectsCol || selectsAll || clears) {
      setAnchorRow(from.row);
      setAnchorCol(from.col);
    }

    // the request intent, spelled per member exactly like the spec's key action
    const current = selParts(totalRows, totalCols, selection());
    const active =
      extend || selectsRow || selectsCol || selectsAll
        ? true
        : collapse || clears
          ? false
          : selActive();
    const wantR0 = extend
      ? lower(anchorRow(), newR)
      : selectsRow
        ? from.row
        : selectsCol || selectsAll
          ? 0
          : collapse
            ? newR
            : clears
              ? from.row
              : current.r0;
    const wantR1 = extend
      ? upper(anchorRow(), newR)
      : selectsRow
        ? from.row
        : selectsCol || selectsAll
          ? lastRow
          : collapse
            ? newR
            : clears
              ? from.row
              : current.r1;
    const wantC0 = extend
      ? lower(anchorCol(), newC)
      : selectsCol
        ? from.col
        : selectsRow || selectsAll
          ? 0
          : collapse
            ? newC
            : clears
              ? from.col
              : current.c0;
    const wantC1 = extend
      ? upper(anchorCol(), newC)
      : selectsCol
        ? from.col
        : selectsRow || selectsAll
          ? lastCol
          : collapse
            ? newC
            : clears
              ? from.col
              : current.c1;
    requestSelection(packSelection(totalRows, totalCols, active, wantR0, wantR1, wantC0, wantC1));
  };

  const collapseSelectionOn = (r: number, c: number): void => {
    setAnchorRow(r);
    setAnchorCol(c);
    requestSelection(0);
  };

  // --- sort (grid-sort.qnt) --------------------------------------------------
  const sortable = (c: number): boolean => c !== 1;
  const sorts = (c: number): boolean => sortEnabled() && sortable(c);
  const nextDir = (c: number): GridSortDirection =>
    c === sortCol() && sortDir() === "ascending" ? "descending" : "ascending";
  const ariaSort = (c: number): GridSortDirection | undefined => {
    if (!(sortEnabled() && sortable(c))) {
      return undefined;
    }
    return c === sortCol() ? sortDir() : "none";
  };
  const activateSort = (c: number): void => {
    if (!sorts(c)) {
      return;
    }
    requestSort(packSort(c, nextDir(c)));
  };

  const headerKeyCol = (key: string): number => {
    if (key === "ArrowRight") {
      return headerCol() < lastCol ? headerCol() + 1 : headerCol();
    }
    if (key === "ArrowLeft") {
      return headerCol() > 0 ? headerCol() - 1 : headerCol();
    }
    if (key === "Home") {
      return 0;
    }
    if (key === "End") {
      return lastCol;
    }
    return headerCol();
  };

  const onHeaderKeyDown = (event: KeyboardEvent): void => {
    if (!headerFocus()) {
      return;
    }
    const key = event.key;
    const handled =
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "Home" ||
      key === "End" ||
      key === "Enter" ||
      key === " " ||
      key === "Spacebar";
    if (!handled) {
      // Tab / Shift+Tab (and every other key) keep their own behaviour: the
      // header row is one stop of the sequential order, not a trap
      return;
    }
    setHeaderCol(headerKeyCol(key));
    if (key === "Enter" || key === " " || key === "Spacebar") {
      activateSort(headerCol());
    }
    event.preventDefault();
  };

  // --- keyboard --------------------------------------------------------------
  const canonicalKey = (event: KeyboardEvent): string => {
    const key = event.key;
    const space = key === " " || key === "Spacebar";
    if ((event.ctrlKey || event.metaKey) && space) {
      return "Control+Space";
    }
    if (event.ctrlKey || event.metaKey) {
      return `Control+${key}`;
    }
    if (event.shiftKey && space) {
      return "Shift+Space";
    }
    if (event.shiftKey) {
      return `Shift+${key}`;
    }
    return key;
  };

  /**
   * The library's half of the keyboard, on the owner before the runtime. Arrows,
   * Home / End and Ctrl+Home / Ctrl+End are the platform's, so nothing here
   * prevents them: the runtime reads an un-prevented key and moves. Page keys,
   * the selection modifiers and edit mode are the primitive's, and it prevents
   * exactly those. Headers are not body items, so their keys are ignored here.
   */
  function keyDown(event: KeyboardEvent): void {
    if (coordinateOf(event.target) === undefined || !hasFocus()) {
      return;
    }
    const key = canonicalKey(event);
    const from: Point = { row: row(), col: col() };
    if (editing()) {
      if (key === "Enter" || key === "F2") {
        setMode("navigate");
        setDirty(false);
        setLastEdit("committed");
        event.preventDefault();
      } else if (key === "Escape") {
        setMode("navigate");
        setDirty(false);
        setLastEdit("cancelled");
        event.preventDefault();
      } else if (key === "a") {
        setDirty(true);
        event.preventDefault();
      }
      // the edit surface owns every other key: keep the runtime (and any other
      // listener on the owner) from moving focus, without cancelling the
      // key's default (a text caret keeps its arrows)
      event.stopImmediatePropagation();
      return;
    }
    if (startEdit(key)) {
      setMode("edit");
      setDirty(key === "a");
      event.preventDefault();
      return;
    }
    if (key === "PageDown" || key === "PageUp") {
      landOn(key === "PageDown" ? pageDownIdx() : pageUpIdx());
      event.preventDefault();
      return;
    }
    if (isPlainArrow(key)) {
      // the platform moves; the primitive only settles the selection on the
      // cell (the focusin reading settles it on the true landing, and the
      // request dedupes when they agree)
      applySelectionKey(key, from);
      return;
    }
    if (
      isShiftArrow(key) ||
      key === "Shift+Space" ||
      key === "Control+Space" ||
      key === "Control+a" ||
      key === "Escape"
    ) {
      applySelectionKey(key, from);
      event.preventDefault();
      return;
    }
    if (key === "Tab" || key === "Shift+Tab") {
      // HTML sequential navigation: observed, never cancelled
      setHasFocus(false);
    }
  }

  const clickCell = (r: number, c: number): void => {
    const wasEditing = editing();
    const same = r === row() && c === col();
    setRow(r);
    setCol(c);
    setHasFocus(true);
    setHeaderFocus(false);
    setMode(wasEditing && same ? "edit" : "navigate");
    setDirty(wasEditing && same ? dirty() : false);
    if (wasEditing && !same) {
      setLastEdit("committed");
    }
    collapseSelectionOn(r, c);
  };

  const setGridKind = (kind: GridKind): void => {
    // Solid 2 setters land on the next flush, so the definition is built from
    // the values this call settles on, not from setters that may still lag
    const cols = kind === "data" ? false : wrapCols();
    const rows = kind === "data" ? false : wrapRows();
    setGridKindValue(kind);
    if (kind === "data") {
      setWrapColsValue(false);
      setWrapRowsValue(false);
    }
    group?.update(definitionOf(kind, cols, rows));
  };

  // --- prop objects ----------------------------------------------------------
  const cellId = (r: number, c: number): string => `${base}-cell-${r}-${c}`;

  const currentCellId = (): string => cellId(row(), col());

  const focusTargetPart = createMemo<string | null>(() => {
    if (headerFocus()) {
      return headerPart(headerCol());
    }
    if (!hasFocus()) {
      return null;
    }
    return focusTarget() === "widget" ? `${cellPart(row(), col())}/widget` : cellPart(row(), col());
  });

  const leaveGrid = (): void => {
    if (editing()) {
      setMode("navigate");
      setDirty(false);
      setLastEdit("committed");
    }
    setHasFocus(false);
    setHeaderFocus(false);
  };

  return {
    rows: () => totalRows,
    cols: () => totalCols,
    row,
    col,
    hasFocus,
    mode,
    gridKind,
    wrapCols,
    wrapRows,
    focusTarget,
    gridReadonly,
    lastEdit,
    renderedRows,
    isSelected: (r, c) => selectable() && cellSelected(r, c),
    selection,
    sortColumn: sortCol,
    sortDirection: sortDir,
    sort,
    focusTargetPart,
    currentCellId,
    gridProps: {
      role: "grid",
      "aria-rowcount": totalRows,
      "aria-colcount": totalCols,
      get "aria-readonly"() {
        return gridReadonly() ? "true" : "false";
      },
      get "aria-activedescendant"() {
        return focusTarget() === "widget" && hasFocus() ? cellId(row(), col()) : undefined;
      },
      get focusgroup() {
        // the forced fallback keeps the native engine out of the group
        return options.provider === "polyfill" ? "" : focusgridAttribute(definition());
      },
      get ref() {
        return attach;
      },
      onFocusOut: (event: FocusEvent) => {
        const next = event.relatedTarget;
        if (
          next instanceof Node &&
          event.currentTarget instanceof Node &&
          event.currentTarget.contains(next)
        ) {
          return;
        }
        leaveGrid();
      },
    },
    rowProps: (r) => ({
      role: "row",
      id: `${base}-row-${r}`,
      "aria-rowindex": r + 1,
    }),
    cellProps: (r, c) => ({
      role: "gridcell",
      id: cellId(r, c),
      get tabindex() {
        // the author value the platform needs; it owns WHICH cell is the stop
        return focusTarget() === "widget" ? -1 : 0;
      },
      get focusgroupstart() {
        return focusTarget() === "cell" && r === row() && c === col() ? ("" as const) : undefined;
      },
      ref: (element: HTMLElement) => {
        cellElement.set(cellKey(r, c), element);
      },
      "aria-rowindex": r + 1,
      "aria-colindex": c + 1,
      get "aria-readonly"() {
        return gridReadonly() || colReadonly(c) ? "true" : "false";
      },
      get "aria-selected"() {
        return selectable() ? (cellSelected(r, c) ? "true" : "false") : undefined;
      },
      onClick: () => clickCell(r, c),
    }),
    widgetProps: (r, c) => ({
      get tabindex() {
        // in widget mode the widget set is the item set; a cell target owns it
        return focusTarget() === "widget" ? 0 : -1;
      },
      get focusgroupstart() {
        return focusTarget() === "widget" && r === row() && c === col() ? ("" as const) : undefined;
      },
      ref: (element: HTMLElement) => {
        widgetElement.set(cellKey(r, c), element);
      },
    }),
    headerProps: (c) => ({
      role: "columnheader",
      id: `${base}-header-${c}`,
      // the header row is its own 1-D roving; keep it out of the body's group
      focusgroup: "none",
      get tabindex() {
        return c === headerCol() ? 0 : -1;
      },
      get "aria-sort"() {
        return ariaSort(c);
      },
      onClick: () => {
        setHeaderCol(c);
        setHeaderFocus(true);
        activateSort(c);
      },
      onFocus: () => {
        setHeaderCol(c);
        setHeaderFocus(true);
      },
      onKeyDown: onHeaderKeyDown,
    }),
    focus: () => {
      setHasFocus(true);
      setHeaderFocus(false);
    },
    blur: () => {
      leaveGrid();
    },
    clickCell,
    setGridKind,
    setWrapCols: (flag) => {
      const cols = gridKind() === "layout" ? flag : false;
      setWrapColsValue(cols);
      group?.update(definitionOf(gridKind(), cols, wrapRows()));
    },
    setWrapRows: (flag) => {
      const rows = gridKind() === "layout" ? flag : false;
      setWrapRowsValue(rows);
      group?.update(definitionOf(gridKind(), wrapCols(), rows));
    },
    setFocusTarget: (target) => {
      setFocusTargetValue(target);
      // re-collect only: an update carrying a definition would re-apply the edges
      group?.update();
      reconcile();
    },
    setGridReadonly: (flag) => {
      setGridReadonlyValue(flag);
      if (flag && editing()) {
        setMode("navigate");
        setDirty(false);
        setLastEdit("cancelled");
      }
    },
    setSelectable: (flag) => {
      setSelectableValue(flag);
      if (!flag) {
        collapseSelectionOn(row(), col());
      }
    },
    setSortEnabled: (flag) => {
      setSortEnabledValue(flag);
      if (!flag) {
        requestSort(-1);
      }
    },
  };
};
