// APG Listbox, rearrangeable options —
// https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/
// (and the pattern page https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
//
// Two listboxes, A and B, share four options (ids 0..3); every option sits in
// exactly one list. Initially A holds all four in order. The machine covers
// both examples of the page:
//   example 1 (single-select, multi = false)  Up/Down reorder the focused option
//             inside its list (Alt+Up / Alt+Down); "Not Important"/"Important"
//             move it to the other list (Delete); selection follows focus.
//   example 2 (multi-select, multi = true)    Space toggles; "Add"/"Remove" move
//             every selected option of the focused list to the other list
//             (Enter / Delete); arrows move focus only.
// The same transfer rule serves both: it moves the SELECTED options of the
// focused list, and in single-select mode "the selected option" is the focused
// one because selection follows focus.
//
// Keyboard facts modelled from the example's "Accessibility Features" and
// keyboard tables:
//   - Tab entry: the first selected option, else the first option
//   - Down/Up/Home/End move focus (and select it in the single-select example)
//   - after a reorder, focus stays on the moved option
//   - after a transfer, focus in the source list lands on the first remaining
//     option after the removed one; if none follows, on the last remaining one
//   - the options keep their order when they move to the other list (appended)
//
// State: the option ids in each list's four slots (4 = empty slot, lists are
// packed to the left), the active option of each list, which list is focused,
// the selection as a bitmask over option ids (selection is a property of the
// option, so it survives reordering without any remapping), and the mode.
//
// Request vs commit (map ticket rt1p). Every event a user would see as a
// selection change — focus_a/focus_b (the single-select entry select), the plain
// moves, Space, transfer (which deselects the moved options) and set_multi (the
// switch back to single-select) — is a *request* carrying the intended selection
// mask. It fires onValueChange (`requests` counts the calls) when the intent
// differs from the current selection, and the selection commits through
// `landed(holds, sel, intent)`:
//   uncontrolled        accepted: the selection commits the intent
//   controlled, holds   rejected: the selection is untouched
//   controlled, accepts accepted through the controlled value (hostWrites)
// The controlled value is `valueProp0..valueProp3` (one bool per option id), the
// only thing that changes the selection while `controlled`; `setValue` /
// `hostToggle` are the host writing it. `control` / `acceptRequests` are
// configuration events (init is literal-only). A rejected transfer moves nothing
// at all (its list surgery is gated on the request landing), so a rejected
// request leaves the whole widget consistent.
//
// Choices (ponytail): a transferred option arrives deselected (selection is a
// per-list concept); toggling the mode to single-select collapses each list's
// selection to its active option; Alt+Up/Down are only handled in single-select
// mode (example 2 has no reorder buttons); the toolbar buttons are modelled by
// their keyboard shortcuts on the focused list, so a transfer with nothing
// selected or no focused list is a no-op.
//
// Deliberate omissions: the live-region "Last change" announcements, the
// toolbar roving tabindex, aria-keyshortcuts, typeahead (listbox-typeahead.qnt),
// scrolling, disabled buttons, and add/remove of brand-new options (the option
// set is fixed at four).
//
// Generator notes: no parameterized actions and no `let`, so a request spells
// `landed(...)` out per assignment and every action assigns every var.
module apg_listbox_rearrangeable {
  import aria.* from "../../shared/aria"

  var a0: int        // list A, slot 0..3: option id (noItem = empty)
  var a1: int        // list A, slot 1
  var a2: int        // list A, slot 2
  var a3: int        // list A, slot 3
  var b0: int        // list B, slot 0..3: option id (noItem = empty)
  var b1: int        // list B, slot 1
  var b2: int        // list B, slot 2
  var b3: int        // list B, slot 3
  var activeA: int   // active option of list A (noItem = list empty)
  var activeB: int   // active option of list B (noItem = list empty)
  var focusList: str // "none" | "a" | "b": the listbox holding focus
  var sel: int       // selection bitmask over option ids
  var multi: bool    // mode: multi-select (example 2) vs single-select (example 1)
  var controlled: bool  // the host owns the value (`value` prop present)
  var accepting: bool   // controlled host that answers every request with its intent
  var valueProp0: bool  // the controlled value prop, one bool per option id
  var valueProp1: bool
  var valueProp2: bool
  var valueProp3: bool
  var requested: int    // intent of the last request (selection mask)
  var outcome: str      // "none" | "accepted" | "rejected"
  var base: int         // selection when the last request was received
  var requests: int     // number of requests that fired onValueChange

  def itemCount: int = 4
  // "no option" / "empty slot" / "not found" sentinel
  def noItem: int = 4

