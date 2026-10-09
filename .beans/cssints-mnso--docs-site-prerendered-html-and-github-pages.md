---
# cssints-mnso
title: 'Docs site: prerendered HTML and GitHub Pages'
status: in-progress
type: feature
created_at: 2026-10-09T08:56:15Z
updated_at: 2026-10-09T08:56:15Z
---

Follow-up of cssints-z8sb (asked 2026-10-09).
- [ ] Prerender: each <slug>/index.html carries the page's HTML (the article from the markdown chunk, headings, title, description meta) so it reads without JS and indexes; the SPA takes over on load (hydrate or replace the article node, no flash, no duplicate content). Keep it simple: the content is static HTML already, so a build step that writes it into the shell template may be enough without Solid SSR (say what was chosen).
- [ ] Base path for GitHub Pages (/css-in-ts-compiler/): links, assets, router, search, 404.html fallback; local preview still works at /.
- [ ] .github/workflows/docs.yml: on push to master (paths: docs/, README.md, apps/docs, packages/*/src), bun install, build apps/docs, upload-pages-artifact + deploy-pages; Pages source = GitHub Actions (say what the user must enable in repo settings).
- [ ] test: build check asserts the prerendered text of a few pages; the Chrome check runs under the base path too.
