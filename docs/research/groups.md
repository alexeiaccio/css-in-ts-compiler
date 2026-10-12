# Export groups: `cssints/widely-available`, `cssints/css-grid-2`, … (cssints-n7z3)

Asked by the user (2026-10-11): generated groups of exports, by Baseline status and by spec. A group exports the members of
`cssints` that have its features, and refuses a value outside them, in the editor and in the build, with a message that names
the group. Members that name no CSS feature (`cn`, `cv`, tokens, themes, `check`, …) are in every group.

This note is the research and the design. The user's text is in `docs/API.md` ("Export groups").

## 1. Data, and what each source can say

| Source                              | Version                      | What we take from it                                                           |
| ----------------------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| `web-features`                      | 3.42.0                       | Baseline status per BCD key, `discouraged`                                     |
| `@mdn/browser-compat-data`          | 8.1.3 (already a dependency) | the key of a token (`support.ts` already finds it for the support warnings)    |
| `@webref/css`, alias `webref-specs` | 6.23.14                      | one file per **level** of a spec: members, keywords, functions, media features |
| `@webref/css` (8.7.5, in use)       | 8.7.5                        | not used here: it keeps the latest level of a series only                      |
| `baseline-browser-mapping`          | 2.11.28 (cssints-n12x)       | the minimum version of each downstream browser, per target (section 2)         |

All four are devDependencies of `packages/cssints`, pinned (`web-features` 3.42.0, `"webref-specs": "npm:@webref/css@6.23.14"`, `baseline-browser-mapping` 2.11.28),
and `scripts/groups.ts` writes the output, which is tracked.

### web-features

