// APG combobox — the editable combobox with a grid popup (aria-haspopup="grid").
//
// Sources (W3C WAI-ARIA Authoring Practices Guide):
//   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
//     - "Keyboard Interaction" (Combobox + Grid Popup Keyboard Interaction and
//       its notes on one suggestion per cell vs. per row), "WAI-ARIA Roles,
//       States, and Properties" (aria-haspopup, aria-activedescendant,
//       aria-selected on option / gridcell / row)
//   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/grid-combo/
//     - "Keyboard Support" (Textbox, Grid Popup), "Role, Property, State, and
//       Tabindex Attributes" (Textbox, Grid Popup)
//
// Modelled behaviour
//   - DOM focus stays on the input; the visually focused grid cell is exposed
//     through aria-activedescendant (`row`, `col`; both NONE = visual focus on
//     the textbox). A grid cell can only be focused while the popup is open,
//     and the popup can only be open while the input has DOM focus.
//   - Layout variant (`cellValues`, prop `set_layout`): false = every row is one
//     suggestion, so the row containing the focused cell is aria-selected and
//     vertical arrows do not wrap across columns; true = every cell is its own
//     suggestion, so exactly the focused cell is aria-selected and vertical
//     arrows wrap from the bottom of one column to the top of the next.
//     Horizontal arrows move cell by cell and wrap across rows in both layouts.
//   - ArrowDown / ArrowUp open the grid and focus its first / last cell, or move
//     the focus with wrap-around. Left / Right move between cells only while a
//     cell is focused (otherwise they edit the text). Home / End / Delete return
//     the visual focus to the textbox without closing the popup. Enter commits
//     the suggestion under the focused cell and closes; Escape closes an open
//     grid keeping the value, and clears the textbox when already closed.
//     Typing / Backspace return the visual focus to the textbox. Blur / Tab
//     close the grid (list autocomplete: nothing is committed).
//   - Pointer: click on the input toggles the grid; clicking a cell commits it.
//   - Prop changes: `set_layout` (the committed value is cleared because the
//     suggestion id space changes), `set_value`.
//
// Deliberate omissions
//   - Typed text content and filtering (see combobox-autocomplete): only whether
//     the textbox holds typed text (`hasText`) matters for Escape-to-clear.
//   - PageUp / PageDown / Ctrl+Home / Ctrl+End (optional in the pattern),
//     asynchronous suggestions, scrolling, hover, grid headers / empty cells.
//   - A fixed 3x3 grid (`ROWS`, `COLS`); sizes are constants, not pools.
//
// Generator notes: no action preconditions (key actions guard their assignments
// with `focused`), only str/int/bool vars, a single nondet per action.
module combobox_grid {
  var open: bool          // grid popup displayed == aria-expanded
  var row: int            // row of the visually focused cell, NONE = textbox
  var col: int            // column of the visually focused cell, NONE = textbox
  var focused: bool       // DOM focus is on the input
  var hasText: bool       // the textbox holds typed text
  var picked: int         // committed suggestion id, NONE = none
  var cellValues: bool    // layout: true = one suggestion per cell, false = per row
  var lastEvent: str      // name of the last event, for transition invariants
  var valueChanged: bool  // the last event changed the committed value / text
  var wasOpen: bool       // the grid was open before the last event
  var controlled: bool    // the host owns the picked suggestion (`value` prop present)
  var accepting: bool     // controlled host that answers every request with its intent
  var valueProp: int      // the controlled picked suggestion
  var requested: int      // intent of the last request
  var outcome: str        // "none" | "accepted" | "rejected"
  var base: int           // picked when the last request was received
  var requests: int       // number of requests that fired a change callback

  // --- configuration ------------------------------------------------------
  def NONE: int = -1
  def ROWS: int = 3
  def COLS: int = 3
  def CELLS: int = 9

  // --- helpers ------------------------------------------------------------
  def hasActive: bool = row >= 0
  def idx: int = row * COLS + col
  def suggestionAt(k: int): int = if (cellValues) k else k / COLS
  def focusedSuggestion: int = suggestionAt(idx)
  def edits: bool = or(hasText, picked >= 0)

