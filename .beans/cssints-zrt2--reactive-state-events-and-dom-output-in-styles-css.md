---
# cssints-zrt2
title: 'reactive(): state, events and DOM output in styles (CSS-first interactions)'
status: completed
type: feature
created_at: 2026-10-31T07:33:01Z
updated_at: 2026-10-31T11:10:00Z
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
- [x] Engine: a runtime with a script (or css) and no polyfills is delivered for every target (delivery.ts `needed`), with a test in packages/cssints and the docs
- [x] Package `@cssints/reactive` (scope `reactive`): kernels for the markers and @property rules, call members state/on/bind, the public functions, the runtime `./runtime`
- [x] Types: Source/Action brands, EventName union, state names checked at build time, `when`/`inside`/`bind`, type tests for every refusal
- [x] Fixtures + browser test: two independent disclosures, aria-expanded, initial true state, tabs (string state), nested owner, the flush after one click
- [x] Docs: README (model, API, protocol, limits, browsers), API.md row, wayfinder entry with the references, changesets, the 28th package in the fixed group and the counts in AGENTS.md/RELEASING.md
- [x] Verified: package test + browsers in Chrome, cssints suite, typecheck, lint/fmt, build:packages, release:check

## Summary of Changes

The package `packages/reactive` (`@cssints/reactive`, 0.20.0, the 28th of the `fixed` group): `src/index.ts` is the scope
`reactive` with the private kernels `#owner`, `#events` and `#binding` (an empty `&{}` each plus its
`@property { syntax: "*"; inherits: false }`), the runtime `#run` (`polyfills: []`, `script: "@cssints/reactive/runtime"`)
and the call members `state` (`group: true`), `on` and `bind`, with hand-written types in front: `Source<T>` and `Action`
branded, `EventName` a union, `State<S>`/`Sources<S>`, `Program`/`Bindings`, and `state`/`toggle`/`set`/`on`/`bind`/`when`/
`inside`. `src/runtime.ts` is 1.75 kB minified (0.87 kB gzipped): delegated listeners for the ten events, owners and
bindings read off `getComputedStyle` and gated by the marker classes, initialisation on load and for added nodes
(`MutationObserver`), one flush per owner touched, and no imports.

The emitted protocol is as designed: `--reactive-owner: open,tab` and one inheriting `--reactive-<name>` per state on
`._reactive-owner` (with the group marker `_g-reactive`), `--reactive-on: click toggle open,input set tab two` on
`._reactive-events`, `--reactive-binding: aria-expanded open,data-current tab` on `._reactive-binding`; the three lists
registered `@property { syntax: "*"; inherits: false }` at the top of the sheet. `when()` is
`attr("data-reactive-<name>", value ?? "true")`, `inside()` is `within(attr(...), "reactive")`. The runtime writes
`data-reactive-<name>` on the owner (what the conditions read) and the same value inline as the custom property (what CSS
derivations read).

**Engine gaps (two).** (1) `delivery.ts` `needed()` returned false for a runtime with no polyfills, so a plugin whose script
*is* the feature shipped nothing when every target had every CSS feature. A runtime with `script` (or `css`) and no
`polyfills` is now needed for every target; `docs/API.md` says so, `RuntimeDef`'s comment does too, and
`packages/cssints/test/plugins.mjs` proves both sides (a new `#d`/`all` entry in the `ps` scope, `needed()` over four target
sets, and the module text). (2) A site could not return an object, and `state()` must return its owner style and its
sources: a plain object was a `SiteMissingError` in a client module (the engine writes only class strings). `ship(entries)`
(`cssints/plugin`, macro.ts `shippedOf`) marks the site's value as an object literal — each `Style` as its class string,
arrays and objects recursively, the rest as JSON — and at build time the object *is* the entries, so `ui.owner` is the
style and `ui.open` the source. Tested by `plug-ship.ts`/`plug-ship-use.ts` in `plugins.mjs`.

**Tests.** `node test/reactive.mjs` (fixtures through the engine: class strings, the protocol declarations, the kernels,
the `@property` rules, the runtime module, the four build errors with their call sites, and an all-supported and a
Firefox-only target set); `bun run test:browsers` (Chrome 156, Firefox 157, WebKit 27.2: two independent disclosures, an
initial true state, tabs on a string state, a nested owner, one flush after a click, no console errors);
`test/types/reactive.ts` (the brands, `set`/`toggle`, `set(open, "yes")`, an unknown event, a checker source, an action as
a style).

**Docs and release.** The README (model, API, the printed CSS, protocol, limits, browsers, tests), the `docs/API.md` row and
the runtime/`ship()` bullets, the `docs/wayfinder.md` entry with the three references, changesets for `cssints` and
`@cssints/reactive` (both minor), `@cssints/reactive` in `.changeset/config.json` `fixed`, and the counts 27 → 28 in
AGENTS.md and RELEASING.md plus the first-publish-by-hand paragraph. `bun run build:packages` is 28/28 and
`bun run release:check` stages 28 and passes.
