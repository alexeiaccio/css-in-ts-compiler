# Player ARIA & spec composition — the implementable contract

> Moved from effects-of-atmosphere `docs/research/` on 2026-10-23 with the widgets. `effects-of-atmosphere-xxxx` ids are beans in that repository.

Research for the wayfinder ticket **"Player ARIA & spec composition
(Slider + Toolbar + HTMLMediaElement)"** (`effects-of-atmosphere-v2uy`), parent map
`effects-of-atmosphere-zo29`. Compiled **2026-10-04**.

**Verdict up front.** There is no W3C APG media-player pattern, so the player is a
**composition**: the _playback_ contract comes from the HTML
`HTMLMediaElement` state/event machine, and the _control surface_ is APG Slider
(seek + volume) + APG Toolbar (roving focus) + APG Button + APG Menu Button
(speed). Crucially, **`player.qnt` cannot import `slider.qnt` / `toolbar.qnt` /
`button.qnt`**: the codegen's import closure rejects any imported module that
declares `var`, `const`, `assume`, `instance`, `action` or `run`
([`codegen.ts` L532–553](../../packages/quint-machine/src/codegen.ts)); only
`shared/*` **pure-def** modules are importable. So those specs are **reused as
contracts to re-state, and as scenario test data — never as imported machines**.
The seek half of `slider.qnt` covers the slider _mechanics_ but not the three
things a player seek needs (duration-derived range + metadata gating, `m:ss`
value text, drag-vs-commit); those go into the new machine.

---

## 1. Spec composition: reused vs genuinely new

### What the generator allows

- **Imports are pure-def only.** `loadSpecClosure` walks `import m.* from "path"`
  recursively and **inlines pure `def`s**; it throws `UnsupportedSpecError` for an
  imported module that declares `var` / `const` / `assume` / `instance` / `action`
  / `run` ("shared modules must be pure defs only")
  ([`codegen.ts` L532–561](../../packages/quint-machine/src/codegen.ts)).
  `packages/specs/README.md` L18 restates the same rule.