  def pow2(i: int): int =
    if (i == 0) 1
    else if (i == 1) 2
    else if (i == 2) 4
    else if (i == 3) 8
    else 16
  // bit i of a selection mask: option i is selected
  def bit(mask: int, i: int): bool = (mask / pow2(i)) % 2 == 1
  def popcount(mask: int): int =
    (if (bit(mask, 0)) 1 else 0)
    + (if (bit(mask, 1)) 1 else 0)
    + (if (bit(mask, 2)) 1 else 0)
    + (if (bit(mask, 3)) 1 else 0)
  def toggle(mask: int, i: int): int =
    if (bit(mask, i)) mask - pow2(i) else mask + pow2(i)
  def focusBit(opt: int): int = if (opt == noItem) 0 else pow2(opt)

  // --- one list, as four slots ----------------------------------------------
  def slotAt(s0: int, s1: int, s2: int, s3: int, k: int): int =
    if (k == 0) s0
    else if (k == 1) s1
    else if (k == 2) s2
    else if (k == 3) s3
    else noItem
  def lenOf(s0: int, s1: int, s2: int, s3: int): int =
    (if (s0 != noItem) 1 else 0)
    + (if (s1 != noItem) 1 else 0)
    + (if (s2 != noItem) 1 else 0)
    + (if (s3 != noItem) 1 else 0)
  def posOf(s0: int, s1: int, s2: int, s3: int, opt: int): int =
    if (opt == noItem) noItem
    else if (s0 == opt) 0
    else if (s1 == opt) 1
    else if (s2 == opt) 2
    else if (s3 == opt) 3
    else noItem
  def holds(s0: int, s1: int, s2: int, s3: int, opt: int): bool =
    and(opt != noItem, or(s0 == opt, s1 == opt, s2 == opt, s3 == opt))
  def selOf(mask: int, opt: int): int = if (opt == noItem) 0 else (if (bit(mask, opt)) pow2(opt) else 0)
  // the selected options that are in this list, as a mask
  def selIn(mask: int, s0: int, s1: int, s2: int, s3: int): int =
    selOf(mask, s0) + selOf(mask, s1) + selOf(mask, s2) + selOf(mask, s3)
  // Tab entry: the first selected option of the list, else its first option
  def entryItem(mask: int, s0: int, s1: int, s2: int, s3: int): int =
    if (selOf(mask, s0) != 0) s0
    else if (selOf(mask, s1) != 0) s1
    else if (selOf(mask, s2) != 0) s2
    else if (selOf(mask, s3) != 0) s3
    else s0

  // --- keyboard targets inside a list -------------------------------------
  def nextItem(s0: int, s1: int, s2: int, s3: int, act: int): int =
    if (posOf(s0, s1, s2, s3, act) == noItem) noItem
    else slotAt(s0, s1, s2, s3, if (posOf(s0, s1, s2, s3, act) + 1 < lenOf(s0, s1, s2, s3)) posOf(s0, s1, s2, s3, act) + 1 else posOf(s0, s1, s2, s3, act))
  def prevItem(s0: int, s1: int, s2: int, s3: int, act: int): int =
    if (posOf(s0, s1, s2, s3, act) == noItem) noItem
    else slotAt(s0, s1, s2, s3, if (posOf(s0, s1, s2, s3, act) > 0) posOf(s0, s1, s2, s3, act) - 1 else posOf(s0, s1, s2, s3, act))
  def lastItem(s0: int, s1: int, s2: int, s3: int): int = slotAt(s0, s1, s2, s3, lenOf(s0, s1, s2, s3) - 1)

  // --- reordering (Alt+Up / Alt+Down) ---------------------------------------
  def canUp(s0: int, s1: int, s2: int, s3: int, act: int): bool = and(act != noItem, posOf(s0, s1, s2, s3, act) > 0)
  def canDown(s0: int, s1: int, s2: int, s3: int, act: int): bool =
    and(act != noItem, posOf(s0, s1, s2, s3, act) + 1 < lenOf(s0, s1, s2, s3))
  def swapUpSlot(s0: int, s1: int, s2: int, s3: int, act: int, k: int): int =
    if (not(canUp(s0, s1, s2, s3, act))) slotAt(s0, s1, s2, s3, k)
    else if (k == posOf(s0, s1, s2, s3, act) - 1) slotAt(s0, s1, s2, s3, posOf(s0, s1, s2, s3, act))
    else if (k == posOf(s0, s1, s2, s3, act)) slotAt(s0, s1, s2, s3, posOf(s0, s1, s2, s3, act) - 1)
    else slotAt(s0, s1, s2, s3, k)
  def swapDownSlot(s0: int, s1: int, s2: int, s3: int, act: int, k: int): int =
    if (not(canDown(s0, s1, s2, s3, act))) slotAt(s0, s1, s2, s3, k)
    else if (k == posOf(s0, s1, s2, s3, act)) slotAt(s0, s1, s2, s3, posOf(s0, s1, s2, s3, act) + 1)
    else if (k == posOf(s0, s1, s2, s3, act) + 1) slotAt(s0, s1, s2, s3, posOf(s0, s1, s2, s3, act))
    else slotAt(s0, s1, s2, s3, k)

