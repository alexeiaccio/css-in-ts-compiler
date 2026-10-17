---
# cssints-6ctt
title: '@cssints/gradient-2d: meshGradient() plugin with a native switch and a runtime polyfill; own BCD keys'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-17T10:14:28Z
updated_at: 2026-10-17T13:50:00Z
---

User (2026-10-17): mesh first, as a scope() plugin; BCD entries with version_added: false are fine, an own key too. Design: docs/research/2d-gradients.md (cssints-sh52).

- [x] own BCD keys for mesh-gradient() and freeform-gradient() (css-grammar support.ts get(): a small table that real BCD overrides), so polyfills/requires/script work
- [x] package @cssints/gradient-2d (24th of the fixed group): meshGradient(), the syntax checked, the fallback, the @supports native branch
- [x] the runtime (plain code, no Effect) that draws the mesh (bicubic patches) when the browser has no native function
- [x] tests (maths in Node, build output, Chrome read-back), README, docs/API.md Plugin packages, changeset, RELEASING.md counts

## Engine gaps

- **The BCD path of gradient functions is `css.types.gradient.<name>`**, not `css.types.image.gradient.<name>` (BCD 8.1.3 has `css.types.gradient` and no `gradient` under `image`). The table uses the real path.
- **A grammar cannot take the spec's mesh text.** The twin splits on whitespace, so a `;` glued to a stop is one token. Repro: `args: "<color>#[ ; <color>#]*"` on `"red, blue; green, yellow"` fails with `unexpected "blue;"`; with spaces (`"red, blue ; green, yellow"`) it passes, which is not the spec's text. Workaround: `args: arg<string>()`, and the build parses the rows and reports the errors (the rows' lengths, the colours, `by`/`with`). The same gap is in other grammars that glue punctuation (`1/2`); a tokenizer that splits `,`, `;` and `/` out of words would close it.
- **A script's gate follows the table.** Until a browser ships the function, every browserslist target with a tracked browser lacks `css.types.gradient.mesh-gradient`, so the runtime is in every build that uses the plugin. When BCD gets the key, the runtime ships only to the targets that lack it.
- **`dist/` of the package is not tracked** (the `.gitignore` tracks four packages' dist: cssints, css-grammar, icons, mise-en-mode), as balance and gradient.
