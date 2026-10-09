# CSS coverage per route on apps/sky (cssints-oj0c)

Question: sky ships one global sheet for all routes (docs/research/css-output.md: atomic rules are shared, so the sheet
grows slowly with the app). How much of that sheet does each route use, would a sheet per route save enough to be
worth it, and is anything in it dead?

Answer: **keep one sheet.** A route uses 49–75 % of the style-rule bytes after its interactions, but most of the
rest is used by the other routes' shared parts. A sheet per route would save 7.9–12.9 % of the bytes, which is
0.7–1.1 KB gzip of 7.6 KB. **Nothing of sky's own is dead.** 98.7 % of the style rules are used by some shipped route.
Of the other 4 rules, 1 is the fixed width of the dev page /dev/posts. The last 3 are the style-query polyfill of the
frame and surface kernels, which Chrome never needs. Also,
**`page.coverage` cannot measure a sheet in `@layer` blocks**: on sky it reads 80.1 % on every route, the 404 page
too. The 79 % that cssints-0a3p reported for the demo comes from this artifact, not from use.

Measured on 2026-10-09 with `cd apps/sky && bun run test:coverage` (apps/sky/test/coverage.mjs), Chrome through
playwright-core 1.63, the production build of sky as of master f4db568. Re-measured the same day (cssints-5jj1) after
the profile's Media fixture got a 3-image post, a gallery and a "warn" post: only the profile row, the union, the
splits and the unused rules changed (and /dev/posts by one rule).

## How it is measured

- **The build, the recorded API.** The script runs `vite build`, then `vite preview`. The API is stubbed with
  test/fixtures as in the other browser tests (home feeds, profile, author feeds, threads). Every image is a flat
  tile. Each route opens in its own context, light scheme, 1280 × 900.
- **On load, then after interactions.** After the first paint: widths 360, 499/500, 799/800, 1099/1100, 1299/1300
  and 1400, on both sides of each of Mu's breakpoints and of the 500 px container of the column. Then hover on the
  first 60 links, buttons, tabs and labels and on 5 cards, 25 Tab presses (`:focus-visible`), a dark browser, and
  reduced motion. Then the route's own steps, then the widths and the pointer again:
  - home: paging to the 414 end note, the Science tab, and the skeletons again under reduced motion (the API holds
    the first page for 400 ms);
  - profile: the Replies, Media and Posts tabs (Media ends with a 3-image post, a gallery and a "warn" post from
    posts.json, scripts/record-profile.mjs), paging, then the not-found and network-error states;
  - thread: every "Show N more replies", then a gone parent, a blocked parent, and a 500;
  - settings: the four modes, three hues, and the square buttons and avatars;
  - 404: nothing more.
    Sky has no menu or popover. The post actions are counters, not buttons, so hovering the card and its links covers
    them.
- **/dev/posts** (every embed kind, a dev-only route) is measured on the dev server, at the two card widths. Its
  sheet is not minified, so its rules are matched to the build's by their at-rules and selector (319 of 319
  matched). It is not part of the union, because it is not shipped.
- **Source.** The dev server's sheet has a source map (cssints-0a3p: each class to the first `css.*` call that made
  it). The script decodes the map, so each rule is printed with its file and line.

### Why not `page.coverage`

Chrome reports rule usage (`CSS.takeCoverageDelta`) for each style rule. It also reports an `@layer` block as one
used entry from its name to its closing brace when any rule inside is used. `page.coverage.stopCSSCoverage` joins
the entries into disjoint ranges, so the block's range covers the unused rules inside it. A three-rule sheet shows
it:

```css
@layer x {
  .a {
    color: red;
  }
  .b {
    color: blue;
  }
} /* only .a matches */
```

CDP gives `.a{color:red}` and `x{.a{color:red}.b{color:blue}}` as used, and `.b` not at all. `page.coverage`
gives the whole block as one used range. cssints puts every rule in a layer (`_.k`, `_.a`…`_.e`), so with
`page.coverage` every style rule counts as used. On sky this gave 24 860 of 31 049 bytes (80.1 %) on every route,
404 included: that is all bytes except the @property, @font-face and @keyframes rules. The demo's 79–80 % in
devtools.md is the same artifact. coverage.mjs reads CDP directly. A used entry counts for the leaf rule that holds
it, and the layer's own entry counts for none. A `@media` or `@container` entry covers only its prelude, so it
does no harm.

Chrome does not track @property, @font-face or @keyframes. Sky has 72 of them (68 @property, 3 @font-face, 1
@keyframes), 6 233 bytes, a fifth of the sheet. They are counted apart. Every registered token is read by a `var()`
in the sheet. The two that are not, `--frame-t` and `--surface-t`, are the polyfill's transition triggers.

## Per route

The sheet: `index-*.css`, 31 049 bytes (7 579 gzip): 319 style rules in 23 227 bytes, the 72 at-rules above,
and the rest are `@layer`/`@media`/`@container`/`@supports` wrappers. Percentages are of the 23 227 bytes and
of the 319 rules.

| route               | on load: bytes  | rules        | after interactions: bytes | rules            | only this route (class rules): rules, bytes, gzip |
| ------------------- | --------------- | ------------ | ------------------------- | ---------------- | ------------------------------------------------- |
| home (`/`)          | 14 867 (64.0 %) | 187 (58.6 %) | 16 550 (71.3 %)           | 213 (66.8 %)     | 18, 711, 422                                      |
| profile             | 15 258 (65.7 %) | 200 (62.7 %) | 17 484 (75.3 %)           | 241 (75.5 %)     | 43, 1 542, 708                                    |
| thread              | 14 839 (63.9 %) | 181 (56.7 %) | 16 289 (70.1 %)           | 201 (63.0 %)     | 22, 1 237, 405                                    |
| settings            | 10 999 (47.4 %) | 125 (39.2 %) | 14 772 (63.6 %)           | 158 (49.5 %)     | 14, 504, 279                                      |
| 404                 | 9 917 (42.7 %)  | 96 (30.1 %)  | 11 275 (48.5 %)           | 114 (35.7 %)     | 0                                                 |
| /dev/posts (dev)    |                 |              | 16 308 (70.2 %)           | 207 (64.9 %)     | 1, 67, 79                                         |
| **union** (shipped) |                 |              | **22 531 (97.0 %)**       | **315 (98.7 %)** |                                                   |

