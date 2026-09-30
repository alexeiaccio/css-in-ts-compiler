---
# cssints-7pv1
title: 'JSDoc on generated members: syntax, browser support, MDN link'
status: todo
type: task
tags:
    - wayfinder:task
created_at: 2026-09-30T08:13:21Z
updated_at: 2026-09-30T08:13:21Z
parent: cssints-vy0o
---

## Question

API.md's old "Browser Compat" idea: each generated member carries JSDoc with the property's grammar, a support table from BCD for the default browserslist targets, and an MDN link, so the editor hover explains the value.

- [ ] scripts/members.ts emits JSDoc per member: the mdn syntax (verbatim), first-supported versions for Chrome/Firefox/Safari/Edge from BCD, the MDN URL from mdn-data or BCD
- [ ] Same for pseudo-class wrappers and flex()/grid() chain methods where cheap
- [ ] Check the hover in tsgo's LSP (bench/lsp.mjs can be extended: request hover on a member) and that the budget does not move (JSDoc is free for instantiations; verify)
