// WAI-ARIA APG — Accordion pattern (sections with show/hide functionality).
//
// Modelled from https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
//   - "About This Pattern"          headers are controls that reveal/hide panels
//   - "Keyboard Interaction"        Enter/Space toggle, Tab/Shift+Tab walk every
//                                   focusable element (no roving tabindex)
//   - "WAI-ARIA Roles, States, and Properties"
//                                   aria-expanded mirrors panel visibility,
//                                   aria-controls / region + aria-labelledby,
//                                   aria-disabled on the sole expanded header
//                                   when collapsing is not permitted
// and the worked example
//   https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
//
// State: three panels (expanded0..2), the focused element, and the
// configuration variants as props that can change at any time:
//   multiple     false = at most one panel expanded ("only one panel" impl.)
//   collapsible  false = one panel must stay expanded (aria-disabled on it)
//   headingLevel the aria-level of the heading wrapping each header button
//
// Focus is a "slot" in DOM order (-1 = outside the accordion):
//   0 header0, 1 content0, 2 header1, 3 content1, 4 header2, 5 content2
// A content slot stands for the panel's focusable element (e.g. a form field)
// and is in the Tab sequence only while its panel is expanded.
//
// Request vs commit (map ticket rt1p). Everything a user sees as a change —
// click_header, key_enter, key_space — is a *request* carrying an intent (the
// toggled vector, packed into `requested`). It fires onExpandedChange
// (`requests` counts the calls) when the intent differs from the current value,
// and then:
//   uncontrolled        the request is accepted: the panels commit the intent
//   controlled, holds   the host ignores it ("rejected"): the panels are untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       panels commit through the controlled value, not the event
// The controlled value (`valueProp`, the three expanded bits packed with
// `packed`) is the only thing that changes the panels while `controlled`;
// `setValue` / `hostToggle` are the host writing it. `control` and
// `acceptRequests` are configuration events (init is literal-only), like
// `disable` would be.
//
// The generator has one nondet pool per action and no collections, so the
// controlled value is a packed int and every action assigns every var; the
// per-panel request path is spelled out per member. The mode invariants
// (`SingleModeAtMostOneExpanded`, `NonCollapsibleKeepsOneExpanded`) are scoped
// to the uncontrolled path: a controlled host owns the value, so the widget
// renders whatever set it is given.
//
// Deliberate omissions:
//   - the optional Down/Up/Home/End header navigation (not on the current page)
//   - the optional region landmark and its ">6 panels" caution
//   - static structure (role=button inside role=heading, the heading holding
//     only the button, id wiring) beyond the id round-trip defs below
//   - persistent adjacent controls (menubutton) and per-panel disabled headers
//   - Enter vs Space keydown/keyup timing: both toggle identically here
//   - Tab from outside enters at the first slot, Shift+Tab at the last: the
//     page around the accordion is a single "outside" state
//   - panel count is fixed at 3 (the generator has no collection state)
//
// Generator notes: constants/records are unsupported, so config is state, and
// every action assigns every var (guards live in the RHS).
module apg_accordion {
  import aria.* from "../../shared/aria"

  var expanded0: bool
  var expanded1: bool
  var expanded2: bool
  var focus: int
  var multiple: bool
  var collapsible: bool
  var headingLevel: int
  var controlled: bool    // the host owns the value (`value` prop present)
  var accepting: bool     // controlled host that answers every request with its intent
  var valueProp: int      // the controlled value prop, packed with `packed`
  var requested: int      // intent of the last request, packed
  var outcome: str        // "none" | "accepted" | "rejected"
  var base: int           // value when the last request was received, packed
  var requests: int       // number of requests that fired onExpandedChange

  // ---- pure helpers ----------------------------------------------------

  def isExpanded(i: int, a: bool, b: bool, c: bool): bool =
    if (i == 0) a else if (i == 1) b else c

  def expandedCount(a: bool, b: bool, c: bool): int =
    (if (a) 1 else 0) + (if (b) 1 else 0) + (if (c) 1 else 0)

  // a collapse is honoured when collapsing is allowed, or when another panel
  // stays expanded
  def canCollapse(a: bool, b: bool, c: bool, coll: bool): bool =
    or(coll, expandedCount(a, b, c) >= 2)

