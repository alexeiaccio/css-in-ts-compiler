# Mu design: tokens, layout, hue, licence (cssints-uifu)

Sources, read 2026-10-02: eurosky-social-app branch `eurosky/fork` (commit 50afd92, "Mu"), `@bsky.app/alf` 0.1.15 (the
npm package Mu builds on, MIT), Witchsky (tangled.org/jollywhoppers.com/witchsky.app, commit 56f3de5). Paths are relative to
each repo. The tokens are in `apps/sky/src/tokens.json`.

## Where Mu's tokens come from

Mu changes colour only. `src/config/brand-theme.ts:1-10` says it: every ALF atom (spacing, radius, type scale, button
shape) stays on `@bsky.app/alf`, and only the palette and the gradients are replaced. Two upstream files redirect into it:
`src/alf/themes.ts:5-24` and `src/alf/tokens.ts:3-92`.

| What                                                                                                                                                                                                                  | File and lines                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Spacing `2 4 8 12 16 20 24 28 32 40`                                                                                                                                                                                  | `@bsky.app/alf` `src/tokens.ts:3-14`                   |
| Font size `9.4 11.3 13.1 15 16.9 18.8 20.6 24.3 30 37.5` px                                                                                                                                                           | `src/tokens.ts:16-27`                                  |
| Line height `1.15 1.3 1.5`, tracking `0`, weights `400 500 600 700`                                                                                                                                                   | `src/tokens.ts:29-33, 1, 45-50`                        |
| Radius `2 4 8 12 16 20 999`                                                                                                                                                                                           | `src/tokens.ts:35-43`                                  |
| Base palette (Bluesky blue, replaced by Mu)                                                                                                                                                                           | `src/palette.ts:76-140` (default), `142-206` (subdued) |
| Dark and dim are the light ramp read backwards (`contrast_0` takes `contrast_1000`, `primary_25` takes `primary_975`, `_500` stays)                                                                                   | `src/palette.ts:208-274`                               |
| Theme atoms: `text` = `contrast_1000`, `bg` = `contrast_0`, border low/medium/high = `contrast_100/200/300`, `text_link` = `primary_500` (light) or `primary_600` (dark), shadows `rgba(black, 0.1)` (light) or `0.4` | `src/themes.ts:114-230`                                |
| light = palette, dark = invert(palette), dim = invert(subdued palette)                                                                                                                                                | `src/themes.ts:243-263`                                |
| Mu neutral ramp (`#FFFFFF`, `#F7F7F2`, `#EDEBE5` ... `#212121`, `#141414`, `#000000`)                                                                                                                                 | `src/config/brand.json:8-24`                           |
| Mu dim overrides (`contrast_900..1000` = `#242424 #1F1F1F #1C1C1C #1A1A1A`): dim is soft black, not black                                                                                                             | `brand.json:25-30`, `brand-theme.ts:96-104`            |
| Accent families `pink` (default), `blue`, `orange`, `green`, `purple`, each a 13-step `primary_` ramp with `_500` as the link and button colour                                                                       | `brand.json:31-108`, `brand-theme.ts:106-115`          |
| Runtime accent picker: `buildThemes(accent)`                                                                                                                                                                          | `src/alf/themes.ts:32-44`, `brand-theme.ts:134-143`    |
| Gradients (avatar fallbacks), all in one brand family                                                                                                                                                                 | `brand-theme.ts:156-216`                               |
| Minimum input font size 16 (mobile browsers zoom below it)                                                                                                                                                            | `src/alf/tokens.ts:8-11`                               |
| Positive and negative ramps are Bluesky's: `positive_500 #09B35E`, `negative_500 #E91646`                                                                                                                             | `@bsky.app/alf` `src/palette.ts:113-139`               |

Mu pink in OKLCH (culori): `primary_500 #DB4AA6` is L 0.637, C 0.203, h 345.4. The ramp keeps h between 331 and 346 and
moves L from 0.965 (`_25`) to 0.300 (`_975`). Mu's neutrals have C of 0.008 or less (h about 90), so they are grey.

Partner build: `brands/oso/` (README, `brand.override.json`, a League Spartan variable font, a mark) swaps the accent
family and the font for one partner. It is web-only and says it needs approval before a public launch.

## Layout (web)

Breakpoints, `src/alf/breakpoints.ts:9-11` (min-width): `gtPhone` 500, `gtMobile` 800, `gtTablet` 1300. Shell, `:34-36`:
right rail from 1100, left nav minimal up to 1300, "centre column offset" between 1100 and 1300.

