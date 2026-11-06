// The platform contract of `focusgroup="grid"` (V2): two-dimensional directional
// navigation over a rectangular, spanless body, and nothing else.
//
// NOT an APG pattern, and NOT the APG grid. The APG grid (`specs/apg/grid.qnt`)
// models a widget: one tab stop, the arrows, Home/End, Ctrl+Home/End,
// PageUp/PageDown, the data/layout kind, the wrap *choices*, a cell-vs-widget
// focus target, edit mode, `aria-rowindex`/`aria-colindex`. Everything in it that
// is about *moving focus between cells* is a web-platform feature the day a
// browser ships V2: this module is that feature's contract, so `grid.qnt` can
// import it and keep only its delta — edit, selection, spans, ragged rows,
// virtualisation, page-sized movement and the ARIA indices. The same split
// `shared/focusgroup.qnt` makes for the V1 linear behaviours (toolbar, tablist,
// listbox, menu, ...), for the other half of the same attribute.
//
// Source of truth: the Open UI focusgroup V2 explainer, "grid focusgroups",
// "grid wrapping and flow", "grid directional navigation", "Sequential entry,
// memory, and mutations" and "grid state and invalid structures" (pinned below).
// The token grammar is that explainer's plus the polyfill's README. Microsoft's
// implementation (MIT) was read for semantics only; nothing is copied and
// `@microsoft/focusgroup-polyfill` is not imported by our runtime.
//
// Provided (the contract, as state passed in and out):
//   - a bounded ROWS x COLS body, one cell per coordinate, addressed row-major
//     as `row * COLS + col` (INSIDE the module; the host passes coordinates in)
//   - exactly ONE tab stop, the current cell (`tabIndex`, `ExactlyOneTabStop`)
//   - inline commands move within the row, block commands preserve the column
//     (`inlineLand`, `blockLand`); Home / End are row start / row end, Ctrl+Home
//     / Ctrl+End are the first / last cell in row-major order (`edgeLand`)
//   - per-axis edges, resolved by the host from the token grammar: `none` (hard,
//     the default of a grid, which APG warns about in data grids), `wrap` (the
//     opposite end of the same row / column), `flow` (the adjacent row / column,
//     continuing from the last to the first at the outer edge)
//   - a hard edge STOPS: the target is the source, the operation is not
//     consumed and focus does not move (`outcome` = "blocked"); a wrap or flow
//     that resolves to the source is the same thing
//   - entry, memory and `focusgroupstart`: the stop is the focused cell while
//     focus is inside, the remembered cell after it leaves (memory), and the
//     `focusgroupstart` cell (or the first) when there is nothing to remember
//     (`stopOf`, `StopIsEntry`); `nomemory` disables only the restoration
//   - `grid` vs `grid manual`: topology only — automatic discovers rows from a
//     native table (or equivalently, the browser's `tr`/`td`), manual enrolls
//     direct-child rows through `focusgrouprow`. Neither changes a coordinate,
//     a command or the tab stop (`ManualDoesNotMove`)
//   - a modified command is ignored: Shift/Alt/Meta (and Ctrl+Meta) never move;
//     Ctrl+Home / Ctrl+End do. This module takes the key names as given, so the
//     `Control+` prefix means "the command modifier" in the model's eyes
//
// NOT provided, so still the widget's own (and `grid.qnt` keeps them):
//   - spans, ragged rows, gaps, indexed topology and virtualisation: the V2
//     initial model is rectangular and spanless, and an invalid body contributes
//     no behaviour at all (see "invalid" below); where the rows are mounted is
//     the host's virtualisation (`grid.qnt`'s window, `grid.ts`'s `rowWindow`)
//   - edit mode (Enter / F2 / Escape), selection (`aria-selected`), activation,
//     sort, and PageUp / PageDown — the explainer says a grid defines no page
//     movement, while the APG grid's data example does
//   - `itemcontrols` / `noitemcontrols`: a `grid` owner has `itemcontrols` by
//     default, and it is unsupported in the polyfill's `main` (PR #66), so a
//     cell's nested controls are not filtered and are not modelled here
//   - Tab / Shift+Tab inside the grid: HTML sequential navigation, not a spatial
//     relationship; the V1 escape rule moves between cell targets, and the grid
//     sees only the focusout/focusin pair
//   - `aria-rowindex` / `aria-colindex` / `aria-rowcount` / `aria-colcount` and
//     role inference (`grid`, `row`, `gridcell`): ARIA, not focus, and authored
//     ARIA never configures topology (the explainer's "Derive focus topology
//     from authored ARIA" is an alternative it rejected)
//   - key conflicts: a native key-conflict cell target (input, textarea, select,
//     contenteditable, iframe, object) keeps the command its native behaviour
//     claims. That is a property of an element, not of a coordinate, so the
//     runtime's guard and the browser test own it
//   - writing modes and RTL: the explainer resolves inline/block through the
//     owner's computed writing mode and direction; this module assumes
//     left-to-right, horizontal-tb (the same assumption as `shared/focusgroup`)
//   - the DOM: `document.activeElement`, the rendered `tabindex`, `preventDefault`
//     and `focus()`. `hasFocus` is the abstract bit; the runtime writes the
//     stop as `tabindex="0"` / `"-1"` and calls `preventDefault` only when the
//     destination takes focus (the explainer: "consumes the command only when
//     the destination receives focus")
//
// Pins (bump deliberately; the explainer is the only spec text):
//   explainer  open-ui focusgroup-v2.explainer, lastUpdated 2026-08-10
//   polyfill   microsoft/polyfills `main`: grid added in 53d8a15 (PR #64,
//              2026-09-29), `focusgroupstart` honoured in grids in f2584a5
//              (PR #78, 2026-10-23). NOT published: npm's latest is 1.6.0
//              (2026-07-30) and is read here — its `BehaviorToken` has no
//              `grid`, no `focusgrouprow`, no grid item collection, and Cls.
//              `FocusGroup` with a plain collection navigates `grid` LINEARLY
//              (its `items.navigate` is what makes a grid two-dimensional).
//              So V2 was written from the explainer, from our own spec, and the
//              day a browser or the polyfill ships it the attribute is the same.
//   upstream   the explainer pins `itemcontrols` out of scope (PR #66 open) and
//              the V2 grid as "explainer-level, can still change"
//   our runtime `packages/headless/src/focusgrid.ts` (this module is its oracle)
//
// Measurements this contract keeps: the polyfill's own grid uses `rowEdge`
// (rowwrap/rowflow) for the INLINE overflow and `colEdge` (colwrap/colflow) for
// the BLOCK overflow, and `wrap`/`flow` expand to both axes while `nowrap` (or a
// wrap+flow conflict on one axis) forces hard edges. Because a definition object
// here carries the RESOLVED per-axis edge, that ambiguous token grammar is the
// caller's parse, not this machine's: the attribute we emit is canonical
// (`rowwrap colwrap`, never `wrap`) and two of its states are deliberately not
// expressible (hard is "none", and there is no author error to resolve).
// Declared net-new, not measured against a shipped implementation: no engine
// exposes `focusGroup.supports("grid")` as of the pins above.
//
// Deliberate decisions where the explainer leaves room:
//   - `nomemory` changes nothing while focus is INSIDE: the stop is the active
//     coordinate there (the explainer's "same cell targets for directional
//     navigation, sequential entry, focusgroupstart and memory"), and changes
//     "do not move focus merely to repair state". It shows on the next leave.
//   - the coordinate survives a leave in both modes; memory decides whether the
//     STOP follows it (`stopOf`), so a returned-to grid with `nomemory` enters on
//     `focusgroupstart` while the last coordinate is still known.
//   - `set_start` re-seats the stop only when nothing is remembered (memory is
//     off, or no cell has been current yet), which is the explainer's entry
//     priority order read as a total function.
//   - a blocked command is "not consumed": the state does not change at all, and
//     `outcome` records that it was a grid command that resolved to its source.
//
// Events (host level): `focus_in` / `focus_out` (the abstract focus bit, as the
// browser's `focusin` / `focusout`), `click(cell)` (a pointer or script focus on
// one cell), `key(k)` (one of the command keys the runtime maps), and the host's
// props `set_memory`, `set_manual`, `set_row_edge`, `set_col_edge`, `set_start`.
// `outcome` reports what the last action did with focus: "none" (not a command),
// "moved", "blocked" (a command that resolved to its source) or "ignored" (a
// modified or unrelated key, or a key with focus outside).
//
// Generator gaps hit: no sets/lists/maps, so the cells are enumerated by hand in
// `tabStops` (change them with ROWS/COLS) and the key pool is one `Set` of
// strings; one nondet per action (cell index, key name, edge and flag pools are
// single pools); no guards, so every action assigns every var and an action that
// does not apply is a no-op branch; `def` rather than `val` for the constants,
// since a `val` int would be inlined into every invariant that reads it.
module patterns_focusgrid {
  var cur: int          // the current (and, with memory, remembered) cell; -1 = none yet
  var tabStop: int      // the cell that owns tabindex=0: the single sequential entry target
  var hasFocus: bool    // DOM focus is inside the grid
  var start: int        // the `focusgroupstart` cell, or the first
  var memory: bool      // the owner has no `nomemory`
  var manual: bool      // `grid manual`: rows come from `focusgrouprow`, not a native table
  var rowEdge: str      // inline edges: "none" (hard) | "wrap" | "flow"
  var colEdge: str      // block edges: "none" (hard) | "wrap" | "flow"
  var outcome: str      // the last action: "none" | "moved" | "blocked" | "ignored"
  var snapCur: int      // cur before the last action
  var snapStop: int     // tabStop before the last action
  var lastManual: bool  // the last action was a topology change