`features` has 1214 features of `kind: "feature"` (650 Baseline high, 123 low, 441 `false`), 10 `moved` and 2 `split` (redirects).
448 of the features list CSS keys: 3362 keys. Each feature has `compat_features` (BCD keys) and `status.by_compat_key`, the status
of **each key** (always present: the status of a key can differ from the feature's, which is the worst of its keys).
The words a status can have:

- `status.baseline`: `"high"`, `"low"` or `false`. Three groups: `widely-available`, `newly-available` (high and low) and
  `limited-availability` (everything).
- `discouraged`: an object (`according_to`, `reason`, `alternatives`, `removal_date`) on 13 CSS features (38 keys): `clip`, `color-adjust`,
  `ime-mode`, `overflow-overlay`, the 15 `page-break-*` aliases, `word-break: break-word`, `text-decoration-line: blink`, device media
  features, SVG 1.1 `writing-mode` values, `:host-context()`. One group, **`not-discouraged`**: it is a different axis, not a rung of the
  Baseline ladder, so it is its own group and not a fourth rung.
- There is no "fallback" status. The user remembered a word-valued status of that kind; web-features 3.42 has `high`, `low`, `false`
  and the `discouraged` object, and nothing else that is word-valued.

Skipped, with the reason:

| Candidate                                            | Why not                                                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `kind` (`moved`, `split`)                            | redirects of feature ids; the keys moved to the target feature                                                          |
| `group` (topics such as `grid`)                      | a taxonomy of features, not a status; the spec groups cover "everything about Grid"                                     |
| `snapshots`                                          | ECMAScript only                                                                                                         |
| `status.support` (first versions)                    | versions, not a word; `browserslist` targets and the support warnings already read BCD for that                         |
| BCD `deprecated`, `experimental`, `standard_track`   | booleans of BCD, not of web-features; `deprecated` is nearly `discouraged`. The same mechanism would take them if asked |
| `baseline-2023`, `baseline-2024`, … (Baseline years) | not a status word, but a date: done as a predicate on `baseline_low_date` (cssints-n12x, section 2)                     |

### BCD keys ↔ tokens

BCD has 4175 `css.*` keys. 3308 (79%) are listed in web-features; of the 867 others, 172 are non-standard or deprecated, and the
rest are sub-features of a listed key (`css.properties.animation-composition.replace` under `animation-composition`). Rule:
**a key takes the status of its nearest listed ancestor; a key with no listed ancestor is limited availability.** One override:
the keywords of `cursor` take the status of `cursor` (web-features counts every keyword limited for lacking iOS Safari, which has
no pointer; the wayfinder has the same finding for the support warnings).

What a token maps to (`css-grammar/src/support.ts`, `tokenKey`, the lookup of the support warnings, now exported):

| Token                                                        | BCD key                                                                                                                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| a property                                                   | `css.properties.<p>`                                                                                                                                                                                         |
| a keyword of a property                                      | `css.properties.<p>.<kw>` (also of the properties its grammar reaches through `<'q'>`)                                                                                                                       |
| a function                                                   | `css.types.<f>`, `css.types.<group>.<f>`; failing those the alias (`rgba` → `color.rgb`), failing that the keys a property has (`width.fit-content_function`, `grid-template-columns.minmax`); none: limited |
| a function only one property has                             | the same key, kept per property (`fit-content(` is banned in `width` and not elsewhere)                                                                                                                      |
| a unit                                                       | a table of 30 lines: `css.types.length.container_query_length_units` is `cqw cqh cqi …`, and so on                                                                                                           |
| a media feature                                              | `css.at-rules.media.<feature>`                                                                                                                                                                               |
| `scroll-state(`, `style(`, `anchored(`                       | `css.at-rules.container.*`                                                                                                                                                                                   |
| `selector(`, `font-tech(`, `font-format(`                    | `css.at-rules.supports.*`                                                                                                                                                                                    |
| a pseudo-class wrapper                                       | `css.selectors.<name>`                                                                                                                                                                                       |
| `media`, `container`, `supports`, `keyframes`, `positionTry` | `css.at-rules.<name>` (`positionTry`: also the property)                                                                                                                                                     |

### @webref/css: why version 6

The package of 8.x is a consolidated list and says so: "when a CSS feature is defined in different levels in the same spec
series, the data matches the definition from the latest level". `any-hover` is then a feature of `mediaqueries-5`, and
`mediaqueries-4` owns one entry of the 60. The user's own example, `cssints/mediaqueries-4`, would be empty. The 6.x line still
ships (6.23.14 on 2026-10-07) and keeps **one file per level**: `mediaqueries.json` is Media Queries 4, `mediaqueries-5.json` is 5,
`css-grid.json` is Grid 2, `css-grid-3.json` is 3. The shortname is the last part of `spec.url` (`https://drafts.csswg.org/css-grid-2/`
→ `css-grid-2`), the name @webref/css uses everywhere. GitHub was not reachable from here, so the per-spec files of the webref
repository (`ed/css`) were not an option; the npm package is the pinned source.

117 files; the CSS drafts of `drafts.csswg.org` and `drafts.fxtf.org` are used (the SVG, HTML, WebVTT and compat specs are not),
and a spec becomes a group when it has at least one member of `cssints`: **92 spec groups**.

## 2. What a group is

A group has **members** (the names the subpath exports) and **bans** (the tokens a value may not hold):

- Members: the property builders (and their short names `p`, `pt`, …), the functions, the pseudo-class wrappers, `media`, `container`,
  `supports`, `keyframes` and `positionTry`. 707 names in all. Everything else is in every group (`group-common.ts`).
- Bans: for each property its keywords (and `name(` for a function only that property has), the functions, the units, the media
  words and the words of container and supports queries.

### Baseline groups

A token is out when its key is out: `widely-available` bans level > 0, `newly-available` level > 1, `not-discouraged` the
discouraged flag. `limited-availability` bans nothing, so it **is** `cssints` (`export * from "../types.ts"`; the plugin treats the
import as `cssints`).

| Group                  | Members of 707 | Banned: properties with keywords / keywords | functions | units | media features |
| ---------------------- | -------------: | ------------------------------------------: | --------: | ----: | -------------: |
| `widely-available`     |            521 |                                    78 / 156 |        26 |     4 |             11 |
| `newly-available`      |            567 |                                     47 / 88 |        17 |     0 |             11 |
| `not-discouraged`      |            707 |                                       3 / 4 |         0 |     0 |              3 |
| `limited-availability` |            707 |                                        none |           |       |                |

### Downstream groups and Baseline years (cssints-n12x)

The user (2026-10-11) meant by "fallback" the `/with-downstream` of [browserslist-config-baseline](https://github.com/web-platform-dx/browserslist-config-baseline) (0.5.0):
the Baseline set, also checked against the Chromium downstream browsers at the minimum versions of
[baseline-browser-mapping](https://npmx.dev/package/baseline-browser-mapping) (bbm). That package offers three targets, and each is a group here, with and without
`/with-downstream`:

| Group                                   | Target in bbm                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `widely-available`, `…/with-downstream` | `widelyAvailableOnDate: "2026-10-09"` (the day web-features 3.42.0 came out; bbm's default is today minus 30 months) |
| `newly-available`, `…/with-downstream`  | `targetYear: 2026`, the last year (the same Chrome 153 that `useSupports` calls `newly`)                             |
| `baseline-YYYY`, `…/with-downstream`    | `targetYear: YYYY`, for 2015 (the first year in web-features: its `≤2015-07-29`) to 2026                             |

`baseline-YYYY` is cumulative: **a key is in it when its `baseline_low_date` (the status of that BCD key, the worst of the features that list it) is
in YYYY or before**. A key that is not Baseline has no date and is in none. It is the browserslist-config-baseline rule ("fully supported in Chrome, Edge,
Firefox and Safari at the end of the year"), read from the data instead of from a browser list. A year group is a Baseline group with another cut-off, so
the same bans apply (`baseline-2022` refuses `color-mix()`, which became Baseline in 2023; `baseline-2023` refuses `light-dark()`, 2024).
`baseline-2026` is today's `newly-available`; a later `bun run groups` makes it differ and adds `baseline-2027`.

**How a downstream browser decides.** bbm gives, for a target, one minimum version per browser: the first build whose engine is at least the minimum
Chrome (Opera, Opera Mobile, Samsung Internet and Android WebView from MDN's engine mappings; UC and QQ from user agents). A group `G/with-downstream`
has a member, keyword, function, unit or media feature when `G` has it **and** every downstream browser has it, by BCD, at that minimum version:

- `opera`, `opera_android`, `samsunginternet_android`, `webview_android` are the BCD browsers. `lackingOf` of css-grammar's support.ts decides, the rule of the build's
  support warnings: a statement counts when it has no `prefix`, no `alternative_name` and no `flags`; `partial_implementation` counts;
  `version_added` (`N` or `≤N`) is at most the minimum and `version_removed` is absent or later; `preview` and `false` do not count.
  A key BCD does not know, or a browser it lacks for that key, lacks nothing (so a limit of the data is a yes, as for the warnings).
- **UC and QQ** are not in BCD. Both are Blink, and bbm names the Chromium version of every build (`engine_version`), so each is checked as **Chrome at that
  version**: UC 17.6 is Blink 123, QQ 19.1 is Blink 121, UC 15.3 is Blink 100, QQ 11.7 is Blink 89. The effect is real: UC and QQ stay on Blink 123 and 121
  (UC 19.0 and QQ 20.6, 2026-08 and 2026-09), so for a target after 2023 the build bbm names does not have what Chrome 130 or 153 has, and the group is smaller.
  Skipping them would keep `newly-available/with-downstream` at 563 members; with them it is 533.
- The Baseline cut-off and the downstream check are independent: a key is judged by web-features for the group, and by BCD for the downstream browsers.

Minimum versions that bbm 2.11.28 gives (the browsers of the check; `op_mob` is Opera for Android):

| Target             | Opera | Opera Android | Samsung Internet | WebView | UC (Blink) | QQ (Blink) |
| ------------------ | ----: | ------------: | ---------------: | ------: | ---------: | ---------: |
| widely available   |   109 |            82 |             27.0 |     123 | 17.6 (123) | 19.1 (121) |
| 2015               |    31 |            32 |              4.0 |      44 |       11.6 |        8.1 |
| 2020               |    73 |            62 |             14.0 |      87 | 15.3 (100) |  11.7 (89) |
| 2023               |   106 |            80 |             25.0 |     120 | 17.6 (123) | 19.1 (121) |
| 2026, newly avail. |   137 |            99 |             30.0 |     153 | 17.6 (123) | 19.1 (121) |

Counts (members of 707; the banned keywords are summed over the properties that have a ban):

| Group              | Members | `/with-downstream` | Banned keywords, with downstream | Banned functions, with downstream | Media features, with downstream |
| ------------------ | ------: | -----------------: | -------------------------------: | --------------------------------: | ------------------------------: |
| `widely-available` |     521 |                520 |                        156 → 181 |                           26 → 26 |                         11 → 12 |
| `newly-available`  |     567 |                533 |                         88 → 167 |                           17 → 26 |                         11 → 12 |
| `baseline-2015`    |     220 |                220 |                        144 → 191 |                           72 → 72 |                         29 → 30 |
| `baseline-2016`    |     238 |                238 |                        148 → 185 |                           62 → 62 |                         29 → 30 |
| `baseline-2017`    |     286 |                286 |                        180 → 212 |                           60 → 60 |                         29 → 30 |
| `baseline-2018`    |     288 |                288 |                        181 → 204 |                           60 → 60 |                         25 → 26 |
| `baseline-2019`    |     292 |                292 |                        211 → 234 |                           60 → 60 |                         25 → 26 |
| `baseline-2020`    |     387 |                387 |                        169 → 198 |                           49 → 49 |                         20 → 22 |
| `baseline-2021`    |     436 |                436 |                        164 → 194 |                           49 → 49 |                         20 → 21 |
| `baseline-2022`    |     462 |                462 |                        168 → 211 |                           48 → 48 |                         16 → 17 |
| `baseline-2023`    |     512 |                511 |                        157 → 183 |                           29 → 29 |                         11 → 12 |
| `baseline-2024`    |     537 |                527 |                        147 → 172 |                           22 → 26 |                         11 → 12 |
| `baseline-2025`    |     547 |                529 |                        144 → 168 |                           20 → 26 |                         11 → 12 |
| `baseline-2026`    |     567 |                533 |                         88 → 167 |                           17 → 26 |                         11 → 12 |

What the downstream browsers lack, by BCD. In the members: `maskImage` (BCD has the prefixed `-webkit-mask-image` only for Opera), `scrollbarWidth` and `scrollbarColor` (Android WebView:
`false` at every version, so they are out of every cut-off from 2024), and in the groups from `newly-available` to `baseline-2026` the members that Blink 121 and 123 (QQ and UC) do not have, among them `anchorName`, `positionArea`,
`lightDark`, `round`, `mod`, `rem`, `textWrapStyle`, with nine more banned functions. In the values: `inline-size: fit-content` and the three other logical sizes (Samsung Internet has only
`-webkit-fill-available`), `shape-outside: xywh()`, `white-space: preserve-spaces`, the `x-start` and `x-end` positions of `background`, and the media feature `prefers-contrast`. `baseline-2015` to
`baseline-2022` change in keywords only: most are keywords that web-features does not list (they take the status of their property, so they were Baseline with it) and that BCD dates later in the downstream browsers
(`text-decoration: wavy`, `font-variant: small-caps`, `flex: fit-content`): the downstream check reads the exact key, so it is the finer of the two.

The data is a mirror of BCD and of bbm's tables, so it is as good as they are: bbm says of UC, QQ and the rest that "browser mappings from useragents.io are provided on a best effort basis".

### Spec groups: does a level include the earlier ones?

**Yes: a level has the levels of its series before it.** Every level is a delta over the one before (Color 5 over Color 4, Conditional 4
and 5 over 3) or a rewrite that holds it (Media Queries 4 over 3, Grid 2 over 1), and "I write for Color 5" means Color 3, 4 and 5.
By files: `cssints/css-color-5` = `css-color-4` + `css-color-5` (the series is the shortname without its level number; the files
of a series that are not in 6.23.14, such as Grid 1, are inside the first one that is). The group of a level **bans what only the
later levels of its series define**: `css-color-4` has no `colorMix` and refuses `color-mix()`, `light-dark()` and `contrast-color()`;
`mediaqueries-4` refuses 16 media features of Media Queries 5; `css-animations-1` refuses `animation-duration: auto` (Animations 2);
`css-sizing-3` refuses `width: fit-content` (Sizing 4 adds the keyword, Sizing 3 has `fit-content()` only).

What a spec group does **not** do, and says so in the API doc:

- A type the spec only references is open. `accentColor` of `css-ui-4` takes any `<color>`, `color-mix()` as text included: Color is
  another series. Narrowing every function against every spec in the group would refuse `calc()` in `grid-template-columns`, which
  Values 4 defines. The rule is the narrowest that does not do that.
- A property that a spec extends and does not define (Grid 2 adds `grid` to `display`) is in the group of the spec that defines it
  (`css-display-4`): import from several groups in one file.

92 groups, 1 to 78 members, median 10. Some are one member (`mediaqueries-4` has `media` and its features).

## 3. Narrowing in the types

Rejected:

1. **A group parameter threaded through the recognizer** (`css.ts`): `Props` and `Syns` are module-level aliases that `Consume` and its helpers
   (`Star`, `ListRest`, `AnyOrder`, `Pend`, …) read, so each would take the parameter, and an added parameter multiplies the
   instantiation keys of every program, also one that imports `cssints` and no group. The budgets exist to stop exactly that.
2. **A grammar table per group** (`mdn.ts` filtered): 1 MB of literals a group, plus the same parameter.
3. **Filtered keyword unions**: `keywords.ts` is a table for completions, and it holds keywords, not the functions and units.

Chosen: **the grammar says yes first, then the value is read for banned words.** `GProp<B, P>` (`group-types.ts`) is `Prop` with
the check `Check<P, A>` unchanged; when it passes (the result is `A` itself), each part is scanned, and the first part with a banned
word becomes the message. `B` is a type literal the generated module declares for its group (`kw`, `fn`, `unit`, `media`, …).

- The scan is cheap when nothing is there: **one test of the substring** (`S extends `${string}${Banned}${string}``, a union of
  templates) comes first, and only a hit reads the words (`Words<S>`, tail-recursive, a run of word characters, with `name(` for a
  call). A unit follows a digit, so its test is `${Digit}${unit}`: two placeholders side by side (`${string}${number}`) would give the
  first one a single character.
- The words are those of the value text, so a banned function is found as a call of a member, as text, inside a `calc()`, in a
  `firstThatWorks` (every alternative is read), and in the arguments of another function (`GFn`, `GMath`).
- A media query goes through `GCondition` (`ValidQuery` first, then the words); `flex()` and `grid()` chain methods are
  `GChain` over the methods whose property the group has.
- The message is the build's: `color: "light-dark()" is not in cssints/widely-available` (the build adds `cssints: `).
- **Cost.** A program that does not import a group pays nothing (nothing in `css.ts`, `parts.ts` or `types.ts` changed; `users.ts`
  and the other benches are unchanged by this work: 972,057 instantiations on tsgo with and without the two `export type` lines I
  added). A program that does: `bench/groups.ts`, `users.ts` without the anchor-positioning lines, 105 calls, from
  `cssints/widely-available`: **tsgo 920,076 → 946,712 (+2.9%), tsc 908,453 → 934,353 (+2.9%)**, about 250 instantiations a call. The
  budget of `groups.ts` is that file's own number.

## 4. Narrowing in the build

The plugin treats `cssints/<id>` (a group, or `limited-availability`) like `cssints`: the attribute makes its bindings site roots;
without the attribute it is the same located error (`imports build-time display from "cssints/widely-available" without the
attribute`); `cx` is gone from every group, as from `cssints` (importing it from a group is the same migration error; the SVG property is `css.cx`). `instrument.ts` rewrites it to `const { … } = __group0("widely-available")` instead of
`__css0`. `__group(id)` (`macro.ts` → `group.ts`) is `css` behind a `Proxy`:

- a **tied** name (a property, function, pseudo-class, `media`, …) that the group lacks is a function that throws when **called**,
  so the error has the call's file, line and column (reading it at the import would have none);
- a property member scans the declarations it built (the value and the other values of a `firstThatWorks`) for the words of the
  group, by the same words as the types (`[^ ,)/:;"'<>=+*[\]{}!#%.⟨⟩&|\n\t(]+\(?`);
- `flex()`/`grid()` results are wrapped so that `.gap()` is checked as `gap` too (property in the group, then the words);
- `media`, `container`, `supports` read the query strings.

Nothing else changes: the engine's hot paths (hash, twin, sheet) are untouched, and a module with no group import takes no
new branch (`isCssints(source)` is a string comparison per import). The Quint model (HMR) is untouched: no await point moved and
nothing about invalidation changed.

## 5. Export shape, count and size

- **122 subpaths** (cssints-n12x: 96 before): 3 Baseline groups, 26 Baseline year and downstream groups, 92 spec groups, `limited-availability`. One entry in `package.json` (and in `publishConfig`)
  per field, a pattern, `"./*"` (it matches `widely-available/with-downstream` too: Node's patterns let `*` hold `/`, and so does TypeScript's `paths`-like matching of `exports`; `src/groups/widely-available/with-downstream.ts`, `dist/groups/…`): `development` → `./src/groups/*.ts` (types) and `./src/index.ts`, `types` → `./dist/groups/*.d.mts`, default
  → `./dist/index.mjs` (the eval-time library; a bundler that meets the import without the plugin gets no member, as with `cssints`).
  The exact keys (`./vite`, `./plugin`, …) win over the pattern.
- **Generated** by `bun run groups` (`scripts/groups.ts`): `src/groups-data.ts` (what the build reads: members and bans as
  space-separated strings, 65 KB) and `src/groups/<id>.ts` (what TypeScript reads, 239 KB for 96 files, 2.5 KB on average; the three
  Baseline modules are 34 to 41 KB each). Only what a file uses is imported, so the generated files pass the linter.
- **Built** by `vp pack`: one `dist/groups/<id>.d.mts` each, from the entries of `vite.config.ts` (the list is the directory).
- **Size.** The 96 groups: `dist/` 762,974 → 1,177,073 bytes (+414 KB, of which 343 KB are the 96 declaration files); the tarball gains
  about 100 KB gzip. The engine loads `groups-data.ts` (65 KB of strings) with the plugin, and splits a group's string when the group is first used.
  The 26 groups of cssints-n12x are as large as the Baseline groups (35 KB of declarations, 6.7 KB gzip, each), so the plain shape (one file of members per group)
  cost +109 KB in the tarball (303 → 412 kB; `dist/` +1 MB, 2.4 MB unpacked). The shape chosen costs **+81 KB (303 → 384 kB; `dist/` 2.3 MB; the data module 74 → 320 KB, +7.6 KB gzip)**:
  1. **A `/with-downstream` group re-exports by name** the members it shares with its Baseline group, `export { alignItems, … } from "../widely-available.ts"`, when the two have the same banned functions and units
     and, for that member, the same banned words (a property's keywords, a condition's queries). It declares the rest. A downstream file is 21 KB, not 35 KB (4.6 KB gzip, not 6.7).
     The shared members say "is not in cssints/widely-available" for a word both ban, which is true of both. It works where the functions and units are equal: 12 of 14 pairs; the others
     (`newly-available`, 2024 to 2026: UC and QQ ban a function more) declare everything.
  2. **A Baseline group the same as an earlier one is that group**: `baseline-2026` is `newly-available` (and the same for `/with-downstream`), `export * from "./newly-available.ts"`; the editor's message names `newly-available`, the build's names the group written.
     The declaration bundler (rolldown-plugin-dts) writes `export *` and a re-export out as a list of names, twice (`import` and `export`), so a file is a list of names however it is written in `src/groups`: 6 to 16 KB, and that is the floor
     of the shapes tried. Not done: sharing one ban table (it is 4 KB of 35, the members are the rest), a member typed by the group's id through a registry (the line differs per group
     all the same), and ending a group's `P<"background-color">` in the member's own name (the property is derivable, 25% of the gzip size of a file, a rewrite of all 122 files).
- **JSDoc.** The members of a group carry no JSDoc (the grammar, the browser row and the MDN link of `members.ts`): it would be 140 KB
  more for each Baseline group. The hover shows the signature.
- **Playground** (`apps/docs/plugin/playground.ts`): the editor's types gain an entry per group (the build runs the plugin from the
  source in the worker, so only the types needed an edit).

## 6. Left out, and open

- Chain methods of `flex()`/`grid()` are narrowed by property and by word, not by the group's members of `align-*`: they follow
  the properties.
- `css` (the object) is not exported by a group; `import * as css from "cssints/<group>"` is the form.
- A token that nothing in BCD or webref names is not narrowed (a function with no BCD key is limited availability, a keyword with no
  key is open). The data is as good as the sources: `web-features` calls `fit-content()` limited, `round()`, `mod()` and `rem()`
  newly available.
- A feature that the spec groups cannot attribute: units of the container query family (@webref/css 6 does not list `cqw`), so a
  spec group does not ban units except those of a type value list; `css-values-4`/`5` carry `calc`-like functions, not units.
- `not-discouraged` has nothing to refuse among the members: the discouraged properties are not members of `cssints` (the grammar
  holds the standard and experimental ones), so it bans four keywords and three media features.
- Follow-ups: `standard-track`, JSDoc in the groups (a hover), and a `check_group` tool for `@cssints/mcp`.
