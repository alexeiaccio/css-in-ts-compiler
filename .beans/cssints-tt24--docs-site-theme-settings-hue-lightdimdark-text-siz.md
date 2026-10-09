---
# cssints-tt24
title: 'Docs site: theme settings (hue, light/dim/dark, text size and density, font and radii)'
status: completed
type: feature
priority: normal
created_at: 2026-10-09T12:50:59Z
updated_at: 2026-10-09T13:14:18Z
---

Asked by the user (2026-10-09). A settings panel on cssints.accio.blue like apps/sky's /settings, built on cssints tokens and themes, persisted in localStorage, applied before first paint.
- [x] Accent hue slider: the accent palette as derived tokens (color-mix/relative colour from a hue token, as sky does), check.contrast over the hue range (sky's contrast.mjs pattern), the derived-token runtime for old targets.
- [x] Modes: system, light, dim, dark (dim new).
- [x] Text size (e.g. 3 steps) and density (compact/normal/comfortable) through tokens (font.scale, space scale), not per-component code.
- [x] Font family (system sans, serif, and one via @cssints/fonts if it fits) and radius scale (sharp/normal/round) as tokens.
- [x] A panel reachable from the header (popover or /settings page; say which), keyboard accessible; prerendered pages stay correct (settings applied before paint by an inline script, as the mode toggle does).
- [x] Tests: build check (themes in the sheet, contrast passes), Chrome check (each setting changes computed styles, persists across reload, no console error).

## Decisions

- **Popover, not a /settings page.** A reader changes text size, density or hue to see the page they are reading; a page of its own hides it. A popover is also no route: nothing to prerender, no entry in the page list or the search. It is the native Popover API (`popover` and `popovertarget`, no script for open, close or focus): the browser closes it on Escape or a click outside and returns the focus to the button, and the panel follows the button in the document, so Tab goes into it.
- **The panel is `SettingsPanel.tsx`, the store `settings.ts`.** Each setting is one `localStorage` key (`cssints-docs.settings`, JSON), parsed field by field (an invalid field takes its default), written onto `<html>` by `apply()`, and read by an inline copy in index.html before the first paint. `test/settings.mjs` runs the inline script against `apply()` on 44 stored values.
- **Mapping to tokens.** hue: `--hue-accent` on `<html>`, read by `hue.accent`, from which accent, accentSoft, accentStrong, link and (relative colour) onAccent are derived. Mode: classes `light`, `dark`, `dim` (dim is `dark dim`, so what follows `.dark` follows it; the `.dim` theme, after `.dark`, lifts the neutrals); system is no class. Text size, density, corners: `data-text`, `data-density`, `data-radius` on `<html>`, a theme per value that is not normal setting `scale.font` (0.875, 1.125), `scale.space` (0.75, 1.25) or `scale.radius` (0, 2); `fontSize`, `space` and `radius` are `calc(Npx * {scale.x})` derived tokens. Font: `data-font`, three global rules.
- **Derived-token runtime.** Nothing to do: the browserslist is the last two Chrome, Firefox and Safari versions, which parse every derived value, so the engine ships no `cssints/derived` and no `@supports` copies (the sheet holds the live `var()` values). A lower target would get both from the engine, as in apps/sky; not tested here (sky's old-browser.mjs needs Chromium 109).
- **@cssints/fonts left out.** It adds a dependency and a build-time font download for a setting whose point is the choice of kind (sans, serif, mono); the three stacks are system fonts.

## Engine gaps

- **No `fontFamily` token type** (API.md "Tokens": `fontFamily` is an error, and so is `string`). The font setting is therefore three `global()` rules on `[data-font]`, not a theme of a token. Repro: `createTokens({ font: { body: { $type: "fontFamily", $value: ["Georgia", "serif"] } } })` is a build error. Workaround: `global('[data-font="serif"] body', fontFamily(serif))`.
- **A `calc()` that needs the header height cannot take the token** (`maxHeight("calc(100dvh - var(--layout-header-height))")` warns "pass the token itself"); the panel hard-codes 72px.

## Summary of Changes

- A display settings popover in the header of apps/docs (`SettingsPanel.tsx`, button with `popovertarget`): accent hue (0 to 359), colour mode (system, light, dim, dark), text size, density, font and corners, with a reset. Persisted as one JSON key; applied before the first paint by an inline script in index.html on every prerendered document.
- Tokens: `hue.accent` and a `scale` group (`font`, `space`, `radius`) in tokens.json; accent, accentSoft, accentStrong, link and onAccent are derived from the hue (oklch and a relative colour), fontSize, space and radius are `calc()` over the scales. Themes in theme.ts: `.dim` (after `.dark`) and one `[data-text|density|radius]` theme per non-normal value. `modes.ts` holds the mode values as plain data for the contrast test.
- Contrast: `check.contrast` at the default hue in theme.ts; `test/contrast.mjs` reads the six accent pairs over all 360 hues in light, dim and dark with the engine's maths (worst case: accent on bgSubtle in light 3.47 at hue 189, floor 3; onAccent on accent in light 4.58 at hue 107, floor 4.5; links 5.47 and up, floor 4.5); `test/browser.mjs` repeats it in Chrome every 10 degrees from rendered pixels.
- Tests: `test/settings.mjs` (the store and the inline script agree on 44 inputs), `test/build.mjs` (the themes, scales and font rules in the sheet, the script before the module in every document), `test/browser.mjs` (keyboard open, Tab into the panel, Escape and focus return, each setting changes a computed style, kept across a reload, reset, the built prerendered page with the app's script blocked).
- Commits: 84ed58b, 34bc6a6 and the follow-up that renames the panel and adds the bean.
- Not done: a font through @cssints/fonts (a dependency and a download for no gain over system stacks); the old `cssints-docs.mode` key is not migrated (a stored light or dark choice resets to system once).
- A file `Settings.tsx` beside `settings.ts` made the type-aware lint treat it as outside the project (96 errors); renamed to `SettingsPanel.tsx`.
