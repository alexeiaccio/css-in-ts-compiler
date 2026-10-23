// APG Treegrid — https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/
// and its example, the E-mail Inbox treegrid:
// https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-1/
//
// Modelled (APG sections: About This Pattern, Keyboard Interaction, WAI-ARIA
// Roles/States/Properties):
//   - a fixed tree of 7 rows in document order x 3 columns, the parent map being
//     the only tree data (Inbox-style: A > {A.1, A.2 > {A.2.1}}, B > {B.1, B.2}):
//         row 0 A      parent -         row 4 B      parent -
//         row 1 A.1    parent 0         row 5 B.1    parent 4
//         row 2 A.2    parent 0         row 6 B.2    parent 4
//         row 3 A.2.1  parent 2
//     every ARIA fact is DERIVED from that map: hasChildren, aria-level,
//     aria-setsize, aria-posinset, aria-expanded (only on parent rows), and row
//     visibility (a row is rendered only while all its ancestors are expanded).
//   - the three navigation models of the example: `rowsFirst` (Tab lands on the
//     row, Right enters the cells), `cellsFirst` (Tab lands on the first cell,
//     Left from the first cell still reaches the row) and `cellsOnly` (rows are
//     never focused; Enter on the first cell of a parent row toggles it).
//   - roving tabindex: exactly one rendered row-or-cell is the tab stop, and the
//     tab stop is remembered while focus is outside the grid.
//   - keys: Right / Left (expand / collapse a focused row, otherwise move between
//     cells), Down / Up over VISIBLE rows (same column in cell mode), Home / End
//     (first / last visible row in row mode, first / last cell in cell mode),
//     Ctrl+Home / Ctrl+End (first / last visible row; same column in cell mode),
//     Enter (cellsOnly toggle), plus Tab in / out and pointer clicks (cell focus,
//     expander toggle - which relocates focus to the toggled row when it would
//     hide the focused row).
//   - selection (rows): `single` selection follows focus (aria-selected on one
//     row only, absent elsewhere); `multi` selection is independent of focus
//     (aria-multiselectable, aria-selected true/false on every row): Shift+Space
//     toggles the focused row, Ctrl+A selects all rows, Shift+Down / Shift+Up on
//     a focused row extend the selection to the neighbouring visible row.
//
// Request vs commit (map ticket rt1p). The controlled value of a treegrid is the
// selected-row set; expansion stays uncontrolled (like a menu's open state). Every
// user-intent event that changes the selection - Tab in (single follows focus),
// Down / Up / Home / End / Ctrl+Home / Ctrl+End (single follows focus), a cell
// click, an expander toggle that relocates focus, Shift+Space, Ctrl+A and the
// Shift+arrow extensions - is a *request* carrying the intended `selMask`
// (packed into `requested`). It fires onValueChange (`requests` counts the calls)
// when the intent differs from the current selection, and then:
//   uncontrolled        the request is accepted: the rows commit the intent
//   controlled, holds   the host ignores it ("rejected"): the selection is untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       rows commit through the controlled value, not the event
// The controlled value `selMask` is spelled out per member (`valueProp0..6`, bit
// r = row r) because the generator has no collections; it is the only thing that
// changes the selection while `controlled`, and `setValue` / `hostToggle` are the
// host writing it. `control` and `acceptRequests` are configuration events (init
// is literal-only). Configuration events (`configureNav` / `configureSel`) reset
// the uncontrolled expansion and focus but leave a controlled selection alone.
// Expansion keys (Right / Left / Enter) and focus movement do not change the
// controlled value, so they commit unconditionally.
//
// Invariants for the model: ControlledFollowsProp (in controlled mode no event
// commits the selection), RejectedRequestUntouched, AcceptedRequestCommits. The
// single-select invariants are scoped to the uncontrolled path: a controlled host
// owns the selection and may hand the grid any set.
//
// `outcome` is "none" | "accepted" | "rejected" for the last request; a host
// write settles it back to "none". `base` is the packed selection when the last
// request was received.
//
// Deliberately omitted (recorded gaps, see the bean summary):
//   - Page Up / Page Down: the row count is "author-determined".
//   - Tab to focusable elements inside cells and editing inside cells (grid
//     "Editing and Navigating Inside a Cell"); cells are the focus targets.
//   - cell / column selection (Ctrl+Space, Shift+Left/Right, cell-level Shift+Up/
//     Down), aria-sort, aria-readonly, aria-rowcount / aria-colcount / *index.
//   - row type headers (columnheader / rowheader), aria-label(ledby).
//   - dynamic trees: the parent map is constant. The generator has no
//     collections (str / int / bool vars only), so per-parent expansion is three
//     bool vars and the controlled selected-row set is one bool per row.
//   - Left on a collapsed / leaf row does NOT move to the parent: that is what
//     APG says ("focus does not move"); implementations that jump to the parent
//     diverge from APG.
module apg_treegrid {
  import aria.* from "../../shared/aria"

