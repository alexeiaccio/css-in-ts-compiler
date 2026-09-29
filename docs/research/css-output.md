# CSS output: how atomic libraries emit, order and ship CSS in Vite

Ticket cssints-wx85. This file covers the output pipeline only: how CSS reaches the page. The API comparisons in the other files of `docs/research/` are not repeated here. Checked on 2026-09-29 against these sources: StyleX `fe0be7f`, vanilla-extract `28767ea`, Panda `e559289` (2.0 beta; 1.12.1 is the current `latest` on npm), Tailwind `fa81d69`, UnoCSS `f05ee3a`, Vite `v8.3.1`, lightningcss 1.33.0.

## Our engine today (baseline)

- `packages/cssints/src/plugin.mjs` gives each source module one virtual CSS module, `\0cssints.css?file=<id>&v=<hash>`. This module holds only the rules that the source module uses, and each rule is `@layer _.a{.cls{prop:val}}` (`src/macro.mjs:98`). The app imports `cssints/layers.css` (`@layer _.a, _.b, _.c, _.d, _.e;`) first, in `apps/demo/src/main.tsx`.
- The id ends in `.css?…`, so Vite treats it as a normal CSS module. `css.transformer: "lightningcss"` runs on each module in dev and in build. In dev, each module becomes a `<style>` that accepts its own updates, through `__vite__updateStyle` ([vite css.ts:633][vt-hmr]). When a rule set changes, the `&v=` hash changes, and Vite prunes the old module.
- In build, Vite joins the CSS of all modules in a chunk in module order ([css.ts:718][vt-concat]). Then `build.cssMinify` runs **once per output CSS file** ([`finalizeCss`][vt-finalize]).
- **Measured on `apps/demo`:** the build without minify has 85 rule occurrences, and 14 classes appear more than once. With `cssMinify: "lightningcss"`, the output has 70 unique rules and 0 duplicates. LightningCSS merges `@layer _.a{}` blocks that have the same name, and inside the merged block it keeps the **last** copy of each identical rule. This also works for `@layer _.c{@media …{}}`. It does **not** remove duplicate top-level `@media` blocks when they are not in a layer.
- LightningCSS keeps the `@layer` order statement correct inside one sheet. `@layer _.a,_.b,_.c,_.d,_.e;` plus blocks in the order `_.c`, `_.a` becomes `@layer _.a{…}@layer _.b;@layer _.c{…}@layer _.d,_.e;`. Without the statement, the first block that appears sets the order (`_.b` before `_.a` means `_.b` loses). See the same case in [vite#22705][vite-22705], which was closed as "that is how CSS layers work". So `layers.css` must come first in the entry chunk's sheet.

## Comparison

| | StyleX (`@stylexjs/unplugin`) | vanilla-extract (`@vanilla-extract/vite-plugin`) | Panda (`@pandacss/vite` 2.0 beta) | Tailwind v4 (`@tailwindcss/vite`) | UnoCSS (`unocss/vite`) |
|---|---|---|---|---|---|
| Sheets | One global sheet | One virtual `*.css.ts.vanilla.css` per `.css.ts` file | One: the CSS file that holds the Panda `@layer` statement becomes the root | One per CSS root file (the file that has `@import "tailwindcss"`) | `global` (default): one `uno.css`. Other modes: `per-module`, `dist-chunk`, `vue-scoped`, `shadow-dom` |
| How rules are collected | Babel transform per module, stored as `rulesById` ([core.js:254][sx-store]) | Each `.css.ts` runs in a Vite-node/Module Runner compiler, and `appendCss` collects the rules for each file scope ([compiler.ts:400][ve-append]) | Rust driver scans and parses all source files at `configResolved` (not in `transform`) | Rust `Scanner` reads all source files for candidates | `transform` pushes tokens from each module, and a file-system content extractor adds more |
| Dedupe across modules | `Map` from class to rule over all modules ([index.js collectRules][sx-sort]) | Not needed: classes are scoped to a file. Sprinkles atoms are defined once in their own `.css.ts` | Global atom set | Global candidate set | Global token set (`global`). `per-module` repeats rules in every module |
| Order | Sort by numeric priority (property priority + sum of pseudo and at-rule priorities), then property name, then media width, then text ([index.js:679][sx-sort]). Groups `floor(priority/1000)` become `@layer priorityN` or `:not(#\#)` × N specificity boosts ([index.js:842][sx-group]) | Conditional rules of one file merge into ordered blocks after the base rules ([conditionalRulesets.ts][ve-cond]). The order between files follows the import graph | `sort.rs`: rule bucket (base, then selector, then at-rule), at-rule kind with size queries by resolved length, pseudo priority table, property priority, then deterministic ties ([stylesheet.md "Ordering"][pd-order]) | Variant order (a bigint bitmask of the variant registration order), then the lowest property index, then the property count, then the candidate ([compile.ts:83][tw-sort]) | Parent (at-rule) order (`parentOrder`, breakpoints `3000±i`), then the rule index, then the variant sort, then the selector ([generator.ts:419][un-sort]) |
| `@layer` | Off by default (`useCSSLayers`). On: `@layer priority1..N`; off: the specificity hack | Only user layers (`layer()`, `globalLayer()`) | `reset, base, tokens, recipes, utilities`, with an optional polyfill that flattens layers into `:not(#\##…)` ranks | `theme, base, components, utilities` ([index.css][tw-layers]) | Off by default. `outputToCssLayers` wraps each Uno layer ([docs][un-layers]) |
| Optimizer | The plugin itself runs LightningCSS on the **whole sheet** each time it collects ([core.js:63][sx-lc]). Vite minify runs again on the asset | Vite's pipeline for each virtual module, then `cssMinify` on each chunk | The native writer only minifies whitespace. The v2 `lightningcss` option is removed, so the job goes to the bundler ([upgrading-to-v2][pd-v2], [optimization][pd-min]) | In build, the plugin runs LightningCSS **twice** on each root (a second pass merges rules after nesting is lowered; [optimize.ts:58][tw-opt]). In dev it does not | Vite pipeline on the layer CSS. Optional `@unocss/processor-lightningcss` runs on each layer ([source][un-lc]) |
| Dev HMR | Not a Vite CSS module: a `/virtual:stylex.css` middleware plus a client runtime that polls the shared store every 150 ms, gets a custom `stylex:css-update` ws event, and fetches the whole sheet again ([vite.js:61][sx-dev], [consts.js][sx-rt]). The user adds a `<link>` or an import to the HTML shell | Vite CSS HMR on the virtual module. `handleHotUpdate` walks the importer tree and invalidates the dependent virtual CSS ([index.ts:347][ve-hmr]) | `hotUpdate` invalidates the root CSS module, so Vite CSS HMR works. Config edits cause a full reload ([index.ts:196][pd-hmr]) | `addWatchFile` for every scanned file on the root CSS module ([index.ts:469][tw-watch]). Editing a `.tsx` transforms the CSS root again and sends a CSS update | Virtual CSS with a `__uno_hash_` marker. The client sends the hash back over ws, and the server sends `js-update` for the virtual module ([dev.ts:171][un-dev]) |
| Build output | Appends to an existing CSS asset (`index.css`/`style.css`/the first one) in `generateBundle` and hashes it again ([vite.js:160][sx-gen]) | Per-chunk CSS (Vite `cssCodeSplit`) | The CSS root follows Vite | The CSS root follows Vite | `global`: a placeholder module is filled in `renderChunk` by calling `vite:css-post`'s transform handler ([build.ts:188][un-build]). `dist-chunk`: one sheet per chunk ([chunk-build.ts][un-chunk]) |
| Code splitting | No, one global sheet | Yes, CSS goes with the chunk that imports it | No | No | No in `global`. Yes in `dist-chunk` (experimental) |

### Problems each library hit

| Library | Problem | Link |
|---|---|---|
| StyleX | Appending and renaming the asset after Vite hashed it: with `cssCodeSplit: false`, the CSS file name does not change after a StyleX-only edit, so caches serve a stale sheet | [stylex#1889][sx-1889] |
| StyleX | The dev polling timer and file handles leak under Vitest | [stylex#1533][sx-1533] |
| vanilla-extract | Per-file CSS from libraries loads out of order in dev (the dep optimizer), but not in build. The suggested workaround is `@layer` | [ve#1376][ve-1376] |
| vanilla-extract | `composedClassLists` order was wrong on the new Vite compiler | [ve#1430][ve-1430] |
| Panda | HMR was slow when the whole sheet was generated again on every change (v0.22–0.25) | [panda#1966][pd-1966] |
| Tailwind | Scanned files that are not loaded modules forced a full reload on Vite 8 | [tw#20320][tw-20320] |
| UnoCSS | Global-mode HMR broke on Vite 8.3 (the client registry key changed), so the plugin now sends both path forms | [uno#5331][un-5331], [uno#5346][un-5346] |
| Vite (anyone with per-module CSS) | The CSS order after build differs from dev with dynamic imports, `manualChunks` or auto-imported styles | [vite#3924][vite-3924], [vite#6375][vite-6375], [vite#21903][vite-21903] |

## What this means for us

1. **Dedupe is already solved in build.** Vite's `cssMinify: "lightningcss"` removes duplicates inside each output sheet (measured above). In dev, duplicates cost nothing, because a copy has the same text. Copies across chunks stay (bytes only).
2. **Order is not solved by per-module CSS.** `@layer _.a.._.e` fixes the priority between condition depths. Inside one layer, the order is still the order in which modules are joined, and dedupe then keeps the last copy. Two real cases break:
   - Breakpoint ladders: `md(p(2))` and `lg(p(4))` are both in `_.c`. If module A has only the `lg` rule and module B, joined later, has the `md` rule, then `md` wins above 60rem.
   - Shorthand versus longhand: `p(4)` and `pl(2)` are both in `_.a`. If `p` comes last, it wins over `pl`.

   Every atomic library sorts over a **global** view to fix this: StyleX uses a priority number plus media width, Panda uses `sort.rs`, Tailwind uses the variant bitmask plus property order, and UnoCSS uses the parent order. None of them relies on the order of modules. This also affects the "cn conflict resolution" item on the map.
3. **The optimizer needs no code from us.** A virtual module with a `.css` id already goes through `css.transformer` (for each module) and `build.cssMinify` (for each output file). StyleX and Tailwind call LightningCSS themselves only because they build sheets outside Vite's CSS pipeline, or before minification.
4. **HMR.** The Vite CSS module path (`updateStyle`, which accepts its own updates) is the least code (vanilla-extract, Panda, Tailwind). StyleX's polling runtime and UnoCSS's hash ping are workarounds that they need because their sheet is not a normal CSS module, or because it must wait for tokens.

## Options

| | A. Per-module CSS (today) plus a sort inside each module | B. One global sorted sheet (`virtual:cssints.css`) | C. Per-module rules plus a global layer-order module |
|---|---|---|---|
| Shape | As now; rules inside each module sorted by the key | One virtual CSS module, imported once from the entry (it replaces `cssints/layers.css`). Content: the layer statement, then every rule in the registry, sorted by (layer, condition key such as min-width ascending or the pseudo table, property priority, class) | Each condition gets a sublayer `_.c.<key>`. A small global module holds `@layer _.a, _.b, _.c.<sorted keys…>, _.d, _.e;` |
| Order correct across modules | No (the two cases above) | Yes, same as StyleX, Panda, Tailwind and UnoCSS | Yes for conditions. No for shorthand versus longhand inside one sublayer, unless property priority also becomes a sublayer |
| Dedupe | cssMinify per chunk (works) | By construction (a Map keyed by class) | cssMinify per chunk |
| Dev HMR | Works today | Invalidate the one module after each transform that changes the rule set (debounced, as UnoCSS does in 10 ms). Vite CSS HMR replaces one `<style>`, with no reload. The first paint can miss rules from modules that are not transformed yet, until the next update | Works today for rules. The order module also updates when a new condition appears |
| Build | Works today | Sheet content is known only after all transforms. Fill it late: a placeholder module filled in `renderChunk` through `vite:css-post` (the UnoCSS pattern, which keeps Vite's hashing and minify) or appended in `generateBundle` (StyleX, which renames the asset itself: stylex#1889). Or pre-evaluate every `cssints` file in `buildStart` (the Tailwind and Panda scanning model; this costs one extra evaluation per file) | The small order module has the same late-fill problem |
| Code splitting | Per-chunk CSS | None. All rules go in the entry sheet. For atomic CSS the sheet grows slowly with app size, which is the StyleX argument | Per-chunk CSS |
| Code | 0 lines plus a sort | Around 60–100 lines: registry per file, sort key, invalidate, late fill | Most: sublayer naming, order module, late fill; more noise in DevTools |

## Recommendation

**B: one global sorted sheet.** All four atomic libraries chose it for the same reason. Order inside a layer needs a global sort, and per-module CSS cannot give one. We keep what already works. The rules stay a Vite CSS module, so `css.transformer` and `cssMinify` (LightningCSS) do the optimization, and Vite CSS HMR updates the sheet without a reload. Dedupe then comes for free. What we lose is per-chunk CSS, and that matters little for atomic output.

Implementation notes for the follow-up ticket:

- Registry per file: `cssById` is already there; make it a `Map<file, Set<class>>`. The sheet is the sorted union.
- Sort key: layer (condition depth, as today), then the condition key (media min-width ascending, pseudo order as in the StyleX `PSEUDO_CLASS_PRIORITIES` table), then property priority (shorthand of shorthand, shorthand, longhand), then class.
- Build: start with the UnoCSS `renderChunk` placeholder fill. If that turns out to be fragile across Vite versions, change to a `buildStart` pre-evaluation.
- Keep option A (today's code) until B lands. It is correct as long as no one uses two same-depth conditions, or a shorthand and its longhand, on one element across modules.

[vt-hmr]: https://github.com/vitejs/vite/blob/v8.3.1/packages/vite/src/node/plugins/css.ts#L633
[vt-concat]: https://github.com/vitejs/vite/blob/v8.3.1/packages/vite/src/node/plugins/css.ts#L718
[vt-finalize]: https://github.com/vitejs/vite/blob/v8.3.1/packages/vite/src/node/plugins/css.ts#L1993
[vite-22705]: https://github.com/vitejs/vite/issues/22705
[vite-3924]: https://github.com/vitejs/vite/issues/3924
[vite-6375]: https://github.com/vitejs/vite/issues/6375
[vite-21903]: https://github.com/vitejs/vite/issues/21903
[sx-store]: https://github.com/facebook/stylex/blob/fe0be7f0e76ccc585385f0fa56d9b50053ff9ca2/packages/@stylexjs/unplugin/src/core.js#L254
[sx-lc]: https://github.com/facebook/stylex/blob/fe0be7f0e76ccc585385f0fa56d9b50053ff9ca2/packages/@stylexjs/unplugin/src/core.js#L63
[sx-sort]: https://github.com/facebook/stylex/blob/fe0be7f0e76ccc585385f0fa56d9b50053ff9ca2/packages/@stylexjs/babel-plugin/src/index.js#L679
[sx-group]: https://github.com/facebook/stylex/blob/fe0be7f0e76ccc585385f0fa56d9b50053ff9ca2/packages/@stylexjs/babel-plugin/src/index.js#L842
[sx-dev]: https://github.com/facebook/stylex/blob/fe0be7f0e76ccc585385f0fa56d9b50053ff9ca2/packages/@stylexjs/unplugin/src/vite.js#L61
[sx-rt]: https://github.com/facebook/stylex/blob/fe0be7f0e76ccc585385f0fa56d9b50053ff9ca2/packages/@stylexjs/unplugin/src/consts.js
[sx-gen]: https://github.com/facebook/stylex/blob/fe0be7f0e76ccc585385f0fa56d9b50053ff9ca2/packages/@stylexjs/unplugin/src/vite.js#L160
[sx-1889]: https://github.com/facebook/stylex/issues/1889
[sx-1533]: https://github.com/facebook/stylex/issues/1533
[ve-append]: https://github.com/vanilla-extract-css/vanilla-extract/blob/28767ea1feb44a97168e3150877a68e3ea842ba0/packages/compiler/src/compiler.ts#L400
[ve-cond]: https://github.com/vanilla-extract-css/vanilla-extract/blob/28767ea1feb44a97168e3150877a68e3ea842ba0/packages/css/src/conditionalRulesets.ts#L128
[ve-hmr]: https://github.com/vanilla-extract-css/vanilla-extract/blob/28767ea1feb44a97168e3150877a68e3ea842ba0/packages/vite-plugin/src/index.ts#L347
[ve-1376]: https://github.com/vanilla-extract-css/vanilla-extract/issues/1376
[ve-1430]: https://github.com/vanilla-extract-css/vanilla-extract/issues/1430
[pd-order]: https://github.com/chakra-ui/panda/blob/e55928973593e315e11d5340d51d2e7d266b3441/design-notes/stylesheet.md#ordering
[pd-hmr]: https://github.com/chakra-ui/panda/blob/e55928973593e315e11d5340d51d2e7d266b3441/packages/vite/src/index.ts#L196
[pd-v2]: https://github.com/chakra-ui/panda/blob/e55928973593e315e11d5340d51d2e7d266b3441/website/content/docs/get-started/upgrading-to-v2.mdx
[pd-min]: https://github.com/chakra-ui/panda/blob/e55928973593e315e11d5340d51d2e7d266b3441/website/content/docs/styling/optimization.mdx
[pd-1966]: https://github.com/chakra-ui/panda/issues/1966
[tw-sort]: https://github.com/tailwindlabs/tailwindcss/blob/fa81d697fe572a10ac150d18964a093a7a874081/packages/tailwindcss/src/compile.ts#L83
[tw-layers]: https://github.com/tailwindlabs/tailwindcss/blob/fa81d697fe572a10ac150d18964a093a7a874081/packages/tailwindcss/index.css
[tw-opt]: https://github.com/tailwindlabs/tailwindcss/blob/fa81d697fe572a10ac150d18964a093a7a874081/packages/@tailwindcss-node/src/optimize.ts#L58
[tw-watch]: https://github.com/tailwindlabs/tailwindcss/blob/fa81d697fe572a10ac150d18964a093a7a874081/packages/@tailwindcss-vite/src/index.ts#L469
[tw-20320]: https://github.com/tailwindlabs/tailwindcss/issues/20320
[un-sort]: https://github.com/unocss/unocss/blob/f05ee3a9ed0e1d4490aa7f04fc7aef4bd0babb15/packages-engine/core/src/generator.ts#L419
[un-layers]: https://github.com/unocss/unocss/blob/f05ee3a9ed0e1d4490aa7f04fc7aef4bd0babb15/docs/config/layers.md
[un-lc]: https://github.com/unocss/unocss/blob/f05ee3a9ed0e1d4490aa7f04fc7aef4bd0babb15/packages-presets/processor-lightningcss/src/index.ts
[un-dev]: https://github.com/unocss/unocss/blob/f05ee3a9ed0e1d4490aa7f04fc7aef4bd0babb15/packages-integrations/vite/src/modes/global/dev.ts#L171
[un-build]: https://github.com/unocss/unocss/blob/f05ee3a9ed0e1d4490aa7f04fc7aef4bd0babb15/packages-integrations/vite/src/modes/global/build.ts#L188
[un-chunk]: https://github.com/unocss/unocss/blob/f05ee3a9ed0e1d4490aa7f04fc7aef4bd0babb15/packages-integrations/vite/src/modes/chunk-build.ts
[un-5331]: https://github.com/unocss/unocss/issues/5331
[un-5346]: https://github.com/unocss/unocss/issues/5346
