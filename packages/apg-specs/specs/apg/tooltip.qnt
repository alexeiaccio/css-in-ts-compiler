// APG Tooltip — https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/ (work in
// progress upstream) plus WCAG 1.4.13 Content on Hover or Focus.
//
// Two triggers ("a", "b") each own one role=tooltip element. The tooltip shows
// on pointer hover or keyboard focus after a delay, hides after a grace period
// once neither the trigger nor the tooltip is engaged, and is:
//   dismissable  Escape hides it without moving pointer or focus, and it stays
//                hidden until the trigger is left (no hover, no focus) and
//                re-entered
//   hoverable    the pointer may travel onto the tooltip; hovering it keeps it
//                open (the grace period is cancelled)
//   persistent   it never hides by itself while engaged: only the hide timer
//                after disengagement, or Escape, removes it
//
// Timers are events, not clocks: `showTimer` and `hideTimer` are the delay
// and grace expiries, firing when the matching timer is armed. "Armed" is state:
//   show timer  `pendA`/`pendB`, set when a trigger is entered
//   hide timer  derived: a tooltip is visible and neither its trigger nor the
//               tooltip is engaged (see `hidable`)
//
// Variant — global warm-up (`warmEnabled`): while another tooltip is visible
// or one was hidden within the warm window (`warm`, cleared by `warmExpire`), a
// newly entered trigger opens immediately and skips the show delay.
//
// Rendered attributes are state too: `describedA`/`describedB` mirror
// aria-describedby on each trigger. This spec removes the attribute while the
// tooltip is hidden; keeping it permanently is also valid per APG.
//
// Request vs commit (map ticket rt1p). The visible tooltip is the controlled
// value, packed as 0 = none, 1 = a, 2 = b. Every user-intent event (focusIn,
// focusOut, pointerEnter, pointerLeave, showTimer, hideTimer, escape) is a
// request carrying the visible value it wants (`requested`). It fires
// onValueChange (`requests` counts the calls) when the intent differs from the
// current value, and then:
//   uncontrolled        the request is accepted: the tooltip commits the intent
//   controlled, holds   the host ignores it ("rejected"): `shown` is untouched
//   controlled, accepts the host writes the intent back (`accepting`)
// `valueProp` is the host's copy (meaningful while `controlled`); `setValue` /
// `hostToggle` are the host writing it, the only commit while controlled.
// `control` / `acceptRequests` configure the host (init is literal-only). The
// non-visible state (focus, pointer, pending timers) still tracks the event, so
// only the visible commit is gated.
//
// Invariants for the model: ControlledFollowsProp (in controlled mode no event
// commits), RejectedRequestUntouched, AcceptedRequestCommits.
//
// Events (user-level alphabet): focusIn(t) / focusOut, pointerEnter(t) /
// pointerLeave, pointerEnterTip, showTimer(t), hideTimer, escape, warmExpire,
// setWarmup(on).
//
// What interest invokers (`interestfor`, popover=hint) would provide natively:
//   - show/hide on hover and focus with `interest-delay-start`/`-end`
//     (the show delay and hide grace period above)
//   - hoverable content: interest stays while the target is hovered
//   - popover=hint: Escape light dismiss, and a hint replaces another open hint
//     (at most one visible)
// Not provided natively: the global warm-up variant, the "stay dismissed until
// the trigger is left and re-entered" memory, and the aria-describedby wiring.
//
// ponytail: two triggers stand in for N; a tooltip with interactive content
// and tooltip-owned focus are out of scope (APG says tooltips never take focus).
module apg_tooltip {
  var focus: str        // "none" | "a" | "b"
  var pointer: str      // "none" | "a" | "b" | "tip" (over the visible tooltip)
  var shownA: bool      // tooltip a is visible
  var shownB: bool      // tooltip b is visible
  var pendA: bool       // show timer armed for a
  var pendB: bool       // show timer armed for b
  var dismA: bool       // a was dismissed with Escape and is still engaged
  var dismB: bool       // b was dismissed with Escape and is still engaged
  var warm: bool        // a tooltip was hidden recently (warm-up window open)
  var warmEnabled: bool // variant switch: global warm-up on
  var describedA: bool  // aria-describedby on trigger a
  var describedB: bool  // aria-describedby on trigger b
  var requests: int     // number of requests that fired onValueChange
  var controlled: bool  // the host owns the visible tooltip (`value` prop present)
  var accepting: bool   // controlled host that answers every request with its intent
  var valueProp: int    // the controlled value prop (0 none, 1 a, 2 b)
  var requested: int    // visible value of the last request
  var outcome: str      // "none" | "accepted" | "rejected"
  var base: int         // visible value when the last request was received

