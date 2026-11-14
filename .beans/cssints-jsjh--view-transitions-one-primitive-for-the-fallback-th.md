---
# cssints-jsjh
title: 'View Transitions: one primitive for the fallback, the two style objects and the skip'
status: completed
type: feature
priority: normal
created_at: 2026-11-14T10:02:53Z
updated_at: 2026-11-14T10:29:26Z
---

**Why a primitive at all.** The API is Baseline 2025, so the primitive is not a polyfill; it is the three things every host gets wrong when it calls `document.startViewTransition` by hand.

**The platform, checked (MDN, Oct 2025):**
- `document.startViewTransition(update)` → `ViewTransition` with `ready` / `updateCallbackDone` / `finished` / `skipTransition()`; `document.activeViewTransition` is the live one. Cross-document is `pageswap`/`pagereveal` + `@view-transition { navigation: auto }` (CSS only).
- **The footgun**: `view-transition-name` must be unique among rendered elements. *'If two rendered elements have the same view-transition-name at the same time, the ViewTransition.ready Promise will reject and the transition will be skipped'* — the **whole** transition, silently, not the pair. This is what a per-item name (30 thumbs, 30 names) buys you.
- **`view-transition-name: match-element`** lets the browser assign a unique name itself, for the case where the *same* element persists across the update. That is the default case and it needs no bookkeeping at all.
- `view-transition-class` gives CSS a stable hook (`::view-transition-group(*.card)`) without a name per element; `ViewTransition.types` / `:active-view-transition-type()` exist but have no broad support — leave them out.

**Shape** (`createViewTransition`, no APG pattern → the browser test is the oracle, like `createPanZoom` / `createKnob` / `createToast`):
- `run(update)` → `Promise<void>`: unsupported or reduced motion → `await update()` and no transition; else `startViewTransition(update)` and await `finished`, swallowing the skip/abort rejection (a skipped transition is not a failure). Latest wins — no queue, that is the platform's own policy.
- `persist({ class? })` → `{ style }` with `view-transition-name: match-element` (+ class): the common 'this element moves' case, no names.
- `name(id, { class? })` → `{ style }` with a deterministic prefixed name for the **morph pair** (A leaves, B arrives): the host still owns 'only one of them rendered at a time', because that is a DOM fact we never touch.
- `state()` → `{ supported, active }`; `supported()` reads live and is SSR-safe.
- Motion comes from `prefs.ts`, which makes this the first primitive with a motion seam — consistent with the README's stance that only timing/motion/live-region/camera primitives take prefs.

**Not in scope**: easing, durations and the pseudo-element CSS (the host's, as everywhere); cross-document transitions (CSS-only, document in the README); a lightbox or a morph composition (`createMorph` would be two lines around `run` + `name`; add it when a host asks).

**Tests** (`test/view-transition.browser.test.tsx`, real Chromium): no API → update runs and resolves; reduced motion → update runs, no transition; a duplicate-name rejection (forced `ready` reject) → `run` still resolves and the update is applied; a second `run` mid-flight → latest wins, no unhandled rejection; the two style objects carry exactly the documented property names; `name` is stable and `v-a`/`v-a-b` do not collide.

**Docs**: a README section (the platform's rules, the footgun, the two cases) — the docs live here, not in effects-of-atmosphere, which only consumes the package.

## Summary of Changes

PR **#184** (`spec/view-transition`), branch not merged.

**Spec** — `packages/apg-specs/specs/patterns/view-transition.qnt` (module `patterns_view_transition`), generated model + scaffolding committed. Surface: `mode` (animate/inert), `phase` (idle/active), `active`/`latest` tokens, counters `requests`, `updates`, `inert`, `starts`, `finished`, `skips`, `pending`; actions `init`, `request`, `settle`, `abort`, `inertOn`, `inertOff`.

Invariants: `OneUpdatePerRequest` (the update runs exactly once whatever happens to the transition), `InertRequestsStartNothing`, `AnimatedStartsBalance` (`starts == finished + skips + running`), `ActiveIsTheLatest`, `InertNeverActive`, `PendingOnlyWhileActive`.

Two decisions worth knowing: `abort` increments `skips` (otherwise a started transition that never finished breaks the balance), and idle `settle`/`abort` are conditional no-ops rather than guards, because the generator only emits `actionAll` of assignments. The walk therefore fixes `motion` per run and never flips it mid-flight; scenarios may flip it only while idle.

**Primitive** — `packages/headless/src/view-transition.ts`: `supported()`, `run(update)`, `persist({class?})` (`view-transition-name: match-element`, the default case), `name(id, {class?})` (`vt-<id>`, the morph pair), `state()`. The API is looked up on every call, so tests can stub it and SSR is safe. README section "View transitions" + the `motion` entry under Preferences.

**Tests** — fixture, driver, 5 scenarios on real DOM, a differential walk against the model (6 × 20 seeded steps, two prefs variants), and the real paths: no API, reduced motion, rejected `ready`. Spec-only test in `apg-specs/test/patterns/view-transition.test.ts` (invariants, hand-built bad states with teeth, bounded explore, scenarios through `specDriver`).

**Checks** — apg-specs: 49 specs generated and typechecked clean, 52 files / 1015 tests pass. headless: 71 files / 1397 passed, 0 diagnostics. `bun run lint` fails only in `packages/tui/test/{render,system}.ts`, untouched by this branch and pre-existing on master; `fmt:check` lists 38 files already unformatted on master, every `view-transition` file clean.

**Left out** — `docs/API.md` entry (separate pass), a Chromium duplicate-name test (the primitive cannot distinguish that skip from any other, so the stub covers the rejection path), and a `skipTransition()` convenience (latest wins is the platform's policy).
