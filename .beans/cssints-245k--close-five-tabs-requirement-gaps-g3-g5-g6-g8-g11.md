---
# cssints-245k
title: Close five tabs requirement gaps (G3, G5, G6, G8, G11)
status: completed
type: task
priority: normal
created_at: 2026-10-31T14:33:12Z
updated_at: 2026-10-31T14:34:27Z
---

The tabs requirement catalogue lists twelve open gaps. Close G3 (roles and names), G5 (icons, host obligation), G6 (focus leaves and hidden panels), G8 (activation on the up event) and G11 (RTL arrows): add the browser assertions in test/tabs-requirements.browser.test.tsx, add dir to createTabs, document the host duties, tick the gaps, and leave G1, G2, G4, G7, G9, G10, G12 open.

- [x] Read tabs.md, tabs.ts, the tests, tabs.qnt and the bridge
- [x] G3: roles, controls/labelledby, selected/tabindex, disabled, accessible names
- [x] G6: Tab leaves the component; hidden panel content unreachable
- [x] G8: mousedown inert, click selects, pointercancel does not
- [x] G11: dir option swaps horizontal arrows; ltr and vertical unchanged
- [x] G5: document the icon host obligation and tick the gap
- [x] Verify typecheck, tests, lint, fmt, release:check
- [x] Commit, push, open the PR

## Summary of Changes

Closed G3, G5, G6, G8 and G11 in packages/headless/docs/requirements/tabs.md; the other seven gaps stay open.

- New test/tabs-requirements.browser.test.tsx with five tests: roles and names (G3), focus leaves / hidden panels out of the tab order (G6), up-event activation (G8), the rtl horizontal arrow swap and the ltr/vertical mapping (G11).
- createTabs takes dir: ltr | rtl (default ltr); tabs.qnt remains ltr only and the direction scenarios stay skipped.
- G5 is documented as a host obligation (icon aria-hidden beside a label, icon-only named from label(index)).
- README, docs/API.md and the tabs bridge comment state the direction limit; a changeset bumps @cssints/headless minor.

Verification: tsc --noEmit; full headless suite (64 files, 1267 passed, 1234 skipped); vp lint packages/headless; vp fmt --check on touched files; bun run release:check. PR: https://github.com/alexeiaccio/css-in-ts-compiler/pull/108
