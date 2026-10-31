---
# cssints-3ydy
title: 'reactive: a state that survives a reload'
status: completed
type: feature
priority: normal
created_at: 2026-10-31T10:04:43Z
updated_at: 2026-10-31T10:09:52Z
---

Round three of @cssints/reactive: persist(value, key) keeps a state in localStorage, restored at initialisation before the first paint the page can show, with a --reactive-persist protocol property and a new kernel.

Round three of `@cssints/reactive` (after cssints-zrt2 and cssints-674d): a state that survives a reload, restored before
the first paint the page can show.

```ts
const ui = state({ open: persist(false, "demo-open"), tab: persist("one", "demo-tab") });
```

**The constructor.** `persist(value, key)` returns a branded `Persisted<T>`, accepted only as a value of `state()`. It is
refused by `set()`, `toggle()`, `bind()`, `when()`, `on()` and where a `Style` goes; `persist()` without a value is a type
error and a build error. The key is a build-time check at the call site (letters, digits, `-`, `_`, `.`, `:`, at least one
character), because the protocol is a comma-separated list.

**The protocol.** `--reactive-persist: open:demo-open,tab:demo-tab` on the owner, from a fourth kernel `#persist` (an empty
`&{}` plus `@property { syntax: "*"; inherits: false }`), emitted with `append()` so two `state()` calls join. A state
without `persist()` never appears, and a file that persists nothing carries neither the property nor its `@property` rule.

**The runtime.** `localStorage["reactive:" + key]`; a stored value replaces the declared one when the owner is initialised,
and every write stores the state. A missing or throwing `localStorage` (private mode, quota, no storage) is swallowed.
Values reach the page only through `setAttribute` and `style.setProperty`, so a stored value cannot inject anything.

## Todo
- [x] The `Persisted` brand, `persist()`, the key and missing-value build errors, `ValueOf` in `Sources`
- [x] The `#persist` kernel, `--reactive-persist` through `append()`, `uses` only when a state persists
- [x] The runtime: storage, the restore at initialisation, the store on every write, the silent failures
- [x] Fixtures and package test (protocol, joined list, no persistence without `persist()`, both build errors)
- [x] Type tests (accepted by `state()`, refused by `set`/`toggle`/`bind`/`when`/`on`/`Style`)
- [x] Browser tests (reload restores, stored value wins, a plain state writes nothing, storage cleared, no console errors)
- [x] README (API, restore timing, protocol row, limits, deferred, runtime size), docs/API.md row, wayfinder entry, changeset
- [x] Verified: package test + browsers, typecheck, build:packages, docs.mjs, vp lint, vp fmt --check, release:check

## Engine gaps

None: `append()` (cssints-674d) already carries a list, and the new protocol property is one more of them.

## Summary of Changes

`packages/reactive/src/index.ts`: `persist(value, key)` returns a branded `Persisted<T>` (a unique-symbol interface) that
only `state()` accepts; `States` is `StateValue | Persisted<StateValue>` and `Sources` unwraps it through `ValueOf`. The key
is checked in `persist()` (`/^[a-zA-Z0-9_.:-]+$/`, at least one character) and a missing value there too, both at the
`state()` call site. The scope gained the kernel `#persist` (an empty `&{}` plus
`@property --reactive-persist{syntax:"*";inherits:false}`); `state()` emits `--reactive-persist: open:demo-open,tab:demo-tab`
with `append()` and adds `uses: ["persist"]` only when a state persists.

`packages/reactive/src/runtime.ts`: `keysOf()` parses `--reactive-persist` once per owner into a `WeakMap` cache; `setup()`
writes a stored value over the declared one (`localStorage["reactive:" + key]`); `write()` stores a persisted state on every
write; `load()` and `save()` swallow a missing or throwing `localStorage`. Values still reach the page only through
`setAttribute` and `style.setProperty`.

Runtime: 2.48 kB minified, 1.16 kB gzipped (was 1.75 / 0.87). Tests: `test/reactive.mjs` (the property and kernel, the joined
list, a file without persistence, the key and missing-value errors), `test/types/reactive.ts` (the refusals), `test/browsers.mjs`
(storage cleared, reload restores before the harness reads after `load`, a stored value wins, a plain state writes nothing, no
console errors) — Chrome 156, Firefox 157, WebKit 27.2 pass. Docs: README (API row, restore timing, protocol row, limits,
deferred, size), `docs/API.md` row, this wayfinder entry, and the changeset `@cssints/reactive` minor.
