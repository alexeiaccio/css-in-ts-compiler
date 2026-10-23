import { type Accessor, createMemo, createSignal, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

/**
 * APG treegrid primitive on Solid 2: a fixed tree of rows, row/cell roving focus
 * across the three APG navigation models, expansion and row selection. State plus
 * getter-backed attribute objects; no elements, no styling.
 *
 * Mirrors `specs/apg/treegrid.qnt` (the Email Inbox tree: A > {A.1, A.2 >
 * {A.2.1}}, B > {B.1, B.2}); the generated machine is the oracle in tests.
 */

export type TreegridNav = "rowsFirst" | "cellsFirst" | "cellsOnly";
export type TreegridSelection = "single" | "multi";

export interface TreegridOptions {
  readonly nav?: TreegridNav;
  readonly selection?: TreegridSelection;
  /** Column count; the spec fixes three. */
  readonly cols?: number;
  /** Controlled: the host owns the selected rows and this is the only thing that changes them. */
  readonly value?: ReadonlyArray<number> | undefined;
  /** Uncontrolled starting selected rows; ignored while `value` is set. */
  readonly defaultValue?: ReadonlyArray<number>;
  /** Base for generated ids. */
  readonly id?: string;
  /**
   * A request to change the selected rows, called when the intent differs from
   * the current value. Uncontrolled it is accepted; controlled the host may
   * ignore it.
   */
  readonly onValueChange?: (selected: ReadonlyArray<number>) => void;
}

export interface TreegridProps {
  readonly role: "treegrid";
  readonly "aria-multiselectable": "true" | undefined;
  readonly onFocusOut: (event: FocusEvent) => void;
}

export interface TreegridRowProps {
  readonly role: "row";
  readonly id: string;
  readonly "aria-level": number;
  readonly "aria-setsize": number;
  readonly "aria-posinset": number;
  readonly "aria-expanded": "true" | "false" | undefined;
  readonly "aria-selected": "true" | "false" | undefined;
  readonly tabindex: number;
  readonly onFocus: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface TreegridCellProps {
  readonly role: "gridcell";
  readonly id: string;
  readonly tabindex: number;
  readonly onClick: () => void;
  readonly onFocus: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface TreegridExpanderProps {
  readonly role: "button";
  readonly "aria-label": "Expand" | "Collapse";
  readonly "aria-expanded": "true" | "false";
  readonly onMouseDown: (event: MouseEvent) => void;
  readonly onClick: (event: MouseEvent) => void;
}

export interface Treegrid {
  readonly rows: Accessor<number>;
  readonly cols: Accessor<number>;
  readonly nav: Accessor<TreegridNav>;
  readonly selection: Accessor<TreegridSelection>;
  readonly focusedRow: Accessor<number>;
  readonly focusedCol: Accessor<number>;
  readonly kind: Accessor<"row" | "cell">;
  readonly inGrid: Accessor<boolean>;
  readonly visible: (row: number) => boolean;
  readonly hasChildren: (row: number) => boolean;
  readonly isExpanded: (row: number) => boolean;
  readonly isSelected: (row: number) => boolean;
  readonly focusTargetPart: Accessor<string | null>;
  readonly gridProps: TreegridProps;
  readonly rowProps: (row: number) => TreegridRowProps;
  readonly cellProps: (row: number, col: number) => TreegridCellProps;
  readonly expanderProps: (row: number) => TreegridExpanderProps;
  readonly focus: () => void;
  readonly blur: () => void;
  readonly clickCell: (row: number, col: number) => void;
  readonly toggleRow: (row: number) => void;
  readonly configureNav: (nav: TreegridNav) => void;
  readonly configureSelection: (selection: TreegridSelection) => void;
  readonly setExpanded: (row: number, expanded: boolean) => void;
}

// The spec's parent map (module apg_treegrid): only the tree data.
const PARENTS: ReadonlyArray<number> = [-1, 0, 0, 2, -1, 4, 4];

const minI = (a: number, b: number): number => (a < b ? a : b);

const maskOfRows = (rows: ReadonlyArray<number>): number =>
  rows.reduce((mask, row) => mask | (1 << row), 0);
const rowsOfMask = (mask: number): ReadonlyArray<number> => {
  const rows: number[] = [];
  for (let row = 0; row < PARENTS.length; row += 1) {
    if ((mask & (1 << row)) !== 0) {
      rows.push(row);
    }
  }
  return rows;
};

export const treegridRowPart = (row: number): string => `row:${row}`;
export const treegridCellPart = (row: number, col: number): string => `cell:${row},${col}`;

export const createTreegrid = (options: TreegridOptions = {}): Treegrid => {
  const totalRows = PARENTS.length;
  const totalCols = Math.max(1, options.cols ?? 3);

  const [nav, setNav] = createSignal<TreegridNav>(options.nav ?? "rowsFirst");
  const [selection, setSelection] = createSignal<TreegridSelection>(options.selection ?? "single");
  const [inGrid, setInGrid] = createSignal(false);
  const [kind, setKind] = createSignal<"row" | "cell">(
    (options.nav ?? "rowsFirst") === "rowsFirst" ? "row" : "cell",
  );
  const [focusedRow, setFocusedRow] = createSignal(0);
  const [focusedCol, setFocusedCol] = createSignal(0);
  const [selectedMask, requestSelected] = createControllable<number>({
    value: () => (options.value === undefined ? undefined : maskOfRows(options.value)),
    initial: maskOfRows(options.defaultValue ?? []),
    onChange: () => (next) => options.onValueChange?.(rowsOfMask(next)),
  });
  const [expanded, setExpandedSet] = createSignal<ReadonlySet<number>>(new Set());

  const base = options.id ?? createUniqueId();

  const parentOf = (row: number): number => PARENTS[row] ?? -1;
  const hasChildren = (row: number): boolean => PARENTS.some((parent) => parent === row);
  const childCount = (parent: number): number => PARENTS.filter((p) => p === parent).length;
  const isExpanded = (row: number): boolean => expanded().has(row);
  const visible = (row: number): boolean => {
    if (row < 0 || row >= totalRows) {
      return false;
    }
    let p = parentOf(row);
    while (p >= 0) {
      if (!isExpanded(p)) {
        return false;
      }
      p = parentOf(p);
    }
    return true;
  };

  const nextVis = (row: number): number => {
    for (let step = 1; step <= totalRows; step += 1) {
      if (visible(row + step)) {
        return row + step;
      }
    }
    return row;
  };
  const prevVis = (row: number): number => {
    for (let step = 1; step <= totalRows; step += 1) {
      if (visible(row - step)) {
        return row - step;
      }
    }
    return row;
  };
  const lastVis = (): number => prevVis(totalRows);

  const ariaLevel = (row: number): number => {
    let level = 1;
    let p = parentOf(row);
    while (p >= 0) {
      level += 1;
      p = parentOf(p);
    }
    return level;
  };
  const ariaSetSize = (row: number): number => {
    const p = parentOf(row);
    return p < 0 ? PARENTS.filter((x) => x < 0).length : childCount(p);
  };
  const ariaPosInSet = (row: number): number => {
    const p = parentOf(row);
    let pos = 0;
    for (let r = 0; r <= row; r += 1) {
      if (parentOf(r) === p) {
        pos += 1;
      }
    }
    return pos;
  };

  // --- selection -------------------------------------------------------------
  const rowSelected = (row: number): boolean => (selectedMask() & (1 << row)) !== 0;
  const requestRows = (rows: ReadonlyArray<number>): void => {
    requestSelected(maskOfRows(rows));
  };
  // single selection follows focus; multi leaves the selection alone
  const follow = (row: number): void => {
    if (selection() === "single") {
      requestRows([row]);
    }
  };
  const setRow = (row: number, value: boolean): void => {
    const next = new Set(rowsOfMask(selectedMask()));
    if (value) {
      next.add(row);
    } else {
      next.delete(row);
    }
    requestRows([...next].sort((a, b) => a - b));
  };

  const rowFocusSupported = (): boolean => nav() !== "cellsOnly";
  const canExpand = (row: number): boolean => hasChildren(row) && !isExpanded(row);
  const canCollapse = (row: number): boolean => hasChildren(row) && isExpanded(row);
  const toggleExpansion = (row: number): void => {
    const next = new Set(expanded());
    if (next.has(row)) {
      next.delete(row);
    } else {
      next.add(row);
    }
    setExpandedSet(next);
  };

  const rowAfterToggle = (row: number): number => {
    if (!visible(row)) {
      return row;
    }
    const next = new Set(expanded());
    if (next.has(row)) {
      next.delete(row);
    } else {
      next.add(row);
    }
    const wasVisible = (() => {
      let p = parentOf(focusedRow());
      while (p >= 0) {
        const open = next.has(p);
        if (!open) {
          return false;
        }
        p = parentOf(p);
      }
      return true;
    })();
    return wasVisible ? focusedRow() : row;
  };

  const toggleRow = (row: number): void => {
    if (!visible(row)) {
      return;
    }
    const target = rowAfterToggle(row);
    toggleExpansion(row);
    setFocusedRow(target);
    if (selection() === "single" && selectedMask() !== 0) {
      requestRows([target]);
    }
  };

  const clickCell = (row: number, col: number): void => {
    if (!visible(row)) {
      return;
    }
    setInGrid(true);
    setKind("cell");
    setFocusedRow(row);
    setFocusedCol(col);
    follow(row);
  };

  const focusRow = (row: number): void => {
    if (!visible(row)) {
      return;
    }
    // the fixture's focus effect re-enters here after a click; a focus that is
    // already on the roving row is not a new user request
    if (inGrid() && kind() === "row" && focusedRow() === row) {
      return;
    }
    setInGrid(true);
    if (rowFocusSupported()) {
      setKind("row");
      setFocusedRow(row);
      setFocusedCol(0);
    }
    follow(row);
  };

  const focusCellElement = (row: number, col: number): void => {
    if (!visible(row)) {
      return;
    }
    if (inGrid() && kind() === "cell" && focusedRow() === row && focusedCol() === col) {
      return;
    }
    clickCell(row, col);
  };

  const configureNav = (value: TreegridNav): void => {
    setNav(value);
    setExpandedSet(new Set<number>());
    setInGrid(false);
    setKind(value === "rowsFirst" ? "row" : "cell");
    setFocusedRow(0);
    setFocusedCol(0);
    if (options.value === undefined) {
      requestRows([]);
    }
  };

  const configureSelection = (value: TreegridSelection): void => {
    setSelection(value);
    setExpandedSet(new Set<number>());
    setInGrid(false);
    setKind(nav() === "rowsFirst" ? "row" : "cell");
    setFocusedRow(0);
    setFocusedCol(0);
    if (options.value === undefined) {
      requestRows([]);
    }
  };

  // --- keyboard (spec actions) ----------------------------------------------
  const right = (): void => {
    if (inGrid() && kind() === "row" && canExpand(focusedRow())) {
      toggleExpansion(focusedRow());
    }
    if (inGrid() && kind() === "row" && !canExpand(focusedRow())) {
      setKind("cell");
    } else if (inGrid() && kind() === "cell") {
      setFocusedCol(minI(focusedCol() + 1, totalCols - 1));
    }
  };

  const left = (): void => {
    if (inGrid() && kind() === "row" && canCollapse(focusedRow())) {
      toggleExpansion(focusedRow());
    }
    if (inGrid() && kind() === "cell" && focusedCol() === 0 && rowFocusSupported()) {
      setKind("row");
      setFocusedCol(0);
    } else if (inGrid() && kind() === "cell" && focusedCol() > 0) {
      setFocusedCol(focusedCol() - 1);
    }
  };

  const moveDown = (): void => {
    if (!inGrid()) {
      return;
    }
    const next = nextVis(focusedRow());
    setFocusedRow(next);
    follow(next);
  };
  const moveUp = (): void => {
    if (!inGrid()) {
      return;
    }
    const next = prevVis(focusedRow());
    setFocusedRow(next);
    follow(next);
  };
  const home = (): void => {
    if (!inGrid()) {
      return;
    }
    if (kind() === "row") {
      setFocusedRow(0);
    } else {
      setFocusedCol(0);
    }
    follow(kind() === "row" ? 0 : focusedRow());
  };
  const end = (): void => {
    if (!inGrid()) {
      return;
    }
    const row = kind() === "row" ? lastVis() : focusedRow();
    setFocusedRow(row);
    if (kind() === "cell") {
      setFocusedCol(totalCols - 1);
    }
    follow(row);
  };
  const ctrlHome = (): void => {
    if (!inGrid()) {
      return;
    }
    setFocusedRow(0);
    follow(0);
  };
  const ctrlEnd = (): void => {
    if (!inGrid()) {
      return;
    }
    const row = lastVis();
    setFocusedRow(row);
    follow(row);
  };
  const enter = (): void => {
    if (
      inGrid() &&
      nav() === "cellsOnly" &&
      kind() === "cell" &&
      focusedCol() === 0 &&
      hasChildren(focusedRow())
    ) {
      toggleExpansion(focusedRow());
    }
  };
  const toggleSelect = (): void => {
    if (inGrid() && selection() === "multi") {
      setRow(focusedRow(), !rowSelected(focusedRow()));
    }
  };
  const selectAll = (): void => {
    if (inGrid() && selection() === "multi") {
      requestRows(PARENTS.map((_, index) => index));
    }
  };
  const extend = (row: number): void => {
    if (inGrid() && selection() === "multi" && kind() === "row") {
      const previous = focusedRow();
      setFocusedRow(row);
      const next = new Set(rowsOfMask(selectedMask()));
      next.add(previous);
      next.add(row);
      requestRows([...next].sort((a, b) => a - b));
    }
  };

  const canonicalKey = (event: KeyboardEvent): string => {
    const key = event.key;
    const space = key === " " || key === "Spacebar";
    if ((event.ctrlKey || event.metaKey) && (key === "Home" || key === "End")) {
      return `Control+${key}`;
    }
    if ((event.ctrlKey || event.metaKey) && (key === "a" || key === "A")) {
      return "Control+a";
    }
    if (event.shiftKey && space) {
      return "Shift+Space";
    }
    if (event.shiftKey && key.startsWith("Arrow")) {
      return `Shift+${key}`;
    }
    return space ? " " : key;
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    // a keydown on a focused cell bubbles to its row: only the element the key
    // actually landed on may handle it, or a cell key would act twice
    if (event.target !== event.currentTarget) {
      return;
    }
    if (!inGrid()) {
      return;
    }
    const key = canonicalKey(event);
    switch (key) {
      case "ArrowRight":
        right();
        break;
      case "ArrowLeft":
        left();
        break;
      case "ArrowDown":
        moveDown();
        break;
      case "ArrowUp":
        moveUp();
        break;
      case "Home":
        home();
        break;
      case "End":
        end();
        break;
      case "Control+Home":
        ctrlHome();
        break;
      case "Control+End":
        ctrlEnd();
        break;
      case "Enter":
        enter();
        break;
      case "Shift+Space":
        toggleSelect();
        break;
      case "Control+a":
        selectAll();
        break;
      case "Shift+ArrowDown":
        extend(nextVis(focusedRow()));
        break;
      case "Shift+ArrowUp":
        extend(prevVis(focusedRow()));
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const ariaExpanded = (row: number): "true" | "false" | undefined =>
    hasChildren(row) ? (isExpanded(row) ? "true" : "false") : undefined;
  const ariaSelected = (row: number): "true" | "false" | undefined =>
    rowSelected(row) ? "true" : selection() === "multi" ? "false" : undefined;

  const focusTargetPart = createMemo<string | null>(() => {
    if (!inGrid()) {
      return null;
    }
    return kind() === "row"
      ? treegridRowPart(focusedRow())
      : treegridCellPart(focusedRow(), focusedCol());
  });

  return {
    rows: () => totalRows,
    cols: () => totalCols,
    nav,
    selection,
    focusedRow,
    focusedCol,
    kind,
    inGrid,
    visible,
    hasChildren,
    isExpanded,
    isSelected: rowSelected,
    focusTargetPart,
    gridProps: {
      role: "treegrid",
      get "aria-multiselectable"() {
        return selection() === "multi" ? "true" : undefined;
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
        setInGrid(false);
      },
    },
    rowProps: (row) => ({
      role: "row",
      id: `${base}-row-${row}`,
      "aria-level": ariaLevel(row),
      "aria-setsize": ariaSetSize(row),
      "aria-posinset": ariaPosInSet(row),
      get "aria-expanded"() {
        return ariaExpanded(row);
      },
      get "aria-selected"() {
        return ariaSelected(row);
      },
      get tabindex() {
        return visible(row) && kind() === "row" && focusedRow() === row ? 0 : -1;
      },
      onFocus: () => focusRow(row),
      onKeyDown,
    }),
    cellProps: (row, col) => ({
      role: "gridcell",
      id: `${base}-cell-${row}-${col}`,
      get tabindex() {
        return visible(row) && kind() === "cell" && focusedRow() === row && focusedCol() === col
          ? 0
          : -1;
      },
      onFocus: () => focusCellElement(row, col),
      onClick: () => clickCell(row, col),
      onKeyDown,
    }),
    expanderProps: (row) => ({
      role: "button",
      get "aria-label"() {
        return isExpanded(row) ? "Collapse" : "Expand";
      },
      get "aria-expanded"() {
        return isExpanded(row) ? "true" : "false";
      },
      onClick: (event: MouseEvent) => {
        event.stopPropagation();
        toggleRow(row);
      },
      onMouseDown: (event: MouseEvent) => {
        event.preventDefault();
      },
    }),
    focus: () => {
      setInGrid(true);
      follow(focusedRow());
    },
    blur: () => {
      setInGrid(false);
    },
    clickCell,
    toggleRow,
    configureNav,
    configureSelection,
    setExpanded: (row, value) => {
      const next = new Set(expanded());
      if (value) {
        next.add(row);
      } else {
        next.delete(row);
      }
      setExpandedSet(next);
    },
  };
};

/** The `data-part` target the treegrid roving tab stop should focus. */
export const treegridFocusTargetPart = (grid: Treegrid): string | null => grid.focusTargetPart();
