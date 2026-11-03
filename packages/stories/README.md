# @cssints/stories

The CSF 3 loader of a cssints storybook: the modules an app globs in, the entries with the ids Storybook builds out, and
the controls a story declares.

```ts
// src/registry/button/button.stories.tsx — a Storybook CSF 3 file, unchanged
import type { Meta, Story } from "@cssints/stories";
import { Button, type ButtonProps } from "./button.tsx";

const meta = {
  title: "Button",
  component: Button,
  args: { children: "Save", tone: "neutral" },
  argTypes: {
    tone: { type: "select", options: ["neutral", "accent", "quiet"] },
    disabled: { type: "boolean" },
  },
} satisfies Meta<ButtonProps>;
export default meta;

export const Default: Story<ButtonProps> = {};
export const Publish: Story<ButtonProps> = { args: { tone: "accent", children: "Publish" } };
```

```ts
// the app
import { entries, parseHash, storyOfId, type Module } from "@cssints/stories";

const modules = import.meta.glob<Module>("../registry/*/*.stories.tsx", { eager: true });
export const stories = entries(modules); // [{ id: "button--default", item: "button", view, args, argTypes, … }]

parseHash("#button--publish"); // { name: "button", story: "button--publish" }
```

## What it decides, and what it leaves to the app

- **The id.** `button--publish`, the item's name and the story's, kebab-cased — what Storybook builds, so a story file
  moves either way. Within a file the order is the module namespace's, alphabetical, which is Storybook's default.
- **The args.** The meta's, the story's over them. A control in the host writes an arg and re-renders the view; the loader
  does not care how.
- **The controls.** `argTypes` is the model (`boolean`, `select` with `options`, `text`, `number`, `range` with
  `min`/`max`/`step`). Storybook infers a control from a component's props; a Solid component carries none at run time, so
  a story declares what it wants by hand. The meta's controls are the file's, and a story's own `argTypes` are merged over
  them per arg (CSF 3's story-level `argTypes`), so a file whose stories have different args gives each its own. The panel
  is the app's: a row per declared arg.
- **Nothing else.** No DOM, no styles, no routing: the chrome (a rail, a tablist, a native window) is the app's, and so is
  the renderer — `entries<Node>()` returns views of whatever the app renders, so the same loader serves the web site, the
  lab and cssints-native.

## Tests

`bun run test` — `test/stories.mjs` on the loader alone: ids, the arg merge, the exports it skips, the order, a component
view through `createComponent` and a render view, and the hash split.
