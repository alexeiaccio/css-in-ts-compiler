// WAI-ARIA APG — Radio Group pattern (radiogroup + 4 radio items).
//
// Modelled (https://www.w3.org/WAI/ARIA/apg/patterns/radio/):
//   - "Keyboard Interaction / Radio Groups Not Contained in a Toolbar":
//       Tab / Shift+Tab   focus enters the group on the checked radio, or on the
//                         first radio when none is checked (entering never checks)
//       Space             checks the focused radio if not already checked
//       Right / Down      focus AND check the next radio, last wraps to first
//       Left / Up         focus AND check the previous radio, first wraps to last
//   - "WAI-ARIA Roles, States, and Properties": role radiogroup / radio,
//     aria-checked true|false on every radio.
// Examples (variants of the SAME machine, chosen once at init via `flavor`):
//   - roving   https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio/
//              DOM focus sits on the radio; exactly one radio is the tab stop
//              (tabindex 0, -1 on the others); the radiogroup has no tabindex.
//   - activedescendant
//              https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio-activedescendant/
//              DOM focus sits on the radiogroup (tabindex 0); radios carry no
//              tabindex; aria-activedescendant on the group names the
//              visually-focused radio while focus is inside the group.
// Disabled radios (task requirement, not in the APG examples): they are never
// focused, checked or the tab stop; arrows skip them (wrapping across them).
//
// The roving tab stop is the PLATFORM's, not a second copy of the rule. Movement
// along both axes, Home / End, wrap and the memory are the `focusgroup="radiogroup"`
// contract, imported from shared/focusgroup.qnt and NOT restated here; this spec
// models only the pattern's delta (selection, aria-orientation, disabled items).
// The definition is `nomemory`, with the checked radio — else the first enabled one
// — carrying `focusgroupstart`, and the platform's single stop is:
//   focus inside the group   the FOCUSED radio (`fgTabIndex` renders 0 on it): on
//                            entry that is the start marker (`fgEntry`), and every
//                            move takes the stop along with the focus
//   focus outside the group  the start marker again (`fgStopOnLeave` without
//                            memory: the checked radio, else the first enabled one)
// `radioTabindex` is derived from `fgTabIndex(tabStop, i)` and the entry/leave
// transitions from `fgEntry` / `fgStopOnLeave`, so a rendered stop the engine
// cannot produce is not representable here.
//
// What the previous model got wrong: it pinned `tabindex=0` to the CHECKED radio in
// every state (`TabStopIsCheckedOrFirst`). In an uncontrolled group, where an arrow
// checks the radio it focuses, that is indistinguishable — but a controlled host
// that REJECTS a request leaves the focus on the radio the user moved to while the
// check stays behind, and there the platform's stop follows the focus: the native
// engine keeps the stop in its focus controller and the polyfill rewrites `tabindex`
// on the item that receives focus. The old invariant described an implementation
// that scripted the whole roving tabindex, not the contract a native `focusgroup`
// can be asked to satisfy. The APG rule users see is preserved: Tab enters on the
// checked radio, which is what `focusgroupstart` + `fgStopOnLeave` give on the next
// entry, and the walk now checks the stop the engine actually keeps.
//
// Request vs commit (map ticket rt1p). The checked radio is the value. Every
// event a user sees as a change — `arrow_next`, `arrow_prev`, `space`, `click`
// — is a *request* carrying an intent (`requested`); it fires onValueChange
// (`requests` counts the calls) when the intent differs from the current
// `checked`, and then:
//   uncontrolled        the request is accepted: the check commits the intent
//   controlled, holds   the host ignores it ("rejected"): the check is untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       check commits through the controlled value, not the event
// `valueProp` is the only thing that changes the check while `controlled`;
// `setValue` is the host writing it. `control` / `acceptRequests` are
// configuration events (init is literal-only). DOM focus still moves with the
// request, so `FocusFollowsChecked` is an uncontrolled guarantee. Invariants
// for the model: ControlledFollowsProp, RejectedRequestUntouched,
// AcceptedRequestCommits.
//
// Pools / constants: 4 radios (indexes 0..3); `mask` is a bitmask of disabled
// radios (bit i = radio i), drawn from a pool that always leaves one enabled;
// `pick` is the preselected radio (-1 = none). `init` is the literal default
// (roving, none disabled, none checked); set_flavor / set_disabled / preselect
// re-mount the widget with other props (focus leaves the group, so the platform
// re-seats its stop on the start marker) and follow the controlled value.
//
// Sentinels: focus/checked -1 = none. domFocus: 0..3 = a radio, 4 = the
// radiogroup element, -1 = outside the group. tabindex: -2 = attribute absent.
//
// Deliberate omissions: the toolbar flavor, the radio-rating example, Enter,
// aria-labelledby / aria-describedby / aria-label wiring, mouse hover, disabling
// without a re-mount, Shift+Tab "last radio" native-browser difference,
// dynamic add/remove of radios. Click is modelled as focus+check of an enabled radio.
//
// ponytail: radio count is fixed at 4; the generator has no sets/lists, so the
// group is unrolled into index arithmetic. Widen the modulus and weight table
// to grow it.
module apg_radio {
  import focusgroup.* from "../../shared/focusgroup"

