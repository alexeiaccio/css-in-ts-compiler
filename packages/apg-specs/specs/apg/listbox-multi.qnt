// APG Listbox, multi-select — https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
//
// Sections modelled:
//   - "Keyboard Interaction" -> "Multiple Selection": BOTH interaction models.
//       recommended  no modifier needed: Space toggles; Shift+Down/Up move focus
//                    and toggle the entered option; Shift+Space selects the
//                    contiguous run from the most recently selected option to the
//                    focused one; Ctrl+Shift+Home/End select to the first/last
//                    option and move focus there; Ctrl+A selects all (and, as in
//                    the rearrangeable example, unselects all when all are
//                    selected).
//       alternative  plain Up/Down/Home/End move focus AND collapse the selection
//                    to the focused option; Ctrl+Down/Up move focus only;
//                    Ctrl+Space toggles; Shift+Down/Up, Shift+Space,
//                    Ctrl+Shift+Home/End and Ctrl+A as above.
//     and the multi-select focus rule: on entry focus the first selected option,
//     else the first option, with no selection change.
//   - "WAI-ARIA Roles, States, and Properties": aria-multiselectable=true,
//     aria-selected on each option, aria-activedescendant.
//   - Note 1 of the keyboard section: focus is distinct from selection.
//   - Example listbox-rearrangeable, example 2 (the multi-select side).
//
// State: focus, the active option, the selection as a bitmask over five options,
// the selection anchor (the most recently selected option, the start of a
// Shift+Space run), the selection model (a prop), and lastOp — the kind of the
// last handled operation, which lets invariants state per-operation guarantees
// ("after a range select the run is selected") without a history.
//
// Request vs commit (map ticket rt1p). Every event a user would see as a
// selection change — the plain moves in the alternative model, Space/Ctrl+Space,
// the Shift chords, Ctrl+Shift+Home/End, Ctrl+A and click — is a *request*
// carrying the intended selection mask. It fires onValueChange (`requests`
// counts the calls) when the intent differs from the current selection, and the
// selection commits through `landed(holds, selected, intent)`:
//   uncontrolled        accepted: the selection commits the intent
//   controlled, holds   rejected: the selection is untouched
//   controlled, accepts accepted through the controlled value (hostWrites)
// The controlled value is `valueProp0..valueProp4` (one bool per option), the
// only thing that changes the selection while `controlled`; `setValue` /
// `hostToggle` are the host writing it. `control` / `acceptRequests` are
// configuration events (init is literal-only). active focus stays
// widget-internal, so a rejected request still moves it.
//
// The per-operation invariants (AnchorSelectedOrNone, the alternative collapse
// rules, the range rules) are scoped to the uncontrolled path: a controlled host
// owns the value and may hand the widget any set, so its anchor/lastOp bookkeeping
// is not constrained.
//
// Choices where the pattern leaves a gap (ponytail):
//   - in the recommended model Ctrl+Arrow and Ctrl+Space are not handled; in the
//     alternative model plain Space is not handled (the pattern lists only
//     Ctrl+Space there)
//   - Shift+Arrow at the first/last option does nothing (no move, no toggle)
//   - a pointer click toggles in the recommended model and selects only the
//     clicked option in the alternative model (the example's click handler
//     toggles; the alternative model's "selection collapses" rule is applied)
//   - the anchor is the last option toggled ON; deselecting the anchor clears it,
//     so the anchor is always a selected option or "none"
//   - Ctrl+Shift+Home/End also move focus to the first/last option (the
//     pattern's optional part)
//
// Deliberate omissions: typeahead (listbox-typeahead.qnt), rearranging
// (listbox-rearrangeable.qnt), scrolling, horizontal orientation, aria-checked,
// Shift+click and Ctrl+click ranges, labels, disabled options, wrap-around.
//
// Generator notes: no parameterized actions and no `let`, so a request spells
// `landed(...)` out per assignment and every action assigns every var.
module apg_listbox_multi {
  var hasFocus: bool      // the listbox is the focused element
  var active: int         // the active option (aria-activedescendant target)
  var selected: int       // selection bitmask over the options (bit i = option i)
  var anchor: int         // most recently selected option (noOption = none)
  var selectionModel: str // prop: "recommended" | "alternative"
  var lastOp: str         // kind of the last handled operation
  var controlled: bool    // the host owns the value (`value` prop present)
  var accepting: bool     // controlled host that answers every request with its intent
  var valueProp0: bool    // the controlled value prop, one bool per option
  var valueProp1: bool
  var valueProp2: bool
  var valueProp3: bool
  var valueProp4: bool
  var requested: int      // intent of the last request (selection mask)
  var outcome: str        // "none" | "accepted" | "rejected"
  var base: int           // selection when the last request was received
  var requests: int       // number of requests that fired onValueChange

