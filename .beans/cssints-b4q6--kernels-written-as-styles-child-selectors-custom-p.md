---
# cssints-b4q6
title: 'Kernels written as styles: child selectors, custom properties and keyframes() names'
status: completed
type: feature
priority: normal
created_at: 2026-10-08T09:42:19Z
updated_at: 2026-10-08T11:10:37Z
---

Found by the tier-1 plugins (cssints-dk1q). Repros in cssints-kg3q and cssints-11pj under "## Engine gaps".

A kernel written as styles (`css: (css) => [...]`) cannot:
1. target children (`& > *`, `& > :last-child`): layout puts Every Layout's child rules in a second, raw kernel `-base`.
2. set a custom property (defaults like `--layout-stack-gap: 1rem`): also in `-base`, so two kernel classes per call.
3. carry a `keyframes()` name: motion's kernel is raw CSS and reads untyped internals of the keyframes value (`kernel.css`, `name`); its conflicts are an explicit list instead of derived.

## Todo
- [x] a child/descendant condition in kernel styles
- [x] custom properties in kernel styles (unchecked value, like emit)
- [x] keyframes() values allowed in kernel styles, registering the @keyframes rule
- [x] fold layout's -base into -core; motion back to a styles kernel with derived conflicts

## Summary of Changes

- The `css` a kernel written as styles gets two members user code does not have (`KernelCss` in scope.ts): `nest("& > *")`, a condition on other elements relative to the kernel class (selector starts with `&` and a combinator; checked at build as a selector; conditions inside apply to those elements, around it to the element), and `vars({ "--_x": v })`, custom properties with unchecked values.
- A `keyframes()`/`positionTry()` name in a kernel's styles (in `vars()` or any declaration) carries its at-rule kernel with the kernel (scope-engine `atRules`, pushed into the carry).
- Derived conflicts leave out custom properties and `nest()` rules.
- Kernel rules of two nested selectors under the same conditions are grouped per selector, not interleaved by property.
- layout: one kernel per primitive (`-base` gone, one class less per call); motion: a styles kernel that names its keyframes in `--motion-in/out/ri/ro`, presets emit `var(--motion-in)`, conflicts derived (`kernel core sets animation, animation-name`).
- Tests: scope.mjs (nest, vars, keyframes, conflicts, errors), types/scope.ts, layout.mjs and motion.mjs updated. Docs: API.md Plugins, the READMEs, wayfinder.
- Note: `bunx vp lint` reports pre-existing errors elsewhere (scope-engine `as never` casts, sky, scripts); none on the lines changed here.