  // vertical movement: per-row layout wraps within the column, per-cell layout
  // wraps from the end of a column to the start of the next one
  def stepDownRow: int =
    if (cellValues) (if (row < ROWS - 1) row + 1 else 0) else (row + 1) % ROWS
  def stepDownCol: int =
    if (cellValues) (if (row < ROWS - 1) col else (col + 1) % COLS) else col
  def stepUpRow: int =
    if (cellValues) (if (row > 0) row - 1 else ROWS - 1) else (row + ROWS - 1) % ROWS
  def stepUpCol: int =
    if (cellValues) (if (row > 0) col else (col + COLS - 1) % COLS) else col
  def downRow: int = if (hasActive) stepDownRow else 0
  def downCol: int = if (hasActive) stepDownCol else 0
  def upRow: int = if (hasActive) stepUpRow else ROWS - 1
  def upCol: int = if (hasActive) stepUpCol else COLS - 1
  // horizontal movement is linear and wraps across rows
  def rightIdx: int = (idx + 1) % CELLS
  def leftIdx: int = (idx + CELLS - 1) % CELLS
  def moves: bool = and(focused, hasActive)

  def escapeClears: bool = and(and(focused, not(open)), edits)

  // --- derived ARIA attribute contract -----------------------------------
  def ariaHasPopup: str = "grid"
  def ariaExpanded: bool = open
  def ariaActivedescendant: int = if (hasActive) idx else NONE
  def rowSelected(r: int): bool = and(not(cellValues), and(hasActive, r == row))
  def cellSelected(r: int, c: int): bool = and(cellValues, and(hasActive, r == row, c == col))
  def selectedRows: int =
    (if (rowSelected(0)) 1 else 0) + (if (rowSelected(1)) 1 else 0) + (if (rowSelected(2)) 1 else 0)
  def selectedCells: int =
    (if (cellSelected(0, 0)) 1 else 0) + (if (cellSelected(0, 1)) 1 else 0) + (if (cellSelected(0, 2)) 1 else 0) +
    (if (cellSelected(1, 0)) 1 else 0) + (if (cellSelected(1, 1)) 1 else 0) + (if (cellSelected(1, 2)) 1 else 0) +
    (if (cellSelected(2, 0)) 1 else 0) + (if (cellSelected(2, 1)) 1 else 0) + (if (cellSelected(2, 2)) 1 else 0)
  def isNavigation(e: str): bool =
    or(e == "arrow_down", e == "arrow_up", e == "arrow_left", e == "arrow_right",
       e == "home", e == "end", e == "delete")
  def mayChangeValue(e: str): bool =
    or(e == "enter", e == "click_cell", e == "set_value", e == "set_layout",
       e == "type_char", e == "backspace", e == "escape")

  // --- request / commit (map ticket rt1p) --------------------------------
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  def landedInt(h: bool, current: int, want: int): int = if (h) current else want
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p

  action init = all {
    open' = false,
    row' = NONE,
    col' = NONE,
    focused' = false,
    hasText' = false,
    picked' = NONE,
    cellValues' = false,
    lastEvent' = "init",
    valueChanged' = false,
    wasOpen' = false,
    controlled' = false,
    accepting' = false,
    valueProp' = NONE,
    requested' = NONE,
    outcome' = "none",
    base' = NONE,
    requests' = 0
  }

  // --- focus / blur --------------------------------------------------------
  action focus = all {
    focused' = true,
    lastEvent' = "focus",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    row' = row,
    col' = col,
    hasText' = hasText,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    cellValues' = cellValues
  }

  action blur = all {
    open' = false,
    row' = NONE,
    col' = NONE,
    focused' = false,
    lastEvent' = "blur",
    valueChanged' = false,
    wasOpen' = open,
    hasText' = hasText,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    cellValues' = cellValues
  }

