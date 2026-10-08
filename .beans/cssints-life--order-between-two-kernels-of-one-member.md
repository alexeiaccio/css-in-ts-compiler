---
# cssints-life
title: Order between two kernels of one member
status: completed
type: bug
priority: normal
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T15:28:13Z
---

Found by reveal (cssints-qhug, repro under "## Engine gaps"). A member that uses two kernels has no defined order between them in `_.k`; reveal's `animation` shorthand kernel reset the timeline kernel, worked around with a doubled class `._reveal-view._reveal-view`.

## Todo
- [x] kernels of one member: an overlap between two kernels written as styles is a build error (chosen over `uses` order or shorthand-first across kernels; see Decision)
- [x] drop reveal's doubled class (done by cssints-rp0e, 228b82f: reveal is one styles kernel `core`, no `&&`)

## Repro

`scope("x", { "#view": { css: (css) => [css.animationTimeline("view()")] }, "#zap": { css: (css) => [css.animation("1s both")] }, m: { uses: ["zap", "view"], chain: {} } })`: `_.k` printed `._x-view{animation-timeline:view()}` then `._x-zap{animation:1s both}` (sorted by key), so the shorthand reset the timeline; naming the kernel `#run` instead flipped it. No warning.

## Decision

- `uses` order: a kernel is shared by members (and embedded ones by scopes) that may list it in other orders; the sheet would need a global order with errors on cycles, and the order would depend on which members a module has. Rejected.
- Shorthand before longhand across kernels: covers reveal's case, says nothing for one property set in both. Rejected.
- Build error when two kernels written as styles in one member's carry set properties of the element that meet under `relation()` (same, shorthand/longhand, logical/physical): chosen. They are one element's styles, so overlap is a mistake (as two kernels declaring one custom property already is); the fix is one kernel, where the sheet's own order holds. Smallest rule, cannot surprise. Raw kernels derive nothing and are not compared; nested rules and custom properties are left out, as for derived conflicts. The sheet order is unchanged (by key, independent of module load order), so the Quint model is untouched.

## Summary of Changes

- packages/cssints/src/scope-engine.ts: `carry()` compares the element properties of each pair of styles kernels in a `uses` list; an overlap is a located build error `x: kernels zap and view both set animation, animation-timeline (they are one element's styles and print in no set order): write those in one kernel`.
- packages/cssints/test/scope.mjs: shorthand/longhand and same-property (under a condition) errors, apart properties fine.
- docs/API.md (Plugins, Kernels): kernels print in `_.k` by key; the new error. docs/wayfinder.md: dated entry.
- reveal needed nothing: cssints-rp0e already folded its kernels into one.
- Deferred: a scope that embeds another's kernel and needs a longhand over it cannot merge the two; no plugin needs it yet.
