// Workspace: tabs and tabsets in one window (bean cssints-2v5r).
//
// Not an APG pattern: a workspace is a *layout of* APG tab lists, so the
// vocabulary for one tabset is `specs/apg/tabs.qnt` (the active tab, the roving
// tab stop, one tab per panel) and this spec models only the delta: which
// tabset a tab lives in, how a drop regroups the window, and what a tabset that
// runs out of tabs does. Researched for the decisions below:
//   - flexlayout-react 0.10 (`Model.fromJson` / `toJson`): the layout is a tree
//     of `row` / `tabset` / `tab` nodes, a tabset carries `selected` (the index
//     of its visible tab, -1 when none), and `enableDeleteWhenEmpty` (default
//     true) DELETES a tabset when its last tab is removed; `tabSetEnableClose`
//     defaults to true and a tabset that is kept empty shows a placeholder.
//     `subLayouts` describes popout and floating layouts, and `popouts` is
//     deprecated in favour of it. Settled: a tabset that loses its last tab
//     disappears, and `keepWhenEmpty` is the opt-out; the tab's home is one
//     container, never two.
//   - dockview (`SerializedDockview`): `grid { root, width, height, orientation }`
//     plus a `panels` map, an `activeGroup`, `floatingGroups` with a `position`
//     (`AnchoredBox`), and `popoutGroups`; `floatPanel` / `addFloatingGroup`
//     relocate a panel into a floating group, floating groups cannot be
//     maximized, and their box is clamped into the viewport. Settled: HOME is a
//     container id, a drop names its target as data, and the floating container
//     is one more home, not a nested layout.
//   - VS Code editor groups / `workbench.editor.closeEmptyGroups` (default
//     true): an empty editor group is closed unless it is the only one, and
//     dragging an editor between groups does not create a second copy of it.
//     Copying is its own command and names its group (`Copy Editor into Next
//     Group`, `... into Group 2`), so a duplicate is never "put it over there"
//     but always "put it here". Settled: the default is "an empty tabset goes
//     away", the policy is the host's flag, a move is destructive (a copy is the
//     one operation that keeps the source), and a copy names its destination.
//   - flexlayout-react and dockview both add a tab to a group you name (a
//     location, a group id) and neither has a "duplicate next to the original"
//     verb. Settled: a copy names its destination like a move does, so a host
//     that duplicates into the group the pointer named needs no second step.
//   - react-resizable-panels 4.22 deprecated tear-off. The platform reports no
//     reliable release position for a drag that ends outside the window, so a
//     tab cannot be dropped where the model would never see it. Settled: no
//     tear-off and no popout window here; a tab LEAVES the window as a
//     serialisable value (`home = "out"`) and the transport is the host's.
//   - HTML drag and drop: `dragenter` / `dragover` / `drop` / `dragend` carry no
//     target model, so the geometry -> target mapping (which tabset edge a
//     pointer is over) is host code. Settled: the model TAKES the target
//     (`target` is a var holding `"tab0" | "tab1" | "tabF" | "edge-*" |
//     "float"`), it never computes it from pixels. Same precedent as
//     `patterns/resizable-panels.qnt`.
//
// MODELLED: the fixed instance the tests run. Four tabs (0..3), two tabsets in
// one row split (0 left, 1 right), one floating tabset (it starts hidden; a drop
// on the background shows it), one edge tabset that an edge drop creates, and the
// two ways a tab can be out of a container: `out` (detached, serialisable, may
// come back) and `closed` (gone). Closure is sticky because no action assigns a
// home to a closed tab: a closed tab cannot be picked, and every rehome leaves
// the tabs it does not move where they were. TARGETS: `tab0` and `tab1` are the
// docked containers, `tabF` the floating one, `edge-*` the edge one, `float` the
// background (a drop there creates/shows the floating tabset), `out` / `closed`
// the two exits. A tab is an id; its payload is opaque host data and never
// reaches the model.
//
// A DROP is a request with a target. The model applies it if it changes
// anything: the tab lands in the target's container, that container's active
// tab becomes the arriving tab, the container it left re-selects its first
// remaining tab (or reports none), and a container that lost its last tab stops
// existing unless `keepWhenEmpty`. A drop the model REFUSES (no tab in hand, a
// tab that is out of the window, a drop on the container the tab is already in,
// docking when nothing floats, attaching when nothing is out, collapsing a
// tabset that is not there) changes nothing and reports `reason = "none"`: the
// pointer keeps its tab, so the interaction can continue. `reason` names what
// landed — `move`, `copy`, `transfer`, `collapse`, `float`, `dock`, `close` —
// and `collapse` covers both directions of the flag (the vocabulary has no
// separate "expand"). A transfer is the one drop that keeps the tab in hand:
// the host is carrying it to the other window, so the tab stays named until
// `attach` lands it back in this one.
//
// A COPY is a drop that duplicates instead of moving, so it names its
// destination exactly as a move does (`copyTo`, one of the drop targets) and is
// refused on the same terms: no tab in hand, a tab that is out of the window, or
// the container the tab is already in. What lands is `reason = "copy"`, a
// `copies` count and the destination that was asked for.
//
// REQUEST VS COMMIT does not apply as a controlled value: a workspace layout is
// the primitive's own (the host persists it, it does not own it per render), so
// there is no `controlled` / `accepting` pair and no layout prop to write back.
// What is a request is every drop, and the refusal above is the veto: the
// layout is untouched and `reason = "none"`. A host that restores a persisted
// workspace writes it by replaying the same transitions.
//
// NOT MODELLED:
//   - Geometry and the pointer: no pixels, no drag threshold, no drop indicator,
//     no reorder *within* a tabset (a drop on the tab's own tabset is a no-op,
//     not a move to index k). The host maps a position to `target`.
//   - The copied tab of a `copy` drop: a duplicate needs a tab id this instance
//     has no room for, so the model records that the copy happened (`copies`),
//     where it was asked to go (`copyTo`) and proves the source did not move.
//     The new tab, its id, its selection and the existence of a container the
//     duplicate alone would create are the host's: a copy into the floating or
//     the edge tabset is recorded without turning that container on here.
//   - The tab payload (`data`, a component, a title): opaque, and the reason a
//     config key carries it through `checkUnknownConfigKey`.
//   - Window positions and sizes of the floating tabset, tabset weights, split
//     ratios, nesting a group inside a pane (react-resizable-panels' workspace
//     example), drag between two windows, tear-off, popout windows, and
//     `keepWhenEmpty` being switched at run time (the flag is set at mount).
//   - Tabset close buttons, maximize, borders, tab overflow and scrolling,
//     keyboard tab navigation *between* tabsets, and undo.
//
// GENERATOR GAPS HIT: no collections and no parameterized actions, so the four
// tabs and four containers are vars and one action per target; every action
// assigns every var; no `let` / `const`, so each helper is a `def` over the vars;
// `size`-like builtin names are rejected; `nondet` is the one parameter a
// parameterless action can take, so a copy's destination is a `nondet dest` over
// the target set. The copy is the one operation whose effect on the tab list is
// out of the instance's reach (see NOT MODELLED), so it is observable only
// through `copies` and `copyTo`.
module patterns_workspace {
  var where0: int // home of tab 0: 0 tabset 0 | 1 tabset 1 | 2 floating | 3 edge | 4 out | 5 closed
  var where1: int // tab 1
  var where2: int // tab 2
  var where3: int // tab 3
  var active0: int // the active tab of tabset 0 (-1 = none: empty or absent)
  var active1: int // tabset 1
  var activeF: int // the floating tabset
  var activeE: int // the edge tabset (created by an edge drop)
  var exists0: bool // tabset 0 is in the row (it may be empty only while keepEmpty)
  var exists1: bool // tabset 1
  var floatOn: bool // the floating tabset exists (floating is its own container, not a row child)
  var side: str // the edge tabset's edge: "none" (absent) | "left" | "right" | "top" | "bottom"
  var collapsed0: bool // tabset 0 is collapsed (an icon strip; it keeps its tabs)
  var collapsed1: bool
  var keepEmpty: bool // the host policy: an empty tabset stays (`keepWhenEmpty`)
  var drag: int // the tab in hand (-1 = none), or the tab a close / copy / transfer names
  var target: str // the drop target of the last drop, as data: "none" | "tab0" | "tab1" | "tabF" | "edge-*" | "float"
  var reason: str // what the last event did: "move" | "copy" | "transfer" | "collapse" | "float" | "dock" | "close" | "none"
  var copies: int // copies the host made: a duplicated tab is an id this instance cannot name
  var copyTo: str // where the last landed copy was asked to put the duplicate: "none" or a drop target
  var bW0: int // home of tab 0 before the last event (what it changed is the report)
  var bW1: int
  var bW2: int
  var bW3: int

