# @cssints/color-names

The [Color Name List](https://github.com/meodai/color-names) ([names.color.pizza](https://names.color.pizza/), a colour at
`/color/<name>/`) for
[cssints](../../README.md): a colour name as a hex colour, as members of `cssints/plugin` `scope()`. 31,939 names, no
runtime. `named(name)` takes any name; `colorNames.<sector>(name)` is the same name in one hue sector, so an editor's
completion is a few thousand names and not 31,939. Build time only: the sheet holds the hex, and the data never reaches
the client.

```ts
import { bg, color, cn } from "cssints" with { type: "cssints" };
import { colorNames, named } from "@cssints/color-names" with { type: "cssints" };

export const tag = cn(color(named("tangerine")), bg(named("midnight-blue")));
export const flag = color(colorNames.red("ferrari-red"));
export const both = color(colorNames.orange("orange-red"));
export const grey = color(colorNames.neutral("abalone"));
export const brown = color(colorNames.brown("chocolate"));
export const css = color("lime"); // the CSS keyword, not the list's Lime
export const bad = color(named("tangerin")); // error: did you mean tangerine?
export const wrong = color(colorNames.red("abalone")); // error: "abalone" is in neutral
```

```css
@layer _.a {
  ._h4vhuh {
    color: #ff9300;
  }
  ._19lu36g {
    background-color: #020035;
  }
  ._h4q7xz {
    color: #ff2800;
  }
  ._h428z9 {
    color: #fe4401;
  }
  ._g9cy5w {
    color: #f8f3f6;
  }
  ._ethye4 {
    color: #d2691e;
  }
  ._1b7kjqn {
    color: lime;
  }
}
```

## Names

A name is a key of the list: NFC, lowercase, `&` to `and`, apostrophes removed, every run of characters that is not a
letter or a digit to `-`, trimmed. So a key is letters (accents kept), digits and hyphens: `tangerine`, `100-mph`,
`rosé`, `pi²`, `pepper-and-spice`. `Name` is the union of all 31,939 keys, behind one alias so an error message says
`Name` and not the union. The list's one key collision (`World’s Away` and `Worlds Away` both give `worlds-away`) keeps
a hyphen for the apostrophe: `world-s-away`.

An unknown name is an error in the types, and a build error that names the nearest key within three edits
(`colornames: no colour name "tangerin", did you mean tangerine?`).

## Sectors

One member per sector: `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`, `brown`, `neutral`.

**The rule.** A colour word in the name decides the sector, whatever the hue of its colour says: `ferrari-red` is in
`red` though its oklch hue is orange. Words are whole words, split on anything that is not a letter: `redwood` and
`bored` are not `red`. The words are red, orange, yellow, green, cyan, blue, purple, pink and brown; gray, grey, white
and black are `neutral`. A name with several colour words is in **each** of its sectors (154 names): `orange-red` is in
`orange` and in `red`.

A name with no colour word is placed by the hue of its colour in oklch: below 0.02 chroma it is `neutral`, and a hue in
the orange-yellow band below 0.7 lightness is `brown` (brown is a dark orange or yellow). The hue cuts, tuned on
version 14.61.0:

| Sector    | Hue (oklch)                      | Names |
| --------- | -------------------------------- | ----- |
| `red`     | below 30°                        | 3,070 |
| `orange`  | 30° to 70°                       | 2,835 |
| `yellow`  | 70° to 105°                      | 4,179 |
| `green`   | 105° to 165°                     | 4,607 |
| `cyan`    | 165° to 215°                     | 1,805 |
| `blue`    | 215° to 265°                     | 3,570 |
| `purple`  | 265° to 330°                     | 2,269 |
| `pink`    | 330° to 360°                     | 1,736 |
| `brown`   | 40° to 105°, lightness below 0.7 | 3,194 |
| `neutral` | chroma below 0.02                | 4,828 |

The 31,939 names give 32,093 sector places: 7,703 names have a colour word (154 of them several), 24,236 are placed by
hue, and the word and the hue disagree for 2,850. A name of another sector is an error in the types, and a build error
that names the sectors it is in (`colornames: "abalone" is in neutral`).

