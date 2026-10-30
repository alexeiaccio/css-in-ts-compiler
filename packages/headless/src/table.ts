import { type Accessor, createUniqueId } from "solid-js";
import { createControllable } from "./controllable";

/**
 * A data table on Solid 2: sortable column headers and row selection, as state
 * plus getter-backed attribute objects; no elements, no styling.
 *
 * **The host renders a native `<table>`**: `<caption>`, `<thead>`, `<tbody>`,
 * `<th scope="col">` and `<td>` carry the semantics, so the primitive adds no
 * `role` and no `aria-rowindex` — only what a native table cannot say itself
 * (which column is sorted, whether a row is selected, the mixed select-all
 * state, and the totals a windowed table hides).
 *
 * **Sorting is the host's data.** The primitive carries the sort descriptor and
 * announces it (`aria-sort`); it never sorts. The host maps `sort()` onto its
 * own array before rendering `rows`.
 *
 * Composes the two state models the package already has — `grid-sort.qnt` and
 * `grid-selection.qnt` — without their navigation: a table is a grid with a
 * `th[scope]` header row, and the cells keep their own focus.
 *
 * Request/commit (map ticket `rt1p`): the sort and the selection are
 * uncontrolled by default (`defaultSort` / `defaultSelected`) and can be owned
 * by the host with `sort` + `onSortChange` / `selected` + `onSelectionChange`.
 * `null` as `sort` is "no column sorted" (in a controlled host); `undefined` is
 * "uncontrolled". `toggleRow`, `toggleAll` and the header button are requests:
 * a controlled host may ignore them.
 */

export type TableSortDirection = "ascending" | "descending";
export type TableSelectionMode = "none" | "single" | "multiple";
/**
 * `"tri-state"`: ascending -> descending -> unsorted, so a table can be put back
 * in its own order (the bean's requirement). `"toggle"`: ascending <-> descending,
 * never unsorted, which is what the APG grid example (and `grid-sort.qnt`) does.
 */
export type TableSortCycle = "tri-state" | "toggle";

export interface TableSort {
  readonly key: string;
  readonly direction: TableSortDirection;
}

export interface TableColumn {
  /** Identity of the column: what `cellProps` and `headerCellProps` are asked for. */
  readonly key: string;
  /** Defaults to `true`; `false` makes the header inert (no sort button, no `aria-sort`). */
  readonly sortable?: boolean | undefined;
  /**
   * A layout hint for the host's skin (right-aligned, tabular figures). HTML has
   * no attribute for it, so the primitive carries nothing.
   */
  readonly numeric?: boolean | undefined;
  /** The `abbr` of the header cell: the short form a screen reader uses. */
  readonly abbr?: string | undefined;
}

export interface TableLabels {
  /** The table's accessible name; a host that renders a `<caption>` leaves it out. */
  readonly table?: string | undefined;
  /** Defaults to "Select all rows". */
  readonly selectAll?: string | undefined;
  /** Defaults to `Select row <id>`. */
  readonly selectRow?: ((id: string) => string) | undefined;
}

export interface TableOptions {
  readonly columns: ReadonlyArray<TableColumn>;
  /**
   * The row ids the host renders, in render order. Ids, not a count: the sort
   * reorders the host's data and a selection must survive that, while an index
   * would then name a different row. The row's visible content stays the host's.
   */
  readonly rows: ReadonlyArray<string>;
  readonly selection?: TableSelectionMode | undefined;
  readonly sortCycle?: TableSortCycle | undefined;
  /** Controlled: the host owns the sort and this is the only thing that changes it; `null` is "unsorted". */
  readonly sort?: TableSort | null | undefined;
  /** Uncontrolled starting sort; ignored while `sort` is set. */
  readonly defaultSort?: TableSort | undefined;
  /** A request to re-sort (`undefined` = unsorted); uncontrolled it is accepted. */
  readonly onSortChange?: ((sort: TableSort | undefined) => void) | undefined;
  /** Controlled: the host owns the selected row ids and this is the only thing that changes them. */
  readonly selected?: ReadonlyArray<string> | undefined;
  /** Uncontrolled starting selection; ignored while `selected` is set. */
  readonly defaultSelected?: ReadonlyArray<string> | undefined;
  /** A request to change the selection; uncontrolled it is accepted. */
  readonly onSelectionChange?: ((selected: ReadonlyArray<string>) => void) | undefined;
  /**
   * The total row count when the host renders a window of `rows`
   * (`aria-rowcount`); absent on a table that renders all of them.
   */
  readonly rowCount?: number | undefined;
  /**
   * The total column count when the host renders a window of `columns`
   * (`aria-colcount` and `aria-colindex`); absent on a table that renders all.
   */
  readonly columnCount?: number | undefined;
  readonly labels?: TableLabels | undefined;
  /** Base for generated ids. */
  readonly id?: string | undefined;
}

