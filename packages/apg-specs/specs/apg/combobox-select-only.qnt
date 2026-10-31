// APG combobox — the select-only combobox (no text input, listbox popup).
//
// Sources (W3C WAI-ARIA Authoring Practices Guide):
//   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
//     - "About This Pattern", "Keyboard Interaction" (Combobox + Listbox Popup),
//       "WAI-ARIA Roles, States, and Properties"
//   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/
//     - "Accessibility Features", "Keyboard Support" (Closed Combobox, Listbox
//       Popup), "Role, Property, State, and Tabindex Attributes"
//
// Modelled behaviour
//   - DOM focus never leaves the combobox element: the popup's options are
//     visually focused through aria-activedescendant (`active`), never by
//     moving DOM focus. A popup can only be open while the combobox has DOM
//     focus; blur / Tab commit the active option and close it.
//   - Navigating the options (arrows, Home/End, PageUp/PageDown, typeahead)
//     never changes the value. The value is committed by Enter, Space, Tab,
//     Alt+ArrowUp, blur, an option click, or an external `set_value` prop
//     change. Escape and a click on the closed-again input keep the value.
//   - Closed combobox: ArrowDown / Alt+ArrowDown / Enter / Space open the popup
//     without moving the visual focus off the current option (the selected
//     option, or the first when none is selected); ArrowUp opens on the first
//     option; Home / End open on the first / last option; a printable character
//     opens the popup on the first option starting with it.
//   - Typeahead: a character matches the first option starting with it; the
//     same character typed in succession cycles among options with that letter.
//   - The ARIA attribute contract is derived: aria-expanded,
//     aria-activedescendant (present iff open), aria-selected (exactly the
//     active option, only while open).
//
// Request vs commit (map ticket rt1p). The widget's observable state is the pair
// (selected value, open): both are user-changeable and host-ownable, so they are
// packed into one controlled value with `stateOf` (injective for value -1..5 and
// the open bit). Every event a user sees as a change — blur, the arrow /
// Home / End / typing open keys, Enter / Space / Tab / Alt+ArrowUp, the pointer
// clicks — is a *request* carrying its intent (`requested`); it fires
// onValueChange / onOpenChange (`requests` counts the calls) when the intent
// differs from the current state, and then:
//   uncontrolled        the request is accepted: the state commits the intent
//   controlled, holds   the host ignores it ("rejected"): the state is untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       state commits through the controlled value, not the event
// `valueProp` is the only thing that changes the state while `controlled`;
// `set_value` / `setOpen` / `hostToggle` are the host writing it. `control` and
// `acceptRequests` are configuration events (init is literal-only).
//
// Invariants for the model: ControlledFollowsProp, RejectedRequestUntouched,
// AcceptedRequestCommits.
//
// `outcome` is "none" | "accepted" | "rejected" for the last request; a host
// write settles it back to "none". `base` is the state when it was received.
//
// Configuration variants are zero-argument defs / nondet pools: the option
// count and PageUp/PageDown stride (`OPTION_COUNT`, `PAGE_SIZE`), the option
// first letters (`letterOf`), and the typed-character pool (`type_char`).
//
// Deliberate omissions
//   - Typeahead of multi-character strings typed in quick succession (the
//     timeout-based buffer); only single-character matching and same-letter
//     cycling are modelled (`typed` is the last character, reset by any other
//     event, standing in for the timeout).
//   - Scrolling the active option into view, hover styling, the label,
//     aria-controls / aria-labelledby wiring (static ids).
//   - Required, multi-select, option groups.
//   - A widget-level `disabled`: a deliberate extension of the pattern, not
//     modelled. The machine has no `disabled` var, so it cannot say "while
//     disabled, a key, a click, a typeahead character, a filter input and an
//     option click change nothing, no popup opens, the combobox keeps its tab
//     stop and it and the trigger announce aria-disabled". The DOM test in
//     `packages/headless/test/combobox.browser.test.tsx` is its oracle.
//   - Pointer hover over an option does not move the active option.
//
// Generator notes: the generator supports no action preconditions, so every
// key action guards its assignments with `focused`; vars hold int sentinels
// (`NONE = -1`) because only str/int/bool vars are supported.
module combobox_select_only {
  import aria.* from "../../shared/aria"

