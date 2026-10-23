// APG Window Splitter — https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
//
// A role=separator that resizes the primary pane (aria-controls="primary").
// The spec models the widget state (`value`, `collapsed`, the remembered
// `prev`) and the rendered aria-valuenow (`ariaNow`); aria-valuemin / -max are
// the constants MIN / MAX below.
//
// Orientation names the splitter bar, as in APG: a "vertical" splitter sits
// between left/right panes (Left/Right move it), a "horizontal" one between
// top/bottom panes (Up/Down move it). Left/Up shrink the primary pane,
// Right/Down grow it.
//
// Events are the user-level alphabet shared with the scenario bridge:
//   focusSplitter / blur       the separator gains / loses focus
//   left right up down         arrow keys (only the pair matching the orientation moves)
//   home end                   optional: jump to MIN / MAX
//   enter                      toggle collapse; expanding restores the remembered value
//   f6                         optional: cycle focus splitter -> secondary -> primary -> splitter
//   orientVertical / orientHorizontal / makeFixed / makeResizable   prop changes
//
// A fixed splitter ignores arrows and Home/End: only Enter acts.
// While collapsed, arrows and Home/End are no-ops (collapsed => value == MIN).
//
// Request vs commit (map ticket rt1p). `value` (the primary pane size) is the
// controlled value: every movement — left, right, up, down, home, end, enter —
// is a *request* carrying its target (`requested`). It fires onValueChange
// (`requests` counts the calls) when the target differs from the current value,
// and then:
//   uncontrolled        the request is accepted: `value` commits the target
//   controlled, holds   the host ignores it ("rejected"): `value` is untouched
//   controlled, accepts the host writes the target back (`accepting`)
// `valueProp` is the host's copy (meaningful while `controlled`); `setValue` /
// `hostToggle` are the host writing it, the only commit while controlled.
// `control` / `acceptRequests` configure the host (init is literal-only).
// Because collapse is entangled with `value`, its side effects (collapsed /
// prev / justRestored) are gated by the same rejection as the value commit.
//
// Invariants for the model: ControlledFollowsProp (in controlled mode no event
// commits), RejectedRequestUntouched, AcceptedRequestCommits.
//
// `outcome` is "none" | "accepted" | "rejected" for the last request; a host
// write settles it back to "none". `base` is the value when it was received.
//
// ponytail: F6 is always modelled (no on/off variant); dragging and a
// min-size above 0 are not modelled.
module apg_windowsplitter {
  import aria.* from "../../shared/aria"

  var orientation: str    // "vertical" | "horizontal"
  var fixed: bool         // fixed splitter: only Enter acts
  var value: int          // primary pane size, MIN..MAX
  var prev: int           // value remembered at the last collapse
  var collapsed: bool     // primary pane is collapsed
  var justRestored: bool  // the last event was an Enter that restored `prev`
  var focus: str          // "none" | "splitter" | "primary" | "secondary"
  var ariaNow: int        // rendered aria-valuenow
  var requests: int       // number of requests that fired onValueChange
  var controlled: bool    // the host owns the value (`value` prop present)
  var accepting: bool     // controlled host that answers every request with its intent
  var valueProp: int      // the controlled value prop (meaningful while controlled)
  var requested: int      // target of the last request
  var outcome: str        // "none" | "accepted" | "rejected"
  var base: int           // value when the last request was received

  def MIN: int = 0
  def MAX: int = 6
  def STEP: int = 2
  def INITIAL: int = 4

  def clamp(v: int): int = if (v < MIN) MIN else if (v > MAX) MAX else v
  def movable: bool = and(focus == "splitter", and(not(fixed), not(collapsed)))
  def arrowTarget(o: str, delta: int): int =
    if (and(movable, orientation == o)) clamp(value + delta) else value
  def homeTarget: int = if (movable) MIN else value
  def endTarget: int = if (movable) MAX else value
  def onSplitter: bool = focus == "splitter"
  def f6Focus: str =
    if (focus == "splitter") "secondary"
    else if (focus == "secondary") "primary"
    else if (focus == "primary") "splitter"
    else "none"
  def enterValue: int =
    if (not(onSplitter)) value else if (collapsed) prev else MIN

