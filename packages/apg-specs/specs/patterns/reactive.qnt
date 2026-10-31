// @cssints/reactive: owners, programs and the flush (bean cssints-tm9j).
//
// Not an APG pattern: the runtime of packages/reactive (bean cssints-zrt2) is a
// delegated listener over a protocol of non-inheriting custom properties
// (`src/runtime.ts`, README.md "Protocol"). This spec models the protocol, not
// the DOM: an owner element with states, the elements in its subtree that carry
// a program or a binding, and the one flush that ends an event.
//
// MODELLED. Two owners: the outer one and an inner one nested in it (so the
// nearest owner is a real choice). Each owner declares `open` ("false" |
// "true") and `tab` ("one" | "two"); they start opposite (`outer.tab = "one"`,
// `inner.tab = "two"`) so a value read from the wrong owner is visible at once.
// The outer subtree carries a source binding (aria-expanded), a tab strip with
// a comparison (`?tab one`), a choice (`?tab one 0 -1`) and a literal
// (`=panel-1`), a `<select>` whose change sets `tab` from `@value`, a keydown
// program on the owner element itself (`set open true`), and an `inside(open)`
// condition (its display). The inner subtree carries the same four kinds of
// binding on its own tab strip, a click program, a checkbox whose change sets
// `open` from `@checked`, and its own `inside(open)` condition.
//
// A STEP is one event on one element: from the target up, every program for
// that event applies each of its actions to the nearest owner of the element it
// sits on, then every binding of each touched owner is written once (the
// flush). The event's payload (`@value`, `@checked`) is read off the target, so
// it rides in the action name (`changeOuterFieldTwo`, `changeInnerCheckOn`)
// and the step stays deterministic. The initial step is `setup`: every owner's
// `data-reactive-<name>` and every binding of both owners. `ready` says the
// setup ran; before it the attributes are absent ("").
//
// INVARIANTS. Nearest: every binding equals what the nearest owner implies
// (a source's value, a comparison's "true"/"false", a choice's two literals, a
// literal as written). Setup: after setup every owner carries exactly its
// declared data-reactive-<name> attributes, with the state's value. Isolated:
// an event whose programs sit in the inner subtree changes the inner owner
// only, and an event whose program sits on the outer owner element (an
// ancestor program, reached by bubbling) changes the outer owner only. Deep: a
// descendant's `inside()` condition is CSS — `:where(._g-reactive[data-reactive-
// <name>=<value>]) .el`, an ancestor match — so the inner panel is shown while
// either owner carries `open="true"`; the attribute itself is written on the
// nearest owner, which is what keeps the inner panel out of a stale inherited
// value, and the outer owner opening also matches (found by this model: with two
// owners declaring the same state, `inside()` is not nearest-scoped).
// ComparisonReadsNearest: while the two owners' `tab` differ, a
// comparison and a choice follow their own owner's value, never the other's.
// Atomic: when a state moved in the last step, the owner's attributes and its
// bindings show the new value, not the one the step started from (the Quint
// action is the flush; packages/reactive/test/scenarios.mjs proves the page
// paints once).
//
// NOT MODELLED: persistence (`persist()`, localStorage and the reload), `emit()`/`listen()` (a hand-off changes no state,
// so every invariant here would pass whether or not it is modelled; `packages/reactive/test/browsers.mjs` is the check),
// a binding added to an owner that already stands (the MutationObserver), more
// than two owners (so no sibling owner), more than two values per state, the
// ten events beyond the ones used here, `@value`/`@checked` read off anything
// but the event's own target, and dynamic attributes beyond
// setAttribute/style.setProperty. The runtime's tolerance (a page with none of
// it, storage that throws) is not modelled either.
//
// GENERATOR GAPS HIT: no collections and no parameterised actions, so the two
// owners and their elements are fixed fields and each event is its own action;
// every action assigns every var.
module patterns_reactive {
  // --- the owner states ---------------------------------------------------
  var xo: str // outer owner: open, "false" | "true"
  var xt: str // outer owner: tab, "one" | "two"
  var yo: str // inner owner: open
  var yt: str // inner owner: tab

