// WAI-ARIA APG — Carousel (Slide Show or Image Rotator) pattern.
//
// Modelled (https://www.w3.org/WAI/ARIA/apg/patterns/carousel/):
//   - "About This Pattern": prev/next controls; optional slide picker; for an
//     auto-rotating carousel a rotation control, stop on keyboard focus, stop
//     while the mouse hovers.
//   - "Keyboard Interaction": rotation stops when any element receives focus
//     and does not resume unless the rotation control is activated; Tab /
//     Shift+Tab walk the page tab sequence with the rotation control FIRST;
//     buttons activate with Enter/Space without moving focus.
//   - "WAI-ARIA Roles, States, and Properties": basic + tabbed variants; the
//     slide wrapper's aria-live is "off" while rotating, "polite" otherwise;
//     the rotation control label flips between Stop/Start and carries no
//     aria-pressed; slides are group (basic) or tabpanel (tabbed); roving
//     tabindex (only the selected tab is in the tab sequence).
//   - Examples (…/examples/carousel-1-prev-next/ and …/carousel-2-tablist/):
//     hover pause resumes on leave; an explicit Start ignores focus/hover until
//     Stop; reduced motion / "pause on load" starts paused; "disable
//     auto-rotation" removes the control; tabs use Left/Right (wrapping), Home,
//     End with automatic activation.
//
// Configuration: props are events (set_slide_count, set_tabbed,
// set_auto_rotate, set_sticky_focus_pause, set_reduced_motion), so a Solid
// component can be driven through every variant. `stickyFocusPause` encodes the
// pattern text (true) vs the basic example (false: rotation resumes on blur).
//
// Position encoding for `focus`: 0 none, 1 rotation control, 2 previous,
// 3 next, 4..6 the tabs, 7 a link inside the slide.
//
// Request vs commit (map ticket rt1p). The shown slide is the value. Every
// event a user sees as a slide change — `tick`, `click_prev`, `click_next`,
// `click_tab`, the tab keys (`key_arrow_*`, `key_home`, `key_end`) and
// `key_activate` on a prev/next control — is a *request* carrying an intent
// (`requested`); it fires onIndexChange (`requests` counts the calls) when the
// intent differs from the current `current`, and then:
//   uncontrolled        the request is accepted: the slide commits the intent
//   controlled, holds   the host ignores it ("rejected"): the slide is untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       slide commits through the controlled value, not the event
// `valueProp` is the only thing that changes the slide while `controlled`;
// `setValue` is the host writing it. `control` / `acceptRequests` are
// configuration events (init is literal-only). DOM focus still moves with the
// request (roving focus / tab walking), independent of the value. Invariants
// for the model: ControlledFollowsProp, RejectedRequestUntouched,
// AcceptedRequestCommits.
//
// ARIA contract (derived defs, evaluated by the invariants below):
//   ariaLive(rotating)      -> aria-live on the slide wrapper
//   rotationLabel(rotating) -> accessible name of the rotation control
//   slideRole(tabbed)       -> role of each slide container
//   slideHidden / tabSelected / tabStop -> per-slide hidden, aria-selected, and
//     tabindex=0 (a non-stop tab has tabindex=-1; negatives avoided in the spec)
//   The rotation control is rendered iff autoRotate.
//
// Deliberate omissions:
//   - Static attributes (role region|group + aria-roledescription="carousel" +
//     label on the container, aria-roledescription="slide" and "N of M" labels,
//     aria-atomic="false", tablist label, aria-controls) are constants, not state.
//   - Discrepancy: the pattern text says tabpanel slides have NO
//     aria-roledescription; the tabbed example sets it to "slide". Static, so
//     left to the implementation (follow the example).
//   - Grouped variant (picker buttons with aria-disabled) is not modelled.
//   - Pointer clicks on controls do not move focus (Safari); focus_control covers
//     click-focus. Timer duration and slide transition animation are not modelled.
//   - Slide content is opaque; focus inside it is the single position 7.
//   - Re-enabling autoRotate leaves rotation paused (user must Start).
//
// Generator notes: the evaluator resolves def-calls but guards take their vars
// as parameters; no action preconditions, so guards live in the assignment RHS.
module apg_carousel {
  var slides: int            // prop: slide count (1..3)
  var current: int           // index of the displayed slide (0-based)
  var tabbed: bool            // prop: tabbed slide picker rendered (tablist/tab/tabpanel)
  var autoRotate: bool        // prop: auto-rotation feature enabled (false = no rotation control rendered)
  var stickyFocusPause: bool  // prop: focus entry stops rotation until the control restarts it (pattern text); false = resume on blur (basic example)
  var rotate: bool            // user intent: rotation wanted (page-load default true; cleared by Stop, reduced motion, sticky focus entry)
  var forced: bool            // user explicitly started rotation: focus/hover are ignored until Stop
  var focus: int             // focus position: 0 none, 1 rotation, 2 prev, 3 next, 4..6 tab 0..2, 7 link inside slide
  var hover: bool             // pointer is over the carousel
  var controlled: bool        // the host owns the shown slide (`value` prop present)
  var accepting: bool         // controlled host that answers every request with its intent
  var valueProp: int          // the controlled value prop (meaningful while controlled)
  var requested: int          // intent of the last request
  var requests: int           // number of requests that fired onIndexChange
  var outcome: str            // "none" | "accepted" | "rejected"
  var base: int               // slide when the last request was received

