// WAI-ARIA APG — Slider (Multi-Thumb) pattern, two thumbs sharing one rail.
//
// Modelled (https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/ and
// its Horizontal Multi-Thumb Slider example, a hotel price range):
//   - "About This Pattern": the thumbs may not pass one another, so the maximum
//     of the lower thumb is the value of the upper thumb and the minimum of the
//     upper thumb is the value of the lower thumb (equal values are allowed).
//   - "Keyboard Interaction": each thumb is in the tab sequence and has the
//     Slider pattern keys (Right/Up +1, Left/Down -1, PageUp/PageDown +/- large
//     step, Home/End -> the first/last value the thumb may take); the tab
//     order is constant (lo, then hi) whatever the values are.
//     Home/End therefore stop at the neighbour: Home on the upper thumb sets it
//     to the lower thumb's value (its current aria-valuemin), End on the lower
//     thumb sets it to the upper thumb's value.
//   - "WAI-ARIA Roles, States, and Properties": per thumb role=slider,
//     aria-valuenow / valuemin / valuemax (the dependent bound follows the
//     neighbour on every change), aria-valuetext, aria-orientation.
//   - The RTL rule of the Slider spec (APG "Note 2"): horizontal + dir=rtl flips
//     Left/Right; Up/Down never flip; vertical keeps Left/Right as in LTR.
//
// Request vs commit (map ticket rt1p). A key or a rail press is a *request*
// carrying an intent (the pair packed into `requested`); it fires onValueChange
// (`requests` counts the calls) when the intent differs from the current pair,
// and then:
//   uncontrolled        the request is accepted: the thumbs commit the intent
//   controlled, holds   the host ignores it ("rejected"): the thumbs are untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       thumbs commit through the controlled value
// `valueProp` (the pair packed with `snap`) is the only thing that changes the
// thumbs while `controlled`; `setValue` is the host writing it. `control` /
// `acceptRequests` are configuration events (init is literal-only).
//
// The primitive also takes a press on the rail and drags. That is an extension
// whose oracle is the DOM test, like `disabled` below: a press beside the thumbs
// names the one nearest the pointer (a tie goes to the lower, the pair's floor
// and first tab stop), and every press starts a drag that stays with that thumb
// until `pointerup` / `pointercancel` / a lost capture, where the thumb clamps
// at its neighbour exactly as Home / End does. What this spec therefore does
// not say, because `pointerLo` / `pointerHi` name their thumb and carry a value
// rather than a position:
//   **NearestThumbTakesPress** — a press beside the thumbs moves the nearer one,
//   so the thumb the user aimed at is the thumb that answers, and a press that
//   starts on a thumb drags it from the value it already has (no jump); and
//   **DragFollowsPointer** — while the pointer is held, that thumb's
//   aria-valuenow is the value of the pointer's *current* position on the rail
//   (on the step grid and within the neighbour bounds), so it does not
//   accumulate, returning the pointer to where the press was returns the value,
//   and no move after the release changes anything.
// The geometry (which corner of the rail is the minimum, per orientation and
// direction) and the nearest-thumb choice are the DOM's, not the machine's: the
// bridge hands `pointerLo` / `pointerHi` a 0..1 fraction of the value axis.
//
// Deliberate omissions (ponytail: ceilings, not bugs):
//   - The independent-thumbs variant ("in some multi-thumb sliders, each thumb
//     sets a value that does not depend on the other thumb values"): the spec
//     fixes the linked variant, so the "tab order unchanged after passing"
//     case cannot occur here. A Solid implementation of the independent variant
//     should use the plain slider spec once per thumb.
//   - Exactly two thumbs. The bound rules generalise to N thumbs as
//     min = previous thumb, max = next thumb; Quint (and the generator) have
//     no list state, so N is not expressible. The controlled pair is packed
//     into one int for the same reason.
//   - aria-label / aria-labelledby, non-integer values, a coarser step grid,
//     and aria-valuetext formatting (units, locale).
//   - Dragging (pointer capture, move events) and a rail press that picks its
//     thumb: only a discrete press per thumb, snapped to the step grid and
//     clamped, is modelled. The extension's rules and the invariants the model
//     does not carry are above; `slider-multithumb.browser.test.tsx` holds them.
//   - Disabled / read-only: the primitive's widget-level `disabled` is a
//     deliberate extension of the pattern, and the machine has no `disabled`
//     var. So the model carries no invariant for it ("a disabled pair drops
//     every key, rail press and drag, keeps both thumbs as tab stops and
//     announces aria-disabled on both"); its oracle is the DOM test in
//     `packages/headless/test/slider-multithumb.browser.test.tsx`. Read-only is
//     not offered at all.
module apg_slider_multithumb {
  import aria.* from "../../shared/aria"

