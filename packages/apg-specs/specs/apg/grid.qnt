// WAI-ARIA APG — grid (data grid + layout grid): one tab stop, 2-D navigation, edit mode.
//
// Modelled from https://www.w3.org/WAI/ARIA/apg/patterns/grid/ :
//   - "Keyboard Interaction For Data Grids"      (no wrapping, arrows, Home/End,
//                                                 Ctrl+Home/End, PageUp/PageDown)
//   - "Keyboard Interaction For Layout Grids"    (optional wrapping across row /
//                                                 column boundaries)
//   - "Whether to Focus on a Cell Or an Element Inside It"
//   - "Editing and Navigating Inside a Cell"     (Enter / F2 / Escape / alphanumeric)
//   - "WAI-ARIA Roles, States, and Properties"   (aria-rowindex/colindex/rowcount/
//                                                 colcount/readonly, roving tabindex)
// and the examples https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/
// and https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/layout-grids/
// (data-wrap-cols / data-wrap-rows, PageDown/PageUp by a fixed row count, tabindex
// on the cell or on the widget inside it).
//
// The grid is a bounded ROWS x COLS body (header row: see grid-sort.qnt;
// selection: see grid-selection.qnt). Focus is the pair (row, col); a cell is
// addressed by the linear index row * COLS + col.
//
// **The platform owns the movement and the tab stop.** Arrows on both axes,
// Home / End (the row's ends), Ctrl+Home / Ctrl+End (the grid's), the per-axis
// edges and the roving stop are the `focusgroup="grid"` (V2) contract of
// `specs/patterns/focusgrid.qnt`, which `packages/headless/src/focusgrid.ts`
// provides today and a browser will provide later. The landing defs below are
// that contract's `inlineLand` / `blockLand` / `edgeLand` restated, because a
// deterministic reference model has to answer where a key lands; the grid owns
// none of them. What the grid keeps is its delta: edit mode, selection
// (grid-selection.qnt), sort (grid-sort.qnt), PageUp / PageDown (a grid defines
// no page movement, so the platform never sees those keys), the mount window
// and the ARIA indices.
//
// **The wrap options are the platform's `flow`, not `wrap`.** `wrapCols` means
// "Right on the last column continues into the next row's first cell" and
// `wrapRows` the same down the rows: that is APG's *linear* wrapping
// (`data-wrap-cols` / `data-wrap-rows`), which the platform calls `flow`
// (continue into the adjacent row / column, wrapping at the outer edge). A hard
// edge is `none`, a data grid is hard on both axes. The stop is imported from
// shared/focusgroup.qnt (`fgTabIndex`, `fgEntry`, `fgStopOnLeave`), so the
// rendered tabindex is the platform's and not a second copy of the rule.
//
// **Grids have memory, unlike the tablist and the radiogroup.** The definition
// is `memory: true`: the stop is the focused cell while focus is inside, and
// the LAST focused cell once it leaves (`fgStopOnLeave(true, …)`). `tabs.qnt`
// is `nomemory` and falls back to the selected tab; a grid does not. The
// `focusgroupstart` marker rides on the current cell (`start` below), so it is
// the entry cell only until focus has been inside — after that the platform's
// own memory is what the next Tab lands on, which the `TabStopIsCurrent`
// invariant pins.
//
// Events: `key` (the keydown alphabet below), `click` (pointer on a cell),
// `focus_in` / `focus_out` (focus enters / leaves the grid, as focusin /
// focusout), and prop changes `set_kind`, `set_wrap_cols`, `set_wrap_rows`,
// `set_focus_target`, `set_readonly`. The ARIA contract is the derived defs
// (tabindex, aria-*), not state.
//
// Deliberate decisions where APG says "optional" / "may":
//   - a data grid never wraps (APG: wrapping "would be disorienting" in a data
//     grid), so switching to a data grid clears both wrap flags; a layout grid
//     flows only where its options say;
//   - Enter or F2 in edit mode commits and restores grid navigation; Escape
//     cancels (discards the draft) and restores navigation;
//   - leaving the grid (blur, click elsewhere in the grid) commits an edit;
//   - a read-only cell (last column) and a read-only grid never enter edit mode;
//     turning the grid read-only mid-edit cancels the edit;
//   - while editing, every other key belongs to the input (focus never moves).
//
// Deliberate omissions (no state / no events for them):
//   - header rows/cells, sort and aria-sort (grid-sort.qnt), and Up/Down between
//     the header row and the body: the header keeps its own one-dimensional
//     roving and is `focusgroup="none"` for the body's group;
//   - cell/row/column selection and aria-selected (grid-selection.qnt);
//   - aria-rowindex/aria-colindex gaps from virtualization or hidden columns
//     (here the indices are always the dense 1-based position);
//   - cells with several widgets (Tab / Arrow between widgets inside a cell) and
//     Tab / Shift+Tab inside edit mode (modelled as a no-op);
//   - layout-grid optional rule "Home/End go to the first/last cell of the grid
//     when a row has fewer than three cells";
//   - Enter moving the edit to the neighbouring cell, cut/copy/paste, spans,
//     ragged rows, grid labelling (aria-labelledby/describedby), dynamic
//     rows/columns, author-configurable page size (PAGE is a constant),
//     `itemcontrols`;
//   - DOM `focus()` calls: focus is the abstract bit `hasFocus`.
//
// Controlled state (map ticket rt1p): `grid` is NAVIGATION-ONLY and stays
// uncontrolled. Focus is roving internal navigation state (`row`, `col`,
// `hasFocus`, `mode`), not a host-owned value the consumer can pass down; the
// user-changeable values live in the sibling machines — the selected rectangle
// (grid-selection.qnt) and the sort (grid-sort.qnt). Those two carry the
// `controlled`/`accepting`/`valueProp` request/commit shape; this machine has no
// `value` prop to express, so it deliberately omits it.
//
// Generator gaps hit: no `const` declarations (grid sizes are zero-argument
// `val`s of type int); one nondet per action (cell index / key name are single
// pools); no sets/lists/maps (cell state is derived from scalar vars; the
// "exactly one tab stop" invariant enumerates the ROWS x COLS cells).
module apg_grid {
  import focusgroup.* from "../../shared/focusgroup"

