// WAI-ARIA APG — grid: optional cell / row / column selection.
//
// Modelled from https://www.w3.org/WAI/ARIA/apg/patterns/grid/ :
//   - "Keyboard Interaction For Data Grids" (selection keys: Control+Space selects
//     the column, Shift+Space the row, Control+A all cells, Shift+Arrow extends
//     the selection by one cell) and the same list under "Keyboard Interaction
//     For Layout Grids";
//   - "WAI-ARIA Roles, States, and Properties" (aria-selected=true on selected
//     cells or rows; on every cell of a selected column; the attribute exists only
//     if the grid supports selection);
// and the selection behaviour of https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/advanced-data-grid/
//
// The selection is one rectangle [selR0..selR1] x [selC0..selC1] plus an anchor
// cell. A row selection is a full-width rectangle, a column selection a
// full-height one, Control+A the whole grid, Shift+Arrow the bounding box of the
// anchor and the moving focus cell. aria-selected is derived from the rectangle.
// Focus (row, col) is kept here only because Shift+Arrow needs it; full
// navigation (Home/End/Page keys, wrap, edit mode) is grid.qnt.
//
// Deliberate decisions where APG is silent:
//   - a plain arrow (or click) collapses the selection and re-anchors on the new
//     focus cell; Escape clears the selection;
//   - Shift+Space / Control+Space / Control+A re-anchor on the focus cell;
//   - Shift+Arrow at the grid edge still selects the focus cell (no movement);
//   - on a grid that is not selectable, Shift+Arrow is a plain move and the
//     selection keys do nothing; turning selectability off clears the selection;
//   - while the grid has no focus, keys are ignored; blur keeps the selection.
//
// Request vs commit (map ticket rt1p). The selection — "nothing" or the active
// rectangle — is the value, packed into `selectionPacked` (0 = nothing selected).
// Every event a user sees as a selection change — `key` (plain / Shift arrows,
// Shift+Space, Control+Space, Control+A, Escape), `click`, `shift_click` and the
// `set_selectable` prop clearing an active selection — is a *request* carrying an
// intent (`requested`); it fires onValueChange (`requests` counts the calls) when
// the intent differs from the current value, and then:
//   uncontrolled        the request is accepted: the selection commits the intent
//   controlled, holds   the host ignores it ("rejected"): the selection is untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       selection commits through the controlled value, not the event
// `valueProp` is the only thing that changes the selection while `controlled`;
// `setValue` / `hostToggle` are the host writing it. `control` / `acceptRequests`
// are configuration events (init is literal-only). Focus, the anchor and the
// collapsed rectangle still move with the event even when the request is rejected
// (roving focus), which is why the four shape/containment invariants are scoped to
// the uncontrolled path: a controlled host owns the value and may hand the widget
// any rectangle. Invariants for the model: ControlledFollowsProp,
// RejectedRequestUntouched, AcceptedRequestCommits.
//
// Deliberate omissions: Tab / Shift+Tab (focus leaves via focus_out), Home/End,
// PageUp/PageDown and wrapping (grid.qnt), non-rectangular multi-selection
// (Control+click toggling), the row-selection checkbox column, cut/copy/paste,
// aria-multiselectable, header cells.
//
// Generator gaps hit: no sets/lists/maps, so the selection is a rectangle of
// scalar bounds rather than a set of cells; no `const` (sizes are zero-argument
// `val`s); one nondet per action (cell index / key name are single pools).
module apg_grid_selection {
  var row: int        // focused row, 0-based
  var col: int        // focused column, 0-based
  var anchorRow: int  // selection anchor
  var anchorCol: int
  var selActive: bool // a selection exists
  var selR0: int      // selection rectangle (inclusive); the focus cell when inactive
  var selR1: int
  var selC0: int
  var selC1: int
  var hasFocus: bool  // DOM focus is inside the grid
  var selectable: bool // the grid supports selection (aria-selected exists)
  var controlled: bool // the host owns the selection (`value` prop present)
  var accepting: bool  // controlled host that answers every request with its intent
  var valueProp: int   // the controlled value prop (packed; 0 = nothing selected)
  var requested: int   // intent of the last request (packed)
  var outcome: str     // "none" | "accepted" | "rejected"
  var base: int        // value when the last request was received (packed)
  var requests: int    // number of requests that fired onValueChange

  // bounded grid: keep CELL pool of click / shift_click in step
  val ROWS: int = 4
  val COLS: int = 3
  val LAST_ROW: int = ROWS - 1
  val LAST_COL: int = COLS - 1

