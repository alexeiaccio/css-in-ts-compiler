---
# cssints-b4q6
title: 'Kernels written as styles: child selectors, custom properties and keyframes() names'
status: todo
type: feature
priority: normal
created_at: 2026-10-08T09:42:19Z
updated_at: 2026-10-08T09:42:19Z
---

Found by the tier-1 plugins (cssints-dk1q). Repros in cssints-kg3q and cssints-11pj under "## Engine gaps".

A kernel written as styles (`css: (css) => [...]`) cannot:
1. target children (`& > *`, `& > :last-child`): layout puts Every Layout's child rules in a second, raw kernel `-base`.
2. set a custom property (defaults like `--layout-stack-gap: 1rem`): also in `-base`, so two kernel classes per call.
3. carry a `keyframes()` name: motion's kernel is raw CSS and reads untyped internals of the keyframes value (`kernel.css`, `name`); its conflicts are an explicit list instead of derived.

## Todo
- [ ] a child/descendant condition in kernel styles
- [ ] custom properties in kernel styles (unchecked value, like emit)
- [ ] keyframes() values allowed in kernel styles, registering the @keyframes rule
- [ ] fold layout's -base into -core; motion back to a styles kernel with derived conflicts
