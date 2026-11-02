import { entries, type Entry, type Module } from "./load.ts";

// Every story file sits beside its component, in the registry item's directory: add one and it is on the item's page,
// there is no registry to edit (the item's own `r/<name>.json` is built from the files the registry-json script lists, and
// a story is not one of them).
const modules = import.meta.glob<Module>("../registry/*/*.stories.tsx", { eager: true });

/** Every story the site has, sorted by item and then by id. */
export const stories: ReadonlyArray<Entry> = entries(modules);

/**
 * The stories of one registry item; empty for an item without a story file.
 *
 * @param {string} item the registry item's name (`button`)
 * @returns {ReadonlyArray<Entry>} its stories, in the file's order
 */
export const storiesOf = (item: string): ReadonlyArray<Entry> =>
  stories.filter((entry) => entry.item === item);
