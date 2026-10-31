import {
  createTreegrid,
  type Treegrid as TreegridController,
  type TreegridSelection,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createEffect, createMemo, For, Show, untrack } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

/** A column of the grid: the first one is the tree's own, the others are plain values. */
export interface TreegridColumn {
  /** Identity of the column: what a row's `cells` are asked for. */
  readonly key: string;
  /** The header cell's text. */
  readonly label: string;
  /** A size, a count: right-aligned with tabular figures. */
  readonly numeric?: boolean | undefined;
}

/** One row of the tree, in document order: a root, or a child of an earlier row. */
export interface TreegridRow {
  /** Identity of the row: what `defaultExpanded` and `defaultSelected` name. */
  readonly id: string;
  /** The index of this row's parent in `rows`; a root is `-1` (or left out). */
  readonly parent?: number | undefined;
  /** The first cell's text: the name the expander sits beside. */
  readonly label: string;
  /** The other cells, by column key: a missing key is an empty cell. */
  readonly cells?: Readonly<Record<string, string>> | undefined;
}

export interface TreegridProps {
  /** The tree, in document order. Read once, when the component is created. */
  readonly rows: ReadonlyArray<TreegridRow>;
  /** The columns, the tree column first. Read once, with `rows`. */
  readonly columns: ReadonlyArray<TreegridColumn>;
  /** The grid's accessible name. */
  readonly label: string;
  /** The rows open at mount, by id (uncontrolled). @default [] */
  readonly defaultExpanded?: ReadonlyArray<string> | undefined;
  /** The rows selected at mount, by id (uncontrolled). @default [] */
  readonly defaultSelected?: ReadonlyArray<string> | undefined;
  /** `"single"` (the default) follows the focus; `"multi"` adds `aria-multiselectable`. */
  readonly selection?: TreegridSelection | undefined;
  /** The selected ids, whenever the primitive accepts a selection request. */
  readonly onSelectionChange?: ((selected: ReadonlyArray<string>) => void) | undefined;
  /** The primitive, once: a page that moves the selection itself. */
  readonly onReady?: ((grid: TreegridController) => void) | undefined;
  /** The line under the grid; left out, the keys in one sentence. */
  readonly hint?: string | undefined;
  readonly class?: string | undefined;
}

const DEFAULT_HINT =
  "Keys: ↑ and ↓ move between rows, → expands a row and then enters its cells, ← collapses it, Home and End jump, Tab leaves the grid.";

const rootClass = css.cn(css.display("grid"), css.gap(t.space._2));

// The frame is the surface: the radius and the border are the kit's, and the dark mode moves the tokens underneath.
const frameClass = css.cn(
  css.display("flex"),
  css.flexDirection("column"),
  css.overflow("hidden"),
  css.boxSizing("border-box"),
  css.color(t.color.text),
  css.bg(t.color.surface),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.xl),
  css.fontSize(t.font.size),
);

const headerRowClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.bg(t.color.page),
  css.borderBottom("1px solid", t.color.border),
);

const rowClass = css.cn(
  css.display("flex"),
  css.alignItems("stretch"),
  css.minHeight(t.space._9),
  css.outline("none"),
  css.hover(css.bg(t.color.buttonBackground)),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
  css.attr("aria-selected", "true")(
    css.bg(t.color.highlight),
    css.color(t.color.onHighlight),
    css.hover(css.bg(t.color.highlightPressed)),
  ),
);

// The zebra is painted on every other visible row, so a collapsed branch never leaves a stripe behind.
const zebraClass = css.bg(t.color.page);

const cellClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.gap(t.space._1),
  css.minWidth("0"),
  css.padding(t.space._2, t.space._3),
  css.outline("none"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
);

const nameCellClass = css.cn(cellClass, css.flex("1"), css.overflow("hidden"));

const valueCellClass = css.cn(
  cellClass,
  css.flex("none"),
  css.width("7rem"),
  css.overflow("hidden"),
  css.whiteSpace("nowrap"),
  css.textOverflow("ellipsis"),
);

const numericCellClass = css.cn(
  valueCellClass,
  css.justifyContent("end"),
  css.fontVariantNumeric("tabular-nums"),
);

const headerCellClass = css.cn(
  cellClass,
  css.flex("none"),
  css.width("7rem"),
  css.fontWeight("500"),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);

const headerNameCellClass = css.cn(
  headerCellClass,
  css.flex("1"),
  css.width("auto"),
  css.overflow("hidden"),
);

const headerNumericCellClass = css.cn(headerCellClass, css.justifyContent("end"));

