---
# cssints-q83n
title: A kernel-only member under a condition loses the condition silently
status: completed
type: bug
priority: high
created_at: 2026-10-08T14:10:21Z
updated_at: 2026-10-08T14:40:33Z
---

Found by balance (cssints-q6il, repro under "## Engine gaps"). `hover(pretty())` applies everywhere, with no error: a member whose style is only a kernel marker has no class of its own for the condition to wrap.

## Todo
- [x] decide: a build error (`pretty() has no declarations a condition can wrap`) or emit the kernel's declarations under the condition
- [x] fix at the root (conditions over a style with only markers), a fixture

## Decision

A build error at the call. A kernel is global CSS keyed to its marker class, registered once and shared by every site, so it cannot be conditional per site. Making it conditional would take a second copy of the kernel's CSS under a minted class per condition chain (rewriting the selectors of a raw-CSS kernel), for a case that already has a plain answer: the property itself under the condition (`hover(css.textWrap("pretty"))`), or the member outside and its methods inside. A member with declarations of its own under a condition (`hover(frame().padding(2))`) stays as it is: its custom properties are conditional, the marker is not, and the kernel only reads them. So the error is only for markers that came with no declaration: `pretty()`, `frame()` with no method, `group()`.

Where: every condition (pseudo-classes, attr(), within(), media(), container(), supports(), nest()) goes through `wrapper` in macro.ts, the one place. `carried()` (lib.ts) now keeps such markers as `bare` on the merged node, so the error also reaches `cn(frame(), color(...))` under a condition, `hover(frame(), color(...))`, nested conditions and `cv()` variants (built of the same wrappers).

Types: not rejected. In user code a member is a class string; telling a marker-only one apart would need a brand on every member's return type. Build error only.

## Summary of Changes

- `wrapper` (packages/cssints/src/macro.ts), the one path of every condition, throws a located `MacroError` when a style it wraps carries a marker with no declaration of its own: `cssints: :hover wraps _balance-prettyCore, the marker of kernel balance.prettyCore, with no declaration of its own: a kernel is global CSS keyed to its marker class and cannot be conditional, so the marker would apply everywhere. Put the member outside the condition; a condition can wrap the declarations a member sets (its methods)`.
- `carried()` (lib.ts) keeps those markers as `bare` (a new `CssNode`/`Carry` key, node.ts), so `cn()` mixing, several styles in one condition, nested conditions and `cv()` variants are caught too.
- Tests: frame.mjs (hover(frame()), via cn, beside a style, nested in media, within(), a cv() variant: errors at the call; hover(frame().padding(2)) and frame() outside with a condition on a method: fine), balance.mjs (hover(pretty())).
- Docs: API.md (Conditions and layers, Plugins/Kernels), wayfinder entry, balance README limit.
- Types: not rejected (a member is a class string in user code); build error only.
- bun run test, typecheck green; lint clean on the touched files; perf seq within noise.