  // --- request / commit (map ticket rt1p) ----------------------------------
  def moved(a: int, b: int): int = if (a == b) 0 else 1
  def holds: bool = and(controlled, not(accepting))
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the value after a request for `want`
  def landed(h: bool, v: int, want: int): int = if (h) v else want
  // the value prop after a request for `want`
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p
  // the target of each movement event
  def wantLeft: int = arrowTarget("vertical", 0 - STEP)
  def wantRight: int = arrowTarget("vertical", STEP)
  def wantUp: int = arrowTarget("horizontal", 0 - STEP)
  def wantDown: int = arrowTarget("horizontal", STEP)
  def wantHome: int = homeTarget
  def wantEnd: int = endTarget
  def wantEnter: int = enterValue
  // an Enter that would not move the value is not a rejected request: the
  // collapse flag still flips (there is nothing for the host to veto)
  def rejectEnter: bool = and(holds, value != wantEnter)

  action init = all {
    orientation' = "vertical",
    fixed' = false,
    value' = INITIAL,
    prev' = INITIAL,
    collapsed' = false,
    justRestored' = false,
    focus' = "none",
    ariaNow' = INITIAL,
    requests' = 0,
    controlled' = false,
    accepting' = false,
    valueProp' = INITIAL,
    requested' = INITIAL,
    outcome' = "none",
    base' = INITIAL
  }

