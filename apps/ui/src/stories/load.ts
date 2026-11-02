// A CSF 3 loader, shared by the docs site and the lab: `entries()` takes the modules an app globs and returns the stories,
// with the ids Storybook builds. The globs stay in the app (Vite resolves them relative to the file that writes them), and
// so does the chrome: a rail of headless widgets in the lab, the kit's tabs in the site. This file is the part that is the
// same in both, and the reason it is not a package yet is that it is the only part that is.
import { createComponent } from "solid-js";
import type { JSX } from "@solidjs/web";

import type { ArgTypes, Meta, Story } from "./csf.ts";

/** The values a story renders with: the meta's args, the story's, and whatever a control wrote since. */
export type Args = Record<string, unknown>;

/** One story: the id Storybook would give it, its args and controls, and the view that draws it. */
export interface Entry {
  /** `button--primary`: the file's item and the story's, kebab-cased, as Storybook builds a story id. */
  readonly id: string;
  /** The registry item the file belongs to (`button`), or the file's own name in an app without a registry. */
  readonly item: string;
  readonly title: string;
  readonly name: string;
  /** The meta's args with the story's over them, before any control moves them. */
  readonly args: Args;
  /** The controls this story declares; a story with none gets no panel. */
  readonly argTypes: ArgTypes;
  /** Renders the story with the args it is given. */
  readonly view: (args: Args) => JSX.Element;
}

export type Module = { readonly default: Meta } & Record<string, unknown>;

const kebab = (text: string): string =>
  text
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();

const viewOf = (meta: Meta, story: Story): ((args: Args) => JSX.Element) => {
  if (story.render) {
    const render = story.render;
    return (args) => render(args);
  }
  const component = meta.component;
  if (!component) {
    throw new Error(
      `stories: a story of "${meta.title}" has no render and its meta has no component`,
    );
  }
  return (args) => createComponent(component as never, args as never);
};

/**
 * Every story of every CSF module given, sorted by item and then by id.
 *
 * Within a file an ES module namespace lists its exports alphabetically, which is the order Storybook gives a component's
 * stories by default, and the sort keeps it.
 *
 * @param {Readonly<Record<string, Module>>} modules the CSF modules, keyed by their path (an `import.meta.glob` result)
 * @param {(path: string) => string} itemOf the item a module documents, from its path; a story beside its component names
 *   the directory, which is the default
 * @returns {ReadonlyArray<Entry>} the stories, sorted
 */
export const entries = (
  modules: Readonly<Record<string, Module>>,
  itemOf: (path: string) => string = (path) => path.split("/").at(-2) ?? "",
): ReadonlyArray<Entry> => {
  const found: Array<Entry> = [];
  for (const [path, module] of Object.entries(modules)) {
    const meta = module.default;
    const item = itemOf(path);
    for (const [exported, value] of Object.entries(module)) {
      if (exported === "default") {
        continue;
      }
      // The plugin adds exports of its own to a module it compiles (`__cssints_hoisted`, `$$moduleUrl`): a story is an object.
      if (typeof value !== "object" || value === null) {
        continue;
      }
      const story = value as Story;
      const name = story.name ?? exported;
      found.push({
        id: `${kebab(item)}--${kebab(name)}`,
        item,
        title: meta.title,
        name,
        args: { ...meta.args, ...story.args },
        argTypes: meta.argTypes ?? {},
        view: viewOf(meta, story),
      });
    }
  }
  return found.sort((a, b) => a.item.localeCompare(b.item) || a.id.localeCompare(b.id));
};

/**
 * The story an id names.
 *
 * @param {ReadonlyArray<Entry>} stories the stories of the app
 * @param {string} id the id, `button--primary`
 * @returns {Entry | undefined} the story, or nothing when no file declares it
 */
export const storyOfId = (stories: ReadonlyArray<Entry>, id: string): Entry | undefined =>
  stories.find((entry) => entry.id === id);

/**
 * A hash split into the page it names and the story, if it names one: `#button--primary` is the button's primary story,
 * `#button` its first, `#installation` a guide. The split is on the first `--`, which no item or guide name holds.
 *
 * @param {string} hash the raw `location.hash`, with or without its `#`
 * @returns {{ name: string, story: string | undefined }} the page and the full story id
 */
export const parseHash = (hash: string): { name: string; story: string | undefined } => {
  const raw = hash.replace(/^#/, "");
  const at = raw.indexOf("--");
  return at === -1 ? { name: raw, story: undefined } : { name: raw.slice(0, at), story: raw };
};
