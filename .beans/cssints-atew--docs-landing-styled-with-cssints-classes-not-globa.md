---
# cssints-atew
title: Docs landing styled with cssints classes, not global rules
status: in-progress
type: task
created_at: 2026-10-10T22:04:01Z
updated_at: 2026-10-10T22:04:01Z
---

User (2026-10-11): make the landing page on cssints too. Today plugin/landing.ts writes an html string with plain class names and src/landing-styles.ts styles it with ~50 global() rules under .landing. Make it like the rest of the site: classes from css.cn in a cssints module, one source of html for the client and the prerender.

- [ ] src/landing/page.ts (cssints module): the cn classes (from landing-styles.ts, same tokens/look) and `landing(data)` returning the html with those classes; Shiki's <pre> gets a class by replace or a transformer
- [ ] plugin/landing.ts: the private server evaluates page.ts (ssrLoadModule / runner, through the cssints plugin) for the prerendered document; the virtual module imports page.ts so the classes are in the build's sheet and the client renders the same string
- [ ] landing-styles.ts removed (or only what cannot be a class), import dropped from index.tsx
- [ ] tests (build.mjs, browser.mjs) on stable markers instead of the old class names; prerendered html equals the client's
- [ ] checks green, deployed
