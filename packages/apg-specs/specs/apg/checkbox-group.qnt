// WAI-ARIA APG — Checkbox pattern: the tri-state (mixed) group controller.
//
// Modelled from https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/ ("About This
// Pattern": one tri-state checkbox represents and controls a group of dual-state
// checkboxes; "Keyboard Interaction": Space changes the state; "Roles, States,
// and Properties": aria-checked true / false / mixed) and the Mixed-State example
// https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox-mixed/
// (Tab moves among the checkboxes; Space on the controller sets the children; the
// controller has aria-controls = the children).
//
// The controller (focus target "parent") owns no state: its aria-checked is
// DERIVED from the three children c0..c2 —
//   all checked -> "true", none checked -> "false", otherwise -> "mixed".
// Activating the controller:
//   all checked              -> uncheck all
//   mixed                    -> check all
//   none checked             -> check all, or — when `remember` is on and a mixed
//                               combination was seen before — restore that last
//                               mixed combination ("activating the overall
//                               checkbox a third time recreates that partially
//                               checked state"). Cycle: mixed -> true -> false -> mixed.
// Activating a child toggles just that child.
//
// Request vs commit (map ticket rt1p). Activating a checkbox (click / Space) is
// a *request* carrying the intended checked set (`requested`, the three children
// packed with `packed`). It fires onValueChange (`requests` counts the calls)
// when the intent differs from the current value, and then:
//   uncontrolled        the request is accepted: the children commit the intent
//   controlled, holds   the host ignores it ("rejected"): the children are untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       children commit through the controlled value
// The controlled value (`valueProp`, the three checked bits packed) is the only
// thing that changes the children while `controlled`; `setValue` / `hostToggle`
// are the host writing it. `control` and `acceptRequests` are configuration
// events (init is literal-only). The mixed memory (m0..m2) is internal derived
// state, not the controlled value, and tracks the combination being left.
//
// Configuration variants: `remember` (the optional last-mixed memory) is a prop.
// The group size is a constant 3 (bool vars — the generator has no collections),
// so the controlled value is packed and every action assigns every var.
//
// Deliberate omissions:
//   - per-child disabled / the disabled controller (see checkbox.qnt for disabling)
//   - Space armed-on-keydown / fire-on-keyup and pointer arming (see checkbox.qnt);
//     here Space and click activate directly (a collapsed key/pointer press)
//   - shift+Tab, accessible names, fieldset/legend or role=group labelling
//   - the page-load "default combination" fallback: with no mixed memory the
//     controller checks all
//   - a variable number of children (generator subset: no lists/sets in state)
module apg_checkbox_group {
  var c0: bool        // child checkbox 0 checked
  var c1: bool        // child checkbox 1 checked
  var c2: bool        // child checkbox 2 checked
  var m0: bool        // last mixed combination seen, child 0 (all false = none yet)
  var m1: bool        // ... child 1
  var m2: bool        // ... child 2
  var focus: str      // "none" | "parent" | "c0" | "c1" | "c2"
  var remember: bool  // config: the controller restores the last mixed combination
  var controlled: bool // the host owns the value (`value` prop present)
  var accepting: bool  // controlled host that answers every request with its intent
  var valueProp: int   // the controlled value prop, packed with `packed`
  var requested: int   // intent of the last request, packed
  var outcome: str     // "none" | "accepted" | "rejected"
  var base: int        // value when the last request was received, packed
  var requests: int    // number of requests that fired onValueChange

  def isAll(a: bool, b: bool, c: bool): bool = and(a, b, c)
  def isNone(a: bool, b: bool, c: bool): bool = not(or(a, b, c))
  def isMixedSet(a: bool, b: bool, c: bool): bool =
    and(not(isAll(a, b, c)), not(isNone(a, b, c)))

  // ARIA attribute contract of the controller (aria-controls = c0 c1 c2, constant)
  def parentChecked(a: bool, b: bool, c: bool): str =
    if (isAll(a, b, c)) "true" else if (isNone(a, b, c)) "false" else "mixed"

