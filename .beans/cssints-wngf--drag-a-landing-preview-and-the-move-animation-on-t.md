---
# cssints-wngf
title: 'drag: a landing preview and the move animation, on the snap we have'
status: todo
type: feature
priority: normal
created_at: 2026-11-04T09:50:12Z
updated_at: 2026-11-04T09:50:12Z
---

Borrowed from `cssints-2cxd` (declarative dragging / Dragology, UIST 2026): the part worth having is not the library — it renders SVG view trees and owns no keyboard path — but the idea, **declare where a drag can land and synthesise the feedback**, which for a free-placement canvas is exactly the hard half.

**What exists**: `createCanvas` snaps to candidates (`snapCandidates`, 8 screen px, default the 50-unit grid) and moves a node on pointer up; the camera has a tween (`animateTo`, `TICK`, reduced-motion honoured). There is no preview of where the card will land, and the drop jumps.

**The slice**: during a drag, draw a ghost at the snapped slot (the candidate the pointer is nearest, already computed), and on release animate the card from where it was dropped to that slot with the existing tween. Keyboard moves keep their current behaviour (one grid step, announced) — the keyboard path is ours and stays ours.

**Done when**: a pointer drag shows the ghost at the slot it will take, the release lands there with the animation, reduced motion jumps instead of animating, the keyboard still steps and announces, and the existing `canvas.*.browser.test.tsx` suite stays green with one scenario for the ghost.

**Out**: Dragology as a dependency, reachable-permutation exploration, SVG view trees.