  var navModel: str  // "rowsFirst" | "cellsFirst" | "cellsOnly"
  var selMode: str   // "single" | "multi"
  var exp0: bool     // row 0 expanded
  var exp2: bool     // row 2 expanded
  var exp4: bool     // row 4 expanded
  var inGrid: bool   // DOM focus is inside the treegrid
  var kind: str      // the roving item is a "row" or a "cell"
  var frow: int      // roving / focused row (0..6)
  var fcol: int      // roving / focused column (0..2); always 0 on a row
  var selMask: int   // selected rows, bit r set = row r selected (0..127)
  var controlled: bool  // the host owns the selection (`value` prop present)
  var accepting: bool   // controlled host that answers every request with its intent
  var valueProp0: bool  // controlled selection member 0 (row 0), ...
  var valueProp1: bool
  var valueProp2: bool
  var valueProp3: bool
  var valueProp4: bool
  var valueProp5: bool
  var valueProp6: bool
  var requested: int    // intent of the last request, packed selection
  var outcome: str      // "none" | "accepted" | "rejected"
  var base: int         // packed selection when the last request was received
  var requests: int     // number of requests that fired onSelectionChange

  // ---- constants as nullary vals --------------------------------------------
  val ROWS: int = 7
  val COLS: int = 3

  // ---- small arithmetic -----------------------------------------------------
  def b(x: bool): int = if (x) 1 else 0
  def minI(x: int, y: int): int = if (x < y) x else y

  def bit(r: int): int =
    if (r == 0) 1 else if (r == 1) 2 else if (r == 2) 4 else if (r == 3) 8
    else if (r == 4) 16 else if (r == 5) 32 else if (r == 6) 64 else 0
  def bitSet(mask: int, r: int): bool =
    if (bit(r) == 0) false else (mask / bit(r)) % 2 == 1
  def popcount(mask: int): int =
    b(bitSet(mask, 0)) + b(bitSet(mask, 1)) + b(bitSet(mask, 2)) + b(bitSet(mask, 3))
    + b(bitSet(mask, 4)) + b(bitSet(mask, 5)) + b(bitSet(mask, 6))
  def withBit(mask: int, r: int): int = if (bitSet(mask, r)) mask else mask + bit(r)
  def flipBit(mask: int, r: int): int =
    if (bitSet(mask, r)) mask - bit(r) else mask + bit(r)

  // ---- the tree: ONE parent map, everything else derived --------------------
  def parentOf(r: int): int =
    if (r == 1) 0 else if (r == 2) 0 else if (r == 3) 2
    else if (r == 5) 4 else if (r == 6) 4 else -1
  def childCount(p: int): int =
    b(parentOf(0) == p) + b(parentOf(1) == p) + b(parentOf(2) == p) + b(parentOf(3) == p)
    + b(parentOf(4) == p) + b(parentOf(5) == p) + b(parentOf(6) == p)
  def hasChildren(r: int): bool = childCount(r) > 0

  // ---- ARIA contract derived from the tree ----------------------------------
  def ariaLevel(r: int): int =
    if (parentOf(r) < 0) 1 else if (parentOf(parentOf(r)) < 0) 2 else 3
  // siblings share a parent; the roots (parent -1) form the top-level set
  def ariaSetSize(r: int): int = childCount(parentOf(r))
  def ariaPosInSet(r: int): int =
    1 + b(0 < r and parentOf(0) == parentOf(r)) + b(1 < r and parentOf(1) == parentOf(r))
    + b(2 < r and parentOf(2) == parentOf(r)) + b(3 < r and parentOf(3) == parentOf(r))
    + b(4 < r and parentOf(4) == parentOf(r)) + b(5 < r and parentOf(5) == parentOf(r))

  // ---- expansion and visibility ---------------------------------------------
  // expansion of row p under a hypothetical (a, c, d) = (exp0, exp2, exp4)
  def expW(p: int, a: bool, c: bool, d: bool): bool =
    if (p == 0) a else if (p == 2) c else if (p == 4) d else false
  def isExp(p: int): bool = expW(p, exp0, exp2, exp4)
  // the children of p are rendered: p and every ancestor of p are expanded
  // (depth is at most 3, so one grandparent step covers it)
  def openW(p: int, a: bool, c: bool, d: bool): bool =
    if (p < 0) true
    else if (not(expW(p, a, c, d))) false
    else if (parentOf(p) < 0) true
    else expW(parentOf(p), a, c, d)
  def visibleW(r: int, a: bool, c: bool, d: bool): bool =
    if (r < 0 or r >= ROWS) false else openW(parentOf(r), a, c, d)
  def visible(r: int): bool = visibleW(r, exp0, exp2, exp4)

  // aria-expanded exists only on parent rows
  def ariaExpandedOf(r: int): str =
    if (hasChildren(r)) ariaBoolToken(isExp(r)) else "absent"
  def canExpand(r: int): bool = hasChildren(r) and not(isExp(r))
  def canCollapse(r: int): bool = hasChildren(r) and isExp(r)
  def toggleIf(target: int, r: int, cur: bool): bool = if (target == r) not(cur) else cur

  // ---- selection ARIA --------------------------------------------------------
  def multiselectable(sel: str): bool = ariaSelIsMulti(sel)
  def ariaSelectedOf(sel: str, mask: int, r: int): str =
    if (bitSet(mask, r)) "true" else if (sel == "multi") "false" else "absent"
  // single selection follows focus; multi leaves the selection alone
  def follow(sel: str, mask: int, r: int): int = if (sel == "single") bit(r) else mask

