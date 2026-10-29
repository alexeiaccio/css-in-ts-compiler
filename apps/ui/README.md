# The starters' site

The registry items, one page each: a live preview on the neutral theme, the source that ships, the add command, a tint
picker and the preflight result the published copy passed. `src/docs/catalog.ts` reads the registry build (`r/*.json`), so
a page cannot describe an item that was not generated.

- `bun run dev` — the site and the components' browser tests share `vitest.browser.config.ts`; `bun run test` runs the
  conformance of every starter in this directory and of any copy in `src/components/ui/`.
- `node scripts/registry-json.ts` — regenerates `r/<name>.json`, `r/registry.json` and `public/llms.txt` after a component
  changes (a component is one `.tsx` that styles itself; `node scripts/theme-css.ts > src/registry/theme.css` recompiles the
  theme for a project without the plugin). Publishing is `apps/registry-host` in effects-of-atmosphere: it builds each item into one signed
  `ing.lexicon.plugin.release`, runs the copied test first, and stages the artifacts.
- `node scripts/starter-smoke.mjs` — copies `templates/solid-vite` into a temporary project, installs it, adds
  `@cssints/switch` from the live registry and runs the copied test: the whole chain a reader meets.

The theme (`src/registry/theme.ts`, `tokens.ts`) is tokens-as-code; `scripts/theme-css.ts` compiles the same data to plain
custom properties for a project that has no cssints plugin.
