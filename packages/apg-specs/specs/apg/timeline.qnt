// Span timeline / waterfall — NOT an APG pattern.
//
// The o11y dashboard lays spans out on a shared time axis: nesting/indentation,
// a duration ruler, selection, per-parent collapse and a zoom window over the
// visible tick domain. WAI-ARIA APG has no waterfall pattern, so this is a new
// behaviour-machine modelled on the treeview spec's encoding:
//
//   * the span tree is a fixed constant, ids are pre-order = document order;
//   * `expanded` is a bitmask over node ids, `selected` is a node id (0 = none),
//     `focus` is the roving-tabindex node and `hasFocus` says whether DOM focus
//     is inside the timeline. Key events are no-ops while `hasFocus` is false.
//   * the zoom window is `viewStart`/`viewEnd`, a sub-interval of the fixed
//     tick domain 0..100. zoomIn shrinks it around its centre (no-op at the
//     minimum width), zoomOut grows it around its centre clamped to the domain
//     (no-op at full width), pan shifts it by a quarter of its width clamped
//     in-domain, zoomReset restores the full domain.
//
// Request vs commit (map ticket rt1p). Selection is the value. Every event a
// user sees as a selection — `click`, `pressEnter` and the programmatic
// `select` — is a *request* carrying an intent (`requested`); it fires
// onValueChange (`requests` counts the calls) when the intent differs from the
// current `selected`, and then:
//   uncontrolled        the request is accepted: selection commits the intent
//   controlled, holds   the host ignores it ("rejected"): selection is untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       selection commits through the controlled value, not the event
// `valueProp` is the only thing that changes selection while `controlled`;
// `setValue` is the host writing it. `control` / `acceptRequests` are
// configuration events (init is literal-only). Focus/expansion and the zoom
// window are not the controlled value: they keep moving on a rejected request,
// like treeview's roving focus. Invariants: ControlledFollowsProp,
// RejectedRequestUntouched, AcceptedRequestCommits.
//
// Span tree (fixed; start/end are fractions of the parent span):
//
//   1 root                 level 1, parent 0..1
//     2 child              level 2, parent 0..0.6
//       3 leaf             level 3, parent 0..0.3
//       4 leaf             level 3, parent 0.3..0.6
//     5 leaf               level 2, parent 0.6..1
//
// Encoding (the generator only supports str/int/bool vars): `expanded` is a
// bitmask over nodes 1..5 (bit n-1, weight 2^(n-1)); `selected` is the selected
// node id (0 = none); `focus` is the roving node (always 1..5, even while the
// timeline is not focused). This mirrors treeview.qnt but uses a selected id
// instead of a selection bitmask — a waterfall selects a single span.
//
// Deliberate omissions (ponytail): fractional/overlapping spans and lane
// packing (layout is the consumer's), drag/range selection, virtualisation,
// type-ahead, multi-select, and aria-activedescendant (the rows use roving
// tabindex). The visibility/navigation defs are shared with treeview's shape.
module apg_timeline {
  var expanded: int     // bitmask: parent nodes whose children are shown
  var selected: int     // selected node id, 0 = none
  var focus: int        // roving-tabindex node, 1..5
  var hasFocus: bool    // DOM focus is inside the timeline
  var viewStart: int    // zoom window start tick, 0..100
  var viewEnd: int      // zoom window end tick, 0..100
  var controlled: bool  // the host owns the selection (`value` prop present)
  var accepting: bool   // controlled host that answers every request with its intent
  var valueProp: int    // the controlled value prop (meaningful while controlled)
  var requested: int    // intent of the last request
  var requests: int     // number of requests that fired onValueChange
  var outcome: str      // "none" | "accepted" | "rejected"
  var base: int         // selection when the last request was received

  // ---- the constant span tree ---------------------------------------------

  val lastNode: int = 5
  val allMask: int = 31
  val domainMin: int = 0
  val domainMax: int = 100
  val minWidth: int = 10

  def parentOf(n: int): int =
    if (n == 2) 1
    else if (n == 3) 2
    else if (n == 4) 2
    else if (n == 5) 1
    else 0

  def firstChild(n: int): int =
    if (n == 1) 2
    else if (n == 2) 3
    else 0

  def isParent(n: int): bool = firstChild(n) != 0

  // ---- bitmask helpers ----------------------------------------------------

  def weight(n: int): int =
    if (n == 1) 1
    else if (n == 2) 2
    else if (n == 3) 4
    else if (n == 4) 8
    else if (n == 5) 16
    else 0

  def bit(mask: int, n: int): bool =
    if (and(n >= 1, n <= lastNode)) ((mask / weight(n)) % 2) == 1 else false

  def setBit(mask: int, n: int, on: bool): int =
    if (bit(mask, n) == on) mask
    else if (on) mask + weight(n)
    else mask - weight(n)

