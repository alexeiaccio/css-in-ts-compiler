# The starters' site

The registry items, one page each: a live preview on the neutral theme, the source that ships, the add command, a tint
picker and the conformance record the starter smoke wrote for the item's files. `src/docs/catalog.ts` reads the registry
build (`r/*.json`), so a page cannot describe an item that was not generated.

The preview is the item's CSF story. `src/registry/<name>/<name>.stories.tsx` is a Storybook CSF 3 file — a
default `meta` (title, `component`, `args`, `argTypes`) and one object per named export — so a story file moves into a real
Storybook unchanged; every one of the 54 pages has a story file (`theme` is the 55th registry entry and has none). `@cssints/stories` turns the
modules into entries with Storybook's ids (`button--accent`), and the
id is the hash, so a story is a link. A story's `argTypes` declares the controls under the canvas
(`src/stories/controls.tsx`, on the kit's own Field, Select, Switch and Slider); a story that declares none shows no panel.
The shell is the kit too: the story switcher is `Tabs`, the theme switch a `Switch` writing the theme's `data-mode` scope,
the tint a `RadioGroup`, the copies `Button`s. The rail's search is the kit's `Input`: `/` reaches it from anywhere but a
field, an item matches by its title or by one of its stories, and Escape clears it.

- `bun run dev` — the site and the components' browser tests share `vitest.browser.config.ts`; `bun run test` runs the
  conformance of every starter in this directory and of any copy in `src/components/ui/`.
- `bun run test:site` — the site itself in Chrome: the story tabs and their ids, a control remounting the story, the theme
  switch and the tint group (a dev-server test, so it is not part of `test`).
- `bun run test:forced` — the kit under `forcedColors` (Windows high contrast), emulated in Chrome: the mode takes every
  background, shadow and colour with it, so a button and a field must keep a solid border and the selected tab must keep a
  thicker underline than the unselected ones. That is the guard: a redesign that moves a boundary to a `box-shadow`, or the
  tab state to colour alone, fails here and nowhere else.
- `node scripts/registry-json.ts` — regenerates `r/<name>.json`, `r/registry.json` and `public/llms.txt` after a component
  changes (a component is one `.tsx` that styles itself; `node scripts/theme-css.ts > src/registry/theme.css` recompiles the
  theme for a project without the plugin). Publishing is `apps/registry-host` in effects-of-atmosphere: it builds each item into one signed
  `ing.lexicon.plugin.release`, runs the copied test first, and stages the artifacts.
- `node scripts/starter-smoke.mjs` — copies `templates/solid-vite` into a temporary project, installs it with the packages
  of this checkout (tarballs packed from `packages/`, so a kit change is checked before its release), adds every item of
  `r/` from a local server, runs the copied conformance tests, type-checks the copy, and adds `@cssints/switch` from the
  live registry last: the whole chain a reader meets, on this commit. It also writes `r/<name>.result.json` — the
  fingerprint (`src/docs/item-hash.ts`) of the files a passed item installed, which is what the page's Conformance
  section reads, and only while that fingerprint still matches the item.

The theme (`src/registry/theme.ts`, `tokens.ts`) is tokens-as-code; `scripts/theme-css.ts` compiles the same data to plain
custom properties for a project that has no cssints plugin.

## Writing a skin

A skin is a look that changes _shape_, not only values, and it is written in three levels:

- **tokens — the values.** `packages/tokens` holds the DTCG source; `scripts/theme-css.ts` compiles it to
  `src/registry/theme.css`. A skin that needs values of its own ships a token file beside its sheet:
  `hardware/tokens-01.css` turns one OKLCH key colour into `--key-ink`, `--key-cap`, `--key-lamp`, `--ring`, and the panel
  greys, hairs and shadows the sheet builds every rule from.
- **theme — a named set of those values.** `tokens.ts` is the light set, `darkTheme` and `forcedColorsTheme` are the others,
  and mise-en-mode exposes the dark one as the `[data-mode="dark"]` scope. A skin's own set is the block its token file
  declares under its `[data-skin="01"]` scope.
- **parts — the CSS that styles `data-part` names.** `hardware/skin.css` is the worked example: every rule scoped to
  `[data-skin="01"]`, styling `[data-part="key"]`, `[data-part="rocker-cap"]`, `[data-part="lcd-screen"]` and the markup the
  skin itself adds (`faceplate`, `key`, `fader`, …).

A skin styles parts, it does not reimplement them: the primitive owns the behaviour and puts `data-part` on the props it
ships, the skin owns the sheet and its own parts' markup. Both ways that seam can be crossed render — so
`bun run skin:check` (in this directory, and beside `theme:check` in the `ui` workflow) enforces the two rules:

- **every part a skin styles exists**: a `[data-part="x"]` in the skin's CSS must name a part some primitive in
  `packages/headless/src` emits, or one the skin's own `.tsx` declares. A name from neither matches no element.
- **every token a skin reads resolves**: a `var(--x)` outside the skin's own declarations must be declared by the skin's
  token file or by the theme layer. An undeclared read is `unset`, not an error, so a surface silently loses its paint.

The check scans the text of the skin's sheets, not a CSS parse, with comments and at-rule preludes blanked first. It does not
check contrast (that is `check.contrast` in `theme.ts`, per theme) and it does not know whether a part is used on the page —
only that it can be.

The **directory is the installable artifact**: `node scripts/registry-json.ts` emits `public/r/hardware.json` whose files are
the skin's `.tsx`, `skin.css`, `tokens-01.css` and its browser test — one registry item, `add hardware`, that arrives with the
token file it reads, leaning on `@cssints/theme` through `registryDependencies`. A skin is not a package.

## The no-JS contract

`src/registry/tabs/tabs.tsx` exports `TabsFallback`: a list of in-page links, then a heading and the full content per
section, with no script. This site is a Vite SPA and has no prerender step, so the **host's server renders the fallback**
and removes it when the interactive `Tabs` mounts. `src/registry/tabs/tabs.browser.test.tsx` is the contract: the static
markup alone reaches all four sections, the tabs keep all four contents, and the fallback never shares the accessibility
tree with the tabs.

The same skin's `narrow` mode renders those sections as an accordion, one open, below the host's 800 px breakpoint
(`matchMedia("(max-width: 799px)")` in `tabs.fixture.tsx`); the primitive is untouched.

## Charts: the accessibility bar

Every chart starter is held to the same checks, taken from Frank Elavsky's _Accessibility in Data Visualization_ (Open
Visualization Academy) and Chartability. A new chart copies them, and its test asserts them:

- **The data is the markup.** A list, a table or a meter with the numbers; the picture is decoration over it. With the
  stylesheet off the page still reads as rows.
- **No value is reachable only with a pointer.** If the resting view hides the numbers (a heatmap's squares, a sparkline's
  points), there is a keyboard-reachable way to read them: a toggle that turns the squares into a table, a caption that says
  the range and the extremes, or text that is there all along.
- **The chart is a named figure.** A `figcaption` or a `caption` says what it is and what the numbers are; the sentence is
  visible, not only an `aria-label`.
- **The reading order is "the name, then the value".** CSS `order` may move the name for the eye; it never moves it for a
  reader.
- **Colour is never the only channel.** The value is also text, a height or a position; a chart that hides or recolours
  something says so in words too.
- **Contrast holds.** Marks are graphics against the page (3:1, asserted by `check.contrast` in `theme.ts`); the text around
  them is text (4.5:1), in light and in dark.
- **Nothing truncates a value.** Names wrap; 320px at 200% text still shows the numbers.
- **Motion asks.** An enter animation or a pulse is declared inside `prefers-reduced-motion: no-preference`.
- **The test reads the page, not the stylesheet**: the DOM, the computed boxes, the keyboard and the toggle.