  // five options
  def optionCount: int = 5
  def lastIndex: int = 4
  def noOption: int = 5

  def pow2(i: int): int =
    if (i == 0) 1
    else if (i == 1) 2
    else if (i == 2) 4
    else if (i == 3) 8
    else if (i == 4) 16
    else 32
  // bit i of a selection mask: option i is selected
  def bit(mask: int, i: int): bool = (mask / pow2(i)) % 2 == 1
  def popcount(mask: int): int =
    (if (bit(mask, 0)) 1 else 0)
    + (if (bit(mask, 1)) 1 else 0)
    + (if (bit(mask, 2)) 1 else 0)
    + (if (bit(mask, 3)) 1 else 0)
    + (if (bit(mask, 4)) 1 else 0)
  def firstSelected(mask: int): int =
    if (bit(mask, 0)) 0
    else if (bit(mask, 1)) 1
    else if (bit(mask, 2)) 2
    else if (bit(mask, 3)) 3
    else if (bit(mask, 4)) 4
    else noOption
  // Tab entry: the first selected option, else the first option
  def entryIndex(mask: int): int = if (mask == 0) 0 else firstSelected(mask)
  def nextIndex(i: int): int = if (i < lastIndex) i + 1 else i
  def prevIndex(i: int): int = if (i > 0) i - 1 else i
  def allMask: int = pow2(optionCount) - 1
  def isAlt(model: str): bool = model == "alternative"

  // --- mask arithmetic (the subset has no bitwise operators) ---------------
  def bitVal(mask: int, i: int): int = if (bit(mask, i)) pow2(i) else 0
  def orMask(a: int, b: int): int =
    (if (or(bit(a, 0), bit(b, 0))) 1 else 0)
    + (if (or(bit(a, 1), bit(b, 1))) 2 else 0)
    + (if (or(bit(a, 2), bit(b, 2))) 4 else 0)
    + (if (or(bit(a, 3), bit(b, 3))) 8 else 0)
    + (if (or(bit(a, 4), bit(b, 4))) 16 else 0)
  def toggle(mask: int, i: int): int =
    if (bit(mask, i)) mask - pow2(i) else mask + pow2(i)
  def loOf(a: int, b: int): int = if (a < b) a else b
  def hiOf(a: int, b: int): int = if (a < b) b else a
  // options lo..hi inclusive
  def rangeMask(lo: int, hi: int): int =
    if (lo > hi) 0 else pow2(hi + 1) - pow2(lo)

  // --- selection rules -----------------------------------------------------
  // the anchor after toggling option i (mask is the mask BEFORE the toggle)
  def anchorAfterToggle(mask: int, anch: int, i: int): int =
    if (bit(mask, i)) (if (anch == i) noOption else anch) else i
  // alternative model: a plain move collapses the selection to the target
  def selectionAfterPlainMove(model: str, mask: int, target: int): int =
    if (isAlt(model)) pow2(target) else mask
  def anchorAfterPlainMove(model: str, anch: int, target: int): int =
    if (isAlt(model)) target else anch
  def runStart(anch: int, act: int): int = if (anch == noOption) act else anch

