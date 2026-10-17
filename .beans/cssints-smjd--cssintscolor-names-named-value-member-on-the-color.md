---
# cssints-smjd
title: '@cssints/color-names: named() value member on the Color Name List'
status: todo
type: feature
created_at: 2026-10-17T10:21:19Z
updated_at: 2026-10-17T10:21:19Z
---

Design and measurements: docs/research/color-names.md (2026-10-17, cssints-sh52).

- [x] package @cssints/color-names (25th of the fixed group): `named("tangerine")` is a value member returning hex as a `CSSColorValue`. `color-name-list` 14.61.0 is a **dependency**; `scripts/generate.ts` reads it and writes `src/<sector>.ts` (committed, 1.5 MB: the record of key to hex plus the key union written out), so the plugin, its types and the docs playground are self-contained
- [x] names checked in the types with `arg<Name>()` (31,939 keys after the collision alias; one `Name` alias for `named()`, one per sector: an error says `Red`, not the union). The **grammar route was not built**: a local syntax name would hold one alternative per key (31,939 alternatives in one ~500 kB string) that the table would carry and the twin would parse at every call, where `arg<Name>()` is the documented route for a TypeScript union
- [x] unknown name is a build error with edit-distance suggestions (`no colour name "tangerin", did you mean tangerine?`)
- [x] `nearest(hex)` (CIEDE2000 on Lab, by culori's `differenceCiede2000`) is `@cssints/color-names/nearest`, build time only, in its own subpath. `#3b82f6` gives dodger-blue `#3e82fc`, as the list's own API does. The engine has no marker for a build-time-only module: the subpath and the README line are the marker, as for `@cssints/tokens`' sets
- [x] the 63 CSS keywords whose list hex differs: `named()` resolves **list names** (`named("green")` is `#00ff00`), so the CSS keyword does not win and no name is suffixed; a CSS keyword stays a string (`color("green")`). 63 more share the hex, 22 have no list name of that spelling; all counts in the README
- [ ] per-source licences of the list and a search for slurs: **not done**. The README has the MIT attribution (David Aerne, 2017) and the list's own policy (it removes offensive and protected names, some may remain, brand-like names are in)
- [x] tests (`test/color-names.mjs`: the generated data and a fresh run of the generator, the key rule and the collision alias, `nearest()`, the engine's hex for `named()`/the sectors/the word rule/several sectors, the two errors; `test/types/color-names.ts`), README, a row in docs/API.md "Plugin packages", a changeset, the counts in RELEASING.md and AGENTS.md, the `plainCode`/fixtures lists, PLUGINS
- [ ] user: set up the trusted publisher on npmjs.com for the new package (RELEASING.md); the first publish of a new name is by hand
Not a DTCG token set: 31,935 leaves cost 15-26 s and 3.6 M instantiations.

## Idea from the user (2026-10-17): hue sectors

Split the names by hue so that completion is short and cheap: `colorNames.red("ferrari red")`. The type check does not need it (research: the union of all names costs nothing measurable); the editor does (`named("|")` lists 31,939 names).

- [x] sector = the colour word in the name, else the hue of the name's colour in oklch, computed by the generator. **Ten** sectors, not nine: a `brown` sector (hue 40-105, lightness below 0.7) was added, because without it the biggest sector stays above 6,000 names (the browns are most of `yellow`). `neutral` takes low chroma (below 0.02) and the gray/grey/white/black words
- [x] sector members `colorNames.<sector>(name)` with `arg<Sector>()`; the flat `named(name)` stays for an exact name
- [x] a name in the wrong sector is a build error that says the sectors it is in (`"abalone" is in neutral`), from a name-to-sector index built once when the module runs
- [x] measured: the biggest sector (`neutral`, 4,828) completes in 1 ms warm against 10 ms for the flat 31,939, and the union costs types, not instantiations (the scope member is 37,214 either way). Table in the README
- [x] data per sector in its own file (`src/red.ts` ... `src/neutral.ts`), each exported as one `as const` record plus its key union; nothing is in the client (the sheet holds the hex)
Risk: the user must guess the sector (a "red" may sit in orange). The error message is the mitigation.

## Sector rule, decided with the user (2026-10-17): the name's own colour word wins

A colour word in the name puts the name in that sector, even when its oklch hue says another (`ferrari red` is in `red()` though it is orange in oklch). Only a name with no colour word is placed by hue.

- Words are whole words (split on anything that is not a letter), not substrings: `redwood` and `bored` do not count. Words: red, orange, yellow, green, cyan, blue, purple, pink; gray/grey, white, black go to `neutral`.
- A name with several colour words goes to each of its sectors (`orange red` is in `orange()` and `red()`): nobody has to guess which word wins. Flat `named()` is unchanged.
- No colour word: the sector of its oklch hue; low chroma is `neutral`.
- The wrong-sector error lists the sectors the name is in.

Rough count on color-name-list (31,940 names; scratch script, thresholds not tuned): 7,198 names have a colour word (135 of them several), 24,742 are placed by hue. In 2,849 of the 7,198 the word and the hue disagree, so the rule moves them. Sector sizes: neutral 7,677, yellow 6,657, green 3,950, orange 3,629, blue 3,266, purple 1,976, red 1,878, pink 1,627, cyan 1,415. Yellow and neutral are too big for cheap completion, mostly browns and low-chroma colours: tune the hue cuts and the chroma threshold, or split `yellow` (brown) and `neutral` (gray, white, black) before the shape is final. Measure completion on the biggest sector.

## CSS keyword collisions (coordinator decision, 2026-10-17)

`named("green")` is the list's name (hex #00ff00), not the CSS keyword (#008000): the plugin is a colour-name lookup, and the list name is what the user asked for. CSS keywords stay reachable as plain strings (`color("green")`), which is the normal path. Document this in the README with the 63-of-148 number.

## Summary of Changes

New package `@cssints/color-names` (the 25th of the fixed group), its generated data, its tests, a row in docs/API.md, a minor changeset, and every package list and count updated (`.changeset/config.json`, AGENTS.md, RELEASING.md, the root CHANGELOG.md, `plainCode` and the fixtures list of vite.config.ts, PLUGINS of the docs playground).

`named(name)` is the list's hex as a `CSSColorValue`; `colorNames.<sector>(name)` is the same name in one of ten sectors. The name is a key of the list (NFC, lowercase, `&` to `and`, apostrophes removed, non-(letter|digit) runs to `-`): letters (accents kept), digits and hyphens, 31,939 keys. The list's one collision (`World’s Away` and `Worlds Away` both give `worlds-away`) keeps a hyphen for the apostrophe (`world-s-away`), so every name is reachable.

### Sectors (color-name-list 14.61.0, 31,939 names, 32,093 sector places)

| Sector | Rule | Names |
| --- | --- | ---: |
| `red` | hue below 30, or the word | 3,070 |
| `orange` | hue 30-70, or the word | 2,835 |
| `yellow` | hue 70-105, or the word | 4,179 |
| `green` | hue 105-165, or the word | 4,607 |
| `cyan` | hue 165-215, or the word | 1,805 |
| `blue` | hue 215-265, or the word | 3,570 |
| `purple` | hue 265-330, or the word | 2,269 |
| `pink` | hue 330-360, or the word | 1,736 |
| `brown` | hue 40-105 and lightness below 0.7, or the word | 3,194 |
| `neutral` | chroma below 0.02, or the gray/grey/white/black words | 4,828 |

7,703 names have a colour word (154 of them several), 24,236 are placed by hue, and the word and the hue disagree for 2,850. The word rule moved the sector of 2,850 names.

### Measurements (tsc 5.9.3 and tsgo 7.0.0-dev, 2026-10-17)

| Case | Keys | Types | Instantiations | Check (tsc) | Completion (warm) |
| --- | ---: | ---: | ---: | --- | --- |
| plain union, `named(name: Name)` | 31,939 | 63,971 | 0 | 0.10 s | — |
| plain union, the biggest sector | 4,828 | 9,749 | 0 | 0.05 s | — |
| scope member, `arg<Name>()` | 31,939 | 90,759 | 37,214 | 0.65 s | 31,939 in 10 ms |
| scope member, the biggest sector | 4,828 | 36,572 | 37,214 | 0.59 s | 4,828 in 1 ms |

The union costs types, not instantiations; the two scope rows share the 37,214 instantiations of the engine's own types. The sectors buy a completion list 6.6 times shorter and about ten times faster.

### Decided in the build

- **The brown sector is a tenth member**, against the nine the bean listed: with the coordinator's cuts and no brown, `yellow` held 6,657 names and `neutral` 7,677, both over 6,000; a colour with a hue cannot be called neutral, so the fix is a sector, and `brown` is the natural one. With it every sector is under 5,000. `brown` is also a colour word. The counts above are the generator's own.
- **The data is generated and committed** (`src/<sector>.ts`, 1.5 MB) even though `color-name-list` is a dependency: the key unions are types and cannot be computed at build time, and the docs playground runs the plugin's sources in a browser (no fs). The list itself is not vendored; `bun run generate` reads the dependency, and the package's test fails when the committed files differ from a fresh run.
- **`nearest()` is a subpath**, not an export of the root: a root export would put the 865 kB data chunk in the client bundle of any module that imported the package. `vp pack` emits it as its own entry (`dist/nearest.mjs`).

### Left

- The grammar route for the names (`args: "<name>"`), not built (see above).
- Per-source licences of the list and a search for slurs (`so8y`, `smjd`).
- The user's trusted publisher on npmjs.com for the new name, then the first publish by hand.
- The declarations a build emits hold the key unions (548 kB), not the record of every name to its hex (2.2 MB): the generator writes `export type Red = "..." | "..."` rather than `keyof typeof red`.