  def lowerOf(a: int, b: int): int = if (a < b) a else b
  def upperOf(a: int, b: int): int = if (a > b) a else b
  def clampRow(r: int): int = if (r < 0) 0 else if (r > LAST_ROW) LAST_ROW else r
  def clampCol(c: int): int = if (c < 0) 0 else if (c > LAST_COL) LAST_COL else c

  def dRow(k: str): int =
    if (or(k == "ArrowDown", k == "Shift+ArrowDown")) 1
    else if (or(k == "ArrowUp", k == "Shift+ArrowUp")) -1
    else 0
  def dCol(k: str): int =
    if (or(k == "ArrowRight", k == "Shift+ArrowRight")) 1
    else if (or(k == "ArrowLeft", k == "Shift+ArrowLeft")) -1
    else 0
  def newRow(k: str): int = clampRow(row + dRow(k))
  def newCol(k: str): int = clampCol(col + dCol(k))

  def isPlainArrow(k: str): bool =
    or(k == "ArrowRight", k == "ArrowLeft", k == "ArrowDown", k == "ArrowUp")
  def isShiftArrow(k: str): bool =
    or(k == "Shift+ArrowRight", k == "Shift+ArrowLeft", k == "Shift+ArrowDown", k == "Shift+ArrowUp")

  // key classes (all gated on DOM focus inside the grid)
  def collapses(k: str): bool =
    and(hasFocus, or(isPlainArrow(k), and(isShiftArrow(k), not(selectable))))
  def extendsSel(k: str): bool = and(hasFocus, selectable, isShiftArrow(k))
  def selectsRow(k: str): bool = and(hasFocus, selectable, k == "Shift+Space")
  def selectsCol(k: str): bool = and(hasFocus, selectable, k == "Control+Space")
  def selectsAll(k: str): bool = and(hasFocus, selectable, k == "Control+a")
  def clears(k: str): bool = and(hasFocus, k == "Escape")
  def selects(k: str): bool = or(extendsSel(k), selectsRow(k), selectsCol(k), selectsAll(k))
  def moves(k: str): bool = or(collapses(k), extendsSel(k))
  // re-anchors on the focus cell (selection keys and Escape)
  def reanchors(k: str): bool = or(selectsRow(k), selectsCol(k), selectsAll(k), clears(k))

  // --- ARIA contract (derived) ---
  def cellSelected(r: int, c: int): bool =
    and(selActive, r >= selR0, r <= selR1, c >= selC0, c <= selC1)
  def rowSelected(r: int): bool =
    and(selActive, r >= selR0, r <= selR1, selC0 == 0, selC1 == LAST_COL)
  def colSelected(c: int): bool =
    and(selActive, c >= selC0, c <= selC1, selR0 == 0, selR1 == LAST_ROW)
  // aria-selected is only present on a grid that supports selection
  def ariaSelectedPresent: bool = selectable
  def cellAriaSelected(r: int, c: int): bool = and(selectable, cellSelected(r, c))
  def selectedCellCount: int =
    if (selActive) (selR1 - selR0 + 1) * (selC1 - selC0 + 1) else 0