  // --- data-reactive-<name> on each owner ("" before setup) ---------------
  var xaOpen: str
  var xaTab: str
  var yaOpen: str
  var yaTab: str

  // --- bindings of the outer subtree --------------------------------------
  var aExpanded: str // outer-btn aria-expanded open (a source)
  var aOneSel: str // outer-tab-1 aria-selected ?tab one (a comparison)
  var aOneTab: str // outer-tab-1 tabindex ?tab one 0 -1 (a choice)
  var aOneControls: str // outer-tab-1 aria-controls =panel-1 (a literal)
  var aTwoSel: str // outer-tab-2 aria-selected ?tab two
  var aTwoTab: str // outer-tab-2 tabindex ?tab two 0 -1
  var aCurrent: str // outer-field data-current tab (a source, set from @value)
  var aPanel: str // outer-panel display (inside(open), a computed style)

  // --- bindings of the inner subtree --------------------------------------
  var bExpanded: str // inner-btn aria-expanded open
  var bOneSel: str // inner-tab-1 aria-selected ?tab one
  var bOneTab: str // inner-tab-1 tabindex ?tab one 0 -1
  var bOneControls: str // inner-tab-1 aria-controls =panel-1
  var bTwoSel: str // inner-tab-2 aria-selected ?tab two
  var bTwoTab: str // inner-tab-2 tabindex ?tab two 0 -1
  var bChecked: str // inner-check data-checked open (set from @checked)
  var bPanel: str // inner-panel display (inside(open))

  // --- the step ------------------------------------------------------------
  var ready: bool // setup ran: the owner attributes are written
  var snapXo: str // the outer states when the last step began
  var snapXt: str
  var snapYo: str // the inner states when the last step began
  var snapYt: str
  var scope: str // "none" | "outer" | "inner" | "ancestor"

  def TRUE: str = "true"
  def FALSE: str = "false"
  def ONE: str = "one"
  def TWO: str = "two"
  def NO: str = "" // an attribute nobody wrote yet
  def BLOCK: str = "block"
  def HIDDEN: str = "none"
  def PANEL_ONE: str = "panel-1"

  def flip(v: str): str = if (v == TRUE) FALSE else TRUE
  def displayOf(open: str): str = if (open == TRUE) BLOCK else HIDDEN
  // inside() is CSS: `:where(._g-reactive[data-reactive-<name>=<value>]) .el`, an
  // ancestor match, so a descendant of an inner owner also matches an outer owner
  // that declares the same state. The runtime writes the attribute on the nearest
  // owner; the rule is stated as the CSS is.
  def insideDisplay(outerOpen: str, innerOpen: str): str =
    if (or(outerOpen == TRUE, innerOpen == TRUE)) BLOCK else HIDDEN
  def selected(tab: str, value: str): str = if (tab == value) TRUE else FALSE
  def tabIndexOf(tab: str, value: str): str = if (tab == value) "0" else "-1"

  def outerTabsOk: bool =
    and(aOneSel == selected(xt, ONE),
    and(aOneTab == tabIndexOf(xt, ONE),
    and(aTwoSel == selected(xt, TWO),
        aTwoTab == tabIndexOf(xt, TWO))))

  def innerTabsOk: bool =
    and(bOneSel == selected(yt, ONE),
    and(bOneTab == tabIndexOf(yt, ONE),
    and(bTwoSel == selected(yt, TWO),
        bTwoTab == tabIndexOf(yt, TWO))))

  def outerBindingsOk: bool =
    and(aExpanded == xo,
    and(aCurrent == xt,
    and(aOneControls == PANEL_ONE,
        outerTabsOk)))

  def innerBindingsOk: bool =
    and(bExpanded == yo,
    and(bChecked == yo,
    and(bOneControls == PANEL_ONE,
        innerTabsOk)))

