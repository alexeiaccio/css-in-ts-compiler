// APG Media Player — a composition, because W3C ships no media-player pattern.
// https://www.w3.org/WAI/ARIA/apg/patterns/ (no player pattern exists)
//
// The control surface is three APG patterns, re-stated here as contracts (the
// generator's import closure accepts pure-def `shared/*` modules only, so
// slider/toolbar/button cannot be imported):
//   - Slider + the "Media Seek Slider" example
//     (https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-seek/):
//     role=slider, aria-valuemin/now/max, aria-valuetext as m:ss; the thumb keys
//     are ArrowLeft/Down -1s, ArrowRight/Up +1s, PageDown/Up -15/+15s, Home/End.
//     Deliberate divergence from slider.qnt: the timeline does NOT mirror in RTL.
//   - Toolbar: the controls row is one tab stop with roving focus; modelled only
//     as a `focus` scope so the seek thumb and the surface keys do not fight.
//   - Button / Menu Button: play-pause, mute, fullscreen toggles, and the v1
//     speed menu; modelled as `plays`/`pauses` callbacks and the `rate` set.
//
// The playback machine is not ARIA: it comes from the HTML `HTMLMediaElement`
// state/event contract (https://html.spec.whatwg.org/multipage/media.html),
// reduced to the states with an observable UI consequence. bsky HLS is VOD, so
// live is out of v1 scope.
//
// Request vs commit (map ticket rt1p) covers the four preferences — volume,
// muted, rate, fullscreen — which a host may own. `setVolume`, `toggleMute`,
// `setRate`, `toggleFullscreen` are requests; `propVolume`, `propMuted`,
// `propRate`, `propFullscreen` are the host writing the controlled props;
// `control` / `acceptRequests` configure the host (init is literal-only).
// Invariants: ControlledFollowsProps (no event commits while controlled),
// RejectedRequestUntouched, AcceptedRequestCommits.
//
// The generator has no action guards, so each action assigns every variable and
// out-of-phase events are no-ops via `if (<phase>) new else current`.
//
// ponytail: transport (play/pause/seek) and the playback stage stay adapter-driven
// and uncontrolled: they are device state, and a host steers them through the
// `play()` / `pause()` / `seek()` requests the adapter answers, not a value prop.
// Add `paused` / `position` props when a host must own the transport.
// ponytail: `live` (duration === Infinity) is not carried; add a flag + a live
// edge when a PDS serves live video. Drag cadence (preview vs commit) is modelled
// as two events; the consumer chooses how often to fire the commit.
module apg_player {
  var stage: str      // "loading" | "ready" | "playing" | "paused" | "buffering" | "ended" | "error"
  var seeking: bool   // a seek is in flight (HTMLMediaElement.seeking)
  var pos: int        // currentTime, whole seconds  (seek aria-valuenow)
  var dur: int        // duration, whole seconds     (seek aria-valuemax); 0 until known
  var known: bool     // loadedmetadata fired → duration known, seeking allowed
  var paused: bool    // exposed .paused mirror
  var ended: bool     // exposed .ended mirror
  var vol: int        // 0..100 (volume thumb aria-valuenow)
  var applied: int    // gain actually handed to the adapter (0 while muted)
  var muted: bool
  var rate: int       // percent: 50 | 100 | 150 | 200 (100 = 1x)
  var full: bool      // fullscreen is on (Fullscreen API on the container)
  var textMin: int    // minutes shown in aria-valuetext
  var textSec: int    // seconds shown in aria-valuetext (0..59)
  var focus: str      // "none" | "surface" | "seek" | "control"
  var plays: int      // onPlay callbacks
  var pauses: int     // onPause callbacks
  var seeks: int      // committed seeks (onSeek)
  var controlled: bool // the host owns the preferences (volume/muted/rate/fullscreen props)
  var accepting: bool  // controlled host that answers every request with its intent
  var prefs: int      // the controlled props, packed with `snap` (meaningful while controlled)
  var reqs: int       // preference requests that fired a change callback
  var reqKind: str    // "none" | "volume" | "muted" | "rate" | "fullscreen": the last request
  var askNum: int     // intent of the last request (volume / rate, or 1 / 0 for a toggle)
  var outcome: str    // "none" | "accepted" | "rejected": fate of the last request
  var base: int       // `snap` of the preferences when the last request was received

