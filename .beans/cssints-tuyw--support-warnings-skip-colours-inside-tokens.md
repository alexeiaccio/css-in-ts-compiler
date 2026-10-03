---
# cssints-tuyw
title: Support warnings skip colours inside tokens
status: in-progress
type: bug
priority: normal
created_at: 2026-10-02T16:04:44Z
updated_at: 2026-10-03T10:27:03Z
parent: cssints-co8y
---

## Problem

Found in cssints-n3xy: a literal `oklch()` in a property warns for the default targets (it lacks oklch() support in chrome 109 and others), but the same colour as a token's value (createTokens, @property initial-value, a theme) gives no warning, though it reaches the same browsers. Check where token and theme values are checked (theme.ts declare, checkSyntax) and whether they go through support(); decide whether they should warn (likely yes, once per token and feature), fix with a fixture.
