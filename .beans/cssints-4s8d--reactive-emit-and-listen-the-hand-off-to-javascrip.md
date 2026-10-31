---
# cssints-4s8d
title: 'reactive: emit() and listen(), the hand-off to JavaScript'
status: completed
type: feature
priority: normal
created_at: 2026-10-31T11:55:20Z
updated_at: 2026-10-31T12:07:16Z
---

The plugin's thesis is that a state is CSS and JavaScript never reads it. That holds until a form must actually submit: the write is expressible (`on({ submit: ... })`) but there is no way to tell the app. This round adds one hand-off, and only one: an event leaves the CSS world through the DOM, already carrying the nearest owner.

## API

```ts
on({ submit: emit("save") })                                   // in a style, like any action
listen(form, "save", ({ detail }) => save(detail.owner));       // in the app, from @cssints/reactive/runtime
```

- `emit(name)` returns a branded `Emit`, accepted only by `on()` (like `Action`): `set()`, `toggle()`, `bind()`, `when()`, `inside()` and `state()` refuse it at the type level. `name` is an ident (`/^[a-z][a-z0-9-]*$/`), checked at build time with the call site.
- `listen(target, name, handler)` lives in `src/runtime.ts` (the module the engine ships; the build-time module imports `cssints/plugin` and cannot be imported by client code; the package's `exports` maps `./runtime`). It adds a listener for `reactive:<name>` on `target` and returns a disposer. Its JSDoc says the name is the same string `emit()` was given.
- The event: a bubbling `CustomEvent("reactive:" + name, { bubbles: true, detail: { event, owner } })` dispatched **from the element the native event fired on** (its target), so a `listen()` on any ancestor - a form, the page - catches it. `detail.event` is the native event; `detail.owner` is the nearest reactive owner of that element (or `null`). Bubbling matters: a program may sit on an ancestor (a panel with a click program), and the listener is still the form.
- A program segment is `submit emit save` in `--reactive-on` (event, action, name), beside `click toggle open` and `change set tab @value`. The runtime's dedupe of repeated segments applies as for the others.
- Nothing is stored, nothing is written: `emit()` changes no state, and the event is not in the listened-event set (so a `reactive:` event cannot trigger a program, and there is no recursion).

## Tests

- `test/reactive.mjs`: the `submit emit save` segment in the protocol and the class string; the build errors (a bad name, `emit()` outside `on()`).
- `test/types/reactive.ts`: `Emit` accepted by `on()` only; `listen` typed from the runtime module.
- `test/browsers.mjs`: a form with `on({ submit: emit("save") })`; `listen` on the form sees the event once per submit, with `detail.owner` the owner element and `detail.event` the native submit; a listener on `document` also sees it (bubbles); the disposer stops it; a program on an ancestor still emits from the target; no console errors.
- The Quint model (`packages/apg-specs`): `emit()` is NOT modelled. It changes no state, so the model's invariants (Nearest, Setup, Isolated, Deep, ComparisonReadsNearest, Atomic) cannot see it; the browser test is the check. The spec's NOT MODELLED list gains a line saying so.

## Docs and release

- README: `emit()`/`listen()` in the API block, one sentence in Limits ("`emit()` is the only way out to JavaScript; a state is still never read from JS"), the protocol table, and a short example (a form submit that calls an app function). Say clearly where `listen` is imported from.
- `docs/API.md`: extend the `@cssints/reactive` row. `docs/wayfinder.md`: a dated entry (the one hand-off, the `CustomEvent` shape and why it bubbles, what stays out: no return value, no acknowledgement, no state written from JS), with the bean id.
- Changeset: `@cssints/reactive` minor, one line.

## Todo

- [x] `emit()` and the `Emit` brand in `src/index.ts`; the `emit` segment in `on()`
- [x] `listen()` and the event detail type in `src/runtime.ts`
- [x] `test/reactive.mjs`: the protocol segment, the class string, the two build errors
- [x] `test/types/reactive.ts`: `Emit` only in `on()`; `listen` typed
- [x] `test/browsers.mjs` + fixtures: submit, owner, bubbling, disposer, ancestor program
- [x] README, `docs/API.md`, `docs/wayfinder.md`, changeset
- [x] Run the gates: reactive tests, typecheck, build:packages, docs.mjs, lint, fmt, release:check

## Engine gaps

- A plugin value in a style's place (`export const hand = emit("save")`) is reported as `SiteMissingError: cssints: site N
  in <file> was not evaluated`, not as a mismatch: `replacementOf` (macro.ts) reads any plain object at a site as a
  definition with nothing to ship (`isPluginValue`), and the site is then never recorded. Repro: the fixture
  `test/fixtures/bad-emit-style.ts`; `test/reactive.mjs` pins the message. Workaround: the type refuses `Emit` outside
  `on()`, and the build still fails at the site with the line, so nothing ships.

## Summary of Changes

- `packages/reactive/src/index.ts`: `emit(name)` and the `Emit` brand (`ONLY on()` takes it; the name is an ident, a build
  error at the call site). `on()` accepts an `Emit` beside an `Action`, writes `submit emit save` into `--reactive-on`, and
  a hand-off lights up no state.
- `packages/reactive/src/runtime.ts`: a segment whose action is `emit` dispatches a bubbling
  `CustomEvent("reactive:" + name, { bubbles: true, detail: { event, owner } })` from the native event's target, with that
  target's nearest owner; it touches no state and is not flushed. `listen(target, name, handler)` returns a disposer; the
  runtime listens to the same ten events, so a `reactive:` event cannot trigger a program. Runtime 2.73 kB -> 2.99 kB
  minified (1.26 -> 1.38 kB gzipped).
- Tests: `test/reactive.mjs` (the segment and the class string, a hand-off plus a write in one program, a bad name, an
  `Emit` in a style's place), `test/types/reactive.ts` (`Emit` accepted by `on()` only, `listen` typed from the runtime
  module), `test/browsers.mjs` (a form submitting under a program written twice: one dispatch, heard on the form and on
  `document` with `detail.owner` the form and `detail.event` a `SubmitEvent`; the disposer; an ancestor's click program
  emitting from the button). Chrome 156, Firefox 157, WebKit 27.2 pass, and `test/scenarios.mjs` is unchanged.
- The Quint model is not extended: a hand-off changes no state, so every invariant would pass either way; the spec's NOT
  MODELLED list says so and the browser test is the check (comment only, the generated model is unchanged).
- Docs: the reactive README (API table, the hand-off example, the protocol table and paragraph, the Limits sentence, the
  runtime size), the `docs/API.md` row, a wayfinder entry, changeset `@cssints/reactive` minor.
- Verified: `node test/reactive.mjs`, `node test/browsers.mjs` (Chrome 156, Firefox 157, WebKit 27.2),
  `node test/scenarios.mjs`, `bun run typecheck`, `bun run build:packages`, `node packages/cssints/test/docs.mjs`,
  `bunx vp lint` and `bunx vp fmt --check` on every touched file, `bun run release:check`.
