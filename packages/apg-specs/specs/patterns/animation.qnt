// An animated disclosure: the protocol a signal cannot hold.
//
// NOT an APG pattern and not a CSS property: there is no WAI-ARIA APG page for
// "animate the disclosure", and no specification of the protocol below. The
// source of truth is the protocol itself — the five things an animated
// disclosure must do that its `open` signal cannot express:
//
//   1. RACE: `open` and `close` in the same frame end at the last intent, with
//      one live effect, never two;
//   2. CANCELLATION: leaving a transition cancels its effect, and that effect's
//      late completion is ignored;
//   3. REVERSAL: an interrupted close continues from where the box is, not from
//      `open` (and the other way round), so the effect's direction flips;
//   4. ONE EFFECT PER TRANSITION: a state declares the effect it runs; the
//      transition that supersedes it replaces the handle;
//   5. DEBOUNCE: a burst of `pointerenter` / `pointerleave` coalesces into the
//      last intent, and the last intent is never lost.
//
// A real implementation runs `Element.animate` (WAAPI), settles on the
// animation's `finished` promise (or on `transitionend` for a CSS transition),
// calls `cancel()` on the old animation before starting the new one, and
// short-circuits to the end state when `prefers-reduced-motion: reduce` matches
// (or when the primitive's `reducedMotion` override prop says so). What this
// spec models is that protocol: the intents, the effect handle, the box's
// position, and the split between the state the host exposes and the one the
// machine has committed.
//
// MODELLED. `visual` is the box: "closed" | "opening" | "open" | "closing".
// Four states and no `direction` variable: `opening` and `closing` ARE the
// direction, and a reversal is a `visual` change that keeps `progress`, so a
// second var would be a name the invariants only have to keep in sync.
// `progress` is the box's position on a five-point grid (0 closed .. 4 open); a
// real element reports a fraction, and the machine needs only the order and the
// two ends. `logical` is the accepted intent — what `aria-expanded` says, set
// the moment the intent arrives. `committed` is the state the machine has
// settled at ("closed" | "open"), and `optimistic` is `logical` against it: the
// host is exposing a state the machine has not committed yet. `visible` is the
// content's `hidden` flag (false only once the box is fully closed). `handle`
// is the live effect's id (0 = none), `last` the id of the effect the live one
// replaced, `live` the count of running effects (0 at rest, 1 in flight), and
// `pending` the debounce window ("none" | "open" | "close").
//
// THE OPTIMISTIC SPLIT is the point of the pattern: `aria-expanded` follows the
// intent at once (`logical`), the box animates (`visual`, `progress`), and the
// machine's own state settles one effect later (`committed`). Only a settle
// moves `committed`. An intent superseded before its effect finishes commits
// nothing (OptimisticRollsBackOnCancel) and the cancelled effect's completion
// cannot commit it (CancelledFinishIgnored). This is the shape of
// `@cssints/reactive`'s optimistic store (`createOptimistic` /
// `createOptimisticStore`), which the Solid bridge exposes; this spec is that
// store's oracle, not its implementation.
//
// REQUEST VS COMMIT is that split, with the effect's settle as the commit, not
// a host's acceptance: the exchanged value is the intent, the accepted one is
// what the last effect landed on. A host that rejects an intent is the reactive
// spec's business; this machine starts after an intent is accepted.
//
// ATOMICITY. One transition is one flush: the phase, the optimistic flag and
// the host's attributes (`aria-expanded`, `data-state`, `hidden`) are written
// in the same step. `Atomic` states what a Quint step can state — the
// attributes are always this state's own values — and it says plainly what it
// cannot: a Quint step is already atomic, so there is no half frame to rule
// out. The real two-write hazard (a phase painted before its attributes, or
// after) is `reactive.qnt`'s `Atomic` for its owners, and the browser replay;
// here the invariant is the mapping note between the two.
//
// NOT MODELLED (each is a pure decision, a browser detail, or another layer):
//   - Real timing: durations, easing, frame pacing. `tick` is one arbitrary
//     frame of a running effect and the grid saturates; the debounce window's
//     delay is any positive number, since every delay is the same machine.
//   - WAAPI's own completion ordering: `finished` resolving after `cancel()`, a
//     rejected `Animation.finished` promise, `transitionend` firing for one
//     property of several, the event's `elapsedTime`. The machine's
//     `finish_live` / `finish_stale` is the reduced form of all of them.
//   - The CSS: `grid-template-rows`, `opacity`, `translate`,
//     `@starting-style`, `transition-behavior`, and whether the content is
//     `display: none` at the end (the model knows `hidden`, not how it paints).
//   - The hover plumbing: `pointerenter` / `pointerleave` capture, touch, and a
//     hover that is really a focus. Both arrive as `hover_in` / `hover_out`.
//   - Focus and `inert` on the closed content, the trigger's `aria-controls`,
//     nested disclosures, and the host's own `createOptimisticStore` calls.
//
// GENERATOR GAPS HIT: no guards and no parameterised actions, so every action
// is total (a step that does not apply is a no-op branch) and every action
// assigns every var; no collections, so the two effect ids are ints and each
// action records what it did in its own flag (`stale`, `reversed`, `lead`,
// `settled`, `debounced`, `coalesced`).
module patterns_animation {
  var visual: str       // "closed" | "opening" | "open" | "closing"
  var committed: str    // the settled state: "closed" | "open"
  var logical: bool     // the accepted intent, what aria-expanded says
  var optimistic: bool  // the host exposes a state the machine has not settled
  var visible: bool     // the content is not hidden
  var progress: int     // the box: 0 closed .. 4 open
  var handle: int       // the live effect's id (0 = none)
  var last: int         // the id of the effect the live one replaced
  var live: int         // running effects: 0 at rest, 1 in flight
  var pending: str      // the debounce window: "none" | "open" | "close"
  var reduced: bool     // prefers-reduced-motion, or the override prop

