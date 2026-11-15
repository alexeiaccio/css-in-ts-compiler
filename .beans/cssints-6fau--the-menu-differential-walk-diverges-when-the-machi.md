---
# cssints-6fau
title: The menu differential walk diverges when the machine is loaded
status: in-progress
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

## Fix (shipped, partial)

`test/menu.fixture.tsx`: the checkable menu no longer mirrors its state into DOM focus on the path a walk runs
(`provider: "polyfill"`); the mirror stays for `provider: "auto"`, where the native engine owns focus and no walk runs.
`test/dom-driver.ts`: a `key`/`type` step whose target is the widget's owner presses on the part the primitive reports
(`keyTarget`), so the engine still exercises the platform's key handling with nothing focused by the fixture.
`README.md` has the contract ("Walking the DOM") and the open part.

Effect: the fixture's stale writes are gone (0 adopted events from the fixture over 4 800 steps) and the checkable menu
walk is much steadier, but **not deterministic**: see the table below. The remaining source is the provider's own
programmatic focus.

## Next (the durable fix, primitive-side)

1. On the polyfill path, let the primitive own the block-axis movement (`ArrowUp`/`ArrowDown`/`Home`/`End`), as it
   already owns activation, typeahead, Escape and Tab. Then no focus event is an input to the state, `suppressFocusWrite`
   can stand for a walking host, and the walk is deterministic by construction.
2. Place the provider's tab stop from state (`focusgroupstart`, which both providers read) instead of from focus, so a
   probe of `tabindex` no longer needs the fixture to move focus (this also lets `menu-button.fixture.tsx` drop its
   mirror). Tried here: the attribute propagates, the polyfill's re-decoration is not synchronous with a walk step.
3. Then the CI gate (see `cssints-ovvz`) can land.

## Measured: five full parallel runs of `packages/headless` (`bun run test`, default parallelism)

| run | result | failing files |
| --- | --- | --- |
| 1 | **1427 passed, green** (111 s) | — |
| 2 | 4 failed / 1423 passed (111 s) | `menu` (checkable) walk, 4 configs |
| 3 | 6 failed / 1421 passed (125 s) | `menu-button` walk (4), `toast` (2) |
| 4 | 4 failed / 1423 passed (111 s) | `menu` (checkable) walk, 4 configs |
| 5 | 5 failed / 1422 passed (115 s) | `menu-button` walk (4), `toast` (1) |

Under artificial load (two `bun run test` in the same package, at once): **both fully green** (1427 passed each).

So the acceptance ("five consecutive green, one of them loaded") is **not met**, and the verdict is noisy in both
directions: the failure is a background page's focus/timer delivery, which load does not reliably change. The checkable
file alone is green repeatedly (77 passed).

The `toast` failures are the same class and are *not* walk failures: `waitFor` (a `setTimeout(20)` loop) runs, while a
`setTimeout(200)` in the same page does not fire within 10 s (`toast.browser.test.tsx`). That file is green alone 4/4 under
load and green in most full runs; it is a separate, pre-existing residual (present on master before this change).
