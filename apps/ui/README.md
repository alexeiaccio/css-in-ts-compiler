# The starters' site

The registry items, one page each: a live preview on the neutral theme, the source that ships, the add command, a tint
picker and the preflight result the published copy passed. `src/docs/catalog.ts` reads the registry build (`r/*.json`), so
a page cannot describe an item that was not generated.

- `bun run dev` — the site and the components' browser tests share `vitest.browser.config.ts`; `bun run test` runs the
  conformance of every starter in this directory and of any copy in `src/components/ui/`.
- `node scripts/registry-json.ts` — regenerates `r/<name>.json`, `r/registry.json` and `public/llms.txt` after a component
  or its styles change. Publishing is `apps/registry-host` in effects-of-atmosphere: it builds each item into one signed
  `ing.lexicon.plugin.release`, runs the copied test first, and stages the artifacts.
- `node scripts/starter-smoke.mjs` — copies `templates/solid-vite` into a temporary project, installs it, adds
  `@cssints/switch` from the live registry and runs the copied test: the whole chain a reader meets.

The theme (`src/registry/theme.ts`, `tokens.ts`) is compiled to plain custom properties by `scripts/theme-css.ts`; the
starters' own sheets read those variables and never a cssints macro, because a copied component has to run in a test
runner as well as in a build.