  var stale: bool       // the last action was the completion of a cancelled effect
  var reversed: bool    // the last action was an intent that superseded a running effect
  var lead: bool        // the last action was an intent that started an effect
  var settled: bool     // the last action settled the box (a finish, or reduced motion)
  var debounced: bool   // the last action was the debounce window committing
  var coalesced: bool   // the last action was a pointer intent the window holds

  var arrived: int      // the handle the last completion carried
  var snapVisual: str   // the state before the last action
  var snapCommitted: str
  var snapLogical: bool
  var snapProgress: int
  var snapHandle: int
  var snapPending: str

  def ZERO: int = 0
  def ONE: int = 1
  def FULL: int = 4

  def inFlight(v: str): bool = or(v == "opening", v == "closing")
  def atRest(v: str): bool = or(v == "closed", v == "open")
  def shows(v: str): bool = v != "closed"
  def restPhase(o: bool): str = if (o) "open" else "closed"
  def movingPhase(o: bool): str = if (o) "opening" else "closing"
  def endProgress(o: bool): int = if (o) FULL else ZERO
  def openAt(c: str): bool = c == "open"
  def isOptimistic(o: bool, c: str): bool = o != openAt(c)
  def bump(p: int): int = if (p < FULL) p + ONE else FULL
  def drop(p: int): int = if (p > ZERO) p - ONE else ZERO

  // --- an accepted intent (o: true = open) --------------------------------
  // already at the target, at rest: nothing to run
  def isNoop(o: bool): bool = visual == restPhase(o)
  // running the other way: the superseded effect is cancelled and replaced
  def isReversal(o: bool): bool = visual == movingPhase(not(o))
  // at rest at the other end: a fresh effect starts where the box is
  def isStart(o: bool): bool = visual == restPhase(not(o))
  def supersedes(o: bool): bool = and(not(reduced), or(isReversal(o), isStart(o)))

  def nextVisual(o: bool): str =
    if (reduced) restPhase(o)
    else if (or(isReversal(o), isStart(o))) movingPhase(o)
    else visual
  def nextCommitted(o: bool): str = if (reduced) restPhase(o) else committed
  def nextOptimistic(o: bool): bool = isOptimistic(o, nextCommitted(o))
  def nextVisible(o: bool): bool = shows(nextVisual(o))
  // a start begins at the box's current end; a reversal keeps where it is
  def nextProgress(o: bool): int =
    if (reduced) endProgress(o)
    else if (isStart(o)) endProgress(not(o))
    else progress
  def nextHandle(o: bool): int =
    if (supersedes(o)) handle + ONE else if (reduced) ZERO else handle
  def nextLive(o: bool): int = if (supersedes(o)) ONE else if (reduced) ZERO else live
  def nextLast(o: bool): int = if (supersedes(o)) handle else last
  def nextReversed(o: bool): bool = isReversal(o)
  def nextLead(o: bool): bool = and(not(reduced), isStart(o))
  def nextSettled(o: bool): bool = reduced
  // the visual heads to the intent, either by animating (a start or a reversal)
  // or by landing at it at once (reduced motion)
  def headingTo(o: bool, v: str): bool =
    if (reduced) v == restPhase(o) else v == movingPhase(o)

