# The starters' site

The registry items, one page each: a live preview on the neutral theme, the source that ships, the add command, a tint
picker and the preflight result the published copy passed. `src/docs/catalog.ts` reads the registry build (`r/*.json`), so
a page cannot describe an item that was not generated.

The preview is the item's CSF story where the item has one (four so far: button, switch, tabs, accordion); the rest still
show the hand-written demo in `src/docs/demos.tsx`. `src/registry/<name>/<name>.stories.tsx` is a Storybook CSF 3 file — a
default `meta` (title, `component`, `args`, `argTypes`) and one object per named export — so a story file moves into a real
Storybook unchanged. `src/stories/load.ts` turns the modules into entries with Storybook's ids (`button--accent`), and the
id is the hash, so a story is a link. A story's `argTypes` declares the controls under the canvas
(`src/stories/controls.tsx`, on the kit's own Field, Select, Switch and Slider); a story that declares none shows no panel.
The shell is the kit too: the story switcher is `Tabs`, the theme switch a `Switch` writing the theme's `data-mode` scope,
the tint a `RadioGroup`, the copies `Button`s.

- `bun run dev` — the site and the components' browser tests share `vitest.browser.config.ts`; `bun run test` runs the
  conformance of every starter in this directory and of any copy in `src/components/ui/`.
- `bun run test:site` — the site itself in Chrome: the story tabs and their ids, a control remounting the story, the theme
  switch and the tint group (a dev-server test, so it is not part of `test`).
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
