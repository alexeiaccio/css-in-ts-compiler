---
# cssints-6fau
title: The menu differential walk diverges when the machine is loaded
status: completed
type: bug
priority: high
created_at: 2026-11-15T15:59:21Z
updated_at: 2026-11-15T21:30:00Z
---

`test/menu.browser.test.tsx > createMenu (checkable) x menu-checkable.qnt (differential walk)` failed **4 of 11** configurations in a full-suite run, and passed **77/77** when the same file ran alone — twice, with and without an unrelated change stashed. Configurations: `variant: mixed` with `controlled: true`, `accepts` true and false, `value` 3 and 7.

Evidence: full run — `Tests 4 failed | 1423 passed`; single file — `77 passed | 44 skipped (19.9s)`; the same file on a stashed tree — `77 passed`. So it is **load- or timing-sensitive**, not a seed and not a change.

This matters more than a normal flake because the walk *is* the oracle for the primitive: a real divergence looks exactly like this. It also blocks the 'run the headless suite in CI' fix (see the CI bean) — a 2-minute gate that fails one run in three trains people to ignore it.

**Direction**: the walk drives the DOM and the model with the same steps and compares after each; under load the DOM settle wins or loses a race (the file's own `tick`/settle helpers). Make the observation deterministic — await the settled state per step rather than a fixed turn — the same fix `6uih` was filed for on the canvas walks.

## Hunt: two sources, both focus events the primitive adopts

Instrumented the checkable fixture's `suppressFocusWrite` callback (it runs on every `focus` event the primitive
adopts) across 4 800 walk steps: it was called **795 times, and all 795 were stale** — the focused item was not the
primitive's item (`item=4 primitive=2/0`, then `item=0 primitive=2/4`: the fixture's writes and their events chase each
other through the primitive).

Mechanism, two sentences: the fixture mirrored `focusLevel`/`focusIndex` into DOM focus from a `createEffect`, and the
primitive's item props take `onFocus` as the platform's word on where focus is (`setFocusItem(i)`), so that mirror fed
straight back into the primitive; when the browser delivers that focus event a task or more late (a page that is not the
focused one), the primitive has already moved on and the event rewinds it to an item from one or two steps ago. That is
the divergence the walk reports, and it is real state, which is why every "wait longer / retry / read the DOM instead"
attempt failed.

Removing the fixture's mirror is necessary but **not sufficient**: the checkable walk still fails in a full parallel run
(1 of 5 runs here), because the focusgroup polyfill moves focus with `focus()` for `ArrowUp`/`ArrowDown`/`Home`/`End` and
the primitive follows *only* through `onFocus`. Forcing `suppressFocusWrite: () => true` makes the walk fail
deterministically on the first arrow (measured: all four configurations, at the same step), which proves the dependency.

Why the five reverted approaches cannot work:

- **longer settles / two frames / DOM quiescence** — a programmatic focus event has no deadline: a frame or a
  `MutationObserver` barrier waits on the DOM, and the event is not a DOM mutation. A frame is worse: it lets the
  browser's focus fixup run first.
- **`flush()`** — that is Solid's queue, not the browser's event queue.
- **whole-walk retry** — the rewind is deterministic within a run (same seed, same schedule), so the retry rewinds again.
- **blur-on-mount** — adds focus events (each one a deferred write) instead of removing them.
- **suppression keyed on time / `event.currentTarget` / `document.activeElement`** — all are proxies for "this event is
  mine"; the event arrives after the witness is gone. In Solid 2 `onFocus` is a direct listener, so `currentTarget` is
  the item — that variant could work only if the flag outlived the dispatch, which is the same timing bet that failed.
- **driver mirrors focus after every step** (tried here: `domDriver` focusing `Mounted.focus()` after each step) — fewer
  writes, but each is still a deferred event, and the polyfill redirects focus to its own stop when a step focuses a row,
  which moved the primitive a step on its own (the checkable walk then failed at step 1 under load).

## Fix

Three inputs had to stop being able to move the primitive, one at a time (each measured):

1. **The fixture's mirror.** `mountCheckableMenu` / `mountMenuButton` no longer move DOM focus on the path a walk runs
   (`provider: "polyfill"`); the sync stays for `provider: "auto"`, where the native engine owns focus and no walk runs.
2. **The provider's moves, and the tab stop.** `createMenu` now owns the block axis on the polyfill: `ArrowUp`/
   `ArrowDown`/`Home`/`End` change `focusIndex` in its own key handler by the rule the spec models (wrap, ends) and
   `preventDefault`, which the polyfill honours by bailing out of its own move (`#handleKeydown` returns on
   `defaultPrevented`); the tab stop is placed from the state (`tabindex` plus `focusgroupstart`) after every settle.
   `onFocus` is unchanged — the platform's word for focus arriving from outside (Tab, a click). The native path is
   untouched.
3. **The pointer.** With the first two gone, the walks still failed now and then, and the state trace showed why:
   `onMouseEnter` fired on a row the step had just revealed, because the page's pointer happened to be there, and hover
   moves focus. A real hover and a boundary hover are indistinguishable from the event (`movementX/Y` is 0 for both), so
   the fix is on the input side: the driver stops `mouseover`/`mouseenter`/`pointerover`/`pointerenter` at the widget
   unless the step *is* a pointer step, and `test/setup.browser.ts` parks the pointer on a fixed 1 px corner element
   between tests. The same stray hover was the `toast` failures (a countdown paused by a `mouseenter` it never got a
   `mouseleave` for), which is why that file went green in the same change.

## Measured

| run | result |
| --- | --- |
| 1 | **1427 passed** (131 s) |
| 2 | **1427 passed** (130 s) |
| 3 | **1427 passed** (130 s) |
| 4 | **1427 passed** (131 s) |
| 5 | **1427 passed** (130 s) |

(The 17 s over the old 113 s is the pointer parking: one hover per test, ~2661 tests.)

Five consecutive green runs, default parallelism, no retries, nothing skipped. Under artificial load (two `bun run test`
at once): **both green**, 1427 passed each.

## Why the earlier approaches could not work (kept for the next person)

`longer settles / two frames / DOM quiescence` wait on the DOM, and a focus event is not a DOM mutation; `flush()` drains
Solid, not the browser; a whole-walk retry repeats a rewind that is deterministic within a run; blur-on-mount adds focus
events; time-/`currentTarget`-/`activeElement`-keyed suppression are proxies for "this event is mine" and the event
arrives after the witness is gone; a driver that mirrors focus after every step still writes a programmatic focus, and the
polyfill redirects focus to its own stop. Nothing on the *observation* side could fix it: the input side had to stop
lying about where the user is.