  action focusSplitter = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = value,
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = "splitter",
    ariaNow' = ariaNow,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action blur = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = value,
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = "none",
    ariaNow' = ariaNow,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  // request: move left by one step
  action left = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = landed(holds, value, wantLeft),
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = landed(holds, value, wantLeft),
    requests' = requests + moved(value, wantLeft),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantLeft),
    requested' = if (value == wantLeft) requested else wantLeft,
    outcome' = if (value == wantLeft) outcome else verdict,
    base' = if (value == wantLeft) base else value
  }

  action right = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = landed(holds, value, wantRight),
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = landed(holds, value, wantRight),
    requests' = requests + moved(value, wantRight),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantRight),
    requested' = if (value == wantRight) requested else wantRight,
    outcome' = if (value == wantRight) outcome else verdict,
    base' = if (value == wantRight) base else value
  }

  action up = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = landed(holds, value, wantUp),
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = landed(holds, value, wantUp),
    requests' = requests + moved(value, wantUp),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantUp),
    requested' = if (value == wantUp) requested else wantUp,
    outcome' = if (value == wantUp) outcome else verdict,
    base' = if (value == wantUp) base else value
  }

  action down = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = landed(holds, value, wantDown),
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = landed(holds, value, wantDown),
    requests' = requests + moved(value, wantDown),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantDown),
    requested' = if (value == wantDown) requested else wantDown,
    outcome' = if (value == wantDown) outcome else verdict,
    base' = if (value == wantDown) base else value
  }

  action home = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = landed(holds, value, wantHome),
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = landed(holds, value, wantHome),
    requests' = requests + moved(value, wantHome),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantHome),
    requested' = if (value == wantHome) requested else wantHome,
    outcome' = if (value == wantHome) outcome else verdict,
    base' = if (value == wantHome) base else value
  }

  action end = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = landed(holds, value, wantEnd),
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = landed(holds, value, wantEnd),
    requests' = requests + moved(value, wantEnd),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantEnd),
    requested' = if (value == wantEnd) requested else wantEnd,
    outcome' = if (value == wantEnd) outcome else verdict,
    base' = if (value == wantEnd) base else value
  }

  // request: collapse remembers the current value; expanding restores it.
  // A rejected request leaves collapsed / prev / justRestored untouched too.
  action enter = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = landed(holds, value, wantEnter),
    prev' = if (rejectEnter) prev else (if (and(onSplitter, not(collapsed))) value else prev),
    collapsed' = if (rejectEnter) collapsed else (if (onSplitter) not(collapsed) else collapsed),
    justRestored' = if (rejectEnter) justRestored else (and(onSplitter, collapsed)),
    focus' = focus,
    ariaNow' = landed(holds, value, wantEnter),
    requests' = requests + moved(value, wantEnter),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantEnter),
    requested' = if (value == wantEnter) requested else wantEnter,
    outcome' = if (value == wantEnter) outcome else verdict,
    base' = if (value == wantEnter) base else value
  }

  action f6 = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = value,
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = f6Focus,
    ariaNow' = ariaNow,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action orientVertical = all {
    orientation' = "vertical",
    fixed' = fixed,
    value' = value,
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = ariaNow,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action orientHorizontal = all {
    orientation' = "horizontal",
    fixed' = fixed,
    value' = value,
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = ariaNow,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action makeFixed = all {
    orientation' = orientation,
    fixed' = true,
    value' = value,
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = ariaNow,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action makeResizable = all {
    orientation' = orientation,
    fixed' = false,
    value' = value,
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = ariaNow,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  // commit: the host writes the controlled value (a no-op while uncontrolled).
  // `collapsed` is kept consistent: a value other than MIN cannot be collapsed.
  action setValue = {
    nondet v = Set(0, 2, 4, 6).oneOf()
    all {
      orientation' = orientation,
      fixed' = fixed,
      value' = if (controlled) v else value,
      prev' = if (controlled) (if (v == MIN) prev else v) else prev,
      collapsed' = if (controlled) (if (v == MIN) collapsed else false) else collapsed,
      justRestored' = if (controlled) false else justRestored,
      focus' = focus,
      ariaNow' = if (controlled) v else ariaNow,
      requests' = requests,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) v else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base
    }
  }

  // commit: the host flips its own copy of the value between MIN and MAX
  action hostToggle = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = if (controlled) (if (valueProp == MAX) MIN else MAX) else value,
    prev' = if (controlled) (if (valueProp == MAX) prev else valueProp) else prev,
    collapsed' = if (controlled) (if (valueProp == MAX) collapsed else false) else collapsed,
    justRestored' = if (controlled) false else justRestored,
    focus' = focus,
    ariaNow' = if (controlled) (if (valueProp == MAX) MIN else MAX) else ariaNow,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) (if (valueProp == MAX) MIN else MAX) else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base
  }

  // configuration: the host starts owning the value, adopting the current one
  action control = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = value,
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = ariaNow,
    requests' = requests,
    controlled' = true,
    accepting' = accepting,
    valueProp' = value,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    orientation' = orientation,
    fixed' = fixed,
    value' = value,
    prev' = prev,
    collapsed' = collapsed,
    justRestored' = false,
    focus' = focus,
    ariaNow' = ariaNow,
    requests' = requests,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action step = any {
    init, focusSplitter, blur, left, right, up, down, home, end, enter, f6,
    orientVertical, orientHorizontal, makeFixed, makeResizable,
    setValue, hostToggle, control, acceptRequests
  }

  // APG: aria-valuenow stays within aria-valuemin..aria-valuemax
  val ValueInRange: bool = and(value >= MIN, value <= MAX)
  // the rendered aria-valuenow always mirrors the widget value
  val AriaNowMirrorsValue: bool = ariaNow == value
  // a collapsed primary pane sits at the minimum
  val CollapsedAtMin: bool = or(not(collapsed), value == MIN)
  // the remembered position is always a valid position
  val PrevInRange: bool = and(prev >= MIN, prev <= MAX)
  // restoring returns the splitter to exactly the remembered value
  val RestoreReturnsPrev: bool = or(not(justRestored), and(value == prev, not(collapsed)))
  // focus is one of the modelled positions
  val FocusKnown: bool = or(focus == "none", or(focus == "splitter", or(focus == "primary", focus == "secondary")))
  // orientation is one of the two APG orientations
  val OrientationKnown: bool = ariaOrientationKnown(orientation)
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), value == valueProp)
  // a rejected request leaves the value as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), value == base)
  // an accepted request committed exactly its target
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), value == requested)
}