  // --- transferring the selected options to the other list -------------------
  def keeps(mask: int, opt: int): bool = and(opt != noItem, not(bit(mask, opt)))
  def moves(mask: int, opt: int): bool = and(opt != noItem, bit(mask, opt))
  def keepsN(mask: int, opt: int): int = if (keeps(mask, opt)) 1 else 0
  def movesN(mask: int, opt: int): int = if (moves(mask, opt)) 1 else 0
  // how many kept / moved options sit in slots before slot j
  def keptBefore(mask: int, s0: int, s1: int, s2: int, s3: int, j: int): int =
    if (j == 0) 0
    else if (j == 1) keepsN(mask, s0)
    else if (j == 2) keepsN(mask, s0) + keepsN(mask, s1)
    else keepsN(mask, s0) + keepsN(mask, s1) + keepsN(mask, s2)
  def movedBefore(mask: int, s0: int, s1: int, s2: int, s3: int, j: int): int =
    if (j == 0) 0
    else if (j == 1) movesN(mask, s0)
    else if (j == 2) movesN(mask, s0) + movesN(mask, s1)
    else movesN(mask, s0) + movesN(mask, s1) + movesN(mask, s2)
  // the k-th option that stays / leaves, in slot order (noItem = none)
  def keptAt(mask: int, s0: int, s1: int, s2: int, s3: int, k: int): int =
    if (and(keeps(mask, s0), keptBefore(mask, s0, s1, s2, s3, 0) == k)) s0
    else if (and(keeps(mask, s1), keptBefore(mask, s0, s1, s2, s3, 1) == k)) s1
    else if (and(keeps(mask, s2), keptBefore(mask, s0, s1, s2, s3, 2) == k)) s2
    else if (and(keeps(mask, s3), keptBefore(mask, s0, s1, s2, s3, 3) == k)) s3
    else noItem
  def movedAt(mask: int, s0: int, s1: int, s2: int, s3: int, k: int): int =
    if (and(moves(mask, s0), movedBefore(mask, s0, s1, s2, s3, 0) == k)) s0
    else if (and(moves(mask, s1), movedBefore(mask, s0, s1, s2, s3, 1) == k)) s1
    else if (and(moves(mask, s2), movedBefore(mask, s0, s1, s2, s3, 2) == k)) s2
    else if (and(moves(mask, s3), movedBefore(mask, s0, s1, s2, s3, 3) == k)) s3
    else noItem
  def movedCount(mask: int, s0: int, s1: int, s2: int, s3: int): int = popcount(selIn(mask, s0, s1, s2, s3))
  // the destination list: its options, then the moved ones in source order
  def appendAt(mask: int, t0: int, t1: int, t2: int, t3: int, s0: int, s1: int, s2: int, s3: int, k: int): int =
    if (k < lenOf(t0, t1, t2, t3)) slotAt(t0, t1, t2, t3, k)
    else movedAt(mask, s0, s1, s2, s3, k - lenOf(t0, t1, t2, t3))
  // the source list's focus after its selected options left: stay if the
  // focused option stays, else the first kept option after it, else the last
  // kept option before it
  def focusAfterRemoval(mask: int, s0: int, s1: int, s2: int, s3: int, act: int): int =
    if (act == noItem) noItem
    else if (not(moves(mask, act))) act
    else if (and(posOf(s0, s1, s2, s3, act) < 1, keeps(mask, s1))) s1
    else if (and(posOf(s0, s1, s2, s3, act) < 2, keeps(mask, s2))) s2
    else if (and(posOf(s0, s1, s2, s3, act) < 3, keeps(mask, s3))) s3
    else if (and(posOf(s0, s1, s2, s3, act) > 2, keeps(mask, s2))) s2
    else if (and(posOf(s0, s1, s2, s3, act) > 1, keeps(mask, s1))) s1
    else if (and(posOf(s0, s1, s2, s3, act) > 0, keeps(mask, s0))) s0
    else noItem

