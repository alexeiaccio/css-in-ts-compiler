---
# cssints-co8y
title: 'Map: cssints 0.3, a read-only atproto client on Solid 2'
status: todo
type: epic
priority: normal
tags:
    - wayfinder:map
created_at: 2026-10-02T14:20:14Z
updated_at: 2026-10-02T15:34:14Z
---

## Destination

`apps/sky`: a minimal read-only atproto client (public AppView, no login) on Solid 2 and atcute, with Mu's design tokens and layout (mu.social, eurosky-social-app) and Witchsky-style appearance settings (hue slider, colour schemes, square-ish UI, square avatars, hidden metrics; tangled.org/jollywhoppers.com/witchsky.app). It is the showcase of cssints: `frame()` in post embeds, `surface()` layers, `container()` for post and profile layout, icons, keyframes, derived tokens, themes, tokens from DTCG JSON. It builds, type-checks with tsgo and tsc 5.9, and is tested in the repo like apps/demo; the cssints gaps it finds are fixed or recorded.

## Notes

- Log findings in `docs/wayfinder.md`; the map only indexes them.
- Tracker is beans. A ticket is a child of this epic with a `wayfinder:<type>` tag. Claim a ticket by setting it `in-progress`. The frontier is `beans list --ready --parent <this map>`.
- Execution is allowed on this map, as on 0.1 and 0.2: a decision ticket may end with an implementation ticket. Implementation runs on Sonnet subagents in `.worktrees/<branch>`; the coordinator merges and runs every check (AGENTS.md). If subagents are down, the coordinator works in a fresh branch, never in a stalled agent's worktree.
- Stack: Solid 2 RC (`solid-js@next`, `@solidjs/web`, `@solidjs/vite-plugin` with the Oxc compiler, `jsxImportSource: "@solidjs/web"`), atcute (`@atcute/client`, `@atcute/bluesky`, richtext segmenter), Vite 8, bun. Client-side rendering only.
- References: Mu (eurosky-social-app, a Bluesky social-app fork; tokens in `src/alf`; brand assets have their own licence, see its ASSETS.md and NOTICE.md) and Witchsky (appearance settings). Recreate the look with our tokens; do not copy logos or trademarked assets.
- Standing preferences: tsgo primary, tsc 5.9 green; `bun run bench` for type-level changes; minimal code (ponytail); Effect where the engine has side effects, the app itself is plain Solid.

## Decisions so far

- [Screens, routes and appearance settings](cssints-gg2p): home/profile/thread with bsky URLs; feeds as tabs; Solid Router 2.0; all embeds, video as poster; hue, theme mode, square buttons/avatars; name sky.
- [Solid 2 and cssints in one Vite app](cssints-yfxf): works; one engine fix (JSX becomes a no-op in the runner, transform order pre); apps/sky skeleton with build and HMR checks.

- [Mu's design tokens and layout](cssints-uifu): Mu = Bluesky alf with Mu's palette; 600/240/300 layout; tokens.json with one hue token driving accents; licence: values, Inter, Phosphor yes, logos and art no; two cssints gaps ticketed.

- [Theme overrides may refer to tokens](cssints-q6l0): whole-value and inside-value references in createGlobalTheme, live var(), errors in editor and build.
- [check.contrast warnings for derived colours do not show in dev](cssints-hbqf): the warned set was never cleared in dev; hotUpdate clears it. Derived tokens under themes ticketed (cssints-l90l).

- [Read-only atproto data with atcute](cssints-t5g6): client + bluesky types + segmenter; all three screens work unauthenticated; search out (public host blocks it); app-side moderation rule, cursor paging, two Solid 2 rc traps.

- [check.contrast reads a derived token as its default](cssints-l90l): TokenDef keeps template + refs; contrast computes per theme through chains; the hue slider's colours are now really checked.

- [sky: app shell, routes, data layer and themes](cssints-dqw8): Mu layout checked in Chrome, Router 2, api.ts on recorded fixtures, four theme modes with references; two engine bugs fixed (referred-only tokens had no @property; contrast vs JSON tokens); global/attribute selectors ticketed (cssints-635k).

## Not yet specified

- cssints gaps the app will expose (Solid specifics, missing properties or helpers, performance on a real component tree): each becomes a ticket when found.
- Hidden metrics (Witchsky's per-counter switches): out of the first version, may come back.

## Out of scope

- Login, OAuth and every write (post, like, repost, follow), notifications, DMs (decided 2026-10-02: read-only).
- Pixel-perfect parity with mu.social; Mu or Bluesky logos and trademarked assets.
- Native apps, server rendering, deploying the app.
