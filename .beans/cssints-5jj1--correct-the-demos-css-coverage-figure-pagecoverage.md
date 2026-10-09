---
# cssints-5jj1
title: Correct the demo's CSS coverage figure (page.coverage counts whole @layer blocks)
status: completed
type: task
priority: normal
created_at: 2026-10-09T09:06:03Z
updated_at: 2026-10-09T12:54:58Z
parent: cssints-dk1q
---

Found by cssints-oj0c (docs/research/coverage.md, 'Why not page.coverage'). Chrome reports a used @layer block as one entry from its name to its closing brace, and page.coverage merges the ranges, so every rule in a layer counts as used. cssints puts every rule in a layer, so the 79-80 % of the demo's sheet in docs/research/devtools.md (cssints-0a3p) and in the wayfinder entry is the share of non-@property bytes, not use.

- [x] re-measure apps/demo with CDP rule usage (the leaf-rule counting of apps/sky/test/coverage.mjs) and correct devtools.md and the wayfinder line
- [x] (moved to cssints-o3dz) check whether @projectwallace/css-code-coverage handles layer blocks; if not, report upstream (and/or to Playwright) with the three-rule repro
- [x] optional: route fixtures with a 3-image post, a 4+ image gallery and a 'warn' label, so the 12 rules only /dev/posts uses are measured on the routes

## Summary of Changes

- Demo re-measured by CDP rule usage (coverage.mjs's leaf-rule counting, a throwaway script): 75.2 % of the style-rule bytes on load (138/160 rules), 83.9 % (149/160) after interactions; page.coverage reads 81.0 % on the same sheet. devtools.md and the wayfinder line corrected, with a pointer to coverage.md.
- profile-media.json ends with images3, gallery and images2 with a `!warn` label from posts.json; scripts/record-profile.mjs adds them when it records again. profile tests green.
- test:coverage re-run: unused rules 15 -> 4 (DevPosts width + 3 style-query fallback rules); coverage.md updated.
- The @projectwallace check moved to cssints-o3dz.