  // --- request / commit (map ticket rt1p) ---------------------------------
  def b2i(b: bool): int = if (b) 1 else 0
  // the controlled value prop, packed into a mask
  def propsMask: int =
    b2i(valueProp0)
    + 2 * b2i(valueProp1)
    + 4 * b2i(valueProp2)
    + 8 * b2i(valueProp3)
    + 16 * b2i(valueProp4)
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
  def downIntent: int =
    if (hasFocus) selectionAfterPlainMove(selectionModel, selected, nextIndex(active)) else selected
  def upIntent: int =
    if (hasFocus) selectionAfterPlainMove(selectionModel, selected, prevIndex(active)) else selected
  def homeIntent: int =
    if (hasFocus) selectionAfterPlainMove(selectionModel, selected, 0) else selected
  def endIntent: int =
    if (hasFocus) selectionAfterPlainMove(selectionModel, selected, lastIndex) else selected
  def spaceIntent: int =
    if (and(hasFocus, not(isAlt(selectionModel)))) toggle(selected, active) else selected
  def ctrlSpaceIntent: int =
    if (and(hasFocus, isAlt(selectionModel))) toggle(selected, active) else selected
  def shiftDownIntent: int =
    if (and(hasFocus, nextIndex(active) != active)) toggle(selected, nextIndex(active)) else selected
  def shiftUpIntent: int =
    if (and(hasFocus, prevIndex(active) != active)) toggle(selected, prevIndex(active)) else selected
  def shiftSpaceIntent: int =
    if (hasFocus) orMask(selected, rangeMask(loOf(runStart(anchor, active), active), hiOf(runStart(anchor, active), active))) else selected
  def ctrlShiftHomeIntent: int =
    if (hasFocus) orMask(selected, rangeMask(0, active)) else selected
  def ctrlShiftEndIntent: int =
    if (hasFocus) orMask(selected, rangeMask(active, lastIndex)) else selected
  def ctrlAIntent: int =
    if (hasFocus) (if (selected == allMask) 0 else allMask) else selected
  def clickIntent(index: int): int =
    if (isAlt(selectionModel)) pow2(index) else toggle(selected, index)

  // --- ARIA contract, derived from the state ------------------------------
  def ariaMultiselectable: bool = true
  def ariaActiveDescendant(focused: bool, idx: int): int =
    if (focused) idx else noOption
  def ariaSelected(mask: int, i: int): bool = bit(mask, i)
  def listboxTabIndex: int = 0

  action init = all {
    hasFocus' = false,
    active' = 0,
    selected' = 0,
    anchor' = noOption,
    selectionModel' = "recommended",
    lastOp' = "none",
    controlled' = false,
    accepting' = false,
    valueProp0' = false,
    valueProp1' = false,
    valueProp2' = false,
    valueProp3' = false,
    valueProp4' = false,
    requested' = 0,
    outcome' = "none",
    base' = 0,
    requests' = 0
  }

