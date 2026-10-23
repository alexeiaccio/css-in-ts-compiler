// APG Listbox, single-select — https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
//
// Sections modelled:
//   - "Keyboard Interaction": what a single-select listbox does when it receives
//     focus (first option, or the selected option), Down/Up/Home/End, and the
//     note on "selection follows focus" (optional in the pattern, always on in
//     the scrollable and grouped examples).
//   - "WAI-ARIA Roles, States, and Properties": listbox/option/group, at most
//     one option selected, aria-multiselectable false, aria-selected per option,
//     aria-activedescendant (DOM focus stays on the listbox; the active option
//     is the visual focus).
//   - Examples: listbox-scrollable (single-select + follows focus),
//     listbox-grouped (two option groups of three; groups are not focusable, so
//     arrows cross group boundaries), listbox-rearrangeable example 1 (the
//     single-select side; reordering lives in listbox-rearrangeable.qnt).
//
// State: whether the listbox holds focus, the active option, the selection (a
// bitmask — a set cannot be a state var in the supported subset), and the
// followsFocus prop. Selection is a mask rather than an index so "at most one
// selected" is a real invariant, not a tautology of the encoding.
//
// Events (user-level alphabet):
//   focus_in / blur       Tab into / out of the listbox
//   arrow_down/arrow_up   next / previous option (clamped, no wrap)
//   home / end            first / last option
//   space                 select the active option (the way to select when
//                         selection does not follow focus)
//   click(index)          pointer: focus and select that option
//   set_follows_focus     prop change; turning it on while focused syncs the
//                         selection to the active option
//
// Request vs commit (map ticket rt1p). Every event a user would see as a change
// — focus_in (when selection follows focus), arrow_down/up, home, end, space,
// click, set_follows_focus (when it syncs) — is a *request* carrying the
// intended selection mask. It fires onValueChange (`requests` counts the calls)
// when the intent differs from the current selection, and then:
//   uncontrolled        the request is accepted: the selection commits the intent
//   controlled, holds   the host ignores it ("rejected"): the selection is untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       selection commits through the controlled value
// The controlled value is `valueProp0..valueProp5` (one bool per option), the
// only thing that changes the selection while `controlled`; `setValue` /
// `hostToggle` are the host writing it. `control` and `acceptRequests` are
// configuration events (init is literal-only). The active option stays
// widget-internal: a rejected request still moves the visual focus, exactly as
// the primitive does.
//
// Invariants for the model: ControlledFollowsProp (in controlled mode no event
// commits), RejectedRequestUntouched, AcceptedRequestCommits. The mode invariants
// (at most one selected, selection follows focus) are scoped to the uncontrolled
// path: a controlled host owns the value and may hand the widget any set.
//
// Deliberate omissions (ponytail):
//   - typeahead lives in listbox-typeahead.qnt (it only produces a focus move,
//     which composes with the moves here)
//   - scrolling the active option into view, aria-orientation=horizontal (arrow
//     keys swap), aria-checked, aria-setsize/aria-posinset (dynamic loading),
//     labels (aria-label/aria-labelledby), disabled options
//   - an empty listbox (aria-activedescendant="") — the option count is fixed
//   - the optional "first option auto-selected on entry" when selection does not
//     follow focus: entry never selects unless followsFocus is on
//   - focus wrap-around: the pattern does not specify it, the examples clamp
//
// Generator notes: no parameterized actions and no `let`, so a request spells
// `landed(...)` out per assignment and every action assigns every var.
module apg_listbox_single {
  import aria.* from "../../shared/aria"

  var hasFocus: bool     // the listbox is the focused element
  var active: int        // the active option (aria-activedescendant target)
  var selected: int      // selection bitmask over the options (bit i = option i)
  var followsFocus: bool // prop: selection follows focus
  var controlled: bool   // the host owns the value (`value` prop present)
  var accepting: bool    // controlled host that answers every request with its intent
  var valueProp0: bool   // the controlled value prop, one bool per option
  var valueProp1: bool
  var valueProp2: bool
  var valueProp3: bool
  var valueProp4: bool
  var valueProp5: bool
  var requested: int     // intent of the last request (selection mask)
  var outcome: str       // "none" | "accepted" | "rejected"
  var base: int          // selection when the last request was received
  var requests: int      // number of requests that fired onValueChange

  // six options in two groups of three (listbox-grouped example)
  def optionCount: int = 6
  def lastIndex: int = 5
  def noOption: int = 6
  def groupSize: int = 3