  // --- request / commit (map ticket rt1p) ---------------------------------
  def b2i(b: bool): int = if (b) 1 else 0
  // the controlled value prop, packed into a mask
  def propsMask: int =
    b2i(valueProp0) + 2 * b2i(valueProp1) + 4 * b2i(valueProp2) + 8 * b2i(valueProp3)
  // the host flips one selected option of its own copy of the value
  def flipAt(n: int, i: int): int = if (bit(n, i)) n - pow2(i) else n + pow2(i)
  // controlled host that keeps the old value: the request is rejected
  def rejects: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def hostWrites: bool = and(controlled, accepting)
  def verdict: str = if (rejects) "rejected" else "accepted"
  // the value after a request for `want`
  def landed(reject: bool, current: int, want: int): int = if (reject) current else want
  // one value-prop member after a request for `want`
  def propBit(writes: bool, current: bool, want: int, i: int): bool =
    if (writes) bit(want, i) else current
  // the intended selection of each request
  def focusAIntent: int =
    if (and(not(multi), not(focusList == "a"))) selIn(sel, b0, b1, b2, b3) + focusBit(entryItem(sel, a0, a1, a2, a3)) else sel
  def focusBIntent: int =
    if (and(not(multi), not(focusList == "b"))) selIn(sel, a0, a1, a2, a3) + focusBit(entryItem(sel, b0, b1, b2, b3)) else sel
  def downIntent: int =
    if (and(not(multi), focusList == "a")) selIn(sel, b0, b1, b2, b3) + focusBit(nextItem(a0, a1, a2, a3, activeA))
    else if (and(not(multi), focusList == "b")) selIn(sel, a0, a1, a2, a3) + focusBit(nextItem(b0, b1, b2, b3, activeB))
    else sel
  def upIntent: int =
    if (and(not(multi), focusList == "a")) selIn(sel, b0, b1, b2, b3) + focusBit(prevItem(a0, a1, a2, a3, activeA))
    else if (and(not(multi), focusList == "b")) selIn(sel, a0, a1, a2, a3) + focusBit(prevItem(b0, b1, b2, b3, activeB))
    else sel
  def homeIntent: int =
    if (and(not(multi), focusList == "a")) selIn(sel, b0, b1, b2, b3) + focusBit(a0)
    else if (and(not(multi), focusList == "b")) selIn(sel, a0, a1, a2, a3) + focusBit(b0)
    else sel
  def endIntent: int =
    if (and(not(multi), focusList == "a")) selIn(sel, b0, b1, b2, b3) + focusBit(lastItem(a0, a1, a2, a3))
    else if (and(not(multi), focusList == "b")) selIn(sel, a0, a1, a2, a3) + focusBit(lastItem(b0, b1, b2, b3))
    else sel
  def spaceIntent: int =
    if (and(multi, focusList == "a", activeA != noItem)) toggle(sel, activeA)
    else if (and(multi, focusList == "b", activeB != noItem)) toggle(sel, activeB)
    else sel
  def transferIntent: int =
    if (and(focusList == "a", movedCount(sel, a0, a1, a2, a3) > 0)) selIn(sel, b0, b1, b2, b3) + (if (multi) 0 else focusBit(focusAfterRemoval(sel, a0, a1, a2, a3, activeA)))
    else if (and(focusList == "b", movedCount(sel, b0, b1, b2, b3) > 0)) selIn(sel, a0, a1, a2, a3) + (if (multi) 0 else focusBit(focusAfterRemoval(sel, b0, b1, b2, b3, activeB)))
    else sel
  def setMultiIntent(flag: bool): int =
    if (flag) sel else focusBit(activeA) + focusBit(activeB)

  // --- ARIA contract, derived from the state ------------------------------
  def ariaSelected(mask: int, opt: int): bool = bit(mask, opt)
  def ariaActiveDescendant(focusedList: str, which: str, act: int): int =
    if (focusedList == which) act else noItem
  def listboxTabIndex: int = 0

  // --- invariant helpers ----------------------------------------------------
  def occurrences(opt: int): int =
    (if (a0 == opt) 1 else 0)
    + (if (a1 == opt) 1 else 0)
    + (if (a2 == opt) 1 else 0)
    + (if (a3 == opt) 1 else 0)
    + (if (b0 == opt) 1 else 0)
    + (if (b1 == opt) 1 else 0)
    + (if (b2 == opt) 1 else 0)
    + (if (b3 == opt) 1 else 0)
  def packed(s0: int, s1: int, s2: int, s3: int): bool =
    and(or(s1 == noItem, s0 != noItem), or(s2 == noItem, s1 != noItem), or(s3 == noItem, s2 != noItem))
  def activeValid(s0: int, s1: int, s2: int, s3: int, act: int): bool =
    if (s0 == noItem) act == noItem else holds(s0, s1, s2, s3, act)

  action init = all {
    a0' = 0,
    a1' = 1,
    a2' = 2,
    a3' = 3,
    b0' = noItem,
    b1' = noItem,
    b2' = noItem,
    b3' = noItem,
    activeA' = 0,
    activeB' = noItem,
    focusList' = "none",
    sel' = 0,
    multi' = false,
    controlled' = false,
    accepting' = false,
    valueProp0' = false,
    valueProp1' = false,
    valueProp2' = false,
    valueProp3' = false,
    requested' = 0,
    outcome' = "none",
    base' = 0,
    requests' = 0
  }