  var flavor: str  // "roving" | "activedescendant"
  var mask: int     // disabled bitmask (bit i set = radio i disabled)
  var checked: int  // checked radio, -1 = none
  var focus: int    // radio holding (visual) focus, -1 = focus outside the group
  var tabStop: int  // the radio that owns tabindex=0 (the platform's single stop)
  var controlled: bool // the host owns the check (`value` prop present)
  var accepting: bool  // controlled host that answers every request with its intent
  var valueProp: int   // the controlled value prop (meaningful while controlled)
  var requested: int   // intent of the last request
  var requests: int    // number of requests that fired onValueChange
  var outcome: str     // "none" | "accepted" | "rejected"
  var base: int        // check when the last request was received

  def weight(i: int): int =
    if (i == 0) 1 else if (i == 1) 2 else if (i == 2) 4 else 8
  def disabled(m: int, i: int): bool = imod(idiv(m, weight(i)), 2) == 1
  def isEnabled(m: int, i: int): bool = not(disabled(m, i))
  def b2i(b: bool): int = if (b) 1 else 0

  // first enabled radio (the pool guarantees at least one)
  def firstEnabled(m: int): int =
    if (isEnabled(m, 0)) 0 else if (isEnabled(m, 1)) 1 else if (isEnabled(m, 2)) 2 else 3

  // arrow targets: skip disabled radios, wrap around; stay put if alone
  def nextEnabled(m: int, i: int): int =
    if (isEnabled(m, imod(i + 1, 4))) imod(i + 1, 4)
    else if (isEnabled(m, imod(i + 2, 4))) imod(i + 2, 4)
    else if (isEnabled(m, imod(i + 3, 4))) imod(i + 3, 4)
    else i
  def prevEnabled(m: int, i: int): int =
    if (isEnabled(m, imod(i + 3, 4))) imod(i + 3, 4)
    else if (isEnabled(m, imod(i + 2, 4))) imod(i + 2, 4)
    else if (isEnabled(m, imod(i + 1, 4))) imod(i + 1, 4)
    else i

  // ---- request / commit (map ticket rt1p) ----------------------------------
  def moved(before: int, after: int): int = if (before == after) 0 else 1
  // the intent of each request (an enabled target, or the current check)
  def nextWant(m: int, c: int, f: int): int = if (f >= 0) nextEnabled(m, f) else c
  def prevWant(m: int, c: int, f: int): int = if (f >= 0) prevEnabled(m, f) else c
  def spaceWant(c: int, f: int): int = if (f >= 0) f else c
  def clickWant(t: int, m: int, c: int): int = if (isEnabled(m, t)) t else c
  // a value the host may write: -1 (none) or an enabled radio
  def validPick(v: int, m: int): bool = or(v < 0, isEnabled(m, v))
  // the check after the host writes `v` (a no-op unless controlled and valid)
  def written(v: int, m: int, c: int, ctl: bool): int =
    if (and(ctl, validPick(v, m))) v else c
  // the check after a remount re-picks it
  def picked(pick: int, m: int): int = if (and(pick >= 0, isEnabled(m, pick))) pick else -1
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the check after a request for `want`
  def landed(h: bool, current: int, want: int): int = if (h) current else want
  // the value prop after a request for `want`
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p