  // --- a settle -------------------------------------------------------------
  def canFinish: bool = handle > ZERO
  def finishedVisual: str = if (visual == "opening") "open" else "closed"
  def finishedProgress: int = if (visual == "opening") FULL else ZERO

  // --- the debounce window --------------------------------------------------
  def committing: bool = pending != "none"
  def commitOpen: bool = pending == "open"

  // --- a cancelled effect's late completion ---------------------------------
  def staleNow: bool = and(last > ZERO, last != handle)

  action init = all {
    visual' = "closed",
    committed' = "closed",
    logical' = false,
    optimistic' = false,
    visible' = false,
    progress' = ZERO,
    handle' = ZERO,
    last' = ZERO,
    live' = ZERO,
    pending' = "none",
    reduced' = false,
    stale' = false,
    reversed' = false,
    lead' = false,
    settled' = false,
    debounced' = false,
    coalesced' = false,
    arrived' = ZERO,
    snapVisual' = "closed",
    snapCommitted' = "closed",
    snapLogical' = false,
    snapProgress' = ZERO,
    snapHandle' = ZERO,
    snapPending' = "none"
  }

  action open = all {
    visual' = nextVisual(true),
    committed' = nextCommitted(true),
    logical' = true,
    optimistic' = nextOptimistic(true),
    visible' = nextVisible(true),
    progress' = nextProgress(true),
    handle' = nextHandle(true),
    last' = nextLast(true),
    live' = nextLive(true),
    pending' = "none",
    reduced' = reduced,
    stale' = false,
    reversed' = nextReversed(true),
    lead' = nextLead(true),
    settled' = nextSettled(true),
    debounced' = false,
    coalesced' = false,
    arrived' = arrived,
    snapVisual' = visual,
    snapCommitted' = committed,
    snapLogical' = logical,
    snapProgress' = progress,
    snapHandle' = handle,
    snapPending' = pending
  }

  action close = all {
    visual' = nextVisual(false),
    committed' = nextCommitted(false),
    logical' = false,
    optimistic' = nextOptimistic(false),
    visible' = nextVisible(false),
    progress' = nextProgress(false),
    handle' = nextHandle(false),
    last' = nextLast(false),
    live' = nextLive(false),
    pending' = "none",
    reduced' = reduced,
    stale' = false,
    reversed' = nextReversed(false),
    lead' = nextLead(false),
    settled' = nextSettled(false),
    debounced' = false,
    coalesced' = false,
    arrived' = arrived,
    snapVisual' = visual,
    snapCommitted' = committed,
    snapLogical' = logical,
    snapProgress' = progress,
    snapHandle' = handle,
    snapPending' = pending
  }

  // a press on the trigger: the intent is the other one
  action toggle = all {
    visual' = nextVisual(not(logical)),
    committed' = nextCommitted(not(logical)),
    logical' = not(logical),
    optimistic' = nextOptimistic(not(logical)),
    visible' = nextVisible(not(logical)),
    progress' = nextProgress(not(logical)),
    handle' = nextHandle(not(logical)),
    last' = nextLast(not(logical)),
    live' = nextLive(not(logical)),
    pending' = "none",
    reduced' = reduced,
    stale' = false,
    reversed' = nextReversed(not(logical)),
    lead' = nextLead(not(logical)),
    settled' = nextSettled(not(logical)),
    debounced' = false,
    coalesced' = false,
    arrived' = arrived,
    snapVisual' = visual,
    snapCommitted' = committed,
    snapLogical' = logical,
    snapProgress' = progress,
    snapHandle' = handle,
    snapPending' = pending
  }

  // pointerenter: the window holds the intent, the box does not move
  action hover_in = all {
    visual' = visual,
    committed' = committed,
    logical' = logical,
    optimistic' = optimistic,
    visible' = visible,
    progress' = progress,
    handle' = handle,
    last' = last,
    live' = live,
    pending' = "open",
    reduced' = reduced,
    stale' = false,
    reversed' = false,
    lead' = false,
    settled' = false,
    debounced' = false,
    coalesced' = true,
    arrived' = arrived,
    snapVisual' = visual,
    snapCommitted' = committed,
    snapLogical' = logical,
    snapProgress' = progress,
    snapHandle' = handle,
    snapPending' = pending
  }