  // ---- roving tabindex -------------------------------------------------------
  def rowFocusSupported(nav: str): bool = nav != "cellsOnly"
  def isTabRow(r: int, k: str, fr: int): bool = k == "row" and fr == r
  def isTabCell(r: int, c: int, k: str, fr: int, fc: int): bool =
    k == "cell" and fr == r and fc == c
  def rowTabindex(r: int, k: str, fr: int): int = if (isTabRow(r, k, fr)) 0 else -1
  def cellTabindex(r: int, c: int, k: str, fr: int, fc: int): int =
    if (isTabCell(r, c, k, fr, fc)) 0 else -1
  def tabStopsIn(r: int, k: str, fr: int, fc: int): int =
    b(isTabRow(r, k, fr)) + b(isTabCell(r, 0, k, fr, fc)) + b(isTabCell(r, 1, k, fr, fc))
    + b(isTabCell(r, 2, k, fr, fc))
  // tab stops among the RENDERED rows only
  val tabStops: int =
    b(visible(0)) * tabStopsIn(0, kind, frow, fcol) + b(visible(1)) * tabStopsIn(1, kind, frow, fcol)
    + b(visible(2)) * tabStopsIn(2, kind, frow, fcol) + b(visible(3)) * tabStopsIn(3, kind, frow, fcol)
    + b(visible(4)) * tabStopsIn(4, kind, frow, fcol) + b(visible(5)) * tabStopsIn(5, kind, frow, fcol)
    + b(visible(6)) * tabStopsIn(6, kind, frow, fcol)

  // ---- navigation over VISIBLE rows ------------------------------------------
  def nextVis(r: int): int =
    if (visible(r + 1)) r + 1 else if (visible(r + 2)) r + 2 else if (visible(r + 3)) r + 3
    else if (visible(r + 4)) r + 4 else if (visible(r + 5)) r + 5 else if (visible(r + 6)) r + 6
    else r
  def prevVis(r: int): int =
    if (visible(r - 1)) r - 1 else if (visible(r - 2)) r - 2 else if (visible(r - 3)) r - 3
    else if (visible(r - 4)) r - 4 else if (visible(r - 5)) r - 5 else if (visible(r - 6)) r - 6
    else r
  val lastVis: int = prevVis(ROWS)
  // target rows of the jump keys (the cell-mode forms keep the row)
  val homeRow: int = if (kind == "row") 0 else frow
  val endRow: int = if (kind == "row") lastVis else frow

  // a click on the expander of row r is ignored unless that row is rendered
  def clickTarget(r: int): int = if (visible(r)) r else -1
  // collapsing may hide the focused row: focus relocates to the toggled row
  def rowAfterToggle(r: int): int =
    if (visibleW(frow, toggleIf(clickTarget(r), 0, exp0), toggleIf(clickTarget(r), 2, exp2),
                 toggleIf(clickTarget(r), 4, exp4))) frow else r

  // ---- request / commit (map ticket rt1p) -----------------------------------
  def holds: bool = and(controlled, not(accepting))
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the selection after a request for `want`
  def landed(h: bool, current: int, want: int): int = if (h) current else want
  // a controlled member after a request for `want`
  def propAfter(f: bool, p: bool, want: bool): bool = if (f) want else p
  // the packed controlled value, spelled out one member at a time
  def propMask: int =
    b(valueProp0) + 2 * b(valueProp1) + 4 * b(valueProp2) + 8 * b(valueProp3)
    + 16 * b(valueProp4) + 32 * b(valueProp5) + 64 * b(valueProp6)
  // a request is real only when its intent differs from the current selection
  def reqMoves(want: int): bool = want != selMask
  // the intended selection of each request action
  def focusWant: int = follow(selMode, selMask, frow)
  def downWant: int = if (inGrid) follow(selMode, selMask, nextVis(frow)) else selMask
  def upWant: int = if (inGrid) follow(selMode, selMask, prevVis(frow)) else selMask
  def homeWant: int = if (inGrid) follow(selMode, selMask, homeRow) else selMask
  def endWant: int = if (inGrid) follow(selMode, selMask, endRow) else selMask
  def ctrlHomeWant: int = if (inGrid) follow(selMode, selMask, 0) else selMask
  def ctrlEndWant: int = if (inGrid) follow(selMode, selMask, lastVis) else selMask
  def cellWant(cell: int): int =
    if (visible(cell / COLS)) follow(selMode, selMask, cell / COLS) else selMask
  def toggleRowWant(r: int): int =
    if (and(selMode == "single", and(selMask != 0, visible(r))))
      bit(rowAfterToggle(r)) else selMask
  def toggleSelectWant: int =
    if (inGrid and selMode == "multi") flipBit(selMask, frow) else selMask
  def selectAllWant: int = if (inGrid and selMode == "multi") 127 else selMask
  def extendDownWant: int =
    if (inGrid and selMode == "multi" and kind == "row")
      withBit(withBit(selMask, frow), nextVis(frow)) else selMask
  def extendUpWant: int =
    if (inGrid and selMode == "multi" and kind == "row")
      withBit(withBit(selMask, frow), prevVis(frow)) else selMask

  // ---- actions ---------------------------------------------------------------

  action init = all {
    navModel' = "rowsFirst",
    selMode' = "single",
    exp0' = false,
    exp2' = false,
    exp4' = false,
    inGrid' = false,
    kind' = "row",
    frow' = 0,
    fcol' = 0,
    selMask' = 0,
    controlled' = false,
    accepting' = false,
    valueProp0' = false,
    valueProp1' = false,
    valueProp2' = false,
    valueProp3' = false,
    valueProp4' = false,
    valueProp5' = false,
    valueProp6' = false,
    requested' = 0,
    outcome' = "none",
    base' = 0,
    requests' = 0
  }