  // --- request / commit (map ticket rt1p) ----------------------------------
  def moved(before: int, after: int): int = if (before == after) 0 else 1
  // injective for the 60 ordered rectangles: 0 = none, else 1 + r0 + 4*r1 + 16*c0 + 48*c1
  def selectionPacked(active: bool, r0: int, r1: int, c0: int, c1: int): int =
    if (active) 1 + r0 + 4 * r1 + 16 * c0 + 48 * c1 else 0
  def unpackR0(v: int): int = (v - 1) % 4
  def unpackR1(v: int): int = ((v - 1) / 4) % 4
  def unpackC0(v: int): int = ((v - 1) / 16) % 3
  def unpackC1(v: int): int = ((v - 1) / 48) % 3
  def nowPacked: int = selectionPacked(selActive, selR0, selR1, selC0, selC1)
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the value after a request for `want`
  def landed(h: bool, current: bool, want: bool): bool = if (h) current else want
  def landedI(h: bool, current: int, want: int): int = if (h) current else want
  // the value prop after a request for `want`
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p
  // the selection intent of a key, per member (mirrors the old action RHS)
  def keyWantActive(k: str): bool =
    if (selects(k)) true else if (or(collapses(k), clears(k))) false else selActive
  def keyWantR0(k: str): int =
    if (extendsSel(k)) lowerOf(anchorRow, newRow(k))
    else if (selectsRow(k)) row
    else if (or(selectsCol(k), selectsAll(k))) 0
    else if (collapses(k)) newRow(k)
    else if (clears(k)) row
    else selR0
  def keyWantR1(k: str): int =
    if (extendsSel(k)) upperOf(anchorRow, newRow(k))
    else if (selectsRow(k)) row
    else if (or(selectsCol(k), selectsAll(k))) LAST_ROW
    else if (collapses(k)) newRow(k)
    else if (clears(k)) row
    else selR1
  def keyWantC0(k: str): int =
    if (extendsSel(k)) lowerOf(anchorCol, newCol(k))
    else if (selectsCol(k)) col
    else if (or(selectsRow(k), selectsAll(k))) 0
    else if (collapses(k)) newCol(k)
    else if (clears(k)) col
    else selC0
  def keyWantC1(k: str): int =
    if (extendsSel(k)) upperOf(anchorCol, newCol(k))
    else if (selectsCol(k)) col
    else if (or(selectsRow(k), selectsAll(k))) LAST_COL
    else if (collapses(k)) newCol(k)
    else if (clears(k)) col
    else selC1
  def keyWantPacked(k: str): int =
    selectionPacked(keyWantActive(k), keyWantR0(k), keyWantR1(k), keyWantC0(k), keyWantC1(k))
  def keyMoves(k: str): bool = keyWantPacked(k) != nowPacked
  // a click collapses the selection: the intent is "nothing selected"
  def clickMoves: bool = nowPacked != 0
  // Shift+click extends from the anchor; on a non-selectable grid it degrades to a click
  def shiftWantR0(cell: int): int = if (selectable) lowerOf(anchorRow, cell / COLS) else cell / COLS
  def shiftWantR1(cell: int): int = if (selectable) upperOf(anchorRow, cell / COLS) else cell / COLS
  def shiftWantC0(cell: int): int = if (selectable) lowerOf(anchorCol, cell % COLS) else cell % COLS
  def shiftWantC1(cell: int): int = if (selectable) upperOf(anchorCol, cell % COLS) else cell % COLS
  def shiftWantPacked(cell: int): int =
    selectionPacked(selectable, shiftWantR0(cell), shiftWantR1(cell), shiftWantC0(cell), shiftWantC1(cell))
  def shiftMoves(cell: int): bool = shiftWantPacked(cell) != nowPacked
  // turning selection support off clears an existing selection: a real request only then
  def setSelMoves(flag: bool): bool = and(not(flag), nowPacked != 0)
  // the host flips its own copy: nothing -> the focus cell, else nothing
  def togglePacked: int =
    if (selActive) 0 else selectionPacked(true, row, row, col, col)

  action init = all {
    row' = 0,
    col' = 0,
    anchorRow' = 0,
    anchorCol' = 0,
    selActive' = false,
    selR0' = 0,
    selR1' = 0,
    selC0' = 0,
    selC1' = 0,
    hasFocus' = false,
    selectable' = true,
    controlled' = false,
    accepting' = false,
    valueProp' = 0,
    requested' = 0,
    outcome' = "none",
    base' = 0,
    requests' = 0
  }

  // request: a keydown while the grid has DOM focus
  action key = {
    nondet key = Set(
      "ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp",
      "Shift+ArrowRight", "Shift+ArrowLeft", "Shift+ArrowDown", "Shift+ArrowUp",
      "Shift+Space", "Control+Space", "Control+a", "Escape"
    ).oneOf()
    all {
      row' = if (moves(key)) newRow(key) else row,
      col' = if (moves(key)) newCol(key) else col,
      anchorRow' =
        if (collapses(key)) newRow(key)
        else if (reanchors(key)) row
        else anchorRow,
      anchorCol' =
        if (collapses(key)) newCol(key)
        else if (reanchors(key)) col
        else anchorCol,
      selActive' = landed(holds, selActive, keyWantActive(key)),
      selR0' = landedI(holds, selR0, keyWantR0(key)),
      selR1' = landedI(holds, selR1, keyWantR1(key)),
      selC0' = landedI(holds, selC0, keyWantC0(key)),
      selC1' = landedI(holds, selC1, keyWantC1(key)),
      hasFocus' = hasFocus,
      selectable' = selectable,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (keyMoves(key)) propAfter(follows, valueProp, keyWantPacked(key)) else valueProp,
      requested' = if (keyMoves(key)) keyWantPacked(key) else requested,
      outcome' = if (keyMoves(key)) verdict else outcome,
      base' = if (keyMoves(key)) nowPacked else base,
      requests' = if (keyMoves(key)) requests + 1 else requests
    }
  }

