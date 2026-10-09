# @cssints/devtools

A dev overlay inspector for cssints, built on what the dev server knows of every class: an element's classes grouped
by the `css.*` call that made them, the winner per property by the sheet's own rules (layer, specificity, order, the
conditions that hold now), and each winner checked against the browser's computed style.

```ts
// vite.config.ts of the app; @cssints/devtools in its devDependencies
import cssints from "cssints/vite";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [cssints({ devtools: true })] });
```

Alt+Shift+C or the `cssints` button (bottom right) opens it. Hover previews an element, a click picks it; ↑ parent,
↓ first child, ← → siblings; Esc stops picking, then closes. The panel and the cascade rule are described in
docs/API.md, "Debugging: the devtools overlay"; the design in docs/research/devtools.md, "Our devtools".

## Rules

- **Dev only, unless asked.** `devtools: true` adds a plugin with `apply: "serve"`: an HTML script tag, the module
  `virtual:cssints/devtools` and two HMR events (`cssints:devtools:get` → `cssints:devtools`, and
  `cssints:devtools:stale` after each transform). A build has none of it.
- **In a build: `devtools: "build"`.** The table is a JSON asset, the overlay a chunk of its own, and the entry holds a loader
  (a `cssints` button and Alt+Shift+C). The first open loads both; a call shows as `file:line` and its source, with no link
  to an editor. The table has no path of the machine that built it. Sizes are logged by the build (this site: table 70 kB,
  overlay 190 kB, the entry +0.85 kB).
- **The data is the compiler's.** The table holds the sheet as the server renders it, each class's rule, plugin,
  tokens and sites, and the place of every call. The core parses the sheet; it never reads the page's CSSOM for
  cssints' rules.
- **The browser decides the conditions.** At-rules (`@media`, `@container`, `@supports`, `@scope`) are evaluated for
  the element by a probe sheet; states by `Element.matches`.
- **A winner is checked, not claimed.** A childless clone in place gets the winner inline; when its computed value
  differs, the panel names the cause (inline style, a rule of another sheet, an unlayered rule, an animation) or marks
  a layout-dependent value as unverified.
- **Isolated.** A custom element with a shadow root and its own cssints sheet, built ahead into `dist/overlay.js`
  (Solid, Effect and the core bundled): an app needs neither Solid nor a second CSS file. No tokens in its styles:
  `@property` is ignored inside a shadow root.

## Layout

- `src/core`: Effect code, no overlay in it (an extension could host it): `table.ts` (the decoded table and its
  model), `css.ts` (sheet parser, specificity, states), `cascade.ts` (`inspect`), `page.ts` (the `Page` service),
  `dom.ts` (its browser layer), `session.ts` (the protocol and the state).
- `src/ui`: the Solid overlay (`overlay.tsx`, `mount`) and its cssints styles (`styles.ts`).

## Browsers

Chrome, Firefox and WebKit, checked by `test:browsers` on apps/demo's dev server.

## Limits

- `@scope` proximity is not ranked; a logical and a physical property are two properties.
- An element inside another shadow root is picked as its host.
- A page that Vite does not serve as HTML (server rendering) gets no entry.
- The panel re-inspects every 600 ms while open: each pass adds and removes a probe `<style>` and attribute.

## Tests

```bash
bun run test            # test/core.mjs (the cascade on happy-dom: hover vs media, @container, @supports, @scope,
                        # an unlayered rule, frame's kernel, within(), grouping), test/build.mjs (nothing in a build
                        # without the option; with "build": the table, the lazy chunk, the loader's size; apps/docs/test/browser.mjs opens it in Chrome)
bun run test:browsers   # builds dist/overlay.js, then the demo in Chrome, Firefox and WebKit (test/browsers.mjs)
```