  var row: int           // focused row, 0-based
  var col: int           // focused column, 0-based
  var tabStop: int       // the cell that owns tabindex=0 (the platform's single stop)
  var hasFocus: bool     // DOM focus is inside the grid
  var mode: str          // "navigate" | "edit"
  var dirty: bool        // the edit draft differs from the committed value
  var lastEdit: str      // "none" | "committed" | "cancelled"
  var gridKind: str      // "data" | "layout"
  var wrapCols: bool     // Right/Left flow across row boundaries (data-wrap-cols)
  var wrapRows: bool     // Down/Up flow across column boundaries (data-wrap-rows)
  var focusTarget: str   // "cell" | "widget": what carries tabindex and DOM focus
  var gridReadonly: bool // aria-readonly on the grid element

  // bounded grid: change here, then keep CELL_POOL (click) and the
  // tabStops enumeration in step
  val ROWS: int = 4
  val COLS: int = 3
  val PAGE: int = 2
  val LAST_ROW: int = ROWS - 1
  val LAST_COL: int = COLS - 1
  val CELLS: int = ROWS * COLS

  // the last column is computed data (e.g. a balance): never editable
  def colReadonly(c: int): bool = c == LAST_COL

  def rowOf(i: int): int = i / COLS
  def colOf(i: int): int = i % COLS
  def lineOf(r: int, c: int): int = r * COLS + c
  def cur: int = lineOf(row, col)
  def start: int = cur // `focusgroupstart` rides on the current cell
  def navigating: bool = and(hasFocus, mode == "navigate")
  def editing: bool = mode == "edit"
  def canEdit: bool = and(not(gridReadonly), not(colReadonly(col)))

  // --- the platform's landings (specs/patterns/focusgrid.qnt) --------------
  // inline overflow: hard, or flow into the adjacent row (the column goes to
  // the opposite end). `wrap` (the opposite end of the same row) is not an APG
  // grid option.
  def inlineLand(i: int, d: int): int =
    if (and(colOf(i) + d >= 0, colOf(i) + d < COLS)) i + d
    else if (not(wrapCols)) i
    else lineOf(
      if (rowOf(i) + d < 0) LAST_ROW else if (rowOf(i) + d < ROWS) rowOf(i) + d else 0,
      if (d > 0) 0 else LAST_COL
    )

