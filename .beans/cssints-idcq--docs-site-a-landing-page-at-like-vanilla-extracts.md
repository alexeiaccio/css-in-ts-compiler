---
# cssints-idcq
title: 'Docs site: a landing page at / (like vanilla-extract''s), theme colours from the logo'
status: completed
type: feature
priority: normal
created_at: 2026-10-10T16:50:17Z
updated_at: 2026-10-10T19:00:47Z
---

Asked by the user (2026-10-10): a beautiful landing page at / in the spirit of vanilla-extract.style, and the site's default theme colours taken from the logo (apps/docs/public/logo.svg: #663399 rebeccapurple, #3178C6 TypeScript blue, #00FFE8 cyan; display-p3 values in the file).
- [x] / becomes a landing page (the README overview moves to its own page, e.g. /overview or 'Introduction', with links and search intact): hero with the logo, the one-line pitch and the install command, a live code-to-CSS showcase (a cssints snippet beside the class names and the CSS it compiles to: real output, generated at build time, not hand-written), feature sections (typed values checked by the grammar, zero runtime, tokens/themes/contrast, plugins, devtools, playground), links to docs and playground, footer. Prerendered like the other pages (readable without JS), fast (no heavy JS: the entry must not grow much; say the size), accessible, responsive, light/dark.
- [x] Styled with cssints (the site's tokens; frame/surface where they fit), the logo palette: the default theme's accent family and neutrals derived from the three logo colours, contrast checked (check.contrast and test/contrast.mjs over the hue range if the hue slider stays); coordinate with cssints-et4y (RYBitten palettes and a palette picker, another agent on apps/docs theme files): keep the landing in new files (src/Landing.tsx, its styles), and leave the theme files to et4y; the coordinator will merge the logo palette into the default theme after both land (write the exact token values you want in the final answer).
- [x] Tests: build check (the landing prerendered, its showcase CSS equals the engine's output), the Chrome check (renders, no console error, links work, screenshots light/dark/mobile).


## Summary of Changes

- `/` is a landing page; the README overview moved to `/overview` (plugin/markdown.ts, Page.tsx; links and search follow). Hero with the logo, the pitch, the install line and three links; the showcase; six feature cards; a closing call to action.
- The showcase is real output: plugin/landing.ts compiles src/landing/button.ts (a real, type-checked file) through the cssints plugin on a Vite server of its own at build time, and highlights the source, the module the plugin made, the sheet (`api.sheet`) and the build error of a misspelt colour with the site's Shiki. test/build.mjs reads the three panels back from the prerendered document and compares them with a fresh compile.
- The landing html is one lazy chunk (17.7 kB, 2.4 kB gzip) and is written into the document of `/` like the other pages; the entry chunk is unchanged in kind (76.6 kB, under the 200 kB check). Styles: global rules under `.landing` (src/landing-styles.ts) on the existing tokens; Shell hides the sidebar and the menu button on the home page.
- test/browser.mjs: the landing page light, dark and on a phone (screenshots in test/out/landing-*.png), no sidebar, links open pages, no sideways scroll, static copy swapped cleanly.
- Not done here: the logo palette in the theme (the theme files belong to cssints-et4y); the exact tokens are in the final report of the agent.
- Known: `DOCS_BASE=... node test/browser.mjs` fails at its last line on a 404 of `/@id/virtual:cssints/devtools` on the dev server under a base path; it does so on the commit before this work too. All the landing and built-site checks before it pass under a base.
