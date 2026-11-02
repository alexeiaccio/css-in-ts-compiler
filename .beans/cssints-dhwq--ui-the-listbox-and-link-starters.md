---
# cssints-dhwq
title: 'UI: the listbox and link starters'
status: completed
type: task
priority: normal
created_at: 2026-11-02T11:56:02Z
updated_at: 2026-11-02T12:11:25Z
---

Add the two styled starters the registry is missing: listbox (plain selectable list) and link, each with a tested conformance test, registry entries and a PR.

## Summary of Changes

- Added `apps/ui/src/registry/link/` (`link.tsx`, `link.fixture.tsx`, `link-driver.ts`, `link.browser.test.tsx`): `<Link>` on `createLink` with native/custom modes, tone, current, disabled and `render`.
- Added `apps/ui/src/registry/listbox/` (`listbox.tsx`, `listbox.fixture.tsx`, `listbox-driver.ts`, `listbox.browser.test.tsx`): `<Listbox>` on `createListbox` with a roving tab stop, `data-highlighted`, selection paint, a multiple-mode check and disabled rows.
- Registered both as tested starters in `apps/ui/scripts/registry-json.ts`; regenerated `apps/ui/r/link.json`, `apps/ui/r/listbox.json`, `apps/ui/r/registry.json` and `apps/ui/public/llms.txt`.
- Checks: the two tests (59 passed / 44 skipped), the full apps/ui suite (treeview differential flaked once, passed alone), typecheck, lint, diff:check and release:check.
- PR: https://github.com/alexeiaccio/css-in-ts-compiler/pull/125