  def ROWS: int = 3
  def COLS: int = 4
  def CELLS: int = ROWS * COLS
  def LAST_ROW: int = ROWS - 1
  def LAST_COL: int = COLS - 1

  def rowOf(i: int): int = i / COLS
  def colOf(i: int): int = i % COLS
  def lineOf(r: int, c: int): int = r * COLS + c

  // --- keys ----------------------------------------------------------------
  def isInlineKey(k: str): bool = or(k == "ArrowRight", k == "ArrowLeft")
  def isBlockKey(k: str): bool = or(k == "ArrowDown", k == "ArrowUp")
  def isRowEdgeKey(k: str): bool = or(k == "Home", k == "End")
  def isGridEdgeKey(k: str): bool = or(k == "Control+Home", k == "Control+End")
  def isGridKey(k: str): bool =
    or(isInlineKey(k), or(isBlockKey(k), or(isRowEdgeKey(k), isGridEdgeKey(k))))
  def delta(k: str): int =
    if (or(k == "ArrowRight", k == "ArrowDown")) 1
    else if (or(k == "ArrowLeft", k == "ArrowUp")) -1
    else 0

  // --- movement (linear cell index; a blocked move returns the source) ------
  // inline overflow of the row: stop, wrap within the row, or flow into the
  // adjacent row (the column goes to the opposite end)
  def inlineLand(i: int, d: int, edge: str): int =
    if (and(colOf(i) + d >= 0, colOf(i) + d < COLS)) i + d
    else if (edge == "none") i
    else if (edge == "wrap") lineOf(rowOf(i), if (d > 0) 0 else LAST_COL)
    else lineOf(
      if (rowOf(i) + d < 0) LAST_ROW
      else if (rowOf(i) + d < ROWS) rowOf(i) + d
      else 0,
      if (d > 0) 0 else LAST_COL
    )