  def pow2(i: int): int =
    if (i == 0) 1
    else if (i == 1) 2
    else if (i == 2) 4
    else if (i == 3) 8
    else if (i == 4) 16
    else if (i == 5) 32
    else 64
  // bit i of a selection mask: option i is selected
  def bit(mask: int, i: int): bool = (mask / pow2(i)) % 2 == 1
  def popcount(mask: int): int =
    (if (bit(mask, 0)) 1 else 0)
    + (if (bit(mask, 1)) 1 else 0)
    + (if (bit(mask, 2)) 1 else 0)
    + (if (bit(mask, 3)) 1 else 0)
    + (if (bit(mask, 4)) 1 else 0)
    + (if (bit(mask, 5)) 1 else 0)
  def firstSelected(mask: int): int =
    if (bit(mask, 0)) 0
    else if (bit(mask, 1)) 1
    else if (bit(mask, 2)) 2
    else if (bit(mask, 3)) 3
    else if (bit(mask, 4)) 4
    else if (bit(mask, 5)) 5
    else noOption
  // Tab entry: the selected option when there is one, else the first option
  def entryIndex(mask: int): int = if (mask == 0) 0 else firstSelected(mask)
  def nextIndex(i: int): int = if (i < lastIndex) i + 1 else i
  def prevIndex(i: int): int = if (i > 0) i - 1 else i
  def groupOf(i: int): int = i / groupSize
  // selection after the active option moved to target
  def selectionAfterMove(follow: bool, mask: int, target: int): int =
    if (follow) pow2(target) else mask

  // --- request / commit (map ticket rt1p) ---------------------------------
  def b2i(b: bool): int = if (b) 1 else 0
  // the controlled value prop, packed into a mask
  def propsMask: int =
    b2i(valueProp0)
    + 2 * b2i(valueProp1)
    + 4 * b2i(valueProp2)
    + 8 * b2i(valueProp3)
    + 16 * b2i(valueProp4)
    + 32 * b2i(valueProp5)
  // the host flips one selected option of its own copy of the value
  def flipAt(n: int, i: int): int = if (bit(n, i)) n - pow2(i) else n + pow2(i)
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def hostWrites: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the value after a request for `want`
  def landed(h: bool, current: int, want: int): int = if (h) current else want
  // one value-prop member after a request for `want`
  def propBit(writes: bool, current: bool, want: int, i: int): bool =
    if (writes) bit(want, i) else current
  // the intended selection of each request
  def focusIntent: int =
    if (and(not(hasFocus), followsFocus)) pow2(entryIndex(selected)) else selected
  def downIntent: int =
    if (hasFocus) selectionAfterMove(followsFocus, selected, nextIndex(active)) else selected
  def upIntent: int =
    if (hasFocus) selectionAfterMove(followsFocus, selected, prevIndex(active)) else selected
  def homeIntent: int = if (hasFocus) selectionAfterMove(followsFocus, selected, 0) else selected
  def endIntent: int = if (hasFocus) selectionAfterMove(followsFocus, selected, lastIndex) else selected
  def spaceIntent: int = if (hasFocus) pow2(active) else selected
  def followsIntent(follow: bool): int =
    if (and(follow, hasFocus)) pow2(active) else selected

  // --- ARIA contract, derived from the state ------------------------------
  def ariaMultiselectable: bool = false
  def ariaActiveDescendant(focused: bool, idx: int): int =
    if (focused) idx else noOption
  def ariaSelected(mask: int, i: int): bool = bit(mask, i)
  // the listbox itself is the one tab stop; options never take tabindex
  def listboxTabIndex: int = 0

  action init = all {
    hasFocus' = false,
    active' = 0,
    selected' = 0,
    followsFocus' = false,
    controlled' = false,
    accepting' = false,
    valueProp0' = false,
    valueProp1' = false,
    valueProp2' = false,
    valueProp3' = false,
    valueProp4' = false,
    valueProp5' = false,
    requested' = 0,
    outcome' = "none",
    base' = 0,
    requests' = 0
  }

  // mount: the uncontrolled initial selection (the host's `defaultValue`),
  // active at the first option, exactly as the primitive mounts
  action seed = {
    nondet index = Set(0, 1, 2, 3, 4, 5, 6).oneOf()
    all {
      hasFocus' = false,
      active' = 0,
      selected' = if (index == noOption) 0 else pow2(index),
      followsFocus' = followsFocus,
      controlled' = false,
      accepting' = false,
      valueProp0' = false,
      valueProp1' = false,
      valueProp2' = false,
      valueProp3' = false,
      valueProp4' = false,
      valueProp5' = false,
      requested' = 0,
      outcome' = "none",
      base' = 0,
      requests' = 0
    }
  }

  // Tab into the listbox: focus the selected option, else the first. With
  // followsFocus the entry option is selected too; already focused is a no-op.
  action focus_in = all {
    hasFocus' = true,
    active' = if (hasFocus) active else entryIndex(selected),
    selected' = landed(holds, selected, focusIntent),
    followsFocus' = followsFocus,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, focusIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, focusIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, focusIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, focusIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, focusIntent, 4),
    valueProp5' = propBit(hostWrites, valueProp5, focusIntent, 5),
    requested' = if (focusIntent != selected) focusIntent else requested,
    outcome' = if (focusIntent != selected) verdict else outcome,
    base' = if (focusIntent != selected) selected else base,
    requests' = if (focusIntent != selected) requests + 1 else requests
  }

