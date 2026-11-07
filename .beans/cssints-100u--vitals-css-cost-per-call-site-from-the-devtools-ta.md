---
# cssints-100u
title: 'vitals: CSS cost per call site, from the devtools table'
status: completed
type: feature
priority: normal
created_at: 2026-11-07T11:08:55Z
updated_at: 2026-11-07T12:30:27Z
parent: cssints-7rmb
---

The sheet is generated, so its bytes have authors: the `cn()`/`cv()` calls. The devtools table already maps every class to its rule and to the sites that made it; the report can turn that into the one cost table a cssints developer can act on.

Build:
- When the devtools table is available (the dev server's `cssints:devtools` response, or the `"build"` asset), attribute each rule's bytes to its class's sites (`class → sites` and `class → rule` both exist in `Model`/`ClassRecord`), then print the top calls: `cost     12.4 kB in 38 calls · top: Showcase.tsx:72 1.2 kB (6 classes, 4 used)`.
- Coverage per call: which of a call's classes no element carries now — a call whose classes are all unused is dead weight in the current view.
- The table's types live in `src/core/table.ts` (Effect package but the types are plain). Do not import the core's runtime into `src/vitals`: either a type-only import (erased) or a small structural type in `vitals/`.
- Without the table (any page without cssints' dev server), the row is absent. The module must stay a 9 kB import.

Check: a fixture app with two `cn()` calls of different weight (one large rule, one small) asserts both entries and their byte order; the vitals entry's built bundle is unchanged in size when the row is unused (no Effect, no core runtime).

Depends on the dev server payload being reachable from the page without the overlay; reuse the HMR channel the overlay uses, or the `history` ticket's event.

## Outcome (2026-11-07)

`src/vitals/cost.ts`: the devtools table (requested once over HMR, `cssints:devtools:get` → `cssints:devtools`) is folded
into the bytes per call — a class counts at its first site, so a shared class is not double counted — with the total, the
number of calls and how many of a call's classes the page carries now (the DOM's class set). Row:
`cost 12.4 kB over 38 calls · Showcase.tsx:72 1.2 kB (6 classes, 4 used)`. Needs `cssints({ devtools: true })`; without the
table the row is absent. Check: the node test on `costs()` (shared class, a class without a site, used counts) and
`isTable()`; the browser fixture has no devtools plugin, so the integration is the same HMR path tested by `edits:get`.
Deliberate limit: no per-call coverage beyond the "used" count.