  // pick the navigation model; the grid restarts collapsed with the model's entry
  // point (a controlled selection is owned by the host and stays put)
  action configureNav = {
    nondet nav = Set("rowsFirst", "cellsFirst", "cellsOnly").oneOf()
    all {
      navModel' = nav,
      selMode' = selMode,
      exp0' = false,
      exp2' = false,
      exp4' = false,
      inGrid' = false,
      kind' = if (nav == "rowsFirst") "row" else "cell",
      frow' = 0,
      fcol' = 0,
      selMask' = if (controlled) selMask else 0,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = valueProp0,
      valueProp1' = valueProp1,
      valueProp2' = valueProp2,
      valueProp3' = valueProp3,
      valueProp4' = valueProp4,
      valueProp5' = valueProp5,
      valueProp6' = valueProp6,
      requested' = 0,
      outcome' = "none",
      base' = 0,
      requests' = requests
    }
  }

  // pick the selection variant; the grid restarts with the navigation model kept
  action configureSel = {
    nondet sel = Set("single", "multi").oneOf()
    all {
      navModel' = navModel,
      selMode' = sel,
      exp0' = false,
      exp2' = false,
      exp4' = false,
      inGrid' = false,
      kind' = if (navModel == "rowsFirst") "row" else "cell",
      frow' = 0,
      fcol' = 0,
      selMask' = if (controlled) selMask else 0,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = valueProp0,
      valueProp1' = valueProp1,
      valueProp2' = valueProp2,
      valueProp3' = valueProp3,
      valueProp4' = valueProp4,
      valueProp5' = valueProp5,
      valueProp6' = valueProp6,
      requested' = 0,
      outcome' = "none",
      base' = 0,
      requests' = requests
    }
  }

