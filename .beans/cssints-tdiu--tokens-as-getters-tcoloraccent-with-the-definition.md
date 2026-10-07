---
# cssints-tdiu
title: 'Tokens as getters: t.color.accent() with the definition''s value in the type'
status: completed
type: feature
created_at: 2026-10-07T10:09:44Z
updated_at: 2026-10-07T10:09:44Z
---

Asked by the user (2026-10-07): createTokens leaves become getters, t.color.accent() returns the token (the Typed OM value var(--color-accent) it is today), and the token type carries the value of its definition as an inferred type parameter (Token<"color", true, "#545434">), visible on hover; the user does not write the generic. The coordinator advised against (no-arg call is ceremony; value is only :root's, themes override it; JSON imports widen it to string); the user chose getters anyway.
- [x] Tokens<T>: each leaf is () => Token<K, true, V> (V the literal $value, or string for JSON imports / aliases: say what an alias carries); groups stay objects; runtime createTokens builds callable leaves; the engine's token-set lookups (WeakMap sets, refs, createGlobalTheme, check.contrast, scope() $tokens/$overrides and { tokens } entries, mise-en-mode look) keep working with the set object.
- [x] Single tokens from token.<type>(initial, name?) stay values (already a call); say so in API.md.
- [x] Passing a getter without calling it (css.color(t.color.accent)) is a type error with a readable message, and a build error naming the call site at runtime.
- [x] Migrate every call site: apps/demo, apps/sky, packages/mise-en-mode, packages/icons if any, tests, fixtures, docs/API.md, README.md (docs.mjs green).
- [x] Budgets: bun run bench within 1.1x or re-baselined with a reason; apps/sky/scripts/perf.mjs (tsgo instantiations, editor latency) before/after in one worktree; bench/lsp.mjs APP=sky.

## Summary of Changes

- **API.** `createTokens` leaves are getters: `t.color.accent()` returns the token (the Typed OM value whose text is `var(--color-accent)`). Groups (`t.color`, `t`) stay plain objects, so `createGlobalTheme(t, ...)`, `look(t, ...)`, scope `$tokens` and `{ tokens }` entries are unchanged. `token.<type>(initial, name?)` stays a value.
- **Type.** `Token<K, S, V extends string = string>` with a covariant phantom `"~value"`; a leaf is `TokenGetter<Token<K, true, V>>` (css-grammar token.ts, theme-types.ts). V is the `$value` as text: a string as written (an alias carries `"{color.base}"`, not its target's value), a number or `{ value, unit }` as CSS text, a colour object and anything from a JSON import as `string`. A `Token<K, S, V>` is assignable wherever `Token<K>` or `Token<K, true>` is expected.
- **Uncalled getter.** Type error on the argument of a property (`color: unexpected "⟨uncalled-token-getter⟩"`, via `TokenGetter` in `Part`), `Type 'TokenGetter<...>' is missing the following properties from type 'Token<...>'` in `check.contrast` and `token.set`; at build, `cssints: color.accent is a token getter, not a token: call it, as in t.color.accent()` at the call site (`Symbol.toPrimitive` of the getter, and `noGetter` in `token.set` and `check.contrast`).
- **Engine.** The runtime builds callable leaves (token.ts `getterOf`); the theme walk, `tokenSyntaxes` and scope `canon` call them; a module of tokens ships `() => "var(--x)"` getters to the client. dist rebuilt for the four packages (tracked, apps read it).
- **Migrated.** Call sites by a type-checker codemod (property access of type TokenGetter that is not called): apps/demo 4 files, apps/sky 15, cssints tests, fixtures and type tests 24, packages/mise-en-mode fixtures 2, docs/API.md.
- **Budgets.** `bun run bench`: tokens.ts 147694 to 147734 (tsc), cssints users.ts 884165 to 885464 (tsgo), functions.ts 269587 to 270901; all within 1.1x; it exits 1 as on the fork point (bench/errors.ts has 13 errors, 12 expected: TS1362 `CSS` exported with `export type`). Sky tsgo 2.45 M to 2.46 M instantiations, tsc 1.20 M to 1.21 M; wall time and editor latency equal under equal load (A/B in one worktree: tsgo 1310 to 1272 ms, first diagnostics 608 to 507 ms, valid edit 365 to 330 ms).