  // block overflow: hard, or flow into the adjacent column (the row goes to
  // the opposite end)
  def blockLand(i: int, d: int): int =
    if (and(rowOf(i) + d >= 0, rowOf(i) + d < ROWS)) i + d * COLS
    else if (not(wrapRows)) i
    else lineOf(
      if (d > 0) 0 else LAST_ROW,
      if (colOf(i) + d < 0) LAST_COL
      else if (colOf(i) + d < COLS) colOf(i) + d
      else 0
    )

  // Home / End are the row's ends; Ctrl+Home / Ctrl+End the grid's
  def edgeLand(i: int, k: str): int =
    if (k == "Home") lineOf(rowOf(i), 0)
    else if (k == "End") lineOf(rowOf(i), LAST_COL)
    else if (k == "Control+Home") 0
    else if (k == "Control+End") CELLS - 1
    else i

  def isInlineKey(k: str): bool = or(k == "ArrowRight", k == "ArrowLeft")
  def isBlockKey(k: str): bool = or(k == "ArrowDown", k == "ArrowUp")
  def isRowEdgeKey(k: str): bool = or(k == "Home", k == "End")
  def isGridEdgeKey(k: str): bool = or(k == "Control+Home", k == "Control+End")
  def isPlatformKey(k: str): bool =
    or(isInlineKey(k), or(isBlockKey(k), or(isRowEdgeKey(k), isGridEdgeKey(k))))
  def delta(k: str): int =
    if (or(k == "ArrowRight", k == "ArrowDown")) 1
    else if (or(k == "ArrowLeft", k == "ArrowUp")) -1
    else 0

  def land(k: str, i: int): int =
    if (isInlineKey(k)) inlineLand(i, delta(k))
    else if (isBlockKey(k)) blockLand(i, delta(k))
    else if (isRowEdgeKey(k)) edgeLand(i, k)
    else if (isGridEdgeKey(k)) edgeLand(i, k)
    else i

  // Page-sized movement is the widget's: a grid defines no page movement for
  // the platform, so the platform never sees these keys.
  def pageDownIdx: int =
    if (row + PAGE > LAST_ROW) lineOf(LAST_ROW, col) else cur + PAGE * COLS
  def pageUpIdx: int = if (row < PAGE) col else cur - PAGE * COLS

  def moves(k: str): bool =
    and(navigating, or(isPlatformKey(k), or(k == "PageDown", k == "PageUp")))
  def keyTarget(k: str): int =
    if (k == "PageDown") pageDownIdx
    else if (k == "PageUp") pageUpIdx
    else land(k, cur)

  // --- edit mode ---
  // Enter / F2 / a printable key start editing a focused editable cell
  def startsEdit(k: str): bool =
    and(navigating, canEdit, or(k == "Enter", or(k == "F2", k == "a")))
  def commitsEdit(k: str): bool = and(editing, or(k == "Enter", k == "F2"))
  def cancelsEdit(k: str): bool = and(editing, k == "Escape")
  def endsEdit(k: str): bool = or(commitsEdit(k), cancelsEdit(k))
  def leavesGrid(k: str): bool = and(navigating, or(k == "Tab", k == "Shift+Tab"))

  // --- the platform's stop (shared/focusgroup.qnt) -------------------------
  def tabIndex(i: int): int = fgTabIndex(tabStop, i)
  def cellTabindex(r: int, c: int): int =
    if (focusTarget == "cell") tabIndex(lineOf(r, c)) else -1
  def widgetTabindex(r: int, c: int): int =
    if (focusTarget == "widget") tabIndex(lineOf(r, c)) else -1
  def cellDomFocused(r: int, c: int): bool =
    and(navigating, focusTarget == "cell", r == row, c == col)
  def widgetDomFocused(r: int, c: int): bool =
    and(navigating, focusTarget == "widget", r == row, c == col)
  def inputDomFocused(r: int, c: int): bool = and(editing, r == row, c == col)

  // --- ARIA contract (derived) ---
  val ARIA_ROWCOUNT: int = ROWS
  val ARIA_COLCOUNT: int = COLS
  def ariaRowindex(r: int): int = r + 1
  def ariaColindex(c: int): int = c + 1
  def cellReadonly(r: int, c: int): bool = or(gridReadonly, colReadonly(c))
  def tabStops(r: int, c: int): int =
    (if (cellTabindex(r, c) == 0) 1 else 0) + (if (widgetTabindex(r, c) == 0) 1 else 0)
  def rowTabStops(r: int): int =
    tabStops(r, 0) + tabStops(r, 1) + tabStops(r, 2)