  var lo: int             // lower thumb value
  var hi: int             // upper thumb value
  var focused: str        // "none" | "lo" | "hi"
  var orientation: str    // "horizontal" | "vertical"
  var dir: str            // "ltr" | "rtl"
  var handled: bool       // the last key was consumed (preventDefault)
  var controlled: bool    // the host owns the pair (`values` prop present)
  var accepting: bool     // controlled host that answers every request with its intent
  var valueProp: int      // the controlled pair, packed with `snap`
  var requested: int      // intent of the last request, packed
  var outcome: str        // "none" | "accepted" | "rejected"
  var base: int           // pair when the last request was received, packed
  var requests: int       // number of requests that fired onValueChange

  // --- configuration -----------------------------------------------------
  def rangeMin: int = 0
  def rangeMax: int = 10
  def smallStep: int = 1
  def largeStep: int = 3

  // --- pure behaviour ----------------------------------------------------
  def clampTo(v: int, a: int, b: int): int =
    if (v < a) a else if (v > b) b else v

  def valueOf(t: str): int = if (t == "lo") lo else hi
  // the dependent bounds: each thumb is limited by its neighbour
  def minOf(t: str): int = if (t == "lo") rangeMin else lo
  def maxOf(t: str): int = if (t == "lo") hi else rangeMax

  // arrows and RTL mirroring: shared/aria.qnt ariaValueArrow
  def keyDelta(k: str, o: str, d: str): int =
    if (k == "PageUp") largeStep
    else if (k == "PageDown") -largeStep
    else smallStep * ariaValueArrow(k, o, d)

  def isHandledKey(k: str): bool =
    or(k == "Home", k == "End", keyDelta(k, "horizontal", "ltr") != 0)

  // the new value of thumb t after key k (t's own bounds, not the full range)
  def nextOf(t: str, k: str, o: str, d: str): int =
    if (k == "Home") minOf(t)
    else if (k == "End") maxOf(t)
    else clampTo(valueOf(t) + keyDelta(k, o, d), minOf(t), maxOf(t))

  def valueTextFor(v: int): str =
    if (v <= 3) "low" else if (v <= 7) "medium" else "high"

  // Tab / Shift+Tab walk the thumbs in a fixed order, independent of values
  def tabNext(f: str): str =
    if (f == "none") "lo" else if (f == "lo") "hi" else "none"
  def tabPrev(f: str): str =
    if (f == "none") "hi" else if (f == "hi") "lo" else "none"

  // --- request / commit (map ticket rt1p) ----------------------------------
  // injective for the 0..10 grid: lo * 11 + hi
  def snap(l: int, h: int): int = l * 11 + h
  def loOf(n: int): int = n / 11
  def hiOf(n: int): int = n % 11
  def nowPacked: int = snap(lo, hi)
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  def landed(h: bool, current: int, want: int): int = if (h) current else want
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p
  // a key moves only the focused thumb; the other stays put
  def nextLoFor(k: str, o: str, d: str): int =
    if (focused == "lo") nextOf("lo", k, o, d) else lo
  def nextHiFor(k: str, o: str, d: str): int =
    if (focused == "hi") nextOf("hi", k, o, d) else hi
  def keyIntent(k: str, o: str, d: str): int =
    snap(nextLoFor(k, o, d), nextHiFor(k, o, d))
  def keyMoves(k: str, o: str, d: str): bool = keyIntent(k, o, d) != nowPacked
  def pointerLoValue(raw: int): int = clampTo(raw, minOf("lo"), maxOf("lo"))
  def pointerHiValue(raw: int): int = clampTo(raw, minOf("hi"), maxOf("hi"))