  // Enter/Space/click on header `i` (-1 = nothing activated): the new
  // expanded flag of panel `j`
  def toggledExpanded(j: int, i: int, a: bool, b: bool, c: bool, multi: bool, coll: bool): bool =
    if (i < 0) isExpanded(j, a, b, c)
    else if (isExpanded(i, a, b, c))
      (if (j == i) not(canCollapse(a, b, c, coll)) else isExpanded(j, a, b, c))
    else
      (if (j == i) true else (if (multi) isExpanded(j, a, b, c) else false))

  def lowerExpanded(j: int, a: bool, b: bool, c: bool): bool =
    or(and(j > 0, a), and(j > 1, b))

  // a prop change re-establishes the mode's constraints: single keeps the
  // first expanded panel; non-collapsible expands panel 0 when none is open
  def normExpanded(j: int, a: bool, b: bool, c: bool, multi: bool, coll: bool): bool =
    if (and(not(coll), expandedCount(a, b, c) == 0)) (j == 0)
    else if (multi) isExpanded(j, a, b, c)
    else and(isExpanded(j, a, b, c), not(lowerExpanded(j, a, b, c)))

  def onHeader(f: int): bool = and(f >= 0, f % 2 == 0)
  def onContent(f: int): bool = and(f >= 0, f % 2 == 1)
  def headerTarget(f: int): int = if (onHeader(f)) f / 2 else -1

  // headers are always focusable; content only while its panel is expanded
  def slotShown(s: int, a: bool, b: bool, c: bool): bool =
    or(s % 2 == 0, isExpanded(s / 2, a, b, c))

  // Tab: next focusable slot, or out of the accordion after the last
  def nextSlot(f: int, a: bool, b: bool, c: bool): int =
    if (f >= 5) -1
    else if (slotShown(f + 1, a, b, c)) f + 1
    else if (f + 2 > 5) -1
    else f + 2

  def prevFrom(s: int, a: bool, b: bool, c: bool): int =
    if (slotShown(s, a, b, c)) s else s - 1

  // Shift+Tab: previous focusable slot, or out before the first
  def prevSlot(f: int, a: bool, b: bool, c: bool): int =
    if (f == 0) -1
    else prevFrom(if (f < 0) 5 else f - 1, a, b, c)

  // focus inside a panel that just got hidden is lost
  def focusAfter(f: int, a: bool, b: bool, c: bool): int =
    if (onContent(f)) (if (isExpanded(f / 2, a, b, c)) f else -1) else f

  // ---- request / commit (map ticket rt1p) -------------------------------

  def b2i(b: bool): int = if (b) 1 else 0
  // injective for three bools: bit 0 = panel 0, bit 1 = panel 1, bit 2 = panel 2
  def packed(a: bool, b: bool, c: bool): int =
    b2i(a) + 2 * b2i(b) + 4 * b2i(c)
  def bitAt(i: int, n: int): bool =
    if (i == 0) n % 2 == 1 else if (i == 1) (n / 2) % 2 == 1 else (n / 4) % 2 == 1
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the value after a request for `want`
  def landed(h: bool, current: bool, want: bool): bool = if (h) current else want
  // the value prop after a request for `want`
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p
  // the intent of a request on header `i`, per member and packed
  def intent(j: int, i: int): bool =
    toggledExpanded(j, i, expanded0, expanded1, expanded2, multiple, collapsible)
  def wantPacked(i: int): int = packed(intent(0, i), intent(1, i), intent(2, i))
  def nowPacked: int = packed(expanded0, expanded1, expanded2)
  // the value a mode prop change re-establishes
  def normAt(j: int, multi: bool, coll: bool): bool =
    normExpanded(j, expanded0, expanded1, expanded2, multi, coll)
  def normPacked(multi: bool, coll: bool): int =
    packed(normAt(0, multi, coll), normAt(1, multi, coll), normAt(2, multi, coll))
  // a request is real only when its intent differs from the current value
  def moves(i: int): bool = wantPacked(i) != nowPacked
  // the host flips one bit of its own copy of the value
  def flipAt(n: int, i: int): int =
    if (i == 0) (if (bitAt(0, n)) n - 1 else n + 1)
    else if (i == 1) (if (bitAt(1, n)) n - 2 else n + 2)
    else (if (bitAt(2, n)) n - 4 else n + 4)

  // ---- the ARIA contract, derived from state ----------------------------

