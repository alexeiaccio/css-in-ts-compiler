---
# cssints-zrt2
title: 'reactive(): state, events and DOM output in styles (CSS-first interactions)'
status: in-progress
type: feature
created_at: 2026-10-31T07:33:01Z
updated_at: 2026-10-31T07:33:01Z
---

A CSS-first interaction runtime as a new package: state and events declared in styles, conditions and DOM output in plain CSS, a ~2 kB script wires it. The model comes from [Reactive CSS](https://reactivecss.com/) (state as custom properties, events as selectors, conditions in CSS) and its strictness from Solid 2.0's [RULES-FUNDAMENTALS](https://github.com/solidjs/solid/blob/next/packages/signals/docs/RULES-FUNDAMENTALS.md) and [ReactiveScript](https://github.com/ryansolid/reactivescript): sources are the only writable things, writes happen only in imperative scope (an event), state belongs to an owner element, and one flush paints one whole frame.

What does not port: Reactive CSS's `:on(click)` is not valid CSS (its runtime parses the stylesheet); we ship compiled class strings, so the event program has to travel as data on the element, in non-inheriting custom properties registered with `@property`, read by a delegated listener.

API (v1):
```ts
const ui = state({ open: false, tab: "one" });        // { owner: Style, open: Source<boolean>, tab: Source<string> }
const card = cn(ui.owner, p(4));                       // the owner: --reactive-open, group marker
const button = cn(on({ click: toggle(ui.open) }),      // write, only in an event
                  bind({ "aria-expanded": ui.open })); // DOM output
const panel = inside(ui.open)(display("block"));       // a descendant's condition
const tabPanel = inside(ui.tab, "two")(display("block"));
```

Rules taken from the references, and how they are enforced here:
- **sources vs equations** (ReactiveScript E-1): only `state()` is a source; a derivation is CSS itself (`calc(var(--reactive-count) * 2)`, a condition) — there is no JS derivation to write to, so the mistake is unrepresentable.
- **writes only in imperative scope** (W-1/W-2): actions (`toggle`, `set`) are opaque descriptors; only `on()` accepts them, so a module-level write cannot be written (a type error).
- **ownership** (O-*): state belongs to the element that declares it; an event writes the nearest owner (`closest`), like Solid's owner tree; event listeners are delegated, so nothing is retained or needs disposal.
- **one whole frame** (F-1/F-10): one event = one pass: every action of the event, then every binding of the owner's subtree; CSS paints once, no intermediate state is visible. Documented as the runtime's contract.
- **no async in v1**: no fetching, so no loading/error boundaries; the Solid async fundamentals are the reference for a later version.
- **static strictness**: tokens are branded (`Source<T>`, `Action`), event names and bind attributes are checked by type and at build time, state names are idents checked at build time; one `state()` call per owner (and one program per event) is a documented rule — the object form makes the accidental merge visible.

Protocol (what the runtime reads, all non-inheriting via @property):
- owner: `--reactive-owner: open,tab`; each state `--reactive-<name>: <value>` (these inherit, so CSS can read them); group marker `_g-reactive`.
- events: `--reactive-on: click toggle open,input set tab two`, marker `._reactive-events`.
- output: `--reactive-binding: aria-expanded open,data-current tab`, marker `._reactive-binding`.
- the runtime writes `data-reactive-<name>="<value>"` on the owner (the condition source) and the bound attributes; `when(source)` is `attr(data-reactive-<name>, value)`, `inside(source)` is `within(attr(...), "reactive")`.
- delegated listeners for a fixed event set: click, input, change, submit, keydown, keyup, pointerdown, pointerup, focusin, focusout.

## Todo
- [ ] Engine: a runtime with a script (or css) and no polyfills is delivered for every target (delivery.ts `needed`), with a test in packages/cssints and the docs
- [ ] Package `@cssints/reactive` (scope `reactive`): kernels for the markers and @property rules, call members state/on/bind, the public functions, the runtime `./runtime`
- [ ] Types: Source/Action brands, EventName union, state names checked at build time, `when`/`inside`/`bind`, type tests for every refusal
- [ ] Fixtures + browser test: two independent disclosures, aria-expanded, initial true state, tabs (string state), nested owner, the flush after one click
- [ ] Docs: README (model, API, protocol, limits, browsers), API.md row, wayfinder entry with the references, changesets, the 28th package in the fixed group and the counts in AGENTS.md/RELEASING.md
- [ ] Verified: package test + browsers in Chrome, cssints suite, typecheck, lint/fmt, build:packages, release:check
