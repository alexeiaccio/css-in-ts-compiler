// WAI-ARIA APG — Spinbutton pattern.
//   https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
//   example: Quantity Spin Button (the APG ships no date-picker spinbutton
//   example; the closest, "Quantity", is the one the pattern page links).
//
// Modelled (APG sections):
//   - About This Pattern: text field + increase/decrease buttons; the text
//     field is the only focusable part, focus stays on it during operation.
//   - Keyboard Interaction: Up/Down (step), Page Up/Down (optional larger
//     step), Home -> min, End -> max, printable characters edit the text.
//   - WAI-ARIA Roles, States, Properties: role=spinbutton, aria-valuenow /
//     aria-valuemin / aria-valuemax, aria-invalid, and the tab-order rule that
//     the buttons are NOT focusable by Tab (tabindex -1).
//
// The committed `value` is separate from the typed `draft` text. The draft is a
// validity pool: the supported subset has no string parsing, so the spec
// carries a fixed set of sample texts ("" / "5" / "12" / "13" / "0" / "abc")
// and explicit defs say which parse to an in-range integer. Enter commits a
// valid draft, an invalid one reverts; blur and Escape follow the same rule
// (blur commits-or-reverts, Escape always reverts). Spin keys and the buttons
// resolve a pending draft first, then step from the result.
//
// Variant: `wrap` selects clamp-at-bounds (false) or wrap-around (true). It is
// a switchable var so one spec covers both; `setWrap` resets `result`.
//
// Request vs commit (map ticket rt1p). Every value-changing event (spin keys,
// Home/End, the stepper buttons, Enter commit and blur) is a *request* carrying
// an intent (`requested`); it fires onValueChange (`requests` counts the calls)
// when the intent differs from the current value, and then:
//   uncontrolled        the request is accepted: the value commits the intent
//   controlled, holds   the host ignores it ("rejected"): the value is untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       value commits through the controlled prop, not the event
// `valueProp` is the only thing that changes the value while `controlled`;
// `setValue` / `hostToggle` are the host writing it. `control` / `acceptRequests`
// are configuration events (init is literal-only). Typing, Escape and `setWrap`
// change no committed value, so they are not requests. Invariants for the
// model: ControlledFollowsProp (no event commits while controlled),
// RejectedRequestUntouched, AcceptedRequestCommits.
//
// Range constants are small on purpose: min 1, max 12 (a month), step 1, page 3.
//
// Deliberately omitted:
//   - aria-valuetext / labels (aria-label, aria-labelledby): strings with no
//     state; the Solid layer supplies them.
//   - spinbuttons without a min/max (aria-valuemin/max are always present),
//     and non-integer ("decimal") values.
//   - per-character text editing, caret/selection, and key filtering: `draft`
//     is replaced wholesale by a sample text.
//   - the commit/revert policy (Enter/Escape/blur) is a widely used
//     convention, not APG text; so is the buttons' aria-disabled-at-bound.
//   - press-and-hold auto-repeat on the buttons, mouse wheel.
//
// Generator notes: no action preconditions (guards live in the assignment
// RHS); every action assigns every var.
module apg_spinbutton {
  var value: int      // the committed value (aria-valuenow), always in [min,max]
  var focused: bool   // the text field has focus
  var editing: bool   // the text field holds an uncommitted draft
  var draft: str      // the typed text while editing, "" otherwise
  var wrap: bool      // variant: wrap-around instead of clamping at the bounds
  var result: str     // what the last action did: "none" | "focused" | "blurred" | "stepped" | "clamped" | "wrapped" | "jumped" | "typed" | "committed" | "reverted" | "mode"
  var controlled: bool // the host owns the value (`value` prop present)
  var accepting: bool  // controlled host that answers every request with its intent
  var valueProp: int   // the controlled value prop (meaningful while controlled)
  var requested: int   // intent of the last request
  var outcome: str     // "none" | "accepted" | "rejected": fate of the last request
  var base: int        // value when the last request was received
  var requests: int    // number of requests that fired onValueChange

  // --- range constants ---------------------------------------------------
  def minValue: int = 1
  def maxValue: int = 12
  def smallStep: int = 1
  def largeStep: int = 3
  def span: int = maxValue - minValue + 1