  // ---- ARIA contract, derived from state ----

  // the entry point and post-leave stop: the `focusgroupstart` radio — the checked
  // one, else the first enabled one
  def start(m: int, c: int): int = if (c >= 0) c else firstEnabled(m)

  def ariaChecked(c: int, i: int): bool = c == i
  def ariaDisabled(m: int, i: int): bool = disabled(m, i)

  // roving: the platform's rendered stop (shared/focusgroup.qnt `fgTabIndex`);
  // activedescendant: no radio carries a tabindex
  def radioTabindex(v: str, s: int, i: int): int =
    if (v == "roving") fgTabIndex(s, i) else -2
  // activedescendant: the radiogroup itself is the tab stop; roving: absent
  def groupTabindex(v: str): int = if (v == "activedescendant") 0 else -2
  // aria-activedescendant on the radiogroup: the focused radio, -1 = absent
  def activeDescendant(v: str, f: int): int =
    if (v == "activedescendant") f else -1
  // which element owns DOM focus
  def domFocus(v: str, f: int): int =
    if (f < 0) -1 else if (v == "roving") f else 4

  def checkedCount(c: int): int =
    b2i(ariaChecked(c, 0)) + b2i(ariaChecked(c, 1)) + b2i(ariaChecked(c, 2)) + b2i(ariaChecked(c, 3))
  // tab stops contributed by one radio / the group, summed over the widget
  def tabStopCount(v: str, s: int): int =
    b2i(radioTabindex(v, s, 0) == 0) + b2i(radioTabindex(v, s, 1) == 0)
      + b2i(radioTabindex(v, s, 2) == 0) + b2i(radioTabindex(v, s, 3) == 0)
      + b2i(groupTabindex(v) == 0)

  action init = all {
    flavor' = "roving",
    mask' = 0,
    checked' = -1,
    focus' = -1,
    tabStop' = 0,
    controlled' = false,
    accepting' = false,
    valueProp' = -1,
    requested' = -1,
    requests' = 0,
    outcome' = "none",
    base' = -1
  }

  // The three configuration actions model (re)mounting the widget with other
  // props: they drop focus out of the group, and the platform re-seats its stop on
  // the start marker (`fgStopOnLeave` without memory), so every later state is
  // reached through the keyboard/pointer actions below. While controlled they keep
  // the value prop in step with the check.
  action set_flavor = {
    nondet v = Set("roving", "activedescendant").oneOf()
    all {
      flavor' = v,
      mask' = mask,
      checked' = checked,
      focus' = -1,
      tabStop' = fgStopOnLeave(false, tabStop, start(mask, checked)),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = outcome,
      base' = base
    }
  }

  // disabled radios; the pool always leaves one enabled, and a checked radio
  // that becomes disabled is unchecked
  action set_disabled = {
    nondet m = Set(0, 1, 2, 6, 9, 14).oneOf()
    all {
      flavor' = flavor,
      mask' = m,
      checked' = if (and(checked >= 0, isEnabled(m, checked))) checked else -1,
      focus' = -1,
      tabStop' = fgStopOnLeave(false, tabStop, start(m, if (and(checked >= 0, isEnabled(m, checked))) checked else -1)),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) (if (and(checked >= 0, isEnabled(m, checked))) checked else -1) else valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = "none",
      base' = base
    }
  }

