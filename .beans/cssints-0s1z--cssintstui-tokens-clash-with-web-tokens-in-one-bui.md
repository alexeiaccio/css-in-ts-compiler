---
# cssints-0s1z
title: cssints/tui tokens clash with web tokens in one build (@property registry)
status: in-progress
type: bug
priority: normal
created_at: 2026-10-10T22:13:33Z
updated_at: 2026-10-10T23:32:04Z
---

cssints/tui's createTokens and createGlobalTheme are the web ones: they declare @property rules in the process-global registry. In a build that also has web styles (apps/docs importing apps/sky-tui's styles.ts) the names clash: `MacroError: cssints: --color-bg is already declared with another @property, in src/theme.ts`. Repro: import apps/sky-tui/src/styles.ts from any module of apps/docs and bun run build. Workaround: apps/docs/plugin/tui-styles.ts builds styles.ts in a child process into plain prop objects.

## Todo
- [ ] Failing test: a web module and a cssints/tui module with the same token names in one build
- [x] Terminal tokens stay out of the sheet's @property table
- [x] Drop apps/docs/plugin/tui-styles.ts, import sky-tui's styles.ts directly