  // block overflow of the column: stop, wrap within the column, or flow into
  // the adjacent column (the row goes to the opposite end)
  def blockLand(i: int, d: int, edge: str): int =
    if (and(rowOf(i) + d >= 0, rowOf(i) + d < ROWS)) i + d * COLS
    else if (edge == "none") i
    else if (edge == "wrap") lineOf(if (d > 0) 0 else LAST_ROW, colOf(i))
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

  def land(k: str, i: int, re: str, ce: str): int =
    if (isInlineKey(k)) inlineLand(i, delta(k), re)
    else if (isBlockKey(k)) blockLand(i, delta(k), ce)
    else if (isRowEdgeKey(k)) edgeLand(i, k)
    else if (isGridEdgeKey(k)) edgeLand(i, k)
    else i

  // --- the tab stop --------------------------------------------------------
  // the focused cell while focus is inside; else the remembered cell (memory);
  // else the `focusgroupstart` cell, which is `start`
  def stopOf(focused: bool, mem: bool, c: int, st: int): int =
    if (focused) (if (c >= 0) c else st)
    else if (and(mem, c >= 0)) c
    else st

  def tabIndex(stop: int, i: int): int = if (stop == i) 0 else -1
  def tabStops(i: int): int = if (tabIndex(tabStop, i) == 0) 1 else 0

