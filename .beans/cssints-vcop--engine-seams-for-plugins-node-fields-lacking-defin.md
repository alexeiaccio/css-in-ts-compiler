---
# cssints-vcop
title: 'Engine seams for plugins: node fields, lacking(), definition sites, generic Valid'
status: completed
type: task
priority: normal
tags:
    - wayfinder:task
created_at: 2026-09-30T11:57:32Z
updated_at: 2026-09-30T13:51:47Z
parent: cssints-9js6
---

## Question

The internal seams the research (plugins.md §4.2, §8) put before any public API; only `addGlobal` shipped in 0.1. They do not depend on the public shape, so they go first:

- the style node carries `markers` and `kernels` next to its declarations; `cn()` merges them; `__site` prints markers into the class string; the sheet registers kernels by key (`addGlobal` grows `atProperty`), a sheet without plugins stays byte-identical;
- `lacking(bcdKey, targets)` exported next to `support()` (the inner `lacks()`, same rules);
- definition sites: a build-time module may hold plugin values (functions, plugin objects) from an attributed call, and `__site` no longer throws on them;
- (moved to "Implement the public plugin API", 2026-09-30: the generic `Valid<Label, G, S>` touches css.ts, which the error-DX spike is changing)

Each seam gets one test through a test-only kernel/member. Answer: the merged seams, the budget numbers.

## Todo

- [x] Style node: markers and kernels next to the declarations; cn() and conditions merge them; __site prints markers; kernels registered by key, used by a module and recorded per module
- [x] Collisions: same key with other css, two keys declaring one custom property, two keys printing one marker: MacroError at the call site
- [x] lacking(bcdKey, targets) in css-grammar; `requires` gives a support warning
- [x] Definition sites: a plugin value (function or object) from an attributed call is not an error and has no replacement
- [-] Generic Valid<Label, G, S>: moved to the public plugin API ticket (see Question)

## Summary of Changes

- **Node** (lib.ts, macro.ts): `CssNode` gains `markers: [marker, kernelKey][]` and `kernels: Kernel[]` (`{ key, css, atProperty?, requires? }`, type in registry.ts). `cn()` and the condition wrappers merge them with `carried()` (markers by pair, kernels by identity); chained nodes keep them; `style()` rejects a node that has them. `__site` prints the markers first in the class string.
- **Sheet** (kernel.ts, sheet.ts, plugin.ts, registry.ts): `addKernel` registers a kernel on first use (`registry.kernels`, with the files that use it; `forget(file)` drops them). A module records `@kernel` entries like its theme entries, so a sheet holds exactly the kernels of its modules; `renderSheet` puts `atProperty` after the tokens' `@property` rules and kernel css in `_.k` after the globals. A sheet without kernels is unchanged; the demo CSS is byte-identical (same hash, 4920 bytes). `addGlobal` is untouched: its rules are for every sheet, a kernel's are per module.
- **Collisions**: three MacroError texts, each with the call site (test/seams.mjs).
- **lacking** (css-grammar support.ts): `lacking(key, targets?)` (Effect) and `lackingOf` (plain); the inner `lacks` moved out and is shared with `supportOf`. `requires` warns once per build: `kernel box@1 needs <feature>, not supported by chrome .., firefox ..`.
- **Definition sites** (macro.ts): `replacementOf` returns undefined for a function or object, `recordSite` records nothing; a client module's `mdi("home")` is an ordinary site.
- **Gap found**: a declaration of a custom property (`--_r`) fails the grammar check ("no grammar for this property"), which the public `context()` emit will need.