| Width        | Layout                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| below 800    | One full-width column. Bottom bar when signed in (`createNativeStackNavigatorWithAuth.tsx:122, 189`). No left nav, no right rail. |
| 800 to 1099  | Centre column 600 px, centred. Left nav minimal (80 px, icons only). No right rail.                                               |
| 1100 to 1299 | Same, and the column and header shift by `-105` px so the rail fits. Right rail 250 px.                                           |
| 1300 and up  | Left nav 240 px, column 600 px, right rail 300 px.                                                                                |

- Column: `CENTER_COLUMN_WIDTH = 600`, `CENTER_COLUMN_OFFSET = -105`, header slot 33, header-button alignment 3
  (`src/components/Layout/const.ts:11-26`). `Center` is `max-width: 600` from `gtMobile` (`Layout/index.tsx:139-215`). The
  borders are a fixed element 602 px wide (`:199`).
- Left nav: `LEFT_NAV_STANDARD_WIDTH 240`, `LEFT_NAV_MINIMAL_WIDTH 80`, item `48`, icon `28`
  (`src/view/shell/desktop/LeftNav.tsx:96-101`). It is `position: fixed; left: 50%` and moved by `-(600/2)` then `-100%`, so
  its right edge touches the column (`:645-659`).
- Right rail: `position: fixed; left: 50%`, moved by `+300`, width 300 (250 when offset) plus the left gutter
  (`src/view/shell/desktop/RightNav.tsx:41, 98-110`). Hidden on messages screens.
- Header: sticky, `min-height 52` on web (48 native), 1 px bottom border `border_contrast_low`, `max-width 600` from `gtMobile`
  (`Layout/Header/index.tsx:67-71`).
- Gutters (`src/alf/util/useGutters.ts:6-28`): compact 8 then 12 from 800, base 16 then 20, wide 20 then 28.
- Feed avatar 42 px (`src/view/com/posts/PostFeedItem.tsx:397`). Borders are 1 px.
- A scrollbar offset (`Layout/const.ts:1-4`) keeps the column centred when a scrollbar shows.

`tokens.json` has these as `layout.*`, `gutter.*`, `breakpoint.*`. A custom property cannot be used inside `@media`, so the
breakpoints are data; write `css.media("(width >= 800px)")`. The gutters change at 800 through a theme under that media
condition (see below).

## Fonts and their licence

- UI: Inter, the variable file `InterVariable.woff2` (and the italic file), `font-weight: 300 1000`, `font-display: swap`
  (`web/index.html:58-72`). The stack is `InterVariable, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"` (`src/alf/fonts.ts:8, 93-105`). `font-variant` adds
  `no-contextual` and `unicode`; `font-synthesis-weight: none`.
- Code: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", "Roboto Mono", monospace`
  (`fonts.ts:17-21`).
- Font scale setting: x0.9375, x1, x1.0625 (`fonts.ts:23-34`). `font.scale` in `tokens.json` does this.
- Licence: SIL Open Font License 1.1, Copyright (c) 2016 The Inter Project Authors. No Reserved Font Name. We may copy,
  embed and redistribute it. The OFL text and the copyright line must travel with the files (`assets/fonts/inter/OFL.txt`,
  `ASSETS.md` section 6, `NOTICE.md`). The npm package `@fontsource-variable/inter` carries the same licence.
- League Spartan is the Oso partner font. Do not use it. Its own README asks for approval before a public launch.
- Font families are not tokens: `@property` has no font-family syntax, so `createTokens` rejects `fontFamily`. Set
  `font-family` with a plain value.
- Icons: Mu's UI icons are generated from Phosphor (MIT, `NOTICE.md`). `@iconify-json/ph` is the same set under the same
  licence.

## What ASSETS.md and NOTICE.md forbid

The MIT licence covers source code only (`ASSETS.md` intro). A file that `ASSETS.md` lists is not covered. Numbers and colours
in `brand.json`, `brand-theme.ts` and `@bsky.app/alf` are code, so the token values are fine to use. Do not reuse:

1. Bluesky marks: name as identity, butterfly, logotypes, app icons, Newskie, verification and starter-pack glyphs (section 3).
   We may say "a client for Bluesky" or "an atproto client".
2. Commissioned Bluesky artwork, the landing illustrations (section 1). The Central icon system by Iconists (section 2).
3. Community and contest artwork (section 4).
4. Third-party marks: Apple and Android logos, and Leaflet, Offprint, pckt, Standard.site and Germ logos (section 5).
5. `assets/images/`: treat all of it as unlicensed (section 7). `assets/pets/`: paid ToffeeCraft art, no transfer (section 8).
6. Mu's own name, logo, app icons, favicons, splash and social cards (section 9): "replace them with their own branding".
   The pink accent is Mu's brand colour. It sits in MIT code, but `apps/sky` should not ship as Mu, so give it another
   name and treat 345 as a default that the hue slider moves.