  val visibleT: str = if (shownA) "a" else if (shownB) "b" else "none"

  def isShown(t: str): bool = if (t == "a") shownA else shownB
  def isPend(t: str): bool = if (t == "a") pendA else pendB
  def isDism(t: str): bool = if (t == "a") dismA else dismB
  def otherT(t: str): str = if (t == "a") "b" else "a"
  def entryOf(current: str, t: str): str = if (current == t) "none" else t
  def quickOf(on: bool, w: bool, a: bool, b: bool): bool = and(on, or(w, or(a, b)))

  // the trigger itself has pointer hover or focus
  def trigEng(t: str, f: str, p: str): bool = or(f == t, p == t)
  // the trigger or its visible tooltip is engaged
  def engaged(t: str, f: str, p: str): bool =
    or(trigEng(t, f, p), and(p == "tip", visibleT == t))
  // Escape memory survives only while the trigger stays engaged
  def dismNext(t: str, f: str, p: str): bool = and(isDism(t), trigEng(t, f, p))

  // entering `e` with the warm-up variant on opens it with no delay
  def immediateShow(t: str, f: str, p: str, e: str): bool =
    and(
      and(e == t, quickOf(warmEnabled, warm, shownA, shownB)),
      and(not(dismNext(t, f, p)), not(isShown(t)))
    )
  def shownNext(t: str, f: str, p: str, e: str): bool =
    or(immediateShow(t, f, p, e), and(isShown(t), not(immediateShow(otherT(t), f, p, e))))
  def visNext(f: str, p: str, e: str): str =
    if (shownNext("a", f, p, e)) "a" else if (shownNext("b", f, p, e)) "b" else "none"
  def pendNext(t: str, f: str, p: str, e: str): bool =
    and(
      trigEng(t, f, p),
      and(
        not(shownNext(t, f, p, e)),
        and(not(dismNext(t, f, p)), or(isPend(t), e == t))
      )
    )
  // the pointer rests on a tooltip only while that same tooltip stays visible
  def ptrNext(p: str, f: str, e: str): str =
    if (and(p == "tip", visNext(f, p, e) != visibleT)) "none" else p

  // the visible tooltip lost trigger and tooltip engagement: grace is running
  def hidable(f: str, p: str): bool =
    and(visibleT != "none", not(engaged(visibleT, f, p)))

  // --- request / commit (map ticket rt1p) ----------------------------------
  def visOf(a: bool, b: bool): int = if (a) 1 else if (b) 2 else 0
  def visNow: int = visOf(shownA, shownB)
  def moved(a: int, b: int): int = if (a == b) 0 else 1
  def holds: bool = and(controlled, not(accepting))
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  def landed(h: bool, v: int, want: int): int = if (h) v else want
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p
  // the visible value an event without a host would commit
  def wantVis(f: str, p: str, e: str): int =
    if (shownNext("a", f, p, e)) 1 else if (shownNext("b", f, p, e)) 2 else 0
  // an Escape that would hide a visible tooltip is the request a host can veto
  def rejectHide: bool = and(holds, visNow != 0)
  // the host's own flip: none <-> tooltip a
  def toggleVis: int = if (valueProp == 0) 1 else 0

