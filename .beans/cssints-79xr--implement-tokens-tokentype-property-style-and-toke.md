---
# cssints-79xr
title: 'Implement tokens: token.<type>, @property, style() and token.set()'
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-29T14:29:55Z
updated_at: 2026-09-29T16:44:00Z
parent: cssints-vy0o
blocked_by:
    - cssints-vzd9
    - cssints-djzw
    - cssints-mjgx
---

## Question

Implement `docs/API.md` "Tokens" (decided in cssints-o00x). Blocked by the global sheet, because `@property` rules go at its top.

- [ ] `token.<type>(initial, name?)` for every @property syntax type: a Typed OM value with `toString()` = `var(--name)`, and the initial value checked by the twin (and by types, in the public types ticket)
- [x] Names: a named token (string or `{ var, inherit }`) can be set; an unnamed one gets `--_<hash>` of the file and site and is private; `inherits` defaults to true
- [x] One `@property` per token at the top of the sheet, outside the layers; deduplicated across modules; a clash (same name, different syntax or initial value) is a build error
- [x] `style(...)` and `token.set(token, value)` at build time give a style object; setting a private token is an error
- [x] Fixtures, and the demo uses one named token in a style and in a class

## Summary of Changes

- css-grammar `src/token.ts`: `TOKEN_TYPES` (syntax, typed-value sentinels and build-time probe literals per type), `ValidSyntax` (type-level check of a value against a named syntax), `Token`, `TokenFn`, `TokenSetFn`; `bench/tokens.ts` with a budget entry (140.5k tsc / 143.5k tsgo net, of which the colour grammar is most).
- cssints `src/token.ts`: `CSSTokenValue` (a Typed OM value, `toString()` = `var(--name)`), `token.<type>`, `token.set`, `style`. Names: string or `{ var, inherit }`; none gives `--_<sha1 of the file relative to cwd, site, index>` and a private token. A named token can be set, a private one is a type error and a build error.
- A value that uses a token is checked as literals of its type (`probed` in lib.ts: one text per sentinel, so lengthPercentage is checked as a length and as a percentage), also for a token that came in through a template string. The twin is untouched.
- The registry holds one `@property` per variable (`properties`); a clash (same name, another rule, another site) is a build error at the second declaration; a file's own earlier evaluation does not clash. The sheet renders them after the layer statement and outside the layers. A module records its classes and the `@property` text of the tokens they read or name, so an edit of an initial value changes what it recorded and reloads the sheet in dev. runner.qnt is unchanged: the `rules` of a module already stand for everything it records; `sheetFresh` holds (5000 samples) and `test:mbt` passes.
- `style()` / `token.set()` sites become an object literal, custom properties first, camelCase keys, declarations checked like a class's, no conditions. `__site` got one more branch (`isStyle`); a token site is the existing Typed OM text.
- A font-relative initial value (`1rem`, `1em`, `1ch`, ...) is a build error: Chrome drops such an `@property` rule (checked with `CSS.registerProperty`). docs/API.md example changed to `16px`.
- Token types left out: `resolution`, `url` (no grammar in mdn.ts), `image` (its `<url>` has none). Tokens of `integer`, `angle`, `time`, `customIdent` work at build time but not as typed parts in the type-level check, because css.ts has no `⟨integer⟩`, `⟨angle⟩`, `⟨time⟩`, `⟨custom-ident⟩` sentinels (only colour, length, percentage, number and syntaxes such as transform-list have); lengthPercentage stands for `⟨length⟩ | ⟨percentage⟩`.
- Demo: `accent` token in a class and set in a `style` prop; checked in Chrome (production build and dev, including an edit of the initial value).
- perf.mjs seq, 200 modules: per-evaluation median 4.4 ms and transform median 4.8 ms, same as master (4.4 / 4.8).