  // --- pure behaviour ----------------------------------------------------
  def effVol(v: int, m: bool): int = if (m) 0 else v
  def isLoading(s: str): bool = s == "loading"
  def isActive(s: str): bool = or(s == "playing", s == "buffering")
  def canPlay(s: str): bool =
    or(or(s == "ready", s == "paused"), or(s == "ended", s == "buffering"))
  def clampTo(p: int, k: bool, d: int): int =
    if (k) (if (p < 0) 0 else if (p > d) d else p) else p
  def tm(p: int): int = p / 60
  def ts(p: int): int = p % 60
  def keyDelta(k: str): int =
    if (or(k == "ArrowLeft", k == "ArrowDown")) -1
    else if (or(k == "ArrowRight", k == "ArrowUp")) 1
    else if (k == "PageUp") 15
    else if (k == "PageDown") -15
    else 0
  def seekTarget(k: str, p: int, d: int): int =
    if (k == "Home") 0
    else if (k == "End") d
    else clampTo(p + keyDelta(k), true, d)
  def surfaceDelta(k: str): int = if (k == "ArrowRight") 5 else -5

  // --- request / commit (map ticket rt1p) ----------------------------------
  // The four preferences (volume, muted, rate, fullscreen) are user-changeable
  // and host-ownable. A request fires its callback when the intent differs from
  // the current value; then, uncontrolled the request is accepted (it commits),
  // controlled and `holds` the host ignores it (rejected, state untouched), and
  // controlled and `follows` the host writes the intent back through the prop.
  def b2i(b: bool): int = if (b) 1 else 0
  // injective for vol 0..100, rate 0..200: ((vol*2 + muted) * 201 + rate) * 2 + full
  def snap(v: int, m: bool, r: int, f: bool): int = ((v * 2 + b2i(m)) * 201 + r) * 2 + b2i(f)
  def holds: bool = and(controlled, not(accepting))
  def follows: bool = and(controlled, accepting)
  def verdict: str = if (holds) "rejected" else "accepted"

  // --- ARIA contract (derived from the state) -----------------------------
  def ariaValueNow: int = pos
  def ariaValueMin: int = 0
  def ariaValueMax: int = dur

  // --- machine -----------------------------------------------------------
  action init = all {
    stage' = "loading",
    seeking' = false,
    pos' = 0,
    dur' = 0,
    known' = false,
    paused' = true,
    ended' = false,
    vol' = 100,
    applied' = 100,
    muted' = false,
    rate' = 100,
    full' = false,
    textMin' = 0,
    textSec' = 0,
    focus' = "none",
    plays' = 0,
    pauses' = 0,
    seeks' = 0,
    controlled' = false,
    accepting' = false,
    prefs' = 0,
    reqs' = 0,
    reqKind' = "none",
    askNum' = 0,
    outcome' = "none",
    base' = 0
  }

  action onLoadedMetadata = {
    nondet d = Set(0, 1, 5, 60, 90).oneOf()
    all {
      stage' = if (isLoading(stage)) "ready" else stage,
      seeking' = if (isLoading(stage)) false else seeking,
      pos' = if (isLoading(stage)) 0 else pos,
      dur' = if (isLoading(stage)) d else dur,
      known' = if (isLoading(stage)) true else known,
      paused' = paused,
      ended' = ended,
      vol' = vol,
      applied' = applied,
      muted' = muted,
      rate' = rate,
      full' = full,
      textMin' = if (isLoading(stage)) 0 else textMin,
      textSec' = if (isLoading(stage)) 0 else textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = prefs,
      reqs' = reqs,
      reqKind' = reqKind,
      askNum' = askNum,
      outcome' = outcome,
      base' = base
    }
  }

  action onCanPlay = all {
    stage' = if (isLoading(stage)) "ready" else stage,
    seeking' = seeking,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = paused,
    ended' = ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = textMin,
    textSec' = textSec,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action onWaiting = all {
    stage' = if (stage == "playing") "buffering" else stage,
    seeking' = seeking,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = paused,
    ended' = ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = textMin,
    textSec' = textSec,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action onPlaying = all {
    stage' = if (stage == "buffering") "playing" else stage,
    seeking' = seeking,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = if (stage == "buffering") false else paused,
    ended' = ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = textMin,
    textSec' = textSec,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action onTimeUpdate = {
    nondet t = Set(0, 1, 2, 30, 59, 60, 90).oneOf()
    all {
      stage' = stage,
      seeking' = seeking,
      pos' = if (stage == "playing") clampTo(t, known, dur) else pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = ended,
      vol' = vol,
      applied' = applied,
      muted' = muted,
      rate' = rate,
      full' = full,
      textMin' = if (stage == "playing") tm(clampTo(t, known, dur)) else textMin,
      textSec' = if (stage == "playing") ts(clampTo(t, known, dur)) else textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = prefs,
      reqs' = reqs,
      reqKind' = reqKind,
      askNum' = askNum,
      outcome' = outcome,
      base' = base
    }
  }

