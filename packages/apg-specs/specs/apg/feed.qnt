// WAI-ARIA APG — Feed pattern: the feed behaviour machine.
//
// Sources (https://www.w3.org/WAI/ARIA/apg/patterns/feed/):
//   - "About This Pattern": the page loads/removes articles based on which
//     article holds DOM focus; the reading cursor is the focused article.
//   - "Keyboard Interaction": Page Down / Page Up move focus to the next /
//     previous article; Control+End / Control+Home move focus to the first
//     focusable element after / before the feed.
//   - "WAI-ARIA Roles, States, and Properties": aria-posinset (position of the
//     article, numbering from 1), aria-setsize (articles loaded, or the total;
//     -1 when the total is undetermined), aria-busy=true on the feed while
//     articles are being added/removed and false again when the operation is
//     complete (also on a failed load).
//   - Example https://www.w3.org/WAI/ARIA/apg/patterns/feed/examples/feed/:
//     articles are tabindex=0 (focus can enter the feed on any loaded article
//     with Tab), aria-setsize = articles currently contained by the feed,
//     loading is triggered by focus reaching the last loaded article.
//
// Request vs commit (map ticket rt1p). The number of loaded articles is the
// value. A batch arriving (`load_finish`) is a *request* carrying the intent
// (`requested`); it fires onLoadedChange (`requests` counts the calls) when the
// intent differs from the current `loaded`, and then:
//   uncontrolled        the request is accepted: the count commits the intent
//   controlled, holds   the host ignores it ("rejected"): the count is untouched
//   controlled, accepts the host answers with the same value (`accepting`): the
//                       count commits through the controlled value, not the event
// `valueProp` is the only thing that changes the count while `controlled`;
// `setValue` is the host writing it. `control` / `acceptRequests` are
// configuration events (init is literal-only). `load_start` / `load_fail` are
// adapter lifecycle events (busy), not value changes. Invariants for the model:
// ControlledFollowsProp, RejectedRequestUntouched, AcceptedRequestCommits.
//
// Machine: one feed with `loaded` articles (posinset 1..loaded) out of a fixed
// server-side `totalArticles`. Focus is in one of three zones: before the
// feed, on an article of the feed, or after the feed. Loading is a two-phase
// operation (load_start -> load_finish | load_fail) bracketed by aria-busy.
//
// Configuration variants:
//   - totalArticles (constant def): size of the whole feed.
//   - sizeMode  ("loaded" | "total"): which value aria-setsize reports; a prop
//     change at any time (set_size_mode).
//   - totalKnown (bool): whether the page knows the total; with sizeMode
//     "total" and an unknown total aria-setsize is -1 (set_total_known).
//   - batch sizes 1..3 per load_finish (pool).
//
// Deliberate omissions:
//   - Removing articles / prepending articles (renumbering of posinset); the
//     feed only grows at its end.
//   - Nested feeds and their navigation keys (Alt+Page Down, Ctrl+End to the
//     next outer article); articles that capture the feed keys themselves.
//   - Roles, labels and descriptions (role=feed/article, aria-labelledby,
//     aria-describedby): static DOM contract with no behaviour to model.
//   - Visual scrolling, scroll-position-triggered loading (load_start stands in
//     for it), loading delay, and which focusable element exactly is "after"
//     or "before" the feed (zones only).
//   - Control+Home from outside the feed and Tab order inside articles.
module apg_feed {
  var phase: str       // "idle" | "loading"
  var busy: bool       // the feed's aria-busy attribute
  var loaded: int      // articles currently in the DOM (posinset 1..loaded)
  var zone: str        // focus zone: "before" | "feed" | "after"
  var focus: int       // posinset of the focused article (0 = focus outside the feed)
  var sizeMode: str    // "loaded" | "total": what aria-setsize reports
  var totalKnown: bool // the page knows the total number of articles
  var controlled: bool // the host owns the loaded count (`value` prop present)
  var accepting: bool  // controlled host that answers every request with its intent
  var valueProp: int   // the controlled value prop (meaningful while controlled)
  var requested: int   // intent of the last request
  var requests: int    // number of requests that fired onLoadedChange
  var outcome: str     // "none" | "accepted" | "rejected"
  var base: int        // count when the last request was received

  // the number of articles the whole feed holds on the server
  def totalArticles: int = 6

