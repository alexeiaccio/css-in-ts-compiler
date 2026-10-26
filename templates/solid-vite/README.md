# cssints starter — Solid 2 + Vite

**Solid 2 (`2.0.0-rc.13`) is required.** `@cssints/headless` is built on Solid 2's reactivity, so
the plugin is `@solidjs/vite-plugin` 3.x; `vite-plugin-solid` 2.x will not run this template.

## Get it

Copy this directory out of the repository (it is private for now, so there is no `npm create` package yet):

```sh
git clone --depth=1 --branch ui/theme https://github.com/alexeiaccio/css-in-ts-compiler /tmp/cssints
cp -R /tmp/cssints/templates/solid-vite my-app
cd my-app
```

## Two commands

```sh
npx shadcn@latest add @cssints/switch   # the skin: component, CSS, theme, conformance test
npm test                                # runs the copy's own conformance in Chromium
```

`npm run dev` after the first `add`; `src/app.tsx` already renders the switch.

## What a copy is

The component, its stylesheet, its fixture, the walk driver, its browser test and `theme.css`.
Behaviour is not copied: the component imports `@cssints/headless` from npm, so `npm update`
carries the fixes. What you edit is markup and style.

`components.json` points the registry at `https://packages.cssints.dev/r/{name}.json`, so
`add @cssints/<name>` works for every item in `registry.json`.

## Why the test ships with the copy

Each starter carries the scenarios its primitive is checked against, driven through your styled
markup rather than the bare controller. It is the same check the release passed before it was
published; if an edit changes what the pattern does, it fails.

## The theme

`src/components/ui/theme.css` is plain custom properties derived from React Aria's starter theme
(Apache-2.0). It ships prebuilt because a component that reads a token nobody emitted renders
nothing: sections you never use still have their values. Retheme by setting two numbers —
`--hue-tint` and `--chroma-tint` — or take one of the bundled presets (`data-tint="indigo"`).
