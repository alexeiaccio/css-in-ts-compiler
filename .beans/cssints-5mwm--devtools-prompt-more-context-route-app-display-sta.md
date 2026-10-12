---
# cssints-5mwm
title: 'Devtools prompt: more context (route, app, display state, element attributes)'
status: in-progress
type: feature
created_at: 2026-10-12T14:49:32Z
updated_at: 2026-10-12T14:49:32Z
---

User (2026-10-12): look at what else to add to the message from the devtools panel; the route path?

Found while receiving two prompts from the panel in an OpenCode session attached by /cssints-devtools: with an element picked the prompt has NO page (pagePrompt has it only when nothing is picked), no app (files are relative to the Vite root: 'src/landing/page.ts' in a monorepo of three apps is ambiguous), no display state, and only tag/path/text/classes of the element. I had to guess the page from the element's text (an Install page example panel).

- [ ] route in both prompt variants: location.pathname + search + hash (and the page title)
- [ ] app: the server (it knows root and the git root, devtools-link) adds 'App: apps/docs (http://localhost:5173), file paths are relative to it'
- [ ] display state that decides how the UI looks: viewport size, the html element's class and data-* attributes (mode, palette, hue, text, density, radius), prefers-color-scheme / prefers-reduced-motion, the element's rendered size and position
- [ ] element: id, role/aria-label, href/src/alt/type/name, data-* of the element and its nearest ancestors that carry meaning; bounded
- [ ] everything bounded (the prompt stays a few KB), tests, README/AGENTS.md, dist rebuilt