  // --- derived ARIA contract ------------------------------------------------
  // aria-posinset of the article at (1-based) DOM index i
  def ariaPosinset(i: int): int = i
  // aria-setsize of every article: loaded count, total, or -1 when undetermined
  def ariaSetsize(mode: str, known: bool, count: int): int =
    if (mode == "loaded") count else if (known) totalArticles else -1
  // aria-busy on the feed element
  def ariaBusy(p: str): bool = p == "loading"
  // tabindex of an article (every article is in the Tab sequence)
  def articleTabindex(i: int): int = 0

  // --- guards ---------------------------------------------------------------
  def hasMore(count: int): bool = count < totalArticles
  def canStartLoad(p: str, count: int): bool = and(p == "idle", hasMore(count))
  def inFeed(z: str): bool = z == "feed"
  // Page Down: next article, stay on the last loaded one
  def pageDownTarget(z: str, f: int, count: int): int =
    if (and(inFeed(z), f < count)) f + 1 else f
  // Page Up: previous article, stay on the first
  def pageUpTarget(z: str, f: int): int =
    if (and(inFeed(z), f > 1)) f - 1 else f
  // focus on the last loaded article while more exist triggers a load
  def focusTriggersLoad(z: str, f: int, p: str, count: int): bool =
    and(and(inFeed(z), f == count), canStartLoad(p, count))
  def addedArticles(count: int, n: int): int =
    if (count + n <= totalArticles) n else totalArticles - count

  // --- request / commit (map ticket rt1p) ----------------------------------
  def moved(before: int, after: int): int = if (before == after) 0 else 1
  // the count after a batch when a load is in flight (else unchanged)
  def finishWant(loading: bool, count: int, n: int): int =
    if (loading) count + addedArticles(count, n) else count
  // controlled host that keeps the old value: the request is rejected
  def holds: bool = and(controlled, not(accepting))
  // controlled host that writes the intent back through the value prop
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"
  // the count after a request for `want`
  def landed(h: bool, current: int, want: int): int = if (h) current else want
  // the value prop after a request for `want`
  def propAfter(f: bool, p: int, want: int): int = if (f) want else p

  action init = all {
    phase' = "idle",
    busy' = false,
    loaded' = 1,
    zone' = "before",
    focus' = 0,
    sizeMode' = "loaded",
    totalKnown' = false,
    controlled' = false,
    accepting' = false,
    valueProp' = 1,
    requested' = 1,
    requests' = 0,
    outcome' = "none",
    base' = 1
  }

  // Tab (or a click) puts focus on loaded article n; an unloaded n is a no-op
  action focus_article = {
    nondet n = Set(1, 2, 3, 4, 5, 6).oneOf()
    all {
      phase' = if (focusTriggersLoad(if (and(n >= 1, n <= loaded)) "feed" else zone, if (and(n >= 1, n <= loaded)) n else focus, phase, loaded)) "loading" else phase,
      busy' = if (focusTriggersLoad(if (and(n >= 1, n <= loaded)) "feed" else zone, if (and(n >= 1, n <= loaded)) n else focus, phase, loaded)) true else busy,
      loaded' = loaded,
      zone' = if (and(n >= 1, n <= loaded)) "feed" else zone,
      focus' = if (and(n >= 1, n <= loaded)) n else focus,
      sizeMode' = sizeMode,
      totalKnown' = totalKnown,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = outcome,
      base' = base
    }
  }

