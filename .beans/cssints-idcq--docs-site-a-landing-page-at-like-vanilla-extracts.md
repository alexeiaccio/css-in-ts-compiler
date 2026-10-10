---
# cssints-idcq
title: 'Docs site: a landing page at / (like vanilla-extract''s), theme colours from the logo'
status: in-progress
type: feature
created_at: 2026-10-10T16:50:17Z
updated_at: 2026-10-10T16:50:17Z
---

Asked by the user (2026-10-10): a beautiful landing page at / in the spirit of vanilla-extract.style, and the site's default theme colours taken from the logo (apps/docs/public/logo.svg: #663399 rebeccapurple, #3178C6 TypeScript blue, #00FFE8 cyan; display-p3 values in the file).
- [ ] / becomes a landing page (the README overview moves to its own page, e.g. /overview or 'Introduction', with links and search intact): hero with the logo, the one-line pitch and the install command, a live code-to-CSS showcase (a cssints snippet beside the class names and the CSS it compiles to: real output, generated at build time, not hand-written), feature sections (typed values checked by the grammar, zero runtime, tokens/themes/contrast, plugins, devtools, playground), links to docs and playground, footer. Prerendered like the other pages (readable without JS), fast (no heavy JS: the entry must not grow much; say the size), accessible, responsive, light/dark.
- [ ] Styled with cssints (the site's tokens; frame/surface where they fit), the logo palette: the default theme's accent family and neutrals derived from the three logo colours, contrast checked (check.contrast and test/contrast.mjs over the hue range if the hue slider stays); coordinate with cssints-et4y (RYBitten palettes and a palette picker, another agent on apps/docs theme files): keep the landing in new files (src/Landing.tsx, its styles), and leave the theme files to et4y; the coordinator will merge the logo palette into the default theme after both land (write the exact token values you want in the final answer).
- [ ] Tests: build check (the landing prerendered, its showcase CSS equals the engine's output), the Chrome check (renders, no console error, links work, screenshots light/dark/mobile).
