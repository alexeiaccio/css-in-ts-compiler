// View transitions: the runner, not the CSS (bean cssints-jsjh).
//
// Not an APG pattern: there is no widget and no ARIA contract. The primitive is
// the three things every host gets wrong when it calls the platform directly, so
// the model is the runner that `createViewTransition().run(update)` implements.
//
// Researched — MDN View Transition API (Baseline October 2025):
//   - `document.startViewTransition(update)` returns a ViewTransition with
//     `ready`, `updateCallbackDone`, `finished` and `skipTransition()`. The
//     update callback runs exactly once. `ready` rejects when the transition
//     cannot begin — a `view-transition-name` shared by two rendered elements is
//     the usual cause — and then the WHOLE transition is skipped, not one pair.
//   - starting a transition while one runs skips the running one: the platform
//     has no queue, the latest request wins.
//   - `view-transition-name: match-element` lets the browser name the element
//     itself, for the case where the same element persists across the update.
//     A host-chosen name is its own responsibility: it must be unique among
//     rendered elements at the same time.
//   - a skipped transition is not a failure. It resolves the run promise like
//     any other; the update already ran.
//   - the API says nothing about reduced motion: the host simply does not start
//     a transition. "No API" and "prefers-reduced-motion" are therefore one
//     mode, not two.
//
// MODELLED: one runner, one transition at a time. A request always runs its
// update exactly once and always settles its promise. In "inert" mode nothing
// starts. In "animate" mode a request starts a transition; a request while one
// runs skips the running one (`skips`) and starts the new one — latest wins, no
// queue. `settle` is a transition that finished; `abort` is one the platform
// skipped (a duplicate name, a superseded one, a browser cancel), which counts
// in `skips` and nowhere else. `pending` is the number of unresolved `run`
// promises (0 or 1). `mode` is the host's policy for the NEXT request: it is
// read when a request starts, so turning it off mid-flight does not cancel the
// running transition (the model flips it only while idle).
//
// NOT MODELLED: the CSS (durations, easing, the ::view-transition-* pseudo
// elements), `view-transition-class` / `types`, cross-document transitions
// (pageswap / pagereveal), and name allocation — the model covers one transition
// at a time, not the uniqueness of names across rendered elements. The two
// cases the primitive's style objects serve (`persist` vs `name`) are DOM facts
// about uniqueness, not runner events.
//
// GENERATOR GAPS HIT: no guards and no parameterized actions. An action's body
// must be assignments only, so an event that applies in one phase no-ops in the
// other through `if (phase == "active")` rather than a guard; every action
// assigns every var.
module patterns_view_transition {
  var mode: str      // "animate" | "inert" (the policy for the next request)
  var phase: str     // "idle" | "active"
  var active: int    // token of the running transition (0 = none ever)
  var latest: int    // token of the most recent request
  var requests: int  // run(update) calls
  var updates: int   // update callbacks that ran (exactly one per request)
  var inert: int     // requests that ran no transition
  var starts: int    // transitions started
  var finished: int  // transitions that settled
  var skips: int     // transitions skipped (superseded or aborted)
  var pending: int   // unresolved run() promises (0 or 1)

  def animating: bool = mode == "animate"
  def running: bool = phase == "active"
  def nextToken: int = latest + 1

  action init = all {
    mode' = "animate",
    phase' = "idle",
    active' = 0,
    latest' = 0,
    requests' = 0,
    updates' = 0,
    inert' = 0,
    starts' = 0,
    finished' = 0,
    skips' = 0,
    pending' = 0
  }

  // the host calls run(update): the update runs whether or not anything animates
  action request = all {
    mode' = mode,
    phase' = if (animating) "active" else phase,
    active' = if (animating) nextToken else active,
    latest' = nextToken,
    requests' = requests + 1,
    updates' = updates + 1,
    inert' = if (animating) inert else inert + 1,
    starts' = if (animating) starts + 1 else starts,
    finished' = finished,
    skips' = if (and(animating, running)) skips + 1 else skips,
    pending' = if (animating) 1 else 0
  }

  // the transition finished; idle is already done
  action settle = all {
    mode' = mode,
    phase' = "idle",
    active' = active,
    latest' = latest,
    requests' = requests,
    updates' = updates,
    inert' = inert,
    starts' = starts,
    finished' = if (running) finished + 1 else finished,
    skips' = skips,
    pending' = 0
  }

  // the platform skipped it: a skip, not a failure, so nothing but `skips` moves
  action abort = all {
    mode' = mode,
    phase' = "idle",
    active' = active,
    latest' = latest,
    requests' = requests,
    updates' = updates,
    inert' = inert,
    starts' = starts,
    finished' = finished,
    skips' = if (running) skips + 1 else skips,
    pending' = 0
  }

  // reduced motion on: the same inert mode as a browser without the API. A
  // running transition is left alone (the policy is read at the next request).
  action inertOn = all {
    mode' = if (running) mode else "inert",
    phase' = phase,
    active' = active,
    latest' = latest,
    requests' = requests,
    updates' = updates,
    inert' = inert,
    starts' = starts,
    finished' = finished,
    skips' = skips,
    pending' = pending
  }

  // reduced motion off
  action inertOff = all {
    mode' = "animate",
    phase' = phase,
    active' = active,
    latest' = latest,
    requests' = requests,
    updates' = updates,
    inert' = inert,
    starts' = starts,
    finished' = finished,
    skips' = skips,
    pending' = pending
  }

  action step = any {
    init, request, settle, abort, inertOn, inertOff
  }

  // the update callback runs exactly once per request, whatever the transition
  val OneUpdatePerRequest: bool = updates == requests
  // every request either ran inert or started a transition; never both, never neither
  val InertRequestsStartNothing: bool = inert + starts == requests
  // every started transition is finished, skipped, or the one still running
  val AnimatedStartsBalance: bool = starts == finished + skips + (if (running) 1 else 0)
  // the running transition is always the most recent request
  val ActiveIsTheLatest: bool = or(not(running), active == latest)
  // inert mode never animates
  val InertNeverActive: bool = or(animating, not(running))
  // a run promise is unresolved exactly while its transition runs
  val PendingOnlyWhileActive: bool = pending == (if (running) 1 else 0)
}