  def expandedAt(i: int): bool = isExpanded(i, expanded0, expanded1, expanded2)
  def ariaExpanded(i: int): str = ariaBoolToken(expandedAt(i))
  def ariaDisabled(i: int): bool =
    and(expandedAt(i), not(canCollapse(expanded0, expanded1, expanded2, collapsible)))
  def ariaControls(i: int): int = i
  def regionLabelledBy(i: int): int = i
  def tabbable(s: int): bool = slotShown(s, expanded0, expanded1, expanded2)
  def toggledAt(j: int, i: int): bool =
    toggledExpanded(j, i, expanded0, expanded1, expanded2, multiple, collapsible)

  // aria-disabled marks exactly the header whose activation is refused;
  // an allow expanded header collapses; a collapsed header expands
  def toggleContractHolds(i: int): bool = and(
    or(not(ariaDisabled(i)), toggledAt(i, i)),
    or(not(and(expandedAt(i), not(ariaDisabled(i)))), not(toggledAt(i, i))),
    or(expandedAt(i), toggledAt(i, i))
  )

  // expanding a header collapses every other panel unless multiple
  def expandRespectsMode(i: int): bool =
    or(
      expandedAt(i),
      and(
        toggledAt(i, i),
        or(multiple, and(not(toggledAt((i + 1) % 3, i)), not(toggledAt((i + 2) % 3, i))))
      )
    )

  // aria-expanded mirrors visibility: the header is always in the Tab
  // sequence, the panel's content is in it iff aria-expanded is "true"
  def expandedMirrorsVisibility(i: int): bool = and(
    tabbable(2 * i),
    (ariaExpanded(i) == "true") == tabbable(2 * i + 1)
  )

  // ---- actions -----------------------------------------------------------

  action init = all {
    expanded0' = false,
    expanded1' = false,
    expanded2' = false,
    focus' = -1,
    multiple' = false,
    collapsible' = true,
    headingLevel' = 3,
    controlled' = false,
    accepting' = false,
    valueProp' = 0,
    requested' = 0,
    outcome' = "none",
    base' = 0,
    requests' = 0
  }

  // pointer: click moves focus to the header and requests a toggle
  action click_header = {
    nondet panel = Set(0, 1, 2).oneOf()
    all {
      expanded0' = landed(holds, expanded0, intent(0, panel)),
      expanded1' = landed(holds, expanded1, intent(1, panel)),
      expanded2' = landed(holds, expanded2, intent(2, panel)),
      focus' = 2 * panel,
      multiple' = multiple,
      collapsible' = collapsible,
      headingLevel' = headingLevel,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, wantPacked(panel)),
      requested' = if (moves(panel)) wantPacked(panel) else requested,
      outcome' = if (moves(panel)) verdict else outcome,
      base' = if (moves(panel)) nowPacked else base,
      requests' = if (moves(panel)) requests + 1 else requests
    }
  }

  // pointer: click on a panel's focusable content (only reachable if shown)
  action click_content = {
    nondet panel = Set(0, 1, 2).oneOf()
    all {
      expanded0' = expanded0,
      expanded1' = expanded1,
      expanded2' = expanded2,
      focus' = if (expandedAt(panel)) 2 * panel + 1 else focus,
      multiple' = multiple,
      collapsible' = collapsible,
      headingLevel' = headingLevel,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      outcome' = outcome,
      base' = base,
      requests' = requests
    }
  }

  // request: Enter on the focused header
  action key_enter = all {
    expanded0' = landed(holds, expanded0, intent(0, headerTarget(focus))),
    expanded1' = landed(holds, expanded1, intent(1, headerTarget(focus))),
    expanded2' = landed(holds, expanded2, intent(2, headerTarget(focus))),
    focus' = focus,
    multiple' = multiple,
    collapsible' = collapsible,
    headingLevel' = headingLevel,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantPacked(headerTarget(focus))),
    requested' = if (moves(headerTarget(focus))) wantPacked(headerTarget(focus)) else requested,
    outcome' = if (moves(headerTarget(focus))) verdict else outcome,
    base' = if (moves(headerTarget(focus))) nowPacked else base,
    requests' = if (moves(headerTarget(focus))) requests + 1 else requests
  }

