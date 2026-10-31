import type { JSX } from "@solidjs/web";
import { createComponent } from "solid-js";

import type { Meta, Story } from "./csf.ts";

/** One story as the rail shows it, with the id Storybook would give it. */
export interface Entry {
  /** `button--primary`: the file's name and the story's, kebab-cased, as Storybook builds a story id. */
  readonly id: string;
  readonly title: string;
  readonly name: string;
  readonly view: () => JSX.Element;
}

// Every story file is a CSF module in src/stories: add a file and it is in the rail, there is no registry to edit.
type Module = { readonly default: Meta } & Record<string, unknown>;

const modules = import.meta.glob<Module>("./stories/*.stories.tsx", { eager: true });

const kebab = (text: string): string =>
  text
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();

const viewOf = (meta: Meta, story: Story): (() => JSX.Element) => {
  const args = { ...meta.args, ...story.args };
  if (story.render) {
    const render = story.render;
    return () => render(args);
  }
  const component = meta.component;
  if (!component) {
    throw new Error(`lab: a story of "${meta.title}" has no render and its meta has no component`);
  }
  return () => createComponent(component, args);
};

const found: Array<Entry> = [];
for (const [path, module] of Object.entries(modules)) {
  const meta = module.default;
  const file = path.slice("./stories/".length, -".stories.tsx".length);
  for (const [exported, value] of Object.entries(module)) {
    if (exported === "default") {
      continue;
    }
    const story = value as Story;
    // The plugin adds exports of its own to a module it compiles (`__cssints_hoisted`, `$$moduleUrl`): a story is an object.
    if (typeof value !== "object" || value === null) {
      continue;
    }
    const name = story.name ?? exported;
    found.push({
      id: `${kebab(file)}--${kebab(name)}`,
      title: meta.title,
      name,
      view: viewOf(meta, story),
    });
  }
}

// By component title. Within a file an ES module namespace lists its exports alphabetically, which is the order Storybook
// gives the stories of a component by default.
export const stories: ReadonlyArray<Entry> = found.sort((a, b) => a.title.localeCompare(b.title));

// The entry at `index`, or the first: the rail is built from `stories`, so an index in it is an entry.
export const storyAt = (index: number): Entry => {
  const entry = stories[index] ?? stories[0];
  if (!entry) {
    throw new Error("apps/lab: no stories in src/stories");
  }
  return entry;
};

// The story an id names, or the first one.
export const storyOfId = (id: string): Entry =>
  stories.find((entry) => entry.id === id) ?? storyAt(0);
