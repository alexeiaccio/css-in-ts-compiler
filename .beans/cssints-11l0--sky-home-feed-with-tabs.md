---
# cssints-11l0
title: 'sky: home feed with tabs'
status: completed
type: feature
priority: normal
tags:
    - wayfinder:task
created_at: 2026-10-02T15:09:09Z
updated_at: 2026-10-02T16:26:43Z
parent: cssints-co8y
blocked_by:
    - cssints-n3xy
---

## Question

The home screen. Read docs/research/atproto-data.md (data layer, moderation, paging, Solid 2 traps) and docs/research/mu-design.md (tokens, layout, licence). Show the cssints feature named here and keep apps/sky's build, HMR and type checks green; add a check for what you build (build output or a node test against a recorded API fixture, never the live API in `bun run test`).

- Tabs of a fixed list of feeds (Discover and two or three popular ones by their at:// URIs), infinite scroll with the paging helper (keep loading while a cursor exists; stop on 414 with a "that's all" note), `<Loading>` for the first page and `isPending` for later ones.
- Loading skeletons animated with `keyframes()`; respect `prefers-reduced-motion`.
- Tabs styled with tokens and a surface; the active tab's indicator animated.

## Summary of Changes

The home screen (`src/screens/Home.tsx`, `src/home/`): a sticky tab bar over three feeds, each tab a panel that is made on first visit and kept hidden afterwards, so its pages and scroll position survive a switch.

- **Feeds** (by at:// URI, all answer without a login and page with a cursor, checked 2026-10-02): Discover (`whats-hot`), Science (`did:plc:jfhpnnst6flqway4eaeqzj2a/…/for-science`), News (`did:plc:kkf4naxqmweop7dv4l2iqqf5/…/verified-news`). Out: For You and Popular With Friends (one post or 502), Mutuals and OnlyPosts (401).
- **Paging**: `createPaged` per tab, an `IntersectionObserver` sentinel (800 px ahead) that looks again after every page, so it keeps loading while a cursor exists. `<Loading>` with skeletons for the first page; a skeleton card under the list for later pages (`loadingMore() || isPending(...)`). `homeScreen` turns a 414 on a page with a cursor into the end of the feed, like the cursor cap; both show "That's all for now." A failed page shows a retry.
- **cssints**: skeletons shimmer with a `keyframes()` rule (one rule for all), `reduced` (new in `layout.ts`) switches the animation and the indicator's transition off; the tab bar is a `surface()` with a darker step on hover, sticky under the header at `t.layout.headerHeight`; the indicator is one element moved by a transition.
- **Tests**: `test/home.mjs` (tab and paging state on recorded fixtures: scroll per tab, pages per tab, no duplicates, 414, retry; in `bun run test`), build checks in `test/build.mjs` (keyframes rule, reduced-motion rules, sticky top, hover step), `test/home-browser.mjs` (`bun run test:home`: Chrome with the API stubbed by fixtures; scroll loads the next page, tabs keep scroll and posts, 414 note, shimmer and indicator stop under reduced motion; two controls made it fail as it should). Fixtures `home-discover-1`, `home-discover-2`, `home-science-1` (`scripts/record-home.mjs`, `HOST=https://api.bsky.app` because `public.api.bsky.app` was unreachable).

Gaps found: CSS-wide keywords (`inherit`, `initial`, `unset`, `revert`) are rejected by every property (`color("inherit")`, `fontFamily("inherit")`, `font("inherit")`), so the button's `font-family: inherit` is a rule in `base.css`; `cursor("pointer")` warns "not supported by ios_saf" at build (BCD); `isPending` does not read true for an imperative `loadMore()`, only for a changed source, so the footer also reads the paging helper's `loadingMore()`.