  // Tab into list A (first selected option, else first option).
  action focus_a = all {
    a0' = a0,
    a1' = a1,
    a2' = a2,
    a3' = a3,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    b3' = b3,
    activeA' = if (focusList == "a") activeA else entryItem(sel, a0, a1, a2, a3),
    activeB' = activeB,
    focusList' = "a",
    sel' = landed(rejects, sel, focusAIntent),
    multi' = multi,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, focusAIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, focusAIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, focusAIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, focusAIntent, 3),
    requested' = if (focusAIntent != sel) focusAIntent else requested,
    outcome' = if (focusAIntent != sel) verdict else outcome,
    base' = if (focusAIntent != sel) sel else base,
    requests' = if (focusAIntent != sel) requests + 1 else requests
  }

  // Tab into list B.
  action focus_b = all {
    a0' = a0,
    a1' = a1,
    a2' = a2,
    a3' = a3,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    b3' = b3,
    activeA' = activeA,
    activeB' = if (focusList == "b") activeB else entryItem(sel, b0, b1, b2, b3),
    focusList' = "b",
    sel' = landed(rejects, sel, focusBIntent),
    multi' = multi,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, focusBIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, focusBIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, focusBIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, focusBIntent, 3),
    requested' = if (focusBIntent != sel) focusBIntent else requested,
    outcome' = if (focusBIntent != sel) verdict else outcome,
    base' = if (focusBIntent != sel) sel else base,
    requests' = if (focusBIntent != sel) requests + 1 else requests
  }

