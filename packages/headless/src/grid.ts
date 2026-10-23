import { type Accessor, createMemo, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

/**
 * APG grid primitive on Solid 2: roving focus, 2-D navigation, edit mode, a
 * cell/row/column selection rectangle and sortable column headers. State plus
 * getter-backed attribute objects; no elements, no styling.
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
}

export interface GridProps {
  readonly role: "grid";
  readonly "aria-rowcount": number;
  readonly "aria-colcount": number;
  readonly "aria-readonly": "true" | "false";
  readonly "aria-activedescendant": string | undefined;
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
  readonly tabindex: number;
  readonly "aria-rowindex": number;
  readonly "aria-colindex": number;
  readonly "aria-readonly": "true" | "false";
  readonly "aria-selected": "true" | "false" | undefined;
  readonly onClick: () => void;
  readonly onFocus: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

/** A focusable widget rendered inside a cell (focusTarget = "widget"). */
export interface GridWidgetProps {
  readonly tabindex: number;
  readonly onFocus: () => void;
}

export interface GridHeaderProps {
  readonly role: "columnheader";
  readonly id: string;
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

const GRID_KEYS = new Set([
  "ArrowRight",
  "ArrowLeft",
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
  "Control+Home",
  "Control+End",
  "PageUp",
  "PageDown",
  "Enter",
  "F2",
  "Escape",
  "a",
  "Tab",
  "Shift+Tab",
]);

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
  const cells = totalRows * totalCols;

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

  // --- navigation (grid.qnt) -------------------------------------------------
  const cur = (): number => row() * totalCols + col();
  const editing = (): boolean => mode() === "edit";
  const colReadonly = (c: number): boolean => c === lastCol;
  const canEdit = (): boolean => !gridReadonly() && !colReadonly(col());
  const navigating = (): boolean => hasFocus() && mode() === "navigate";

  const rightIdx = (): number =>
    col() < lastCol ? cur() + 1 : wrapCols() && row() < lastRow ? cur() + 1 : cur();
  const leftIdx = (): number =>
    col() > 0 ? cur() - 1 : wrapCols() && row() > 0 ? cur() - 1 : cur();
  const downIdx = (): number =>
    row() < lastRow ? cur() + totalCols : wrapRows() && col() < lastCol ? col() + 1 : cur();
  const upIdx = (): number =>
    row() > 0
      ? cur() - totalCols
      : wrapRows() && col() > 0
        ? lastRow * totalCols + col() - 1
        : cur();
  const pageDownIdx = (): number =>
    row() + page > lastRow ? lastRow * totalCols + col() : cur() + page * totalCols;
  const pageUpIdx = (): number => (row() < page ? col() : cur() - page * totalCols);

  const keyTarget = (key: string): number => {
    switch (key) {
      case "ArrowRight":
        return rightIdx();
      case "ArrowLeft":
        return leftIdx();
      case "ArrowDown":
        return downIdx();
      case "ArrowUp":
        return upIdx();
      case "PageDown":
        return pageDownIdx();
      case "PageUp":
        return pageUpIdx();
      case "Home":
        return row() * totalCols;
      case "End":
        return row() * totalCols + lastCol;
      case "Control+Home":
        return 0;
      case "Control+End":
        return cells - 1;
      default:
        return cur();
    }
  };

  const moveTo = (index: number): void => {
    setRow(Math.floor(index / totalCols));
    setCol(index % totalCols);
  };

  const startEdit = (key: string): boolean =>
    navigating() && canEdit() && (key === "Enter" || key === "F2" || key === "a");

  const applyGridKey = (key: string): void => {
    if (!hasFocus()) {
      return;
    }
    const wasEditing = editing();
    const wasNavigating = navigating();
    const commits = wasEditing && (key === "Enter" || key === "F2");
    const cancels = wasEditing && key === "Escape";
    const leaves = wasNavigating && (key === "Tab" || key === "Shift+Tab");

    if (wasNavigating) {
      moveTo(keyTarget(key));
    }
    if (leaves) {
      setHasFocus(false);
    }
    if (startEdit(key)) {
      setMode("edit");
      setDirty(key === "a");
    } else if (wasEditing && key === "a") {
      setDirty(true);
    } else if (commits || cancels) {
      setMode("navigate");
      setDirty(false);
    }
    if (commits) {
      setLastEdit("committed");
    } else if (cancels) {
      setLastEdit("cancelled");
    }
  };

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
  const isPlainArrow = (key: string): boolean =>
    key === "ArrowRight" || key === "ArrowLeft" || key === "ArrowDown" || key === "ArrowUp";
  const isShiftArrow = (key: string): boolean =>
    key === "Shift+ArrowRight" ||
    key === "Shift+ArrowLeft" ||
    key === "Shift+ArrowDown" ||
    key === "Shift+ArrowUp";

  const cellSelected = (r: number, c: number): boolean =>
    selActive() && r >= selR0() && r <= selR1() && c >= selC0() && c <= selC1();

  const applySelectionKey = (key: string, from: Point): void => {
    if (!hasFocus() || editing()) {
      return;
    }
    const has = selectable();
    const collapse = isPlainArrow(key) || (isShiftArrow(key) && !has);
    const extend = has && isShiftArrow(key);
    const selectsRow = has && key === "Shift+Space";
    const selectsCol = has && key === "Control+Space";
    const selectsAll = has && key === "Control+a";
    const clears = key === "Escape";
    const moves = collapse || extend;
    const newR = clampRow(from.row + dRow(key));
    const newC = clampCol(from.col + dCol(key));

    if (moves && isShiftArrow(key)) {
      // plain arrows are already positioned by the grid (which may wrap); the
      // selection only drives the position for Shift+Arrow
      setRow(newR);
      setCol(newC);
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
    setHeaderCol(headerKeyCol(key));
    if (key === "Enter" || key === " ") {
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

  const onKeyDown = (event: KeyboardEvent): void => {
    const key = canonicalKey(event);
    const from: Point = { row: row(), col: col() };
    if (
      GRID_KEYS.has(key) ||
      isShiftArrow(key) ||
      key === "Control+Space" ||
      key === "Shift+Space" ||
      key === "Control+a"
    ) {
      applyGridKey(key);
      applySelectionKey(key, from);
      event.preventDefault();
    }
  };

  const clickCell = (r: number, c: number): void => {
    const wasEditing = editing();
    const same = r === row() && c === col();
    setRow(r);
    setCol(c);
    setHasFocus(true);
    setMode(wasEditing && same ? "edit" : "navigate");
    setDirty(wasEditing && same ? dirty() : false);
    if (wasEditing && !same) {
      setLastEdit("committed");
    }
    collapseSelectionOn(r, c);
  };

  const focusCell = (r: number, c: number): void => {
    if (r === row() && c === col() && hasFocus()) {
      return;
    }
    clickCell(r, c);
  };

  const setGridKind = (kind: GridKind): void => {
    setGridKindValue(kind);
    if (kind === "data") {
      setWrapColsValue(false);
      setWrapRowsValue(false);
    }
  };

  // --- prop objects ----------------------------------------------------------
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

  const cellId = (r: number, c: number): string => `${base}-cell-${r}-${c}`;

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
        return focusTarget() === "cell" && r === row() && c === col() ? 0 : -1;
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
      onFocus: () => focusCell(r, c),
      onKeyDown,
    }),
    widgetProps: (r, c) => ({
      get tabindex() {
        return focusTarget() === "widget" && r === row() && c === col() ? 0 : -1;
      },
      onFocus: () => {
        setHasFocus(true);
      },
    }),
    headerProps: (c) => ({
      role: "columnheader",
      id: `${base}-header-${c}`,
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
    },
    blur: () => {
      leaveGrid();
    },
    clickCell,
    setGridKind,
    setWrapCols: (flag) => setWrapColsValue(gridKind() === "layout" ? flag : false),
    setWrapRows: (flag) => setWrapRowsValue(gridKind() === "layout" ? flag : false),
    setFocusTarget: (target) => setFocusTargetValue(target),
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
