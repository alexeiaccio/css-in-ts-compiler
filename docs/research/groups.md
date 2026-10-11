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

All three are devDependencies of `packages/cssints`, pinned (`web-features` 3.42.0, `"webref-specs": "npm:@webref/css@6.23.14"`),
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
| `baseline-2023`, `baseline-2024`, … (Baseline years) | not a status word; a predicate on `baseline_low_date`, 35 KB of declarations a year. A follow-up if asked               |

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

- **96 subpaths**: 3 Baseline groups, 92 spec groups, `limited-availability`. One entry in `package.json` (and in `publishConfig`)
  per field, a pattern, `"./*"`: `development` → `./src/groups/*.ts` (types) and `./src/index.ts`, `types` → `./dist/groups/*.d.mts`, default
  → `./dist/index.mjs` (the eval-time library; a bundler that meets the import without the plugin gets no member, as with `cssints`).
  The exact keys (`./vite`, `./plugin`, …) win over the pattern.
- **Generated** by `bun run groups` (`scripts/groups.ts`): `src/groups-data.ts` (what the build reads: members and bans as
  space-separated strings, 65 KB) and `src/groups/<id>.ts` (what TypeScript reads, 239 KB for 96 files, 2.5 KB on average; the three
  Baseline modules are 34 to 41 KB each). Only what a file uses is imported, so the generated files pass the linter.
- **Built** by `vp pack`: one `dist/groups/<id>.d.mts` each, from the entries of `vite.config.ts` (the list is the directory).
- **Size.** `dist/`: 762,974 → 1,177,073 bytes (+414 KB, of which 343 KB are the 96 declaration files); the tarball gains
  about 100 KB gzip (`src/groups` + `groups-data.ts` 49 KB, `dist/groups` 52 KB). The engine loads `groups-data.ts` (65 KB of strings) with
  the plugin, and splits a group's string when the group is first used.
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
- Follow-ups: Baseline years, `standard-track`, JSDoc in the groups (a hover), and a `check_group` tool for `@cssints/mcp`.