  def isTab(f: int): bool = and(f >= 4, f <= 6)
  def prevIdx(i: int, n: int): int = if (i <= 0) n - 1 else i - 1
  def nextIdx(i: int, n: int): int = if (i + 1 >= n) 0 else i + 1
  def clampIdx(i: int, n: int): int = if (i >= n) n - 1 else i

  // rotation actually runs: feature on, user wants it, and either the user
  // explicitly started it or neither focus nor hover is inside the carousel
  def rotating(auto: bool, rot: bool, frc: bool, f: int, hov: bool): bool =
    and(and(auto, rot), or(frc, and(f == 0, not(hov))))

  // focus moving from outside to inside stops rotation under the sticky policy
  def stopsOnEnter(sticky: bool, f0: int, f1: int): bool =
    and(sticky, and(f0 == 0, f1 != 0))

  // the rotation control: Stop when rotating, else Start; both flags follow
  def toggled(auto: bool, going: bool, cur: bool): bool = if (auto) not(going) else cur

  // Tab / Shift+Tab; from the last / first stop focus leaves the carousel (0)
  def tabFwd(f: int, auto: bool, tb: bool, cur: int): int =
    if (f == 0) (if (auto) 1 else 2)
    else if (f == 1) 2
    else if (f == 2) 3
    else if (f == 3) (if (tb) 4 + cur else 7)
    else if (f == 7) 0
    else 7
  def tabBack(f: int, auto: bool, tb: bool, cur: int): int =
    if (f == 0) 7
    else if (f == 7) (if (tb) 4 + cur else 3)
    else if (isTab(f)) 3
    else if (f == 3) 2
    else if (f == 2) (if (auto) 1 else 0)
    else 0

  // direct focus: unavailable targets leave focus where it is
  def focusTarget(t: int, f: int, auto: bool, tb: bool, cur: int): int =
    if (t == 1) (if (auto) 1 else f)
    else if (t == 4) (if (tb) 4 + cur else f)
    else t

  // ---- request / commit (map ticket rt1p) ----------------------------------
  def moved(before: int, after: int): int = if (before == after) 0 else 1
  // the slide each request would show
  def tickWant(auto: bool, rot: bool, frc: bool, f: int, hov: bool, cur: int, n: int): int =
    if (rotating(auto, rot, frc, f, hov)) nextIdx(cur, n) else cur
  def activateWant(f: int, cur: int, n: int): int =
    if (f == 2) prevIdx(cur, n) else if (f == 3) nextIdx(cur, n) else cur
  def arrowRightWant(f: int, cur: int, n: int): int =
    if (isTab(f)) nextIdx(f - 4, n) else cur
  def arrowLeftWant(f: int, cur: int, n: int): int =
    if (isTab(f)) prevIdx(f - 4, n) else cur
  def homeWant(f: int, cur: int): int = if (isTab(f)) 0 else cur
  def endWant(f: int, cur: int, n: int): int = if (isTab(f)) n - 1 else cur
  def tabClickWant(tb: bool, i: int, cur: int, n: int): int =
    if (and(tb, i < n)) i else cur
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the slide after a request for `want`
  def landed(h: bool, cur: int, want: int): int = if (h) cur else want
  // the value prop after a request for `want`
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p

