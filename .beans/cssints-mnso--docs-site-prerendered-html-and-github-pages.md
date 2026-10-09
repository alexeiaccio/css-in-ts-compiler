---
# cssints-mnso
title: 'Docs site: prerendered HTML and GitHub Pages'
status: completed
type: feature
priority: normal
created_at: 2026-10-09T08:56:15Z
updated_at: 2026-10-09T09:32:58Z
---

Follow-up of cssints-z8sb (asked 2026-10-09).
- [x] Prerender: each <slug>/index.html carries the page's HTML (the article from the markdown chunk, headings, title, description meta) so it reads without JS and indexes; the SPA takes over on load (hydrate or replace the article node, no flash, no duplicate content). Keep it simple: the content is static HTML already, so a build step that writes it into the shell template may be enough without Solid SSR (say what was chosen).
- [x] Base path for GitHub Pages (/css-in-ts-compiler/): links, assets, router, search, 404.html fallback; local preview still works at /.
- [x] .github/workflows/docs.yml: on push to master (paths: docs/, README.md, apps/docs, packages/*/src), bun install, build apps/docs, upload-pages-artifact + deploy-pages; Pages source = GitHub Actions (say what the user must enable in repo settings).
- [x] test: build check asserts the prerendered text of a few pages; the Chrome check runs under the base path too.

## Summary of Changes

**Prerender.** The build writes each page into its own document: `generateBundle` (plugin/docs.ts) takes Vite's `index.html` and, per page, sets the `<title>`, the description meta (the first paragraph or item of 40+ characters outside the code blocks, cut at a word; the shell's default if none) and puts `<div id="prerender">` (h1, the article html with its Shiki/twoslash markup, a plain list of all pages whose links end in a slash) before the app's `<div id="root" hidden>`. Chosen over Solid SSR/hydration because the article is already static html from marked, Solid 2 SSR and its router are release candidates, and the shell is interactive: a static copy plus an atomic swap gives the same result with ~30 lines. The swap: when the app has its article (`reveal()` in Page.tsx, also on the not-found page) it removes `#prerender` and unhides the root in the same task, so no frame shows both or neither; without JS (or if the chunk fails) the static copy stays. 404.html has no page. Cost: the html of a page is in its document and in its lazy chunk.

**Base path.** `DOCS_BASE` (default `/`) is Vite's `base` (vite.config.ts); the plugin hands `config.base` to the markdown worker (links between pages), the router gets `base` from `import.meta.env.BASE_URL`, and `url(slug)` (src/docs.ts) prefixes the hrefs of the shell, the cards and the search rows. Assets, chunks and the css follow Vite's base.

**Workflow.** `.github/workflows/docs.yml`: on push to master (README.md, docs/, apps/docs/, packages/*/src and dist, bun.lock, the workflow) and manually; checkout, setup-bun (version from package.json), setup-node 24 (the plugin runs .ts with type stripping), `bun install --frozen-lockfile`, `bun run build` in apps/docs with `DOCS_BASE=/<repo>/`, upload-pages-artifact, then a deploy job with deploy-pages. CI does not build the packages: Vite bundles the tracked `packages/*/dist` and twoslash type-checks against `packages/*/src`; a fresh clone + frozen install + `DOCS_BASE=/css-in-ts-compiler/ bun run build` was run to confirm. The repo settings the user must change: Settings > Pages > Build and deployment > Source = GitHub Actions.

**Tests.** build.mjs asserts the prerendered h1, text and description of tokens, install, the overview and frame (with hovers), the list of pages in each document, no page in 404.html, and every href/src under the base. browser.mjs runs the dev server under the base, then builds and previews the site: JS off (title, h1, article, description, a link to another document), JS on (no copy left, one h1, no frame with both or neither, a client navigation, the not-found page). Both pass with `/` and with `DOCS_BASE=/css-in-ts-compiler/`.

Not a dependency change. actionlint could not be downloaded (release assets unreachable); the workflow was checked with `@action-validator/cli` and a YAML parse.