7. Not in ASSETS.md: the algorithm-feed avatar SVG in `UserAvatar.tsx:123, 143` is Font Awesome Pro (commercial licence).
   Do not copy it.

May keep, with the notice: Inter (OFL), Phosphor (MIT), country-flag-icons (MIT), Material Icons (Apache 2.0, only as a
build artefact of Expo).

## Witchsky: hue, schemes, square options, hidden metrics

**Hue.** `src/alf/index.tsx:111-119` `changeHue(color, shift)`: convert to OKLCH with chroma-js, `h' = (h + shift + 360) % 360`,
keep L and C, write back as hex. `shiftPalette` (`:121-139`) applies it to every key of a palette except `positive_*`,
`negative_*`, `like`, `pink` and `yellow`, so the neutrals (`contrast_*`) turn too. `hueShifter` (`:141-182`) does it for
the light, dark and dim palettes and builds the three themes again. `useScheme` (`:184-257`) picks the colour scheme, then
applies `hueShifter(scheme, hue)`. The slider is an integer from -180 to 180 (`src/screens/Theme.tsx:318-319`), stored as
`hue` (`src/state/persisted/schema.ts:146`, default 0 at `:422`). Themes that come as ATProto records do the same on named
roles `canvas surface surfaceRaised text textMuted border accent accentSoft onAccent` and leave `positive`, `warning`,
`critical` and `favorite` alone (`src/features/themes/hue.ts:6-35`). The Material You accent slider is separate: 0 to 360,
turned into a full-saturation hex (`AppearanceSettings/shared.tsx:201-257`) that seeds a Material 3 palette.

**Colour schemes.** `colorScheme` is one of `witchsky bluesky blacksky deer zeppelin kitty reddwarf catppuccin evergarden
"cyan base" material3` (`schema.ts:133-145`). Each is a Palette and a subdued Palette in `src/alf/themes.ts` (witchsky
`:101-232`, its primary ramp is `hsl(5, ...)`). The default scheme is the warm palette `#FEFBFB` ... `#150B08`.

**Square options.** There is no setting called "square-ish". There are two: `enableSquareAvatars` and `enableSquareButtons`
(`schema.ts:315-316`, both true by default at `:513-514`; labels "Enable square avatars", "Enable square buttons" in
`screens/Settings/AppearanceSettings.tsx:317-325`).

| Option                                                                          | On                                                                           | Off                     |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------- |
| Avatars (user avatars; feed, list and labeler avatars are square in Mu already) | `size > 32 ? 8 : 3` px (`UserAvatar.tsx:70-72`, `AvatarBubbles.tsx:199-204`) | `size / 2`, a circle    |
| Buttons, default shape and `round` shape                                        | `rounded_sm` = 8 px (`components/Button.tsx:527-545, 613`)                   | `rounded_full` = 999 px |
| Stacked button                                                                  | 4 px (`Button.tsx:1034`)                                                     | 20 px                   |
| Dialog cards                                                                    | 18 px (`screens/Login/components/HostingProviderDialog.tsx:153`)             | 36 px                   |
| Chips, tabs, badges, search input, hover-card buttons (125 files read the flag) | `rounded_sm`                                                                 | `rounded_full`          |

The `rectangular` button shape stays at 10 px. In `tokens.json` the flag is three tokens, `radius.button`, `radius.avatar`
and `radius.avatarSmall` (999 px by default), and a `.square` theme sets them to 8, 8 and 3.

**Hidden metrics.** Nine counters, each with its own setting: `likes reposts quotes saves reply followers following followedBy
posts` (`schema.ts:288-296`, default `visible` at `:490-498`). A value is `hidden`, `lite`, `visible` or `exact`
(`src/lib/metrics-display.ts:6-17`). `hidden`: the control or row is not drawn. `lite`: no number, a label only when the
count is above 0. `visible`: compact number (1.2K). `exact`: the full number (`:77-130`). This is app state, not tokens.

## Deriving the palette from one hue

Rule: `oklch(L C {hue.accent})`, with L and C copied from Mu's pink step. `hue.accent` is a number token (default 345.4,
rounded to 345). A Witchsky shift of `s` degrees is `hue.accent = 345 + s`. The three differences from Witchsky:

- Witchsky bakes hex and rebuilds the themes in JS. Here `--hue-accent` is one custom property. Set it on `<html>`
  (`style={{ "--hue-accent": 12 }}`). Derived tokens are declared on `:root` and a theme class on `<html>`, and `var()` is
  replaced where it is declared, so setting the hue on a child element will not reach them.