  // ARIA contract
  def ariaLive(going: bool): str = if (going) "off" else "polite"
  def rotationLabel(going: bool): str =
    if (going) "Stop automatic slide show" else "Start automatic slide show"
  def slideRole(tb: bool): str = if (tb) "tabpanel" else "group"
  def slideShown(i: int, n: int, cur: int): bool = and(i < n, i == cur)
  def slideHidden(i: int, n: int, cur: int): bool = not(slideShown(i, n, cur))
  def tabSelected(i: int, n: int, cur: int): bool = slideShown(i, n, cur)
  def tabStop(i: int, n: int, cur: int): bool = tabSelected(i, n, cur)
  def b2i(b: bool): int = if (b) 1 else 0
  def shownCount(n: int, cur: int): int =
    b2i(slideShown(0, n, cur)) + b2i(slideShown(1, n, cur)) + b2i(slideShown(2, n, cur))
  def stopCount(n: int, cur: int): int =
    b2i(tabStop(0, n, cur)) + b2i(tabStop(1, n, cur)) + b2i(tabStop(2, n, cur))

  // page load: rotating, nothing focused or hovered, basic (untabbed) carousel
  action init = all {
    slides' = 3,
    current' = 0,
    tabbed' = false,
    autoRotate' = true,
    stickyFocusPause' = true,
    rotate' = true,
    forced' = false,
    focus' = 0,
    hover' = false,
    controlled' = false,
    accepting' = false,
    valueProp' = 0,
    requested' = 0,
    requests' = 0,
    outcome' = "none",
    base' = 0
  }