  // initially checked radio (-1 = none); a disabled pick leaves none checked
  action preselect = {
    nondet pick = Set(-1, 0, 1, 2, 3).oneOf()
    all {
      flavor' = flavor,
      mask' = mask,
      checked' = picked(pick, mask),
      focus' = -1,
      tabStop' = fgStopOnLeave(false, tabStop, start(mask, picked(pick, mask))),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) picked(pick, mask) else valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = "none",
      base' = base
    }
  }

  // Tab / Shift+Tab into the group: focus the entry point (`focusgroupstart`),
  // never check it, and the platform's stop is that radio (`fgEntry`).
  // Already inside: Tab leaves the group, which is `leave`.
  action enter = all {
    flavor' = flavor,
    mask' = mask,
    checked' = checked,
    focus' = if (focus < 0) start(mask, checked) else focus,
    tabStop' = if (focus < 0) fgEntry(false, tabStop, start(mask, checked)) else tabStop,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // Tab out of the group: the platform re-seats its stop on the start marker
  // (`fgStopOnLeave` without memory), which is the radio Tab enters on next.
  action leave = all {
    flavor' = flavor,
    mask' = mask,
    checked' = checked,
    focus' = -1,
    tabStop' = fgStopOnLeave(false, tabStop, start(mask, checked)),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // request: Right / Down arrow moves focus and checks, wrapping, skipping disabled
  action arrow_next = all {
    flavor' = flavor,
    mask' = mask,
    checked' = landed(holds, checked, nextWant(mask, checked, focus)),
    focus' = if (focus >= 0) nextEnabled(mask, focus) else focus,
    tabStop' = if (focus >= 0) nextEnabled(mask, focus) else tabStop,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, nextWant(mask, checked, focus)),
    requested' = if (moved(checked, nextWant(mask, checked, focus)) == 1) nextWant(mask, checked, focus) else requested,
    requests' = requests + moved(checked, nextWant(mask, checked, focus)),
    outcome' = if (moved(checked, nextWant(mask, checked, focus)) == 1) verdict else outcome,
    base' = if (moved(checked, nextWant(mask, checked, focus)) == 1) checked else base
  }

  // request: Left / Up arrow
  action arrow_prev = all {
    flavor' = flavor,
    mask' = mask,
    checked' = landed(holds, checked, prevWant(mask, checked, focus)),
    focus' = if (focus >= 0) prevEnabled(mask, focus) else focus,
    tabStop' = if (focus >= 0) prevEnabled(mask, focus) else tabStop,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, prevWant(mask, checked, focus)),
    requested' = if (moved(checked, prevWant(mask, checked, focus)) == 1) prevWant(mask, checked, focus) else requested,
    requests' = requests + moved(checked, prevWant(mask, checked, focus)),
    outcome' = if (moved(checked, prevWant(mask, checked, focus)) == 1) verdict else outcome,
    base' = if (moved(checked, prevWant(mask, checked, focus)) == 1) checked else base
  }

  // request: Space checks the focused radio (no-op when already checked)
  action space = all {
    flavor' = flavor,
    mask' = mask,
    checked' = landed(holds, checked, spaceWant(checked, focus)),
    focus' = focus,
    tabStop' = tabStop,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, spaceWant(checked, focus)),
    requested' = if (moved(checked, spaceWant(checked, focus)) == 1) spaceWant(checked, focus) else requested,
    requests' = requests + moved(checked, spaceWant(checked, focus)),
    outcome' = if (moved(checked, spaceWant(checked, focus)) == 1) verdict else outcome,
    base' = if (moved(checked, spaceWant(checked, focus)) == 1) checked else base
  }

  // request: pointer on an enabled radio takes focus and becomes checked
  action click = {
    nondet target = Set(0, 1, 2, 3).oneOf()
    all {
      flavor' = flavor,
      mask' = mask,
      checked' = landed(holds, checked, clickWant(target, mask, checked)),
      focus' = if (isEnabled(mask, target)) target else focus,
      tabStop' = if (isEnabled(mask, target)) target else tabStop,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, clickWant(target, mask, checked)),
      requested' = if (moved(checked, clickWant(target, mask, checked)) == 1) clickWant(target, mask, checked) else requested,
      requests' = requests + moved(checked, clickWant(target, mask, checked)),
      outcome' = if (moved(checked, clickWant(target, mask, checked)) == 1) verdict else outcome,
      base' = if (moved(checked, clickWant(target, mask, checked)) == 1) checked else base
    }
  }

  // commit: the host writes the controlled check (a no-op while uncontrolled).
  // Focus does not move, so the platform's stop moves only when focus is outside:
  // the start marker follows the check, and the next entry lands on it.
  action setValue = {
    nondet v = Set(-1, 0, 1, 2, 3).oneOf()
    all {
      flavor' = flavor,
      mask' = mask,
      checked' = written(v, mask, checked, controlled),
      focus' = focus,
      tabStop' = if (focus >= 0) tabStop else fgStopOnLeave(false, tabStop, start(mask, written(v, mask, checked, controlled))),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = written(v, mask, valueProp, controlled),
      requested' = requested,
      requests' = requests,
      outcome' = if (controlled) "none" else outcome,
      base' = base
    }
  }

  // configuration: the host starts owning the check, adopting the current one
  action control = all {
    flavor' = flavor,
    mask' = mask,
    checked' = checked,
    focus' = focus,
    tabStop' = tabStop,
    controlled' = true,
    accepting' = accepting,
    valueProp' = checked,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    flavor' = flavor,
    mask' = mask,
    checked' = checked,
    focus' = focus,
    tabStop' = tabStop,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action step = any { init, set_flavor, set_disabled, preselect, enter, leave, arrow_next, arrow_prev, space, click, setValue, control, acceptRequests }

  // never more than one radio is aria-checked="true"
  val AtMostOneChecked: bool = checkedCount(checked) <= 1
  // exactly one tab stop for the whole group, in both variants
  val ExactlyOneTabStop: bool = tabStopCount(flavor, tabStop) == 1
  // the stop is a radio, and every state names one
  val TabStopInRange: bool = fgStopInRange(4, tabStop)
  // roving: the platform's stop is the focused radio while focus is inside the
  // group and the `focusgroupstart` radio (checked, else first enabled) once it
  // leaves; activedescendant keeps no radio stop — the group is its only one
  val TabStopFollowsFocusOrStart: bool =
    or(flavor == "activedescendant", tabStop == (if (focus >= 0) focus else start(mask, checked)))
  // a disabled radio is never checked, focused or the tab stop
  val DisabledNeverActive: bool = and(
    or(checked < 0, isEnabled(mask, checked)),
    or(focus < 0, isEnabled(mask, focus)),
    isEnabled(mask, tabStop)
  )
  // focus and checked move together: once a radio is checked, focus inside
  // the group is always on it; before that it can only be on the first radio.
  // A controlled host that rejects a request leaves focus on the requested
  // radio, so this is an uncontrolled guarantee.
  val FocusFollowsChecked: bool = or(
    controlled,
    focus < 0,
    if (checked >= 0) focus == checked else focus == firstEnabled(mask)
  )
  // at least one radio can always be reached
  val SomeRadioEnabled: bool = or(isEnabled(mask, 0), isEnabled(mask, 1), isEnabled(mask, 2), isEnabled(mask, 3))
  // aria-activedescendant exists only while focus is inside an activedescendant group
  val ActiveDescendantContract: bool =
    if (flavor == "activedescendant")
      and(activeDescendant(flavor, focus) == focus, or(focus < 0, domFocus(flavor, focus) == 4))
    else
      and(activeDescendant(flavor, focus) == -1, domFocus(flavor, focus) == focus)
  val VariantValid: bool = or(flavor == "roving", flavor == "activedescendant")
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the check, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), checked == valueProp)
  // a rejected request leaves the check as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), checked == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), checked == requested)
}
