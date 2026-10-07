---
# cssints-tdiu
title: 'Tokens as getters: t.color.accent() with the definition''s value in the type'
status: in-progress
type: feature
created_at: 2026-10-07T10:09:44Z
updated_at: 2026-10-07T10:09:44Z
---

Asked by the user (2026-10-07): createTokens leaves become getters, t.color.accent() returns the token (the Typed OM value var(--color-accent) it is today), and the token type carries the value of its definition as an inferred type parameter (Token<"color", true, "#545434">), visible on hover; the user does not write the generic. The coordinator advised against (no-arg call is ceremony; value is only :root's, themes override it; JSON imports widen it to string); the user chose getters anyway.
- [ ] Tokens<T>: each leaf is () => Token<K, true, V> (V the literal $value, or string for JSON imports / aliases: say what an alias carries); groups stay objects; runtime createTokens builds callable leaves; the engine's token-set lookups (WeakMap sets, refs, createGlobalTheme, check.contrast, scope() $tokens/$overrides and { tokens } entries, mise-en-mode look) keep working with the set object.
- [ ] Single tokens from token.<type>(initial, name?) stay values (already a call); say so in API.md.
- [ ] Passing a getter without calling it (css.color(t.color.accent)) is a type error with a readable message, and a build error naming the call site at runtime.
- [ ] Migrate every call site: apps/demo, apps/sky, packages/mise-en-mode, packages/icons if any, tests, fixtures, docs/API.md, README.md (docs.mjs green).
- [ ] Budgets: bun run bench within 1.1x or re-baselined with a reason; apps/sky/scripts/perf.mjs (tsgo instantiations, editor latency) before/after in one worktree; bench/lsp.mjs APP=sky.