  // --- draft validity pool -----------------------------------------------
  def draftIsNumber(t: str): bool =
    or(or(t == "5", t == "12"), or(t == "13", t == "0"))
  def draftNumber(t: str): int =
    if (t == "5") 5 else if (t == "12") 12 else if (t == "13") 13 else 0
  def draftInRange(t: str): bool =
    and(draftIsNumber(t), and(draftNumber(t) >= minValue, draftNumber(t) <= maxValue))

  // --- value arithmetic: clamp vs wrap -----------------------------------
  def up(v: int, d: int, w: bool): int =
    if (v + d <= maxValue) v + d else if (w) v + d - span else maxValue
  def down(v: int, d: int, w: bool): int =
    if (v - d >= minValue) v - d else if (w) v - d + span else minValue
  def upResult(v: int, d: int, w: bool): str =
    if (v + d <= maxValue) "stepped" else if (w) "wrapped" else "clamped"
  def downResult(v: int, d: int, w: bool): str =
    if (v - d >= minValue) "stepped" else if (w) "wrapped" else "clamped"

  // the value a spin key / button steps from: a pending valid draft wins,
  // an invalid one is discarded
  def resolveBase(ed: bool, dr: str, v: int): int =
    if (and(ed, draftInRange(dr))) draftNumber(dr) else v
  def resolveResult(ed: bool, dr: str): str =
    if (ed) (if (draftInRange(dr)) "committed" else "reverted") else "none"

  // --- request / commit (map ticket rt1p) ----------------------------------
  def moved(before: int, after: int): int = if (before == after) 0 else 1
  def wants(f: bool, current: int, want: int): bool = and(f, want != current)
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  def landed(h: bool, current: int, want: int): int = if (h) current else want
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p

  // --- ARIA contract, derived from the state -----------------------------
  def role: str = "spinbutton"
  def ariaValueNow(v: int): int = v
  def ariaValueMin: int = minValue
  def ariaValueMax: int = maxValue
  // aria-invalid: the pending draft is not an in-range number
  def ariaInvalid(ed: bool, dr: str): bool = and(ed, not(draftInRange(dr)))
  def inputTabindex: int = 0
  def incrementTabindex: int = -1
  def decrementTabindex: int = -1
  // buttons are inert at a bound only when clamping
  def incrementDisabled(v: int, w: bool): bool = and(not(w), v == maxValue)
  def decrementDisabled(v: int, w: bool): bool = and(not(w), v == minValue)

  action init = all {
    value' = 5,
    focused' = false,
    editing' = false,
    draft' = "",
    wrap' = false,
    result' = "none",
    controlled' = false,
    accepting' = false,
    valueProp' = 5,
    requested' = 5,
    outcome' = "none",
    base' = 5,
    requests' = 0
  }