  def edgeKnown(e: str): bool = or(or(e == "none", e == "wrap"), e == "flow")

  action init = all {
    cur' = -1,
    tabStop' = 0,
    hasFocus' = false,
    start' = 0,
    memory' = true,
    manual' = false,
    rowEdge' = "none",
    colEdge' = "none",
    outcome' = "none",
    snapCur' = -1,
    snapStop' = 0,
    lastManual' = false
  }

  // focus enters (Tab lands on the entry target); inside it is a no-op
  action focus_in = all {
    cur' = if (hasFocus) cur else tabStop,
    tabStop' = tabStop,
    hasFocus' = true,
    start' = start,
    memory' = memory,
    manual' = manual,
    rowEdge' = rowEdge,
    colEdge' = colEdge,
    outcome' = "none",
    snapCur' = cur,
    snapStop' = tabStop,
    lastManual' = false
  }

  // focus leaves: the stop becomes the remembered cell, or the start without memory
  action focus_out = all {
    cur' = cur,
    tabStop' = stopOf(false, memory, cur, start),
    hasFocus' = false,
    start' = start,
    memory' = memory,
    manual' = manual,
    rowEdge' = rowEdge,
    colEdge' = colEdge,
    outcome' = "none",
    snapCur' = cur,
    snapStop' = tabStop,
    lastManual' = false
  }