  // the third activation: none checked, memory on, and a mixed combination known
  def restores(a: bool, b: bool, c: bool, ma: bool, mb: bool, mc: bool, remember: bool): bool =
    and(remember, isNone(a, b, c), isMixedSet(ma, mb, mc))

  // one child's next value when `target` is activated
  def nextChild(name: str, ci: bool, mi: bool, target: str, allChecked: bool, restore: bool): bool =
    if (target == name) not(ci)
    else if (target == "parent") (if (allChecked) false else if (restore) mi else true)
    else ci

  // the memory tracks the combination being left while the group is mixed
  def keepMemory(mixedNow: bool, ci: bool, mi: bool): bool = if (mixedNow) ci else mi

  // Tab order: outside -> controller -> c0 -> c1 -> c2 -> outside
  def nextFocus(f: str): str =
    if (f == "none") "parent"
    else if (f == "parent") "c0"
    else if (f == "c0") "c1"
    else if (f == "c1") "c2"
    else "none"

  // ---- request / commit (map ticket rt1p) -------------------------------
  def b2i(b: bool): int = if (b) 1 else 0
  // injective for three bools: bit 0 = c0, bit 1 = c1, bit 2 = c2
  def packed(a: bool, b: bool, c: bool): int =
    b2i(a) + 2 * b2i(b) + 4 * b2i(c)
  def bitAt(i: int, n: int): bool =
    if (i == 0) n % 2 == 1 else if (i == 1) (n / 2) % 2 == 1 else (n / 4) % 2 == 1
  def holds: bool = and(controlled, not(accepting))
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  def landed(h: bool, current: bool, want: bool): bool = if (h) current else want
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p
  def nowPacked: int = packed(c0, c1, c2)
  // the intended checked set of activating `target`, packed
  def intent(name: str, ci: bool, mi: bool, target: str): bool =
    nextChild(name, ci, mi, target, isAll(c0, c1, c2), restores(c0, c1, c2, m0, m1, m2, remember))
  def intentPacked(target: str): int =
    packed(
      intent("c0", c0, m0, target),
      intent("c1", c1, m1, target),
      intent("c2", c2, m2, target)
    )
  def moves(target: str): bool = intentPacked(target) != nowPacked
  // the host flips one bit of its own copy of the value
  def flipAt(n: int, i: int): int =
    if (i == 0) (if (bitAt(0, n)) n - 1 else n + 1)
    else if (i == 1) (if (bitAt(1, n)) n - 2 else n + 2)
    else (if (bitAt(2, n)) n - 4 else n + 4)

  action init = all {
    c0' = false,
    c1' = false,
    c2' = false,
    m0' = false,
    m1' = false,
    m2' = false,
    focus' = "none",
    remember' = false,
    controlled' = false,
    accepting' = false,
    valueProp' = 0,
    requested' = 0,
    outcome' = "none",
    base' = 0,
    requests' = 0
  }

  action focus_on = {
    nondet target = Set("parent", "c0", "c1", "c2").oneOf()
    all {
      c0' = c0,
      c1' = c1,
      c2' = c2,
      m0' = m0,
      m1' = m1,
      m2' = m2,
      focus' = target,
      remember' = remember,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      outcome' = outcome,
      base' = base,
      requests' = requests
    }
  }

