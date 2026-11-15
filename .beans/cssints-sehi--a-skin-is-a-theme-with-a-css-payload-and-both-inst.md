---
# cssints-sehi
title: A skin is a theme with a CSS payload, and both install as one artifact
status: todo
type: feature
priority: normal
created_at: 2026-11-15T07:32:43Z
updated_at: 2026-11-15T07:33:14Z
---

SPEC-01's skin is not a theme in the tokens sense: it changes *shape* (keys standing in their holes, LCD insets, printed scales), scoped to `[data-skin="hardware"]`. Our theme layer (`mise-en-mode`, `tokens`, DTCG) can express values — colours, radii, durations — and cannot express 'an inset key' or 'a corner squircle'. So make the hierarchy explicit and let them install together:

- **tokens** — the values, as today (`@cssints/tokens`, DTCG).
- **theme** — a named set of token values (already: `mise-en-mode`, `place.mode.standard`).
- **skin** — a theme **plus part styling**: one CSS bundle, scoped by `data-skin="<name>"`, that styles the parts of the primitives it supports.

**Correction to the first draft of this bean**: a skin layer already exists — `apps/ui/src/registry/<component>` holds a component's skin, its browser tests and the requirement gaps it closes (`packages/headless/docs/requirements/<primitive>.md`, e.g. `cssints-h43z` closing G1/G4/G7/G9 for tabs). What does not exist is (a) a stable part hook the skin can rely on instead of the host's classes, and (b) one installable artifact: today a look is a directory in the registry app, not a thing a consumer installs. Those are the two gaps below.

We already have every ingredient as its own package — `squircle` (corners), `fonts`, `icons`, `motion` (reduced-motion-aware keyframes), `reset`, `layout` — and no composition of them into one installable look. A skin is that composition.

**Checks that make a skin safe to share** (this is what SPEC-01 does not show, and what our build-time cssints plugin is already the right place for):
- every part selector in the skin must name a part some primitive actually emits — which needs `data-part` on the shipped props (bean `cssints-jdmq`);
- every token the skin reads must resolve in the theme it ships with, or fall back explicitly;
- contrast is checked per theme, which the plugin already does for the built-in themes (`[plugin cssints] cssints: contrast is not checked for …` today knows how to complain).

**Not doing**: a skin as an npm package that owns styles *and* behaviour (that is SPEC-01's kit-as-a-library, and it fights our copy-and-own registry direction); per-skin component forks — a skin styles parts, it does not reimplement them.