  // --- the initial step and setup -----------------------------------------
  action init = all {
    xo' = FALSE,
    xt' = ONE,
    yo' = FALSE,
    yt' = TWO,
    xaOpen' = NO,
    xaTab' = NO,
    yaOpen' = NO,
    yaTab' = NO,
    aExpanded' = NO,
    aOneSel' = NO,
    aOneTab' = NO,
    aOneControls' = NO,
    aTwoSel' = NO,
    aTwoTab' = NO,
    aCurrent' = NO,
    aPanel' = NO,
    bExpanded' = NO,
    bOneSel' = NO,
    bOneTab' = NO,
    bOneControls' = NO,
    bTwoSel' = NO,
    bTwoTab' = NO,
    bChecked' = NO,
    bPanel' = NO,
    ready' = false,
    snapXo' = NO,
    snapXt' = NO,
    snapYo' = NO,
    snapYt' = NO,
    scope' = "none"
  }

  // setup: every owner's data-reactive-<name> and every binding, once
  action setup = all {
    xo' = xo,
    xt' = xt,
    yo' = yo,
    yt' = yt,
    xaOpen' = xo,
    xaTab' = xt,
    yaOpen' = yo,
    yaTab' = yt,
    aExpanded' = xo,
    aOneSel' = selected(xt, ONE),
    aOneTab' = tabIndexOf(xt, ONE),
    aOneControls' = PANEL_ONE,
    aTwoSel' = selected(xt, TWO),
    aTwoTab' = tabIndexOf(xt, TWO),
    aCurrent' = xt,
    aPanel' = displayOf(xo),
    bExpanded' = yo,
    bOneSel' = selected(yt, ONE),
    bOneTab' = tabIndexOf(yt, ONE),
    bOneControls' = PANEL_ONE,
    bTwoSel' = selected(yt, TWO),
    bTwoTab' = tabIndexOf(yt, TWO),
    bChecked' = yo,
    bPanel' = insideDisplay(xo, yo),
    ready' = true,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "none"
  }

  // --- a program in the outer subtree -------------------------------------
  // click on outer-btn: click toggle open, then the outer flush
  action clickOuterToggle = all {
    xo' = flip(xo),
    xt' = xt,
    yo' = yo,
    yt' = yt,
    xaOpen' = flip(xo),
    xaTab' = xt,
    yaOpen' = yaOpen,
    yaTab' = yaTab,
    aExpanded' = flip(xo),
    aOneSel' = selected(xt, ONE),
    aOneTab' = tabIndexOf(xt, ONE),
    aOneControls' = PANEL_ONE,
    aTwoSel' = selected(xt, TWO),
    aTwoTab' = tabIndexOf(xt, TWO),
    aCurrent' = xt,
    aPanel' = displayOf(flip(xo)),
    bExpanded' = bExpanded,
    bOneSel' = bOneSel,
    bOneTab' = bOneTab,
    bOneControls' = bOneControls,
    bTwoSel' = bTwoSel,
    bTwoTab' = bTwoTab,
    bChecked' = bChecked,
    bPanel' = insideDisplay(flip(xo), yo),
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "outer"
  }

  // click on outer-tab-1: click set tab one
  action clickOuterTabOne = all {
    xo' = xo,
    xt' = ONE,
    yo' = yo,
    yt' = yt,
    xaOpen' = xo,
    xaTab' = ONE,
    yaOpen' = yaOpen,
    yaTab' = yaTab,
    aExpanded' = xo,
    aOneSel' = TRUE,
    aOneTab' = "0",
    aOneControls' = PANEL_ONE,
    aTwoSel' = FALSE,
    aTwoTab' = "-1",
    aCurrent' = ONE,
    aPanel' = displayOf(xo),
    bExpanded' = bExpanded,
    bOneSel' = bOneSel,
    bOneTab' = bOneTab,
    bOneControls' = bOneControls,
    bTwoSel' = bTwoSel,
    bTwoTab' = bTwoTab,
    bChecked' = bChecked,
    bPanel' = bPanel,
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "outer"
  }

  // click on outer-tab-2: click set tab two
  action clickOuterTabTwo = all {
    xo' = xo,
    xt' = TWO,
    yo' = yo,
    yt' = yt,
    xaOpen' = xo,
    xaTab' = TWO,
    yaOpen' = yaOpen,
    yaTab' = yaTab,
    aExpanded' = xo,
    aOneSel' = FALSE,
    aOneTab' = "-1",
    aOneControls' = PANEL_ONE,
    aTwoSel' = TRUE,
    aTwoTab' = "0",
    aCurrent' = TWO,
    aPanel' = displayOf(xo),
    bExpanded' = bExpanded,
    bOneSel' = bOneSel,
    bOneTab' = bOneTab,
    bOneControls' = bOneControls,
    bTwoSel' = bTwoSel,
    bTwoTab' = bTwoTab,
    bChecked' = bChecked,
    bPanel' = bPanel,
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "outer"
  }