  action init = all {
    focus' = "none",
    pointer' = "none",
    shownA' = false,
    shownB' = false,
    pendA' = false,
    pendB' = false,
    dismA' = false,
    dismB' = false,
    warm' = false,
    warmEnabled' = false,
    describedA' = false,
    describedB' = false,
    requests' = 0,
    controlled' = false,
    accepting' = false,
    valueProp' = 0,
    requested' = 0,
    outcome' = "none",
    base' = 0
  }

  action focusIn = {
    nondet t = Set("a", "b").oneOf()
    all {
      focus' = t,
      pointer' = ptrNext(pointer, t, entryOf(focus, t)),
      shownA' = if (holds) shownA else (wantVis(t, pointer, entryOf(focus, t)) == 1),
      shownB' = if (holds) shownB else (wantVis(t, pointer, entryOf(focus, t)) == 2),
      pendA' = pendNext("a", t, pointer, entryOf(focus, t)),
      pendB' = pendNext("b", t, pointer, entryOf(focus, t)),
      dismA' = dismNext("a", t, pointer),
      dismB' = dismNext("b", t, pointer),
      warm' = warm,
      warmEnabled' = warmEnabled,
      describedA' = if (holds) describedA else (wantVis(t, pointer, entryOf(focus, t)) == 1),
      describedB' = if (holds) describedB else (wantVis(t, pointer, entryOf(focus, t)) == 2),
      requests' = requests + moved(visNow, wantVis(t, pointer, entryOf(focus, t))),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, wantVis(t, pointer, entryOf(focus, t))),
      requested' = if (visNow == wantVis(t, pointer, entryOf(focus, t))) requested else wantVis(t, pointer, entryOf(focus, t)),
      outcome' = if (visNow == wantVis(t, pointer, entryOf(focus, t))) outcome else verdict,
      base' = if (visNow == wantVis(t, pointer, entryOf(focus, t))) base else visNow
    }
  }

  action focusOut = all {
    focus' = "none",
    pointer' = ptrNext(pointer, "none", "none"),
    shownA' = if (holds) shownA else (wantVis("none", pointer, "none") == 1),
    shownB' = if (holds) shownB else (wantVis("none", pointer, "none") == 2),
    pendA' = pendNext("a", "none", pointer, "none"),
    pendB' = pendNext("b", "none", pointer, "none"),
    dismA' = dismNext("a", "none", pointer),
    dismB' = dismNext("b", "none", pointer),
    warm' = warm,
    warmEnabled' = warmEnabled,
    describedA' = if (holds) describedA else (wantVis("none", pointer, "none") == 1),
    describedB' = if (holds) describedB else (wantVis("none", pointer, "none") == 2),
    requests' = requests + moved(visNow, wantVis("none", pointer, "none")),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantVis("none", pointer, "none")),
    requested' = if (visNow == wantVis("none", pointer, "none")) requested else wantVis("none", pointer, "none"),
    outcome' = if (visNow == wantVis("none", pointer, "none")) outcome else verdict,
    base' = if (visNow == wantVis("none", pointer, "none")) base else visNow
  }

  action pointerEnter = {
    nondet t = Set("a", "b").oneOf()
    all {
      focus' = focus,
      pointer' = ptrNext(t, focus, entryOf(pointer, t)),
      shownA' = if (holds) shownA else (wantVis(focus, t, entryOf(pointer, t)) == 1),
      shownB' = if (holds) shownB else (wantVis(focus, t, entryOf(pointer, t)) == 2),
      pendA' = pendNext("a", focus, t, entryOf(pointer, t)),
      pendB' = pendNext("b", focus, t, entryOf(pointer, t)),
      dismA' = dismNext("a", focus, t),
      dismB' = dismNext("b", focus, t),
      warm' = warm,
      warmEnabled' = warmEnabled,
      describedA' = if (holds) describedA else (wantVis(focus, t, entryOf(pointer, t)) == 1),
      describedB' = if (holds) describedB else (wantVis(focus, t, entryOf(pointer, t)) == 2),
      requests' = requests + moved(visNow, wantVis(focus, t, entryOf(pointer, t))),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, wantVis(focus, t, entryOf(pointer, t))),
      requested' = if (visNow == wantVis(focus, t, entryOf(pointer, t))) requested else wantVis(focus, t, entryOf(pointer, t)),
      outcome' = if (visNow == wantVis(focus, t, entryOf(pointer, t))) outcome else verdict,
      base' = if (visNow == wantVis(focus, t, entryOf(pointer, t))) base else visNow
    }
  }