  // Page Down inside the feed
  action page_down = all {
    phase' = if (focusTriggersLoad(zone, pageDownTarget(zone, focus, loaded), phase, loaded)) "loading" else phase,
    busy' = if (focusTriggersLoad(zone, pageDownTarget(zone, focus, loaded), phase, loaded)) true else busy,
    loaded' = loaded,
    zone' = zone,
    focus' = pageDownTarget(zone, focus, loaded),
    sizeMode' = sizeMode,
    totalKnown' = totalKnown,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // Page Up inside the feed
  action page_up = all {
    phase' = phase,
    busy' = busy,
    loaded' = loaded,
    zone' = zone,
    focus' = pageUpTarget(zone, focus),
    sizeMode' = sizeMode,
    totalKnown' = totalKnown,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // Control+End: leave the feed forwards
  action ctrl_end = all {
    phase' = phase,
    busy' = busy,
    loaded' = loaded,
    zone' = if (inFeed(zone)) "after" else zone,
    focus' = if (inFeed(zone)) 0 else focus,
    sizeMode' = sizeMode,
    totalKnown' = totalKnown,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // Control+Home: leave the feed backwards
  action ctrl_home = all {
    phase' = phase,
    busy' = busy,
    loaded' = loaded,
    zone' = if (inFeed(zone)) "before" else zone,
    focus' = if (inFeed(zone)) 0 else focus,
    sizeMode' = sizeMode,
    totalKnown' = totalKnown,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // focus moves somewhere outside the feed (Tab out, click elsewhere)
  action focus_outside = {
    nondet side = Set("before", "after").oneOf()
    all {
      phase' = phase,
      busy' = busy,
      loaded' = loaded,
      zone' = side,
      focus' = 0,
      sizeMode' = sizeMode,
      totalKnown' = totalKnown,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = outcome,
      base' = base
    }
  }

  // scroll position asks for more articles: aria-busy goes true
  action load_start = all {
    phase' = if (canStartLoad(phase, loaded)) "loading" else phase,
    busy' = if (canStartLoad(phase, loaded)) true else busy,
    loaded' = loaded,
    zone' = zone,
    focus' = focus,
    sizeMode' = sizeMode,
    totalKnown' = totalKnown,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // request: the batch arrives; articles appended (through the controlled
  // value), aria-busy back to false
  action load_finish = {
    nondet n = Set(1, 2, 3).oneOf()
    all {
      phase' = if (phase == "loading") "idle" else phase,
      busy' = if (phase == "loading") false else busy,
      loaded' = if (phase == "loading") landed(holds, loaded, finishWant(true, loaded, n)) else loaded,
      zone' = zone,
      focus' = focus,
      sizeMode' = sizeMode,
      totalKnown' = totalKnown,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (moved(loaded, finishWant(phase == "loading", loaded, n)) == 1) propAfter(follows, valueProp, finishWant(true, loaded, n)) else valueProp,
      requested' = if (moved(loaded, finishWant(phase == "loading", loaded, n)) == 1) finishWant(true, loaded, n) else requested,
      requests' = requests + moved(loaded, finishWant(phase == "loading", loaded, n)),
      outcome' = if (moved(loaded, finishWant(phase == "loading", loaded, n)) == 1) verdict else outcome,
      base' = if (moved(loaded, finishWant(phase == "loading", loaded, n)) == 1) loaded else base
    }
  }

  // the load fails: nothing added, aria-busy must still be cleared
  action load_fail = all {
    phase' = if (phase == "loading") "idle" else phase,
    busy' = if (phase == "loading") false else busy,
    loaded' = loaded,
    zone' = zone,
    focus' = focus,
    sizeMode' = sizeMode,
    totalKnown' = totalKnown,
    controlled' = controlled,
    accepting' = accepting,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // prop change: which value aria-setsize reports
  action set_size_mode = {
    nondet mode = Set("loaded", "total").oneOf()
    all {
      phase' = phase,
      busy' = busy,
      loaded' = loaded,
      zone' = zone,
      focus' = focus,
      sizeMode' = mode,
      totalKnown' = totalKnown,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = outcome,
      base' = base
    }
  }

  // prop change: the page learns (or loses) the total number of articles
  action set_total_known = {
    nondet known = Set(true, false).oneOf()
    all {
      phase' = phase,
      busy' = busy,
      loaded' = loaded,
      zone' = zone,
      focus' = focus,
      sizeMode' = sizeMode,
      totalKnown' = known,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = outcome,
      base' = base
    }
  }

  // commit: the host writes the controlled count (a no-op while uncontrolled).
  // An in-flight load settles; focus clamps into the new range, and refocusing
  // the clamped, now-last article asks for more (the load trigger again).
  action setValue = {
    nondet v = Set(1, 2, 3, 4, 5, 6).oneOf()
    all {
      phase' = if (controlled) (if (and(inFeed(zone), focus > v, hasMore(v))) "loading" else "idle") else phase,
      busy' = if (controlled) (and(inFeed(zone), focus > v, hasMore(v))) else busy,
      loaded' = if (controlled) v else loaded,
      zone' = zone,
      focus' = if (and(controlled, inFeed(zone), focus > v)) v else focus,
      sizeMode' = sizeMode,
      totalKnown' = totalKnown,
      controlled' = controlled,
      accepting' = accepting,
      valueProp' = if (controlled) v else valueProp,
      requested' = requested,
      requests' = requests,
      outcome' = if (controlled) "none" else outcome,
      base' = base
    }
  }

  // configuration: the host starts owning the count, adopting the current one
  action control = all {
    phase' = phase,
    busy' = busy,
    loaded' = loaded,
    zone' = zone,
    focus' = focus,
    sizeMode' = sizeMode,
    totalKnown' = totalKnown,
    controlled' = true,
    accepting' = accepting,
    valueProp' = loaded,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    phase' = phase,
    busy' = busy,
    loaded' = loaded,
    zone' = zone,
    focus' = focus,
    sizeMode' = sizeMode,
    totalKnown' = totalKnown,
    controlled' = controlled,
    accepting' = true,
    valueProp' = valueProp,
    requested' = requested,
    requests' = requests,
    outcome' = outcome,
    base' = base
  }

  action step = any {
    init,
    focus_article,
    page_down,
    page_up,
    ctrl_end,
    ctrl_home,
    focus_outside,
    load_start,
    load_finish,
    load_fail,
    set_size_mode,
    set_total_known,
    setValue,
    control,
    acceptRequests
  }

  // aria-busy is true exactly while a load is in flight
  val BusyIffLoading: bool = or(
    and(busy, ariaBusy(phase)),
    and(not(busy), not(ariaBusy(phase)))
  )
  val PhaseValid: bool = or(phase == "idle", phase == "loading")
  // a load only runs while articles remain, and the feed never overshoots
  val LoadingImpliesMore: bool = or(not(ariaBusy(phase)), hasMore(loaded))
  val LoadedWithinTotal: bool = and(loaded >= 1, loaded <= totalArticles)
  // focus zone and focused article agree; the focused article exists
  val ZoneValid: bool = or(zone == "before", zone == "feed", zone == "after")
  val FocusMatchesZone: bool = or(
    and(inFeed(zone), focus >= 1),
    and(not(inFeed(zone)), focus == 0)
  )
  val FocusWithinLoaded: bool = focus <= loaded
  val SizeModeValid: bool = or(sizeMode == "loaded", sizeMode == "total")
  // posinset numbers articles 1..loaded without gaps or repeats
  val PosinsetsContiguous: bool = and(
    ariaPosinset(1) == 1,
    ariaPosinset(loaded) == loaded
  )
  // every posinset fits in aria-setsize (unless it is the unknown value -1)
  val PosinsetWithinSetsize: bool = or(
    ariaSetsize(sizeMode, totalKnown, loaded) == -1,
    ariaPosinset(loaded) <= ariaSetsize(sizeMode, totalKnown, loaded)
  )
  val FocusedPosinsetWithinSetsize: bool = or(
    not(inFeed(zone)),
    or(
      ariaSetsize(sizeMode, totalKnown, loaded) == -1,
      ariaPosinset(focus) <= ariaSetsize(sizeMode, totalKnown, loaded)
    )
  )
  // aria-setsize is -1 only when the total was asked for but is unknown
  val SetsizeUnknownOnlyWhenTotalUnknown: bool = or(
    and(
      ariaSetsize(sizeMode, totalKnown, loaded) == -1,
      and(sizeMode == "total", not(totalKnown))
    ),
    and(
      not(ariaSetsize(sizeMode, totalKnown, loaded) == -1),
      not(and(sizeMode == "total", not(totalKnown)))
    )
  )
  val SetsizeValid: bool = or(
    ariaSetsize(sizeMode, totalKnown, loaded) == -1,
    ariaSetsize(sizeMode, totalKnown, loaded) >= 1
  )
  // every article is reachable with Tab
  val ArticlesTabbable: bool = articleTabindex(loaded) == 0
  // callbacks only ever count up from zero
  val RequestsNonNegative: bool = requests >= 0
  // controlled: only the value prop sets the count, so no event commits
  val ControlledFollowsProp: bool = or(not(controlled), loaded == valueProp)
  // a rejected request leaves the count as it found it
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), loaded == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(not(outcome == "accepted"), loaded == requested)
}