  def toggleBit(mask: int, n: int): int = setBit(mask, n, not(bit(mask, n)))

  // ---- visibility and navigation ------------------------------------------

  // the node's parent is shown-open (roots, and the pseudo-parent 0, always are)
  def parentOpen(n: int, e: int): bool = or(parentOf(n) == 0, bit(e, parentOf(n)))

  // focusable: every ancestor is expanded (depth <= 3 => two ancestor checks)
  def visible(n: int, e: int): bool =
    and(n >= 1, n <= lastNode, parentOpen(n, e), parentOpen(parentOf(n), e))

  def visibleAfter(n: int, k: int, e: int): bool =
    and(n + k <= lastNode, visible(n + k, e))
  def visibleBefore(n: int, k: int, e: int): bool =
    and(n - k >= 1, visible(n - k, e))

  // Down: the next visible node in document order; the last node stays put
  def nextVisible(n: int, e: int): int =
    if (visibleAfter(n, 1, e)) n + 1
    else if (visibleAfter(n, 2, e)) n + 2
    else if (visibleAfter(n, 3, e)) n + 3
    else if (visibleAfter(n, 4, e)) n + 4
    else n

  // Up: the previous visible node; the first node stays put
  def prevVisible(n: int, e: int): int =
    if (visibleBefore(n, 1, e)) n - 1
    else if (visibleBefore(n, 2, e)) n - 2
    else if (visibleBefore(n, 3, e)) n - 3
    else if (visibleBefore(n, 4, e)) n - 4
    else n

  // End: the last node focusable without opening anything (node 1 is a root)
  def lastVisible(e: int): int =
    if (visible(5, e)) 5
    else if (visible(4, e)) 4
    else if (visible(3, e)) 3
    else if (visible(2, e)) 2
    else 1

  // Right on a closed parent opens it (focus stays); on an open parent focus
  // moves to its first child; on a leaf nothing happens
  def rightExpands(f: int, e: int): bool = and(isParent(f), not(bit(e, f)))
  def rightTarget(f: int, e: int): int =
    if (and(isParent(f), bit(e, f))) firstChild(f) else f

  // Left on an open parent closes it (focus stays); otherwise focus moves to
  // the parent; on a root nothing happens
  def leftCollapses(f: int, e: int): bool = and(isParent(f), bit(e, f))
  def leftTarget(f: int, e: int): int =
    if (leftCollapses(f, e)) f
    else if (parentOf(f) == 0) f
    else parentOf(f)

  // ---- zoom window --------------------------------------------------------

  def w(s: int, e: int): int = e - s

  // shrink by a quarter, never below the minimum width
  def shrink(x: int): int =
    if (x <= minWidth) x
    else if (x - (x / 4) < minWidth) minWidth
    else x - (x / 4)

  // grow by a quarter, never past the domain
  def grow(x: int): int =
    if (x >= domainMax) x
    else if (x + (x / 4) > domainMax) domainMax
    else x + (x / 4)

  // clamp the window start so [start, start+width] stays inside the domain
  def clampStart(s: int, wi: int): int =
    if (s < domainMin) domainMin
    else if (s + wi > domainMax) domainMax - wi
    else s

  def zoomInStart(s: int, e: int): int =
    clampStart(s + ((w(s, e) - shrink(w(s, e))) / 2), shrink(w(s, e)))
  def zoomInEnd(s: int, e: int): int = zoomInStart(s, e) + shrink(w(s, e))

  def zoomOutStart(s: int, e: int): int =
    clampStart(s - ((grow(w(s, e)) - w(s, e)) / 2), grow(w(s, e)))
  def zoomOutEnd(s: int, e: int): int = zoomOutStart(s, e) + grow(w(s, e))

  def panRightStart(s: int, e: int): int =
    clampStart(s + (w(s, e) / 4), w(s, e))
  def panRightEnd(s: int, e: int): int = panRightStart(s, e) + w(s, e)

  def panLeftStart(s: int, e: int): int =
    clampStart(s - (w(s, e) / 4), w(s, e))
  def panLeftEnd(s: int, e: int): int = panLeftStart(s, e) + w(s, e)

  // ---- request / commit (map ticket rt1p) ---------------------------------

  // a change of intent fires onValueChange; an inert event (same intent) does not
  def moved(before: int, after: int): int = if (before == after) 0 else 1
  // the node a pointer click would select (an invisible target is inert)
  def clickWant(node: int, e: int, sel: int): int =
    if (visible(node, e)) node else sel
  // the node Enter would select (a key outside the timeline is inert)
  def enterWant(hf: bool, f: int, sel: int): int = if (hf) f else sel
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the selection after a request for `want`
  def landed(h: bool, current: int, want: int): int = if (h) current else want
  // the value prop after a request for `want`
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p

