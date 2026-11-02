---
# cssints-zovu
title: Pan-zoom image
status: completed
type: feature
priority: normal
created_at: 2026-10-30T10:51:11Z
updated_at: 2026-11-02T10:59:25Z
parent: cssints-65eb
---

kocharin zoomable.tsx is ~110 lines of pointer math with no keyboard path and no ARIA; createCanvas is an infinite canvas and too heavy.

- [x] pointer drag, wheel, pinch, double-click reset
- [x] keyboard: +/- zoom, arrows pan, 0 reset, with a focusable viewport and a live value
- [x] bounds: min/max scale, clamp to the image or allow rubber band (decide)
- [ ] adopt in kocharin-art-3 (another session owns that repo: coordinate)

## Summary of Changes

`createPanZoom` in `packages/headless/src/panzoom.ts` (exported from `src/index.ts`), its Chromium oracle `test/panzoom.browser.test.tsx` (12 tests), a "Pan and zoom" README section, a docs/API.md entry and `.changeset/panzoom.md` (minor).

- Viewport: `tabindex=0`, `role=group`, `aria-roledescription="zoomable image"`, `aria-label` from `labels.viewport` (default "Image"), `aria-describedby` the live value.
- Keyboard: `+` / `=` / `-` by `step` (0.25), arrows pan 24 px (Shift x4), `0` resets to `min`; only while the viewport holds focus, and only handled keys are `preventDefault`ed.
- Wheel: zoom with `ctrl` / `meta` only (the browser's pinch), about the cursor; a bare wheel is never swallowed.
- Pointer: drag pans with pointer capture (best-effort for synthetic pointers), a second pointer pinches about its midpoint, a double click resets.
- Bounds: `"clamp"` (default) keeps the scaled image covering the viewport (offset <= half the scaled overflow, so the image is expected to fill its box at `min`); `"free"` allows dragging it out.
- Live value: `role=status`, `aria-live=polite`, `aria-atomic`, `"150%"`; no `hidden` (a hidden live region is not announced).
- Controlled `scale` + `onScaleChange` via `createControllable`; offset is uncontrolled (`onPanChange`).

Checks: headless suite green (1099 passed; menu-button walk rerun alone after a load flake), tsc, `vp lint packages/headless`, `vp fmt --check`, `bun run diff:check`, `bun run release:check`.

Left: adoption in kocharin-art-3 (the last item) belongs to the session that owns that repo.

## Summary of Changes

Shipped as `createPanZoom` in 0.18.0 (keyboard, pointer drag, modifier wheel, clamp/free bounds, live value); built for kocharin's zoomable.tsx.

## 2026-11-02: tracked there, not here

Moved: the kocharin-art-3 adoption is tracked in effects-of-atmosphere `9g8k` (cross-repo item).