- Neutrals do not follow the hue. Mu's ramp has C of 0.008 or less, so a rotation is invisible, and literal colours keep
  `check.contrast` exact. The accent colours are derived, so `check.contrast` can only warn for them.
- `positive`, `negative` and `like` are fixed, as in Witchsky.

Dark and dim read the ramp backwards, so the accent steps that change between themes (`hover`, `strong`, `soft`, `link`)
differ there. Found while validating: **a theme override took plain values, not `{path}` references**, so the tokens took L
and C from number tokens (`accentTone.*`) and the themes set those numbers. Since cssints-q6l0 an override takes references:
a theme writes the colour itself (`accentHover: "oklch(0.697 0.177 {hue.accent})"`, see "Themes"), and the `accentTone` group
of `apps/sky/src/tokens.json` is gone. `accent` itself (`primary_500`) is the same in every theme. Building the app showed
that a token only referred to (`hue.accent`, which no class reads) got no `@property` rule, so every derived colour stayed at
its initial value in every theme and the hue slider did nothing; the engine now adds the tokens a used token is made of.

Mu's other accents as hue only: blue is h 231, orange 38, green 154, purple 306. Their L and C differ from pink (blue is
L 0.605, C 0.115), so a hue move on the pink ramp is not the same as Mu's blue family.

## Themes (validated)

Light is `tokens.json`. Dim and dark are not separate files: `apps/sky/src/theme.ts` holds them as `createGlobalTheme`
overrides, and only the neutrals and four accent colours (written with `{hue.accent}`) change:

```ts
import * as css from "cssints" with { type: "cssints" };
import tokens from "./tokens.json" with { type: "json" };

export const t = css.createTokens(tokens);

css.createGlobalTheme(t, css.media("(width >= 800px)"), {
  gutter: { compact: "12px", base: "20px", wide: "28px" },
});

const dim = { color: { bg: "#1a1a1a", /* neutrals ... */ accentHover: "oklch(0.697 0.177 {hue.accent})", link: "oklch(0.697 0.177 {hue.accent})" } };
const dark = { color: { ...dim.color, bg: "#000000", bgSubtle: "#141414", bgMuted: "#212121", border: "#2a2a2a" } };
const light = { color: /* the values of tokens.json for the keys of dim.color */ };

css.createGlobalTheme(t, css.media("(prefers-color-scheme: dark)"), dark); // system
css.createGlobalTheme(t, ".light", light); // light on a dark system
css.createGlobalTheme(t, ".dim", dim);
css.createGlobalTheme(t, ".dark", dark);

css.check.contrast(t.color.text, t.color.bg, { min: 7 });
css.check.contrast(t.color.accentStrong, t.color.accentSoft, { min: 4.5 });
```

The mode is a class on `<html>`: `light`, `dim`, `dark`, or none for the system, which is dark under
`prefers-color-scheme: dark`. A selector theme beats a condition theme on the same element, so a class always wins (checked
in Chrome: `.light` under a dark system is white, no class is black, `.dim` is `#1a1a1a`). The system's dark is Mu's dark, not
dim. Dim differs from dark only in the four neutral backgrounds. `--hue-accent` set on `<html>` moves the accent in every
mode (`style.setProperty("--hue-accent", "230")` turned the whole palette blue in Chrome). Mu's subdued positive and
negative ramps differ a little from the default ones; the tokens ignore that.

Contrast, from `check.contrast` (the derived colours are computed per theme): `text` on `bg` is 21 (light) and `textMedium`
on `bg` is 8.84 (light), 7.48 (dim), 9.03 (dark). `textLow` (`contrast_400`, `#92918E`) on white is 3.15, so Mu's own low text
is below AA: do not check it at 4.5. Mu's pink `accent` on white, and white on `accent`, is 3.79 (culori): fine for large text, icons and bold labels, not for
body text, so the app checks those pairs at 3 and sets body text in `text`. `accentStrong` on `accentSoft` is 4.60 in light and
4.95 in dim (checked at 4.5, so a hue that breaks it is a build error).

The sheet of the shell has 62 `@property` rules (the tokens its classes use and what those are made of; the screens that come
later use more). `--color-accent-hover` is `oklch(0.58 0.182 var(--hue-accent))`
on `:root` and `oklch(0.697 0.177 var(--hue-accent))` in `.dim`, `.dark` and the dark media query.

## Not covered

- Gradients, shadows (a `boxShadow` composite is not a token type; `color.shadow` holds the colour), the 13-step ramps as
  separate tokens (only the steps that Mu's atoms use are tokens), native values, Witchsky's other schemes.
- Witchsky's scheme list as palettes. Each is hex in `themes.ts`; add one by a theme override of the neutrals if wanted.