  // ---- actions ------------------------------------------------------------

  action init = all {
    expanded' = 0,
    selected' = 0,
    focus' = 1,
    hasFocus' = false,
    viewStart' = domainMin,
    viewEnd' = domainMax,
    controlled' = false,
    accepting' = false,
    valueProp' = 0,
    requested' = 0,
    requests' = 0,
    outcome' = "none",
    base' = 0
  }

  // Tab into the timeline: the roving node receives focus
  action focusTimeline = all {
    expanded' = expanded,
    selected' = selected,
    focus' = focus,
    hasFocus' = true,
    viewStart' = viewStart,
    viewEnd' = viewEnd,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action blurTimeline = all {
    expanded' = expanded,
    selected' = selected,
    focus' = focus,
    hasFocus' = false,
    viewStart' = viewStart,
    viewEnd' = viewEnd,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // pointer/programmatic focus of one row: hidden rows are unreachable
  action focusNode = {
    nondet node = Set(1, 2, 3, 4, 5).oneOf()
    all {
      expanded' = expanded,
      selected' = selected,
      focus' = if (visible(node, expanded)) node else focus,
      hasFocus' = if (visible(node, expanded)) true else hasFocus,
      viewStart' = viewStart,
      viewEnd' = viewEnd,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = outcome,
      base' = base
    }
  }

  action pressDown = all {
    expanded' = expanded,
    selected' = selected,
    focus' = if (hasFocus) nextVisible(focus, expanded) else focus,
    hasFocus' = hasFocus,
    viewStart' = viewStart,
    viewEnd' = viewEnd,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action pressUp = all {
    expanded' = expanded,
    selected' = selected,
    focus' = if (hasFocus) prevVisible(focus, expanded) else focus,
    hasFocus' = hasFocus,
    viewStart' = viewStart,
    viewEnd' = viewEnd,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action pressRight = all {
    expanded' = if (and(hasFocus, rightExpands(focus, expanded))) setBit(expanded, focus, true) else expanded,
    selected' = selected,
    focus' = if (hasFocus) rightTarget(focus, expanded) else focus,
    hasFocus' = hasFocus,
    viewStart' = viewStart,
    viewEnd' = viewEnd,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action pressLeft = all {
    expanded' = if (and(hasFocus, leftCollapses(focus, expanded))) setBit(expanded, focus, false) else expanded,
    selected' = selected,
    focus' = if (hasFocus) leftTarget(focus, expanded) else focus,
    hasFocus' = hasFocus,
    viewStart' = viewStart,
    viewEnd' = viewEnd,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action pressHome = all {
    expanded' = expanded,
    selected' = selected,
    focus' = if (hasFocus) 1 else focus,
    hasFocus' = hasFocus,
    viewStart' = viewStart,
    viewEnd' = viewEnd,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action pressEnd = all {
    expanded' = expanded,
    selected' = selected,
    focus' = if (hasFocus) lastVisible(expanded) else focus,
    hasFocus' = hasFocus,
    viewStart' = viewStart,
    viewEnd' = viewEnd,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // request: Enter selects the focused span (a key outside the timeline is inert)
  action pressEnter = all {
    expanded' = expanded,
    selected' = landed(holds, selected, enterWant(hasFocus, focus, selected)),
    focus' = focus,
    hasFocus' = hasFocus,
    viewStart' = viewStart,
    viewEnd' = viewEnd,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = propAfter(follows, valueProp, enterWant(hasFocus, focus, selected)),
    requested' = if (moved(selected, enterWant(hasFocus, focus, selected)) == 1) enterWant(hasFocus, focus, selected) else requested,
    requests' = requests + moved(selected, enterWant(hasFocus, focus, selected)),
    outcome' = if (moved(selected, enterWant(hasFocus, focus, selected)) == 1) verdict else outcome,
    base' = if (moved(selected, enterWant(hasFocus, focus, selected)) == 1) selected else base
  }

  action zoomIn = all {
    expanded' = expanded,
    selected' = selected,
    focus' = focus,
    hasFocus' = hasFocus,
    viewStart' = zoomInStart(viewStart, viewEnd),
    viewEnd' = zoomInEnd(viewStart, viewEnd),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action zoomOut = all {
    expanded' = expanded,
    selected' = selected,
    focus' = focus,
    hasFocus' = hasFocus,
    viewStart' = zoomOutStart(viewStart, viewEnd),
    viewEnd' = zoomOutEnd(viewStart, viewEnd),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action zoomReset = all {
    expanded' = expanded,
    selected' = selected,
    focus' = focus,
    hasFocus' = hasFocus,
    viewStart' = domainMin,
    viewEnd' = domainMax,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action panLeft = all {
    expanded' = expanded,
    selected' = selected,
    focus' = focus,
    hasFocus' = hasFocus,
    viewStart' = panLeftStart(viewStart, viewEnd),
    viewEnd' = panLeftEnd(viewStart, viewEnd),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action panRight = all {
    expanded' = expanded,
    selected' = selected,
    focus' = focus,
    hasFocus' = hasFocus,
    viewStart' = panRightStart(viewStart, viewEnd),
    viewEnd' = panRightEnd(viewStart, viewEnd),
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // request: pointer click on a row. Only a visible row can be hit. It takes
  // focus, requests becoming the sole selection, and a parent opens/closes.
  action click = {
    nondet node = Set(1, 2, 3, 4, 5).oneOf()
    all {
      expanded' = if (and(visible(node, expanded), isParent(node))) toggleBit(expanded, node) else expanded,
      selected' = landed(holds, selected, clickWant(node, expanded, selected)),
      focus' = if (visible(node, expanded)) node else focus,
      hasFocus' = if (visible(node, expanded)) true else hasFocus,
      viewStart' = viewStart,
      viewEnd' = viewEnd,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, clickWant(node, expanded, selected)),
      requested' = if (moved(selected, clickWant(node, expanded, selected)) == 1) clickWant(node, expanded, selected) else requested,
      requests' = requests + moved(selected, clickWant(node, expanded, selected)),
      outcome' = if (moved(selected, clickWant(node, expanded, selected)) == 1) verdict else outcome,
      base' = if (moved(selected, clickWant(node, expanded, selected)) == 1) selected else base
    }
  }

  // request: the programmatic selection API (any node, no focus change)
  // (named selectNode: `select` is a Quint built-in, QNT101)
  action selectNode = {
    nondet node = Set(1, 2, 3, 4, 5).oneOf()
    all {
      expanded' = expanded,
      selected' = landed(holds, selected, node),
      focus' = focus,
      hasFocus' = hasFocus,
      viewStart' = viewStart,
      viewEnd' = viewEnd,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = propAfter(follows, valueProp, node),
      requested' = if (moved(selected, node) == 1) node else requested,
      requests' = requests + moved(selected, node),
      outcome' = if (moved(selected, node) == 1) verdict else outcome,
      base' = if (moved(selected, node) == 1) selected else base
    }
  }

  // commit: the host writes the controlled selection (a no-op while uncontrolled)
  action setValue = {
    nondet v = Set(0, 1, 2, 3, 4, 5).oneOf()
    all {
      expanded' = expanded,
      selected' = if (controlled) v else selected,
      focus' = focus,
      hasFocus' = hasFocus,
      viewStart' = viewStart,
      viewEnd' = viewEnd,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) v else valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = if (controlled) "none" else outcome,
      base' = base
    }
  }

  // configuration: the host starts owning the selection, adopting the current one
  action control = all {
    expanded' = expanded,
    selected' = selected,
    focus' = focus,
    hasFocus' = hasFocus,
    viewStart' = viewStart,
    viewEnd' = viewEnd,
    controlled' = true,
    accepting' = accepting,
    valueProp' = selected,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    expanded' = expanded,
    selected' = selected,
    focus' = focus,
    hasFocus' = hasFocus,
    viewStart' = viewStart,
    viewEnd' = viewEnd,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action step = any {
    init, focusTimeline, blurTimeline, focusNode,
    pressDown, pressUp, pressRight, pressLeft, pressHome, pressEnd, pressEnter,
    zoomIn, zoomOut, zoomReset, panLeft, panRight, click, selectNode,
    setValue, control, acceptRequests
  }

  // ---- invariants ---------------------------------------------------------

  // the roving node exists
  val FocusKnown: bool = and(focus >= 1, focus <= lastNode)
  // APG: focus only ever rests on a focusable node — every ancestor is open
  val FocusVisible: bool = visible(focus, expanded)
  // selection is either none or a real node
  val SelectedKnown: bool = or(selected == 0, and(selected >= 1, selected <= lastNode))
  // the zoom window is a non-empty interval
  val ZoomOrdered: bool = viewStart < viewEnd
  // the zoom window stays inside the tick domain
  val ZoomBounded: bool = and(viewStart >= domainMin, viewEnd <= domainMax)

  def leafNeverOpen(n: int, e: int): bool = or(isParent(n), not(bit(e, n)))
  // leaves are never recorded as expanded
  val LeafNeverExpanded: bool = and(
    leafNeverOpen(1, expanded), leafNeverOpen(2, expanded), leafNeverOpen(3, expanded),
    leafNeverOpen(4, expanded), leafNeverOpen(5, expanded)
  )
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the selection, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), selected == valueProp)
  // a rejected request leaves the selection as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), selected == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), selected == requested)
}
