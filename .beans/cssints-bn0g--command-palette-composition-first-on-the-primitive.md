---
# cssints-bn0g
title: Command palette composition (first on the primitives)
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T18:27:07Z
updated_at: 2026-10-30T18:38:01Z
---

First composition on @cssints/headless primitives (parent work: cssints-yntz). Build createCommandPalette: dialog + searchbox + filterable list, per docs/research/compositions-2026-10.md. The filterable menu and date picker stay for later PRs.

- [ ] src/command-palette.ts
- [ ] test/command-palette.browser.test.tsx
- [ ] export from src/index.ts
- [ ] README section + docs/API.md entry
- [ ] changeset (minor)
- [x] verify: tsc, tests, lint, fmt, release:check