  action onPause = all {
    stage' = if (isActive(stage)) "paused" else stage,
    seeking' = seeking,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = if (isActive(stage)) true else paused,
    ended' = ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = textMin,
    textSec' = textSec,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action onEnded = all {
    stage' = if (stage == "playing") "ended" else stage,
    seeking' = seeking,
    pos' = if (and(stage == "playing", known)) dur else pos,
    dur' = dur,
    known' = known,
    paused' = if (stage == "playing") true else paused,
    ended' = if (stage == "playing") true else ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = if (and(stage == "playing", known)) tm(dur) else textMin,
    textSec' = if (and(stage == "playing", known)) ts(dur) else textSec,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action onError = all {
    stage' = "error",
    seeking' = false,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = true,
    ended' = false,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = textMin,
    textSec' = textSec,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action play = all {
    stage' = if (canPlay(stage)) "playing" else stage,
    seeking' = seeking,
    pos' = if (and(canPlay(stage), stage == "ended")) 0 else pos,
    dur' = dur,
    known' = known,
    paused' = if (canPlay(stage)) false else paused,
    ended' = if (canPlay(stage)) false else ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = if (and(canPlay(stage), stage == "ended")) 0 else textMin,
    textSec' = if (and(canPlay(stage), stage == "ended")) 0 else textSec,
    focus' = focus,
    plays' = if (canPlay(stage)) plays + 1 else plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action pause = all {
    stage' = if (isActive(stage)) "paused" else stage,
    seeking' = seeking,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = if (isActive(stage)) true else paused,
    ended' = ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = textMin,
    textSec' = textSec,
    focus' = focus,
    plays' = plays,
    pauses' = if (isActive(stage)) pauses + 1 else pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action togglePlay = all {
    stage' = if (isActive(stage)) "paused" else if (canPlay(stage)) "playing" else stage,
    seeking' = seeking,
    pos' = if (and(not(isActive(stage)), and(canPlay(stage), stage == "ended"))) 0 else pos,
    dur' = dur,
    known' = known,
    paused' = if (isActive(stage)) true else if (canPlay(stage)) false else paused,
    ended' = if (isActive(stage)) ended else if (canPlay(stage)) false else ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = if (and(not(isActive(stage)), and(canPlay(stage), stage == "ended"))) 0 else textMin,
    textSec' = if (and(not(isActive(stage)), and(canPlay(stage), stage == "ended"))) 0 else textSec,
    focus' = focus,
    plays' = if (and(not(isActive(stage)), canPlay(stage))) plays + 1 else plays,
    pauses' = if (isActive(stage)) pauses + 1 else pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action seekPreview = {
    nondet t = Set(0, 1, 2, 30, 59, 60, 90).oneOf()
    all {
      stage' = if (and(known, stage == "ended")) "paused" else stage,
      seeking' = if (known) true else seeking,
      pos' = if (known) clampTo(t, true, dur) else pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = if (known) false else ended,
      vol' = vol,
      applied' = applied,
      muted' = muted,
      rate' = rate,
      full' = full,
      textMin' = if (known) tm(clampTo(t, true, dur)) else textMin,
      textSec' = if (known) ts(clampTo(t, true, dur)) else textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = prefs,
      reqs' = reqs,
      reqKind' = reqKind,
      askNum' = askNum,
      outcome' = outcome,
      base' = base
    }
  }

  action seekCommit = {
    nondet t = Set(0, 1, 2, 30, 59, 60, 90).oneOf()
    all {
      stage' = if (and(known, stage == "ended")) "paused" else stage,
      seeking' = if (known) true else seeking,
      pos' = if (known) clampTo(t, true, dur) else pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = if (known) false else ended,
      vol' = vol,
      applied' = applied,
      muted' = muted,
      rate' = rate,
      full' = full,
      textMin' = if (known) tm(clampTo(t, true, dur)) else textMin,
      textSec' = if (known) ts(clampTo(t, true, dur)) else textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = if (known) seeks + 1 else seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = prefs,
      reqs' = reqs,
      reqKind' = reqKind,
      askNum' = askNum,
      outcome' = outcome,
      base' = base
    }
  }