  // change on outer-field with @value = "one": change set tab @value
  action changeOuterFieldOne = all {
    xo' = xo,
    xt' = ONE,
    yo' = yo,
    yt' = yt,
    xaOpen' = xo,
    xaTab' = ONE,
    yaOpen' = yaOpen,
    yaTab' = yaTab,
    aExpanded' = xo,
    aOneSel' = TRUE,
    aOneTab' = "0",
    aOneControls' = PANEL_ONE,
    aTwoSel' = FALSE,
    aTwoTab' = "-1",
    aCurrent' = ONE,
    aPanel' = displayOf(xo),
    bExpanded' = bExpanded,
    bOneSel' = bOneSel,
    bOneTab' = bOneTab,
    bOneControls' = bOneControls,
    bTwoSel' = bTwoSel,
    bTwoTab' = bTwoTab,
    bChecked' = bChecked,
    bPanel' = bPanel,
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "outer"
  }

  // change on outer-field with @value = "two"
  action changeOuterFieldTwo = all {
    xo' = xo,
    xt' = TWO,
    yo' = yo,
    yt' = yt,
    xaOpen' = xo,
    xaTab' = TWO,
    yaOpen' = yaOpen,
    yaTab' = yaTab,
    aExpanded' = xo,
    aOneSel' = FALSE,
    aOneTab' = "-1",
    aOneControls' = PANEL_ONE,
    aTwoSel' = TRUE,
    aTwoTab' = "0",
    aCurrent' = TWO,
    aPanel' = displayOf(xo),
    bExpanded' = bExpanded,
    bOneSel' = bOneSel,
    bOneTab' = bOneTab,
    bOneControls' = bOneControls,
    bTwoSel' = bTwoSel,
    bTwoTab' = bTwoTab,
    bChecked' = bChecked,
    bPanel' = bPanel,
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "outer"
  }

  // --- a program in the inner subtree -------------------------------------
  // click on inner-btn: click toggle open, then the inner flush; the outer
  // subtree is not touched (the event bubbles, but its click program is not
  // the outer owner's)
  action clickInnerToggle = all {
    xo' = xo,
    xt' = xt,
    yo' = flip(yo),
    yt' = yt,
    xaOpen' = xaOpen,
    xaTab' = xaTab,
    yaOpen' = flip(yo),
    yaTab' = yt,
    aExpanded' = aExpanded,
    aOneSel' = aOneSel,
    aOneTab' = aOneTab,
    aOneControls' = aOneControls,
    aTwoSel' = aTwoSel,
    aTwoTab' = aTwoTab,
    aCurrent' = aCurrent,
    aPanel' = aPanel,
    bExpanded' = flip(yo),
    bOneSel' = selected(yt, ONE),
    bOneTab' = tabIndexOf(yt, ONE),
    bOneControls' = PANEL_ONE,
    bTwoSel' = selected(yt, TWO),
    bTwoTab' = tabIndexOf(yt, TWO),
    bChecked' = flip(yo),
    bPanel' = insideDisplay(xo, flip(yo)),
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "inner"
  }

  // click on inner-tab-1: click set tab one
  action clickInnerTabOne = all {
    xo' = xo,
    xt' = xt,
    yo' = yo,
    yt' = ONE,
    xaOpen' = xaOpen,
    xaTab' = xaTab,
    yaOpen' = yo,
    yaTab' = ONE,
    aExpanded' = aExpanded,
    aOneSel' = aOneSel,
    aOneTab' = aOneTab,
    aOneControls' = aOneControls,
    aTwoSel' = aTwoSel,
    aTwoTab' = aTwoTab,
    aCurrent' = aCurrent,
    aPanel' = aPanel,
    bExpanded' = yo,
    bOneSel' = TRUE,
    bOneTab' = "0",
    bOneControls' = PANEL_ONE,
    bTwoSel' = FALSE,
    bTwoTab' = "-1",
    bChecked' = yo,
    bPanel' = bPanel,
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "inner"
  }

