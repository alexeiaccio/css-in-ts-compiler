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
- `node scripts/starter-smoke.mjs` — copies `templates/solid-vite` into a temporary project, installs it with the packages
  of this checkout (tarballs packed from `packages/`, so a kit change is checked before its release), adds every item of
  `r/` from a local server, runs the copied conformance tests, type-checks the copy, and adds `@cssints/switch` from the
  live registry last: the whole chain a reader meets, on this commit.

The theme (`src/registry/theme.ts`, `tokens.ts`) is tokens-as-code; `scripts/theme-css.ts` compiles the same data to plain
custom properties for a project that has no cssints plugin.

## The no-JS contract

`src/registry/tabs/tabs.tsx` exports `TabsFallback`: a list of in-page links, then a heading and the full content per
section, with no script. This site is a Vite SPA and has no prerender step, so the **host's server renders the fallback**
and removes it when the interactive `Tabs` mounts. `src/registry/tabs/tabs.browser.test.tsx` is the contract: the static
markup alone reaches all four sections, the tabs keep all four contents, and the fallback never shares the accessibility
tree with the tabs.

The same skin's `narrow` mode renders those sections as an accordion, one open, below the host's 800 px breakpoint
(`matchMedia("(max-width: 799px)")` in `tabs.fixture.tsx`); the primitive is untouched.
