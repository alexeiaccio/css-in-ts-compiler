---
# cssints-245k
title: Close five tabs requirement gaps (G3, G5, G6, G8, G11)
status: in-progress
type: task
created_at: 2026-10-31T14:33:12Z
updated_at: 2026-10-31T14:33:12Z
---

The tabs requirement catalogue lists twelve open gaps. Close G3 (roles and names), G5 (icons, host obligation), G6 (focus leaves and hidden panels), G8 (activation on the up event) and G11 (RTL arrows): add the browser assertions in test/tabs-requirements.browser.test.tsx, add dir to createTabs, document the host duties, tick the gaps, and leave G1, G2, G4, G7, G9, G10, G12 open.

- [ ] Read tabs.md, tabs.ts, the tests, tabs.qnt and the bridge
- [ ] G3: roles, controls/labelledby, selected/tabindex, disabled, accessible names
- [ ] G6: Tab leaves the component; hidden panel content unreachable
- [ ] G8: mousedown inert, click selects, pointercancel does not
- [ ] G11: dir option swaps horizontal arrows; ltr and vertical unchanged
- [ ] G5: document the icon host obligation and tick the gap
- [ ] Verify typecheck, tests, lint, fmt, release:check
- [ ] Commit, push, open the PR
