---
# cssints-6jou
title: 'Function calls: the type error on the bad argument, not the first'
status: in-progress
type: feature
created_at: 2026-10-08T13:39:51Z
updated_at: 2026-10-08T13:39:51Z
---

Follow-up of cssints-67qf (asked 2026-10-08). For non-math function calls (lightDark, linearGradient, oklch, var fallback...) the call is checked as text against <name()> and the type error lands on the first argument, because the recognizer does not say where it stopped. Put it on the argument where the text stops matching.
- [ ] Find the argument: e.g. check prefixes (the text of args 1..i) with the recognizer's 'stuck/consume' (css.ts already computes Stuck/Consume for messages) and mark the first i where the prefix cannot continue; or a per-argument CheckIn like properties do (parts.ts). Pick the cheaper; no n-ary union cliffs (TS2589).
- [ ] The message stays the twin's style (name(): unexpected "x" in "...", grammar <name()>) and names the argument position.
- [ ] Type tests: an error on argument 2 and 3 of a few functions (lightDark, linearGradient, oklch with a bad channel, var fallback); math untouched.
- [ ] Budgets: bench functions.ts and users.ts within 1.1x; bench/lsp.mjs demo before/after.