/** Spread onto `<table>`; the host renders the table, the head and the body. */
export interface TableProps {
  /** `labels.table`; leave it out when the host renders a caption. */
  readonly "aria-label": string | undefined;
  /** Only while the host windows its rows. */
  readonly "aria-rowcount": number | undefined;
  /** Only while the host windows its columns. */
  readonly "aria-colcount": number | undefined;
}

/** Spread onto `<caption>`. */
export interface TableCaptionProps {
  readonly id: string;
}

/** Spread onto `<th scope="col">` in the header row. */
export interface TableHeaderCellProps {
  readonly scope: "col";
  /** The sorted column only; an unsorted one carries nothing (ARIA's default). */
  readonly "aria-sort": TableSortDirection | undefined;
  readonly abbr: string | undefined;
}

/** Spread onto the `<button type="button">` inside a sortable `<th>`. */
export interface TableHeaderButtonProps {
  readonly type: "button";
  readonly onClick: () => void;
}

/** Spread onto `<tr>` in the body. */
export interface TableRowProps {
  readonly "aria-selected": "true" | "false" | undefined;
  /** Selects the row; `undefined` when nothing is selectable. */
  readonly onClick: (() => void) | undefined;
}

/** Spread onto a `<td>`; `aria-colindex` only while the host windows its columns. */
export interface TableCellProps {
  readonly "aria-colindex": number | undefined;
}

/**
 * Spread onto the select-all control: a `role=checkbox` element (not a native
 * `input`, which spells the mixed state as a DOM property, not an attribute).
 */