  var open: bool          // popup (listbox) displayed == aria-expanded
  var active: int         // aria-activedescendant option index (NONE when closed)
  var value: int          // committed value: option index, NONE = placeholder
  var focused: bool       // DOM focus is on the combobox element
  var typed: int          // last typeahead character, NONE when the buffer is empty
  var lastEvent: str      // name of the last event, for transition invariants
  var valueChanged: bool  // the last event changed `value`
  var controlled: bool    // the host owns (value, open) (`value`/`open` props present)
  var accepting: bool     // controlled host that answers every request with its intent
  var valueProp: int      // the controlled state, packed with `stateOf`
  var requested: int      // intent of the last request, packed
  var outcome: str        // "none" | "accepted" | "rejected"
  var base: int           // state when the last request was received, packed
  var requests: int       // number of requests that fired a change callback

  // --- configuration ------------------------------------------------------
  def NONE: int = -1
  def OPTION_COUNT: int = 6
  def PAGE_SIZE: int = 4
  // options: 0 Apple, 1 Banana, 2 Blueberry, 3 Cherry, 4 Cranberry, 5 Durian
  def letterOf(i: int): int =
    if (i == 0) 0 else if (i == 1) 1 else if (i == 2) 1 else if (i == 3) 2 else if (i == 4) 2 else 3

  // --- helpers ------------------------------------------------------------
  def minI(a: int, b: int): int = if (a < b) a else b
  def maxI(a: int, b: int): int = if (a > b) a else b
  def refersToOption(i: int): bool = and(i >= 0, i < OPTION_COUNT)

  // the listbox opens on the selected option, or the first when none
  def openActive: int = maxI(value, 0)
  def openIfFocused: bool = if (focused) true else open
  // a commit happens only while the key reaches an open popup with a focused option
  def commits: bool = and(focused, open)
  def commitsActive: bool = and(commits, active >= 0)
  def committedValue: int = if (commitsActive) active else value
  def commitChanged: bool = and(commitsActive, active != value)

  // the first option with letter ch among OPTION_COUNT candidates from start
  // (candidates and the start rule are shared/aria.qnt: ariaCycle0, ariaTaRepeatStart0)
  def candidate(start: int, k: int): int = ariaCycle0(OPTION_COUNT, start, k)
  def matchFrom(start: int, ch: int): int =
    if (letterOf(candidate(start, 0)) == ch) candidate(start, 0)
    else if (letterOf(candidate(start, 1)) == ch) candidate(start, 1)
    else if (letterOf(candidate(start, 2)) == ch) candidate(start, 2)
    else if (letterOf(candidate(start, 3)) == ch) candidate(start, 3)
    else if (letterOf(candidate(start, 4)) == ch) candidate(start, 4)
    else if (letterOf(candidate(start, 5)) == ch) candidate(start, 5)
    else NONE
  // a repeated character cycles on from the option after base, a new one starts at the top
  def found(ch: int, base: int): int = matchFrom(ariaTaRepeatStart0(OPTION_COUNT, base, typed, ch), ch)
  def typeActive(ch: int, base: int): int =
    if (found(ch, base) == NONE) base else found(ch, base)

  // --- request / commit (map ticket rt1p) --------------------------------
  def b2i(b: bool): int = if (b) 1 else 0
  // injective for value -1..5 and the open bit: (value + 1) * 2 + open
  def stateOf(o: bool, v: int): int = (v + 1) * 2 + b2i(o)
  def openOf(s: int): bool = s % 2 == 1
  def valueOf(s: int): int = s / 2 - 1
  def nowState: int = stateOf(open, value)
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  def landed(h: bool, current: bool, want: bool): bool = if (h) current else want
  def landedInt(h: bool, current: int, want: int): int = if (h) current else want
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p
  // the state / prop / ledger after a request for the packed `want`
  def openAt(w: int): bool = landed(holds, open, openOf(w))
  def valueAt(w: int): int = landedInt(holds, value, valueOf(w))
  def propAt(w: int): int = propAfter(follows, valueProp, w)
  def reqState(w: int): int = if (w != nowState) w else requested
  def reqOutcome(w: int): str = if (w != nowState) verdict else outcome
  def reqBase(w: int): int = if (w != nowState) nowState else base
  def reqCount(w: int): int = if (w != nowState) requests + 1 else requests
  // the packed intent of each change event
  def blurW: int = stateOf(false, if (and(open, active >= 0)) active else value)
  def openW: int = stateOf(openIfFocused, value)
  def enterW: int = stateOf(if (focused) not(open) else open, committedValue)
  def tabW: int = stateOf(if (focused) false else open, committedValue)
  def escapeW: int = stateOf(if (focused) false else open, value)
  def altUpW: int = stateOf(if (focused) false else open, committedValue)
  def clickComboW: int = stateOf(not(open), value)
  def clickOptionW(i: int): int = stateOf(false, if (open) i else value)