  // request: the rotation timer advances the slide only while rotating
  action tick = all {
    slides' = slides,
    current' = landed(holds, current, tickWant(autoRotate, rotate, forced, focus, hover, current, slides)),
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = focus,
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, tickWant(autoRotate, rotate, forced, focus, hover, current, slides)),
    requested' = if (moved(current, tickWant(autoRotate, rotate, forced, focus, hover, current, slides)) == 1) tickWant(autoRotate, rotate, forced, focus, hover, current, slides) else requested,
    requests' = requests + moved(current, tickWant(autoRotate, rotate, forced, focus, hover, current, slides)),
    outcome' = if (moved(current, tickWant(autoRotate, rotate, forced, focus, hover, current, slides)) == 1) verdict else outcome,
    base' = if (moved(current, tickWant(autoRotate, rotate, forced, focus, hover, current, slides)) == 1) current else base
  }

  // mouse enters the carousel: rotation pauses (derived)
  action pointer_enter = all {
    slides' = slides,
    current' = current,
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = focus,
    hover' = true,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // mouse leaves the carousel
  action pointer_leave = all {
    slides' = slides,
    current' = current,
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = focus,
    hover' = false,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // Tab: next stop in the tab sequence (rotation, prev, next, selected tab, slide link)
  action key_tab = all {
    slides' = slides,
    current' = current,
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = if (stopsOnEnter(stickyFocusPause, focus, tabFwd(focus, autoRotate, tabbed, current))) false else rotate,
    forced' = if (stopsOnEnter(stickyFocusPause, focus, tabFwd(focus, autoRotate, tabbed, current))) false else forced,
    focus' = tabFwd(focus, autoRotate, tabbed, current),
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // Shift+Tab: previous stop in the tab sequence
  action key_shift_tab = all {
    slides' = slides,
    current' = current,
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = if (stopsOnEnter(stickyFocusPause, focus, tabBack(focus, autoRotate, tabbed, current))) false else rotate,
    forced' = if (stopsOnEnter(stickyFocusPause, focus, tabBack(focus, autoRotate, tabbed, current))) false else forced,
    focus' = tabBack(focus, autoRotate, tabbed, current),
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // focus lands directly on a control (click focus, AT virtual cursor, script); t: 1 rotation, 2 prev, 3 next, 4 selected tab, 7 slide link
  action focus_control = {
    nondet t = Set(1, 2, 3, 4, 7).oneOf()
    all {
      slides' = slides,
      current' = current,
      tabbed' = tabbed,
      autoRotate' = autoRotate,
      stickyFocusPause' = stickyFocusPause,
      rotate' = if (stopsOnEnter(stickyFocusPause, focus, focusTarget(t, focus, autoRotate, tabbed, current))) false else rotate,
      forced' = if (stopsOnEnter(stickyFocusPause, focus, focusTarget(t, focus, autoRotate, tabbed, current))) false else forced,
      focus' = focusTarget(t, focus, autoRotate, tabbed, current),
      hover' = hover,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = outcome,
      base' = base
    }
  }

  // focus leaves the carousel
  action blur_out = all {
    slides' = slides,
    current' = current,
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = 0,
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // request: Enter/Space on the focused element toggles rotation, or goes
  // prev/next (focus does not move); on a tab it is a no-op (already selected)
  action key_activate = all {
    slides' = slides,
    current' = landed(holds, current, activateWant(focus, current, slides)),
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = if (focus == 1) toggled(autoRotate, rotating(autoRotate, rotate, forced, focus, hover), rotate) else rotate,
    forced' = if (focus == 1) toggled(autoRotate, rotating(autoRotate, rotate, forced, focus, hover), forced) else forced,
    focus' = focus,
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, activateWant(focus, current, slides)),
    requested' = if (moved(current, activateWant(focus, current, slides)) == 1) activateWant(focus, current, slides) else requested,
    requests' = requests + moved(current, activateWant(focus, current, slides)),
    outcome' = if (moved(current, activateWant(focus, current, slides)) == 1) verdict else outcome,
    base' = if (moved(current, activateWant(focus, current, slides)) == 1) current else base
  }

  // request: Right Arrow on a tab focuses + shows the next tab (wraps)
  action key_arrow_right = all {
    slides' = slides,
    current' = landed(holds, current, arrowRightWant(focus, current, slides)),
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = if (isTab(focus)) 4 + nextIdx(focus - 4, slides) else focus,
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, arrowRightWant(focus, current, slides)),
    requested' = if (moved(current, arrowRightWant(focus, current, slides)) == 1) arrowRightWant(focus, current, slides) else requested,
    requests' = requests + moved(current, arrowRightWant(focus, current, slides)),
    outcome' = if (moved(current, arrowRightWant(focus, current, slides)) == 1) verdict else outcome,
    base' = if (moved(current, arrowRightWant(focus, current, slides)) == 1) current else base
  }

  // request: Left Arrow on a tab focuses + shows the previous tab (wraps)
  action key_arrow_left = all {
    slides' = slides,
    current' = landed(holds, current, arrowLeftWant(focus, current, slides)),
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = if (isTab(focus)) 4 + prevIdx(focus - 4, slides) else focus,
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, arrowLeftWant(focus, current, slides)),
    requested' = if (moved(current, arrowLeftWant(focus, current, slides)) == 1) arrowLeftWant(focus, current, slides) else requested,
    requests' = requests + moved(current, arrowLeftWant(focus, current, slides)),
    outcome' = if (moved(current, arrowLeftWant(focus, current, slides)) == 1) verdict else outcome,
    base' = if (moved(current, arrowLeftWant(focus, current, slides)) == 1) current else base
  }

  // request: Home on a tab shows the first slide
  action key_home = all {
    slides' = slides,
    current' = landed(holds, current, homeWant(focus, current)),
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = if (isTab(focus)) 4 + 0 else focus,
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, homeWant(focus, current)),
    requested' = if (moved(current, homeWant(focus, current)) == 1) homeWant(focus, current) else requested,
    requests' = requests + moved(current, homeWant(focus, current)),
    outcome' = if (moved(current, homeWant(focus, current)) == 1) verdict else outcome,
    base' = if (moved(current, homeWant(focus, current)) == 1) current else base
  }

  // request: End on a tab shows the last slide
  action key_end = all {
    slides' = slides,
    current' = landed(holds, current, endWant(focus, current, slides)),
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = if (isTab(focus)) 4 + slides - 1 else focus,
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, endWant(focus, current, slides)),
    requested' = if (moved(current, endWant(focus, current, slides)) == 1) endWant(focus, current, slides) else requested,
    requests' = requests + moved(current, endWant(focus, current, slides)),
    outcome' = if (moved(current, endWant(focus, current, slides)) == 1) verdict else outcome,
    base' = if (moved(current, endWant(focus, current, slides)) == 1) current else base
  }

  // pointer click on the rotation control (focus unchanged): Stop when rotating, else explicit Start (focus/hover ignored)
  action click_rotation = all {
    slides' = slides,
    current' = current,
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = toggled(autoRotate, rotating(autoRotate, rotate, forced, focus, hover), rotate),
    forced' = toggled(autoRotate, rotating(autoRotate, rotate, forced, focus, hover), forced),
    focus' = focus,
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // request: pointer click on Previous slide
  action click_prev = all {
    slides' = slides,
    current' = landed(holds, current, prevIdx(current, slides)),
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = focus,
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, prevIdx(current, slides)),
    requested' = if (moved(current, prevIdx(current, slides)) == 1) prevIdx(current, slides) else requested,
    requests' = requests + moved(current, prevIdx(current, slides)),
    outcome' = if (moved(current, prevIdx(current, slides)) == 1) verdict else outcome,
    base' = if (moved(current, prevIdx(current, slides)) == 1) current else base
  }

  // request: pointer click on Next slide
  action click_next = all {
    slides' = slides,
    current' = landed(holds, current, nextIdx(current, slides)),
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = focus,
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, nextIdx(current, slides)),
    requested' = if (moved(current, nextIdx(current, slides)) == 1) nextIdx(current, slides) else requested,
    requests' = requests + moved(current, nextIdx(current, slides)),
    outcome' = if (moved(current, nextIdx(current, slides)) == 1) verdict else outcome,
    base' = if (moved(current, nextIdx(current, slides)) == 1) current else base
  }

  // request: pointer click on tab i (tabbed only) shows that slide
  action click_tab = {
    nondet i = Set(0, 1, 2).oneOf()
    all {
      slides' = slides,
      current' = landed(holds, current, tabClickWant(tabbed, i, current, slides)),
      tabbed' = tabbed,
      autoRotate' = autoRotate,
      stickyFocusPause' = stickyFocusPause,
      rotate' = rotate,
      forced' = forced,
      focus' = focus,
      hover' = hover,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, tabClickWant(tabbed, i, current, slides)),
      requested' = if (moved(current, tabClickWant(tabbed, i, current, slides)) == 1) tabClickWant(tabbed, i, current, slides) else requested,
      requests' = requests + moved(current, tabClickWant(tabbed, i, current, slides)),
      outcome' = if (moved(current, tabClickWant(tabbed, i, current, slides)) == 1) verdict else outcome,
      base' = if (moved(current, tabClickWant(tabbed, i, current, slides)) == 1) current else base
    }
  }

  // prop change: number of slides; current slide and tab focus clamp into range.
  // While controlled the value prop clamps with it, and a pending request settles.
  action set_slide_count = {
    nondet m = Set(1, 2, 3).oneOf()
    all {
      slides' = m,
      current' = clampIdx(current, m),
      tabbed' = tabbed,
      autoRotate' = autoRotate,
      stickyFocusPause' = stickyFocusPause,
      rotate' = rotate,
      forced' = forced,
      focus' = if (and(isTab(focus), focus - 4 >= m)) 4 + m - 1 else focus,
      hover' = hover,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) clampIdx(valueProp, m) else valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = "none",
      base' = base
    }
  }

  // prop change: tabbed variant; the tablist unmounting drops tab focus
  action set_tabbed = {
    nondet on = Set(true, false).oneOf()
    all {
      slides' = slides,
      current' = current,
      tabbed' = on,
      autoRotate' = autoRotate,
      stickyFocusPause' = stickyFocusPause,
      rotate' = rotate,
      forced' = forced,
      focus' = if (and(not(on), isTab(focus))) 0 else focus,
      hover' = hover,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = outcome,
      base' = base
    }
  }

  // prop change: auto-rotation feature; disabling stops rotation and unmounts the rotation control
  action set_auto_rotate = {
    nondet on = Set(true, false).oneOf()
    all {
      slides' = slides,
      current' = current,
      tabbed' = tabbed,
      autoRotate' = on,
      stickyFocusPause' = stickyFocusPause,
      rotate' = if (on) rotate else false,
      forced' = if (on) forced else false,
      focus' = if (and(not(on), focus == 1)) 0 else focus,
      hover' = hover,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = outcome,
      base' = base
    }
  }

  // prop change: focus-pause policy; turning sticky on while focus is inside stops rotation unless user-started
  action set_sticky_focus_pause = {
    nondet on = Set(true, false).oneOf()
    all {
      slides' = slides,
      current' = current,
      tabbed' = tabbed,
      autoRotate' = autoRotate,
      stickyFocusPause' = on,
      rotate' = if (and(on, and(focus != 0, not(forced)))) false else rotate,
      forced' = forced,
      focus' = focus,
      hover' = hover,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = outcome,
      base' = base
    }
  }

  // prefers-reduced-motion (or "pause on load"): rotation paused until the user starts it
  action set_reduced_motion = all {
    slides' = slides,
    current' = current,
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = false,
    forced' = false,
    focus' = focus,
    hover' = hover,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // commit: the host writes the controlled slide (a no-op while uncontrolled)
  action setValue = {
    nondet v = Set(0, 1, 2).oneOf()
    all {
      slides' = slides,
      current' = if (controlled) clampIdx(v, slides) else current,
      tabbed' = tabbed,
      autoRotate' = autoRotate,
      stickyFocusPause' = stickyFocusPause,
      rotate' = rotate,
      forced' = forced,
      focus' = focus,
      hover' = hover,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) clampIdx(v, slides) else valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = if (controlled) "none" else outcome,
      base' = base
    }
  }

  // configuration: the host starts owning the slide, adopting the current one
  action control = all {
    slides' = slides,
    current' = current,
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = focus,
    hover' = hover,
    controlled' = true,
    accepting' = accepting,
    valueProp' = current,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    slides' = slides,
    current' = current,
    tabbed' = tabbed,
    autoRotate' = autoRotate,
    stickyFocusPause' = stickyFocusPause,
    rotate' = rotate,
    forced' = forced,
    focus' = focus,
    hover' = hover,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action step = any { init, tick, pointer_enter, pointer_leave, key_tab, key_shift_tab, focus_control, blur_out, key_activate, key_arrow_right, key_arrow_left, key_home, key_end, click_rotation, click_prev, click_next, click_tab, set_slide_count, set_tabbed, set_auto_rotate, set_sticky_focus_pause, set_reduced_motion, setValue, control, acceptRequests }

  // APG: never rotating while focus or hover is inside, unless the user
  // explicitly started rotation
  val NeverRotatingWhileEngaged: bool =
    or(not(rotating(autoRotate, rotate, forced, focus, hover)), or(forced, and(focus == 0, not(hover))))
  // an explicit Start implies rotation is wanted
  val ForcedImpliesRotate: bool = or(not(forced), rotate)
  // with the feature off nothing is wanted and nothing is forced
  val DisabledIsIdle: bool = or(autoRotate, and(not(rotate), not(forced)))
  // pattern text: focus inside stops rotation and it stays stopped (unless the user restarted it)
  val StickyFocusStaysStopped: bool =
    or(not(stickyFocusPause), or(focus == 0, or(forced, not(rotate))))
  // aria-live is off exactly while rotating
  val LiveOffIffRotating: bool = (ariaLive(rotating(autoRotate, rotate, forced, focus, hover)) == "off") == rotating(autoRotate, rotate, forced, focus, hover)
  // the rotation label announces the action the button will perform
  val RotationLabelMatchesAction: bool =
    (rotationLabel(rotating(autoRotate, rotate, forced, focus, hover)) == "Stop automatic slide show") == rotating(autoRotate, rotate, forced, focus, hover)
  // the rotation control is the first stop in the tab sequence
  val RotationControlFirst: bool =
    or(not(autoRotate), tabFwd(0, autoRotate, tabbed, current) == 1)
  // slide/tab bookkeeping
  val CurrentInRange: bool = and(current >= 0, current < slides)
  val SlideCountValid: bool = and(slides >= 1, slides <= 3)
  val ExactlyOneSlideShown: bool = shownCount(slides, current) == 1
  val TabbedHasOneTabStop: bool = or(not(tabbed), stopCount(slides, current) == 1)
  val SlideRoleMatchesVariant: bool = (slideRole(tabbed) == "tabpanel") == tabbed
  // focus only ever sits on something that is rendered
  val FocusValid: bool = and(
    focus >= 0,
    focus <= 7,
    or(focus != 1, autoRotate),
    or(not(isTab(focus)), and(tabbed, focus - 4 < slides))
  )
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the slide, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), current == valueProp)
  // a rejected request leaves the slide as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), current == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), current == requested)
}
