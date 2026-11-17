---
# cssints-7hbv
title: 'canvas: the node-UI library''s delta (xyflow), routing shapes, crossings and a camera policy'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-11-17T03:44:55Z
updated_at: 2026-11-17T03:44:55Z
---

Reference: https://github.com/xyflow/xyflow (React Flow / Svelte Flow / Vue Flow, MIT, shared `@xyflow/system`), read 2026-11-17.

Read against what this repo already had, which was most of it: `createCanvas` (pan/zoom, drag with a threshold, marquee, snap, keyboard move, focus auto-pan, live region), `createDiagramFocus` (roving tab stop, geometric arrows, edge cursor), `createPanZoom`, and the board's outline view.

## Taken

- **Four routing shapes** (`apps/ui/src/registry/route.ts`, `shapeBetween`): straight, step, smoothstep, bezier, all from the same border-midpoint geometry, drawn as one SVG path. The diagram takes them as `edge`.
- **Edge crossings** (`crossingsOf`): segments against segments (a cubic sampled), skipping the ends so two edges that share a node are not a crossing; the later edge is drawn with a canvas-coloured stroke under its line, so the older convention (a break, not a dot) is what a reader sees.
- **Making an edge by keyboard** (`createDiagramFocus`): `c` starts a link, the arrows pick the target, Enter fires `onConnect`, Escape forgets it, and `startConnect`/`connectTo`/`connectFrom` are the same state for a host's pointer drag. This is the delta that matters: React Flow announces and moves nodes by keyboard but makes every connection with a pointer.
- **Minimap and auto-pan** (starter `apps/ui/src/registry/canvas/`): both are host policies over `panBy`/`screenToWorld`/`animateTo`, so neither is a member of the primitive and the Quint model of the canvas does not move.

## Rejected

- **The library itself** (a node model, a handle per port, `isValidConnection`, connection radius, `fitView`): a second rendering model over components that are attributes, and its a11y is weaker than ours (every node is a Tab stop; ours is one roving stop).
- **Orthogonal routing that avoids nodes** (A*/ELK): a layout problem, not a skin's; crossings are handled by the break instead.
- **`autoPan` as a primitive member**: it is `panBy` on a pointermove at the edge; a frame loop can come later if a user holds a drag still at the edge and wants it to keep pulling (marked in the code).
