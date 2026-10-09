---
# cssints-dk1q
title: 'Plugins from the bookmark pile: Arc tabs and GitHub stars on scope()'
status: completed
type: epic
priority: normal
created_at: 2026-10-08T08:55:38Z
updated_at: 2026-10-09T07:56:10Z
---

Candidates mined from Arc pinned tabs and GitHub stars (2026-10-08), mapped onto the scope() plugin model (docs/API.md "Plugins"). Children are ordered by priority: tier 1 (high) fits the model one-to-one and is small; tier 2 (normal) is native CSS plus a BCD-chosen runtime; tier 3 (low) is build-time assets like icons' fs provider; tooling and importers (low) are not plugins.

## Summary of Changes
All candidates shipped: tier 1 (fluid, layout, fonts with trim, reset, tokens, gradient, motion), tier 2 (squircle, reveal, stuck, balance, masonry), tier 3 (placeholder, ramp, skeleton), the DTCG importers (Figma native and TokensBrücke files as themes, a Tokens Studio recipe, clear errors for other shapes) and the devtools research (docs/research/devtools.md, a dev source map of the sheet). The engine gaps the plugins found were filed and fixed along the way; open follow-ups are separate beans.