  action hover_out = all {
    visual' = visual,
    committed' = committed,
    logical' = logical,
    optimistic' = optimistic,
    visible' = visible,
    progress' = progress,
    handle' = handle,
    last' = last,
    live' = live,
    pending' = "close",
    reduced' = reduced,
    stale' = false,
    reversed' = false,
    lead' = false,
    settled' = false,
    debounced' = false,
    coalesced' = true,
    arrived' = arrived,
    snapVisual' = visual,
    snapCommitted' = committed,
    snapLogical' = logical,
    snapProgress' = progress,
    snapHandle' = handle,
    snapPending' = pending
  }

  // the window closes: the last intent is the one that lands
  action debounce = all {
    visual' = if (committing) nextVisual(commitOpen) else visual,
    committed' = if (committing) nextCommitted(commitOpen) else committed,
    logical' = if (committing) commitOpen else logical,
    optimistic' = if (committing) nextOptimistic(commitOpen) else optimistic,
    visible' = if (committing) nextVisible(commitOpen) else visible,
    progress' = if (committing) nextProgress(commitOpen) else progress,
    handle' = if (committing) nextHandle(commitOpen) else handle,
    last' = if (committing) nextLast(commitOpen) else last,
    live' = if (committing) nextLive(commitOpen) else live,
    pending' = "none",
    reduced' = reduced,
    stale' = false,
    reversed' = if (committing) nextReversed(commitOpen) else false,
    lead' = if (committing) nextLead(commitOpen) else false,
    settled' = if (committing) nextSettled(commitOpen) else false,
    debounced' = committing,
    coalesced' = false,
    arrived' = arrived,
    snapVisual' = visual,
    snapCommitted' = committed,
    snapLogical' = logical,
    snapProgress' = progress,
    snapHandle' = handle,
    snapPending' = pending
  }

  // a frame of the running effect: the box moves, nothing else does
  action tick = all {
    visual' = visual,
    committed' = committed,
    logical' = logical,
    optimistic' = optimistic,
    visible' = visible,
    progress' = if (visual == "opening") bump(progress)
      else if (visual == "closing") drop(progress)
      else progress,
    handle' = handle,
    last' = last,
    live' = live,
    pending' = pending,
    reduced' = reduced,
    stale' = false,
    reversed' = false,
    lead' = false,
    settled' = false,
    debounced' = false,
    coalesced' = false,
    arrived' = arrived,
    snapVisual' = visual,
    snapCommitted' = committed,
    snapLogical' = logical,
    snapProgress' = progress,
    snapHandle' = handle,
    snapPending' = pending
  }

  // the live effect's completion: the box lands, the machine commits
  action finish_live = all {
    visual' = if (canFinish) finishedVisual else visual,
    committed' = if (canFinish) finishedVisual else committed,
    logical' = logical,
    optimistic' = if (canFinish) isOptimistic(logical, finishedVisual) else optimistic,
    visible' = if (canFinish) shows(finishedVisual) else visible,
    progress' = if (canFinish) finishedProgress else progress,
    handle' = if (canFinish) ZERO else handle,
    last' = if (canFinish) handle else last,
    live' = if (canFinish) ZERO else live,
    pending' = pending,
    reduced' = reduced,
    stale' = false,
    reversed' = false,
    lead' = false,
    settled' = canFinish,
    debounced' = false,
    coalesced' = false,
    arrived' = arrived,
    snapVisual' = visual,
    snapCommitted' = committed,
    snapLogical' = logical,
    snapProgress' = progress,
    snapHandle' = handle,
    snapPending' = pending
  }

  // the completion of an effect that was cancelled: it moves nothing
  action finish_stale = all {
    visual' = visual,
    committed' = committed,
    logical' = logical,
    optimistic' = optimistic,
    visible' = visible,
    progress' = progress,
    handle' = handle,
    last' = last,
    live' = live,
    pending' = pending,
    reduced' = reduced,
    stale' = staleNow,
    reversed' = false,
    lead' = false,
    settled' = false,
    debounced' = false,
    coalesced' = false,
    arrived' = last,
    snapVisual' = visual,
    snapCommitted' = committed,
    snapLogical' = logical,
    snapProgress' = progress,
    snapHandle' = handle,
    snapPending' = pending
  }

