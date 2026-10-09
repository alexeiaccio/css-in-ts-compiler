---
# cssints-g3u1
title: Devtools overlay reports a mismatch for --surface-d on sky's post card
status: completed
type: bug
priority: normal
created_at: 2026-10-09T13:01:24Z
updated_at: 2026-10-09T14:38:21Z
---

Seen by hand in the cssints-t42q check: on apps/sky /dev/posts, picking a post card in the devtools overlay marks `--surface-d` as a mismatch (✗) against the computed style. Not investigated: the overlay's verification of a custom property set by surface() (the kernel alternates registered properties through @container style(), and the clone check may not reproduce the parent chain), or a real cascade difference.

## Todo
- [x] reproduce on /dev/posts and in a minimal fixture (nested surfaces)
- [x] fix the core's cascade or verification, a test in packages/devtools

## Summary of Changes

Root cause: not the cascade (the member class in _.a beats the kernel's 0 in _.k, as the browser has it) but the check. The table's sheet is cssints' render; the page's went through Vite's LightningCSS, which reprints values (0.04 as .04, 1e6 as 1000000, oklch() as hex plus lab() under @supports). An unregistered custom property computes to its tokens as written, so the clone with the table's text differed.

Fix (packages/devtools/src/core/dom.ts): a custom property's winner goes on the clone as the page's sheet has it: the last rule with the winner's selector (CSSOM serialisation) whose at-rules hold for the element (probe sheet), else the table's text. Page.verify takes the winner's selector. Frame's and surface's custom properties are all ✓ on sky's post card and quote.

Tests: core.mjs, nested surfaces (winners per branch, inherited step on a plain child, what verify gets, odd whitespace kept); browsers.mjs, a surface in a surface on apps/demo's Inspect.tsx with a base colour in odd whitespace, no custom-property mismatch, in Chrome, Firefox and WebKit. Docs: API.md Devtools, research/devtools.md, the package README, wayfinder.