  // click on inner-tab-2: click set tab two
  action clickInnerTabTwo = all {
    xo' = xo,
    xt' = xt,
    yo' = yo,
    yt' = TWO,
    xaOpen' = xaOpen,
    xaTab' = xaTab,
    yaOpen' = yo,
    yaTab' = TWO,
    aExpanded' = aExpanded,
    aOneSel' = aOneSel,
    aOneTab' = aOneTab,
    aOneControls' = aOneControls,
    aTwoSel' = aTwoSel,
    aTwoTab' = aTwoTab,
    aCurrent' = aCurrent,
    aPanel' = aPanel,
    bExpanded' = yo,
    bOneSel' = FALSE,
    bOneTab' = "-1",
    bOneControls' = PANEL_ONE,
    bTwoSel' = TRUE,
    bTwoTab' = "0",
    bChecked' = yo,
    bPanel' = bPanel,
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "inner"
  }

  // change on inner-check with @checked = true: change set open @checked
  action changeInnerCheckOn = all {
    xo' = xo,
    xt' = xt,
    yo' = TRUE,
    yt' = yt,
    xaOpen' = xaOpen,
    xaTab' = xaTab,
    yaOpen' = TRUE,
    yaTab' = yt,
    aExpanded' = aExpanded,
    aOneSel' = aOneSel,
    aOneTab' = aOneTab,
    aOneControls' = aOneControls,
    aTwoSel' = aTwoSel,
    aTwoTab' = aTwoTab,
    aCurrent' = aCurrent,
    aPanel' = aPanel,
    bExpanded' = TRUE,
    bOneSel' = selected(yt, ONE),
    bOneTab' = tabIndexOf(yt, ONE),
    bOneControls' = PANEL_ONE,
    bTwoSel' = selected(yt, TWO),
    bTwoTab' = tabIndexOf(yt, TWO),
    bChecked' = TRUE,
    bPanel' = insideDisplay(xo, TRUE),
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "inner"
  }

  // change on inner-check with @checked = false
  action changeInnerCheckOff = all {
    xo' = xo,
    xt' = xt,
    yo' = FALSE,
    yt' = yt,
    xaOpen' = xaOpen,
    xaTab' = xaTab,
    yaOpen' = FALSE,
    yaTab' = yt,
    aExpanded' = aExpanded,
    aOneSel' = aOneSel,
    aOneTab' = aOneTab,
    aOneControls' = aOneControls,
    aTwoSel' = aTwoSel,
    aTwoTab' = aTwoTab,
    aCurrent' = aCurrent,
    aPanel' = aPanel,
    bExpanded' = FALSE,
    bOneSel' = selected(yt, ONE),
    bOneTab' = tabIndexOf(yt, ONE),
    bOneControls' = PANEL_ONE,
    bTwoSel' = selected(yt, TWO),
    bTwoTab' = tabIndexOf(yt, TWO),
    bChecked' = FALSE,
    bPanel' = insideDisplay(xo, FALSE),
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "inner"
  }

  // --- an ancestor program -------------------------------------------------
  // keydown on inner-btn: no program on the way up inside the inner owner, the
  // outer owner element's `keydown set open true` applies to the outer owner
  action keydownInner = all {
    xo' = TRUE,
    xt' = xt,
    yo' = yo,
    yt' = yt,
    xaOpen' = TRUE,
    xaTab' = xt,
    yaOpen' = yaOpen,
    yaTab' = yaTab,
    aExpanded' = TRUE,
    aOneSel' = selected(xt, ONE),
    aOneTab' = tabIndexOf(xt, ONE),
    aOneControls' = PANEL_ONE,
    aTwoSel' = selected(xt, TWO),
    aTwoTab' = tabIndexOf(xt, TWO),
    aCurrent' = xt,
    aPanel' = displayOf(TRUE),
    bExpanded' = bExpanded,
    bOneSel' = bOneSel,
    bOneTab' = bOneTab,
    bOneControls' = bOneControls,
    bTwoSel' = bTwoSel,
    bTwoTab' = bTwoTab,
    bChecked' = bChecked,
    bPanel' = insideDisplay(TRUE, yo),
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "ancestor"
  }