The cuts are not the first ones: with the list's own rough cuts (`red` below 20°, `orange` to 55°, `yellow` to 110°,
chroma below 0.03, no `brown`) `yellow` held 6,657 names and `neutral` 7,677, both too big to scan in an editor. `brown`
is the sector that fixes `yellow` (the browns were most of it); without it the biggest sector stays above 6,000 names,
and a colour with a hue cannot be called neutral. `neutral` stays the biggest member by its chroma cut alone, which is
where the near-grays of the list are.

## CSS keywords

Of the 148 CSS named colours, 63 have a list name whose spelling matches, ignoring case and punctuation, with the same
hex (`red` #ff0000, `orange` #ffa500); 63 have such a list name with a **different** hex; and 22 have none (`gray`,
`slategray`, `deeppink`, `dimgray`, `lightgray`, `slateblue`, ...). `named()` resolves list names, so `named("green")`
is the list's Green #00ff00, not CSS `#008000`, and `named("lime")` is #aaff32, not `#00ff00`. A CSS keyword stays
reachable as a string: `color("green")` prints `color: green`.

## `nearest()`

`@cssints/color-names/nearest` is the reverse lookup: the name nearest to a colour, by CIEDE2000 on Lab, as the list's
own API (api.color.pizza/v1) matches. **Build time only**: it imports the whole list and culori's colour maths, so a
module that reaches the browser must not import it (a plain export from the package root would put the data in the
bundle). The engine has no marker for such a module; the subpath and the README line are the marker, as for
`@cssints/tokens`' sets and the `lacking`/`inGroup` helpers of `cssints/plugin`.

```ts
import { nearest } from "@cssints/color-names/nearest";

nearest("#3b82f6"); // { name: "dodger-blue", hex: "#3e82fc", distance: 0.93 }
nearest("not a colour"); // undefined
```

## Types

Measured on 2026-10-17 (tsc 5.9.3 and tsgo 7.0.0-dev, one file per row; the union behind the `Name` alias, and the
member through `cssints/plugin`):

| Case                                 | Keys   | Types  | Instantiations | Check (tsc) | Completion (warm) |
| ------------------------------------ | ------ | ------ | -------------- | ----------- | ----------------- |
| plain union, `named(name: Name)`     | 31,939 | 63,971 | 0              | 0.10 s      | —                 |
| plain union, the biggest sector      | 4,828  | 9,749  | 0              | 0.05 s      | —                 |
| `scope()` member, `arg<Name>()`      | 31,939 | 90,759 | 37,214         | 0.65 s      | 31,939 in 10 ms   |
| `scope()` member, the biggest sector | 4,828  | 36,572 | 37,214         | 0.59 s      | 4,828 in 1 ms     |

The union costs types, not instantiations: the two scope rows share 37,214 instantiations (the engine's own types), and
their check time is the same within noise. What the sectors buy is the completion list, which is 6.6 times shorter and
about ten times faster. A whole token set of these names was not taken: 31,935 DTCG leaves cost 15 to 26 s to check.

## The data

`src/<sector>.ts` is generated by `scripts/generate.ts` from the [color-name-list](https://github.com/meodai/color-names)
package **14.61.0** (a dependency; the list itself is not copied into the repository, the projection is). Each file is one
`as const` record of key to hex plus the key union written out, so the declarations a build emits hold the union (548 kB)
and not the record (2.2 MB). The committed data is 1.5 MB; the built data chunk is 865 kB. Run `bun run generate` after a
bump; the package's test fails when the committed files differ from a fresh run.

The list is MIT, copyright David Aerne (2017), and its README asks for simple attribution. The list mixes sources
(Wikipedia, paint makers, fiction) and carries brand-like names (Tiffany Blue, Ferrari Red); it says it removes
offensive and protected names and that some may remain.

## Browsers

A hex colour needs nothing: no runtime, no `@supports`, no support warning. The package's output is one declaration per
call.

```bash
cd packages/color-names && bun run test        # the generated data, the engine (hex, errors), nearest()
cd packages/color-names && bun run typecheck   # and the type test, test/types/color-names.ts
cd packages/color-names && bun run generate    # src/<sector>.ts from the dependency
```