  action pointerLeave = all {
    focus' = focus,
    pointer' = ptrNext("none", focus, "none"),
    shownA' = if (holds) shownA else (wantVis(focus, "none", "none") == 1),
    shownB' = if (holds) shownB else (wantVis(focus, "none", "none") == 2),
    pendA' = pendNext("a", focus, "none", "none"),
    pendB' = pendNext("b", focus, "none", "none"),
    dismA' = dismNext("a", focus, "none"),
    dismB' = dismNext("b", focus, "none"),
    warm' = warm,
    warmEnabled' = warmEnabled,
    describedA' = if (holds) describedA else (wantVis(focus, "none", "none") == 1),
    describedB' = if (holds) describedB else (wantVis(focus, "none", "none") == 2),
    requests' = requests + moved(visNow, wantVis(focus, "none", "none")),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, wantVis(focus, "none", "none")),
    requested' = if (visNow == wantVis(focus, "none", "none")) requested else wantVis(focus, "none", "none"),
    outcome' = if (visNow == wantVis(focus, "none", "none")) outcome else verdict,
    base' = if (visNow == wantVis(focus, "none", "none")) base else visNow
  }

  // the pointer moves onto the visible tooltip: hoverable content (no commit)
  action pointerEnterTip = all {
    focus' = focus,
    pointer' = if (visibleT != "none") "tip" else pointer,
    shownA' = shownA,
    shownB' = shownB,
    pendA' = pendNext("a", focus, if (visibleT != "none") "tip" else pointer, "none"),
    pendB' = pendNext("b", focus, if (visibleT != "none") "tip" else pointer, "none"),
    dismA' = dismNext("a", focus, if (visibleT != "none") "tip" else pointer),
    dismB' = dismNext("b", focus, if (visibleT != "none") "tip" else pointer),
    warm' = warm,
    warmEnabled' = warmEnabled,
    describedA' = describedA,
    describedB' = describedB,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  // request: the show delay for t elapsed; it replaces any other visible tooltip
  action showTimer = {
    nondet t = Set("a", "b").oneOf()
    all {
      focus' = focus,
      pointer' = if (and(isPend(t), pointer == "tip")) "none" else pointer,
      shownA' = if (holds) shownA
        else if (isPend(t)) t == "a"
        else shownA,
      shownB' = if (holds) shownB
        else if (isPend(t)) t == "b"
        else shownB,
      pendA' = if (and(isPend(t), t == "a")) false else pendA,
      pendB' = if (and(isPend(t), t == "b")) false else pendB,
      dismA' = dismA,
      dismB' = dismB,
      warm' = warm,
      warmEnabled' = warmEnabled,
      describedA' = if (holds) describedA
        else if (isPend(t)) t == "a"
        else describedA,
      describedB' = if (holds) describedB
        else if (isPend(t)) t == "b"
        else describedB,
      requests' = requests + moved(visNow, if (isPend(t)) (if (t == "a") 1 else 2) else visNow),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, if (isPend(t)) (if (t == "a") 1 else 2) else visNow),
      requested' = if (visNow == (if (isPend(t)) (if (t == "a") 1 else 2) else visNow)) requested
        else if (isPend(t)) (if (t == "a") 1 else 2) else visNow,
      outcome' = if (visNow == (if (isPend(t)) (if (t == "a") 1 else 2) else visNow)) outcome else verdict,
      base' = if (visNow == (if (isPend(t)) (if (t == "a") 1 else 2) else visNow)) base else visNow
    }
  }

  // request: the grace period elapsed with nothing engaged
  action hideTimer = all {
    focus' = focus,
    pointer' = pointer,
    shownA' = if (holds) shownA else if (hidable(focus, pointer)) false else shownA,
    shownB' = if (holds) shownB else if (hidable(focus, pointer)) false else shownB,
    pendA' = pendA,
    pendB' = pendB,
    dismA' = dismA,
    dismB' = dismB,
    warm' = if (and(holds, hidable(focus, pointer))) warm
      else if (hidable(focus, pointer)) true else warm,
    warmEnabled' = warmEnabled,
    describedA' = if (holds) describedA
      else if (hidable(focus, pointer)) false else describedA,
    describedB' = if (holds) describedB
      else if (hidable(focus, pointer)) false else describedB,
    requests' = requests + moved(visNow, if (hidable(focus, pointer)) 0 else visNow),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, if (hidable(focus, pointer)) 0 else visNow),
    requested' = if (visNow == (if (hidable(focus, pointer)) 0 else visNow)) requested
      else if (hidable(focus, pointer)) 0 else visNow,
    outcome' = if (visNow == (if (hidable(focus, pointer)) 0 else visNow)) outcome else verdict,
    base' = if (visNow == (if (hidable(focus, pointer)) 0 else visNow)) base else visNow
  }

  // request: WCAG dismissable — hides the tooltip (and cancels armed show
  // timers) without moving focus or pointer; the engaged trigger stays dismissed
  action escape = all {
    focus' = focus,
    pointer' = if (pointer == "tip") "none" else pointer,
    shownA' = if (holds) shownA else false,
    shownB' = if (holds) shownB else false,
    pendA' = false,
    pendB' = false,
    dismA' = if (rejectHide) dismA
      else or(dismA, and(trigEng("a", focus, pointer), or(shownA, pendA))),
    dismB' = if (rejectHide) dismB
      else or(dismB, and(trigEng("b", focus, pointer), or(shownB, pendB))),
    warm' = if (rejectHide) warm else or(warm, or(shownA, shownB)),
    warmEnabled' = warmEnabled,
    describedA' = if (holds) describedA else false,
    describedB' = if (holds) describedB else false,
    requests' = requests + moved(visNow, 0),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, 0),
    requested' = if (visNow == 0) requested else 0,
    outcome' = if (visNow == 0) outcome else verdict,
    base' = if (visNow == 0) base else visNow
  }

  // commit: the host writes the controlled visible tooltip (0 none, 1 a, 2 b)
  action setValue = {
    nondet v = Set(0, 1, 2).oneOf()
    all {
      focus' = focus,
      pointer' = if (and(controlled, and(v == 0, pointer == "tip"))) "none" else pointer,
      shownA' = if (controlled) v == 1 else shownA,
      shownB' = if (controlled) v == 2 else shownB,
      pendA' = if (and(controlled, v == 1)) false else pendA,
      pendB' = if (and(controlled, v == 2)) false else pendB,
      dismA' = if (and(controlled, v == 1)) false else dismA,
      dismB' = if (and(controlled, v == 2)) false else dismB,
      warm' = warm,
      warmEnabled' = warmEnabled,
      describedA' = if (controlled) v == 1 else describedA,
      describedB' = if (controlled) v == 2 else describedB,
      requests' = requests,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) v else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base
    }
  }

  // commit: the host flips its own copy between none and tooltip a
  action hostToggle = all {
    focus' = focus,
    pointer' = if (and(controlled, and(toggleVis == 0, pointer == "tip"))) "none" else pointer,
    shownA' = if (controlled) toggleVis == 1 else shownA,
    shownB' = if (controlled) false else shownB,
    pendA' = if (and(controlled, toggleVis == 1)) false else pendA,
    pendB' = if (controlled) false else pendB,
    dismA' = if (and(controlled, toggleVis == 1)) false else dismA,
    dismB' = if (controlled) false else dismB,
    warm' = warm,
    warmEnabled' = warmEnabled,
    describedA' = if (controlled) toggleVis == 1 else describedA,
    describedB' = if (controlled) false else describedB,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = if (controlled) toggleVis else valueProp,
    requested' = requested,
    outcome' = if (controlled) "none" else outcome,
    base' = base
  }

  // configuration: the host starts owning the visible tooltip, adopting it
  action control = all {
    focus' = focus,
    pointer' = pointer,
    shownA' = shownA,
    shownB' = shownB,
    pendA' = pendA,
    pendB' = pendB,
    dismA' = dismA,
    dismB' = dismB,
    warm' = warm,
    warmEnabled' = warmEnabled,
    describedA' = describedA,
    describedB' = describedB,
    requests' = requests,
    controlled' = true,
    accepting' = accepting,
    valueProp' = visNow,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    focus' = focus,
    pointer' = pointer,
    shownA' = shownA,
    shownB' = shownB,
    pendA' = pendA,
    pendB' = pendB,
    dismA' = dismA,
    dismB' = dismB,
    warm' = warm,
    warmEnabled' = warmEnabled,
    describedA' = describedA,
    describedB' = describedB,
    requests' = requests,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action warmExpire = all {
    focus' = focus,
    pointer' = pointer,
    shownA' = shownA,
    shownB' = shownB,
    pendA' = pendA,
    pendB' = pendB,
    dismA' = dismA,
    dismB' = dismB,
    warm' = false,
    warmEnabled' = warmEnabled,
    describedA' = describedA,
    describedB' = describedB,
    requests' = requests,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base
  }

  action setWarmup = {
    nondet on = Set(true, false).oneOf()
    all {
      focus' = focus,
      pointer' = pointer,
      shownA' = shownA,
      shownB' = shownB,
      pendA' = pendA,
      pendB' = pendB,
      dismA' = dismA,
      dismB' = dismB,
      warm' = warm,
      warmEnabled' = on,
      describedA' = describedA,
      describedB' = describedB,
      requests' = requests,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      outcome' = outcome,
      base' = base
    }
  }

  action step = any {
    init, focusIn, focusOut, pointerEnter, pointerLeave, pointerEnterTip,
    showTimer, hideTimer, escape, warmExpire, setWarmup, setValue, hostToggle,
    control, acceptRequests
  }

  // at most one tooltip is visible at a time
  val AtMostOneVisible: bool = not(and(shownA, shownB))
  // aria-describedby is present on a trigger exactly while its tooltip exists
  val DescribedByIffShown: bool = and(describedA == shownA, describedB == shownB)
  // an Escape-dismissed tooltip stays hidden (and is never queued to show)
  val DismissedStaysHidden: bool =
    and(
      and(not(and(dismA, shownA)), not(and(dismB, shownB))),
      and(not(and(dismA, pendA)), not(and(dismB, pendB)))
    )
  // the dismissal memory is dropped once the trigger is left
  val DismissedImpliesEngaged: bool =
    and(or(not(dismA), trigEng("a", focus, pointer)), or(not(dismB), trigEng("b", focus, pointer)))
  // a show timer only runs for an engaged trigger whose tooltip is hidden
  val PendingImpliesEngagedHidden: bool =
    and(
      or(not(pendA), and(trigEng("a", focus, pointer), not(shownA))),
      or(not(pendB), and(trigEng("b", focus, pointer), not(shownB)))
    )
  // hoverable: the pointer only rests on a tooltip that is visible
  val TipHoverNeedsTooltip: bool = or(pointer != "tip", visibleT != "none")
  // positions are one of the modelled values
  val PositionsKnown: bool =
    and(
      or(focus == "none", or(focus == "a", focus == "b")),
      or(pointer == "none", or(pointer == "a", or(pointer == "b", pointer == "tip")))
    )
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the visible tooltip, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), visNow == valueProp)
  // a rejected request leaves the visible tooltip as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), visNow == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), visNow == requested)
}
