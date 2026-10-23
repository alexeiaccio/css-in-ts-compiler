// WAI-ARIA APG — grid: sortable column headers (data grid example 2).
//
// Modelled from https://www.w3.org/WAI/ARIA/apg/patterns/grid/ ("WAI-ARIA Roles,
// States, and Properties": aria-sort on the header cell of the sorted column; "if
// column or row header cells do not provide functions, such as sort or filter,
// they do not need to be focusable") and from the "Sortable Data Grid With Editable
// Cells" example in https://www.w3.org/WAI/ARIA/apg/patterns/grid/examples/data-grids/
// (aria-sort ascending / descending / none; headers focusable because Date and
// Amount sort). Also the Grid and Table Properties Practice referenced there
// (one sorted column at a time).
//
// The machine is the header row only: roving focus among the COLS column headers,
// Enter / Space / click activate the sort button of a header. Columns 0 and 2 are
// sortable, column 1 is not. aria-sort per header is derived:
//   absent      - the column is not sortable (or sorting is disabled);
//   "none"      - sortable but not the sorted column;
//   "ascending" / "descending" - the sorted column.
//
// Deliberate decisions where APG is silent:
//   - activating an unsorted sortable header sorts it ascending and resets the
//     previously sorted header to "none"; activating the sorted header toggles
//     ascending <-> descending (it never returns to "none");
//   - activating a non-sortable header only moves focus;
//   - header focus does not wrap; keys are ignored without DOM focus;
//   - disabling sorting clears the sort and removes aria-sort everywhere.
//
// Request vs commit (map ticket rt1p). The sort — a (column, direction) pair — is
// the value, packed into `sortPacked` (-1 = unsorted). Every event a user sees as
// a sort — `key` (Enter/Space on a sortable header) and `click` — is a *request*
// carrying an intent (`requested`); it fires onValueChange (`requests` counts the
// calls) when the intent differs from the current value, and then:
//   uncontrolled        the request is accepted: the sort commits the intent
//   controlled, holds   the host ignores it ("rejected"): the sort is untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       sort commits through the controlled value, not the event
// `valueProp` is the only thing that changes the sort while `controlled`;
// `setValue` / `hostToggle` are the host writing it. `control` / `acceptRequests`
// are configuration events (init is literal-only) and `set_sort_enabled` is an
// ordinary prop change (a request when it clears an existing sort). Invariants for
// the model: ControlledFollowsProp, RejectedRequestUntouched,
// AcceptedRequestCommits; `NoSortWhenDisabled` is scoped to the uncontrolled path
// (a controlled host owns the value and may hold a sort while sorting is off).
//
// Deliberate omissions: Up/Down between the header row and the body cells (compose
// with grid.qnt by treating the header as row -1), the data rows' order itself,
// aria-live sort announcements, column hiding (aria-colindex gaps), the
// "headers are not focusable if they have no function" variant (here every header
// is focusable whenever sorting is enabled), filter buttons.
//
// Generator gaps hit: no sets/lists/maps (the sorted column is an int, -1 = none);
// no `const` (sizes are zero-argument `val`s); one nondet per action.
module apg_grid_sort {
  var headerCol: int   // focused header column, 0-based (the roving tab stop)
  var hasFocus: bool   // DOM focus is on a header cell
  var sortEnabled: bool // the grid offers sorting at all
  var sortCol: int     // sorted column, -1 = unsorted
  var sortDir: str     // "none" | "ascending" | "descending"
  var controlled: bool // the host owns the sort (`value` prop present)
  var accepting: bool  // controlled host that answers every request with its intent
  var valueProp: int   // the controlled value prop (packed, -1 = unsorted)
  var requested: int   // intent of the last request (packed)
  var outcome: str     // "none" | "accepted" | "rejected"
  var base: int        // value when the last request was received (packed)
  var requests: int    // number of requests that fired onValueChange

  val COLS: int = 3
  val LAST_COL: int = COLS - 1

  // columns 0 (Date) and 2 (Amount) sort; column 1 (Type) does not
  def sortable(c: int): bool = c != 1

  // --- ARIA contract (derived) ---
  // "absent" means the aria-sort attribute is omitted
  def ariaSort(c: int): str =
    if (not(and(sortEnabled, sortable(c)))) "absent"
    else if (c == sortCol) sortDir
    else "none"
  def headerTabindex(c: int): int = if (c == headerCol) 0 else -1
  def isSortedHeader(c: int): bool = or(ariaSort(c) == "ascending", ariaSort(c) == "descending")
  def sortedHeaders: int =
    (if (isSortedHeader(0)) 1 else 0) + (if (isSortedHeader(1)) 1 else 0) + (if (isSortedHeader(2)) 1 else 0)
  def headerTabStops: int =
    (if (headerTabindex(0) == 0) 1 else 0) + (if (headerTabindex(1) == 0) 1 else 0) + (if (headerTabindex(2) == 0) 1 else 0)

