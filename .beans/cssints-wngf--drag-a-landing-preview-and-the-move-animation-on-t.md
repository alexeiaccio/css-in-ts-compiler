---
# cssints-wngf
title: 'drag: a landing preview and the move animation, on the snap we have'
status: completed
type: feature
priority: normal
created_at: 2026-11-04T09:50:12Z
updated_at: 2026-11-04T10:19:45Z
---

Borrowed from `cssints-2cxd` (declarative dragging / Dragology, UIST 2026): the part worth having is not the library — it renders SVG view trees and owns no keyboard path — but the idea, **declare where a drag can land and synthesise the feedback**, which for a free-placement canvas is exactly the hard half.

**What exists**: `createCanvas` snaps to candidates (`snapCandidates`, 8 screen px, default the 50-unit grid) and moves a node on pointer up; the camera has a tween (`animateTo`, `TICK`, reduced-motion honoured). There is no preview of where the card will land, and the drop jumps.

**The slice**: during a drag, draw a ghost at the snapped slot (the candidate the pointer is nearest, already computed), and on release animate the card from where it was dropped to that slot with the existing tween. Keyboard moves keep their current behaviour (one grid step, announced) — the keyboard path is ours and stays ours.

**Done when**: a pointer drag shows the ghost at the slot it will take, the release lands there with the animation, reduced motion jumps instead of animating, the keyboard still steps and announces, and the existing `canvas.*.browser.test.tsx` suite stays green with one scenario for the ghost.

**Out**: Dragology as a dependency, reachable-permutation exploration, SVG view trees.

## What changed

- [x] `pointer.qnt`: derived `landingOn` / `landingX` / `landingY` (the origin a release would commit, clamped like `up`'s `committed`) and the invariant `LandingIsTheSnappedOrigin` (on the grid while snapping, off it when snapping is off). Model and scaffolding regenerated.
- [x] `canvas.bridge.ts`: `landing` in `pointerValue`, `state[landing]` in the differential walk probe, and two contract scenarios (snapped and snap-off).
- [x] `createCanvas`: `state().landing` read from the spec's derived value; the drop correction is presentation (`state().drop` from/to for `TWEEN_TICKS` frames, camera's `requestFrame`, reduced motion jumps). `position(id)` stays the committed origin.
- [x] Fixture draws the host-side ghost; `canvas.landing.browser.test.tsx` covers the ghost, the release landing on it, snap-off, and the drop frames vs reduced motion.
- [x] Keyboard path untouched; the 66-file suite is green with the new file.

## Summary of Changes

The landing is spec state, so it cannot drift: the walk now compares `state[landing]` against `pointer.qnt` on every step. The ghost is the host's (the primitive renders no elements). The drop animation is presentation: in an ordinary drag the live drag already renders the snapped slot, so from and to are equal and no frames start; a world-bound clamp is the case the correction describes. Reduced motion never starts one.