  // Tab: the popup and its cells are out of the Tab sequence
  action tab = all {
    open' = if (focused) false else open,
    row' = if (focused) NONE else row,
    col' = if (focused) NONE else col,
    focused' = false,
    lastEvent' = "tab",
    valueChanged' = false,
    wasOpen' = open,
    hasText' = hasText,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    cellValues' = cellValues
  }

  // --- text editing: visual focus returns to the textbox ------------------
  action type_char = all {
    hasText' = if (focused) true else hasText,
    picked' = landedInt(holds, picked, if (focused) NONE else picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (focused) NONE else picked),
    requested' = if ((if (focused) NONE else picked) != picked) if (focused) NONE else picked else requested,
    outcome' = if ((if (focused) NONE else picked) != picked) verdict else outcome,
    base' = if ((if (focused) NONE else picked) != picked) picked else base,
    requests' = if ((if (focused) NONE else picked) != picked) requests + 1 else requests,
    open' = if (focused) true else open,
    row' = if (focused) NONE else row,
    col' = if (focused) NONE else col,
    lastEvent' = "type_char",
    valueChanged' = and(focused, or(not(hasText), picked >= 0)),
    wasOpen' = open,
    focused' = focused,
    cellValues' = cellValues
  }

  action backspace = all {
    hasText' = if (focused) edits else hasText,
    picked' = landedInt(holds, picked, if (focused) NONE else picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (focused) NONE else picked),
    requested' = if ((if (focused) NONE else picked) != picked) if (focused) NONE else picked else requested,
    outcome' = if ((if (focused) NONE else picked) != picked) verdict else outcome,
    base' = if ((if (focused) NONE else picked) != picked) picked else base,
    requests' = if ((if (focused) NONE else picked) != picked) requests + 1 else requests,
    row' = if (focused) NONE else row,
    col' = if (focused) NONE else col,
    lastEvent' = "backspace",
    valueChanged' = and(focused, picked >= 0),
    wasOpen' = open,
    open' = open,
    focused' = focused,
    cellValues' = cellValues
  }

  action delete = all {
    row' = if (focused) NONE else row,
    col' = if (focused) NONE else col,
    lastEvent' = "delete",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    focused' = focused,
    hasText' = hasText,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    cellValues' = cellValues
  }

  // --- navigation keys --------------------------------------------------------
  action arrow_down = all {
    open' = if (focused) true else open,
    row' = if (focused) downRow else row,
    col' = if (focused) downCol else col,
    lastEvent' = "arrow_down",
    valueChanged' = false,
    wasOpen' = open,
    focused' = focused,
    hasText' = hasText,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    cellValues' = cellValues
  }

  action arrow_up = all {
    open' = if (focused) true else open,
    row' = if (focused) upRow else row,
    col' = if (focused) upCol else col,
    lastEvent' = "arrow_up",
    valueChanged' = false,
    wasOpen' = open,
    focused' = focused,
    hasText' = hasText,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    cellValues' = cellValues
  }

  // Left / Right move between cells (wrapping across rows); with the visual
  // focus on the textbox they edit the text instead
  action arrow_right = all {
    row' = if (moves) rightIdx / COLS else row,
    col' = if (moves) rightIdx % COLS else col,
    lastEvent' = "arrow_right",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    focused' = focused,
    hasText' = hasText,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    cellValues' = cellValues
  }

  action arrow_left = all {
    row' = if (moves) leftIdx / COLS else row,
    col' = if (moves) leftIdx % COLS else col,
    lastEvent' = "arrow_left",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    focused' = focused,
    hasText' = hasText,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    cellValues' = cellValues
  }

  // Home / End: visual focus back to the textbox, grid stays open
  action home = all {
    row' = if (focused) NONE else row,
    col' = if (focused) NONE else col,
    lastEvent' = "home",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    focused' = focused,
    hasText' = hasText,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    cellValues' = cellValues
  }

