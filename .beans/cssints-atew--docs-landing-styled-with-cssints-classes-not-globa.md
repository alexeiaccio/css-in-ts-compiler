---
# cssints-atew
title: Docs landing styled with cssints classes, not global rules
status: in-progress
type: task
priority: normal
created_at: 2026-10-10T22:04:01Z
updated_at: 2026-10-10T22:05:57Z
---

User (2026-10-11): make the landing page on cssints too. Today plugin/landing.ts writes an html string with plain class names and src/landing-styles.ts styles it with ~50 global() rules under .landing. Make it like the rest of the site: classes from css.cn in a cssints module, one source of html for the client and the prerender.

- [ ] src/landing/page.ts (cssints module): the cn classes (from landing-styles.ts, same tokens/look) and `landing(data)` returning the html with those classes; Shiki's <pre> gets a class by replace or a transformer
- [ ] plugin/landing.ts: the private server evaluates page.ts (ssrLoadModule / runner, through the cssints plugin) for the prerendered document; the virtual module imports page.ts so the classes are in the build's sheet and the client renders the same string
- [ ] landing-styles.ts removed (or only what cannot be a class), import dropped from index.tsx
- [ ] tests (build.mjs, browser.mjs) on stable markers instead of the old class names; prerendered html equals the client's
- [ ] checks green, deployed

- [ ] Hero shader (user, 2026-10-11): a WebGPU background from the `shaders` npm package (MIT, github.com/shader-effects-inc/shaders) behind the hero, through `shaders/js` createShader (the site is Solid 2 rc; shaders/solid targets Solid 1), lazy-loaded on the client only, colours from the active palette (accent), the radial-gradient stays as the fallback (no WebGPU, prefers-reduced-motion, the prerendered page); credit it like the other third-party code

- [ ] Hero full-bleed (user, 2026-10-11, screenshot): no gap between the header and the hero and none at its sides: the hero (its glow and the shader canvas) spans the full width right under the header; today the .landing wrapper's padding (space._3xl top, space.lg sides) and max-width 1120px frame it. The hero's content stays centred and readable; the sections below keep their max width