  action init = all {
    row' = 0,
    col' = 0,
    tabStop' = 0,
    hasFocus' = false,
    mode' = "navigate",
    dirty' = false,
    lastEdit' = "none",
    gridKind' = "data",
    wrapCols' = false,
    wrapRows' = false,
    focusTarget' = "cell",
    gridReadonly' = false
  }

  // keydown while the grid has focus. The platform's keys move the coordinate
  // and the stop; the widget's keys (edit, Tab) never move it, so the stop stays
  // where the platform put it.
  action key = {
    nondet key = Set(
      "ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp",
      "Home", "End", "Control+Home", "Control+End",
      "PageUp", "PageDown",
      "Enter", "F2", "Escape", "a",
      "Tab", "Shift+Tab"
    ).oneOf()
    all {
      row' = if (moves(key)) keyTarget(key) / COLS else row,
      col' = if (moves(key)) keyTarget(key) % COLS else col,
      tabStop' = if (moves(key)) keyTarget(key) else tabStop,
      hasFocus' = if (leavesGrid(key)) false else hasFocus,
      mode' = if (startsEdit(key)) "edit" else if (endsEdit(key)) "navigate" else mode,
      dirty' =
        if (startsEdit(key)) (key == "a")
        else if (and(editing, key == "a")) true
        else if (endsEdit(key)) false
        else dirty,
      lastEdit' =
        if (commitsEdit(key)) "committed"
        else if (cancelsEdit(key)) "cancelled"
        else lastEdit,
      gridKind' = gridKind,
      wrapCols' = wrapCols,
      wrapRows' = wrapRows,
      focusTarget' = focusTarget,
      gridReadonly' = gridReadonly
    }
  }