const expanderClass = css.cn(
  css.display("inline-flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.flex("none"),
  css.width(t.space._5),
  css.height(t.space._5),
  css.margin("0"),
  css.padding("0"),
  css.bg("transparent"),
  css.border("none"),
  css.borderRadius(t.radius.sm),
  css.color(t.color.muted),
  css.cursor("pointer"),
  css.hover(css.color(t.color.text)),
);

const chevronClass = css.cn(
  css.display("inline-block"),
  css.fontSize("0.65rem"),
  css.lineHeight(1),
  css.transition("transform 120ms"),
  css.within(css.attr("aria-expanded", "true"))(css.transform("rotate(90deg)")),
);

// A leaf keeps an empty slot where a parent's expander would be, so the names of one level line up.
const spacerClass = css.cn(css.width(t.space._5), css.flex("none"));

const nameClass = css.cn(
  css.overflow("hidden"),
  css.whiteSpace("nowrap"),
  css.textOverflow("ellipsis"),
);
const folderClass = css.fontWeight("500");

const hintClass = css.cn(
  css.margin("0"),
  css.padding("0", t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);

/** One step of the tree's indent, in the theme's own spacing; a row's level is the primitive's `aria-level`. */
const indent = (level: number): JSX.CSSProperties => ({
  "padding-inline-start": `calc(var(--space-3) * ${Math.max(1, level)})`,
});

/**
 * An APG treegrid, styled: `createTreegrid` owns the tree (which rows are visible, their levels, sizes and positions), the
 * expanders, the roving focus across rows and columns, the selection and the ARIA; the skin paints the frame, the zebra and
 * the hover and selected looks, indents each name by the level the primitive announces, turns the chevron with
 * `aria-expanded`, and moves the DOM focus to the row or cell the primitive has made its tab stop.
 *
 * The first column is the tree: its cell holds the expander and the name. The other columns are the row's `cells`. The
 * header row is the skin's: a treegrid's rows carry no header semantics of their own.
 */
export const Treegrid = (props: TreegridProps): JSX.Element => {
  const indexOf = new Map(props.rows.map((row, index) => [row.id, index] as const));
  const indices = (ids: ReadonlyArray<string>): ReadonlyArray<number> =>
    ids.flatMap((id) => {
      const index = indexOf.get(id);
      return index === undefined ? [] : [index];
    });

  const grid = createTreegrid({
    cols: props.columns.length,
    parents: props.rows.map((row) => row.parent ?? -1),
    defaultExpanded: indices(props.defaultExpanded ?? []),
    defaultValue: indices(props.defaultSelected ?? []),
    get selection() {
      return props.selection;
    },
    onValueChange: (selected) => {
      props.onSelectionChange?.(
        selected.flatMap((row) => {
          const data = props.rows[row];
          return data === undefined ? [] : [data.id];
        }),
      );
    },
  });
  untrack(() => props.onReady)?.(grid);

  let element: HTMLDivElement | undefined;
  // The primitive keeps the roving tabindex; real DOM focus is the host's to move to that stop when focus is inside.
  createEffect(
    () => `${grid.inGrid()}|${grid.kind()}|${grid.focusedRow()}|${grid.focusedCol()}`,
    () => {
      if (!grid.inGrid()) {
        return;
      }
      const roving = element?.querySelector<HTMLElement>('[tabindex="0"]');
      if (roving !== null && roving !== undefined && roving !== document.activeElement) {
        roving.focus();
      }
    },
  );

  // Only the rows the primitive says are visible are built: a collapsed branch is not in the DOM, and the zebra is the
  // stripe of the row's place among the visible ones.
  const visible = createMemo(() =>
    props.rows.flatMap((_, index) => (grid.visible(index) ? [index] : [])),
  );

  return (
    <div data-part="treegrid-root" class={css.cn(rootClass, props.class)}>
      <div
        {...grid.gridProps}
        data-part="treegrid"
        aria-label={props.label}
        class={frameClass}
        ref={(node: HTMLDivElement) => {
          element = node;
        }}
      >
        <div role="row" data-part="treegrid-header" class={headerRowClass}>
          <For each={props.columns}>
            {(column, col) => (
              <div
                role="columnheader"
                data-part="treegrid-header-cell"
                data-numeric={column.numeric === true ? "true" : undefined}
                class={
                  col() === 0
                    ? headerNameCellClass
                    : column.numeric === true
                      ? headerNumericCellClass
                      : headerCellClass
                }
              >
                {column.label}
              </div>
            )}
          </For>
        </div>
        <For each={visible()}>
          {(row, position) => {
            const rowProps = grid.rowProps(row);
            const data = props.rows[row];
            return (
              <div
                {...rowProps}
                data-part="treegrid-row"
                data-id={data?.id}
                data-index={row}
                class={css.cn(rowClass, position() % 2 === 1 ? zebraClass : "")}
              >
                <For each={props.columns}>
                  {(column, col) => (
                    <div
                      {...grid.cellProps(row, col())}
                      data-part="treegrid-cell"
                      data-id={data?.id}
                      data-index={row}
                      data-col={col()}
                      data-numeric={column.numeric === true ? "true" : undefined}
                      class={
                        col() === 0
                          ? nameCellClass
                          : column.numeric === true
                            ? numericCellClass
                            : valueCellClass
                      }
                      style={col() === 0 ? indent(rowProps["aria-level"]) : undefined}
                    >
                      <Show
                        when={col() === 0}
                        fallback={<span class={nameClass}>{data?.cells?.[column.key] ?? ""}</span>}
                      >
                        <Show
                          when={grid.hasChildren(row)}
                          fallback={<span class={spacerClass} aria-hidden="true" />}
                        >
                          <span
                            {...grid.expanderProps(row)}
                            data-part="treegrid-expander"
                            class={expanderClass}
                          >
                            <span aria-hidden="true" class={chevronClass}>
                              ▸
                            </span>
                          </span>
                        </Show>
                        <span class={css.cn(nameClass, grid.hasChildren(row) ? folderClass : "")}>
                          {data?.label}
                        </span>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            );
          }}
        </For>
      </div>
      <p data-part="treegrid-hint" class={hintClass}>
        {props.hint ?? DEFAULT_HINT}
      </p>
    </div>
  );
};
