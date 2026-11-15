---
# cssints-jdmq
title: 'Every part carries its name: a skin needs a hook, not a class the host invents'
status: completed
type: task
priority: normal
created_at: 2026-11-15T07:26:46Z
updated_at: 2026-11-15T14:35:30Z
---

SPEC-01 (shuding) is the same architecture at scale: Vercel UI SDK **behaviors** + a **skin** that is plain CSS scoped to `[data-skin="hardware"]` + a **registry** that copies source instead of installing a dependency. 61 components, 52 examples, 7 devices.

The one thing it has that we do not: **every part is marked**. Each part's props carry a `data-kit="<part>"` hook, so one skin stylesheet styles every component without the host wiring a single class. In `@cssints/headless` `data-part` appears **only in test fixtures** (`test/*.fixture.tsx`) — in the shipped props objects there is no part marker at all (2 hits in the whole `dist`), so a shared skin has nothing to attach to and every consumer re-invents class names.

**What to do**: every props object returns `data-part: "<name>"` alongside its ARIA attributes — additive, no behaviour, no new API. Then a skin is one CSS file installed next to the package, and the two things downstream of it become possible:

1. the **primitive records** (`ing.lexicon.ui.primitive`, bean `effects-of-atmosphere-qvo8`) can carry the part list, so a record describes something a consumer can actually style;
2. a **shadcn-style registry** analogue: `registry.json` generated from the primitives + a CLI that writes files, which is what 'publish the primitive' should mean.

**Guard against drift**: a lint rule (or a test in `test/types/`) that fails when a `*Props` interface omits `data-part`, so the 56th primitive cannot quietly forget. Mechanical pass, one PR, no spec change: the differential walk compares state and callbacks, not attributes.

**Not taken from SPEC-01**: haptics and synthesized interaction sounds (device cosplay, a console here does not need it), the block-caret and Safari-Tab-order shims in a root provider (real platform gaps, but only worth it when a host hits them).

## Summary of Changes

PR **#193** (`parts/named`, `642e29fe`, merged as `04b9e37e`), shipped in **`@cssints/headless` 0.41.0**.

Every returned props object now carries `data-part: "<name>"`, named in the primitive's own vocabulary and **taken from the fixtures** where they already wrote one (`trigger`, `panel`, `option`, `menuitem`, `cell`, `thumb`, `track`, `handle`, …). The full table is in `packages/headless/README.md` § "Part names". Additive: no behaviour, no options, no ARIA, ids or focus moved.

Where a fixture wrote an *address* instead of a name (`node${id}`, `cell:r,c`, `menuitem:N`), the part keeps the name and the fixture renames after the spread — the "host wins" rule, and the only fixtures that keep an explicit literal. A literal `data-part` written **before** a spread is overridden by the primitive's; the kit's `Progress` bar hit this and was fixed by spreading `reading.barProps` first.

**The guard** is `packages/headless/test/parts.test.ts`: a source-shape test in the package's own suite, not an oxlint rule — it needs no lint plumbing and it enumerates the *exported types*, so a new primitive cannot escape without a list to maintain. It proves itself: with `readonly "data-part": string;` removed from `AccordionTriggerProps`, it fails with `[ "accordion.ts: AccordionTriggerProps" ]`. `TabRenameProps` is the one documented exception (it names the rename *controller*, not element attributes).

**Checks**: headless 75 files / 1417 passed; `apps/ui` 66 files / 994 passed; the starter smoke 65 items / 64 conformance tests; typecheck with `--type-check` clean except one pre-existing diagnostic in `test/dialog-native.browser.test.tsx` (see the typecheck bean — the repo's own `typecheck` script does not pass the flag, so this was invisible until now).

Depends on nothing else; the installable skin (`cssints-sehi`) and the primitive records can now describe something a consumer can style.