  // request: Space on the focused header (same effect as Enter)
  action key_space = all {
    expanded0' = landed(holds, expanded0, intent(0, headerTarget(focus))),
    expanded1' = landed(holds, expanded1, intent(1, headerTarget(focus))),
    expanded2' = landed(holds, expanded2, intent(2, headerTarget(focus))),
    focus' = focus,
    multiple' = multiple,
    collapsible' = collapsible,
    headingLevel' = headingLevel,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantPacked(headerTarget(focus))),
    requested' = if (moves(headerTarget(focus))) wantPacked(headerTarget(focus)) else requested,
    outcome' = if (moves(headerTarget(focus))) verdict else outcome,
    base' = if (moves(headerTarget(focus))) nowPacked else base,
    requests' = if (moves(headerTarget(focus))) requests + 1 else requests
  }

  action key_tab = all {
    expanded0' = expanded0,
    expanded1' = expanded1,
    expanded2' = expanded2,
    focus' = nextSlot(focus, expanded0, expanded1, expanded2),
    multiple' = multiple,
    collapsible' = collapsible,
    headingLevel' = headingLevel,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action key_shift_tab = all {
    expanded0' = expanded0,
    expanded1' = expanded1,
    expanded2' = expanded2,
    focus' = prevSlot(focus, expanded0, expanded1, expanded2),
    multiple' = multiple,
    collapsible' = collapsible,
    headingLevel' = headingLevel,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // focus leaves the accordion (click elsewhere, window blur)
  action blur = all {
    expanded0' = expanded0,
    expanded1' = expanded1,
    expanded2' = expanded2,
    focus' = -1,
    multiple' = multiple,
    collapsible' = collapsible,
    headingLevel' = headingLevel,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // prop change: single vs multiple expansion (uncontrolled only re-normalizes;
  // a controlled host owns the value, so its panels stay put)
  action set_multiple = {
    nondet allow = Set(true, false).oneOf()
    all {
      expanded0' = if (controlled) expanded0 else normAt(0, allow, collapsible),
      expanded1' = if (controlled) expanded1 else normAt(1, allow, collapsible),
      expanded2' = if (controlled) expanded2 else normAt(2, allow, collapsible),
      focus' = if (controlled) focus else focusAfter(
        focus,
        normAt(0, allow, collapsible),
        normAt(1, allow, collapsible),
        normAt(2, allow, collapsible)
      ),
      multiple' = allow,
      collapsible' = collapsible,
      headingLevel' = headingLevel,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = if (controlled) requested else (if (normPacked(allow, collapsible) != nowPacked) normPacked(allow, collapsible) else requested),
      outcome' = if (controlled) outcome else (if (normPacked(allow, collapsible) != nowPacked) "accepted" else outcome),
      base' = if (controlled) base else (if (normPacked(allow, collapsible) != nowPacked) nowPacked else base),
      requests' = if (controlled) requests else (if (normPacked(allow, collapsible) != nowPacked) requests + 1 else requests)
    }
  }

  // prop change: collapsing the last expanded panel permitted or not
  action set_collapsible = {
    nondet allow = Set(true, false).oneOf()
    all {
      expanded0' = if (controlled) expanded0 else normAt(0, multiple, allow),
      expanded1' = if (controlled) expanded1 else normAt(1, multiple, allow),
      expanded2' = if (controlled) expanded2 else normAt(2, multiple, allow),
      focus' = if (controlled) focus else focusAfter(
        focus,
        normAt(0, multiple, allow),
        normAt(1, multiple, allow),
        normAt(2, multiple, allow)
      ),
      multiple' = multiple,
      collapsible' = allow,
      headingLevel' = headingLevel,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = if (controlled) requested else (if (normPacked(multiple, allow) != nowPacked) normPacked(multiple, allow) else requested),
      outcome' = if (controlled) outcome else (if (normPacked(multiple, allow) != nowPacked) "accepted" else outcome),
      base' = if (controlled) base else (if (normPacked(multiple, allow) != nowPacked) nowPacked else base),
      requests' = if (controlled) requests else (if (normPacked(multiple, allow) != nowPacked) requests + 1 else requests)
    }
  }