  action focus = all {
    value' = value,
    focused' = true,
    editing' = editing,
    draft' = draft,
    wrap' = wrap,
    result' = "focused",
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // request: blur ends editing and commits a valid draft / reverts an invalid one
  action blur = all {
    value' = landed(holds, value, resolveBase(editing, draft, value)),
    focused' = false,
    editing' = false,
    draft' = "",
    wrap' = wrap,
    result' = if (editing) resolveResult(editing, draft) else "blurred",
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (wants(true, value, resolveBase(editing, draft, value))) propAfter(follows, valueProp, resolveBase(editing, draft, value)) else valueProp,
    requested' = if (wants(true, value, resolveBase(editing, draft, value))) resolveBase(editing, draft, value) else requested,
    outcome' = if (wants(true, value, resolveBase(editing, draft, value))) verdict else outcome,
    base' = if (wants(true, value, resolveBase(editing, draft, value))) value else base,
    requests' = if (wants(true, value, resolveBase(editing, draft, value))) requests + 1 else requests
  }

  // request: keyboard, only acts while the text field has focus
  action arrowUp = all {
    value' = if (focused) landed(holds, value, up(resolveBase(editing, draft, value), smallStep, wrap)) else value,
    focused' = focused,
    editing' = false,
    draft' = "",
    wrap' = wrap,
    result' = if (focused) upResult(resolveBase(editing, draft, value), smallStep, wrap) else result,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (wants(focused, value, up(resolveBase(editing, draft, value), smallStep, wrap))) propAfter(follows, valueProp, up(resolveBase(editing, draft, value), smallStep, wrap)) else valueProp,
    requested' = if (wants(focused, value, up(resolveBase(editing, draft, value), smallStep, wrap))) up(resolveBase(editing, draft, value), smallStep, wrap) else requested,
    outcome' = if (wants(focused, value, up(resolveBase(editing, draft, value), smallStep, wrap))) verdict else outcome,
    base' = if (wants(focused, value, up(resolveBase(editing, draft, value), smallStep, wrap))) value else base,
    requests' = if (wants(focused, value, up(resolveBase(editing, draft, value), smallStep, wrap))) requests + 1 else requests
  }

  action arrowDown = all {
    value' = if (focused) landed(holds, value, down(resolveBase(editing, draft, value), smallStep, wrap)) else value,
    focused' = focused,
    editing' = false,
    draft' = "",
    wrap' = wrap,
    result' = if (focused) downResult(resolveBase(editing, draft, value), smallStep, wrap) else result,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (wants(focused, value, down(resolveBase(editing, draft, value), smallStep, wrap))) propAfter(follows, valueProp, down(resolveBase(editing, draft, value), smallStep, wrap)) else valueProp,
    requested' = if (wants(focused, value, down(resolveBase(editing, draft, value), smallStep, wrap))) down(resolveBase(editing, draft, value), smallStep, wrap) else requested,
    outcome' = if (wants(focused, value, down(resolveBase(editing, draft, value), smallStep, wrap))) verdict else outcome,
    base' = if (wants(focused, value, down(resolveBase(editing, draft, value), smallStep, wrap))) value else base,
    requests' = if (wants(focused, value, down(resolveBase(editing, draft, value), smallStep, wrap))) requests + 1 else requests
  }

  action pageUp = all {
    value' = if (focused) landed(holds, value, up(resolveBase(editing, draft, value), largeStep, wrap)) else value,
    focused' = focused,
    editing' = false,
    draft' = "",
    wrap' = wrap,
    result' = if (focused) upResult(resolveBase(editing, draft, value), largeStep, wrap) else result,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (wants(focused, value, up(resolveBase(editing, draft, value), largeStep, wrap))) propAfter(follows, valueProp, up(resolveBase(editing, draft, value), largeStep, wrap)) else valueProp,
    requested' = if (wants(focused, value, up(resolveBase(editing, draft, value), largeStep, wrap))) up(resolveBase(editing, draft, value), largeStep, wrap) else requested,
    outcome' = if (wants(focused, value, up(resolveBase(editing, draft, value), largeStep, wrap))) verdict else outcome,
    base' = if (wants(focused, value, up(resolveBase(editing, draft, value), largeStep, wrap))) value else base,
    requests' = if (wants(focused, value, up(resolveBase(editing, draft, value), largeStep, wrap))) requests + 1 else requests
  }

  action pageDown = all {
    value' = if (focused) landed(holds, value, down(resolveBase(editing, draft, value), largeStep, wrap)) else value,
    focused' = focused,
    editing' = false,
    draft' = "",
    wrap' = wrap,
    result' = if (focused) downResult(resolveBase(editing, draft, value), largeStep, wrap) else result,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (wants(focused, value, down(resolveBase(editing, draft, value), largeStep, wrap))) propAfter(follows, valueProp, down(resolveBase(editing, draft, value), largeStep, wrap)) else valueProp,
    requested' = if (wants(focused, value, down(resolveBase(editing, draft, value), largeStep, wrap))) down(resolveBase(editing, draft, value), largeStep, wrap) else requested,
    outcome' = if (wants(focused, value, down(resolveBase(editing, draft, value), largeStep, wrap))) verdict else outcome,
    base' = if (wants(focused, value, down(resolveBase(editing, draft, value), largeStep, wrap))) value else base,
    requests' = if (wants(focused, value, down(resolveBase(editing, draft, value), largeStep, wrap))) requests + 1 else requests
  }

  action home = all {
    value' = if (focused) landed(holds, value, minValue) else value,
    focused' = focused,
    editing' = false,
    draft' = "",
    wrap' = wrap,
    result' = if (focused) "jumped" else result,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (wants(focused, value, minValue)) propAfter(follows, valueProp, minValue) else valueProp,
    requested' = if (wants(focused, value, minValue)) minValue else requested,
    outcome' = if (wants(focused, value, minValue)) verdict else outcome,
    base' = if (wants(focused, value, minValue)) value else base,
    requests' = if (wants(focused, value, minValue)) requests + 1 else requests
  }

  action end = all {
    value' = if (focused) landed(holds, value, maxValue) else value,
    focused' = focused,
    editing' = false,
    draft' = "",
    wrap' = wrap,
    result' = if (focused) "jumped" else result,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (wants(focused, value, maxValue)) propAfter(follows, valueProp, maxValue) else valueProp,
    requested' = if (wants(focused, value, maxValue)) maxValue else requested,
    outcome' = if (wants(focused, value, maxValue)) verdict else outcome,
    base' = if (wants(focused, value, maxValue)) value else base,
    requests' = if (wants(focused, value, maxValue)) requests + 1 else requests
  }

  // request: pointer, the buttons are out of the tab order, work with or
  // without focus, and leave focus on the text field
  action clickIncrement = all {
    value' = landed(holds, value, up(resolveBase(editing, draft, value), smallStep, wrap)),
    focused' = true,
    editing' = false,
    draft' = "",
    wrap' = wrap,
    result' = upResult(resolveBase(editing, draft, value), smallStep, wrap),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (wants(true, value, up(resolveBase(editing, draft, value), smallStep, wrap))) propAfter(follows, valueProp, up(resolveBase(editing, draft, value), smallStep, wrap)) else valueProp,
    requested' = if (wants(true, value, up(resolveBase(editing, draft, value), smallStep, wrap))) up(resolveBase(editing, draft, value), smallStep, wrap) else requested,
    outcome' = if (wants(true, value, up(resolveBase(editing, draft, value), smallStep, wrap))) verdict else outcome,
    base' = if (wants(true, value, up(resolveBase(editing, draft, value), smallStep, wrap))) value else base,
    requests' = if (wants(true, value, up(resolveBase(editing, draft, value), smallStep, wrap))) requests + 1 else requests
  }

  action clickDecrement = all {
    value' = landed(holds, value, down(resolveBase(editing, draft, value), smallStep, wrap)),
    focused' = true,
    editing' = false,
    draft' = "",
    wrap' = wrap,
    result' = downResult(resolveBase(editing, draft, value), smallStep, wrap),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (wants(true, value, down(resolveBase(editing, draft, value), smallStep, wrap))) propAfter(follows, valueProp, down(resolveBase(editing, draft, value), smallStep, wrap)) else valueProp,
    requested' = if (wants(true, value, down(resolveBase(editing, draft, value), smallStep, wrap))) down(resolveBase(editing, draft, value), smallStep, wrap) else requested,
    outcome' = if (wants(true, value, down(resolveBase(editing, draft, value), smallStep, wrap))) verdict else outcome,
    base' = if (wants(true, value, down(resolveBase(editing, draft, value), smallStep, wrap))) value else base,
    requests' = if (wants(true, value, down(resolveBase(editing, draft, value), smallStep, wrap))) requests + 1 else requests
  }

  // text editing: the draft is replaced by a sample text; value is untouched
  action typeText = {
    nondet text = Set("", "5", "12", "13", "0", "abc").oneOf()
    all {
      value' = value,
      focused' = focused,
      editing' = if (focused) true else editing,
      draft' = if (focused) text else draft,
      wrap' = wrap,
      result' = if (focused) "typed" else result,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      outcome' = outcome,
      base' = base,
      requests' = requests
    }
  }

  // request: Enter commits a valid draft, reverts an invalid one; stay focused
  action commit = all {
    value' = if (focused) landed(holds, value, resolveBase(editing, draft, value)) else value,
    focused' = focused,
    editing' = if (focused) false else editing,
    draft' = if (focused) "" else draft,
    wrap' = wrap,
    result' = if (focused) resolveResult(editing, draft) else result,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (wants(focused, value, resolveBase(editing, draft, value))) propAfter(follows, valueProp, resolveBase(editing, draft, value)) else valueProp,
    requested' = if (wants(focused, value, resolveBase(editing, draft, value))) resolveBase(editing, draft, value) else requested,
    outcome' = if (wants(focused, value, resolveBase(editing, draft, value))) verdict else outcome,
    base' = if (wants(focused, value, resolveBase(editing, draft, value))) value else base,
    requests' = if (wants(focused, value, resolveBase(editing, draft, value))) requests + 1 else requests
  }

  // Escape: drop the draft, keep the committed value (not a request)
  action revert = all {
    value' = value,
    focused' = focused,
    editing' = false,
    draft' = "",
    wrap' = wrap,
    result' = if (editing) "reverted" else "none",
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action setWrap = {
    nondet mode = Set(true, false).oneOf()
    all {
      value' = value,
      focused' = focused,
      editing' = editing,
      draft' = draft,
      wrap' = mode,
      result' = "mode",
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
    nondet v = Set(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12).oneOf()
    all {
      value' = if (controlled) v else value,
      focused' = focused,
      editing' = editing,
      draft' = draft,
      wrap' = wrap,
      result' = result,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) v else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips its own copy of the value between the range ends
  // (an outside two-state control)
  action hostToggle = all {
    value' = if (controlled) (if (valueProp == maxValue) minValue else maxValue) else value,
    focused' = focused,
    editing' = editing,
    draft' = draft,
    wrap' = wrap,
    result' = result,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) (if (valueProp == maxValue) minValue else maxValue) else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the host starts owning the value, adopting the current one
  action control = all {
    value' = value,
    focused' = focused,
    editing' = editing,
    draft' = draft,
    wrap' = wrap,
    result' = result,
    controlled' = true,
    accepting' = accepting,
    valueProp' = value,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    value' = value,
    focused' = focused,
    editing' = editing,
    draft' = draft,
    wrap' = wrap,
    result' = result,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, focus, blur, arrowUp, arrowDown, pageUp, pageDown, home, end,
    clickIncrement, clickDecrement, typeText, commit, revert, setWrap,
    setValue, hostToggle, control, acceptRequests
  }

  // --- invariants --------------------------------------------------------
  // the committed value is always inside [min, max]; invalid text never lands in it
  val ValueInRange: bool = and(value >= minValue, value <= maxValue)
  // aria-valuenow lies within aria-valuemin..aria-valuemax
  val AriaNowWithinBounds: bool =
    and(ariaValueMin <= ariaValueNow(value), ariaValueNow(value) <= ariaValueMax)
  // the derived ARIA bounds are the range constants
  val AriaBoundsMatchRange: bool =
    and(ariaValueMin == minValue, ariaValueMax == maxValue)
  // the text field is the one Tab stop; the buttons never are
  val ButtonsOutOfTabOrder: bool =
    and(inputTabindex == 0, and(incrementTabindex == -1, decrementTabindex == -1))
  // a draft exists exactly while editing
  val DraftOnlyWhileEditing: bool = or(editing, draft == "")
  // typing needs focus, and blur/Escape/Enter end it
  val EditingImpliesFocus: bool = or(not(editing), focused)
  // aria-invalid is only ever a property of the pending draft
  val InvalidImpliesEditing: bool = or(not(ariaInvalid(editing, draft)), editing)
  // a bound hit in clamp mode never reports a wrap, and vice versa
  val WrapResultMatchesMode: bool =
    and(or(not(result == "wrapped"), wrap), or(not(result == "clamped"), not(wrap)))
  // disabled buttons are only offered when clamping at that exact bound
  val DisabledOnlyAtBound: bool =
    and(
      or(not(incrementDisabled(value, wrap)), and(not(wrap), value == maxValue)),
      or(not(decrementDisabled(value, wrap)), and(not(wrap), value == minValue))
    )
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), value == valueProp)
  // a rejected request leaves the state as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), value == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), value == requested)
}