  // Tab out: the selection is kept.
  action blur = all {
    hasFocus' = false,
    active' = active,
    selected' = selected,
    followsFocus' = followsFocus,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    valueProp5' = valueProp5,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action arrow_down = all {
    hasFocus' = hasFocus,
    active' = if (hasFocus) nextIndex(active) else active,
    selected' = landed(holds, selected, downIntent),
    followsFocus' = followsFocus,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, downIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, downIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, downIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, downIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, downIntent, 4),
    valueProp5' = propBit(hostWrites, valueProp5, downIntent, 5),
    requested' = if (downIntent != selected) downIntent else requested,
    outcome' = if (downIntent != selected) verdict else outcome,
    base' = if (downIntent != selected) selected else base,
    requests' = if (downIntent != selected) requests + 1 else requests
  }

  action arrow_up = all {
    hasFocus' = hasFocus,
    active' = if (hasFocus) prevIndex(active) else active,
    selected' = landed(holds, selected, upIntent),
    followsFocus' = followsFocus,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, upIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, upIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, upIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, upIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, upIntent, 4),
    valueProp5' = propBit(hostWrites, valueProp5, upIntent, 5),
    requested' = if (upIntent != selected) upIntent else requested,
    outcome' = if (upIntent != selected) verdict else outcome,
    base' = if (upIntent != selected) selected else base,
    requests' = if (upIntent != selected) requests + 1 else requests
  }

  action home = all {
    hasFocus' = hasFocus,
    active' = if (hasFocus) 0 else active,
    selected' = landed(holds, selected, homeIntent),
    followsFocus' = followsFocus,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, homeIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, homeIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, homeIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, homeIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, homeIntent, 4),
    valueProp5' = propBit(hostWrites, valueProp5, homeIntent, 5),
    requested' = if (homeIntent != selected) homeIntent else requested,
    outcome' = if (homeIntent != selected) verdict else outcome,
    base' = if (homeIntent != selected) selected else base,
    requests' = if (homeIntent != selected) requests + 1 else requests
  }

  action end = all {
    hasFocus' = hasFocus,
    active' = if (hasFocus) lastIndex else active,
    selected' = landed(holds, selected, endIntent),
    followsFocus' = followsFocus,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, endIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, endIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, endIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, endIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, endIntent, 4),
    valueProp5' = propBit(hostWrites, valueProp5, endIntent, 5),
    requested' = if (endIntent != selected) endIntent else requested,
    outcome' = if (endIntent != selected) verdict else outcome,
    base' = if (endIntent != selected) selected else base,
    requests' = if (endIntent != selected) requests + 1 else requests
  }

  // Select the active option (single-select: replaces the selection).
  action space = all {
    hasFocus' = hasFocus,
    active' = active,
    selected' = landed(holds, selected, spaceIntent),
    followsFocus' = followsFocus,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, spaceIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, spaceIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, spaceIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, spaceIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, spaceIntent, 4),
    valueProp5' = propBit(hostWrites, valueProp5, spaceIntent, 5),
    requested' = if (spaceIntent != selected) spaceIntent else requested,
    outcome' = if (spaceIntent != selected) verdict else outcome,
    base' = if (spaceIntent != selected) selected else base,
    requests' = if (spaceIntent != selected) requests + 1 else requests
  }

  // Pointer: focus the option and select it.
  action click = {
    nondet index = Set(0, 1, 2, 3, 4, 5).oneOf()
    all {
      hasFocus' = true,
      active' = index,
      selected' = landed(holds, selected, pow2(index)),
      followsFocus' = followsFocus,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = propBit(hostWrites, valueProp0, pow2(index), 0),
      valueProp1' = propBit(hostWrites, valueProp1, pow2(index), 1),
      valueProp2' = propBit(hostWrites, valueProp2, pow2(index), 2),
      valueProp3' = propBit(hostWrites, valueProp3, pow2(index), 3),
      valueProp4' = propBit(hostWrites, valueProp4, pow2(index), 4),
      valueProp5' = propBit(hostWrites, valueProp5, pow2(index), 5),
      requested' = if (pow2(index) != selected) pow2(index) else requested,
      outcome' = if (pow2(index) != selected) verdict else outcome,
      base' = if (pow2(index) != selected) selected else base,
      requests' = if (pow2(index) != selected) requests + 1 else requests
    }
  }

  action set_follows_focus = {
    nondet follow = Set(true, false).oneOf()
    all {
      hasFocus' = hasFocus,
      active' = active,
      selected' = landed(holds, selected, followsIntent(follow)),
      followsFocus' = follow,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = propBit(hostWrites, valueProp0, followsIntent(follow), 0),
      valueProp1' = propBit(hostWrites, valueProp1, followsIntent(follow), 1),
      valueProp2' = propBit(hostWrites, valueProp2, followsIntent(follow), 2),
      valueProp3' = propBit(hostWrites, valueProp3, followsIntent(follow), 3),
      valueProp4' = propBit(hostWrites, valueProp4, followsIntent(follow), 4),
      valueProp5' = propBit(hostWrites, valueProp5, followsIntent(follow), 5),
      requested' = if (followsIntent(follow) != selected) followsIntent(follow) else requested,
      outcome' = if (followsIntent(follow) != selected) verdict else outcome,
      base' = if (followsIntent(follow) != selected) selected else base,
      requests' = if (followsIntent(follow) != selected) requests + 1 else requests
    }
  }

  // commit: the host writes the controlled value (a no-op while uncontrolled)
  action setValue = {
    nondet v = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63).oneOf()
    all {
      hasFocus' = hasFocus,
      active' = active,
      selected' = if (controlled) v else selected,
      followsFocus' = followsFocus,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = if (controlled) bit(v, 0) else valueProp0,
      valueProp1' = if (controlled) bit(v, 1) else valueProp1,
      valueProp2' = if (controlled) bit(v, 2) else valueProp2,
      valueProp3' = if (controlled) bit(v, 3) else valueProp3,
      valueProp4' = if (controlled) bit(v, 4) else valueProp4,
      valueProp5' = if (controlled) bit(v, 5) else valueProp5,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips one option of its own copy of the value
  action hostToggle = {
    nondet panel = Set(0, 1, 2, 3, 4, 5).oneOf()
    all {
      hasFocus' = hasFocus,
      active' = active,
      selected' = if (controlled) flipAt(propsMask, panel) else selected,
      followsFocus' = followsFocus,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = if (controlled) bit(flipAt(propsMask, panel), 0) else valueProp0,
      valueProp1' = if (controlled) bit(flipAt(propsMask, panel), 1) else valueProp1,
      valueProp2' = if (controlled) bit(flipAt(propsMask, panel), 2) else valueProp2,
      valueProp3' = if (controlled) bit(flipAt(propsMask, panel), 3) else valueProp3,
      valueProp4' = if (controlled) bit(flipAt(propsMask, panel), 4) else valueProp4,
      valueProp5' = if (controlled) bit(flipAt(propsMask, panel), 5) else valueProp5,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // configuration: the host starts owning the value, adopting the current one
  action control = all {
    hasFocus' = hasFocus,
    active' = active,
    selected' = selected,
    followsFocus' = followsFocus,
    controlled' = true,
    accepting' = accepting,
    valueProp0' = bit(selected, 0),
    valueProp1' = bit(selected, 1),
    valueProp2' = bit(selected, 2),
    valueProp3' = bit(selected, 3),
    valueProp4' = bit(selected, 4),
    valueProp5' = bit(selected, 5),
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    hasFocus' = hasFocus,
    active' = active,
    selected' = selected,
    followsFocus' = followsFocus,
    controlled' = controlled,
    accepting' = true,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    valueProp5' = valueProp5,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, seed, focus_in, blur, arrow_down, arrow_up, home, end, space, click,
    set_follows_focus, setValue, hostToggle, control, acceptRequests
  }

  // APG: no more than one option is selected without aria-multiselectable
  // (uncontrolled: a controlled host owns the value and may hand us any set)
  val SingleSelectAtMostOne: bool = ariaSingleHoldsAtMostOne(controlled, false, popcount(selected))
  // the mask only ever names real options
  val SelectionInRange: bool = and(selected >= 0, selected < pow2(optionCount))
  // the active option is always a real option
  val ActiveInRange: bool = and(active >= 0, active <= lastIndex)
  // aria-activedescendant is set exactly while the listbox holds focus
  val ActiveDescendantTracksFocus: bool =
    (ariaActiveDescendant(hasFocus, active) == noOption) == not(hasFocus)
  // selection follows focus: the focused option is the selected one (uncontrolled)
  val SelectionFollowsFocus: bool =
    or(controlled, not(followsFocus), not(hasFocus), selected == pow2(active))
  // a single-select listbox never advertises aria-multiselectable
  val AriaMultiselectableFalse: bool = ariaMultiselectable == false
  // every option group holds at least one option
  val GroupsNonEmpty: bool =
    and(groupOf(0) == 0, groupOf(groupSize - 1) == 0, groupOf(groupSize) == 1, groupOf(lastIndex) == 1)
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), selected == propsMask)
  // a rejected request leaves the state as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), selected == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), selected == requested)
}