  // --- an event with no program -------------------------------------------
  // click on inner-panel: nothing on the way up has a click program, so no
  // owner is touched and nothing is flushed
  action clickInnerPanel = all {
    xo' = xo,
    xt' = xt,
    yo' = yo,
    yt' = yt,
    xaOpen' = xaOpen,
    xaTab' = xaTab,
    yaOpen' = yaOpen,
    yaTab' = yaTab,
    aExpanded' = aExpanded,
    aOneSel' = aOneSel,
    aOneTab' = aOneTab,
    aOneControls' = aOneControls,
    aTwoSel' = aTwoSel,
    aTwoTab' = aTwoTab,
    aCurrent' = aCurrent,
    aPanel' = aPanel,
    bExpanded' = bExpanded,
    bOneSel' = bOneSel,
    bOneTab' = bOneTab,
    bOneControls' = bOneControls,
    bTwoSel' = bTwoSel,
    bTwoTab' = bTwoTab,
    bChecked' = bChecked,
    bPanel' = bPanel,
    ready' = ready,
    snapXo' = xo,
    snapXt' = xt,
    snapYo' = yo,
    snapYt' = yt,
    scope' = "none"
  }

  action step = any {
    init,
    setup,
    clickOuterToggle,
    clickOuterTabOne,
    clickOuterTabTwo,
    changeOuterFieldOne,
    changeOuterFieldTwo,
    clickInnerToggle,
    clickInnerTabOne,
    clickInnerTabTwo,
    changeInnerCheckOn,
    changeInnerCheckOff,
    keydownInner,
    clickInnerPanel
  }

  // every binding equals what the nearest owner implies
  val Nearest: bool = or(not(ready), and(outerBindingsOk, innerBindingsOk))
  // after setup every owner carries exactly its declared data-reactive-<name>
  val Setup: bool =
    or(not(ready), and(xaOpen == xo, and(xaTab == xt, and(yaOpen == yo, yaTab == yt))))
  // an event in one subtree leaves the other owner alone
  val Isolated: bool =
    and(or(not(scope == "inner"), and(xo == snapXo, xt == snapXt)),
        or(not(scope == "ancestor"), and(yo == snapYo, yt == snapYt)))
  // a descendant's condition reads its nearest owner, not an inherited value
  val Deep: bool =
    or(not(ready), and(aPanel == displayOf(xo), bPanel == insideDisplay(xo, yo)))
  // while the owners' tab differ, a comparison and a choice follow their own
  // owner: a value written from the other owner fails this
  val ComparisonReadsNearest: bool =
    or(not(ready),
       or(xt == yt,
          and(and(aOneSel == selected(xt, ONE),
                  and(aOneTab == tabIndexOf(xt, ONE),
                      and(aTwoSel == selected(xt, TWO), aTwoTab == tabIndexOf(xt, TWO)))),
              and(bOneSel == selected(yt, ONE),
                  and(bOneTab == tabIndexOf(yt, ONE),
                      and(bTwoSel == selected(yt, TWO), bTwoTab == tabIndexOf(yt, TWO)))))))
  // a state that moved shows its new value in the owner's attribute and in the
  // bindings, never the value the step started from
  val Atomic: bool =
    or(not(ready),
       and(or(xo == snapXo, and(xaOpen == xo, aExpanded == xo)),
       and(or(xt == snapXt, and(xaTab == xt, and(aOneSel == selected(xt, ONE), aCurrent == xt))),
       and(or(yo == snapYo, and(yaOpen == yo, bExpanded == yo)),
           or(yt == snapYt, and(yaTab == yt, and(bOneSel == selected(yt, ONE), bTwoSel == selected(yt, TWO))))))))
  // the step names which subtree its programs sat in
  val ScopeKnown: bool =
    or(scope == "none", or(scope == "outer", or(scope == "inner", scope == "ancestor")))
}