- **Shared by every route:** 114 rules, 11 275 bytes (3 401 gzip). These are the shell (nav, column, rail, bottom
  bar), the base styles and the tokens. The 404 page uses exactly this set.
- **Only one route:** home has the skeletons and the tab bar with its indicator (Skeleton.tsx, TabBar.tsx).
  Profile has the header and its `column (width < 500px)` layout, its tabs and states (Header.tsx, Profile.tsx),
  and, through its Media fixture, the 3-image grid, the gallery's "+N" overlay and the blurred post (Embed.tsx,
  Post.tsx).
  Thread has the connector lines and the reply rows (Thread.tsx). Settings has its controls (Settings.tsx). The
  post card and its embeds are on three routes, so they are shared.
- **Themes are global, not settings-only.** 18 rules (`:root.dim,:root.dark`, `.light`, `.dim`, `.dark` with their
  `@supports` colour fallbacks, `.square-buttons`, `.square-avatars`) were used only on /settings, because only
  that route switched them. A stored mode applies them on every route from the first paint (index.html's inline
  script), so "only here" counts only rules with a hashed class. Settings' own share is 504 bytes, not 3 001.

## Is a sheet per route worth it

A sheet per route at best is the one sheet without the class rules that only other routes use:

| route    | its sheet: bytes | gzip  | saved vs the one sheet              |
| -------- | ---------------- | ----- | ----------------------------------- |
| home     | 27 766           | 6 717 | 3 283 (10.6 %), 862 gzip (11.4 %)   |
| profile  | 28 597           | 6 892 | 2 452 (7.9 %), 687 gzip (9.1 %)     |
| thread   | 28 292           | 6 726 | 2 757 (8.9 %), 853 gzip (11.3 %)    |
| settings | 27 559           | 6 574 | 3 490 (11.2 %), 1 005 gzip (13.3 %) |
| 404      | 27 055           | 6 438 | 3 994 (12.9 %), 1 141 gzip (15.1 %) |

This is an upper bound. A real split goes by module, not by observed use. Each chunk would also hold the rules its
components can produce but that the fixtures did not trigger. The post card (Post.tsx, Embed.tsx, RichText.tsx)
would stay in a shared chunk for home, profile and thread. Against that: a second request on the first visit, a
second request on each navigation to a new route (the app is a client-side router, so the one sheet is cached after
the first page), and the layer order statement has to come first in every sheet (css-output.md). Atomic classes
reduce what a split can save: a declaration that two routes use is one rule, not two. That is why 97 % of the
sheet is used by some route, but no route uses more than 75 %.

**About 0.7–1.1 KB gzip per route is not worth an extra request and the ordering risk.** Look at this again when
the sheet grows: a route with a large, separate set of components (a composer, a media viewer), or a "only here"
share above ~30 % of the sheet. Run `bun run test:coverage` to get the numbers.

## What no route uses

4 rules, 696 bytes (275 gzip). Until cssints-5jj1 it was 15 rules: 11 of them were the 3-image grid and its banner
cell, the gallery's "+N" overlay and the blurred "warn" post with its reveal (Embed.tsx:67–107, Post.tsx:115), which
only /dev/posts showed. The profile's Media fixture now has those posts, so the route measures them.

**Used on /dev/posts only.** `._14h850t` (src/screens/DevPosts.tsx:55), the dev page's fixed width. It is not
shipped.

**Used nowhere.** There are 3 rules, and they belong to cssints, not to sky:

| rule                                                  | source                                                      | why                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `:root[data-cssints-poly] ._frame-core`               | cssints frame.ts (first used in src/Shell.tsx:141)          | the frame kernel's fallback without container style queries |
| `:root[data-cssints-poly] ._surface-core`             | cssints surface.ts (first used in src/home/Skeleton.tsx:43) | the same for surface                                        |
| `:root[data-cssints-poly] ._surface-core._frame-core` | cssints surface.ts                                          | both on one element                                         |

`parent-vars.ts` sets `data-cssints-poly` only in a browser that fails its style-query probe, so Chrome never
matches these rules. They are not dead code: the same sheet serves every browser that the targets name, and in a browser whose probe
fails, this fallback is what draws the frames and surfaces.

So there is nothing to delete, and no fixture gap is left: every rule of sky's own that a shipped route can draw is
measured on a route.

## Recommendation

- **Keep one sheet.** The most a route could save is ~1.1 KB gzip of 7.6 KB, and the cost is requests and layer order.
- **No per-route chunks for now.** Check again when a route adds a large set of its own components. The measure is
  "only this route" bytes in `test:coverage`.
- **Delete nothing.** Sky's own rules are all reachable. The 3 unmatched rules are a cssints fallback for other
  browsers.
- **Do not use `page.coverage` on a layered sheet.** It counts every rule inside a used `@layer` block. Use CDP rule
  usage as coverage.mjs does (or check that a tool such as @projectwallace/css-code-coverage does). The demo figure
  in devtools.md is corrected (cssints-5jj1): by rule usage the demo uses 75.2 % of its style-rule bytes on load,
  83.9 % after interactions.
