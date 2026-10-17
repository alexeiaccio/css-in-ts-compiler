# Named colours: a plugin on the Color Name List (cssints-sh52)

Question: can cssints ship a named-colour plugin (`named("tangerine")`) on the Color Name List (names.color.pizza),
and what does it cost in data, types, build and release? Measured on 2026-10-17 on one machine: tsc 5.9.3, tsgo
7.0.0-dev (the repo's bin), Node 24.22, culori 4.0.2 (the version in packages/gradient). Timings move about ±30 %.
The spike files are in a scratch directory outside the repo (`$TMPDIR/opencode/names-spike`), not committed.

## Answer

1. **MVP: `named()` as a value member** of a new `@cssints/color-names` package. It returns a hex colour; the data is the
   npm package `color-name-list`, a dependency and not a copy. Names are checked in the types. An unknown name is a
   build error with edit-distance suggestions.
2. **Not a token set.** 31,935 DTCG leaves take 15 to 26 s to type-check and about 3.6 M instantiations, near
   TypeScript's 5 M limit.
3. **Reverse lookup (`nearest(hex)`, oklch) is build-time only**, in its own subpath. Client code must never import it.
4. **Keys:** lowercase, letters and digits kept, `&` becomes `and`, every other run becomes `-`. One collision in
   31,939 names.
5. **Release:** the fixed group goes from 23 to 24 packages. The first publish of the new name is by hand.

## The data (facts)

| Fact             | Value                                                                                                                           | Source                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Names            | 31,939 (full), 4,967 (`bestOf`), 3,088 (`short`). `bestOf` and `short` are subsets of full, same name and hex                   | `color-name-list@14.61.0`, `dist/colornames*.json`                                                                  |
| Shape            | `{ name, hex }`. Hex only (`#rrggbb`, all valid, all hex values unique). No oklch, no lab in the data                           | `dist/colornames.json`, `colornames.d.ts`                                                                           |
| Formats          | JSON, min JSON, CSV, YAML, TOON, ESM, UMD, XML, HTML, SCSS, per subset                                                          | `dist/`                                                                                                             |
| Size, raw / gzip | full JSON 1,276,370 / 315,514 B; full min JSON 765,346 / 300,955; `bestOf` JSON 196,233 / 52,632; `short` JSON 114,840 / 30,726 | `gzip -9` of the files                                                                                              |
| Package          | npm tarball 5.3 MB, 19.3 MB unpacked                                                                                            | `npm pack color-name-list@14.61.0`                                                                                  |
| Licence          | MIT, copyright David Aerne (2017). The README asks for "simple attribution"                                                     | [LICENSE](https://github.com/meodai/color-names/blob/main/LICENSE), [README](https://github.com/meodai/color-names) |
| Versions         | 540 on npm; 52 in 2026; latest 14.61.0 on 2026-10-17; 10 releases from 14.52.0 (2026-10-13) to 14.61.0                          | `npm view color-name-list time`                                                                                     |
| History          | 519 dated entries from 2017-04-23 to 2026-10-17: 33,920 added, 1,908 removed, 26,351 changed (a name with a new hex)            | `dist/history.json`                                                                                                 |
| API              | `https://api.color.pizza/v1/` (no key, no limit; asks big users to sponsor). Matching is CIEDE2000 on Lab                       | [API docs](https://api.color.pizza/v1/docs/), [API README](https://github.com/meodai/color-name-api)                |

**What `model=oklch` means.** On names.color.pizza it selects the projection of the 3D "colour distribution" plot. The
site's bundle has four models, `rgb`, `oklab`, `oklch` and `hsl`, and the default is `rgb` (`Ne = "rgb"`). The page does
not look up a nearest name. The API has no `model` parameter (its OpenAPI parameters are `list`, `values`,
`noduplicates`, `goodnamesonly`). So the site's `oklch` is a view. Our matching space is ours to choose.

**Oklch from hex.** The data has no oklch, so convert at build time. Converting all 31,939 hex values with culori's
`converter("oklch")` takes 31 ms. Storing rounded oklch changes some colours back to other hex values:

| Stored decimals (L, C, H) | Colours whose hex changes after the round trip | Largest oklab distance |
| ------------------------- | ---------------------------------------------: | ---------------------: |
| 3, 3, 1                   |                                          2,459 |                 7.1e-4 |
| 4, 4, 2                   |                                             10 |                 7.1e-5 |
| 2, 3, 0                   |                                         25,850 |                 5.4e-3 |

Store hex, which is exact. Convert to oklch in the build when a number is needed.

## The repo (facts)

- `scope()` has a value member, `fn({ args, value })` (packages/cssints/src/scope.ts:167). With `args: arg<T>()`, `value`
  gets `[value: T]` (`Params`, scope.ts:402). A value returns `string | CSSStyleValue`. `@cssints/gradient` returns
  `new CSSImageValue(...)` (packages/gradient/src/index.ts:32), so a colour can return `new CSSColorValue(...)`.
- `cssints/plugin` exports plain build-time helpers too: `lacking`, `inGroup`, `dependsOn` (docs/API.md "Plugins").
- Data packages: `@cssints/tokens` has no runtime and no `scope()`; `scripts/generate.ts` writes `src/*.ts` from pinned
  devDependencies and files (README "Licenses": each set keeps its source's licence). `@cssints/ramp` and
  `@cssints/rybitten` compute at build time (ramp uses culori). `@cssints/icons` says the collections (`@iconify-json/*`) are
  "your dependency and are not shipped".
- culori: `cssints` depends on `culori ^4.0.2` (dependencies); `gradient` and `ramp` too.
- Plugin packages' `src/` are plain code (`plainCode` in vite.config.ts); their fixtures go in `inputs`.
- The DTCG cost table in packages/tokens/README.md: all 453 Open Props tokens and `shadowsDark` cost 2.7 M
  instantiations, 1.8 s.

## Recommendation: the MVP

```ts
// packages/color-names/src/index.ts (sketch)
import { arg, fn, scope } from "cssints/plugin";
import { CSSColorValue } from "cssints";
import type { Name } from "./names.ts"; // generated: the union of the keys
import { hexOf } from "./data.ts";

export const { named } = scope("names", {
  named: fn({ args: arg<Name>(), value: ([name]) => new CSSColorValue(hexOf(name)) }),
}).export();
```

```ts
// card.ts
import { bg, cn, color } from "cssints" with { type: "cssints" };
import { named } from "@cssints/color-names" with { type: "cssints" };

export const tag = cn(
  color(named("tangerine")), // #ff9300 in the sheet
  bg(named("midnight-blue")), // #020035
);
export const bad = color(named("tangerin")); // error: not a name (the types), and at build time with "did you mean"
```

The output is hex, not oklch. The list holds hex, so hex is exact. An `oklch()` value also gets a support warning for old
targets (docs/API.md, "Tokens"); a hex value does not. An oklch option can come later.

**Unknown names.** The types reject them first. A build error (`MemberError` at the call site) gives the nearest keys
by edit distance, up to 3 edits. The first spike measured 110 to 200 ms per error with an unoptimised Levenshtein over
31,938 keys: fine for an error path. The brief asked for colour-distance suggestions too. They do not apply here: an
unknown name has no colour. A colour can come only from a hex input, which is the job of `nearest()` below.

**Subsets.** `bestOf` (4,967) would be a second subpath, `@cssints/color-names/best`. The type cost of the union
does not grow with its size (table below). The reason to add it is the completion list, not the check time.

### (a) `named()`: the cost

See the table in "Types". The full list costs no more in the types than a 1,000-name list. The member's grammar is one
alias, `Name`, so messages say `parameter of type 'Name'` and do not print the union.

### (b) A token set: no

`@cssints/tokens/color-names` as 31,935 DTCG leaves, one `createTokens` call:

| Leaves                 | Check time (s) | Instantiations | Peak RSS (MB) |
| ---------------------- | -------------- | -------------: | ------------: |
| 1 (baseline)           | 1.36           |         11,445 |           263 |
| 1,000                  | 1.47           |        123,359 |           349 |
| 5,000 (about `bestOf`) | 3.63           |        571,411 |           408 |
| 31,935 (all)           | 15.4 to 25.7   |      3,588,469 |    787 to 970 |

Every leaf also makes a token that can be set, and each used token gets its own `@property` rule. A set of names is a
lookup, not a design token. Do not ship it as tokens.

### (c) `nearest(hex)`: build time only

Convert the list once (31 ms), then scan (4.6 ms with the table and one query, measured by a spike that uses an
approximate hue term, not a reference formula). A first query for `#3b82f6` returned Dodger Blue (`#3e82fc`). Uses:
generated comments, the docs site, devtools, and suggestions for a hex input.

It must stay out of the browser. A plain export is an ordinary module import: if a client module imports it, the whole
data (1.27 MB JSON) goes into the bundle. Put it in `@cssints/color-names/nearest` and document it as build-only, like
`lacking` and `inGroup`.

### (d) names as `createTokens` leaves: no

A leaf takes a DTCG `$value`, a string. `named()` returns a typed value. A `hexOf()` export would have the same problem
as (c) in the client. Not in the MVP.

## Types (measured)

The spike generates files from the list: 1,000 and 5,000 names evenly sampled, and all 31,935 unique keys. Each row is
the range of up to three `tsc 5.9.3 --extendedDiagnostics` runs (`/usr/bin/time -l` for the RSS). The plain-union files
also pass `tsgo`, which prints 0 instantiations for them; `tsgo` was not run on the scope files.

| Case                                    |  Names | Check time (s) |  Types | Instantiations | Peak RSS (MB) |
| --------------------------------------- | -----: | -------------- | -----: | -------------: | ------------: |
| plain `(name: string)`, baseline        |      0 | 0.24 to 0.33   |     94 |              0 |       217–223 |
| plain union `(name: Name)`              |  1,000 | 0.19 to 0.38   |  2,094 |              0 |       219–224 |
| plain union                             |  5,000 | 0.15 to 0.20   | 10,094 |              0 |       232–243 |
| plain union                             | 31,935 | 0.22 (3 runs)  | 63,972 |              0 |       289–292 |
| object `as const` + `keyof`             | 31,939 | 0.32 to 0.43   | 95,911 |              0 |       333–342 |
| scope member, `arg<string>()`, baseline |      0 | 1.9 to 3.0     | 11,034 |         19,268 |       274–312 |
| scope member, `arg<Name>()` (the MVP)   |  5,000 | 1.9 to 2.5     | 21,035 |         19,273 |       302–326 |
| scope member, `arg<Name>()` (the MVP)   | 31,935 | 2.0 to 2.4     | 74,913 |         19,273 |       318–340 |

- The scope rows use `cssints/plugin` and `cssints` from the worktree's `src` (through `paths`). A bad name is an
  expected error (`@ts-expect-error`): the file passes, so the error is there. Timing noise is large; the rows show no
  growth with the union.
- The instantiations do not grow with the union: the union is a type, checked when a call is made, not instantiated.
- Editor, tsc's language service (warm): `named("|")` offers 31,939 completions in 55 ms. The first call takes 1.4 to 1.9 s
  (it builds the program). A bad name gives a 68-character message with the alias. The same union written inline in
  the parameter prints 280 characters of union in the message. Keep the alias.
- Not measured: the grammar route (`args: "<name>"` through css-grammar's recogniser). A recogniser over 31,939
  alternatives was not tried. Use `arg<Name>()`, which the API documents.

**Verdict on types.** A union of all names in an `arg<Name>()` costs nothing measurable. If it ever did, the fallback is
`string` plus the build error that the value function gives anyway.

## Data in the package

- **Recommended: depend on `color-name-list`** (an exact version, like the pinned upstream of `@cssints/tokens`). The
  plugin reads `colornames` at evaluation. Nothing is copied, a bump is one line, and the package's own code stays small.
  The price is the install: 5.3 MB compressed, 19.3 MB unpacked, with nine formats the plugin never reads. This is the
  `@cssints/icons` pattern.
- **Alternative: copy the data** into `src/data.ts`, as `scripts/generate.ts` does for tokens: name and hex as TSV is
  636,233 B raw, 285,841 B gzipped. The key union (`src/names.ts`) is 539,973 B raw, 145,790 B gzipped, for 31,938 keys.
  Copying needs the MIT notice in the package. It buys nothing that the dependency does not.
- **Lazy:** a `Map` from key to hex, built on the first call. Parsing the 1.27 MB JSON takes 35 ms, once per process.
  The runner should load a dependency natively and cache it (a guess, to check with `ssr.external` in the spike).
- **Browser:** nothing ships. A site becomes `color: #ff9300`. The package has no runtime, like tokens and ramp. The
  plugin is imported only with the attribute, so its module never enters the client bundle.
- **Tree shaking:** there is no per-name import; the list is one array. A subset is its own module if one is needed.

## Keys and collisions

**Key rule.** NFC, lowercase, `&` to `and`, apostrophes removed, every run of characters that is not a letter or a digit
becomes `-`, trimmed. Examples: `Tangerine` → `tangerine`, `Rebecca Purple` → `rebecca-purple`, `Pepper & Spice` →
`pepper-and-spice`, `Rosé` → `rosé`, `Pi²` → `pi²`.

- **31,938 keys for 31,939 names.** The one collision is `World’s Away` and `Worlds Away` (both `worlds-away`). The
  generator fails on it and names both; a one-line alias table fixes it.
- A naive ASCII kebab (accents removed) gives four collisions: `Pepper & Spice`/`Pepper Spice`, `Pi`/`Pi²`, `Rose`/`Rosé`,
  `Sable`/`Sablé`. Keeping the letters avoids them.
- 42 names contain a digit (`100 Mph`, `24 Carrot`). As a `named()` key that is fine (`"100-mph"`). As a DTCG token key,
  a key that starts with a digit needs the `_` prefix (packages/tokens/README.md).
- 743 names are not ASCII, 441 have an apostrophe, 25 have `&`.

**Against CSS named colours** (148 keywords, the list in culori's `colorsNamed`):

- 63 keywords have a list name with the same hex (`red` #ff0000, `orange` #ffa500, `purple` #800080).
- 63 have a list name with a **different** hex: `green` is CSS #008000 and the list's "Green" is #00ff00; `lime` is CSS
  #00ff00 and the list's "Lime" is #aaff32; `navy` is CSS #000080 and the list's "Navy" is #01153e.
- 22 have no list name of that spelling (`gray`, `slategray`, `deeppink`, `dimgray`, ...).

So `named("green")` is not `color: green`. Keep the two apart in the docs, and output hex only, never the keyword.

**Against the token sets.** The hue names of the sets are list names too: Open Props colours 17 of 19 (`blue`, `red`,
`teal`, ...), Radix `light` 30 of 31 scales, Flexoki 8 of 9, Reasonable Colors 23 of 25. They clash only if both sit in one
group. `named()` has its own namespace, so there is no CSS variable clash.

## Risks

- **Licence.** MIT, with the attribution the README asks for. The README lists many sources (Wikipedia, paint makers,
  fiction). I did not check each source's licence. The list is a set of short names, not text, so I expect no problem,
  but that is a guess; a lawyer should read it before a release that ships the data.
- **Churn.** Names change between versions. On 2026-10-16 "Medusa Green" and "Snot" were removed and "Beda Blue" was
  added (`history.json`). A removed name breaks user code at the type check. Pin the version, test that the key union
  equals the data, and say in the changeset which names went.
- **Offensive and brand names.** The list's disclaimer says it removes offensive, racist and protected brand names, and
  that "some may inadvertently remain". Brand-like names are in it now: "Tiffany Blue", "Barbie Pink", "Ferrari Red",
  "Crayola Green", "Windows Blue", "Yahoo". I did not search the list for slurs. The disclaimer asks for reports to the
  upstream issue tracker.
- **Install weight.** 5.3 MB for a plugin that reads one array (see "Data in the package").
- **Completions.** 31,938 items in the editor. `bestOf` is the answer if that hurts.
- **One upstream maintainer** (a guess from the contributor list), with 3,000 GitHub stars. A fork is possible; the data
  is MIT.

## Test plan

- `test/names.mjs`: the plugin on fixtures. `color(named("tangerine"))` prints `color:#ff9300`; `named("tangerin")` is a
  build error that suggests `tangerine`; the key rule (`Rosé`, `Pi²`, `Pepper & Spice`); the collision error.
- `test/data.mjs`: the key union (`src/names.ts`) equals the keys of the pinned data. A bump that removes a name fails here.
- `test/types/names.ts`: `@ts-expect-error` for a bad name and for a `string` argument.
- `bench/`: the scope member with `arg<Name>()`, in `bench/budget.json` (the table above; the members use the budget rule
  of cssints-contributor, a rise over 1.1 times fails).
- docs: a section in docs/API.md, a row in the "Plugin packages" table, a README with the rules, and `docs.mjs` for the ts blocks.
- No browser test: there is no runtime.

## Release: 23 becomes 24

- `.changeset/config.json`: add `@cssints/color-names` to the `fixed` array (it has 23 entries now).
- Text that says 23: RELEASING.md (lines 3, 8, 17, 18, 57, 86: "Twenty-three", "all 23", "23 times"); AGENTS.md (lines 38,
  39, 73, 74); one row in the "Plugin packages" table of docs/API.md.
- The first publish of a new name is by hand: "A trusted publisher can be added only to a package that exists, so this
  comes after the first release" (RELEASING.md, "Trusted publishers"). Then the CI release publishes all 24.
- A changeset: one line. A new package on 0.x is a minor.
- Tracked `dist/` is only for cssints, css-grammar, icons and mise-en-mode. The new package does not track it.

## What I could not verify

- The grammar route for the names (`args: "<name>"`). Not built.
- That `color()` accepts a `CSSColorValue` from a value member. Not type-checked in the repo; a type test should settle it.
- That the engine's runner caches `color-name-list` as an external dependency (a guess).
- Editor latency beyond tsc's language service: no tsgo language-server run.
- Per-source licences of the list, and a search for slurs.
- The nearest colour against a reference implementation (the spike's hue term is approximate).
- The real plugin path end to end: no plugin was built, no CSS was emitted.
