---
# cssints-n7z3
title: 'Generated export groups: cssints/<baseline> and cssints/<spec shortname>'
status: in-progress
type: feature
created_at: 2026-10-11T08:12:04Z
updated_at: 2026-10-11T08:12:04Z
---

User (2026-10-11): generated groups of exports by Baseline (`cssints/widely-available`, `cssints/newly-available`, `cssints/limited-availability`, plus the other word-valued statuses web-features has, e.g. discouraged or fallback-like ones: research them) and by spec, named by the W3C shortname as in @webref/css (`cssints/mediaqueries-4`, `cssints/css-grid-2`, ...).

Decided with the user: a group exports its members (properties, functions, conditions/at-rules) AND narrows values in the types (and at build time) to what is in the group: a keyword or function of a value outside the group is an error. Spec groups are named by shortname.

- [ ] research: web-features (baseline high/low/false, dates, other statuses), BCD keys ↔ properties/values/functions, @webref/css spec shortnames per property/value/function; design note docs/research/groups.md
- [ ] generator script (css-grammar or cssints scripts/), output tracked, package.json exports for every group, members.ts-like declarations
- [ ] value narrowing in types within the bench budgets, and the same check at build time
- [ ] the plugin treats the subpaths as build-time imports like "cssints"
- [ ] tests (fixtures, type tests with @ts-expect-error), docs/API.md section, release:check, playground types
