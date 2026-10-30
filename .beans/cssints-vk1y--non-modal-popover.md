---
# cssints-vk1y
title: Non-modal popover
status: in-progress
type: feature
priority: normal
created_at: 2026-10-30T10:51:10Z
updated_at: 2026-10-30T13:16:44Z
parent: cssints-65eb
---

Anchored, light-dismiss, focus return, no inert background. dialog-modal is modal, so it is the wrong base.

- [x] anchor + placement (bottom-start|bottom|bottom-end and their top flips; flip at the viewport edge, horizontal shift; no left/right side placements and no RTL mirroring yet — start/end are the trigger's left/right edges)
- [x] open/close on trigger click, Escape, outside pointerdown; focus stays where the host puts it (focus moves into the content on open and back to the trigger, except a close from an outside pointerdown, which leaves the focus outside)
- [x] not a menu: no roving focus. It is the base for menu-in-popover and the filterable menu
- [ ] adopt in apps/docs SettingsPanel (native popover today)

## Summary of Changes

`createPopover` in `packages/headless/src/popover.ts`, exported from `src/index.ts`:
`open()` (controlled `open` + `onOpenChange`, uncontrolled `defaultOpen`), `triggerProps`
(`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`, click toggles, Enter / Space /
ArrowDown open), `contentProps` (`role="dialog"`, `aria-modal` always absent, `tabindex="-1"`,
`hidden`, Escape closes), `position(triggerRect, contentRect, viewport)` (pure, flips to the other
side when the room is not there, shifts horizontally), `contentStyle()` (the last measure), and
`attach(trigger, content)` (measure + ResizeObserver / resize / scroll, focus into the content on
open and back to the trigger on close, outside `pointerdown` light dismiss without focus theft;
returns the teardown).

No APG pattern exists for a popover, so there is no Quint spec: `test/popover.browser.test.tsx`
(9 tests in Chromium) is the oracle. README section, `docs/API.md` entry, and
`.changeset/popover.md` (minor).

Still open: adopting it in the docs SettingsPanel (last item).
