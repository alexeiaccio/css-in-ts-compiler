import {
  createTable,
  type Table as TableController,
  type TableColumn,
  type TableOptions,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, merge, Show, untrack, useContext } from "solid-js";

import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/** What `render` gets: the props of the part, `data-part` and the caller's class merged in. */
export interface TablePartProps extends PartProps, Renderable<TablePartProps, void> {}

/** A part that carries nothing of its own: the scroller, the head, the body, the caption. */
export interface TableSectionProps extends TablePartProps {}

export interface TableProps
  extends Omit<TableOptions, "columns" | "rows" | "id">, Renderable<TablePartProps, void> {
  readonly columns: ReadonlyArray<TableColumn>;
  readonly rows: TableOptions["rows"];
  readonly id?: string;
  /** A visible `<caption>`, which also names the table; without one pass `labels.table`. */
  readonly caption?: JSX.Element;
  readonly class?: string;
  readonly children?: JSX.Element;
  /** The primitive, once: a page that sorts its own data from the sort it announces. */
  readonly onReady?: (table: TableController) => void;
}

/** One body row: its id, which is what the primitive selects and what the cells of the row are asked for. */
export interface TableRowProps extends Renderable<TablePartProps, void> {
  readonly row: string;
  readonly class?: string;
  readonly children?: JSX.Element;
}

/** A header cell: its column key, and the label a sort button or the cell shows. */
export interface TableHeaderCellProps extends Renderable<TablePartProps, void> {
  readonly column: string;
  readonly class?: string;
  readonly children?: JSX.Element;
}

/** A body cell: its column key; the row comes from the `TableRow` it sits in. */
export interface TableCellProps extends Renderable<TablePartProps, void> {
  readonly column: string;
  readonly class?: string;
  readonly children?: JSX.Element;
}

/** A row's control: the row it selects. */
export interface TableRowCheckboxProps extends Renderable<TablePartProps, void> {
  readonly row: string;
  readonly class?: string;
}

const TableContext = createContext<{
  readonly table: TableController;
  readonly columns: ReadonlyArray<TableColumn>;
}>();

const RowContext = createContext<{ readonly row: string }>();

const scroll = css.cn(css.overflowX("auto"), css.maxWidth("100%"));

const table = css.cn(
  css.borderCollapse("collapse"),
  css.width("100%"),
  css.fontSize(t.font.size),
  css.color(t.color.text),
  css.textAlign("start"),
);

const caption = css.cn(
  css.padding(t.space._2, t.space._3),
  css.fontWeight("500"),
  css.textAlign("start"),
);

// A header cell is the group the sort arrow reads: the arrow is a child, and what it shows is the `aria-sort` the primitive
// puts on the cell, so the skin keeps no copy of the sort. A numeric column's body cells right-align, and its header's button
// follows, so the arrow stays next to the label.
const headerCell = css.cn(
  css.group("table"),
  css.padding(t.space._2, t.space._3),
  css.borderBottom("1px solid", t.color.border),
  css.fontWeight("500"),
  css.whiteSpace("nowrap"),
  css.attr("data-numeric", "true")(css.textAlign("end")),
);

const sortButton = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._1),
  css.width("100%"),
  css.padding("0"),
  css.bg("transparent"),
  css.border("none"),
  css.color("inherit"),
  css.font("inherit"),
  css.textAlign("start"),
  css.cursor("pointer"),
  css.borderRadius(t.radius.sm),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.within(css.attr("data-numeric", "true"), "table")(css.justifyContent("end")),
);

// The arrow is the announced sort and nothing else: hidden while the column is unsorted (so the label does not shift), up
// when ascending and the same glyph turned over when descending.
const sortArrow = css.cn(
  css.fontSize("0.6em"),
  css.color(t.color.muted),
  css.lineHeight("1"),
  css.visibility("hidden"),
  css.within(css.attr("aria-sort", "ascending"), "table")(css.visibility("visible")),
  css.within(css.attr("aria-sort", "descending"), "table")(
    css.visibility("visible"),
    css.transform("rotate(180deg)"),
  ),
);

// The selected row is the primitive's `aria-selected`; a hover on a row that selects is the affordance for the click the
// row carries, and a row that does not select stays flat.
const bodyRow = css.cn(
  css.attr("data-selectable", "true")(
    css.cursor("pointer"),
    css.hover(css.bg(t.color.buttonBackground)),
  ),
  css.attr("aria-selected", "true")(css.bg(t.color.buttonBackground)),
);

