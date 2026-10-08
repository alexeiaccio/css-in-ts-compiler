---
# cssints-z8sb
title: 'Documentation site: apps/docs on Solid + cssints'
status: in-progress
type: feature
created_at: 2026-10-08T09:07:45Z
updated_at: 2026-10-08T09:07:45Z
---

Asked by the user (2026-10-08): a documentation site, own, on Solid 2 + cssints (the stack of apps/sky), English, local only for now (no deploy).
- [ ] apps/docs: pages generated from docs/API.md and README.md at build time (the markdown stays the source; no copy), a sidebar of sections, search over headings (client-side, small), code blocks highlighted (Shiki at build time) and ideally type hovers (twoslash) for the ts blocks that docs.mjs already type-checks.
- [ ] Styled with cssints itself (tokens, themes with a light/dark mode, frame/surface where they fit): the site is a demo; sky's patterns as a guide; check.contrast on its themes.
- [ ] Static build (vite build, prerendered pages or an SPA with a fallback, say which and why), bun run dev/build/preview; a test (build check + a Chrome check that every page renders and has no console error, like sky test:dev).
- [ ] Wired into workspaces, typecheck, lint, fmt, AGENTS.md Layout; README link.
