---
# cssints-7pv1
title: 'JSDoc on generated members: syntax, browser support, MDN link'
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T08:13:21Z
updated_at: 2026-09-30T08:27:21Z
parent: cssints-vy0o
---

## Question

API.md's old "Browser Compat" idea: each generated member carries JSDoc with the property's grammar, a support table from BCD for the default browserslist targets, and an MDN link, so the editor hover explains the value.

- [x] scripts/members.ts emits JSDoc per member: the mdn syntax (css-grammar's mdn.ts: mdn-data verbatim plus the ranges the types enforce), first-supported versions for Chrome/Edge/Firefox/Safari/iOS/Chrome Android from BCD, the MDN URL from mdn-data or BCD
- [x] Same for pseudo-class wrappers and flex()/grid() chain methods where cheap (chain methods are documented in FlexMethods/GridMethods, but tsgo does not show it on the chain call: see summary)
- [x] Check the hover in tsgo's LSP (bench/lsp.mjs can be extended: request hover on a member) and that the budget does not move (JSDoc is free for instantiations; verify)

## Summary of Changes

- `scripts/members.ts`: one JSDoc line per member: `grammar`. Chrome N, Edge N, Firefox N, Safari N, iOS N, Android N. [MDN](url). First version is the first statement without prefix, alternative name, flag or removal; "no" if none, "?" if BCD has no data (a member with no BCD entry gets no support row). Pseudo-class wrappers get the support row and link only (the grammar is the name). FlexMethods/GridMethods list one documented member per method.
- `css-grammar/src/support.ts`: exports its BCD lookup `get` (one word), reused by the script.
- `bench/lsp.mjs`: hover phase. `node bench/lsp.mjs [file] [word...]` requests a hover on the first `word(` and prints the raw answer; with words given, the edit loop is skipped. The client now declares markdown hover, like editors (otherwise tsgo joins signature and docs into one plain line).
- members.ts: 35582 to 141860 bytes, 592 to 1231 lines. Instantiations unchanged (budget exact in css-grammar and cssints); check time and memory within noise (tsc 558-569 MB vs 560-575 MB, tsgo 201 MB both).
- Finding: tsgo does not carry the JSDoc to a chain method (`flex().direction` hovers with the signature only); tsc 5.9 does. The docs are in place for when tsgo does.
