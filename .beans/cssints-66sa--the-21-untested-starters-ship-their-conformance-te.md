---
# cssints-66sa
title: The 21 untested starters ship their conformance test
status: completed
type: task
priority: high
created_at: 2026-11-02T10:02:00Z
updated_at: 2026-11-02T12:13:03Z
---

Every starter in `apps/ui/src/registry` is supposed to arrive with a test a copy can run: `STARTERS` marks it `tested: true`, and `scripts/registry-json.ts` then puts the fixture, the driver, the browser test and the vitest config into the item. Twenty-one items still ship `tested: false`, so a copy arrives unverified and the site's preflight section stays empty.

- [x] menu
- [x] tooltip
- [x] select
- [x] spinbutton
- [x] dialog (already had its test; the item was missing `input.tsx` in `with` — its fixture imports it)
- [x] slider
- [x] checkbox-group
- [x] alert
- [x] breadcrumb
- [x] meter
- [x] toolbar
- [x] button
- [x] field
- [x] input
- [x] textarea
- [x] treeview
- [x] card
- [x] button-group
- [x] separator
- [x] badge
- [x] skeleton
- [x] flip every flag, regenerate `r/*.json`, full `apps/ui` test + typecheck + lint + fmt + release:check

Recipe: a scenario item copies the headless test (`packages/headless/test/<name>.browser.test.tsx`), swaps the fixture import for a registry fixture that mounts the styled component with the same config mapping, copies `packages/headless/test/dom-driver.ts` to `<name>-driver.ts`, and keeps DIVERGENCES with their reasons. A static part gets a focused DOM test of its rendered contract instead.

## Summary of Changes

All 21 starters now carry the test a copy can run (PR #124).

**Scenario items** (copied headless test through the styled component, driver a byte copy of `dom-driver.ts`, `DIVERGENCES` kept): menu, spinbutton, slider, checkbox-group, alert, breadcrumb, meter, toolbar, button, treeview. **Focused tests** where the primitive walk does not fit the skin: select (combobox regression set), tooltip (the skin exposes no timer props), field, input, textarea (the `createField` wiring), dialog (test existed). **Rendered-contract tests** for the parts with no primitive: card, button-group, separator, badge (4.5:1 per tone), skeleton (the reduced-motion gate).

**Registry**: `tested: true` for all 21, `dialog.with += input/input.tsx`, `toolbar.also += @cssints/button`, `r/*.json` regenerated (23 files; `drawer` and `shortcuts` were stale on master and came along).

**Bugs the tests forced**: `Input`/`Textarea` paint `:disabled` (nothing sets `aria-disabled` on a plain input); `Treeview`'s row no longer overrides `[hidden]` and carries the `group()` marker its chevron reads; `BreadcrumbLink` copies the item's `aria-disabled`; `Menu` gained the `onReady` escape hatch the fixture needs.

**Verification**: `apps/ui` 53 files / 798 passed / 673 skipped; typecheck, `vp fmt --check`, lint on touched sources, `diff:check`, `release:check` green. Each item also passes alone.

After this bean the styled layer has 55 items; only `grid`, `windowsplitter` and `canvas` have no skin, and none of them is on an app's list.