  // prefers-reduced-motion turns on: any effect is cancelled and the box lands
  action reduced_motion = all {
    visual' = restPhase(logical),
    committed' = restPhase(logical),
    logical' = logical,
    optimistic' = isOptimistic(logical, restPhase(logical)),
    visible' = shows(restPhase(logical)),
    progress' = endProgress(logical),
    handle' = ZERO,
    last' = handle,
    live' = ZERO,
    pending' = pending,
    reduced' = true,
    stale' = false,
    reversed' = false,
    lead' = false,
    settled' = true,
    debounced' = false,
    coalesced' = false,
    arrived' = arrived,
    snapVisual' = visual,
    snapCommitted' = committed,
    snapLogical' = logical,
    snapProgress' = progress,
    snapHandle' = handle,
    snapPending' = pending
  }

  action step = any {
    init,
    open,
    close,
    toggle,
    hover_in,
    hover_out,
    debounce,
    tick,
    finish_live,
    finish_stale,
    reduced_motion
  }

  // at rest the box is the last accepted intent: a settle that landed anywhere
  // else, or a late completion that moved the box, fails this
  val LastIntentWins: bool =
    or(not(atRest(visual)),
       and(logical == (visual == "open"),
           and(committed == visual,
               and(not(optimistic), progress == endProgress(logical)))))
  // one live effect, never two: a superseded transition replaces the handle
  val OneEffectPerState: bool =
    and(or(not(inFlight(visual)), and(live == ONE, handle > ZERO)),
        or(inFlight(visual), and(live == ZERO, handle == ZERO)))
  // the optimistic flag is exactly "the exposed state is not the committed one"
  val OptimisticIsSplit: bool = optimistic == isOptimistic(logical, committed)
  // an intent leads: the exposed state is its target, the box heads to it, and
  // the machine has committed nothing yet
  val OptimisticLeadsOnIntent: bool =
    or(not(lead),
       and(committed == snapCommitted, and(optimistic, headingTo(logical, visual))))
  // a settle reconciles the split: committed, visual and the intent agree
  val OptimisticReconcilesOnSettle: bool =
    or(not(settled),
       and(committed == visual, and(visual == restPhase(logical), not(optimistic))))
  // the intent that superseded a running effect committed nothing: the machine
  // is where it was, the exposed state is the newer intent, the box heads there
  val OptimisticRollsBackOnCancel: bool =
    or(not(reversed),
       and(committed == snapCommitted,
           and(logical == not(snapLogical), headingTo(logical, visual))))
  // no stale optimistic state: the box only animates towards the intent the
  // machine currently holds, and an optimistic exposure always has a live
  // effect that will reconcile it
  val NoStaleOptimistic: bool =
    and(or(not(inFlight(visual)), logical == (visual == "opening")),
        or(not(optimistic), inFlight(visual)))
  // a cancelled effect's late completion moves nothing, commits nothing
  val CancelledFinishIgnored: bool =
    or(not(stale),
       and(visual == snapVisual, and(progress == snapProgress, handle == snapHandle)))
  // a stale completion carries an id that is not the live one
  val StaleCarriesCancelled: bool = or(not(stale), arrived != handle)
  // an interrupted transition continues from where the box is, in the other
  // direction, with the superseded effect's handle replaced
  val ReversalKeepsPosition: bool =
    or(not(reversed),
       and(progress == snapProgress,
           and(visual != snapVisual, handle != snapHandle)))
  // no dead end: an in-flight box always has one effect that can finish it, and
  // the test walks from every reachable state to closed or open
  val NoStuckState: bool = or(not(inFlight(visual)), handle > ZERO)
  // a coalesced burst ends with the last intent, never an earlier one
  val DebounceKeepsLast: bool =
    or(not(debounced), and(pending == "none", logical == (snapPending == "open")))
  // the window holds an intent and moves nothing
  val CoalescingHolds: bool =
    or(not(coalesced),
       and(pending != "none",
           and(logical == snapLogical,
               and(visual == snapVisual,
                   and(progress == snapProgress, handle == snapHandle)))))
  // with prefers-reduced-motion no transition is ever entered
  val ReducedMotionSkips: bool =
    or(not(reduced), and(atRest(visual), and(live == ZERO, handle == ZERO)))
  // one transition is one flush: the host's `hidden` is this state's own
  // `visible` (a Quint step is atomic; see the header on what that cannot say)
  val Atomic: bool = visible == shows(visual)
}
