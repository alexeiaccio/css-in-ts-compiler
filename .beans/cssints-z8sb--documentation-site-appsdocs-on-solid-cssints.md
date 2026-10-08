---
# cssints-z8sb
title: 'Documentation site: apps/docs on Solid + cssints'
status: completed
type: feature
created_at: 2026-10-08T09:07:45Z
updated_at: 2026-10-08T09:07:45Z
---

Asked by the user (2026-10-08): a documentation site, own, on Solid 2 + cssints (the stack of apps/sky), English, local only for now (no deploy).
- [x] apps/docs: pages generated from docs/API.md and README.md at build time (the markdown stays the source; no copy), a sidebar of sections, search over headings (client-side, small), code blocks highlighted (Shiki at build time) and ideally type hovers (twoslash) for the ts blocks that docs.mjs already type-checks.
- [x] Styled with cssints itself (tokens, themes with a light/dark mode, frame/surface where they fit): the site is a demo; sky's patterns as a guide; check.contrast on its themes.
- [x] Static build (vite build, prerendered pages or an SPA with a fallback, say which and why), bun run dev/build/preview; a test (build check + a Chrome check that every page renders and has no console error, like sky test:dev).
- [x] Wired into workspaces, typecheck, lint, fmt, AGENTS.md Layout; README link.

## Summary of Changes

apps/docs, a documentation site on Solid 2 rc.13 + @solidjs/router + cssints, English, local only.

- **Pages** from README.md and docs/API.md at build time (`plugin/markdown.ts`, run in a worker by `plugin/docs.ts`): marked splits them at the headings (README at h1/h2, API.md down to h4: 26 pages, groups Guide / Reference / Project), links between the two files and `#anchors` are resolved to pages, other files link to GitHub. The page html is one lazy chunk each (`virtual:docs`), the titles and outline are in the entry (105 kB).
- **Code**: Shiki (github-light/dark as CSS variables, one HTML for both modes) and twoslash hovers on every ts/tsx block that docs.mjs checks (27 blocks, 911 hovers; the 42 `// error` lines show their message, and the test holds both counts to docs.mjs's). 15 s of one thread, so it runs in a worker (cssints gives a module 30 s to evaluate); `DOCS_HOVERS=0` skips it in dev. hovers.ts places the popups at fixed coordinates (the CSS-only ones are clipped by the scrolling pre).
- **Search** over headings and the bold terms that open list items (`src/lookup.ts`, tested by test/search.mjs); `/` or Ctrl/Cmd+K, arrows, Enter.
- **Styling** with cssints: tokens.json (+ generated tokens.d.json.ts), themes (system by media, `.light`/`.dark` classes, a toggle that stores the choice, set before first paint), `check.contrast` on 11 pairs in every theme, `frame()` (search panel and rows, cards), `surface()` (hover steps), `global()` for the markdown elements and Shiki's variables, `cv` (drawer, outline), `media`/`attr`, a twoslash.css layer below the site's layers with its variables set by tokens.
- **Rendering**: SPA with a document per URL (`<slug>/index.html`, `404.html`, own `<title>`): Solid 2 SSR and the router are release candidates, and the shell is interactive; the content is static HTML in a chunk, so a prerender would only move the flash.
- **Tests**: test/search.mjs, build.mjs (sheet layers, kernels, no engine in the JS, a document per page, a hover per block), browser.mjs (every page in Chrome with no console error or failed request, links and anchors, search, modes, mobile drawer, hovers, screenshots in test/out/; skipped without Chrome).
- Wired: bun workspaces, root typecheck, lint (plainCode `apps/**` covers it), fmt, AGENTS.md Layout and Commands, README link.

Findings: (1) a local named `open` in a component made `ph(open() ? "x" : "list")` build: the build-time evaluator read `window.open`, so one icon was chosen with no error; (2) a module with css sites also runs, with its imports, in cssints's own evaluation server, which has none of the project's plugins: a virtual module cannot be imported by it (index.tsx, which has no sites, hands the data down by context); (3) `src/search.ts` next to `src/Search.tsx` made the type-aware lint drop the tsx file out of its project on a case-insensitive file system (renamed lookup.ts); (4) lint's `import/namespace` finds no member of `import * as css` unless a plain `import type … from "cssints"` sits in the file (sky does the same).