const cell = css.cn(
  css.padding(t.space._2, t.space._3),
  css.borderBottom("1px solid", t.color.border),
  css.verticalAlign("middle"),
  css.attr("data-numeric", "true")(css.textAlign("end"), css.fontVariantNumeric("tabular-nums")),
);

const selectionCell = css.cn(css.width(t.space._6), css.paddingInlineEnd("0"));

// A checkbox is drawn as a box, because a native input cannot say `mixed`: hidden until the state it follows says it is on.
const controlClass = css.cn(
  css.group(),
  css.display("inline-flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.boxSizing("border-box"),
  css.width(t.space._5),
  css.height(t.space._5),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.sm),
  css.bg(t.color.surface),
  css.color(t.color.onHighlight),
  css.cursor("pointer"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
  css.attr("aria-checked", "true")(
    css.bg(t.color.highlight),
    css.border("1px solid", t.color.highlight),
  ),
  css.attr("aria-checked", "mixed")(
    css.bg(t.color.highlight),
    css.border("1px solid", t.color.highlight),
  ),
);

const mark = css.cn(css.display("none"), css.fontSize("0.65rem"), css.lineHeight("1"));
const checkMark = css.cn(mark, css.within(css.attr("aria-checked", "true"))(css.display("inline")));
const mixedMark = css.cn(
  mark,
  css.within(css.attr("aria-checked", "mixed"))(css.display("inline")),
);

/**
 * A data table on a native `<table>`: `createTable` owns the sort, the selection and the ARIA, and this skin paints them.
 *
 * The parts are the ones the element tree needs, and each is a part a caller can `render` over: `TableScroll` (a kit-only
 * box that scrolls a wide table sideways), `Table` (the `<table>`, its caption and the primitive's context), `TableHead`
 * (the header row, with the selection cell in front as soon as the table selects; the select-all is in it only for
 * `"multiple"`), `TableHeaderCell` (a `th` whose sort
 * button carries no state but its `aria-sort`), `TableBody`, `TableRow` (a `tr`, with the row's control in front when the
 * table is selectable), `TableCell` and the two controls. A row is named by its id; a cell takes its column key.
 *
 * Sorting is the host's: the primitive announces the descriptor, `onSortChange` asks for a new one, and the host reorders
 * its own array. The arrow, the selected row and the checkbox marks are painted from the announced attributes.
 */
export const Table = (props: TableProps): JSX.Element => {
  const tableControl = createTable({
    columns: props.columns,
    get rows() {
      return props.rows;
    },
    get selection() {
      return props.selection;
    },
    get sortCycle() {
      return props.sortCycle;
    },
    get sort() {
      return props.sort;
    },
    get defaultSort() {
      return props.defaultSort;
    },
    get onSortChange() {
      return props.onSortChange;
    },
    get selected() {
      return props.selected;
    },
    get defaultSelected() {
      return props.defaultSelected;
    },
    get onSelectionChange() {
      return props.onSelectionChange;
    },
    get rowCount() {
      return props.rowCount;
    },
    get columnCount() {
      return props.columnCount;
    },
    get labels() {
      return props.labels;
    },
    id: props.id,
  });
  untrack(() => props.onReady)?.(tableControl);

  const merged = merge(tableControl.tableProps, () => ({
    "data-part": "table",
    get class() {
      return css.cn(table, props.class);
    },
  }));
  return (
    <TableContext value={{ table: tableControl, columns: props.columns }}>
      {renderPart(props, merged, undefined, (part) => (
        <table {...part}>
          <Show when={props.caption !== undefined}>
            <TableCaption>{props.caption}</TableCaption>
          </Show>
          {props.children}
        </table>
      ))}
    </TableContext>
  );
};

/** The kit-only box around a wide table: it scrolls sideways instead of pushing the page out. */
export const TableScroll = (props: TableSectionProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "table-scroll",
      get class() {
        return css.cn(scroll, props.class);
      },
    },
    undefined,
    (part) => <div {...part}>{props.children}</div>,
  );

/** The table's visible name: `TableOptions.labels.table` is the name of a table without one. */
export const TableCaption = (props: TableSectionProps): JSX.Element => {
  const { table: control } = useContext(TableContext);
  return renderPart(
    props,
    merge(control.captionProps, () => ({
      "data-part": "table-caption",
      get class() {
        return css.cn(caption, props.class);
      },
    })),
    undefined,
    (part) => <caption {...part}>{props.children}</caption>,
  );
};