  // a pointer or script focus on one cell: it becomes current and the stop
  action click = {
    nondet cell = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11).oneOf()
    all {
      cur' = cell,
      tabStop' = cell,
      hasFocus' = true,
      start' = start,
      memory' = memory,
      manual' = manual,
      rowEdge' = rowEdge,
      colEdge' = colEdge,
      outcome' = "none",
      snapCur' = cur,
      snapStop' = tabStop,
      lastManual' = false
    }
  }

  // one key while focus is inside: the landing depends on the key and the edges.
  // A key that is not a grid command, or a key with focus outside, is ignored; a
  // command whose landing is its source is blocked (and not consumed).
  action key = {
    nondet k = Set(
      "ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp",
      "Home", "End", "Control+Home", "Control+End",
      "Shift+ArrowRight", "Alt+Home", "Meta+ArrowDown"
    ).oneOf()
    all {
      cur' = if (and(hasFocus, isGridKey(k))) land(k, cur, rowEdge, colEdge) else cur,
      tabStop' = if (and(hasFocus, isGridKey(k))) land(k, cur, rowEdge, colEdge) else tabStop,
      hasFocus' = hasFocus,
      start' = start,
      memory' = memory,
      manual' = manual,
      rowEdge' = rowEdge,
      colEdge' = colEdge,
      outcome' =
        if (not(and(hasFocus, isGridKey(k)))) "ignored"
        else if (land(k, cur, rowEdge, colEdge) == cur) "blocked"
        else "moved",
      snapCur' = cur,
      snapStop' = tabStop,
      lastManual' = false
    }
  }

  action set_memory = {
    nondet on = Set(true, false).oneOf()
    all {
      cur' = cur,
      tabStop' = stopOf(hasFocus, on, cur, start),
      hasFocus' = hasFocus,
      start' = start,
      memory' = on,
      manual' = manual,
      rowEdge' = rowEdge,
      colEdge' = colEdge,
      outcome' = "none",
      snapCur' = cur,
      snapStop' = tabStop,
      lastManual' = false
    }
  }

  // topology is not movement: the coordinates and the stop stay put
  action set_manual = {
    nondet flag = Set(true, false).oneOf()
    all {
      cur' = cur,
      tabStop' = tabStop,
      hasFocus' = hasFocus,
      start' = start,
      memory' = memory,
      manual' = flag,
      rowEdge' = rowEdge,
      colEdge' = colEdge,
      outcome' = "none",
      snapCur' = cur,
      snapStop' = tabStop,
      lastManual' = true
    }
  }

  action set_row_edge = {
    nondet e = Set("none", "wrap", "flow").oneOf()
    all {
      cur' = cur,
      tabStop' = tabStop,
      hasFocus' = hasFocus,
      start' = start,
      memory' = memory,
      manual' = manual,
      rowEdge' = e,
      colEdge' = colEdge,
      outcome' = "none",
      snapCur' = cur,
      snapStop' = tabStop,
      lastManual' = false
    }
  }

  action set_col_edge = {
    nondet e = Set("none", "wrap", "flow").oneOf()
    all {
      cur' = cur,
      tabStop' = tabStop,
      hasFocus' = hasFocus,
      start' = start,
      memory' = memory,
      manual' = manual,
      rowEdge' = rowEdge,
      colEdge' = e,
      outcome' = "none",
      snapCur' = cur,
      snapStop' = tabStop,
      lastManual' = false
    }
  }

  // the `focusgroupstart` marker moved: the entry target follows it when nothing
  // is remembered (the explainer's priority order, as a total function)
  action set_start = {
    nondet i = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11).oneOf()
    all {
      cur' = cur,
      tabStop' = stopOf(hasFocus, memory, cur, i),
      hasFocus' = hasFocus,
      start' = i,
      memory' = memory,
      manual' = manual,
      rowEdge' = rowEdge,
      colEdge' = colEdge,
      outcome' = "none",
      snapCur' = cur,
      snapStop' = tabStop,
      lastManual' = false
    }
  }

  action step = any {
    init, focus_in, focus_out, click, key,
    set_memory, set_manual, set_row_edge, set_col_edge, set_start
  }

  // --- invariants ----------------------------------------------------------
  // the current cell is a cell, or "none yet"
  val CurInRange: bool = and(cur >= -1, cur < CELLS)
  val StopInRange: bool = and(tabStop >= 0, tabStop < CELLS)
  val StartInRange: bool = and(start >= 0, start < CELLS)
  // exactly one cell in the body is in the tab sequence, and it is the entry target
  val ExactlyOneTabStop: bool =
    tabStops(0) + tabStops(1) + tabStops(2) + tabStops(3) +
    tabStops(4) + tabStops(5) + tabStops(6) + tabStops(7) +
    tabStops(8) + tabStops(9) + tabStops(10) + tabStops(11) == 1
  // the stop is the focused cell, else the remembered one, else focusgroupstart
  val StopIsEntry: bool = tabStop == stopOf(hasFocus, memory, cur, start)
  // focus is on a cell, so a coordinate exists
  val FocusImpliesCurrent: bool = or(not(hasFocus), cur >= 0)
  val EdgesKnown: bool = and(edgeKnown(rowEdge), edgeKnown(colEdge))
  val OutcomeKnown: bool =
    or(or(outcome == "none", outcome == "moved"), or(outcome == "blocked", outcome == "ignored"))
  // a command can only move focus that is inside the grid
  val MovedImpliesFocus: bool = or(outcome != "moved", hasFocus)
  // an ignored key leaves the coordinate alone
  val IgnoredKeepsFocus: bool = or(outcome != "ignored", cur == snapCur)
  // a blocked command is not consumed and does not move
  val BlockedKeepsFocus: bool = or(outcome != "blocked", cur == snapCur)
  // a "moved" outcome is a real move: a landing on the source is "blocked"
  val MovedChangesFocus: bool = or(outcome != "moved", cur != snapCur)
  // changing the topology moves neither the coordinate nor the tab stop
  val ManualDoesNotMove: bool = or(not(lastManual), and(cur == snapCur, tabStop == snapStop))
  val SnapshotsInRange: bool =
    and(and(snapCur >= -1, snapCur < CELLS), and(snapStop >= 0, snapStop < CELLS))
}