export interface TableSelectAllProps {
  readonly role: "checkbox";
  readonly "aria-checked": "true" | "false" | "mixed";
  readonly "aria-label": string;
  readonly tabindex: 0;
  readonly onClick: () => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

/** Spread onto a row's selection control. */
export interface TableRowCheckboxProps {
  readonly role: "checkbox";
  readonly "aria-checked": "true" | "false";
  readonly "aria-label": string;
  readonly tabindex: 0;
  /** Selects the row and stops there: the control sits inside the row, whose click would select again. */
  readonly onClick: (event: MouseEvent) => void;
  readonly onKeyDown: (event: KeyboardEvent) => void;
}

export interface Table {
  readonly selectionMode: Accessor<TableSelectionMode>;
  /** The sort descriptor, or `undefined` when nothing is sorted. */
  readonly sort: Accessor<TableSort | undefined>;
  readonly selected: Accessor<ReadonlyArray<string>>;
  readonly isSelected: (id: string) => boolean;
  readonly tableProps: TableProps;
  readonly captionProps: TableCaptionProps;
  readonly headerCellProps: (key: string) => TableHeaderCellProps;
  /** `undefined` for a column that is not sortable — render no button there. */
  readonly headerButtonProps: (key: string) => TableHeaderButtonProps | undefined;
  readonly rowProps: (id: string) => TableRowProps;
  readonly cellProps: (rowId: string, key: string) => TableCellProps;
  /** `undefined` unless `selection` is `"multiple"`: one control over one selection is meaningless. */
  readonly selectAllProps: TableSelectAllProps | undefined;
  /** `undefined` while `selection` is `"none"`. */
  readonly rowCheckboxProps: (id: string) => TableRowCheckboxProps | undefined;
  readonly toggleAll: () => void;
  readonly toggleRow: (id: string) => void;
}

const normalize = (ids: ReadonlyArray<string>): ReadonlyArray<string> => [...new Set(ids)];

const sameSet = (a: ReadonlyArray<string>, b: ReadonlyArray<string>): boolean =>
  a.length === b.length && a.every((id) => b.includes(id));

const sameSort = (a: TableSort | null, b: TableSort | null): boolean =>
  a === null || b === null ? a === b : a.key === b.key && a.direction === b.direction;

const isToggleKey = (event: KeyboardEvent): boolean =>
  event.key === " " || event.key === "Spacebar" || event.key === "Enter";

/**
 * Every option is read when an attribute is read, so pass props/getters, never a
 * destructured snapshot. `id` is captured once: it is the base of the caption id.
 */
export const createTable = (options: TableOptions): Table => {
  const base = options.id ?? createUniqueId();
  const selectionMode = (): TableSelectionMode => options.selection ?? "none";
  const selectable = (): boolean => selectionMode() !== "none";

  const columnOf = (key: string): TableColumn | undefined =>
    options.columns.find((column) => column.key === key);
  const isSortable = (key: string): boolean => columnOf(key)?.sortable !== false;

  const [rawSort, requestSort] = createControllable<TableSort | null>({
    value: () => options.sort,
    initial: options.defaultSort ?? null,
    onChange: () => (next) => options.onSortChange?.(next ?? undefined),
    same: sameSort,
  });
  const sort = (): TableSort | undefined => rawSort() ?? undefined;

  const [rawSelected, requestSelection] = createControllable<ReadonlyArray<string>>({
    value: () => options.selected,
    initial: normalize(options.defaultSelected ?? []),
    onChange: () => options.onSelectionChange,
    same: sameSet,
  });
  const selected = (): ReadonlyArray<string> => normalize(rawSelected());
  const isSelected = (id: string): boolean => selected().includes(id);

  // The header button's intent: a new column starts ascending; the sorted one
  // goes on (tri-state) or back (toggle), and a tri-state third press clears it.
  const nextSort = (key: string): TableSort | null => {
    const current = rawSort();
    if (current === null || current.key !== key) {
      return { key, direction: "ascending" };
    }
    if (current.direction === "ascending") {
      return { key, direction: "descending" };
    }
    return (options.sortCycle ?? "tri-state") === "toggle" ? { key, direction: "ascending" } : null;
  };

  const toggleRow = (id: string): void => {
    const mode = selectionMode();
    if (mode === "none") {
      return;
    }
    const current = selected();
    const has = current.includes(id);
    requestSelection(
      mode === "single"
        ? has
          ? []
          : [id]
        : has
          ? current.filter((value) => value !== id)
          : [...current, id],
    );
  };

  // All/none are judged on the rows this table renders; a windowed table's
  // select-all therefore covers its window and keeps the rest of the selection.
  const rows = (): ReadonlyArray<string> => options.rows;
  const allSelected = (): boolean => {
    const every = rows();
    return every.length > 0 && every.every(isSelected);
  };
  const someSelected = (): boolean => rows().some(isSelected);

  const toggleAll = (): void => {
    if (selectionMode() !== "multiple") {
      return;
    }
    const current = selected();
    if (allSelected()) {
      requestSelection(current.filter((id) => !rows().includes(id)));
      return;
    }
    requestSelection(normalize([...current, ...rows()]));
  };

  const keyedToggle =
    (toggle: () => void) =>
    (event: KeyboardEvent): void => {
      if (!isToggleKey(event)) {
        return;
      }
      // On a native <button> this also cancels the click the key would synthesise.
      event.preventDefault();
      toggle();
    };

  const selectAll = (): TableSelectAllProps | undefined => {
    if (selectionMode() !== "multiple") {
      return undefined;
    }
    return {
      role: "checkbox",
      get "aria-checked"() {
        return allSelected() ? "true" : someSelected() ? "mixed" : "false";
      },
      get "aria-label"() {
        return options.labels?.selectAll ?? "Select all rows";
      },
      tabindex: 0,
      onClick: () => {
        toggleAll();
      },
      onKeyDown: keyedToggle(toggleAll),
    };
  };

  const rowCheckbox = (id: string): TableRowCheckboxProps | undefined => {
    if (!selectable()) {
      return undefined;
    }
    return {
      role: "checkbox",
      get "aria-checked"() {
        return isSelected(id) ? "true" : "false";
      },
      get "aria-label"() {
        return options.labels?.selectRow?.(id) ?? `Select row ${id}`;
      },
      tabindex: 0,
      onClick: (event) => {
        // the control is inside the row, whose onClick would toggle the same row
        event.stopPropagation();
        toggleRow(id);
      },
      onKeyDown: keyedToggle(() => toggleRow(id)),
    };
  };

  return {
    selectionMode,
    sort,
    selected,
    isSelected,
    tableProps: {
      get "aria-label"() {
        return options.labels?.table;
      },
      get "aria-rowcount"() {
        return options.rowCount;
      },
      get "aria-colcount"() {
        return options.columnCount;
      },
    },
    captionProps: { id: `${base}-caption` },
    headerCellProps: (key) => ({
      scope: "col",
      get "aria-sort"() {
        const current = rawSort();
        return current !== null && current.key === key && isSortable(key)
          ? current.direction
          : undefined;
      },
      get abbr() {
        return columnOf(key)?.abbr;
      },
    }),
    headerButtonProps: (key) => {
      if (!isSortable(key)) {
        return undefined;
      }
      return {
        type: "button",
        onClick: () => {
          requestSort(nextSort(key));
        },
      };
    },
    rowProps: (id) => ({
      get "aria-selected"() {
        if (!selectable()) {
          return undefined;
        }
        return isSelected(id) ? "true" : "false";
      },
      get onClick() {
        return selectable() ? () => toggleRow(id) : undefined;
      },
    }),
    cellProps: (_rowId, key) => ({
      get "aria-colindex"() {
        // ponytail: a column window is numbered from the first column given;
        // add a column offset when a horizontal scroller starts elsewhere.
        if (options.columnCount === undefined) {
          return undefined;
        }
        const index = options.columns.findIndex((column) => column.key === key);
        return index < 0 ? undefined : index + 1;
      },
    }),
    get selectAllProps() {
      return selectAll();
    },
    rowCheckboxProps: (id) => rowCheckbox(id),
    toggleAll,
    toggleRow,
  };
};
