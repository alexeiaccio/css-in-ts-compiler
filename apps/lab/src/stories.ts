// The lab's stories, loaded by the same CSF reader the docs site uses (`apps/ui/src/stories/load.ts`): the part that is
// identical in both is not copied, and the chrome around the canvas is not shared — the lab's rail is headless widgets in the
// lab's own theme, the site's is the kit's tabs.
import { entries, type Entry, type Module } from "../../ui/src/stories/load.ts";

export type { Entry };

// Every story file is a CSF module in src/stories: add a file and it is in the rail, there is no registry to edit. The lab
// has no registry, so the item is the file's own name.
const modules = import.meta.glob<Module>("./stories/*.stories.tsx", { eager: true });

/** Every story of the lab, by id. */
export const stories: ReadonlyArray<Entry> = entries(modules, (path) =>
  path.slice("./stories/".length, -".stories.tsx".length),
);

/**
 * The entry at `index`, or the first: the rail is built from `stories`, so an index in it is an entry.
 *
 * @param {number} index the story's place in the rail
 * @returns {Entry} the story
 */
export const storyAt = (index: number): Entry => {
  const entry = stories[index] ?? stories[0];
  if (!entry) {
    throw new Error("apps/lab: no stories in src/stories");
  }
  return entry;
};

/**
 * The story an id names, or the first one.
 *
 * @param {string} id the story id, `disclosure--closed`
 * @returns {Entry} the story
 */
export const storyOfId = (id: string): Entry =>
  stories.find((entry) => entry.id === id) ?? storyAt(0);