  // sorting by column c (a no-op for unsortable columns / disabled sorting)
  def sorts(c: int): bool = and(sortEnabled, sortable(c))
  def nextDir(c: int): str =
    if (and(c == sortCol, sortDir == "ascending")) "descending" else "ascending"

  def keyCol(k: str): int =
    if (k == "ArrowRight") (if (headerCol < LAST_COL) headerCol + 1 else headerCol)
    else if (k == "ArrowLeft") (if (headerCol > 0) headerCol - 1 else headerCol)
    else if (k == "Home") 0
    else if (k == "End") LAST_COL
    else headerCol
  def activates(k: str): bool = and(hasFocus, or(k == "Enter", k == "Space"), sorts(headerCol))

  // --- request / commit (map ticket rt1p) ----------------------------------
  def moved(before: int, after: int): int = if (before == after) 0 else 1
  // injective: -1 unsorted; else 2*column + (descending ? 1 : 0)
  def sortPacked(c: int, d: str): int =
    if (c == -1) -1 else 2 * c + (if (d == "descending") 1 else 0)
  def unpackCol(v: int): int = if (v == -1) -1 else v / 2
  def unpackDir(v: int): str =
    if (v == -1) "none" else if (v % 2 == 1) "descending" else "ascending"
  def nowPacked: int = sortPacked(sortCol, sortDir)
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the value after a request for `want`
  def landedI(h: bool, current: int, want: int): int = if (h) current else want
  def landedS(h: bool, current: str, want: str): str = if (h) current else want
  // the value prop after a request for `want`
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p
  // the request intent of a key / a click, per member and packed
  def keyWantCol(k: str): int = if (activates(k)) headerCol else sortCol
  def keyWantDir(k: str): str = if (activates(k)) nextDir(headerCol) else sortDir
  def keyWantPacked(k: str): int = sortPacked(keyWantCol(k), keyWantDir(k))
  def keyMoves(k: str): bool = keyWantPacked(k) != nowPacked
  def clickWantCol(c: int): int = if (sorts(c)) c else sortCol
  def clickWantDir(c: int): str = if (sorts(c)) nextDir(c) else sortDir
  def clickWantPacked(c: int): int = sortPacked(clickWantCol(c), clickWantDir(c))
  def clickMoves(c: int): bool = clickWantPacked(c) != nowPacked
  // disabling sorting clears an existing sort: a real request only then
  def setEnabledMoves(f: bool): bool = and(not(f), nowPacked != -1)
  // the host flips its own copy: None -> column 0 ascending, else flip the direction
  def flipDir(d: str): str = if (d == "ascending") "descending" else "ascending"
  def togglePacked: int =
    if (sortCol == -1) sortPacked(0, "ascending") else sortPacked(sortCol, flipDir(sortDir))

  action init = all {
    headerCol' = 0,
    hasFocus' = false,
    sortEnabled' = true,
    sortCol' = -1,
    sortDir' = "none",
    controlled' = false,
    accepting' = false,
    valueProp' = -1,
    requested' = -1,
    outcome' = "none",
    base' = -1,
    requests' = 0
  }

  // request: a keydown on the header row (Enter / Space activate a sortable column)
  action key = {
    nondet key = Set("ArrowRight", "ArrowLeft", "Home", "End", "Enter", "Space").oneOf()
    all {
      headerCol' = if (hasFocus) keyCol(key) else headerCol,
      hasFocus' = hasFocus,
      sortEnabled' = sortEnabled,
      sortCol' = landedI(holds, sortCol, keyWantCol(key)),
      sortDir' = landedS(holds, sortDir, keyWantDir(key)),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (keyMoves(key)) propAfter(follows, valueProp, keyWantPacked(key)) else valueProp,
      requested' = if (keyMoves(key)) keyWantPacked(key) else requested,
      outcome' = if (keyMoves(key)) verdict else outcome,
      base' = if (keyMoves(key)) nowPacked else base,
      requests' = if (keyMoves(key)) requests + 1 else requests
    }
  }

