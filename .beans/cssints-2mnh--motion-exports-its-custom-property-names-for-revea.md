---
# cssints-2mnh
title: motion exports its custom property names for reveal
status: completed
type: task
priority: low
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T15:41:27Z
---

Found by reveal (cssints-qhug). reveal writes motion's `--motion-*` names by hand; its test fails if motion renames them. Export them (or an `emitPreset` helper) from @cssints/motion and use them in reveal.

## Todo

- [x] Export motionVars from @cssints/motion (and read it in motion's keyframes)
- [x] Use motionVars in reveal instead of --motion-* literals
- [x] Assert identical sheets of the motion and reveal fixtures
- [x] Update both READMEs
- [x] Tests, typecheck, browsers, lint, fmt

## Summary of Changes

@cssints/motion exports `motionVars` (`{ opacity, x, y, scale, blur }` to `--motion-o` ... `--motion-b`, keyed by the fields of a preset) and builds its keyframes from it. @cssints/reveal reads it for its kernel defaults and its `preset()` emit, so it no longer writes a `--motion-*` name. Embedding motion's scope does not help: `--_x` always resolves to the embedding scope's own name. The sheets of motion's use.ts and reveal's use.ts + page.ts are byte-identical before and after. Both READMEs mention `motionVars`.