/** The header row: a selection cell comes first whenever the rows carry a control, and the select-all only for multiple. */
export const TableHead = (props: TableSectionProps): JSX.Element => {
  const { table: control } = useContext(TableContext);
  return renderPart(
    props,
    {
      "data-part": "table-head",
      get class() {
        return css.cn(props.class);
      },
    },
    undefined,
    (part) => (
      <thead {...part}>
        <tr>
          {/* the control only for multiple selection, but the cell in every selectable mode: the body rows carry one */}
          <Show when={control.selectionMode() !== "none"}>
            <th data-part="table-select-all-cell" class={selectionCell}>
              <TableSelectAll />
            </th>
          </Show>
          {props.children}
        </tr>
      </thead>
    ),
  );
};

/** A header cell: the sort button only where the primitive says the column sorts. */
export const TableHeaderCell = (props: TableHeaderCellProps): JSX.Element => {
  const { table: control, columns } = useContext(TableContext);
  const button = control.headerButtonProps(props.column);
  const merged = merge(control.headerCellProps(props.column), () => ({
    "data-part": "table-header-cell",
    get class() {
      return css.cn(headerCell, props.class);
    },
    get "data-numeric"() {
      return columns.find((column) => column.key === props.column)?.numeric === true
        ? "true"
        : undefined;
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <th {...part}>
      {button === undefined ? (
        props.children
      ) : (
        <button {...button} data-part="table-sort" class={sortButton}>
          <span>{props.children}</span>
          <span aria-hidden="true" data-part="table-sort-arrow" class={sortArrow}>
            ▲
          </span>
        </button>
      )}
    </th>
  ));
};

export const TableBody = (props: TableSectionProps): JSX.Element =>
  renderPart(
    props,
    {
      "data-part": "table-body",
      get class() {
        return css.cn(props.class);
      },
    },
    undefined,
    (part) => <tbody {...part}>{props.children}</tbody>,
  );

/** One body row: the primitive's `aria-selected` and click, its control in front, and the row id for every cell. */
export const TableRow = (props: TableRowProps): JSX.Element => {
  const { table: control } = useContext(TableContext);
  const merged = merge(control.rowProps(props.row), () => ({
    "data-part": "table-row",
    get class() {
      return css.cn(bodyRow, props.class);
    },
    get "data-selectable"() {
      return control.rowProps(props.row).onClick === undefined ? undefined : "true";
    },
  }));
  return renderPart(props, merged, undefined, (part) => (
    <tr {...part}>
      <Show when={control.rowCheckboxProps(props.row)}>
        <td data-part="table-select-cell" class={selectionCell}>
          <TableRowCheckbox row={props.row} />
        </td>
      </Show>
      <RowContext value={{ row: props.row }}>{props.children}</RowContext>
    </tr>
  ));
};

/** A body cell: its `aria-colindex` while the host windows its columns, and right alignment on a numeric column. */
export const TableCell = (props: TableCellProps): JSX.Element => {
  const { table: control, columns } = useContext(TableContext);
  const row = useContext(RowContext);
  const merged = merge(control.cellProps(row?.row ?? "", props.column), () => ({
    "data-part": "table-cell",
    get class() {
      return css.cn(cell, props.class);
    },
    get "data-numeric"() {
      return columns.find((column) => column.key === props.column)?.numeric === true
        ? "true"
        : undefined;
    },
  }));
  return renderPart(props, merged, undefined, (part) => <td {...part}>{props.children}</td>);
};

/** The select-all of a multi-selectable table; nothing at all in any other mode. */
export const TableSelectAll = (props: TablePartProps): JSX.Element | null => {
  const { table: control } = useContext(TableContext);
  const all = control.selectAllProps;
  if (all === undefined) {
    return null;
  }
  return renderPart(
    props,
    merge(all, {
      "data-part": "table-select-all",
      get class() {
        return css.cn(controlClass, props.class);
      },
    }),
    undefined,
    (part) => (
      <span {...part}>
        <span aria-hidden="true" class={checkMark}>
          ✓
        </span>
        <span aria-hidden="true" class={mixedMark}>
          –
        </span>
      </span>
    ),
  );
};

/** A row's control: it stops its own click from reaching the row, which the primitive owns. */
export const TableRowCheckbox = (props: TableRowCheckboxProps): JSX.Element | null => {
  const { table: control } = useContext(TableContext);
  const own = control.rowCheckboxProps(props.row);
  if (own === undefined) {
    return null;
  }
  return renderPart(
    props,
    merge(own, {
      "data-part": "table-row-checkbox",
      get class() {
        return css.cn(controlClass, props.class);
      },
    }),
    undefined,
    (part) => (
      <span {...part}>
        <span aria-hidden="true" class={checkMark}>
          ✓
        </span>
      </span>
    ),
  );
};