  // prop change: aria-level of the wrapping headings
  action set_heading_level = {
    nondet level = Set(1, 2, 3, 4, 5, 6).oneOf()
    all {
      expanded0' = expanded0,
      expanded1' = expanded1,
      expanded2' = expanded2,
      focus' = focus,
      multiple' = multiple,
      collapsible' = collapsible,
      headingLevel' = level,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      outcome' = outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host writes the controlled value (a no-op while uncontrolled)
  action setValue = {
    nondet v = Set(0, 1, 2, 3, 4, 5, 6, 7).oneOf()
    all {
      expanded0' = if (controlled) bitAt(0, v) else expanded0,
      expanded1' = if (controlled) bitAt(1, v) else expanded1,
      expanded2' = if (controlled) bitAt(2, v) else expanded2,
      focus' = if (controlled) focusAfter(focus, bitAt(0, v), bitAt(1, v), bitAt(2, v)) else focus,
      multiple' = multiple,
      collapsible' = collapsible,
      headingLevel' = headingLevel,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) v else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips one bit of its own copy of the value
  action hostToggle = {
    nondet panel = Set(0, 1, 2).oneOf()
    all {
      expanded0' = if (controlled) bitAt(0, flipAt(valueProp, panel)) else expanded0,
      expanded1' = if (controlled) bitAt(1, flipAt(valueProp, panel)) else expanded1,
      expanded2' = if (controlled) bitAt(2, flipAt(valueProp, panel)) else expanded2,
      focus' = if (controlled) focusAfter(focus, bitAt(0, flipAt(valueProp, panel)), bitAt(1, flipAt(valueProp, panel)), bitAt(2, flipAt(valueProp, panel))) else focus,
      multiple' = multiple,
      collapsible' = collapsible,
      headingLevel' = headingLevel,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) flipAt(valueProp, panel) else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // configuration: the host starts owning the value, adopting the current one
  action control = all {
    expanded0' = expanded0,
    expanded1' = expanded1,
    expanded2' = expanded2,
    focus' = focus,
    multiple' = multiple,
    collapsible' = collapsible,
    headingLevel' = headingLevel,
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
    expanded0' = expanded0,
    expanded1' = expanded1,
    expanded2' = expanded2,
    focus' = focus,
    multiple' = multiple,
    collapsible' = collapsible,
    headingLevel' = headingLevel,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init,
    click_header,
    click_content,
    key_enter,
    key_space,
    key_tab,
    key_shift_tab,
    blur,
    set_multiple,
    set_collapsible,
    set_heading_level,
    setValue,
    hostToggle,
    control,
    acceptRequests
  }

  // ---- invariants ----------------------------------------------------------

  val FocusInRange: bool = and(focus >= -1, focus <= 5)
  // content of a collapsed (hidden) panel never holds focus
  val FocusNotInCollapsedPanel: bool =
    or(not(onContent(focus)), expandedAt(focus / 2))
  // "only one panel expanded" implementations (uncontrolled: a controlled host
  // owns the value and may hand us any set)
  val SingleModeAtMostOneExpanded: bool =
    ariaSingleHoldsAtMostOne(controlled, multiple, expandedCount(expanded0, expanded1, expanded2))
  // "one panel must stay expanded" implementations (uncontrolled)
  val NonCollapsibleKeepsOneExpanded: bool =
    or(controlled, or(collapsible, expandedCount(expanded0, expanded1, expanded2) >= 1))
  // aria-disabled only ever sits on an expanded header that cannot collapse
  val AriaDisabledOnlyOnExpanded: bool = and(
    or(not(ariaDisabled(0)), expandedAt(0)),
    or(not(ariaDisabled(1)), expandedAt(1)),
    or(not(ariaDisabled(2)), expandedAt(2))
  )
  val AriaDisabledMatchesToggle: bool = and(
    toggleContractHolds(0),
    toggleContractHolds(1),
    toggleContractHolds(2)
  )
  val ExpandRespectsMode: bool = and(
    expandRespectsMode(0),
    expandRespectsMode(1),
    expandRespectsMode(2)
  )
  val AriaExpandedMirrorsVisibility: bool = and(
    expandedMirrorsVisibility(0),
    expandedMirrorsVisibility(1),
    expandedMirrorsVisibility(2)
  )
  // aria-controls on header i and aria-labelledby on its region round-trip
  val ControlsLabelledByRoundTrip: bool = and(
    regionLabelledBy(ariaControls(0)) == 0,
    regionLabelledBy(ariaControls(1)) == 1,
    regionLabelledBy(ariaControls(2)) == 2
  )
  val HeadingLevelValid: bool = and(headingLevel >= 1, headingLevel <= 6)
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), nowPacked == valueProp)
  // a rejected request leaves the state as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), nowPacked == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), nowPacked == requested)
}