  def NONE: int = 0 - 1
  def TS0: int = 0
  def TS1: int = 1
  def TF: int = 2
  def TE: int = 3
  def OUT: int = 4
  def CLOSED: int = 5

  // the instance's float position: no modelled event carries one (see NOT MODELLED)
  def FPX: int = 240
  def FPY: int = 60

  // --- the homes ----------------------------------------------------------
  def homeOf(i: int): int =
    if (i == 0) where0
    else if (i == 1) where1
    else if (i == 2) where2
    else if (i == 3) where3
    else CLOSED

  def inWindow(h: int): bool =
    or(h == TS0, or(h == TS1, or(h == TF, h == TE)))

  def homeExists(h: int): bool =
    if (h == TS0) exists0
    else if (h == TS1) exists1
    else if (h == TF) floatOn
    else if (h == TE) side != "none"
    else true

  def pickedOk: bool = and(drag >= 0, drag <= 3)
  def pickedHome: int = homeOf(drag)
  def pickedInWindow: bool = and(pickedOk, inWindow(pickedHome))

  def countIn(h: int): int =
    (if (where0 == h) 1 else 0) +
    (if (where1 == h) 1 else 0) +
    (if (where2 == h) 1 else 0) +
    (if (where3 == h) 1 else 0)

  def firstIn(h: int): int =
    if (where0 == h) 0
    else if (where1 == h) 1
    else if (where2 == h) 2
    else if (where3 == h) 3
    else NONE

  // --- a drop: the target as data, the landing state behind it --------------
  def destOf(t: str): int =
    if (t == "tab0") TS0
    else if (t == "tab1") TS1
    else if (t == "tabF") TF
    else if (t == "float") TF
    else if (t == "edge-left") TE
    else if (t == "edge-right") TE
    else if (t == "edge-top") TE
    else if (t == "edge-bottom") TE
    else if (t == "closed") CLOSED
    else if (t == "out") OUT
    else NONE

