// WAI-ARIA APG — grid (data grid + layout grid): roving focus, navigation, wrap, edit mode.
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
// -1/0 on the cell or on the widget inside it).
//
// The grid is a bounded ROWS x COLS body (header row: see grid-sort.qnt;
// selection: see grid-selection.qnt). Focus is the pair (row, col); a cell is
// addressed by the linear index row * COLS + col, which makes every wrap rule
// "+1 / -1 / +COLS" arithmetic.
//
// Events: `key` (the keydown alphabet below), `click` (pointer on a cell),
// `focus_in` / `focus_out` (focus enters / leaves the grid), and prop changes
// `set_kind`, `set_wrap_cols`, `set_wrap_rows`, `set_focus_target`,
// `set_readonly`. The ARIA contract is the derived defs (tabindex, aria-*), not
// state.
//
// Deliberate decisions where APG says "optional" / "may":
//   - a data grid never wraps (APG: wrapping "would be disorienting" in a data
//     grid), so switching to a data grid clears both wrap flags;
//   - Enter or F2 in edit mode commits and restores grid navigation; Escape
//     cancels (discards the draft) and restores navigation;
//   - leaving the grid (blur, click elsewhere in the grid) commits an edit;
//   - a read-only cell (last column) and a read-only grid never enter edit mode;
//     turning the grid read-only mid-edit cancels the edit;
//   - while editing, every other key belongs to the input (focus never moves).
//
// Deliberate omissions (no state / no events for them):
//   - header rows/cells, sort and aria-sort (grid-sort.qnt);
//   - cell/row/column selection and aria-selected (grid-selection.qnt);
//   - aria-rowindex/aria-colindex gaps from virtualization or hidden columns
//     (here the indices are always the dense 1-based position);
//   - cells with several widgets (Tab / Arrow between widgets inside a cell) and
//     Tab / Shift+Tab inside edit mode (modelled as a no-op);
//   - layout-grid optional rule "Home/End go to the first/last cell of the grid
//     when a row has fewer than three cells";
//   - Enter moving the edit to the neighbouring cell, cut/copy/paste, spans,
//     grid labelling (aria-labelledby/describedby), dynamic rows/columns,
//     author-configurable page size (PAGE is a constant);
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
  var row: int           // focused row, 0-based
  var col: int           // focused column, 0-based
  var hasFocus: bool     // DOM focus is inside the grid
  var mode: str          // "navigate" | "edit"
  var dirty: bool        // the edit draft differs from the committed value
  var lastEdit: str      // "none" | "committed" | "cancelled"
  var gridKind: str      // "data" | "layout"
  var wrapCols: bool     // Left/Right wrap across row boundaries (data-wrap-cols)
  var wrapRows: bool     // Up/Down wrap across column boundaries (data-wrap-rows)
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

  def cur: int = row * COLS + col
  def navigating: bool = and(hasFocus, mode == "navigate")
  def editing: bool = mode == "edit"
  def canEdit: bool = and(not(gridReadonly), not(colReadonly(col)))

  // --- navigation targets (linear cell index); a blocked move returns `cur` ---
  def rightIdx: int =
    if (col < LAST_COL) cur + 1 else if (and(wrapCols, row < LAST_ROW)) cur + 1 else cur
  def leftIdx: int =
    if (col > 0) cur - 1 else if (and(wrapCols, row > 0)) cur - 1 else cur
  def downIdx: int =
    if (row < LAST_ROW) cur + COLS else if (and(wrapRows, col < LAST_COL)) col + 1 else cur
  def upIdx: int =
    if (row > 0) cur - COLS else if (and(wrapRows, col > 0)) LAST_ROW * COLS + col - 1 else cur
  def pageDownIdx: int =
    if (row + PAGE > LAST_ROW) LAST_ROW * COLS + col else cur + PAGE * COLS
  def pageUpIdx: int =
    if (row < PAGE) col else cur - PAGE * COLS

  def keyTarget(k: str): int =
    if (k == "ArrowRight") rightIdx
    else if (k == "ArrowLeft") leftIdx
    else if (k == "ArrowDown") downIdx
    else if (k == "ArrowUp") upIdx
    else if (k == "PageDown") pageDownIdx
    else if (k == "PageUp") pageUpIdx
    else if (k == "Home") row * COLS
    else if (k == "End") row * COLS + LAST_COL
    else if (k == "Control+Home") 0
    else if (k == "Control+End") CELLS - 1
    else cur

  // --- edit mode ---
  // Enter / F2 / a printable key start editing a focused editable cell
  def startsEdit(k: str): bool =
    and(navigating, canEdit, or(k == "Enter", k == "F2", k == "a"))
  def commitsEdit(k: str): bool = and(editing, or(k == "Enter", k == "F2"))
  def cancelsEdit(k: str): bool = and(editing, k == "Escape")
  def endsEdit(k: str): bool = or(commitsEdit(k), cancelsEdit(k))
  def leavesGrid(k: str): bool = and(navigating, or(k == "Tab", k == "Shift+Tab"))

  // --- ARIA contract (derived) ---
  val ARIA_ROWCOUNT: int = ROWS
  val ARIA_COLCOUNT: int = COLS
  def ariaRowindex(r: int): int = r + 1
  def ariaColindex(c: int): int = c + 1
  def cellReadonly(r: int, c: int): bool = or(gridReadonly, colReadonly(c))
  // roving tabindex: exactly the focused cell (or its widget) is tabbable
  def cellTabindex(r: int, c: int): int =
    if (and(r == row, c == col, focusTarget == "cell")) 0 else -1
  def widgetTabindex(r: int, c: int): int =
    if (and(r == row, c == col, focusTarget == "widget")) 0 else -1
  def cellDomFocused(r: int, c: int): bool =
    and(navigating, focusTarget == "cell", r == row, c == col)
  def widgetDomFocused(r: int, c: int): bool =
    and(navigating, focusTarget == "widget", r == row, c == col)
  def inputDomFocused(r: int, c: int): bool = and(editing, r == row, c == col)

  def tabStops(r: int, c: int): int =
    (if (cellTabindex(r, c) == 0) 1 else 0) + (if (widgetTabindex(r, c) == 0) 1 else 0)
  def rowTabStops(r: int): int =
    tabStops(r, 0) + tabStops(r, 1) + tabStops(r, 2)

  action init = all {
    row' = 0,
    col' = 0,
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

  // keydown while the grid has focus; ignored otherwise
  action key = {
    nondet key = Set(
      "ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp",
      "Home", "End", "Control+Home", "Control+End",
      "PageUp", "PageDown",
      "Enter", "F2", "Escape", "a",
      "Tab", "Shift+Tab"
    ).oneOf()
    all {
      row' = if (navigating) keyTarget(key) / COLS else row,
      col' = if (navigating) keyTarget(key) % COLS else col,
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

  // pointer on a cell: focuses it; clicking another cell commits an edit
  action click = {
    nondet cell = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11).oneOf()
    all {
      row' = cell / COLS,
      col' = cell % COLS,
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

  // focus enters the grid (Tab): lands on the roving tab stop, position kept
  action focus_in = all {
    row' = row,
    col' = col,
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

  // focus leaves the grid: an open edit is committed, the roving tab stop stays
  action focus_out = all {
    row' = row,
    col' = col,
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

  action set_focus_target = {
    nondet choice = Set("cell", "widget").oneOf()
    all {
      row' = row,
      col' = col,
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
  // roving tabindex: exactly one element (cell or widget) in the whole grid has tabindex=0
  val ExactlyOneTabStop: bool =
    rowTabStops(0) + rowTabStops(1) + rowTabStops(2) + rowTabStops(3) == 1
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