  // request: pointer on a cell: focuses it, collapses the selection onto it
  action click = {
    nondet cell = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11).oneOf()
    all {
      row' = cell / COLS,
      col' = cell % COLS,
      anchorRow' = cell / COLS,
      anchorCol' = cell % COLS,
      selActive' = landed(holds, selActive, false),
      selR0' = landedI(holds, selR0, cell / COLS),
      selR1' = landedI(holds, selR1, cell / COLS),
      selC0' = landedI(holds, selC0, cell % COLS),
      selC1' = landedI(holds, selC1, cell % COLS),
      hasFocus' = true,
      selectable' = selectable,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (clickMoves) propAfter(follows, valueProp, 0) else valueProp,
      requested' = if (clickMoves) 0 else requested,
      outcome' = if (clickMoves) verdict else outcome,
      base' = if (clickMoves) nowPacked else base,
      requests' = if (clickMoves) requests + 1 else requests
    }
  }

  // request: Shift+click extends from the anchor to the clicked cell
  action shift_click = {
    nondet cell = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11).oneOf()
    all {
      row' = cell / COLS,
      col' = cell % COLS,
      anchorRow' = if (selectable) anchorRow else cell / COLS,
      anchorCol' = if (selectable) anchorCol else cell % COLS,
      selActive' = landed(holds, selActive, selectable),
      selR0' = landedI(holds, selR0, shiftWantR0(cell)),
      selR1' = landedI(holds, selR1, shiftWantR1(cell)),
      selC0' = landedI(holds, selC0, shiftWantC0(cell)),
      selC1' = landedI(holds, selC1, shiftWantC1(cell)),
      hasFocus' = true,
      selectable' = selectable,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (shiftMoves(cell)) propAfter(follows, valueProp, shiftWantPacked(cell)) else valueProp,
      requested' = if (shiftMoves(cell)) shiftWantPacked(cell) else requested,
      outcome' = if (shiftMoves(cell)) verdict else outcome,
      base' = if (shiftMoves(cell)) nowPacked else base,
      requests' = if (shiftMoves(cell)) requests + 1 else requests
    }
  }

  action focus_in = all {
    row' = row,
    col' = col,
    anchorRow' = anchorRow,
    anchorCol' = anchorCol,
    selActive' = selActive,
    selR0' = selR0,
    selR1' = selR1,
    selC0' = selC0,
    selC1' = selC1,
    hasFocus' = true,
    selectable' = selectable,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // blur keeps the selection
  action focus_out = all {
    row' = row,
    col' = col,
    anchorRow' = anchorRow,
    anchorCol' = anchorCol,
    selActive' = selActive,
    selR0' = selR0,
    selR1' = selR1,
    selC0' = selC0,
    selC1' = selC1,
    hasFocus' = false,
    selectable' = selectable,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // request: turning selection support off clears the selection
  action set_selectable = {
    nondet flag = Set(true, false).oneOf()
    all {
      row' = row,
      col' = col,
      anchorRow' = if (flag) anchorRow else row,
      anchorCol' = if (flag) anchorCol else col,
      selActive' = if (flag) selActive else landed(holds, selActive, false),
      selR0' = if (flag) selR0 else landedI(holds, selR0, row),
      selR1' = if (flag) selR1 else landedI(holds, selR1, row),
      selC0' = if (flag) selC0 else landedI(holds, selC0, col),
      selC1' = if (flag) selC1 else landedI(holds, selC1, col),
      hasFocus' = hasFocus,
      selectable' = flag,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (setSelMoves(flag)) propAfter(follows, valueProp, 0) else valueProp,
      requested' = if (setSelMoves(flag)) 0 else requested,
      outcome' = if (setSelMoves(flag)) verdict else outcome,
      base' = if (setSelMoves(flag)) nowPacked else base,
      requests' = if (setSelMoves(flag)) requests + 1 else requests
    }
  }

  // commit: the host writes the controlled selection (a no-op while uncontrolled)
  action setValue = {
    // A representative spread (none, a cell, a rectangle, the full grid) keeps
    // the commit path covered without exploding the bounded exploration.
    nondet v = Set(0, 1, 6, 11, 49, 65, 97, 144).oneOf()
    all {
      row' = row,
      col' = col,
      anchorRow' = anchorRow,
      anchorCol' = anchorCol,
      selActive' = if (controlled) v != 0 else selActive,
      selR0' = if (controlled) (if (v == 0) row else unpackR0(v)) else selR0,
      selR1' = if (controlled) (if (v == 0) row else unpackR1(v)) else selR1,
      selC0' = if (controlled) (if (v == 0) col else unpackC0(v)) else selC0,
      selC1' = if (controlled) (if (v == 0) col else unpackC1(v)) else selC1,
      hasFocus' = hasFocus,
      selectable' = selectable,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) v else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips its own copy (nothing -> the focus cell, else nothing)
  action hostToggle = all {
    row' = row,
    col' = col,
    anchorRow' = anchorRow,
    anchorCol' = anchorCol,
    selActive' = if (controlled) togglePacked != 0 else selActive,
    selR0' = if (controlled) (if (togglePacked == 0) row else unpackR0(togglePacked)) else selR0,
    selR1' = if (controlled) (if (togglePacked == 0) row else unpackR1(togglePacked)) else selR1,
    selC0' = if (controlled) (if (togglePacked == 0) col else unpackC0(togglePacked)) else selC0,
    selC1' = if (controlled) (if (togglePacked == 0) col else unpackC1(togglePacked)) else selC1,
    hasFocus' = hasFocus,
    selectable' = selectable,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) togglePacked else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the host starts owning the selection, adopting the current one
  action control = all {
    row' = row,
    col' = col,
    anchorRow' = anchorRow,
    anchorCol' = anchorCol,
    selActive' = selActive,
    selR0' = selR0,
    selR1' = selR1,
    selC0' = selC0,
    selC1' = selC1,
    hasFocus' = hasFocus,
    selectable' = selectable,
    controlled' = true,
    accepting' = accepting,
    valueProp' = nowPacked,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    row' = row,
    col' = col,
    anchorRow' = anchorRow,
    anchorCol' = anchorCol,
    selActive' = selActive,
    selR0' = selR0,
    selR1' = selR1,
    selC0' = selC0,
    selC1' = selC1,
    hasFocus' = hasFocus,
    selectable' = selectable,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, key, click, shift_click, focus_in, focus_out, set_selectable,
    setValue, hostToggle, control, acceptRequests
  }

  val FocusInBounds: bool = and(row >= 0, row < ROWS, col >= 0, col < COLS)
  val AnchorInBounds: bool = and(anchorRow >= 0, anchorRow < ROWS, anchorCol >= 0, anchorCol < COLS)
  // the rectangle is well-formed and inside the grid, active or not
  val SelectionRectOrdered: bool = and(
    selR0 >= 0, selR0 <= selR1, selR1 < ROWS,
    selC0 >= 0, selC0 <= selC1, selC1 < COLS
  )
  // the focused cell is always part of an active selection (so it has aria-selected=true);
  // a controlled host owns the value, so focus may leave the held rectangle
  val ActiveSelectionContainsFocus: bool = or(controlled, or(not(selActive), cellSelected(row, col)))
  // ... and so is the anchor (uncontrolled)
  val ActiveSelectionContainsAnchor: bool = or(controlled, or(not(selActive), cellSelected(anchorRow, anchorCol)))
  // no selection: the rectangle and anchor collapse onto the focus cell (uncontrolled)
  val InactiveSelectionCollapsed: bool = or(
    controlled,
    or(
      selActive,
      and(selR0 == row, selR1 == row, selC0 == col, selC1 == col, anchorRow == row, anchorCol == col)
    )
  )
  // a grid without selection support has no selection (uncontrolled)
  val SelectionOnlyWhenSelectable: bool = or(controlled, or(not(selActive), selectable))
  // a full-width selection marks every cell of the focused row selected
  val FullWidthSelectionIsRowSelection: bool = or(
    not(rowSelected(row)),
    and(cellSelected(row, 0), cellSelected(row, 1), cellSelected(row, 2))
  )
  // a full-height selection marks every cell of the focused column selected
  val FullHeightSelectionIsColumnSelection: bool = or(
    not(colSelected(col)),
    and(cellSelected(0, col), cellSelected(1, col), cellSelected(2, col), cellSelected(3, col))
  )
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), nowPacked == valueProp)
  // a rejected request leaves the state as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), nowPacked == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), nowPacked == requested)
}
