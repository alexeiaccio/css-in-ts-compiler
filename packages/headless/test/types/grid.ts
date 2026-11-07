// What `createGrid`'s props accept and reject (effect-tsrs -p tsconfig.json; `@ts-expect-error` marks what must fail).
import { type Grid, type GridCellProps, createGrid } from "../../src/grid";
import { focusgridAttribute } from "../../src/focusgrid";

const grid = createGrid({ rows: 2, cols: 2 });
const cell = grid.cellProps(0, 0);
const widget = grid.widgetProps(0, 0);

export const props = {
  // the constant focusability value, not the roving stop
  focusable: cell.tabindex,
  // the platform's entry marker, on the current cell only
  entry: cell.focusgroupstart,
  cell: cell.ref,
  widgetFocusable: widget.tabindex,
  widgetEntry: widget.focusgroupstart,
  widget: widget.ref,
  focusgroup: grid.gridProps.focusgroup,
  owner: grid.gridProps.ref,
  currentCell: grid.currentCellId(),
  attribute: focusgridAttribute({ rowEdge: "flow", colEdge: "none", memory: true }),
};

// The cells carry no delegated key handler: the owner's `ref` registers the
// primitive's keydown before the runtime's (a delegated Solid handler runs at
// the document, after the runtime has moved focus).
// @ts-expect-error a delegated `onKeyDown` would run after the runtime moved focus
export const withKeyDown: GridCellProps & {
  readonly onKeyDown: (event: KeyboardEvent) => void;
} = cell;

// The owner props name the focusgroup and its ref, not a handler.
// @ts-expect-error the body's keys live on the owner's listener, not on the props
export const ownerKeyDown: Grid["gridProps"] & {
  readonly onKeyDown: (event: KeyboardEvent) => void;
} = grid.gridProps;

// The header row keeps its own one-dimensional roving and opts out of the body group.
export const headerOptOut: "none" = grid.headerProps(0).focusgroup;
