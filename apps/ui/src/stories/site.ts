import { entries, type Entry, type Module } from "@cssints/stories";
import type { JSX } from "@solidjs/web";

// Every story file sits beside its component, in the registry item's directory: add one and it is on the item's page,
// there is no registry to edit (the item's own `r/<name>.json` is built from the files the registry-json script lists, and
// a story is not one of them).
const modules = import.meta.glob<Module<JSX.Element>>("../registry/*/*.stories.tsx", {
  eager: true,
});

/** One story of the site: the loader's entry, drawn as DOM. */
export type SiteEntry = Entry<JSX.Element>;

/** Every story the site has, sorted by item and then by id. */
export const stories: ReadonlyArray<SiteEntry> = entries<JSX.Element>(modules);

/**
 * The stories of one registry item; empty for an item without a story file.
 *
 * @param {string} item the registry item's name (`button`)
 * @returns {ReadonlyArray<Entry>} its stories, in the file's order
 */
export const storiesOf = (item: string): ReadonlyArray<SiteEntry> =>
  stories.filter((entry) => entry.item === item);