  // where tab i would be after a drop whose target is t
  def wPost(i: int, t: str): int = if (and(pickedOk, i == drag)) destOf(t) else homeOf(i)
  def countAt(h: int, t: str): int =
    (if (wPost(0, t) == h) 1 else 0) +
    (if (wPost(1, t) == h) 1 else 0) +
    (if (wPost(2, t) == h) 1 else 0) +
    (if (wPost(3, t) == h) 1 else 0)
  def firstAt(h: int, t: str): int =
    if (wPost(0, t) == h) 0
    else if (wPost(1, t) == h) 1
    else if (wPost(2, t) == h) 2
    else if (wPost(3, t) == h) 3
    else NONE

  def activeAt(h: int, t: str, cur: int): int =
    if (destOf(t) == h)
      (if (countAt(h, t) > 0) drag else NONE)
    else if (countAt(h, t) == 0) NONE
    else if (wPost(cur, t) == h) cur
    else firstAt(h, t)

  def existsAt(h: int, t: str, was: bool): bool =
    if (countAt(h, t) > 0) true
    else if (keepEmpty) was
    else false

  // the drop changes the layout: a tab is in hand and the target is another container
  def moves(t: str): bool = and(pickedInWindow, destOf(t) != pickedHome)

  // a copy names its destination like a drop does, and lands on the same terms
  def copyLands(t: str): bool = and(pickedInWindow, destOf(t) != pickedHome)

  // the other window hands a tab back: only a tab that is out can be attached
  def attachOk: bool = and(pickedOk, pickedHome == OUT)

  // the edge tabset keeps its side while it exists; the drop that creates it names one
  def sideNext(t: str, edge: str): str =
    if (existsAt(TE, t, side != "none"))
      (if (and(destOf(t) == TE, side == "none")) edge else side)
    else "none"

  // --- docking the floating tabset ----------------------------------------
  def dockedWhere(i: int): int = if (homeOf(i) == TF) TS1 else homeOf(i)
  def dockCount1: int =
    (if (dockedWhere(0) == TS1) 1 else 0) +
    (if (dockedWhere(1) == TS1) 1 else 0) +
    (if (dockedWhere(2) == TS1) 1 else 0) +
    (if (dockedWhere(3) == TS1) 1 else 0)
  def dockFirst1: int =
    if (dockedWhere(0) == TS1) 0
    else if (dockedWhere(1) == TS1) 1
    else if (dockedWhere(2) == TS1) 2
    else if (dockedWhere(3) == TS1) 3
    else NONE
  def dockActive1(cur: int): int =
    if (dockedWhere(cur) == TS1) cur else dockFirst1
  def dockExists1: bool =
    if (dockCount1 > 0) true else (if (keepEmpty) exists1 else false)
  def dockChanges: bool = or(floatOn, countIn(TF) > 0)

  // --- collapse -----------------------------------------------------------
  def collapse0Changes: bool = or(exists0, collapsed0)
  def collapse0Next: bool = if (exists0) not(collapsed0) else false
  def collapse1Changes: bool = or(exists1, collapsed1)
  def collapse1Next: bool = if (exists1) not(collapsed1) else false

  // --- the report ---------------------------------------------------------
  def changedCount: int =
    (if (where0 != bW0) 1 else 0) +
    (if (where1 != bW1) 1 else 0) +
    (if (where2 != bW2) 1 else 0) +
    (if (where3 != bW3) 1 else 0)

  action init = all {
    where0' = TS0,
    where1' = TS0,
    where2' = TS1,
    where3' = TS1,
    active0' = 0,
    active1' = 2,
    activeF' = NONE,
    activeE' = NONE,
    exists0' = true,
    exists1' = true,
    floatOn' = false,
    side' = "none",
    collapsed0' = false,
    collapsed1' = false,
    keepEmpty' = false,
    drag' = NONE,
    target' = "none",
    reason' = "none",
    copies' = 0,
    copyTo' = "none",
    bW0' = TS0,
    bW1' = TS0,
    bW2' = TS1,
    bW3' = TS1
  }

