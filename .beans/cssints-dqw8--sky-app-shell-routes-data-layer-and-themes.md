---
# cssints-dqw8
title: 'sky: app shell, routes, data layer and themes'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T15:09:09Z
updated_at: 2026-10-02T15:30:31Z
parent: cssints-co8y
---

## Question

The foundation of apps/sky (decided in "Screens, routes and appearance settings", cssints-gg2p). Read docs/research/atproto-data.md (data layer, moderation, paging, Solid 2 traps) and docs/research/mu-design.md (tokens, layout, licence). Show the cssints feature named here and keep apps/sky's build, HMR and type checks green; add a check for what you build (build output or a node test against a recorded API fixture, never the live API in `bun run test`).

- Layout from Mu: left navigation, 600 px centre column, right rail, breakpoints 500/800/1100/1300, one column with a bottom bar below 800; media queries via `media()`, layout of inner parts via `container()`.
- Solid Router 2.0 with three routes: `/` (home), `/profile/:handle`, `/profile/:handle/post/:rkey`; empty screens are fine here.
- Data layer `src/api.ts` from the research sketch (atcute client on public.api.bsky.app, the moderation rule, the paging helper).
- Tokens: `createTokens(tokensJson)` from `src/tokens.json`; themes light, dim, dark and system (`prefers-color-scheme`) with createGlobalTheme, now that overrides may hold references (cssints-q6l0): drop the `accentTone` workaround if it is no longer needed. Inter self-hosted with its OFL licence file.
- App name "sky"; no Mu or Bluesky marks.

## Summary of Changes

- apps/sky shell: src/Shell.tsx (Mu layout on one centred grid: left nav 80 px icons, 240 px with labels from 1300; 600 px column, a container named "column"; right rail 250/300 px from 1100; bottom bar below 800), src/layout.ts (media() at 500/800/1100/1300, container()), src/router.tsx (Solid Router 2: /, /profile/:handle, /profile/:handle/post/:rkey, plus a not-found screen), src/screens/* (placeholders that show the handle and rkey and set the document title), name "sky" in the UI and title.
- src/api.ts (atcute on public.api.bsky.app, retry, moderation rule, quoteOf, loaders, cursor cap) and src/paged.ts (createPaged with the two Solid 2 rc traps avoided).
- src/theme.ts: createTokens from tokens.json; themes light, dim, dark and system with references in overrides; accentTone is gone; check.contrast on text, accent and derived pairs. Inter in public/fonts/inter with OFL.txt.
- Tests: test/api.mjs against recorded fixtures (test/fixtures, scripts/record-fixtures.mjs), build.mjs and dev.mjs updated to the shell.
- Engine: tokens a used derived token or theme value refers to now get their @property rule (before, hue.accent was missing and every derived colour stayed at its initial value in all themes); check.contrast accepts JSON-imported tokens.
- Docs: mu-design.md (themes, workaround removed), API.md, AGENTS.md, README.md.