  // --- ARIA contract, one slider per thumb (derived from the state) --------
  def ariaRole: str = "slider"
  def ariaValueNowLo: int = lo
  def ariaValueMinLo: int = minOf("lo")
  def ariaValueMaxLo: int = maxOf("lo")
  def ariaValueTextLo: str = valueTextFor(lo)
  def ariaValueNowHi: int = hi
  def ariaValueMinHi: int = minOf("hi")
  def ariaValueMaxHi: int = maxOf("hi")
  def ariaValueTextHi: str = valueTextFor(hi)
  def ariaOrientation: str = orientation
  def tabIndexLo: int = 0
  def tabIndexHi: int = 0

  // --- machine -----------------------------------------------------------
  action init = all {
    lo' = 3,
    hi' = 7,
    focused' = "none",
    orientation' = "horizontal",
    dir' = "ltr",
    handled' = false,
    controlled' = false,
    accepting' = false,
    valueProp' = 40,
    requested' = 40,
    outcome' = "none",
    base' = 40,
    requests' = 0
  }

  // click / programmatic focus on a thumb
  action focusThumb = {
    nondet t = Set("lo", "hi").oneOf()
    all {
      lo' = lo,
      hi' = hi,
      focused' = t,
      orientation' = orientation,
      dir' = dir,
      handled' = false,
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
    lo' = lo,
    hi' = hi,
    focused' = "none",
    orientation' = orientation,
    dir' = dir,
    handled' = false,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action tab = all {
    lo' = lo,
    hi' = hi,
    focused' = tabNext(focused),
    orientation' = orientation,
    dir' = dir,
    handled' = false,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action shiftTab = all {
    lo' = lo,
    hi' = hi,
    focused' = tabPrev(focused),
    orientation' = orientation,
    dir' = dir,
    handled' = false,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  // request: a focused key moves its thumb (APG keyboard section)
  action keydown = {
    nondet key = Set(
      "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown",
      "Home", "End", "PageUp", "PageDown", "Enter"
    ).oneOf()
    all {
      lo' = landed(holds, lo, nextLoFor(key, orientation, dir)),
      hi' = landed(holds, hi, nextHiFor(key, orientation, dir)),
      focused' = focused,
      orientation' = orientation,
      dir' = dir,
      handled' = and(focused != "none", isHandledKey(key)),
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, keyIntent(key, orientation, dir)),
      requested' = if (keyMoves(key, orientation, dir)) keyIntent(key, orientation, dir) else requested,
      outcome' = if (keyMoves(key, orientation, dir)) verdict else outcome,
      base' = if (keyMoves(key, orientation, dir)) nowPacked else base,
      requests' = if (keyMoves(key, orientation, dir)) requests + 1 else requests
    }
  }

  // request: pointer press for the lower thumb at a raw value; focuses it
  action pointerLo = {
    nondet raw = Set(-3, 0, 4, 7, 10, 14).oneOf()
    all {
      lo' = landed(holds, lo, pointerLoValue(raw)),
      hi' = hi,
      focused' = "lo",
      orientation' = orientation,
      dir' = dir,
      handled' = false,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, snap(pointerLoValue(raw), hi)),
      requested' = if (snap(pointerLoValue(raw), hi) != nowPacked) snap(pointerLoValue(raw), hi) else requested,
      outcome' = if (snap(pointerLoValue(raw), hi) != nowPacked) verdict else outcome,
      base' = if (snap(pointerLoValue(raw), hi) != nowPacked) nowPacked else base,
      requests' = if (snap(pointerLoValue(raw), hi) != nowPacked) requests + 1 else requests
    }
  }

  // request: pointer press for the upper thumb at a raw value; focuses it
  action pointerHi = {
    nondet raw = Set(-3, 0, 4, 7, 10, 14).oneOf()
    all {
      lo' = lo,
      hi' = landed(holds, hi, pointerHiValue(raw)),
      focused' = "hi",
      orientation' = orientation,
      dir' = dir,
      handled' = false,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, snap(lo, pointerHiValue(raw))),
      requested' = if (snap(lo, pointerHiValue(raw)) != nowPacked) snap(lo, pointerHiValue(raw)) else requested,
      outcome' = if (snap(lo, pointerHiValue(raw)) != nowPacked) verdict else outcome,
      base' = if (snap(lo, pointerHiValue(raw)) != nowPacked) nowPacked else base,
      requests' = if (snap(lo, pointerHiValue(raw)) != nowPacked) requests + 1 else requests
    }
  }

  action setOrientation = {
    nondet o = Set("horizontal", "vertical").oneOf()
    all {
      lo' = lo,
      hi' = hi,
      focused' = focused,
      orientation' = o,
      dir' = dir,
      handled' = false,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      outcome' = outcome,
      base' = base,
      requests' = requests
    }
  }

  action setDir = {
    nondet d = Set("ltr", "rtl").oneOf()
    all {
      lo' = lo,
      hi' = hi,
      focused' = focused,
      orientation' = orientation,
      dir' = d,
      handled' = false,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      outcome' = outcome,
      base' = base,
      requests' = requests
    }
  }

  // commit: the host writes the controlled pair (a no-op while uncontrolled)
  action setValue = {
    nondet v = Set(0, 10, 27, 40, 60, 120).oneOf()
    all {
      lo' = if (controlled) loOf(v) else lo,
      hi' = if (controlled) hiOf(v) else hi,
      focused' = focused,
      orientation' = orientation,
      dir' = dir,
      handled' = false,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) v else valueProp,
      requested' = requested,
      outcome' = if (controlled) "none" else outcome,
      base' = base,
      requests' = requests
    }
  }

  // configuration: the host starts owning the pair, adopting the current one
  action control = all {
    lo' = lo,
    hi' = hi,
    focused' = focused,
    orientation' = orientation,
    dir' = dir,
    handled' = false,
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
    lo' = lo,
    hi' = hi,
    focused' = focused,
    orientation' = orientation,
    dir' = dir,
    handled' = false,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    outcome' = outcome,
    base' = base,
    requests' = requests
  }

  action step = any {
    init, focusThumb, blur, tab, shiftTab, keydown,
    pointerLo, pointerHi, setOrientation, setDir,
    setValue, control, acceptRequests
  }

  // --- invariants --------------------------------------------------------
  // min <= lo <= hi <= max: the thumbs are ordered and inside the range
  val ThumbsOrdered: bool =
    and(rangeMin <= lo, lo <= hi, hi <= rangeMax)
  // aria-valuemax of the lower thumb is the upper thumb's value, and
  // aria-valuemin of the upper thumb is the lower thumb's value
  val BoundsFollowNeighbour: bool =
    and(ariaValueMaxLo == hi, ariaValueMinHi == lo)
  // the outer bounds are the full range
  val OuterBoundsAreRange: bool =
    and(ariaValueMinLo == rangeMin, ariaValueMaxHi == rangeMax)
  // every thumb's aria-valuenow lies inside its own [valuemin, valuemax]
  val NowWithinOwnBounds: bool = and(
    ariaValueMinLo <= ariaValueNowLo,
    ariaValueNowLo <= ariaValueMaxLo,
    ariaValueMinHi <= ariaValueNowHi,
    ariaValueNowHi <= ariaValueMaxHi
  )
  // every reachable value is on the step grid
  val ValuesOnStepGrid: bool = and(
    (lo - rangeMin) % smallStep == 0,
    (hi - rangeMin) % smallStep == 0
  )
  // aria-valuetext is present for each thumb and orders with the values
  val ValueTextDerived: bool = and(
    ariaValueTextLo != "",
    ariaValueTextHi != "",
    or(lo != rangeMin, ariaValueTextLo == "low"),
    or(hi != rangeMax, ariaValueTextHi == "high")
  )
  val OrientationAndDirValid: bool = and(
    ariaOrientationKnown(ariaOrientation),
    or(dir == "ltr", dir == "rtl")
  )
  val FocusValid: bool = or(focused == "none", focused == "lo", focused == "hi")
  // a key is only consumed while a thumb has focus
  val HandledImpliesFocused: bool = or(not(handled), focused != "none")
  // both thumbs are in the tab sequence and the order never depends on values
  val TabOrderConstant: bool = and(
    ariaRole == "slider",
    tabIndexLo == 0,
    tabIndexHi == 0,
    tabNext("none") == "lo",
    tabNext("lo") == "hi"
  )
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the pair, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), nowPacked == valueProp)
  // a rejected request leaves the pair as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), nowPacked == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), nowPacked == requested)
}