- The old gap repro effects-of-atmosphere `docs/research/quint-generator-gap/import-spec.qnt` ("import
  silently ignored") is **stale** — the current codegen resolves and inlines
  imports (confirmed against `codegen.ts`).
- **`slider.qnt`, `toolbar.qnt`, `button.qnt`, `menu-button.qnt` are machine
  modules** (they declare `var` + `action`), so a player spec **cannot** import
  them. There is no "compose three machines" mechanism in the generator's subset.

### Reuse ledger

| Existing artefact                                                                      | How the player uses it                                                                                                                                                                           | Verbatim?                       |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| `specs/apg/slider.qnt`                                                                 | **Contract source**: ARIA `role=slider`, `aria-value{min,now,max,text,orientation}`, `tabindex=0`, key→delta semantics, clamp, bounds invariants. Re-stated as defs/actions inside `player.qnt`. | contract only; **not imported** |
| `specs/apg/toolbar.qnt`                                                                | **Contract source** for the controls row: one tab stop, roving focus, Home/End, arrow navigation along the axis, focus memory. The controls row is a toolbar instance.                           | contract only; **not imported** |
| `specs/apg/button.qnt`                                                                 | **Contract source** for play/pause, mute, fullscreen buttons (`role=button`, `aria-pressed` for mute/fullscreen toggles, Space/Enter activation).                                                | contract only                   |
| `specs/apg/menu-button.qnt`                                                            | **Contract source** for the v1 speed picker (APG Menu Button, per the scope decision `effects-of-atmosphere-zoj0`).                                                                              | contract only                   |
| `scenarios/apg/slider.*.json`, `toolbar.*.json`, `button.*.json`, `menu-button.*.json` | **Test data** replayed against `player.qnt`'s seek/toolbar/button bridges.                                                                                                                       | reused as-is                    |
| `specs/video/playback-readiness.qnt`                                                   | **Phase-pattern template** (`if (<phase>) new else current`) and a reminder that service-side readiness (publish/remove) is _not_ player state.                                                  | pattern only                    |
| `shared/*.qnt`                                                                         | Importable pure defs; nothing slider/seek-specific lives there today, so nothing to import.                                                                                                      | n/a                             |

### Is `slider.qnt` enough for the seek control? No — three genuine gaps

`slider.qnt` fixes range `0..10`, step `1`, largeStep `3` as **constant defs**
(L42–45) and derives `ariaValueText` from a low/medium/high band (L72–73). Its
header already lists the omissions (L21–33). For a media seek the deltas are:

1. **Range is `[0, duration]`, and duration is unknown until metadata.**
   `slider.qnt`'s range is a compile-time constant. A player's `aria-valuemax`
   is the decoded `duration` (HTML `duration: number`, `NaN` before metadata,
   `Infinity` for live — [MDN `HTMLMediaElement.duration`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#instance_properties));
   seek must be a no-op until the duration is known. → new `known`/`dur` state.
2. **`aria-valuetext` is `m:ss`, not a qualitative band.** The APG Media Seek
   Slider example "converts the slider value to a string that communicates the
   position in minutes and seconds"
   ([slider-seek.js `getValueTextMinutesSeconds`](https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/slider/examples/js/slider-seek.js)).
   Quint has **no int→string / string-concat builtin** (`iToStr`/`concat` are
   absent from `@informalsystems/quint` `builtinNames`), so the spec models the
   _components_ (`textMin`, `textSec`) and the DOM test asserts the literal
   zero-padded `"m:ss"`.
3. **Drag vs commit.** `slider.qnt` models a single discrete `pointer` press
   (L123–133) and explicitly omits dragging. A seek bar needs a preview-during-
   drag vs commit-on-release split (base-ui's `onValueChange` vs
   `onValueCommitted`, [scenario `slider.base-ui.json` L338–359](../../packages/apg-specs/scenarios/apg/slider.base-ui.json)),
   because issuing an adapter `seek()` per pointermove is wasteful for HLS.

Also new (not in `slider.qnt`): the media state machine itself, volume/mute,
rate, fullscreen, and the **keyboard scoping** between the player surface and the
toolbar/seek thumb (see §3).

---

## 2. Playback machine — state set and event alphabet (no guards, phase pattern)

Sourced from the `HTMLMediaElement` IDL/properties (`paused`, `ended`, `seeking`,
`currentTime`, `duration`, `volume`, `muted`, `playbackRate`,
`networkState`/`readyState`) and its event list
(`loadedmetadata`, `canplay`, `play`, `playing`, `pause`, `waiting`, `seeking`,
`seeked`, `timeupdate`, `ended`, `ratechange`, `volumechange`, `error`). Primary
sources: the WHATWG spec section
[`html.spec.whatwg.org/multipage/media.html#htmlmediaelement`](https://html.spec.whatwg.org/multipage/media.html#htmlmediaelement)
(fetched via the locally generated TypeScript DOM typings, which are produced
from that IDL) and the MDN event table
([`HTMLMediaElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#events),
which cites the same spec).

**Reduction rules.** Keep only states with an observable UI consequence and only
events the primitive reacts to. `networkState`/`readyState` collapse to
`loading | ready`; `canplaythrough`/`durationchange`/`timeupdate`/`progress`/
`stalled`/`abort`/`suspend`/`emptied` collapse into `loadedMetadata`, `canplay`,
and the `timeupdate` tick. Live (`duration === Infinity`) is **out of v1 scope**
(bsky HLS is VOD, `#EXT-X-PLAYLIST-TYPE:VOD` + `#EXT-X-ENDLIST`, per
effects-of-atmosphere `docs/research/mediabunny-hls-player.md` §1) — carry a `live: bool` flag but do
not model the live edge.

### State (vars)

```quint
module apg_player {
  var stage: str      // "loading" | "ready" | "playing" | "paused" | "buffering" | "ended" | "error"
  var seeking: bool   // a seek is in flight (HTMLMediaElement.seeking)
  var pos: int        // currentTime, whole seconds  (seek aria-valuenow)
  var dur: int        // duration, whole seconds     (seek aria-valuemax); 0 until known
  var known: bool     // loadedmetadata fired → duration known, seeking allowed
  var paused: bool    // exposed .paused   (a stored mirror, so it can drift → invariant)
  var ended: bool     // exposed .ended    (a stored mirror)
  var vol: int        // 0..100 (volume thumb aria-valuenow)
  var applied: int    // gain actually handed to the adapter (0 while muted)
  var muted: bool
  var rate: int       // percent: 50 | 100 | 150 | 200  (100 = 1×)
  var full: bool      // fullscreen on the container (Fullscreen API, not the adapter)
  var textMin: int    // minutes shown in aria-valuetext
  var textSec: int    // seconds shown in aria-valuetext (0..59)
  var focus: str      // "none" | "surface" | "seek" | "control"
  var plays: int      // onPlay callbacks
  var pauses: int     // onPause callbacks
  var seeks: int      // committed seeks (onSeek)
```

Rationale for the stored `paused`/`ended`/`textMin`/`textSec`/`applied` mirrors:
the generator has no guards and the differential test compares _exposed_ values,
so the spec stores what the DOM/AT would read and the invariant catches a missed
update (the same technique as `disclosure.qnt`'s `ariaExpanded`/`panelHidden`,
L27–28).

### Event alphabet and effects

`—` = unchanged. Every action is `all { … }` assigning every var (the phase
pattern); out-of-phase events are no-ops expressed as `if (<phase>) new else
current`. Adapter-origin events are prefixed `on`; user-intent events are the
primitive's public methods/keys.

| Event                                      | Source (HTML)                    | Effect                                                                  |
| ------------------------------------------ | -------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------- |
| `onLoadedMetadata(d)`                      | `loadedmetadata`                 | if `loading`: `stage=ready`, `known=true`, `dur=d`, `pos=0`; else no-op |
| `onCanPlay`                                | `canplay`                        | if `loading`: `stage=ready`; else no-op                                 |
| `onWaiting`                                | `waiting`                        | if `playing`: `stage=buffering`; else no-op                             |
| `onPlaying`                                | `playing`                        | if `buffering`: `stage=playing`; else no-op                             |
| `onTimeUpdate(t)`                          | `timeupdate`                     | if `playing`: `pos=t` (+ refresh `textMin/textSec`); else no-op         |
| `onPause`                                  | `pause` (external)               | if `playing` or `buffering`: `stage=paused`, `paused=true`              |
| `onEnded`                                  | `ended`                          | if `playing`: `stage=ended`, `ended=true`, `paused=true`, `pos=dur`     |
| `onError`                                  | `error`                          | `stage=error`                                                           |
| `play`                                     | user `play()`/Space/K/button     | if `ready                                                               | paused                                                | ended | buffering`: `stage=playing`, `paused=false`, `ended=false`; **if previously `ended`, `pos=0`**; `plays++` |
| `pause`                                    | user `pause()`/Space/K/button    | if `playing                                                             | buffering`: `stage=paused`, `paused=true`, `pauses++` |
| `seekPreview(t)`                           | pointer drag / slider move       | if `known`: `pos=t`, `seeking=true`; no adapter call                    |
| `seekCommit(t)`                            | pointerup / Enter on thumb       | if `known`: `pos=t`, `seeking=true`, `seeks++` (adapter `seek(t)`)      |
| `onSeeked`                                 | `seeked`                         | `seeking=false`                                                         |
| `seekStepBack/Fwd` (thumb)                 | ArrowLeft/Down / Right/Up        | on `seek`: commit target `pos ∓ 1`                                      |
| `seekPageBack/Fwd` (thumb)                 | PageDown/PageUp                  | on `seek`: commit target `pos ∓ 15`                                     |
| `seekHome/seekEnd` (thumb)                 | Home/End                         | on `seek`: commit `0` / `dur`                                           |
| `seekBack/seekFwd` (surface)               | ArrowLeft/ArrowRight             | on `surface`: commit target `pos ∓ 5`                                   |
| `setVolume(v)`                             | volume slider / `volumechange`   | `vol=v`, `applied=effectiveVolume(v,muted)`                             |
| `toggleMute`                               | M / mute button / `volumechange` | `muted=!muted`, `applied=effectiveVolume(vol,!muted)`                   |
| `onRateChange(r)`                          | `ratechange`                     | `rate=r`                                                                |
| `toggleFullscreen`                         | F / fullscreen button            | `full=!full`                                                            |
| `focusSurface/focusSeek/focusControl/blur` | focus events                     | `focus=…`                                                               |
| `loadStart`                                | reload / retry                   | `stage=loading`, `known=false`, `dur=0`, `pos=0`, `seeking=false`       |

Phase-pattern example (the only place a guard would have been used):

```quint
action onEnded = all {
  stage' = if (stage == "playing") "ended" else stage,
  ended' = if (stage == "playing") true else ended,
  paused' = if (stage == "playing") true else paused,
  pos'   = if (and(stage == "playing", known)) dur else pos,
  seeking' = seeking, vol' = vol, applied' = applied, muted' = muted,
  rate' = rate, full' = full, focus' = focus,
  textMin' = textMin, textSec' = textSec,
  plays' = plays, pauses' = pauses, seeks' = seeks
}
```

`step = any { init, onLoadedMetadata, onCanPlay, onWaiting, onPlaying, onTimeUpdate,
onPause, onEnded, onError, play, pause, seekPreview, seekCommit, onSeeked,
seekStepBack, … , setVolume, toggleMute, onRateChange, toggleFullscreen,
focusSurface, focusSeek, focusControl, blur, loadStart }`

**Playback state graph (the non-no-op edges):**

```
loading --onLoadedMetadata|onCanPlay--> ready
ready|paused|buffering|ended --play--> playing          (from ended: pos←0)
playing --pause--> paused          playing --onWaiting--> buffering
buffering --onPlaying--> playing   playing --onEnded--> ended
any --onError--> error             error --loadStart--> loading
```

Derived ARIA/HTML readouts (defs, never stored): `ariaRole="slider"` (seek),
`ariaValueNow=pos`, `ariaValueMin=0`, `ariaValueMax=dur`,
`ariaValueText` = the primitive's `textMin:textSec` formatting,
`ariaPressed(muted|full)` on the toggle buttons.

---

## 3. Keyboard map — APG seek slider + reference player shortcuts

Two **scopes**, and they must not fight. The generator has no guards, but the
_primitive_ gates by `focus`; the spec records the scope in the event name.

### A. Seek thumb focused → APG Slider keys (authoritative for the seek control)

From the APG **Media Seek Slider** example, Keyboard Support table and the
example's `onSliderKeydown`
([slider-seek page](https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-seek/);
[JS source](https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/slider/examples/js/slider-seek.js)):

| Key                     | Effect               | Where it comes from                                |
| ----------------------- | -------------------- | -------------------------------------------------- |
| Right Arrow / Up Arrow  | `+1` second          | APG seek example table; `moveSliderTo(value + 1)`  |
| Left Arrow / Down Arrow | `−1` second          | APG seek example table; `moveSliderTo(value - 1)`  |
| Page Up                 | `+15` seconds        | APG seek example table; `moveSliderTo(value + 15)` |
| Page Down               | `−15` seconds        | APG seek example table; `moveSliderTo(value - 15)` |
| Home                    | minimum (`0:00`)     | APG seek example; `moveSliderTo(valueMin)`         |
| End                     | maximum (`duration`) | APG seek example; `moveSliderTo(valueMax)`         |

Notes:

- The APG Slider pattern makes **PageUp/PageDown optional** (a "large step");
  the seek example picks 15. `slider.qnt` already encodes Home/End and the
  `largeStep` idea (L60–61, L67–70).
- **Do not mirror the arrows in RTL for a media timeline.** `slider.qnt` applies
  the horizontal-RTL flip (L52, L58–59); a time axis does not mirror in RTL (the
  seek example never flips). The player seek should keep Left/Right = −/+ in both
  directions — a deliberate divergence from `slider.qnt`.
- `aria-valuetext` in the example is `"M minutes S seconds"` (words) updated on
  every move, and the **max is included on init and on blur only** (`constructor`
  sets it with `flag=true`; `onSliderBlur` sets it with `flag=true`;
  `moveSliderTo` sets it without the max). The APG page's Accessibility Features
  text says "initialized" and "loses keyboard focus"; its RPS table says
  "receives keyboard focus" — the **JS is authoritative** (init + blur).

### B. Player surface focused → reference-implementation shortcuts

From the mediabunny reference media-player example, `window` keydown handler
([`examples/media-player/media-player.ts` L642–665](https://raw.githubusercontent.com/Vanilagy/mediabunny/main/examples/media-player/media-player.ts)):

| Key               | Effect                                    | Source line                                       |
| ----------------- | ----------------------------------------- | ------------------------------------------------- |
| `Space` or `KeyK` | toggle play/pause (`togglePlay`)          | `e.code === 'Space' \|\| e.code === 'KeyK'`       |
| `KeyF`            | fullscreen (clicks the fullscreen button) | `e.code === 'KeyF'`                               |
| `KeyM`            | mute (clicks the volume button)           | `e.code === 'KeyM'`                               |
| `ArrowLeft`       | seek `−5 s`, clamped to `firstTimestamp`  | `Math.max(getPlaybackTime() - 5, firstTimestamp)` |
| `ArrowRight`      | seek `+5 s`, clamped to `endTimestamp`    | `Math.min(getPlaybackTime() + 5, endTimestamp)`   |

### C. Conflict resolution (the composition rule)

- While `focus == "seek"`: the **thumb owns the arrows** (±1 s) and Page/Home/End.
- While `focus == "control"` (a toolbar button): the **toolbar owns the arrows**
  (APG Toolbar roving focus along the horizontal axis — `toolbar.qnt` L64–68),
  so player shortcuts must not hijack them.
- While `focus == "surface"` (the video surface / container): the player
  shortcuts apply — Space/K, F, M, and **ArrowLeft/Right = ±5 s**.
- `Space`/`Enter` on a focused button is APG Button activation (play/pause/mute/
  fullscreen), not the global Space toggle.

This is the reason `focus` is modelled in `player.qnt` at all: to state the
scoping invariant (§4 #9) rather than re-implement toolbar roving focus.

---

## 4. Invariants (at least 4 checkable; the first four are the headline ones)

Following `disclosure.qnt`: store the exposed mirrors as vars so each invariant
has teeth against a hand-built bad state (the spec-only test does exactly this,
[`disclosure.test.ts` L52–67](../../packages/apg-specs/test/apg/disclosure.test.ts)).

```quint
def effectiveVolume(v: int, m: bool): int = if (m) 0 else v

// 1. aria-valuenow stays inside [aria-valuemin, aria-valuemax].
val SeekInRange: bool = and(pos >= 0, or(not(known), pos <= dur))
val AriaNowWithinBounds: bool = and(0 <= pos, or(not(known), pos <= dur))

// 2. playing ⇒ not paused and not ended (exposed mirrors must agree with stage).
val PlayingNotPaused: bool = or(stage != "playing", not(paused))
val PlayingNotEnded:  bool = or(stage != "playing", not(ended))
val EndedMirrorsStage: bool = ended == (stage == "ended")
val PausedMirrorsStage: bool =
  paused == or(or(stage == "loading", stage == "ready"),
               or(or(stage == "paused", stage == "ended"), stage == "error"))

// 3. the value text corresponds to the numeric value (m:ss components).
val ValueTextMirrors: bool = and(textMin == pos / 60, textSec == pos % 60)
val ValueTextWellFormed: bool = and(textMin >= 0, and(textSec >= 0, textSec < 60))

// 4. muted ⇒ effective volume 0; unmuted ⇒ the slider value is applied verbatim.
val MutedSilences: bool = and(
  applied == effectiveVolume(vol, muted),
  or(not(muted), applied == vol),
  or(muted, applied == 0)
)

// 5–9. supporting contracts.
val VolumeInRange: bool = and(vol >= 0, and(vol <= 100, and(applied >= 0, applied <= 100)))
val SeekingOnlyWhenKnown: bool = or(not(seeking), known)
val EndedAtDuration: bool = or(not(ended), or(not(known), pos == dur))
val RateAllowed: bool = or(rate == 50, or(rate == 100, or(rate == 150, rate == 200)))
val FocusKnown: bool = or(
  or(focus == "none", focus == "surface"),
  or(focus == "seek", focus == "control")
)
```

Invariants 1–4 map directly to the ticket's list; 5–9 bound volume, gate seeking
on metadata, pin `ended` to the timeline end, constrain the speed set, and keep
focus in the modelled vocabulary. Add a callback-monotonicity invariant if the
bridge counts callbacks (`and(plays >= 0, and(pauses >= 0, seeks >= 0))`).

---

## 5. Adapter interface the headless primitive needs injected (minimal)

`createPlayer` stays **Solid-signals + ARIA only, zero deps**
(`../README.md` L11–18, L36; the scope decision
`effects-of-atmosphere-zoj0`). Mediabunny lives in **apps/sky**, so the primitive
receives a `PlaybackAdapter` and never sees mediabunny types, a `<canvas>`, or
`AudioContext`. Sky constructs the adapter _with_ the canvas
(`createMediabunnyAdapter({ canvas })`) and passes it in.

```ts
/** The primitive's whole media dependency. Event names mirror HTMLMediaElement. */
export interface PlaybackAdapter {
  /** Open + decode; resolves once `duration` is known (loadedmetadata). */
  load(src: string): Promise<void>;

  play(): Promise<void>; // may reject (autoplay policy) → surface as 'error'
  pause(): void;
  seek(seconds: number): Promise<void>;
  setVolume(gain: number): void; // 0..1, already muted-resolved by the primitive
  setPlaybackRate(rate: number): void;
  dispose(): void;

  // --- read accessors (primitive renders from these) ---
  readonly currentTime: number; // seconds
  readonly duration: number; // seconds; NaN/Infinity → treat as "unknown"
  readonly paused: boolean;
  readonly ended: boolean;
  readonly seeking: boolean;
  readonly buffered: number; // seconds buffered ahead (drives 'buffering')

  /**
   * One subscription, events named like HTMLMediaElement:
   * 'loadedmetadata' | 'canplay' | 'playing' | 'pause' | 'waiting' | 'seeking'
   * | 'seeked' | 'timeupdate' | 'ended' | 'ratechange' | 'volumechange' | 'error'.
   * Returns an unsubscribe.
   */
  subscribe(listener: (event: PlayerAdapterEvent) => void): () => void;
}

export type PlayerAdapterEvent =
  | { type: "loadedmetadata"; duration: number }
  | {
      type: "canplay" | "playing" | "pause" | "waiting" | "seeking" | "seeked" | "ended";
    }
  | { type: "timeupdate"; currentTime: number }
  | { type: "ratechange"; rate: number }
  | { type: "volumechange" }
  | { type: "error"; cause: Error };
```

Kept out of the adapter on purpose (YAGNI / wrong layer):

- **Fullscreen** — the Fullscreen API on the container element; the primitive
  owns `full` and calls `requestFullscreen()`/`exitFullscreen()`, not the adapter.
- **Speed menu, mute button, seek slider, toolbar** — primitive ARIA + the
  composed APG specs; the adapter only receives `setPlaybackRate` / `setVolume`.
- **One player at a time** — a consumer (sky) registry concern, not a primitive
  dependency.
- **Native `<video controls>`** — mutually exclusive with an APG-conformant seek
  (scope decision); no fallback inside the adapter.

Mapping to mediabunny is already worked out in
effects-of-atmosphere `docs/research/mediabunny-hls-player.md` §5: `duration` from
`getDurationFromMetadata ?? computeDuration`; `currentTime` from the
`AudioContext` clock; `ended` from `currentTime >= duration`; `volume`/`muted`
from a `GainNode`; `buffering`/`error` derived from the sink iterators.

---

## Open decisions left for the spec ticket

- **Drag cadence.** Does `seekCommit` fire only on pointerup, or is it throttled
  during drag? The spec models preview-then-commit; the sky adapter picks the
  cadence.
- **Keyboard seek on the surface during `buffering`/`ended`.** Allowed to seek
  out of `ended` (resume from a new point) — recommend yes.
- **Volume-change unmutes?** The APG/reference behaviour does not decide it; the
  invariant `MutedSilences` holds either way, so leave it to the primitive.
- **`live`.** Carry `live: bool` now, model the live edge (End = live edge, no
  `duration`) only when live PDS video lands.

## Sources

- APG **Media Seek Slider** example —
  <https://www.w3.org/WAI/ARIA/apg/patterns/slider/examples/slider-seek/>
  (Keyboard Support table) and its source
  <https://raw.githubusercontent.com/w3c/aria-practices/main/content/patterns/slider/examples/js/slider-seek.js>
  (fetched 2026-10-04).
- APG **Slider** pattern — <https://www.w3.org/WAI/ARIA/apg/patterns/slider/>
  (quoted in `packages/apg-specs/specs/apg/slider.qnt` L1–33; page fetch failed, the
  seek example above is the operative key map).
- APG **Toolbar** / **Button** / **Menu Button** patterns — cited in
  `packages/apg-specs/specs/apg/{toolbar,button,menu-button}.qnt` headers.
- WHATWG HTML **HTMLMediaElement** —
  <https://html.spec.whatwg.org/multipage/media.html#htmlmediaelement>. The
  canonical page drops the connection mid-stream from this network (curl exits
  28/56 at ~89 KB); the IDL was read from the locally generated typings
  `node_modules/@typescript/native-preview-darwin-arm64/lib/lib.dom.d.ts`
  (`interface HTMLMediaElement`), which are produced from that IDL.
- MDN **HTMLMediaElement** properties + event table —
  <https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement> (cites the
  WHATWG spec above; fetched 2026-10-04).
- Reference player shortcuts — mediabunny `examples/media-player/media-player.ts`
  L642–665, <https://raw.githubusercontent.com/Vanilagy/mediabunny/main/examples/media-player/media-player.ts>
  (fetched 2026-10-04).
- Generator import closure —
  `packages/quint-machine/src/codegen.ts` L417–603 (`loadSpecClosure`,
  pure-def-only rejection).
- Local: `packages/apg-specs/specs/apg/slider.qnt`, `…/toolbar.qnt`, `…/button.qnt`,
  `…/menu-button.qnt`, `…/disclosure.qnt`, `…/video/playback-readiness.qnt`,
  `…/transcode-job.qnt`; `packages/specs/README.md`;
  `../README.md`, `packages/headless/src/disclosure.ts`;
  `packages/apg-specs/test/apg/disclosure.test.ts`;
  `packages/apg-specs/scenarios/apg/slider.base-ui.json`;
  effects-of-atmosphere `docs/research/mediabunny-hls-player.md`; maps/tickets
  `effects-of-atmosphere-zo29`, `…-zoj0`, `…-v2uy`.