  action end = all {
    row' = if (focused) NONE else row,
    col' = if (focused) NONE else col,
    lastEvent' = "end",
    valueChanged' = false,
    wasOpen' = open,
    open' = open,
    focused' = focused,
    hasText' = hasText,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    cellValues' = cellValues
  }

  // --- commit / dismiss ---------------------------------------------------
  // Enter on a focused cell commits its suggestion (cell or whole row) and closes
  action enter = all {
    open' = if (moves) false else open,
    picked' = landedInt(holds, picked, if (moves) focusedSuggestion else picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (moves) focusedSuggestion else picked),
    requested' = if ((if (moves) focusedSuggestion else picked) != picked) if (moves) focusedSuggestion else picked else requested,
    outcome' = if ((if (moves) focusedSuggestion else picked) != picked) verdict else outcome,
    base' = if ((if (moves) focusedSuggestion else picked) != picked) picked else base,
    requests' = if ((if (moves) focusedSuggestion else picked) != picked) requests + 1 else requests,
    row' = if (moves) NONE else row,
    col' = if (moves) NONE else col,
    lastEvent' = "enter",
    valueChanged' = and(moves, picked != focusedSuggestion),
    wasOpen' = open,
    focused' = focused,
    hasText' = hasText,
    cellValues' = cellValues
  }

  // open: close, keep the value; closed: clear the textbox
  action escape = all {
    open' = if (focused) false else open,
    row' = if (focused) NONE else row,
    col' = if (focused) NONE else col,
    hasText' = if (escapeClears) false else hasText,
    picked' = landedInt(holds, picked, if (escapeClears) NONE else picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (escapeClears) NONE else picked),
    requested' = if ((if (escapeClears) NONE else picked) != picked) if (escapeClears) NONE else picked else requested,
    outcome' = if ((if (escapeClears) NONE else picked) != picked) verdict else outcome,
    base' = if ((if (escapeClears) NONE else picked) != picked) picked else base,
    requests' = if ((if (escapeClears) NONE else picked) != picked) requests + 1 else requests,
    lastEvent' = "escape",
    valueChanged' = escapeClears,
    wasOpen' = open,
    focused' = focused,
    cellValues' = cellValues
  }

  // --- pointer -------------------------------------------------------------
  action click_input = all {
    focused' = true,
    open' = not(open),
    row' = NONE,
    col' = NONE,
    lastEvent' = "click_input",
    valueChanged' = false,
    wasOpen' = open,
    hasText' = hasText,
    picked' = landedInt(holds, picked, picked),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, picked),
    requested' = if ((picked) != picked) picked else requested,
    outcome' = if ((picked) != picked) verdict else outcome,
    base' = if ((picked) != picked) picked else base,
    requests' = if ((picked) != picked) requests + 1 else requests,
    cellValues' = cellValues
  }

  // clicking a cell of the open grid commits it and returns visual focus
  action click_cell = {
    nondet k = Set(0, 1, 2, 3, 4, 5, 6, 7, 8).oneOf()
    all {
      picked' = landedInt(holds, picked, if (open) suggestionAt(k) else picked),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, if (open) suggestionAt(k) else picked),
      requested' = if ((if (open) suggestionAt(k) else picked) != picked) if (open) suggestionAt(k) else picked else requested,
      outcome' = if ((if (open) suggestionAt(k) else picked) != picked) verdict else outcome,
      base' = if ((if (open) suggestionAt(k) else picked) != picked) picked else base,
      requests' = if ((if (open) suggestionAt(k) else picked) != picked) requests + 1 else requests,
      open' = false,
      row' = NONE,
      col' = NONE,
      focused' = if (open) true else focused,
      lastEvent' = "click_cell",
      valueChanged' = and(open, picked != suggestionAt(k)),
      wasOpen' = open,
      hasText' = hasText,
      cellValues' = cellValues
    }
  }