  action seekKey = {
    nondet key = Set(
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      "PageUp", "PageDown", "Home", "End"
    ).oneOf()
    all {
      stage' = if (and(and(focus == "seek", known), stage == "ended")) "paused" else stage,
      seeking' = if (and(focus == "seek", known)) true else seeking,
      pos' = if (and(focus == "seek", known)) seekTarget(key, pos, dur) else pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = if (and(focus == "seek", known)) false else ended,
      vol' = vol,
      applied' = applied,
      muted' = muted,
      rate' = rate,
      full' = full,
      textMin' = if (and(focus == "seek", known)) tm(seekTarget(key, pos, dur)) else textMin,
      textSec' = if (and(focus == "seek", known)) ts(seekTarget(key, pos, dur)) else textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = if (and(focus == "seek", known)) seeks + 1 else seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = prefs,
      reqs' = reqs,
      reqKind' = reqKind,
      askNum' = askNum,
      outcome' = outcome,
      base' = base
    }
  }

  action surfaceSeekKey = {
    nondet key = Set("ArrowLeft", "ArrowRight").oneOf()
    all {
      stage' = if (and(and(focus == "surface", known), stage == "ended")) "paused" else stage,
      seeking' = if (and(focus == "surface", known)) true else seeking,
      pos' = if (and(focus == "surface", known)) clampTo(pos + surfaceDelta(key), true, dur) else pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = if (and(focus == "surface", known)) false else ended,
      vol' = vol,
      applied' = applied,
      muted' = muted,
      rate' = rate,
      full' = full,
      textMin' = if (and(focus == "surface", known)) tm(clampTo(pos + surfaceDelta(key), true, dur)) else textMin,
      textSec' = if (and(focus == "surface", known)) ts(clampTo(pos + surfaceDelta(key), true, dur)) else textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = if (and(focus == "surface", known)) seeks + 1 else seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = prefs,
      reqs' = reqs,
      reqKind' = reqKind,
      askNum' = askNum,
      outcome' = outcome,
      base' = base
    }
  }

  action onSeeked = all {
    stage' = stage,
    seeking' = false,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = paused,
    ended' = ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = textMin,
    textSec' = textSec,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action setVolume = {
    nondet v = Set(0, 25, 50, 75, 100).oneOf()
    all {
      stage' = stage,
      seeking' = seeking,
      pos' = pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = ended,
      vol' = if (holds) vol else v,
      applied' = effVol(if (holds) vol else v, muted),
      muted' = muted,
      rate' = rate,
      full' = full,
      textMin' = textMin,
      textSec' = textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = if (follows) snap(v, muted, rate, full) else prefs,
      reqs' = if (v == vol) reqs else reqs + 1,
      reqKind' = if (v == vol) reqKind else "volume",
      askNum' = if (v == vol) askNum else v,
      outcome' = if (v == vol) outcome else verdict,
      base' = if (v == vol) base else snap(vol, muted, rate, full)
    }
  }

  action toggleMute = all {
    stage' = stage,
    seeking' = seeking,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = paused,
    ended' = ended,
    vol' = vol,
    applied' = effVol(vol, if (holds) muted else not(muted)),
    muted' = if (holds) muted else not(muted),
    rate' = rate,
    full' = full,
    textMin' = textMin,
    textSec' = textSec,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = if (follows) snap(vol, not(muted), rate, full) else prefs,
    reqs' = reqs + 1,
    reqKind' = "muted",
    askNum' = if (muted) 0 else 1,
    outcome' = verdict,
    base' = snap(vol, muted, rate, full)
  }

  action setRate = {
    nondet r = Set(50, 100, 150, 200).oneOf()
    all {
      stage' = stage,
      seeking' = seeking,
      pos' = pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = ended,
      vol' = vol,
      applied' = applied,
      muted' = muted,
      rate' = if (holds) rate else r,
      full' = full,
      textMin' = textMin,
      textSec' = textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = if (follows) snap(vol, muted, r, full) else prefs,
      reqs' = if (r == rate) reqs else reqs + 1,
      reqKind' = if (r == rate) reqKind else "rate",
      askNum' = if (r == rate) askNum else r,
      outcome' = if (r == rate) outcome else verdict,
      base' = if (r == rate) base else snap(vol, muted, rate, full)
    }
  }