  // mount: the uncontrolled initial selection (the host's `defaultValue`),
  // active at the first option and no anchor, exactly as the primitive mounts
  action seed = {
    nondet v = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31).oneOf()
    all {
      hasFocus' = false,
      active' = 0,
      selected' = v,
      anchor' = noOption,
      selectionModel' = selectionModel,
      lastOp' = "none",
      controlled' = false,
      accepting' = false,
      valueProp0' = false,
      valueProp1' = false,
      valueProp2' = false,
      valueProp3' = false,
      valueProp4' = false,
      requested' = 0,
      outcome' = "none",
      base' = 0,
      requests' = 0
    }
  }

  // Tab into the listbox: focus the first selected option, else the first.
  // No selection change; already focused is a no-op.
  action focus_in = all {
    hasFocus' = true,
    active' = if (hasFocus) active else entryIndex(selected),
    selected' = selected,
    anchor' = anchor,
    selectionModel' = selectionModel,
    lastOp' = if (hasFocus) lastOp else "focus",
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // Tab out: the selection is kept.
  action blur = all {
    hasFocus' = false,
    active' = active,
    selected' = selected,
    anchor' = anchor,
    selectionModel' = selectionModel,
    lastOp' = "blur",
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // Plain moves: focus only (recommended) / focus + collapse the selection
  // to the target (alternative).
  action arrow_down = all {
    hasFocus' = hasFocus,
    active' = if (hasFocus) nextIndex(active) else active,
    selected' = landed(holds, selected, downIntent),
    anchor' = if (hasFocus) anchorAfterPlainMove(selectionModel, anchor, nextIndex(active)) else anchor,
    selectionModel' = selectionModel,
    lastOp' = if (hasFocus) "move" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, downIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, downIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, downIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, downIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, downIntent, 4),
    requested' = if (downIntent != selected) downIntent else requested,
    outcome' = if (downIntent != selected) verdict else outcome,
    base' = if (downIntent != selected) selected else base,
    requests' = if (downIntent != selected) requests + 1 else requests
  }

  action arrow_up = all {
    hasFocus' = hasFocus,
    active' = if (hasFocus) prevIndex(active) else active,
    selected' = landed(holds, selected, upIntent),
    anchor' = if (hasFocus) anchorAfterPlainMove(selectionModel, anchor, prevIndex(active)) else anchor,
    selectionModel' = selectionModel,
    lastOp' = if (hasFocus) "move" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, upIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, upIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, upIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, upIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, upIntent, 4),
    requested' = if (upIntent != selected) upIntent else requested,
    outcome' = if (upIntent != selected) verdict else outcome,
    base' = if (upIntent != selected) selected else base,
    requests' = if (upIntent != selected) requests + 1 else requests
  }

  action home = all {
    hasFocus' = hasFocus,
    active' = if (hasFocus) 0 else active,
    selected' = landed(holds, selected, homeIntent),
    anchor' = if (hasFocus) anchorAfterPlainMove(selectionModel, anchor, 0) else anchor,
    selectionModel' = selectionModel,
    lastOp' = if (hasFocus) "move" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, homeIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, homeIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, homeIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, homeIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, homeIntent, 4),
    requested' = if (homeIntent != selected) homeIntent else requested,
    outcome' = if (homeIntent != selected) verdict else outcome,
    base' = if (homeIntent != selected) selected else base,
    requests' = if (homeIntent != selected) requests + 1 else requests
  }

  action end = all {
    hasFocus' = hasFocus,
    active' = if (hasFocus) lastIndex else active,
    selected' = landed(holds, selected, endIntent),
    anchor' = if (hasFocus) anchorAfterPlainMove(selectionModel, anchor, lastIndex) else anchor,
    selectionModel' = selectionModel,
    lastOp' = if (hasFocus) "move" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, endIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, endIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, endIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, endIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, endIntent, 4),
    requested' = if (endIntent != selected) endIntent else requested,
    outcome' = if (endIntent != selected) verdict else outcome,
    base' = if (endIntent != selected) selected else base,
    requests' = if (endIntent != selected) requests + 1 else requests
  }

  // Recommended model: Space toggles the active option.
  action space = all {
    hasFocus' = hasFocus,
    active' = active,
    selected' = landed(holds, selected, spaceIntent),
    anchor' = if (and(hasFocus, not(isAlt(selectionModel)))) anchorAfterToggle(selected, anchor, active) else anchor,
    selectionModel' = selectionModel,
    lastOp' = if (and(hasFocus, not(isAlt(selectionModel)))) "toggle" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, spaceIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, spaceIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, spaceIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, spaceIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, spaceIntent, 4),
    requested' = if (spaceIntent != selected) spaceIntent else requested,
    outcome' = if (spaceIntent != selected) verdict else outcome,
    base' = if (spaceIntent != selected) selected else base,
    requests' = if (spaceIntent != selected) requests + 1 else requests
  }

  // Alternative model: Ctrl+Space toggles the active option.
  action ctrl_space = all {
    hasFocus' = hasFocus,
    active' = active,
    selected' = landed(holds, selected, ctrlSpaceIntent),
    anchor' = if (and(hasFocus, isAlt(selectionModel))) anchorAfterToggle(selected, anchor, active) else anchor,
    selectionModel' = selectionModel,
    lastOp' = if (and(hasFocus, isAlt(selectionModel))) "toggle" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, ctrlSpaceIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, ctrlSpaceIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, ctrlSpaceIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, ctrlSpaceIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, ctrlSpaceIntent, 4),
    requested' = if (ctrlSpaceIntent != selected) ctrlSpaceIntent else requested,
    outcome' = if (ctrlSpaceIntent != selected) verdict else outcome,
    base' = if (ctrlSpaceIntent != selected) selected else base,
    requests' = if (ctrlSpaceIntent != selected) requests + 1 else requests
  }

  // Shift+Arrow (both models): move focus to and toggle the entered option.
  action shift_arrow_down = all {
    hasFocus' = hasFocus,
    active' = if (and(hasFocus, nextIndex(active) != active)) nextIndex(active) else active,
    selected' = landed(holds, selected, shiftDownIntent),
    anchor' = if (and(hasFocus, nextIndex(active) != active)) anchorAfterToggle(selected, anchor, nextIndex(active)) else anchor,
    selectionModel' = selectionModel,
    lastOp' = if (and(hasFocus, nextIndex(active) != active)) "toggle" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, shiftDownIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, shiftDownIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, shiftDownIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, shiftDownIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, shiftDownIntent, 4),
    requested' = if (shiftDownIntent != selected) shiftDownIntent else requested,
    outcome' = if (shiftDownIntent != selected) verdict else outcome,
    base' = if (shiftDownIntent != selected) selected else base,
    requests' = if (shiftDownIntent != selected) requests + 1 else requests
  }

  action shift_arrow_up = all {
    hasFocus' = hasFocus,
    active' = if (and(hasFocus, prevIndex(active) != active)) prevIndex(active) else active,
    selected' = landed(holds, selected, shiftUpIntent),
    anchor' = if (and(hasFocus, prevIndex(active) != active)) anchorAfterToggle(selected, anchor, prevIndex(active)) else anchor,
    selectionModel' = selectionModel,
    lastOp' = if (and(hasFocus, prevIndex(active) != active)) "toggle" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, shiftUpIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, shiftUpIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, shiftUpIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, shiftUpIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, shiftUpIntent, 4),
    requested' = if (shiftUpIntent != selected) shiftUpIntent else requested,
    outcome' = if (shiftUpIntent != selected) verdict else outcome,
    base' = if (shiftUpIntent != selected) selected else base,
    requests' = if (shiftUpIntent != selected) requests + 1 else requests
  }

  // Alternative model: Ctrl+Arrow moves focus without touching the selection.
  action ctrl_arrow_down = all {
    hasFocus' = hasFocus,
    active' = if (and(hasFocus, isAlt(selectionModel))) nextIndex(active) else active,
    selected' = selected,
    anchor' = anchor,
    selectionModel' = selectionModel,
    lastOp' = if (and(hasFocus, isAlt(selectionModel))) "ctrl_move" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action ctrl_arrow_up = all {
    hasFocus' = hasFocus,
    active' = if (and(hasFocus, isAlt(selectionModel))) prevIndex(active) else active,
    selected' = selected,
    anchor' = anchor,
    selectionModel' = selectionModel,
    lastOp' = if (and(hasFocus, isAlt(selectionModel))) "ctrl_move" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // Select the contiguous run from the anchor to the active option (the
  // anchor starts as the active option when there is none).
  action shift_space = all {
    hasFocus' = hasFocus,
    active' = active,
    selected' = landed(holds, selected, shiftSpaceIntent),
    anchor' = if (hasFocus) runStart(anchor, active) else anchor,
    selectionModel' = selectionModel,
    lastOp' = if (hasFocus) "range" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, shiftSpaceIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, shiftSpaceIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, shiftSpaceIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, shiftSpaceIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, shiftSpaceIntent, 4),
    requested' = if (shiftSpaceIntent != selected) shiftSpaceIntent else requested,
    outcome' = if (shiftSpaceIntent != selected) verdict else outcome,
    base' = if (shiftSpaceIntent != selected) selected else base,
    requests' = if (shiftSpaceIntent != selected) requests + 1 else requests
  }

  // Select the active option and everything above it; focus moves to the first.
  action ctrl_shift_home = all {
    hasFocus' = hasFocus,
    active' = if (hasFocus) 0 else active,
    selected' = landed(holds, selected, ctrlShiftHomeIntent),
    anchor' = anchor,
    selectionModel' = selectionModel,
    lastOp' = if (hasFocus) "range_home" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, ctrlShiftHomeIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, ctrlShiftHomeIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, ctrlShiftHomeIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, ctrlShiftHomeIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, ctrlShiftHomeIntent, 4),
    requested' = if (ctrlShiftHomeIntent != selected) ctrlShiftHomeIntent else requested,
    outcome' = if (ctrlShiftHomeIntent != selected) verdict else outcome,
    base' = if (ctrlShiftHomeIntent != selected) selected else base,
    requests' = if (ctrlShiftHomeIntent != selected) requests + 1 else requests
  }

  // Select the active option and everything below it; focus moves to the last.
  action ctrl_shift_end = all {
    hasFocus' = hasFocus,
    active' = if (hasFocus) lastIndex else active,
    selected' = landed(holds, selected, ctrlShiftEndIntent),
    anchor' = anchor,
    selectionModel' = selectionModel,
    lastOp' = if (hasFocus) "range_end" else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, ctrlShiftEndIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, ctrlShiftEndIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, ctrlShiftEndIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, ctrlShiftEndIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, ctrlShiftEndIntent, 4),
    requested' = if (ctrlShiftEndIntent != selected) ctrlShiftEndIntent else requested,
    outcome' = if (ctrlShiftEndIntent != selected) verdict else outcome,
    base' = if (ctrlShiftEndIntent != selected) selected else base,
    requests' = if (ctrlShiftEndIntent != selected) requests + 1 else requests
  }

  // Select all; when everything is already selected, unselect all.
  action ctrl_a = all {
    hasFocus' = hasFocus,
    active' = active,
    selected' = landed(holds, selected, ctrlAIntent),
    anchor' = if (and(hasFocus, selected == allMask)) noOption else anchor,
    selectionModel' = selectionModel,
    lastOp' = if (hasFocus) (if (selected == allMask) "clear_all" else "select_all") else lastOp,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, ctrlAIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, ctrlAIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, ctrlAIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, ctrlAIntent, 3),
    valueProp4' = propBit(hostWrites, valueProp4, ctrlAIntent, 4),
    requested' = if (ctrlAIntent != selected) ctrlAIntent else requested,
    outcome' = if (ctrlAIntent != selected) verdict else outcome,
    base' = if (ctrlAIntent != selected) selected else base,
    requests' = if (ctrlAIntent != selected) requests + 1 else requests
  }

  // Pointer: focus the option; toggle it (recommended) or select only it
  // (alternative).
  action click = {
    nondet index = Set(0, 1, 2, 3, 4).oneOf()
    all {
      hasFocus' = true,
      active' = index,
      selected' = landed(holds, selected, clickIntent(index)),
      anchor' = if (isAlt(selectionModel)) index else anchorAfterToggle(selected, anchor, index),
      selectionModel' = selectionModel,
      lastOp' = "click",
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = propBit(hostWrites, valueProp0, clickIntent(index), 0),
      valueProp1' = propBit(hostWrites, valueProp1, clickIntent(index), 1),
      valueProp2' = propBit(hostWrites, valueProp2, clickIntent(index), 2),
      valueProp3' = propBit(hostWrites, valueProp3, clickIntent(index), 3),
      valueProp4' = propBit(hostWrites, valueProp4, clickIntent(index), 4),
      requested' = if (clickIntent(index) != selected) clickIntent(index) else requested,
      outcome' = if (clickIntent(index) != selected) verdict else outcome,
      base' = if (clickIntent(index) != selected) selected else base,
      requests' = if (clickIntent(index) != selected) requests + 1 else requests
    }
  }

  // Prop change between the two selection models; the selection is kept.
  action set_selection_model = {
    nondet model = Set("recommended", "alternative").oneOf()
    all {
      hasFocus' = hasFocus,
      active' = active,
      selected' = selected,
      anchor' = anchor,
      selectionModel' = model,
      lastOp' = "config",
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = valueProp0,
      valueProp1' = valueProp1,
      valueProp2' = valueProp2,
      valueProp3' = valueProp3,
      valueProp4' = valueProp4,
      requested' = requested,
      outcome' = outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host writes the controlled value (a no-op while uncontrolled)
  action setValue = {
    nondet v = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31).oneOf()
    all {
      hasFocus' = hasFocus,
      active' = active,
      selected' = if (controlled) v else selected,
      anchor' = anchor,
      selectionModel' = selectionModel,
      lastOp' = lastOp,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = if (controlled) bit(v, 0) else valueProp0,
      valueProp1' = if (controlled) bit(v, 1) else valueProp1,
      valueProp2' = if (controlled) bit(v, 2) else valueProp2,
      valueProp3' = if (controlled) bit(v, 3) else valueProp3,
      valueProp4' = if (controlled) bit(v, 4) else valueProp4,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips one option of its own copy of the value
  action hostToggle = {
    nondet panel = Set(0, 1, 2, 3, 4).oneOf()
    all {
      hasFocus' = hasFocus,
      active' = active,
      selected' = if (controlled) flipAt(propsMask, panel) else selected,
      anchor' = anchor,
      selectionModel' = selectionModel,
      lastOp' = lastOp,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = if (controlled) bit(flipAt(propsMask, panel), 0) else valueProp0,
      valueProp1' = if (controlled) bit(flipAt(propsMask, panel), 1) else valueProp1,
      valueProp2' = if (controlled) bit(flipAt(propsMask, panel), 2) else valueProp2,
      valueProp3' = if (controlled) bit(flipAt(propsMask, panel), 3) else valueProp3,
      valueProp4' = if (controlled) bit(flipAt(propsMask, panel), 4) else valueProp4,
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
    anchor' = anchor,
    selectionModel' = selectionModel,
    lastOp' = lastOp,
    controlled' = true,
    accepting' = accepting,
    valueProp0' = bit(selected, 0),
    valueProp1' = bit(selected, 1),
    valueProp2' = bit(selected, 2),
    valueProp3' = bit(selected, 3),
    valueProp4' = bit(selected, 4),
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
    anchor' = anchor,
    selectionModel' = selectionModel,
    lastOp' = lastOp,
    controlled' = controlled,
    accepting' = true,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    valueProp4' = valueProp4,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, seed, focus_in, blur, arrow_down, arrow_up, home, end, space, ctrl_space,
    shift_arrow_down, shift_arrow_up, ctrl_arrow_down, ctrl_arrow_up, shift_space,
    ctrl_shift_home, ctrl_shift_end, ctrl_a, click, set_selection_model,
    setValue, hostToggle, control, acceptRequests
  }

  // the mask only ever names real options
  val SelectionInRange: bool = and(selected >= 0, selected < pow2(optionCount))
  // the active option is always a real option
  val ActiveInRange: bool = and(active >= 0, active <= lastIndex)
  // aria-activedescendant is set exactly while the listbox holds focus
  val ActiveDescendantTracksFocus: bool =
    (ariaActiveDescendant(hasFocus, active) == noOption) == not(hasFocus)
  // APG: a multi-select listbox sets aria-multiselectable=true
  val AriaMultiselectableTrue: bool = ariaMultiselectable == true
  // the anchor is a selected option or absent (uncontrolled)
  val AnchorSelectedOrNone: bool =
    or(controlled, or(anchor == noOption, and(anchor >= 0, anchor <= lastIndex, bit(selected, anchor))))
  val SelectionModelKnown: bool =
    or(selectionModel == "recommended", selectionModel == "alternative")
  // alternative model: a plain move leaves exactly the focused option selected
  val AlternativeMoveCollapses: bool =
    or(controlled, not(isAlt(selectionModel)), lastOp != "move", selected == pow2(active))
  // alternative model: a click selects only the clicked option
  val AlternativeClickCollapses: bool =
    or(controlled, not(isAlt(selectionModel)), lastOp != "click", selected == pow2(active))
  // Shift+Space: everything between the anchor and the active option is selected
  val RangeSelectsAnchorToActive: bool =
    or(
      controlled,
      lastOp != "range",
      and(
        anchor != noOption,
        orMask(selected, rangeMask(loOf(anchor, active), hiOf(anchor, active))) == selected
      )
    )
  // Ctrl+Shift+Home/End: focus and selection reach the edge
  val RangeToEdgeSelectsEdge: bool =
    or(
      controlled,
      and(
        or(lastOp != "range_home", and(active == 0, bit(selected, 0))),
        or(lastOp != "range_end", and(active == lastIndex, bit(selected, lastIndex)))
      )
    )
  // Ctrl+A: select all / unselect all
  val SelectAllOutcome: bool =
    or(
      controlled,
      and(
        or(lastOp != "select_all", selected == allMask),
        or(lastOp != "clear_all", selected == 0)
      )
    )
  val LastOpKnown: bool =
    or(lastOp == "none",
      lastOp == "focus",
      lastOp == "blur",
      lastOp == "move",
      lastOp == "ctrl_move",
      lastOp == "toggle",
      lastOp == "range",
      lastOp == "range_home",
      lastOp == "range_end",
      lastOp == "select_all",
      lastOp == "clear_all",
      lastOp == "click",
      lastOp == "config")
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), selected == propsMask)
  // a rejected request leaves the state as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), selected == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), selected == requested)
}