  // Tab out of whichever list holds focus.
  action blur = all {
    a0' = a0,
    a1' = a1,
    a2' = a2,
    a3' = a3,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    b3' = b3,
    activeA' = activeA,
    activeB' = activeB,
    focusList' = "none",
    sel' = sel,
    multi' = multi,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // Move focus inside the focused list (and select it in single-select mode).
  action arrow_down = all {
    a0' = a0,
    a1' = a1,
    a2' = a2,
    a3' = a3,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    b3' = b3,
    activeA' = if (focusList == "a") nextItem(a0, a1, a2, a3, activeA) else activeA,
    activeB' = if (focusList == "b") nextItem(b0, b1, b2, b3, activeB) else activeB,
    focusList' = focusList,
    sel' = landed(rejects, sel, downIntent),
    multi' = multi,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, downIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, downIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, downIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, downIntent, 3),
    requested' = if (downIntent != sel) downIntent else requested,
    outcome' = if (downIntent != sel) verdict else outcome,
    base' = if (downIntent != sel) sel else base,
    requests' = if (downIntent != sel) requests + 1 else requests
  }

  action arrow_up = all {
    a0' = a0,
    a1' = a1,
    a2' = a2,
    a3' = a3,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    b3' = b3,
    activeA' = if (focusList == "a") prevItem(a0, a1, a2, a3, activeA) else activeA,
    activeB' = if (focusList == "b") prevItem(b0, b1, b2, b3, activeB) else activeB,
    focusList' = focusList,
    sel' = landed(rejects, sel, upIntent),
    multi' = multi,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, upIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, upIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, upIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, upIntent, 3),
    requested' = if (upIntent != sel) upIntent else requested,
    outcome' = if (upIntent != sel) verdict else outcome,
    base' = if (upIntent != sel) sel else base,
    requests' = if (upIntent != sel) requests + 1 else requests
  }

  action home = all {
    a0' = a0,
    a1' = a1,
    a2' = a2,
    a3' = a3,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    b3' = b3,
    activeA' = if (focusList == "a") a0 else activeA,
    activeB' = if (focusList == "b") b0 else activeB,
    focusList' = focusList,
    sel' = landed(rejects, sel, homeIntent),
    multi' = multi,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, homeIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, homeIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, homeIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, homeIntent, 3),
    requested' = if (homeIntent != sel) homeIntent else requested,
    outcome' = if (homeIntent != sel) verdict else outcome,
    base' = if (homeIntent != sel) sel else base,
    requests' = if (homeIntent != sel) requests + 1 else requests
  }

  action end = all {
    a0' = a0,
    a1' = a1,
    a2' = a2,
    a3' = a3,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    b3' = b3,
    activeA' = if (focusList == "a") lastItem(a0, a1, a2, a3) else activeA,
    activeB' = if (focusList == "b") lastItem(b0, b1, b2, b3) else activeB,
    focusList' = focusList,
    sel' = landed(rejects, sel, endIntent),
    multi' = multi,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, endIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, endIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, endIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, endIntent, 3),
    requested' = if (endIntent != sel) endIntent else requested,
    outcome' = if (endIntent != sel) verdict else outcome,
    base' = if (endIntent != sel) sel else base,
    requests' = if (endIntent != sel) requests + 1 else requests
  }

  // Multi-select: toggle the active option. Single-select: selection already
  // follows focus, nothing to do.
  action space = all {
    a0' = a0,
    a1' = a1,
    a2' = a2,
    a3' = a3,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    b3' = b3,
    activeA' = activeA,
    activeB' = activeB,
    focusList' = focusList,
    sel' = landed(rejects, sel, spaceIntent),
    multi' = multi,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, spaceIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, spaceIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, spaceIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, spaceIntent, 3),
    requested' = if (spaceIntent != sel) spaceIntent else requested,
    outcome' = if (spaceIntent != sel) verdict else outcome,
    base' = if (spaceIntent != sel) sel else base,
    requests' = if (spaceIntent != sel) requests + 1 else requests
  }

  // Alt+Up (single-select): the focused option swaps with its predecessor;
  // focus stays on it.
  action move_up = all {
    a0' = if (and(not(multi), focusList == "a")) swapUpSlot(a0, a1, a2, a3, activeA, 0) else a0,
    a1' = if (and(not(multi), focusList == "a")) swapUpSlot(a0, a1, a2, a3, activeA, 1) else a1,
    a2' = if (and(not(multi), focusList == "a")) swapUpSlot(a0, a1, a2, a3, activeA, 2) else a2,
    a3' = if (and(not(multi), focusList == "a")) swapUpSlot(a0, a1, a2, a3, activeA, 3) else a3,
    b0' = if (and(not(multi), focusList == "b")) swapUpSlot(b0, b1, b2, b3, activeB, 0) else b0,
    b1' = if (and(not(multi), focusList == "b")) swapUpSlot(b0, b1, b2, b3, activeB, 1) else b1,
    b2' = if (and(not(multi), focusList == "b")) swapUpSlot(b0, b1, b2, b3, activeB, 2) else b2,
    b3' = if (and(not(multi), focusList == "b")) swapUpSlot(b0, b1, b2, b3, activeB, 3) else b3,
    activeA' = activeA,
    activeB' = activeB,
    focusList' = focusList,
    sel' = sel,
    multi' = multi,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // Alt+Down (single-select).
  action move_down = all {
    a0' = if (and(not(multi), focusList == "a")) swapDownSlot(a0, a1, a2, a3, activeA, 0) else a0,
    a1' = if (and(not(multi), focusList == "a")) swapDownSlot(a0, a1, a2, a3, activeA, 1) else a1,
    a2' = if (and(not(multi), focusList == "a")) swapDownSlot(a0, a1, a2, a3, activeA, 2) else a2,
    a3' = if (and(not(multi), focusList == "a")) swapDownSlot(a0, a1, a2, a3, activeA, 3) else a3,
    b0' = if (and(not(multi), focusList == "b")) swapDownSlot(b0, b1, b2, b3, activeB, 0) else b0,
    b1' = if (and(not(multi), focusList == "b")) swapDownSlot(b0, b1, b2, b3, activeB, 1) else b1,
    b2' = if (and(not(multi), focusList == "b")) swapDownSlot(b0, b1, b2, b3, activeB, 2) else b2,
    b3' = if (and(not(multi), focusList == "b")) swapDownSlot(b0, b1, b2, b3, activeB, 3) else b3,
    activeA' = activeA,
    activeB' = activeB,
    focusList' = focusList,
    sel' = sel,
    multi' = multi,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // Delete/Enter: move the selected options of the focused list to the other
  // list; they arrive deselected, source focus lands on the next remaining option.
  action transfer = all {
    a0' = if (rejects) a0 else (if (and(focusList == "a", movedCount(sel, a0, a1, a2, a3) > 0)) keptAt(sel, a0, a1, a2, a3, 0) else if (and(focusList == "b", movedCount(sel, b0, b1, b2, b3) > 0)) appendAt(sel, a0, a1, a2, a3, b0, b1, b2, b3, 0) else a0),
    a1' = if (rejects) a1 else (if (and(focusList == "a", movedCount(sel, a0, a1, a2, a3) > 0)) keptAt(sel, a0, a1, a2, a3, 1) else if (and(focusList == "b", movedCount(sel, b0, b1, b2, b3) > 0)) appendAt(sel, a0, a1, a2, a3, b0, b1, b2, b3, 1) else a1),
    a2' = if (rejects) a2 else (if (and(focusList == "a", movedCount(sel, a0, a1, a2, a3) > 0)) keptAt(sel, a0, a1, a2, a3, 2) else if (and(focusList == "b", movedCount(sel, b0, b1, b2, b3) > 0)) appendAt(sel, a0, a1, a2, a3, b0, b1, b2, b3, 2) else a2),
    a3' = if (rejects) a3 else (if (and(focusList == "a", movedCount(sel, a0, a1, a2, a3) > 0)) keptAt(sel, a0, a1, a2, a3, 3) else if (and(focusList == "b", movedCount(sel, b0, b1, b2, b3) > 0)) appendAt(sel, a0, a1, a2, a3, b0, b1, b2, b3, 3) else a3),
    b0' = if (rejects) b0 else (if (and(focusList == "b", movedCount(sel, b0, b1, b2, b3) > 0)) keptAt(sel, b0, b1, b2, b3, 0) else if (and(focusList == "a", movedCount(sel, a0, a1, a2, a3) > 0)) appendAt(sel, b0, b1, b2, b3, a0, a1, a2, a3, 0) else b0),
    b1' = if (rejects) b1 else (if (and(focusList == "b", movedCount(sel, b0, b1, b2, b3) > 0)) keptAt(sel, b0, b1, b2, b3, 1) else if (and(focusList == "a", movedCount(sel, a0, a1, a2, a3) > 0)) appendAt(sel, b0, b1, b2, b3, a0, a1, a2, a3, 1) else b1),
    b2' = if (rejects) b2 else (if (and(focusList == "b", movedCount(sel, b0, b1, b2, b3) > 0)) keptAt(sel, b0, b1, b2, b3, 2) else if (and(focusList == "a", movedCount(sel, a0, a1, a2, a3) > 0)) appendAt(sel, b0, b1, b2, b3, a0, a1, a2, a3, 2) else b2),
    b3' = if (rejects) b3 else (if (and(focusList == "b", movedCount(sel, b0, b1, b2, b3) > 0)) keptAt(sel, b0, b1, b2, b3, 3) else if (and(focusList == "a", movedCount(sel, a0, a1, a2, a3) > 0)) appendAt(sel, b0, b1, b2, b3, a0, a1, a2, a3, 3) else b3),
    activeA' = if (rejects) activeA else (if (and(focusList == "a", movedCount(sel, a0, a1, a2, a3) > 0)) focusAfterRemoval(sel, a0, a1, a2, a3, activeA) else if (and(focusList == "b", movedCount(sel, b0, b1, b2, b3) > 0)) (if (activeA == noItem) movedAt(sel, b0, b1, b2, b3, 0) else activeA) else activeA),
    activeB' = if (rejects) activeB else (if (and(focusList == "b", movedCount(sel, b0, b1, b2, b3) > 0)) focusAfterRemoval(sel, b0, b1, b2, b3, activeB) else if (and(focusList == "a", movedCount(sel, a0, a1, a2, a3) > 0)) (if (activeB == noItem) movedAt(sel, a0, a1, a2, a3, 0) else activeB) else activeB),
    focusList' = focusList,
    sel' = landed(rejects, sel, transferIntent),
    multi' = multi,
    controlled' = controlled,
    accepting' = accepting,
    valueProp0' = propBit(hostWrites, valueProp0, transferIntent, 0),
    valueProp1' = propBit(hostWrites, valueProp1, transferIntent, 1),
    valueProp2' = propBit(hostWrites, valueProp2, transferIntent, 2),
    valueProp3' = propBit(hostWrites, valueProp3, transferIntent, 3),
    requested' = if (transferIntent != sel) transferIntent else requested,
    outcome' = if (transferIntent != sel) verdict else outcome,
    base' = if (transferIntent != sel) sel else base,
    requests' = if (transferIntent != sel) requests + 1 else requests
  }

  // Mode prop; switching to single-select collapses each list to its active
  // option.
  action set_multi = {
    nondet flag = Set(true, false).oneOf()
    all {
      a0' = a0,
      a1' = a1,
      a2' = a2,
      a3' = a3,
      b0' = b0,
      b1' = b1,
      b2' = b2,
      b3' = b3,
      activeA' = activeA,
      activeB' = activeB,
      focusList' = focusList,
      sel' = landed(rejects, sel, setMultiIntent(flag)),
      multi' = flag,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = propBit(hostWrites, valueProp0, setMultiIntent(flag), 0),
      valueProp1' = propBit(hostWrites, valueProp1, setMultiIntent(flag), 1),
      valueProp2' = propBit(hostWrites, valueProp2, setMultiIntent(flag), 2),
      valueProp3' = propBit(hostWrites, valueProp3, setMultiIntent(flag), 3),
      requested' = if (setMultiIntent(flag) != sel) setMultiIntent(flag) else requested,
      outcome' = if (setMultiIntent(flag) != sel) verdict else outcome,
      base' = if (setMultiIntent(flag) != sel) sel else base,
      requests' = if (setMultiIntent(flag) != sel) requests + 1 else requests
    }
  }

  // commit: the host writes the controlled value (a no-op while uncontrolled)
  action setValue = {
    nondet v = Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15).oneOf()
    all {
      a0' = a0,
      a1' = a1,
      a2' = a2,
      a3' = a3,
      b0' = b0,
      b1' = b1,
      b2' = b2,
      b3' = b3,
      activeA' = activeA,
      activeB' = activeB,
      focusList' = focusList,
      sel' = if (controlled) v else sel,
      multi' = multi,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = if (controlled) bit(v, 0) else valueProp0,
      valueProp1' = if (controlled) bit(v, 1) else valueProp1,
      valueProp2' = if (controlled) bit(v, 2) else valueProp2,
      valueProp3' = if (controlled) bit(v, 3) else valueProp3,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips one option of its own copy of the value
  action hostToggle = {
    nondet panel = Set(0, 1, 2, 3).oneOf()
    all {
      a0' = a0,
      a1' = a1,
      a2' = a2,
      a3' = a3,
      b0' = b0,
      b1' = b1,
      b2' = b2,
      b3' = b3,
      activeA' = activeA,
      activeB' = activeB,
      focusList' = focusList,
      sel' = if (controlled) flipAt(propsMask, panel) else sel,
      multi' = multi,
      controlled' = controlled,
      accepting' = accepting,
      valueProp0' = if (controlled) bit(flipAt(propsMask, panel), 0) else valueProp0,
      valueProp1' = if (controlled) bit(flipAt(propsMask, panel), 1) else valueProp1,
      valueProp2' = if (controlled) bit(flipAt(propsMask, panel), 2) else valueProp2,
      valueProp3' = if (controlled) bit(flipAt(propsMask, panel), 3) else valueProp3,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // configuration: the host starts owning the value, adopting the current one
  action control = all {
    a0' = a0,
    a1' = a1,
    a2' = a2,
    a3' = a3,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    b3' = b3,
    activeA' = activeA,
    activeB' = activeB,
    focusList' = focusList,
    sel' = sel,
    multi' = multi,
    controlled' = true,
    accepting' = accepting,
    valueProp0' = bit(sel, 0),
    valueProp1' = bit(sel, 1),
    valueProp2' = bit(sel, 2),
    valueProp3' = bit(sel, 3),
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    a0' = a0,
    a1' = a1,
    a2' = a2,
    a3' = a3,
    b0' = b0,
    b1' = b1,
    b2' = b2,
    b3' = b3,
    activeA' = activeA,
    activeB' = activeB,
    focusList' = focusList,
    sel' = sel,
    multi' = multi,
    controlled' = controlled,
    accepting' = true,
    valueProp0' = valueProp0,
    valueProp1' = valueProp1,
    valueProp2' = valueProp2,
    valueProp3' = valueProp3,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, focus_a, focus_b, blur, arrow_down, arrow_up, home, end, space,
    move_up, move_down, transfer, set_multi, setValue, hostToggle, control,
    acceptRequests
  }

  // every option is in exactly one list, exactly once
  val OptionsPartitioned: bool =
    and(occurrences(0) == 1, occurrences(1) == 1, occurrences(2) == 1, occurrences(3) == 1)
  // lists are packed to the left: no hole before an option
  val ListsPacked: bool = and(packed(a0, a1, a2, a3), packed(b0, b1, b2, b3))
  // a list's active option is one of its own options (noItem exactly when it is empty)
  val ActiveInOwnList: bool = and(activeValid(a0, a1, a2, a3, activeA), activeValid(b0, b1, b2, b3, activeB))
  // the mask only ever names real options
  val SelectionInRange: bool = and(sel >= 0, sel < pow2(itemCount))
  val FocusListKnown: bool = or(focusList == "none", focusList == "a", focusList == "b")
  // APG: no more than one option selected without aria-multiselectable (per list)
  // (uncontrolled: a controlled host owns the value and may hand us any set)
  val SingleSelectOnePerList: bool =
    and(
      ariaSingleHoldsAtMostOne(controlled, multi, popcount(selIn(sel, a0, a1, a2, a3))),
      ariaSingleHoldsAtMostOne(controlled, multi, popcount(selIn(sel, b0, b1, b2, b3)))
    )
  // single-select: the focused list's selection is its active option
  val SingleSelectFollowsFocus: bool =
    or(
      controlled,
      multi,
      and(
        or(focusList != "a", selIn(sel, a0, a1, a2, a3) == focusBit(activeA)),
        or(focusList != "b", selIn(sel, b0, b1, b2, b3) == focusBit(activeB))
      )
    )
  // aria-activedescendant is set on exactly the focused list
  val ActiveDescendantOnFocusedListOnly: bool =
    and(
      (ariaActiveDescendant(focusList, "a", activeA) != noItem) == and(focusList == "a", activeA != noItem),
      (ariaActiveDescendant(focusList, "b", activeB) != noItem) == and(focusList == "b", activeB != noItem)
    )
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), sel == propsMask)
  // a rejected request leaves the state as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), sel == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), sel == requested)
}