  // pointer on a cell: focuses it (and the platform's stop follows); clicking
  // another cell commits an edit
  action click = {
    nondet cell = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11).oneOf()
    all {
      row' = cell / COLS,
      col' = cell % COLS,
      tabStop' = cell,
      hasFocus' = true,
      mode' = if (and(editing, cell == cur)) "edit" else "navigate",
      dirty' = if (and(editing, cell == cur)) dirty else false,
      lastEdit' = if (and(editing, cell != cur)) "committed" else lastEdit,
      gridKind' = gridKind,
      wrapCols' = wrapCols,
      wrapRows' = wrapRows,
      focusTarget' = focusTarget,
      gridReadonly' = gridReadonly
    }
  }

  // focus enters the grid (Tab lands on the platform's stop): with memory the
  // entry is the remembered cell, else `focusgroupstart`
  action focus_in = all {
    row' = if (hasFocus) row else fgEntry(true, tabStop, start) / COLS,
    col' = if (hasFocus) col else fgEntry(true, tabStop, start) % COLS,
    tabStop' = tabStop,
    hasFocus' = true,
    mode' = mode,
    dirty' = dirty,
    lastEdit' = lastEdit,
    gridKind' = gridKind,
    wrapCols' = wrapCols,
    wrapRows' = wrapRows,
    focusTarget' = focusTarget,
    gridReadonly' = gridReadonly
  }

  // focus leaves the grid: an open edit is committed, and with memory the roving
  // stop stays on the cell that had focus (it does NOT fall back to the start)
  action focus_out = all {
    row' = row,
    col' = col,
    tabStop' = fgStopOnLeave(true, tabStop, start),
    hasFocus' = false,
    mode' = "navigate",
    dirty' = false,
    lastEdit' = if (editing) "committed" else lastEdit,
    gridKind' = gridKind,
    wrapCols' = wrapCols,
    wrapRows' = wrapRows,
    focusTarget' = focusTarget,
    gridReadonly' = gridReadonly
  }

  // data grids never wrap
  action set_kind = {
    nondet choice = Set("data", "layout").oneOf()
    all {
      row' = row,
      col' = col,
      tabStop' = tabStop,
      hasFocus' = hasFocus,
      mode' = mode,
      dirty' = dirty,
      lastEdit' = lastEdit,
      gridKind' = choice,
      wrapCols' = if (choice == "data") false else wrapCols,
      wrapRows' = if (choice == "data") false else wrapRows,
      focusTarget' = focusTarget,
      gridReadonly' = gridReadonly
    }
  }

  // wrapping is only available on layout grids
  action set_wrap_cols = {
    nondet flag = Set(true, false).oneOf()
    all {
      row' = row,
      col' = col,
      tabStop' = tabStop,
      hasFocus' = hasFocus,
      mode' = mode,
      dirty' = dirty,
      lastEdit' = lastEdit,
      gridKind' = gridKind,
      wrapCols' = if (gridKind == "layout") flag else false,
      wrapRows' = wrapRows,
      focusTarget' = focusTarget,
      gridReadonly' = gridReadonly
    }
  }

  action set_wrap_rows = {
    nondet flag = Set(true, false).oneOf()
    all {
      row' = row,
      col' = col,
      tabStop' = tabStop,
      hasFocus' = hasFocus,
      mode' = mode,
      dirty' = dirty,
      lastEdit' = lastEdit,
      gridKind' = gridKind,
      wrapCols' = wrapCols,
      wrapRows' = if (gridKind == "layout") flag else false,
      focusTarget' = focusTarget,
      gridReadonly' = gridReadonly
    }
  }

  // the focus target changes which ELEMENT carries the stop, not the coordinate
  action set_focus_target = {
    nondet choice = Set("cell", "widget").oneOf()
    all {
      row' = row,
      col' = col,
      tabStop' = tabStop,
      hasFocus' = hasFocus,
      mode' = mode,
      dirty' = dirty,
      lastEdit' = lastEdit,
      gridKind' = gridKind,
      wrapCols' = wrapCols,
      wrapRows' = wrapRows,
      focusTarget' = choice,
      gridReadonly' = gridReadonly
    }
  }

  // read-only grid: a running edit is cancelled
  action set_readonly = {
    nondet flag = Set(true, false).oneOf()
    all {
      row' = row,
      col' = col,
      tabStop' = tabStop,
      hasFocus' = hasFocus,
      mode' = if (and(flag, editing)) "navigate" else mode,
      dirty' = if (and(flag, editing)) false else dirty,
      lastEdit' = if (and(flag, editing)) "cancelled" else lastEdit,
      gridKind' = gridKind,
      wrapCols' = wrapCols,
      wrapRows' = wrapRows,
      focusTarget' = focusTarget,
      gridReadonly' = flag
    }
  }

  action step = any {
    init, key, click, focus_in, focus_out,
    set_kind, set_wrap_cols, set_wrap_rows, set_focus_target, set_readonly
  }

  // focus coordinates stay inside the bounded grid
  val FocusInBounds: bool = and(row >= 0, row < ROWS, col >= 0, col < COLS)
  // the platform's single stop is a cell of the body
  val TabStopInRange: bool = fgStopInRange(CELLS, tabStop)
  // exactly one element (the cell or its widget) in the whole grid has tabindex=0
  val ExactlyOneTabStop: bool =
    rowTabStops(0) + rowTabStops(1) + rowTabStops(2) + rowTabStops(3) == 1
  // memory: the stop is the current cell (the last focused one, even while focus
  // is outside), never the tablist's selection or an entry-only marker
  val TabStopIsCurrent: bool = tabStop == cur
  // aria-rowindex / aria-colindex of the focused cell are 1-based and within the counts
  val AriaIndicesInRange: bool = and(
    ariaRowindex(row) >= 1, ariaRowindex(row) <= ARIA_ROWCOUNT,
    ariaColindex(col) >= 1, ariaColindex(col) <= ARIA_COLCOUNT
  )
  val ModeValid: bool = or(mode == "navigate", mode == "edit")
  val KindValid: bool = or(gridKind == "data", gridKind == "layout")
  val FocusTargetValid: bool = or(focusTarget == "cell", focusTarget == "widget")
  val LastEditValid: bool = or(lastEdit == "none", lastEdit == "committed", lastEdit == "cancelled")
  // an input can only be focused while DOM focus is inside the grid
  val EditImpliesFocus: bool = or(not(editing), hasFocus)
  // only an editable cell of an editable grid is ever in edit mode
  val EditOnEditableCell: bool = or(not(editing), canEdit)
  // a draft exists only inside edit mode
  val DirtyImpliesEdit: bool = or(not(dirty), editing)
  // wrapping is a layout-grid-only behaviour
  val DataGridNeverWraps: bool = or(gridKind == "layout", and(not(wrapCols), not(wrapRows)))
}