  // request: Tab into the grid (single selection follows the remembered tab stop)
  action focusIn = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = true,
    kind' = kind,
    frow' = frow,
    fcol' = fcol,
    selMask' = landed(holds, selMask, focusWant),
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propAfter(follows, valueProp0, bitSet(focusWant, 0)),
    valueProp1' = propAfter(follows, valueProp1, bitSet(focusWant, 1)),
    valueProp2' = propAfter(follows, valueProp2, bitSet(focusWant, 2)),
    valueProp3' = propAfter(follows, valueProp3, bitSet(focusWant, 3)),
    valueProp4' = propAfter(follows, valueProp4, bitSet(focusWant, 4)),
    valueProp5' = propAfter(follows, valueProp5, bitSet(focusWant, 5)),
    valueProp6' = propAfter(follows, valueProp6, bitSet(focusWant, 6)),
    requested' = if (reqMoves(focusWant)) focusWant else requested,
    outcome' = if (reqMoves(focusWant)) verdict else outcome,
    base' = if (reqMoves(focusWant)) selMask else base,
    requests' = if (reqMoves(focusWant)) requests + 1 else requests
  }

  // Tab out of the grid: the tab stop is remembered
  action blur = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = false,
    kind' = kind,
    frow' = frow,
    fcol' = fcol,
    selMask' = selMask,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    valueProp5' = valueProp5,
    valueProp6' = valueProp6,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // Right: collapsed row expands; expanded / leaf row -> first cell; cell -> next cell
  action right = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = toggleIf(if (inGrid and kind == "row" and canExpand(frow)) frow else -1, 0, exp0),
    exp2' = toggleIf(if (inGrid and kind == "row" and canExpand(frow)) frow else -1, 2, exp2),
    exp4' = toggleIf(if (inGrid and kind == "row" and canExpand(frow)) frow else -1, 4, exp4),
    inGrid' = inGrid,
    kind' = if (inGrid and kind == "row" and not(canExpand(frow))) "cell" else kind,
    frow' = frow,
    fcol' = if (inGrid and kind == "cell") minI(fcol + 1, COLS - 1) else fcol,
    selMask' = selMask,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    valueProp5' = valueProp5,
    valueProp6' = valueProp6,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // Left: expanded row collapses; first cell -> row (when rows are focusable);
  // other cell -> previous cell; collapsed / leaf row stays
  action left = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = toggleIf(if (inGrid and kind == "row" and canCollapse(frow)) frow else -1, 0, exp0),
    exp2' = toggleIf(if (inGrid and kind == "row" and canCollapse(frow)) frow else -1, 2, exp2),
    exp4' = toggleIf(if (inGrid and kind == "row" and canCollapse(frow)) frow else -1, 4, exp4),
    inGrid' = inGrid,
    kind' = if (inGrid and kind == "cell" and fcol == 0 and rowFocusSupported(navModel)) "row" else kind,
    frow' = frow,
    fcol' = if (inGrid and kind == "cell" and fcol > 0) fcol - 1 else fcol,
    selMask' = selMask,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    valueProp5' = valueProp5,
    valueProp6' = valueProp6,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // request: Down, next VISIBLE row (same column in cell mode)
  action down = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = if (inGrid) nextVis(frow) else frow,
    fcol' = fcol,
    selMask' = landed(holds, selMask, downWant),
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propAfter(follows, valueProp0, bitSet(downWant, 0)),
    valueProp1' = propAfter(follows, valueProp1, bitSet(downWant, 1)),
    valueProp2' = propAfter(follows, valueProp2, bitSet(downWant, 2)),
    valueProp3' = propAfter(follows, valueProp3, bitSet(downWant, 3)),
    valueProp4' = propAfter(follows, valueProp4, bitSet(downWant, 4)),
    valueProp5' = propAfter(follows, valueProp5, bitSet(downWant, 5)),
    valueProp6' = propAfter(follows, valueProp6, bitSet(downWant, 6)),
    requested' = if (reqMoves(downWant)) downWant else requested,
    outcome' = if (reqMoves(downWant)) verdict else outcome,
    base' = if (reqMoves(downWant)) selMask else base,
    requests' = if (reqMoves(downWant)) requests + 1 else requests
  }

  // request: Up, previous VISIBLE row (same column in cell mode)
  action up = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = if (inGrid) prevVis(frow) else frow,
    fcol' = fcol,
    selMask' = landed(holds, selMask, upWant),
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propAfter(follows, valueProp0, bitSet(upWant, 0)),
    valueProp1' = propAfter(follows, valueProp1, bitSet(upWant, 1)),
    valueProp2' = propAfter(follows, valueProp2, bitSet(upWant, 2)),
    valueProp3' = propAfter(follows, valueProp3, bitSet(upWant, 3)),
    valueProp4' = propAfter(follows, valueProp4, bitSet(upWant, 4)),
    valueProp5' = propAfter(follows, valueProp5, bitSet(upWant, 5)),
    valueProp6' = propAfter(follows, valueProp6, bitSet(upWant, 6)),
    requested' = if (reqMoves(upWant)) upWant else requested,
    outcome' = if (reqMoves(upWant)) verdict else outcome,
    base' = if (reqMoves(upWant)) selMask else base,
    requests' = if (reqMoves(upWant)) requests + 1 else requests
  }

  // request: Home; row -> first row, cell -> first cell of the row
  action home = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = if (inGrid) homeRow else frow,
    fcol' = if (inGrid and kind == "cell") 0 else fcol,
    selMask' = landed(holds, selMask, homeWant),
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propAfter(follows, valueProp0, bitSet(homeWant, 0)),
    valueProp1' = propAfter(follows, valueProp1, bitSet(homeWant, 1)),
    valueProp2' = propAfter(follows, valueProp2, bitSet(homeWant, 2)),
    valueProp3' = propAfter(follows, valueProp3, bitSet(homeWant, 3)),
    valueProp4' = propAfter(follows, valueProp4, bitSet(homeWant, 4)),
    valueProp5' = propAfter(follows, valueProp5, bitSet(homeWant, 5)),
    valueProp6' = propAfter(follows, valueProp6, bitSet(homeWant, 6)),
    requested' = if (reqMoves(homeWant)) homeWant else requested,
    outcome' = if (reqMoves(homeWant)) verdict else outcome,
    base' = if (reqMoves(homeWant)) selMask else base,
    requests' = if (reqMoves(homeWant)) requests + 1 else requests
  }

  // request: End; row -> last visible row, cell -> last cell of the row
  action end = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = if (inGrid) endRow else frow,
    fcol' = if (inGrid and kind == "cell") COLS - 1 else fcol,
    selMask' = landed(holds, selMask, endWant),
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propAfter(follows, valueProp0, bitSet(endWant, 0)),
    valueProp1' = propAfter(follows, valueProp1, bitSet(endWant, 1)),
    valueProp2' = propAfter(follows, valueProp2, bitSet(endWant, 2)),
    valueProp3' = propAfter(follows, valueProp3, bitSet(endWant, 3)),
    valueProp4' = propAfter(follows, valueProp4, bitSet(endWant, 4)),
    valueProp5' = propAfter(follows, valueProp5, bitSet(endWant, 5)),
    valueProp6' = propAfter(follows, valueProp6, bitSet(endWant, 6)),
    requested' = if (reqMoves(endWant)) endWant else requested,
    outcome' = if (reqMoves(endWant)) verdict else outcome,
    base' = if (reqMoves(endWant)) selMask else base,
    requests' = if (reqMoves(endWant)) requests + 1 else requests
  }

  // request: Ctrl+Home, first row (cell mode keeps the column)
  action ctrlHome = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = if (inGrid) 0 else frow,
    fcol' = fcol,
    selMask' = landed(holds, selMask, ctrlHomeWant),
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propAfter(follows, valueProp0, bitSet(ctrlHomeWant, 0)),
    valueProp1' = propAfter(follows, valueProp1, bitSet(ctrlHomeWant, 1)),
    valueProp2' = propAfter(follows, valueProp2, bitSet(ctrlHomeWant, 2)),
    valueProp3' = propAfter(follows, valueProp3, bitSet(ctrlHomeWant, 3)),
    valueProp4' = propAfter(follows, valueProp4, bitSet(ctrlHomeWant, 4)),
    valueProp5' = propAfter(follows, valueProp5, bitSet(ctrlHomeWant, 5)),
    valueProp6' = propAfter(follows, valueProp6, bitSet(ctrlHomeWant, 6)),
    requested' = if (reqMoves(ctrlHomeWant)) ctrlHomeWant else requested,
    outcome' = if (reqMoves(ctrlHomeWant)) verdict else outcome,
    base' = if (reqMoves(ctrlHomeWant)) selMask else base,
    requests' = if (reqMoves(ctrlHomeWant)) requests + 1 else requests
  }

  // request: Ctrl+End, last visible row (cell mode keeps the column)
  action ctrlEnd = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = if (inGrid) lastVis else frow,
    fcol' = fcol,
    selMask' = landed(holds, selMask, ctrlEndWant),
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propAfter(follows, valueProp0, bitSet(ctrlEndWant, 0)),
    valueProp1' = propAfter(follows, valueProp1, bitSet(ctrlEndWant, 1)),
    valueProp2' = propAfter(follows, valueProp2, bitSet(ctrlEndWant, 2)),
    valueProp3' = propAfter(follows, valueProp3, bitSet(ctrlEndWant, 3)),
    valueProp4' = propAfter(follows, valueProp4, bitSet(ctrlEndWant, 4)),
    valueProp5' = propAfter(follows, valueProp5, bitSet(ctrlEndWant, 5)),
    valueProp6' = propAfter(follows, valueProp6, bitSet(ctrlEndWant, 6)),
    requested' = if (reqMoves(ctrlEndWant)) ctrlEndWant else requested,
    outcome' = if (reqMoves(ctrlEndWant)) verdict else outcome,
    base' = if (reqMoves(ctrlEndWant)) selMask else base,
    requests' = if (reqMoves(ctrlEndWant)) requests + 1 else requests
  }

  // Enter: with cells-only focus, on the first cell of a parent row, toggles its children
  action enter = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = toggleIf(if (inGrid and navModel == "cellsOnly" and kind == "cell" and fcol == 0 and hasChildren(frow)) frow else -1, 0, exp0),
    exp2' = toggleIf(if (inGrid and navModel == "cellsOnly" and kind == "cell" and fcol == 0 and hasChildren(frow)) frow else -1, 2, exp2),
    exp4' = toggleIf(if (inGrid and navModel == "cellsOnly" and kind == "cell" and fcol == 0 and hasChildren(frow)) frow else -1, 4, exp4),
    inGrid' = inGrid,
    kind' = kind,
    frow' = frow,
    fcol' = fcol,
    selMask' = selMask,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    valueProp5' = valueProp5,
    valueProp6' = valueProp6,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // request: click the expander of parent row r; single selection follows the
  // relocated focus
  action toggleRow = {
    nondet r = Set(0, 2, 4).oneOf()
    all {
      navModel' = navModel,
      selMode' = selMode,
      exp0' = toggleIf(clickTarget(r), 0, exp0),
      exp2' = toggleIf(clickTarget(r), 2, exp2),
      exp4' = toggleIf(clickTarget(r), 4, exp4),
      inGrid' = inGrid,
      kind' = kind,
      frow' = rowAfterToggle(r),
      fcol' = fcol,
      selMask' = landed(holds, selMask, toggleRowWant(r)),
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = propAfter(follows, valueProp0, bitSet(toggleRowWant(r), 0)),
      valueProp1' = propAfter(follows, valueProp1, bitSet(toggleRowWant(r), 1)),
      valueProp2' = propAfter(follows, valueProp2, bitSet(toggleRowWant(r), 2)),
      valueProp3' = propAfter(follows, valueProp3, bitSet(toggleRowWant(r), 3)),
      valueProp4' = propAfter(follows, valueProp4, bitSet(toggleRowWant(r), 4)),
      valueProp5' = propAfter(follows, valueProp5, bitSet(toggleRowWant(r), 5)),
      valueProp6' = propAfter(follows, valueProp6, bitSet(toggleRowWant(r), 6)),
      requested' = if (reqMoves(toggleRowWant(r))) toggleRowWant(r) else requested,
      outcome' = if (reqMoves(toggleRowWant(r))) verdict else outcome,
      base' = if (reqMoves(toggleRowWant(r))) selMask else base,
      requests' = if (reqMoves(toggleRowWant(r))) requests + 1 else requests
    }
  }

  // request: click cell number (row * COLS + col); an unrendered cell cannot be clicked
  action clickCell = {
    nondet cell = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20).oneOf()
    all {
      navModel' = navModel,
      selMode' = selMode,
      exp0' = exp0,
      exp2' = exp2,
      exp4' = exp4,
      inGrid' = if (visible(cell / COLS)) true else inGrid,
      kind' = if (visible(cell / COLS)) "cell" else kind,
      frow' = if (visible(cell / COLS)) cell / COLS else frow,
      fcol' = if (visible(cell / COLS)) cell % COLS else fcol,
      selMask' = landed(holds, selMask, cellWant(cell)),
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = propAfter(follows, valueProp0, bitSet(cellWant(cell), 0)),
      valueProp1' = propAfter(follows, valueProp1, bitSet(cellWant(cell), 1)),
      valueProp2' = propAfter(follows, valueProp2, bitSet(cellWant(cell), 2)),
      valueProp3' = propAfter(follows, valueProp3, bitSet(cellWant(cell), 3)),
      valueProp4' = propAfter(follows, valueProp4, bitSet(cellWant(cell), 4)),
      valueProp5' = propAfter(follows, valueProp5, bitSet(cellWant(cell), 5)),
      valueProp6' = propAfter(follows, valueProp6, bitSet(cellWant(cell), 6)),
      requested' = if (reqMoves(cellWant(cell))) cellWant(cell) else requested,
      outcome' = if (reqMoves(cellWant(cell))) verdict else outcome,
      base' = if (reqMoves(cellWant(cell))) selMask else base,
      requests' = if (reqMoves(cellWant(cell))) requests + 1 else requests
    }
  }

  // request: Shift+Space, multi toggles the focused row's selection
  action toggleSelect = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = frow,
    fcol' = fcol,
    selMask' = landed(holds, selMask, toggleSelectWant),
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propAfter(follows, valueProp0, bitSet(toggleSelectWant, 0)),
    valueProp1' = propAfter(follows, valueProp1, bitSet(toggleSelectWant, 1)),
    valueProp2' = propAfter(follows, valueProp2, bitSet(toggleSelectWant, 2)),
    valueProp3' = propAfter(follows, valueProp3, bitSet(toggleSelectWant, 3)),
    valueProp4' = propAfter(follows, valueProp4, bitSet(toggleSelectWant, 4)),
    valueProp5' = propAfter(follows, valueProp5, bitSet(toggleSelectWant, 5)),
    valueProp6' = propAfter(follows, valueProp6, bitSet(toggleSelectWant, 6)),
    requested' = if (reqMoves(toggleSelectWant)) toggleSelectWant else requested,
    outcome' = if (reqMoves(toggleSelectWant)) verdict else outcome,
    base' = if (reqMoves(toggleSelectWant)) selMask else base,
    requests' = if (reqMoves(toggleSelectWant)) requests + 1 else requests
  }

  // request: Ctrl+A, multi selects every row
  action selectAll = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = frow,
    fcol' = fcol,
    selMask' = landed(holds, selMask, selectAllWant),
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propAfter(follows, valueProp0, bitSet(selectAllWant, 0)),
    valueProp1' = propAfter(follows, valueProp1, bitSet(selectAllWant, 1)),
    valueProp2' = propAfter(follows, valueProp2, bitSet(selectAllWant, 2)),
    valueProp3' = propAfter(follows, valueProp3, bitSet(selectAllWant, 3)),
    valueProp4' = propAfter(follows, valueProp4, bitSet(selectAllWant, 4)),
    valueProp5' = propAfter(follows, valueProp5, bitSet(selectAllWant, 5)),
    valueProp6' = propAfter(follows, valueProp6, bitSet(selectAllWant, 6)),
    requested' = if (reqMoves(selectAllWant)) selectAllWant else requested,
    outcome' = if (reqMoves(selectAllWant)) verdict else outcome,
    base' = if (reqMoves(selectAllWant)) selMask else base,
    requests' = if (reqMoves(selectAllWant)) requests + 1 else requests
  }

  // request: Shift+Down on a focused row (multi), move down and extend the selection
  action extendDown = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = if (inGrid and selMode == "multi" and kind == "row") nextVis(frow) else frow,
    fcol' = fcol,
    selMask' = landed(holds, selMask, extendDownWant),
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propAfter(follows, valueProp0, bitSet(extendDownWant, 0)),
    valueProp1' = propAfter(follows, valueProp1, bitSet(extendDownWant, 1)),
    valueProp2' = propAfter(follows, valueProp2, bitSet(extendDownWant, 2)),
    valueProp3' = propAfter(follows, valueProp3, bitSet(extendDownWant, 3)),
    valueProp4' = propAfter(follows, valueProp4, bitSet(extendDownWant, 4)),
    valueProp5' = propAfter(follows, valueProp5, bitSet(extendDownWant, 5)),
    valueProp6' = propAfter(follows, valueProp6, bitSet(extendDownWant, 6)),
    requested' = if (reqMoves(extendDownWant)) extendDownWant else requested,
    outcome' = if (reqMoves(extendDownWant)) verdict else outcome,
    base' = if (reqMoves(extendDownWant)) selMask else base,
    requests' = if (reqMoves(extendDownWant)) requests + 1 else requests
  }

  // request: Shift+Up on a focused row (multi), move up and extend the selection
  action extendUp = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = if (inGrid and selMode == "multi" and kind == "row") prevVis(frow) else frow,
    fcol' = fcol,
    selMask' = landed(holds, selMask, extendUpWant),
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propAfter(follows, valueProp0, bitSet(extendUpWant, 0)),
    valueProp1' = propAfter(follows, valueProp1, bitSet(extendUpWant, 1)),
    valueProp2' = propAfter(follows, valueProp2, bitSet(extendUpWant, 2)),
    valueProp3' = propAfter(follows, valueProp3, bitSet(extendUpWant, 3)),
    valueProp4' = propAfter(follows, valueProp4, bitSet(extendUpWant, 4)),
    valueProp5' = propAfter(follows, valueProp5, bitSet(extendUpWant, 5)),
    valueProp6' = propAfter(follows, valueProp6, bitSet(extendUpWant, 6)),
    requested' = if (reqMoves(extendUpWant)) extendUpWant else requested,
    outcome' = if (reqMoves(extendUpWant)) verdict else outcome,
    base' = if (reqMoves(extendUpWant)) selMask else base,
    requests' = if (reqMoves(extendUpWant)) requests + 1 else requests
  }

  // commit: the host writes the controlled selection (a no-op while uncontrolled).
  // The pool is one row at a time: a host sets a single row or clears.
  action setValue = {
    nondet v = Set(0, 1, 2, 4, 8, 16, 32, 64).oneOf()
    all {
      navModel' = navModel,
      selMode' = selMode,
      exp0' = exp0,
      exp2' = exp2,
      exp4' = exp4,
      inGrid' = inGrid,
      kind' = kind,
      frow' = frow,
      fcol' = fcol,
      selMask' = if (controlled) v else selMask,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = if (controlled) bitSet(v, 0) else valueProp0,
      valueProp1' = if (controlled) bitSet(v, 1) else valueProp1,
      valueProp2' = if (controlled) bitSet(v, 2) else valueProp2,
      valueProp3' = if (controlled) bitSet(v, 3) else valueProp3,
      valueProp4' = if (controlled) bitSet(v, 4) else valueProp4,
      valueProp5' = if (controlled) bitSet(v, 5) else valueProp5,
      valueProp6' = if (controlled) bitSet(v, 6) else valueProp6,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips one row of its own copy of the selection
  action hostToggle = {
    nondet r = Set(0, 1, 2, 3, 4, 5, 6).oneOf()
    all {
      navModel' = navModel,
      selMode' = selMode,
      exp0' = exp0,
      exp2' = exp2,
      exp4' = exp4,
      inGrid' = inGrid,
      kind' = kind,
      frow' = frow,
      fcol' = fcol,
      selMask' = if (controlled) flipBit(propMask, r) else selMask,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = if (and(controlled, r == 0)) not(valueProp0) else valueProp0,
      valueProp1' = if (and(controlled, r == 1)) not(valueProp1) else valueProp1,
      valueProp2' = if (and(controlled, r == 2)) not(valueProp2) else valueProp2,
      valueProp3' = if (and(controlled, r == 3)) not(valueProp3) else valueProp3,
      valueProp4' = if (and(controlled, r == 4)) not(valueProp4) else valueProp4,
      valueProp5' = if (and(controlled, r == 5)) not(valueProp5) else valueProp5,
      valueProp6' = if (and(controlled, r == 6)) not(valueProp6) else valueProp6,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // configuration: the host starts owning the selection, adopting the current rows
  action control = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = frow,
    fcol' = fcol,
    selMask' = selMask,
    controlled' = true,
    accepting' = accepting,
    valueProp0' = bitSet(selMask, 0),
    valueProp1' = bitSet(selMask, 1),
    valueProp2' = bitSet(selMask, 2),
    valueProp3' = bitSet(selMask, 3),
    valueProp4' = bitSet(selMask, 4),
    valueProp5' = bitSet(selMask, 5),
    valueProp6' = bitSet(selMask, 6),
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    navModel' = navModel,
    selMode' = selMode,
    exp0' = exp0,
    exp2' = exp2,
    exp4' = exp4,
    inGrid' = inGrid,
    kind' = kind,
    frow' = frow,
    fcol' = fcol,
    selMask' = selMask,
    controlled' = controlled,
    accepting' = true,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    valueProp5' = valueProp5,
    valueProp6' = valueProp6,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, configureNav, configureSel, focusIn, blur,
    right, left, down, up, home, end, ctrlHome, ctrlEnd, enter,
    toggleRow, clickCell, toggleSelect, selectAll, extendDown, extendUp,
    setValue, hostToggle, control, acceptRequests
  }

  // ---- invariant helpers -----------------------------------------------------
  def childMirror(k: int): bool =
    parentOf(k) < 0 or not(visible(parentOf(k))) or visible(k) == isExp(parentOf(k))
  def rowContractOk(r: int): bool =
    ariaLevel(r) >= 1 and ariaLevel(r) <= 3
    and ariaPosInSet(r) >= 1 and ariaPosInSet(r) <= ariaSetSize(r)
    and ariaLevel(r) == (if (parentOf(r) < 0) 1 else ariaLevel(parentOf(r)) + 1)
    and (ariaExpandedOf(r) == "absent") == not(hasChildren(r))

  // ---- invariants ------------------------------------------------------------
  // the focused / tab-stop row is always rendered (never inside a collapsed subtree)
  val FocusedRowVisible: bool = visible(frow)
  // roving tabindex: exactly one rendered row-or-cell has tabindex=0
  val ExactlyOneTabStop: bool = tabStops == 1
  // the roving position stays inside the grid
  val PositionInRange: bool = frow >= 0 and frow < ROWS and fcol >= 0 and fcol < COLS
  // a focused row has no column
  val RowFocusHasNoColumn: bool = kind != "row" or fcol == 0
  // kind is one of the two modelled item types
  val KindKnown: bool = kind == "row" or kind == "cell"
  // cells-only models never focus a row
  val CellsOnlyNeverFocusesRow: bool = navModel != "cellsOnly" or kind == "cell"
  // top-level rows are always rendered
  val TopLevelAlwaysVisible: bool = visible(0) and visible(4)
  // aria-expanded mirrors child visibility: children of a rendered parent row are
  // rendered exactly when it is expanded
  val AriaExpandedMirrorsChildren: bool =
    childMirror(0) and childMirror(1) and childMirror(2) and childMirror(3)
    and childMirror(4) and childMirror(5) and childMirror(6)
  // level / setsize / posinset / aria-expanded are well-formed for every row
  val AriaContractWellFormed: bool =
    rowContractOk(0) and rowContractOk(1) and rowContractOk(2) and rowContractOk(3)
    and rowContractOk(4) and rowContractOk(5) and rowContractOk(6)
  // the selection bitmask stays inside the 7 rows
  val SelectionInRange: bool = selMask >= 0 and selMask < 128
  // single-select: aria-selected on at most one row, and it follows the focus
  // (uncontrolled: a controlled host owns the selection)
  val SingleSelectAtMostOne: bool =
    ariaSingleHoldsAtMostOne(controlled, selMode != "single", popcount(selMask))
  val SingleSelectFollowsFocus: bool =
    or(controlled, selMode != "single" or selMask == 0 or selMask == bit(frow))
  val SingleSelectedWhenFocused: bool =
    or(controlled, selMode != "single" or not(inGrid) or selMask == bit(frow))
  // models and variants are the modelled ones
  val ModesKnown: bool =
    (navModel == "rowsFirst" or navModel == "cellsFirst" or navModel == "cellsOnly")
    and ariaSelModeKnown(selMode)
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the selection, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), selMask == propMask)
  // a rejected request leaves the selection as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), selMask == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), selMask == requested)
}