  // request: pointer on a header: focuses it and activates its sort button
  action click = {
    nondet column = Set(0, 1, 2).oneOf()
    all {
      headerCol' = column,
      hasFocus' = true,
      sortEnabled' = sortEnabled,
      sortCol' = landedI(holds, sortCol, clickWantCol(column)),
      sortDir' = landedS(holds, sortDir, clickWantDir(column)),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (clickMoves(column)) propAfter(follows, valueProp, clickWantPacked(column)) else valueProp,
      requested' = if (clickMoves(column)) clickWantPacked(column) else requested,
      outcome' = if (clickMoves(column)) verdict else outcome,
      base' = if (clickMoves(column)) nowPacked else base,
      requests' = if (clickMoves(column)) requests + 1 else requests
    }
  }

  action focus_in = all {
    headerCol' = headerCol,
    hasFocus' = true,
    sortEnabled' = sortEnabled,
    sortCol' = sortCol,
    sortDir' = sortDir,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action focus_out = all {
    headerCol' = headerCol,
    hasFocus' = false,
    sortEnabled' = sortEnabled,
    sortCol' = sortCol,
    sortDir' = sortDir,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // prop change: disabling sorting requests clearing the sort
  action set_sort_enabled = {
    nondet flag = Set(true, false).oneOf()
    all {
      headerCol' = headerCol,
      hasFocus' = hasFocus,
      sortEnabled' = flag,
      sortCol' = if (flag) sortCol else landedI(holds, sortCol, -1),
      sortDir' = if (flag) sortDir else landedS(holds, sortDir, "none"),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (setEnabledMoves(flag)) propAfter(follows, valueProp, -1) else valueProp,
      requested' = if (setEnabledMoves(flag)) -1 else requested,
      outcome' = if (setEnabledMoves(flag)) verdict else outcome,
      base' = if (setEnabledMoves(flag)) nowPacked else base,
      requests' = if (setEnabledMoves(flag)) requests + 1 else requests
    }
  }

  // commit: the host writes the controlled sort (a no-op while uncontrolled)
  action setValue = {
    nondet v = Set(-1, 0, 1, 4, 5).oneOf()
    all {
      headerCol' = headerCol,
      hasFocus' = hasFocus,
      sortEnabled' = sortEnabled,
      sortCol' = if (controlled) unpackCol(v) else sortCol,
      sortDir' = if (controlled) unpackDir(v) else sortDir,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) v else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips its own copy of the sort (an outside button)
  action hostToggle = all {
    headerCol' = headerCol,
    hasFocus' = hasFocus,
    sortEnabled' = sortEnabled,
    sortCol' = if (controlled) unpackCol(togglePacked) else sortCol,
    sortDir' = if (controlled) unpackDir(togglePacked) else sortDir,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) togglePacked else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the host starts owning the sort, adopting the current one
  action control = all {
    headerCol' = headerCol,
    hasFocus' = hasFocus,
    sortEnabled' = sortEnabled,
    sortCol' = sortCol,
    sortDir' = sortDir,
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
    headerCol' = headerCol,
    hasFocus' = hasFocus,
    sortEnabled' = sortEnabled,
    sortCol' = sortCol,
    sortDir' = sortDir,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, key, click, focus_in, focus_out, set_sort_enabled,
    setValue, hostToggle, control, acceptRequests
  }

  val HeaderFocusInBounds: bool = and(headerCol >= 0, headerCol < COLS)
  // roving tabindex across the header row: exactly one header has tabindex=0
  val ExactlyOneHeaderTabStop: bool = headerTabStops == 1
  // at most one header carries ascending/descending
  val AtMostOneSortedHeader: bool = sortedHeaders <= 1
  // a sorted column is a sortable column; unsorted means direction "none"
  val SortedColumnIsSortable: bool = or(sortCol == -1, and(sortCol >= 0, sortCol < COLS, sortable(sortCol)))
  val UnsortedMeansNoDirection: bool = or(sortCol != -1, sortDir == "none")
  val SortedMeansDirection: bool = or(sortCol == -1, or(sortDir == "ascending", sortDir == "descending"))
  // no sort state (and so no aria-sort) when sorting is disabled; a controlled
  // host owns the value and may hold a sort while sorting is turned off
  val NoSortWhenDisabled: bool = or(controlled, or(sortEnabled, and(sortCol == -1, sortDir == "none")))
  // a non-sortable header never exposes aria-sort
  val NonSortableHeaderHasNoAriaSort: bool = ariaSort(1) == "absent"
  val SortDirValid: bool = or(sortDir == "none", sortDir == "ascending", sortDir == "descending")
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), nowPacked == valueProp)
  // a rejected request leaves the state as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), nowPacked == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), nowPacked == requested)
}