  // --- prop changes ---------------------------------------------------------
  // the suggestion id space changes with the layout: popup closes, value cleared
  action set_layout = {
    nondet cells = Set(true, false).oneOf()
    all {
      cellValues' = cells,
      open' = false,
      row' = NONE,
      col' = NONE,
      picked' = NONE,
      lastEvent' = "set_layout",
      valueChanged' = picked >= 0,
      wasOpen' = open,
      focused' = focused,
      hasText' = hasText,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) NONE else valueProp,
      requested' = requested,
      outcome' = "none",
      base' = base,
      requests' = requests
    }
  }

  action set_value = {
    nondet i = Set(0, 1, 2).oneOf()
    all {
      picked' = i,
      open' = false,
      row' = NONE,
      col' = NONE,
      lastEvent' = "set_value",
      valueChanged' = picked != i,
      wasOpen' = open,
      focused' = focused,
      hasText' = hasText,
      cellValues' = cellValues,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) i else valueProp,
      requested' = requested,
      outcome' = "none",
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips its own copy of the picked suggestion
  action hostToggle = all {
    open' = open,
    row' = row,
    col' = col,
    focused' = focused,
    hasText' = hasText,
    picked' = if (controlled) (if (picked >= 0) NONE else 0) else picked,
    cellValues' = cellValues,
    lastEvent' = "hostToggle",
    valueChanged' = false,
    wasOpen' = open,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) (if (picked >= 0) NONE else 0) else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the host starts owning the picked suggestion, adopting it
  action control = all {
    open' = open,
    row' = row,
    col' = col,
    focused' = focused,
    hasText' = hasText,
    picked' = picked,
    cellValues' = cellValues,
    lastEvent' = lastEvent,
    valueChanged' = valueChanged,
    wasOpen' = open,
    controlled' = true,
    accepting' = accepting,
    valueProp' = picked,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    open' = open,
    row' = row,
    col' = col,
    focused' = focused,
    hasText' = hasText,
    picked' = picked,
    cellValues' = cellValues,
    lastEvent' = lastEvent,
    valueChanged' = valueChanged,
    wasOpen' = open,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, focus, blur, tab, type_char, backspace, delete, arrow_down, arrow_up,
    arrow_right, arrow_left, home, end, enter, escape, click_input, click_cell,
    set_layout, set_value, hostToggle, control, acceptRequests
  }

  // --- invariants (APG guarantees) ----------------------------------------
  // the focused cell is a real grid cell; row and column are set together
  val GridPositionConsistent: bool = and(
    row >= NONE, row < ROWS, col >= NONE, col < COLS, (row == NONE) == (col == NONE)
  )
  // aria-activedescendant (a focused cell) exists only while the grid is open
  val ActiveCellRequiresOpenGrid: bool = or(row == NONE, open)
  // DOM focus stays on the combobox while its popup is open
  val DomFocusStaysOnCombobox: bool = or(not(open), focused)
  // aria-selected: one row (per-row layout) or one cell (per-cell layout)
  // while a cell is focused, nothing otherwise; selection follows focus
  val AriaContractConsistent: bool = and(
    ariaActivedescendant == (if (hasActive) idx else NONE),
    selectedRows + selectedCells == (if (hasActive) 1 else 0),
    or(not(cellValues), selectedRows == 0),
    or(cellValues, selectedCells == 0)
  )
  val EscapeOnOpenGridKeepsValue: bool =
    or(not(lastEvent == "escape"), not(wasOpen), not(valueChanged))
  val NavigationKeepsValue: bool = or(not(isNavigation(lastEvent)), not(valueChanged))
  val ValueChangesOnlyOnCommitOrEdit: bool = or(not(valueChanged), mayChangeValue(lastEvent))
  // a committed suggestion id exists in the current layout
  val PickedInRange: bool =
    or(picked == NONE, picked < (if (cellValues) CELLS else ROWS))
  val FocusLossClosesGrid: bool =
    or(not(or(lastEvent == "blur", lastEvent == "tab")), and(not(open), not(focused)))
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the picked suggestion, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), picked == valueProp)
  // a rejected request leaves the picked suggestion as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), picked == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), picked == requested)
}