  // --- derived ARIA attribute contract -----------------------------------
  def ariaExpanded: bool = open
  def ariaActivedescendant: int = if (open) active else NONE
  def ariaSelected(i: int): bool = and(open, i == active)
  def selectedCount: int =
    (if (ariaSelected(0)) 1 else 0) + (if (ariaSelected(1)) 1 else 0) +
    (if (ariaSelected(2)) 1 else 0) + (if (ariaSelected(3)) 1 else 0) +
    (if (ariaSelected(4)) 1 else 0) + (if (ariaSelected(5)) 1 else 0)
  def isCommitEvent(e: str): bool =
    or(e == "enter", e == "space", e == "tab", e == "alt_arrow_up", e == "blur", e == "click_option", e == "set_value")

  action init = all {
    open' = false,
    active' = NONE,
    value' = NONE,
    focused' = false,
    typed' = NONE,
    lastEvent' = "init",
    valueChanged' = false,
    controlled' = false,
    accepting' = false,
    valueProp' = stateOf(false, NONE),
    requested' = stateOf(false, NONE),
    outcome' = "none",
    base' = stateOf(false, NONE),
    requests' = 0
  }

  // --- focus / blur --------------------------------------------------------
  action focus = all {
    focused' = true,
    typed' = NONE,
    lastEvent' = "focus",
    valueChanged' = false,
    open' = open,
    active' = active,
    value' = value,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // focus leaves the combobox: an open popup commits its active option
  action blur = all {
    focused' = false,
    open' = openAt(blurW),
    active' = NONE,
    value' = valueAt(blurW),
    typed' = NONE,
    lastEvent' = "blur",
    valueChanged' = valueAt(blurW) != value,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(blurW),
    requested' = reqState(blurW),
    outcome' = reqOutcome(blurW),
    base' = reqBase(blurW),
    requests' = reqCount(blurW)
  }

  // --- closed + open arrow keys -------------------------------------------
  action arrow_down = all {
    open' = openAt(openW),
    active' = if (focused) (if (open) minI(active + 1, OPTION_COUNT - 1) else openActive) else active,
    typed' = NONE,
    lastEvent' = "arrow_down",
    valueChanged' = false,
    value' = valueAt(openW),
    focused' = focused,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(openW),
    requested' = reqState(openW),
    outcome' = reqOutcome(openW),
    base' = reqBase(openW),
    requests' = reqCount(openW)
  }

  action alt_arrow_down = all {
    open' = openAt(openW),
    active' = if (focused) (if (open) active else openActive) else active,
    typed' = NONE,
    lastEvent' = "alt_arrow_down",
    valueChanged' = false,
    value' = valueAt(openW),
    focused' = focused,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(openW),
    requested' = reqState(openW),
    outcome' = reqOutcome(openW),
    base' = reqBase(openW),
    requests' = reqCount(openW)
  }

  action arrow_up = all {
    open' = openAt(openW),
    active' = if (focused) (if (open) maxI(active - 1, 0) else 0) else active,
    typed' = NONE,
    lastEvent' = "arrow_up",
    valueChanged' = false,
    value' = valueAt(openW),
    focused' = focused,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(openW),
    requested' = reqState(openW),
    outcome' = reqOutcome(openW),
    base' = reqBase(openW),
    requests' = reqCount(openW)
  }

  action home = all {
    open' = openAt(openW),
    active' = if (focused) 0 else active,
    typed' = NONE,
    lastEvent' = "home",
    valueChanged' = false,
    value' = valueAt(openW),
    focused' = focused,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(openW),
    requested' = reqState(openW),
    outcome' = reqOutcome(openW),
    base' = reqBase(openW),
    requests' = reqCount(openW)
  }

  action end = all {
    open' = openAt(openW),
    active' = if (focused) OPTION_COUNT - 1 else active,
    typed' = NONE,
    lastEvent' = "end",
    valueChanged' = false,
    value' = valueAt(openW),
    focused' = focused,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(openW),
    requested' = reqState(openW),
    outcome' = reqOutcome(openW),
    base' = reqBase(openW),
    requests' = reqCount(openW)
  }

  action page_up = all {
    active' = if (commits) maxI(active - PAGE_SIZE, 0) else active,
    typed' = NONE,
    lastEvent' = "page_up",
    valueChanged' = false,
    open' = open,
    value' = value,
    focused' = focused,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action page_down = all {
    active' = if (commits) minI(active + PAGE_SIZE, OPTION_COUNT - 1) else active,
    typed' = NONE,
    lastEvent' = "page_down",
    valueChanged' = false,
    open' = open,
    value' = value,
    focused' = focused,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // --- activation keys -----------------------------------------------------
  // closed: open without moving; open: commit the active option and close
  action enter = all {
    open' = openAt(enterW),
    active' = if (focused) (if (open) NONE else openActive) else active,
    value' = valueAt(enterW),
    typed' = NONE,
    lastEvent' = "enter",
    valueChanged' = valueAt(enterW) != value,
    focused' = focused,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(enterW),
    requested' = reqState(enterW),
    outcome' = reqOutcome(enterW),
    base' = reqBase(enterW),
    requests' = reqCount(enterW)
  }

  action space = all {
    open' = openAt(enterW),
    active' = if (focused) (if (open) NONE else openActive) else active,
    value' = valueAt(enterW),
    typed' = NONE,
    lastEvent' = "space",
    valueChanged' = valueAt(enterW) != value,
    focused' = focused,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(enterW),
    requested' = reqState(enterW),
    outcome' = reqOutcome(enterW),
    base' = reqBase(enterW),
    requests' = reqCount(enterW)
  }

  // Tab commits an open popup and moves DOM focus to the next page element
  action tab = all {
    open' = openAt(tabW),
    active' = if (focused) NONE else active,
    value' = valueAt(tabW),
    focused' = false,
    typed' = NONE,
    lastEvent' = "tab",
    valueChanged' = valueAt(tabW) != value,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(tabW),
    requested' = reqState(tabW),
    outcome' = reqOutcome(tabW),
    base' = reqBase(tabW),
    requests' = reqCount(tabW)
  }

  // Escape closes the popup and keeps the previous value
  action escape = all {
    open' = openAt(escapeW),
    active' = if (focused) NONE else active,
    typed' = NONE,
    lastEvent' = "escape",
    valueChanged' = false,
    value' = valueAt(escapeW),
    focused' = focused,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(escapeW),
    requested' = reqState(escapeW),
    outcome' = reqOutcome(escapeW),
    base' = reqBase(escapeW),
    requests' = reqCount(escapeW)
  }

  // Alt+ArrowUp on an open popup commits the active option and closes
  action alt_arrow_up = all {
    open' = openAt(altUpW),
    active' = if (focused) NONE else active,
    value' = valueAt(altUpW),
    typed' = NONE,
    lastEvent' = "alt_arrow_up",
    valueChanged' = valueAt(altUpW) != value,
    focused' = focused,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(altUpW),
    requested' = reqState(altUpW),
    outcome' = reqOutcome(altUpW),
    base' = reqBase(altUpW),
    requests' = reqCount(altUpW)
  }

  // --- typeahead -----------------------------------------------------------
  action type_char = {
    nondet ch = Set(0, 1, 2, 3, 9).oneOf()
    all {
      open' = openAt(openW),
      active' = if (focused) typeActive(ch, if (open) active else openActive) else active,
      typed' = if (focused) ch else typed,
      lastEvent' = "type_char",
      valueChanged' = false,
      value' = valueAt(openW),
      focused' = focused,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAt(openW),
      requested' = reqState(openW),
      outcome' = reqOutcome(openW),
      base' = reqBase(openW),
      requests' = reqCount(openW)
    }
  }

  // --- pointer -------------------------------------------------------------
  // clicking the input focuses it and toggles the popup; the value is kept
  action click_combobox = all {
    focused' = true,
    open' = openAt(clickComboW),
    active' = if (open) NONE else openActive,
    typed' = NONE,
    lastEvent' = "click_combobox",
    valueChanged' = false,
    value' = valueAt(clickComboW),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAt(clickComboW),
    requested' = reqState(clickComboW),
    outcome' = reqOutcome(clickComboW),
    base' = reqBase(clickComboW),
    requests' = reqCount(clickComboW)
  }

  // clicking an option of the open popup commits it and returns visual focus
  action click_option = {
    nondet i = Set(0, 1, 2, 3, 4, 5).oneOf()
    all {
      open' = openAt(clickOptionW(i)),
      active' = NONE,
      value' = valueAt(clickOptionW(i)),
      focused' = if (open) true else focused,
      typed' = NONE,
      lastEvent' = "click_option",
      valueChanged' = valueAt(clickOptionW(i)) != value,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAt(clickOptionW(i)),
      requested' = reqState(clickOptionW(i)),
      outcome' = reqOutcome(clickOptionW(i)),
      base' = reqBase(clickOptionW(i)),
      requests' = reqCount(clickOptionW(i))
    }
  }

  // --- prop change ---------------------------------------------------------
  // the external value replaces the committed one; popup state is untouched
  action set_value = {
    nondet i = Set(0, 1, 2, 3, 4, 5).oneOf()
    all {
      value' = i,
      typed' = NONE,
      lastEvent' = "set_value",
      valueChanged' = i != value,
      open' = open,
      active' = active,
      focused' = focused,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) stateOf(open, i) else valueProp,
      requested' = requested,
      outcome' = "none",
      base' = base,
      requests' = requests
    }
  }

  // commit: the host writes the open state (a no-op while uncontrolled)
  action setOpen = {
    nondet o = Set(true, false).oneOf()
    all {
      open' = if (controlled) o else open,
      active' = if (controlled) active else active,
      value' = value,
      focused' = focused,
      typed' = NONE,
      lastEvent' = "setOpen",
      valueChanged' = false,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) stateOf(o, value) else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips the open state of its own copy (an outside button)
  action hostToggle = all {
    open' = if (controlled) not(open) else open,
    active' = active,
    value' = value,
    focused' = focused,
    typed' = NONE,
    lastEvent' = "hostToggle",
    valueChanged' = false,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) stateOf(not(open), value) else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the host starts owning (value, open), adopting the current
  action control = all {
    open' = open,
    active' = active,
    value' = value,
    focused' = focused,
    typed' = typed,
    lastEvent' = lastEvent,
    valueChanged' = valueChanged,
    controlled' = true,
    accepting' = accepting,
    valueProp' = nowState,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    open' = open,
    active' = active,
    value' = value,
    focused' = focused,
    typed' = typed,
    lastEvent' = lastEvent,
    valueChanged' = valueChanged,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, focus, blur, arrow_down, alt_arrow_down, arrow_up, home, end,
    page_up, page_down, enter, space, tab, escape, alt_arrow_up, type_char,
    click_combobox, click_option, set_value, setOpen, hostToggle, control,
    acceptRequests
  }

  // --- invariants (APG guarantees) ----------------------------------------
  // aria-activedescendant refers to a real option iff the popup is open; a
  // controlled host may keep the popup shut while the visual focus is moved,
  // so this holds for the uncontrolled path only
  val ActiveDescendantIffOpen: bool = or(controlled, refersToOption(active) == open)
  // the rendered attributes agree with the state: no stale activedescendant,
  // exactly one aria-selected option while open and none while closed
  val AriaContractConsistent: bool = or(controlled,
    and(ariaActivedescendant == active, selectedCount == (if (ariaExpanded) 1 else 0)))
  val ActiveInRange: bool = and(active >= NONE, active < OPTION_COUNT)
  val ValueInRange: bool = and(value >= NONE, value < OPTION_COUNT)
  // DOM focus stays on the combobox while its popup is open (uncontrolled: a
  // controlled host may reject the close and leave focus elsewhere)
  val DomFocusStaysOnCombobox: bool = or(controlled, or(not(open), focused))
  // Escape never changes the value
  val EscapeKeepsValue: bool = or(not(lastEvent == "escape"), not(valueChanged))
  // the value changes only on a commit event (never by navigating)
  val CommitOnlyViaCommitEvents: bool = or(not(valueChanged), isCommitEvent(lastEvent))
  // the typeahead buffer lives only between consecutive typed characters
  val TypeaheadBufferIsTransient: bool = or(typed == NONE, lastEvent == "type_char")
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), nowState == valueProp)
  // a rejected request leaves the state as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), nowState == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), nowState == requested)
}
