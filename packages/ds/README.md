# @cssints/ds

A design system on `cssints`: four components on `@cssints/headless`, one theme with its contrast checks, and the CSF 3
stories that belong to each component, loaded by `@cssints/stories` so an app draws a storybook without a Storybook.

```tsx
import { Button, Field, Switch, Tabs } from "@cssints/ds";
import { stories, storyOfId } from "@cssints/ds/stories";

<Button tone="accent">Save</Button>;
```

## The components

| Component | Primitive      | What the skin adds                                                                                                                |
| --------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `Button`  | `createButton` | `tone` (`neutral`, `accent`, `quiet`), `size` (`sm`, `md`); pressed and disabled states read off `aria-pressed` / `aria-disabled` |
| `Field`   | `createField`  | the label, control, hint and error as one field; ids, `aria-describedby` and `aria-invalid` are the primitive's                   |
| `Switch`  | `createSwitch` | a track and a thumb; the thumb reads `aria-checked` off the track, so the two never disagree                                      |
| `Tabs`    | `createTabs`   | the tablist, the tabs and the panels; the selected tab is `aria-selected="true"`                                                  |

Every state a component draws is the widget's own attribute, never a second copy of it: a pressed button is styled by
`aria-pressed="true"`, not by a class the component would have to keep in step. Nothing here re-implements a key, a focus
rule or a live region; those are `@cssints/headless`, and its own suite is the oracle.

## The theme

`src/tokens.ts` is the data (semantic colours, spacing, radii, type scale) and `src/theme.ts` compiles it with
`cssints`: `createTokens`, the dark mode as `prefers-color-scheme`, and `check.contrast` on the pairs a reader meets on
every page — 7:1 for body text, 4.5:1 for the rest, 3:1 for the focus ring. A palette edit that breaks one fails the build.

## The stories

`src/*.stories.tsx` are CSF 3 modules — the format Storybook reads — so the same files move into a real Storybook
unchanged. `src/stories.ts` lists them and calls `@cssints/stories`' `entries()`, which builds the ids Storybook builds
(`button--accent`), the meta's args under the story's, and the view that draws it. The chrome is the app's: a rail, a
canvas and a controls panel read `Entry[]` and nothing else.

The modules are listed rather than globbed: this file is a package entry, resolved by Vite, Node and a TypeScript
consumer alike, and `import.meta.glob` belongs to an app.

## Source-first on purpose

This package has no `dist`. A component package needs Solid's compiler (JSX and its reactive transform), which the
packages' `vp pack` pipeline does not run; a Vite app compiles this package like its own source, which is what the
`development` export condition is for everywhere else in this repo. When the pack pipeline learns Solid, the `exports` map
grows a `types`/`default` pair and the package joins the release.
