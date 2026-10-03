---
# cssints-tuyw
title: Support warnings skip colours inside tokens
status: completed
type: bug
priority: normal
created_at: 2026-10-02T16:04:44Z
updated_at: 2026-10-03T10:37:21Z
parent: cssints-co8y
---

## Problem

Found in cssints-n3xy: a literal `oklch()` in a property warns for the default targets (it lacks oklch() support in chrome 109 and others), but the same colour as a token's value (createTokens, @property initial-value, a theme) gives no warning, though it reaches the same browsers. Check where token and theme values are checked (theme.ts declare, checkSyntax) and whether they go through support(); decide whether they should warn (likely yes, once per token and feature), fix with a fixture.

## Summary of Changes

Root cause: token.ts `checkSyntaxFx` (the one check of every token and theme value: `declare` for `token.<type>()` and `createTokens`, the theme walk in theme.ts, `token.set()`) matched the grammar only; the BCD check (`supportOf`) ran for property declarations in macro.ts `checkNow` alone.

Fix: `checkSyntaxFx` now also runs `supportOf` for a property that takes the token's syntax (a table in token.ts; custom-ident and resolution have none), drops the property-itself warning, and records the message once per token (or theme value) and BCD feature in the shared `registry.warned` set (so the plugin's per-edit `warned.clear()` covers it). Messages name the token path, and the theme for a theme value. Test: test/token-support.mjs and fixtures/token-support.ts (BROWSERSLIST chrome 100, safari 15.2), in the test script; themes.mjs now pins modern targets, since its warnings are the contrast ones. docs/API.md Tokens has the rule.

Demo build: no new warnings. apps/sky build: 26 new, all oklch() against chrome 109 (the default targets), honest: the @property initial-value and the :root value are invalid there.