  // the host policy arrives at mount (`keepWhenEmpty`); a treated tabset is not restored
  action keepOn = all {
    where0' = where0,
    where1' = where1,
    where2' = where2,
    where3' = where3,
    active0' = active0,
    active1' = active1,
    activeF' = activeF,
    activeE' = activeE,
    exists0' = exists0,
    exists1' = exists1,
    floatOn' = floatOn,
    side' = side,
    collapsed0' = collapsed0,
    collapsed1' = collapsed1,
    keepEmpty' = true,
    drag' = drag,
    target' = target,
    reason' = "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action pick0 = all {
    where0' = where0,
    where1' = where1,
    where2' = where2,
    where3' = where3,
    active0' = active0,
    active1' = active1,
    activeF' = activeF,
    activeE' = activeE,
    exists0' = exists0,
    exists1' = exists1,
    floatOn' = floatOn,
    side' = side,
    collapsed0' = collapsed0,
    collapsed1' = collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (inWindow(where0)) 0 else drag,
    target' = "none",
    reason' = "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action pick1 = all {
    where0' = where0,
    where1' = where1,
    where2' = where2,
    where3' = where3,
    active0' = active0,
    active1' = active1,
    activeF' = activeF,
    activeE' = activeE,
    exists0' = exists0,
    exists1' = exists1,
    floatOn' = floatOn,
    side' = side,
    collapsed0' = collapsed0,
    collapsed1' = collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (inWindow(where1)) 1 else drag,
    target' = "none",
    reason' = "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action pick2 = all {
    where0' = where0,
    where1' = where1,
    where2' = where2,
    where3' = where3,
    active0' = active0,
    active1' = active1,
    activeF' = activeF,
    activeE' = activeE,
    exists0' = exists0,
    exists1' = exists1,
    floatOn' = floatOn,
    side' = side,
    collapsed0' = collapsed0,
    collapsed1' = collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (inWindow(where2)) 2 else drag,
    target' = "none",
    reason' = "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action pick3 = all {
    where0' = where0,
    where1' = where1,
    where2' = where2,
    where3' = where3,
    active0' = active0,
    active1' = active1,
    activeF' = activeF,
    activeE' = activeE,
    exists0' = exists0,
    exists1' = exists1,
    floatOn' = floatOn,
    side' = side,
    collapsed0' = collapsed0,
    collapsed1' = collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (inWindow(where3)) 3 else drag,
    target' = "none",
    reason' = "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action cancel = all {
    where0' = where0,
    where1' = where1,
    where2' = where2,
    where3' = where3,
    active0' = active0,
    active1' = active1,
    activeF' = activeF,
    activeE' = activeE,
    exists0' = exists0,
    exists1' = exists1,
    floatOn' = floatOn,
    side' = side,
    collapsed0' = collapsed0,
    collapsed1' = collapsed1,
    keepEmpty' = keepEmpty,
    drag' = NONE,
    target' = "none",
    reason' = "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action dropTab0 = all {
    where0' = if (moves("tab0")) wPost(0, "tab0") else where0,
    where1' = if (moves("tab0")) wPost(1, "tab0") else where1,
    where2' = if (moves("tab0")) wPost(2, "tab0") else where2,
    where3' = if (moves("tab0")) wPost(3, "tab0") else where3,
    active0' = if (moves("tab0")) activeAt(TS0, "tab0", active0) else active0,
    active1' = if (moves("tab0")) activeAt(TS1, "tab0", active1) else active1,
    activeF' = if (moves("tab0")) activeAt(TF, "tab0", activeF) else activeF,
    activeE' = if (moves("tab0")) activeAt(TE, "tab0", activeE) else activeE,
    exists0' = if (moves("tab0")) existsAt(TS0, "tab0", exists0) else exists0,
    exists1' = if (moves("tab0")) existsAt(TS1, "tab0", exists1) else exists1,
    floatOn' = if (moves("tab0")) existsAt(TF, "tab0", floatOn) else floatOn,
    side' = if (moves("tab0")) sideNext("tab0", "none") else side,
    collapsed0' = if (moves("tab0")) (if (existsAt(TS0, "tab0", exists0)) collapsed0 else false) else collapsed0,
    collapsed1' = if (moves("tab0")) (if (existsAt(TS1, "tab0", exists1)) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (moves("tab0")) NONE else drag,
    target' = if (moves("tab0")) "tab0" else target,
    reason' = if (moves("tab0")) "move" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action dropTab1 = all {
    where0' = if (moves("tab1")) wPost(0, "tab1") else where0,
    where1' = if (moves("tab1")) wPost(1, "tab1") else where1,
    where2' = if (moves("tab1")) wPost(2, "tab1") else where2,
    where3' = if (moves("tab1")) wPost(3, "tab1") else where3,
    active0' = if (moves("tab1")) activeAt(TS0, "tab1", active0) else active0,
    active1' = if (moves("tab1")) activeAt(TS1, "tab1", active1) else active1,
    activeF' = if (moves("tab1")) activeAt(TF, "tab1", activeF) else activeF,
    activeE' = if (moves("tab1")) activeAt(TE, "tab1", activeE) else activeE,
    exists0' = if (moves("tab1")) existsAt(TS0, "tab1", exists0) else exists0,
    exists1' = if (moves("tab1")) existsAt(TS1, "tab1", exists1) else exists1,
    floatOn' = if (moves("tab1")) existsAt(TF, "tab1", floatOn) else floatOn,
    side' = if (moves("tab1")) sideNext("tab1", "none") else side,
    collapsed0' = if (moves("tab1")) (if (existsAt(TS0, "tab1", exists0)) collapsed0 else false) else collapsed0,
    collapsed1' = if (moves("tab1")) (if (existsAt(TS1, "tab1", exists1)) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (moves("tab1")) NONE else drag,
    target' = if (moves("tab1")) "tab1" else target,
    reason' = if (moves("tab1")) "move" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action dropTabF = all {
    where0' = if (moves("tabF")) wPost(0, "tabF") else where0,
    where1' = if (moves("tabF")) wPost(1, "tabF") else where1,
    where2' = if (moves("tabF")) wPost(2, "tabF") else where2,
    where3' = if (moves("tabF")) wPost(3, "tabF") else where3,
    active0' = if (moves("tabF")) activeAt(TS0, "tabF", active0) else active0,
    active1' = if (moves("tabF")) activeAt(TS1, "tabF", active1) else active1,
    activeF' = if (moves("tabF")) activeAt(TF, "tabF", activeF) else activeF,
    activeE' = if (moves("tabF")) activeAt(TE, "tabF", activeE) else activeE,
    exists0' = if (moves("tabF")) existsAt(TS0, "tabF", exists0) else exists0,
    exists1' = if (moves("tabF")) existsAt(TS1, "tabF", exists1) else exists1,
    floatOn' = if (moves("tabF")) existsAt(TF, "tabF", floatOn) else floatOn,
    side' = if (moves("tabF")) sideNext("tabF", "none") else side,
    collapsed0' = if (moves("tabF")) (if (existsAt(TS0, "tabF", exists0)) collapsed0 else false) else collapsed0,
    collapsed1' = if (moves("tabF")) (if (existsAt(TS1, "tabF", exists1)) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (moves("tabF")) NONE else drag,
    target' = if (moves("tabF")) "tabF" else target,
    reason' = if (moves("tabF")) "move" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action dropEdgeLeft = all {
    where0' = if (moves("edge-left")) wPost(0, "edge-left") else where0,
    where1' = if (moves("edge-left")) wPost(1, "edge-left") else where1,
    where2' = if (moves("edge-left")) wPost(2, "edge-left") else where2,
    where3' = if (moves("edge-left")) wPost(3, "edge-left") else where3,
    active0' = if (moves("edge-left")) activeAt(TS0, "edge-left", active0) else active0,
    active1' = if (moves("edge-left")) activeAt(TS1, "edge-left", active1) else active1,
    activeF' = if (moves("edge-left")) activeAt(TF, "edge-left", activeF) else activeF,
    activeE' = if (moves("edge-left")) activeAt(TE, "edge-left", activeE) else activeE,
    exists0' = if (moves("edge-left")) existsAt(TS0, "edge-left", exists0) else exists0,
    exists1' = if (moves("edge-left")) existsAt(TS1, "edge-left", exists1) else exists1,
    floatOn' = if (moves("edge-left")) existsAt(TF, "edge-left", floatOn) else floatOn,
    side' = if (moves("edge-left")) sideNext("edge-left", "left") else side,
    collapsed0' = if (moves("edge-left")) (if (existsAt(TS0, "edge-left", exists0)) collapsed0 else false) else collapsed0,
    collapsed1' = if (moves("edge-left")) (if (existsAt(TS1, "edge-left", exists1)) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (moves("edge-left")) NONE else drag,
    target' = if (moves("edge-left")) "edge-left" else target,
    reason' = if (moves("edge-left")) "move" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action dropEdgeRight = all {
    where0' = if (moves("edge-right")) wPost(0, "edge-right") else where0,
    where1' = if (moves("edge-right")) wPost(1, "edge-right") else where1,
    where2' = if (moves("edge-right")) wPost(2, "edge-right") else where2,
    where3' = if (moves("edge-right")) wPost(3, "edge-right") else where3,
    active0' = if (moves("edge-right")) activeAt(TS0, "edge-right", active0) else active0,
    active1' = if (moves("edge-right")) activeAt(TS1, "edge-right", active1) else active1,
    activeF' = if (moves("edge-right")) activeAt(TF, "edge-right", activeF) else activeF,
    activeE' = if (moves("edge-right")) activeAt(TE, "edge-right", activeE) else activeE,
    exists0' = if (moves("edge-right")) existsAt(TS0, "edge-right", exists0) else exists0,
    exists1' = if (moves("edge-right")) existsAt(TS1, "edge-right", exists1) else exists1,
    floatOn' = if (moves("edge-right")) existsAt(TF, "edge-right", floatOn) else floatOn,
    side' = if (moves("edge-right")) sideNext("edge-right", "right") else side,
    collapsed0' = if (moves("edge-right")) (if (existsAt(TS0, "edge-right", exists0)) collapsed0 else false) else collapsed0,
    collapsed1' = if (moves("edge-right")) (if (existsAt(TS1, "edge-right", exists1)) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (moves("edge-right")) NONE else drag,
    target' = if (moves("edge-right")) "edge-right" else target,
    reason' = if (moves("edge-right")) "move" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action dropEdgeTop = all {
    where0' = if (moves("edge-top")) wPost(0, "edge-top") else where0,
    where1' = if (moves("edge-top")) wPost(1, "edge-top") else where1,
    where2' = if (moves("edge-top")) wPost(2, "edge-top") else where2,
    where3' = if (moves("edge-top")) wPost(3, "edge-top") else where3,
    active0' = if (moves("edge-top")) activeAt(TS0, "edge-top", active0) else active0,
    active1' = if (moves("edge-top")) activeAt(TS1, "edge-top", active1) else active1,
    activeF' = if (moves("edge-top")) activeAt(TF, "edge-top", activeF) else activeF,
    activeE' = if (moves("edge-top")) activeAt(TE, "edge-top", activeE) else activeE,
    exists0' = if (moves("edge-top")) existsAt(TS0, "edge-top", exists0) else exists0,
    exists1' = if (moves("edge-top")) existsAt(TS1, "edge-top", exists1) else exists1,
    floatOn' = if (moves("edge-top")) existsAt(TF, "edge-top", floatOn) else floatOn,
    side' = if (moves("edge-top")) sideNext("edge-top", "top") else side,
    collapsed0' = if (moves("edge-top")) (if (existsAt(TS0, "edge-top", exists0)) collapsed0 else false) else collapsed0,
    collapsed1' = if (moves("edge-top")) (if (existsAt(TS1, "edge-top", exists1)) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (moves("edge-top")) NONE else drag,
    target' = if (moves("edge-top")) "edge-top" else target,
    reason' = if (moves("edge-top")) "move" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action dropEdgeBottom = all {
    where0' = if (moves("edge-bottom")) wPost(0, "edge-bottom") else where0,
    where1' = if (moves("edge-bottom")) wPost(1, "edge-bottom") else where1,
    where2' = if (moves("edge-bottom")) wPost(2, "edge-bottom") else where2,
    where3' = if (moves("edge-bottom")) wPost(3, "edge-bottom") else where3,
    active0' = if (moves("edge-bottom")) activeAt(TS0, "edge-bottom", active0) else active0,
    active1' = if (moves("edge-bottom")) activeAt(TS1, "edge-bottom", active1) else active1,
    activeF' = if (moves("edge-bottom")) activeAt(TF, "edge-bottom", activeF) else activeF,
    activeE' = if (moves("edge-bottom")) activeAt(TE, "edge-bottom", activeE) else activeE,
    exists0' = if (moves("edge-bottom")) existsAt(TS0, "edge-bottom", exists0) else exists0,
    exists1' = if (moves("edge-bottom")) existsAt(TS1, "edge-bottom", exists1) else exists1,
    floatOn' = if (moves("edge-bottom")) existsAt(TF, "edge-bottom", floatOn) else floatOn,
    side' = if (moves("edge-bottom")) sideNext("edge-bottom", "bottom") else side,
    collapsed0' = if (moves("edge-bottom")) (if (existsAt(TS0, "edge-bottom", exists0)) collapsed0 else false) else collapsed0,
    collapsed1' = if (moves("edge-bottom")) (if (existsAt(TS1, "edge-bottom", exists1)) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (moves("edge-bottom")) NONE else drag,
    target' = if (moves("edge-bottom")) "edge-bottom" else target,
    reason' = if (moves("edge-bottom")) "move" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  // drop on the background: the tab joins the floating tabset, which opens
  action dropFloat = all {
    where0' = if (moves("float")) wPost(0, "float") else where0,
    where1' = if (moves("float")) wPost(1, "float") else where1,
    where2' = if (moves("float")) wPost(2, "float") else where2,
    where3' = if (moves("float")) wPost(3, "float") else where3,
    active0' = if (moves("float")) activeAt(TS0, "float", active0) else active0,
    active1' = if (moves("float")) activeAt(TS1, "float", active1) else active1,
    activeF' = if (moves("float")) activeAt(TF, "float", activeF) else activeF,
    activeE' = if (moves("float")) activeAt(TE, "float", activeE) else activeE,
    exists0' = if (moves("float")) existsAt(TS0, "float", exists0) else exists0,
    exists1' = if (moves("float")) existsAt(TS1, "float", exists1) else exists1,
    floatOn' = if (moves("float")) existsAt(TF, "float", floatOn) else floatOn,
    side' = if (moves("float")) sideNext("float", "none") else side,
    collapsed0' = if (moves("float")) (if (existsAt(TS0, "float", exists0)) collapsed0 else false) else collapsed0,
    collapsed1' = if (moves("float")) (if (existsAt(TS1, "float", exists1)) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (moves("float")) NONE else drag,
    target' = if (moves("float")) "float" else target,
    reason' = if (moves("float")) "float" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  // the host docks the floating tabset back into the row (tabset 1 is the instance's dock target)
  action dockFloat = all {
    where0' = if (dockChanges) dockedWhere(0) else where0,
    where1' = if (dockChanges) dockedWhere(1) else where1,
    where2' = if (dockChanges) dockedWhere(2) else where2,
    where3' = if (dockChanges) dockedWhere(3) else where3,
    active0' = active0,
    active1' = if (dockChanges) dockActive1(active1) else active1,
    activeF' = if (dockChanges) NONE else activeF,
    activeE' = activeE,
    exists0' = if (dockChanges) (if (countIn(TS0) > 0) true else (if (keepEmpty) exists0 else false)) else exists0,
    exists1' = if (dockChanges) dockExists1 else exists1,
    floatOn' = if (dockChanges) false else floatOn,
    side' = side,
    collapsed0' = if (dockChanges) (if (countIn(TS0) > 0) collapsed0 else false) else collapsed0,
    collapsed1' = if (dockChanges) (if (dockExists1) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = drag,
    target' = if (dockChanges) "tab1" else target,
    reason' = if (dockChanges) "dock" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  // a copy drop names its destination the way a move does: the host duplicates
  // the tab into that container. The duplicate is an id this instance has no room
  // for (see NOT MODELLED), so a landed copy leaves every home where it was and
  // records where the host was asked to put the duplicate. A copy with no tab in
  // hand, of a tab that is out of the window, or onto the container the tab is
  // already in is REFUSED, exactly like a drop.
  action copyTab = {
    nondet dest = Set(
      "tab0", "tab1", "tabF", "edge-left", "edge-right", "edge-top", "edge-bottom", "float"
    ).oneOf()
    all {
      where0' = where0,
      where1' = where1,
      where2' = where2,
      where3' = where3,
      active0' = active0,
      active1' = active1,
      activeF' = activeF,
      activeE' = activeE,
      exists0' = exists0,
      exists1' = exists1,
      floatOn' = floatOn,
      side' = side,
      collapsed0' = collapsed0,
      collapsed1' = collapsed1,
      keepEmpty' = keepEmpty,
      drag' = if (copyLands(dest)) NONE else drag,
      target' = if (copyLands(dest)) dest else target,
      reason' = if (copyLands(dest)) "copy" else "none",
      copies' = if (copyLands(dest)) copies + 1 else copies,
      copyTo' = if (copyLands(dest)) dest else copyTo,
      bW0' = where0,
      bW1' = where1,
      bW2' = where2,
      bW3' = where3
    }
  }

  action closeTab = all {
    where0' = if (moves("closed")) wPost(0, "closed") else where0,
    where1' = if (moves("closed")) wPost(1, "closed") else where1,
    where2' = if (moves("closed")) wPost(2, "closed") else where2,
    where3' = if (moves("closed")) wPost(3, "closed") else where3,
    active0' = if (moves("closed")) activeAt(TS0, "closed", active0) else active0,
    active1' = if (moves("closed")) activeAt(TS1, "closed", active1) else active1,
    activeF' = if (moves("closed")) activeAt(TF, "closed", activeF) else activeF,
    activeE' = if (moves("closed")) activeAt(TE, "closed", activeE) else activeE,
    exists0' = if (moves("closed")) existsAt(TS0, "closed", exists0) else exists0,
    exists1' = if (moves("closed")) existsAt(TS1, "closed", exists1) else exists1,
    floatOn' = if (moves("closed")) existsAt(TF, "closed", floatOn) else floatOn,
    side' = if (moves("closed")) sideNext("closed", "none") else side,
    collapsed0' = if (moves("closed")) (if (existsAt(TS0, "closed", exists0)) collapsed0 else false) else collapsed0,
    collapsed1' = if (moves("closed")) (if (existsAt(TS1, "closed", exists1)) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (moves("closed")) NONE else drag,
    target' = if (moves("closed")) "closed" else target,
    reason' = if (moves("closed")) "close" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  // the host moves the tab into its other window: it leaves as a serialisable value
  action transferOut = all {
    where0' = if (moves("out")) wPost(0, "out") else where0,
    where1' = if (moves("out")) wPost(1, "out") else where1,
    where2' = if (moves("out")) wPost(2, "out") else where2,
    where3' = if (moves("out")) wPost(3, "out") else where3,
    active0' = if (moves("out")) activeAt(TS0, "out", active0) else active0,
    active1' = if (moves("out")) activeAt(TS1, "out", active1) else active1,
    activeF' = if (moves("out")) activeAt(TF, "out", activeF) else activeF,
    activeE' = if (moves("out")) activeAt(TE, "out", activeE) else activeE,
    exists0' = if (moves("out")) existsAt(TS0, "out", exists0) else exists0,
    exists1' = if (moves("out")) existsAt(TS1, "out", exists1) else exists1,
    floatOn' = if (moves("out")) existsAt(TF, "out", floatOn) else floatOn,
    side' = if (moves("out")) sideNext("out", "none") else side,
    collapsed0' = if (moves("out")) (if (existsAt(TS0, "out", exists0)) collapsed0 else false) else collapsed0,
    collapsed1' = if (moves("out")) (if (existsAt(TS1, "out", exists1)) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = drag,
    target' = if (moves("out")) "out" else target,
    reason' = if (moves("out")) "transfer" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  // the other window hands a tab back; it lands in tabset 1 (the dock target)
  action attach = all {
    where0' = if (attachOk) wPost(0, "tab1") else where0,
    where1' = if (attachOk) wPost(1, "tab1") else where1,
    where2' = if (attachOk) wPost(2, "tab1") else where2,
    where3' = if (attachOk) wPost(3, "tab1") else where3,
    active0' = if (attachOk) activeAt(TS0, "tab1", active0) else active0,
    active1' = if (attachOk) activeAt(TS1, "tab1", active1) else active1,
    activeF' = if (attachOk) activeAt(TF, "tab1", activeF) else activeF,
    activeE' = if (attachOk) activeAt(TE, "tab1", activeE) else activeE,
    exists0' = if (attachOk) existsAt(TS0, "tab1", exists0) else exists0,
    exists1' = if (attachOk) existsAt(TS1, "tab1", exists1) else exists1,
    floatOn' = if (attachOk) existsAt(TF, "tab1", floatOn) else floatOn,
    side' = if (attachOk) sideNext("tab1", "none") else side,
    collapsed0' = if (attachOk) (if (existsAt(TS0, "tab1", exists0)) collapsed0 else false) else collapsed0,
    collapsed1' = if (attachOk) (if (existsAt(TS1, "tab1", exists1)) collapsed1 else false) else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = if (attachOk) NONE else drag,
    target' = if (attachOk) "tab1" else target,
    reason' = if (attachOk) "transfer" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action collapse0 = all {
    where0' = where0,
    where1' = where1,
    where2' = where2,
    where3' = where3,
    active0' = active0,
    active1' = active1,
    activeF' = activeF,
    activeE' = activeE,
    exists0' = exists0,
    exists1' = exists1,
    floatOn' = floatOn,
    side' = side,
    collapsed0' = if (collapse0Changes) collapse0Next else collapsed0,
    collapsed1' = collapsed1,
    keepEmpty' = keepEmpty,
    drag' = drag,
    target' = target,
    reason' = if (collapse0Changes) "collapse" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action collapse1 = all {
    where0' = where0,
    where1' = where1,
    where2' = where2,
    where3' = where3,
    active0' = active0,
    active1' = active1,
    activeF' = activeF,
    activeE' = activeE,
    exists0' = exists0,
    exists1' = exists1,
    floatOn' = floatOn,
    side' = side,
    collapsed0' = collapsed0,
    collapsed1' = if (collapse1Changes) collapse1Next else collapsed1,
    keepEmpty' = keepEmpty,
    drag' = drag,
    target' = target,
    reason' = if (collapse1Changes) "collapse" else "none",
    copies' = copies,
    copyTo' = copyTo,
    bW0' = where0,
    bW1' = where1,
    bW2' = where2,
    bW3' = where3
  }

  action step = any {
    init, keepOn, pick0, pick1, pick2, pick3, cancel, dropTab0, dropTab1, dropTabF,
    dropEdgeLeft, dropEdgeRight, dropEdgeTop, dropEdgeBottom, dropFloat, dockFloat,
    copyTab, closeTab, transferOut, attach, collapse0, collapse1
  }

  // a tab is in exactly one of the six homes (the int makes "two at once" unrepresentable)
  val EachTabHasOneHome: bool =
    and(where0 >= TS0, and(where0 <= CLOSED,
      and(where1 >= TS0, and(where1 <= CLOSED,
        and(where2 >= TS0, and(where2 <= CLOSED,
          and(where3 >= TS0, where3 <= CLOSED)))))))
  // a tab points at a container that is there (out / closed need none)
  val HomeContainerExists: bool =
    and(homeExists(where0), and(homeExists(where1), and(homeExists(where2), homeExists(where3))))
  // a container that runs out of tabs stops existing, unless the host keeps empty ones
  val NoEmptyContainer: bool =
    and(or(not(exists0), or(countIn(TS0) > 0, keepEmpty)),
      and(or(not(exists1), or(countIn(TS1) > 0, keepEmpty)),
        and(or(not(floatOn), or(countIn(TF) > 0, keepEmpty)),
          or(side == "none", or(countIn(TE) > 0, keepEmpty)))))
  // each container's active tab is in it
  val ActiveIsAMember: bool =
    and(or(active0 == NONE, and(active0 >= 0, and(active0 <= 3, homeOf(active0) == TS0))),
      and(or(active1 == NONE, and(active1 >= 0, and(active1 <= 3, homeOf(active1) == TS1))),
        and(or(activeF == NONE, and(activeF >= 0, and(activeF <= 3, homeOf(activeF) == TF))),
          or(activeE == NONE, and(activeE >= 0, and(activeE <= 3, homeOf(activeE) == TE))))))
  val ActiveIsAlwaysSet: bool =
    and(or(not(exists0), or(countIn(TS0) == 0, active0 != NONE)),
      and(or(not(exists1), or(countIn(TS1) == 0, active1 != NONE)),
        and(or(not(floatOn), or(countIn(TF) == 0, activeF != NONE)),
          or(side == "none", or(countIn(TE) == 0, activeE != NONE)))))
  // the edge tabset is where the split was created
  val EdgeSideKnown: bool =
    or(side == "none", or(side == "left", or(side == "right", or(side == "top", side == "bottom"))))
  // a collapsed tabset is one that is there
  val CollapsedTabsetExists: bool = and(or(not(collapsed0), exists0), or(not(collapsed1), exists1))
  // a refused request changed no tab
  val RefusalKeepsTheTabs: bool = or(not(reason == "none"), changedCount == 0)
  // a move regroups exactly one tab
  val MoveTouchesOneTab: bool = or(not(reason == "move"), changedCount == 1)
  // a copy never removes the source
  val CopyKeepsSource: bool = or(not(reason == "copy"), changedCount == 0)
  // a copy that landed named the destination the host was asked for
  val CopyNamesItsTarget: bool = or(not(reason == "copy"), copyTo != "none")
  // a close removes exactly one tab, and it is the closed one
  val CloseTouchesOneTab: bool =
    and(or(not(reason == "close"), changedCount == 1),
      and(or(not(reason == "close"), or(where0 == bW0, where0 == CLOSED)),
        and(or(not(reason == "close"), or(where1 == bW1, where1 == CLOSED)),
          and(or(not(reason == "close"), or(where2 == bW2, where2 == CLOSED)),
            or(not(reason == "close"), or(where3 == bW3, where3 == CLOSED))))))
  // a transfer moves exactly one tab, in or out of the window
  val TransferTouchesOneTab: bool =
    and(or(not(reason == "transfer"), changedCount == 1),
      and(or(not(reason == "transfer"), or(where0 == bW0, or(where0 == OUT, bW0 == OUT))),
        and(or(not(reason == "transfer"), or(where1 == bW1, or(where1 == OUT, bW1 == OUT))),
          and(or(not(reason == "transfer"), or(where2 == bW2, or(where2 == OUT, bW2 == OUT))),
            or(not(reason == "transfer"), or(where3 == bW3, or(where3 == OUT, bW3 == OUT)))))))
  // collapsing changes no tab
  val CollapseMovesNoTab: bool = or(not(reason == "collapse"), changedCount == 0)
  // a float shows the floating tabset and leaves a tab in it
  val FloatShowsTheTabset: bool = or(not(reason == "float"), and(floatOn, countIn(TF) > 0))
  // a dock ends the float and takes every floating tab with it
  val DockEndsTheFloat: bool = or(not(reason == "dock"), and(not(floatOn), countIn(TF) == 0))
}