  action toggleFullscreen = all {
    stage' = stage,
    seeking' = seeking,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = paused,
    ended' = ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = if (holds) full else not(full),
    textMin' = textMin,
    textSec' = textSec,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = if (follows) snap(vol, muted, rate, not(full)) else prefs,
    reqs' = reqs + 1,
    reqKind' = "fullscreen",
    askNum' = if (full) 0 else 1,
    outcome' = verdict,
    base' = snap(vol, muted, rate, full)
  }

  action focusOn = {
    nondet target = Set("none", "surface", "seek", "control").oneOf()
    all {
      stage' = stage,
      seeking' = seeking,
      pos' = pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = ended,
      vol' = vol,
      applied' = applied,
      muted' = muted,
      rate' = rate,
      full' = full,
      textMin' = textMin,
      textSec' = textSec,
      focus' = target,
      plays' = plays,
      pauses' = pauses,
      seeks' = seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = prefs,
      reqs' = reqs,
      reqKind' = reqKind,
      askNum' = askNum,
      outcome' = outcome,
      base' = base
    }
  }

  action blur = all {
    stage' = stage,
    seeking' = seeking,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = paused,
    ended' = ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = textMin,
    textSec' = textSec,
    focus' = "none",
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action loadStart = all {
    stage' = "loading",
    seeking' = false,
    pos' = 0,
    dur' = 0,
    known' = false,
    paused' = true,
    ended' = false,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = 0,
    textSec' = 0,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = accepting,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  // commit: the host writes a controlled preference (a no-op while uncontrolled)
  action propVolume = {
    nondet v = Set(0, 25, 50, 75, 100).oneOf()
    all {
      stage' = stage,
      seeking' = seeking,
      pos' = pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = ended,
      vol' = if (controlled) v else vol,
      applied' = if (controlled) effVol(v, muted) else applied,
      muted' = muted,
      rate' = rate,
      full' = full,
      textMin' = textMin,
      textSec' = textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = if (controlled) snap(v, muted, rate, full) else prefs,
      reqs' = reqs,
      reqKind' = reqKind,
      askNum' = askNum,
      outcome' = if (controlled) "none" else outcome,
      base' = base
    }
  }

  action propMuted = {
    nondet m = Set(true, false).oneOf()
    all {
      stage' = stage,
      seeking' = seeking,
      pos' = pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = ended,
      vol' = vol,
      applied' = if (controlled) effVol(vol, m) else applied,
      muted' = if (controlled) m else muted,
      rate' = rate,
      full' = full,
      textMin' = textMin,
      textSec' = textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = if (controlled) snap(vol, m, rate, full) else prefs,
      reqs' = reqs,
      reqKind' = reqKind,
      askNum' = askNum,
      outcome' = if (controlled) "none" else outcome,
      base' = base
    }
  }

  action propRate = {
    nondet r = Set(50, 100, 150, 200).oneOf()
    all {
      stage' = stage,
      seeking' = seeking,
      pos' = pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = ended,
      vol' = vol,
      applied' = applied,
      muted' = muted,
      rate' = if (controlled) r else rate,
      full' = full,
      textMin' = textMin,
      textSec' = textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = if (controlled) snap(vol, muted, r, full) else prefs,
      reqs' = reqs,
      reqKind' = reqKind,
      askNum' = askNum,
      outcome' = if (controlled) "none" else outcome,
      base' = base
    }
  }

  action propFullscreen = {
    nondet f = Set(true, false).oneOf()
    all {
      stage' = stage,
      seeking' = seeking,
      pos' = pos,
      dur' = dur,
      known' = known,
      paused' = paused,
      ended' = ended,
      vol' = vol,
      applied' = applied,
      muted' = muted,
      rate' = rate,
      full' = if (controlled) f else full,
      textMin' = textMin,
      textSec' = textSec,
      focus' = focus,
      plays' = plays,
      pauses' = pauses,
      seeks' = seeks,
      controlled' = controlled,
      accepting' = accepting,
      prefs' = if (controlled) snap(vol, muted, rate, f) else prefs,
      reqs' = reqs,
      reqKind' = reqKind,
      askNum' = askNum,
      outcome' = if (controlled) "none" else outcome,
      base' = base
    }
  }

  // configuration: the host starts owning the preferences, adopting the current ones
  action control = all {
    stage' = stage,
    seeking' = seeking,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = paused,
    ended' = ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = textMin,
    textSec' = textSec,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = true,
    accepting' = accepting,
    prefs' = snap(vol, muted, rate, full),
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  // configuration: the controlled host answers every request with its intent
  action acceptRequests = all {
    stage' = stage,
    seeking' = seeking,
    pos' = pos,
    dur' = dur,
    known' = known,
    paused' = paused,
    ended' = ended,
    vol' = vol,
    applied' = applied,
    muted' = muted,
    rate' = rate,
    full' = full,
    textMin' = textMin,
    textSec' = textSec,
    focus' = focus,
    plays' = plays,
    pauses' = pauses,
    seeks' = seeks,
    controlled' = controlled,
    accepting' = true,
    prefs' = prefs,
    reqs' = reqs,
    reqKind' = reqKind,
    askNum' = askNum,
    outcome' = outcome,
    base' = base
  }

  action step = any {
    init,
    onLoadedMetadata, onCanPlay, onWaiting, onPlaying, onTimeUpdate,
    onPause, onEnded, onError,
    play, pause, togglePlay,
    seekPreview, seekCommit, seekKey, surfaceSeekKey, onSeeked,
    setVolume, toggleMute, setRate, toggleFullscreen,
    propVolume, propMuted, propRate, propFullscreen, control, acceptRequests,
    focusOn, blur, loadStart
  }

  // --- invariants --------------------------------------------------------
  // aria-valuenow stays inside [aria-valuemin, aria-valuemax]
  val SeekInRange: bool = and(pos >= 0, or(not(known), pos <= dur))
  val AriaNowWithinBounds: bool =
    and(ariaValueMin <= ariaValueNow, or(not(known), ariaValueNow <= ariaValueMax))
  // playing implies neither paused nor ended; the exposed mirrors track the stage
  val PlayingNotPaused: bool = or(stage != "playing", not(paused))
  val PlayingNotEnded: bool = or(stage != "playing", not(ended))
  val PausedMirrorsStage: bool = paused == not(isActive(stage))
  val EndedMirrorsStage: bool = ended == (stage == "ended")
  // the m:ss value text corresponds to the numeric value
  val ValueTextMirrors: bool = and(textMin == pos / 60, textSec == pos % 60)
  val ValueTextWellFormed: bool = and(textMin >= 0, and(textSec >= 0, textSec < 60))
  // muted silences; unmuted applies the slider value verbatim
  val MutedSilences: bool = and(
    applied == effVol(vol, muted),
    or(muted, applied == vol),
    or(not(muted), applied == 0)
  )
  val VolumeInRange: bool = and(vol >= 0, and(vol <= 100, and(applied >= 0, applied <= 100)))
  // seeking only happens once the duration is known
  val SeekingOnlyWhenKnown: bool = or(not(seeking), known)
  // the ended position is the timeline end
  val EndedAtDuration: bool = or(not(ended), or(not(known), pos == dur))
  // the speed menu offers only the modelled rates
  val RateAllowed: bool = or(rate == 50, or(rate == 100, or(rate == 150, rate == 200)))
  // focus is one of the modelled scopes
  val FocusKnown: bool = or(
    or(focus == "none", focus == "surface"),
    or(focus == "seek", focus == "control")
  )
  // callbacks only ever count up from zero
  val CallbacksNonNegative: bool = and(plays >= 0, and(pauses >= 0, and(seeks >= 0, reqs >= 0)))
  // controlled: only the props set the preferences, so no event commits
  val ControlledFollowsProps: bool = or(not(controlled), snap(vol, muted, rate, full) == prefs)
  // a rejected request leaves the preferences as it found them
  val RejectedRequestUntouched: bool = or(not(outcome == "rejected"), snap(vol, muted, rate, full) == base)
  // an accepted request committed exactly its intent
  val AcceptedRequestCommits: bool = or(
    not(outcome == "accepted"),
    if (reqKind == "volume") vol == askNum
    else if (reqKind == "muted") b2i(muted) == askNum
    else if (reqKind == "rate") rate == askNum
    else if (reqKind == "fullscreen") b2i(full) == askNum
    else false
  )
}