  action blur = all {
    c0' = c0,
    c1' = c1,
    c2' = c2,
    m0' = m0,
    m1' = m1,
    m2' = m2,
    focus' = "none",
    remember' = remember,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // Keyboard Interaction: Tab moves focus among the checkboxes
  action key_tab = all {
    c0' = c0,
    c1' = c1,
    c2' = c2,
    m0' = m0,
    m1' = m1,
    m2' = m2,
    focus' = nextFocus(focus),
    remember' = remember,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // request: Space changes the state of the focused checkbox
  action key_space = all {
    c0' = landed(holds, c0, intent("c0", c0, m0, focus)),
    c1' = landed(holds, c1, intent("c1", c1, m1, focus)),
    c2' = landed(holds, c2, intent("c2", c2, m2, focus)),
    m0' = keepMemory(isMixedSet(c0, c1, c2), c0, m0),
    m1' = keepMemory(isMixedSet(c0, c1, c2), c1, m1),
    m2' = keepMemory(isMixedSet(c0, c1, c2), c2, m2),
    focus' = focus,
    remember' = remember,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, intentPacked(focus)),
    requested' = if (moves(focus)) intentPacked(focus) else requested,
    outcome' = if (moves(focus)) verdict else outcome,
    base' = if (moves(focus)) nowPacked else base,
    requests' = if (moves(focus)) requests + 1 else requests
  }

  // pointer: a click focuses its target and requests activation
  action click = {
    nondet target = Set("parent", "c0", "c1", "c2").oneOf()
    all {
      c0' = landed(holds, c0, intent("c0", c0, m0, target)),
      c1' = landed(holds, c1, intent("c1", c1, m1, target)),
      c2' = landed(holds, c2, intent("c2", c2, m2, target)),
      m0' = keepMemory(isMixedSet(c0, c1, c2), c0, m0),
      m1' = keepMemory(isMixedSet(c0, c1, c2), c1, m1),
      m2' = keepMemory(isMixedSet(c0, c1, c2), c2, m2),
      focus' = target,
      remember' = remember,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, intentPacked(target)),
      requested' = if (moves(target)) intentPacked(target) else requested,
      outcome' = if (moves(target)) verdict else outcome,
      base' = if (moves(target)) nowPacked else base,
      requests' = if (moves(target)) requests + 1 else requests
    }
  }

  // prop change: the optional last-mixed memory
  action set_remember = {
    nondet value = Set(true, false).oneOf()
    all {
      c0' = c0,
      c1' = c1,
      c2' = c2,
      m0' = m0,
      m1' = m1,
      m2' = m2,
      focus' = focus,
      remember' = value,
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
      c0' = if (controlled) bitAt(0, v) else c0,
      c1' = if (controlled) bitAt(1, v) else c1,
      c2' = if (controlled) bitAt(2, v) else c2,
      m0' = m0,
      m1' = m1,
      m2' = m2,
      focus' = focus,
      remember' = remember,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) v else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host flips one child of its own copy of the value
  action hostToggle = {
    nondet panel = Set(0, 1, 2).oneOf()
    all {
      c0' = if (controlled) bitAt(0, flipAt(valueProp, panel)) else c0,
      c1' = if (controlled) bitAt(1, flipAt(valueProp, panel)) else c1,
      c2' = if (controlled) bitAt(2, flipAt(valueProp, panel)) else c2,
      m0' = m0,
      m1' = m1,
      m2' = m2,
      focus' = focus,
      remember' = remember,
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
    c0' = c0,
    c1' = c1,
    c2' = c2,
    m0' = m0,
    m1' = m1,
    m2' = m2,
    focus' = focus,
    remember' = remember,
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
    c0' = c0,
    c1' = c1,
    c2' = c2,
    m0' = m0,
    m1' = m1,
    m2' = m2,
    focus' = focus,
    remember' = remember,
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
    focus_on,
    blur,
    key_tab,
    key_space,
    click,
    set_remember,
    setValue,
    hostToggle,
    control,
    acceptRequests
  }

  // APG: a mixed controller is mixed iff the children disagree
  val MixedIffChildrenDisagree: bool =
    (parentChecked(c0, c1, c2) == "mixed") == or(c0 != c1, c1 != c2)
  // checked iff every child is checked
  val CheckedIffAllChildrenChecked: bool =
    (parentChecked(c0, c1, c2) == "true") == and(c0, c1, c2)
  // not checked iff no child is checked
  val UncheckedIffNoChildChecked: bool =
    (parentChecked(c0, c1, c2) == "false") == not(or(c0, c1, c2))
  // the memory only ever holds a genuinely mixed combination (or nothing yet)
  val MemoryIsMixedOrEmpty: bool =
    or(isNone(m0, m1, m2), isMixedSet(m0, m1, m2))
  val FocusValid: bool = or(
    focus == "none",
    focus == "parent",
    focus == "c0",
    focus == "c1",
    focus == "c2"
  )
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the state, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), nowPacked == valueProp)
  // a rejected request leaves the state as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), nowPacked == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), nowPacked == requested)
}
