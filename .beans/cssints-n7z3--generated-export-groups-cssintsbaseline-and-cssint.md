---
# cssints-n7z3
title: 'Generated export groups: cssints/<baseline> and cssints/<spec shortname>'
status: completed
type: feature
created_at: 2026-10-11T08:12:04Z
updated_at: 2026-10-11T08:12:04Z
---

User (2026-10-11): generated groups of exports by Baseline (`cssints/widely-available`, `cssints/newly-available`, `cssints/limited-availability`, plus the other word-valued statuses web-features has, e.g. discouraged or fallback-like ones: research them) and by spec, named by the W3C shortname as in @webref/css (`cssints/mediaqueries-4`, `cssints/css-grid-2`, ...).

Decided with the user: a group exports its members (properties, functions, conditions/at-rules) AND narrows values in the types (and at build time) to what is in the group: a keyword or function of a value outside the group is an error. Spec groups are named by shortname.

- [x] research: web-features (baseline high/low/false, dates, other statuses), BCD keys ↔ properties/values/functions, @webref/css spec shortnames per property/value/function; design note docs/research/groups.md
- [x] generator script (css-grammar or cssints scripts/), output tracked, package.json exports for every group, members.ts-like declarations
- [x] value narrowing in types within the bench budgets, and the same check at build time
- [x] the plugin treats the subpaths as build-time imports like "cssints"
- [x] tests (fixtures, type tests with @ts-expect-error), docs/API.md section, release:check, playground types

## Summary of Changes

Done in the branch `groups` (design note: docs/research/groups.md).

- **Groups:** 96 subpaths of `cssints`. Baseline: `widely-available` (521 of 707 members), `newly-available` (567), `not-discouraged` (707, bans 4 keywords and 3 media features), `limited-availability` (is `cssints`). Spec: 92 groups named by the @webref/css shortname (`mediaqueries-4`, `css-grid-2`, `css-color-4`, `selectors-4`, ...), 1 to 78 members. A level includes the levels of its series before it, and bans what only the later levels define.
- **Data:** web-features 3.42.0 (status per BCD key; `discouraged`), BCD 8.1.3, @webref/css 6.23.14 as `webref-specs` (one file per level; 8.x keeps the latest level of a series only). `bun run groups` writes `src/groups-data.ts` (build) and `src/groups/<id>.ts` (types). Skipped, with reasons in the note: `kind`, web-features `group`, snapshots, BCD booleans, Baseline years. web-features has no "fallback" status.
- **Types:** the grammar check first, then a scan of the value for the group's banned words (keywords of the property, functions, units, media and query words): `GProp`, `GFn`, `GMath`, `GCondition`, `GLayout` in `group-types.ts`. Nothing changed in `css.ts`, `parts.ts` (one `export type`) or `types.ts`: a program without a group pays nothing; with one, +2.9% on a 105-call bench (about 250 instantiations a call). `bench/groups.ts` is budgeted.
- **Build:** `instrument.ts` treats `cssints/<id>` like `cssints` (attribute, no-attribute error, `cx` kept) and rewrites it to `__group(id)` (`group.ts`): members of a group the group lacks throw at the call, property members scan what they built (also `flex().gap()` chains), conditions scan the query.
- **Package:** one pattern export `./*`; dist +414 KB (96 declaration files), about +100 KB gzip in the tarball (cssints 303 kB packed). tsconfig, vite.config (pack entries by directory), .prettierignore, diff-check config.
- **Tests:** `test/groups.mjs` (declarations and data agree, members, bans, located errors, a production build), 12 fixtures, `test/types/groups.ts` (@ts-expect-error), docs.mjs on the new API.md section, the playground test (225 cases) and the docs build.
- **Left:** JSDoc on group members, Baseline years, `standard-track`, an MCP tool; the wayfinder entry (written by the coordinator).
