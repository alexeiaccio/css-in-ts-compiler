---
# cssints-vma0
title: 'scope(): conflicts derived from style kernels, conditions in style kernels'
status: completed
type: feature
priority: normal
created_at: 2026-10-05T11:27:20Z
updated_at: 2026-10-05T11:45:03Z
parent: cssints-easl
---

Left from cssints-8ogz: a kernel written as css.* styles does not derive its conflicts (the author writes conflicts by hand) and takes no conditions (only blockOf and css reach a style kernel). Derive the conflict props from the style kernel's declarations (with longhands, as cn() overlap does), overridable by an explicit conflicts entry; allow conditions (hover, media, container, supports, attr) inside a style kernel, rendered under the kernel's class. Tests, API.md, budgets.

- [x] conflicts of a kernel written as styles derived from its declarations (cn() overlap, longhands), a conflicts entry in uses replaces them, message names scope, kernel and property
- [x] conditions (pseudo-classes, attr, within, media, container, supports) inside a style kernel, printed under its class in sheet order
- [x] tests (test/scope.mjs, fixtures scope-kit/scope-use, test/types/scope.ts), API.md Plugins, budgets unchanged

## Summary of Changes

- **Derived conflicts.** A kernel written as `css: (css) => styles` gets a conflict from the properties it sets: every property that meets one of them as cn() decides (same, a longhand, a shorthand over it, a logical or physical sibling) is a build error when it goes into the same cn() as a member that uses the kernel, under any condition: `cssints: sk: kernel core sets outline, outline-offset (this style also sets outline-color)`. A conflicts entry among the member's uses replaces the derived ones; a raw kernel derives nothing. scope-engine.ts (`Compiler.derived`, `carry`).
- **Conditions in a style kernel.** macro.ts `kernelOf`: the styles go through the same ordering as the sheet (byOrder, now exported) and print as `.<marker>{...}` blocks with their at-rules, in layer _.k; fallbacks and member markers stay errors.
- **Migrated.** The ring kernel of test/fixtures/scope-kit.ts lost its hand-written noOutline (derived: outline, outline-longhands, outline-offset). frame and surface are raw CSS with custom properties and @container rules, which css.* cannot write, so they derive nothing and keep their explicit conflicts (frame's lets border-color through).
- **Budgets** unchanged (plugins.ts 76639/87179 against 76647/86987, no type code touched); perf.mjs not run: no per-site path changed (derivation is cached per scope entry).
