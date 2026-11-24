import { entries, type Entry, type Module } from "@cssints/stories";

import * as button from "./button.stories.tsx";
import * as field from "./field.stories.tsx";
import * as switchStories from "./switch.stories.tsx";
import * as tabs from "./tabs.stories.tsx";

const modules = {
  "./button.stories.tsx": button,
  "./field.stories.tsx": field,
  "./switch.stories.tsx": switchStories,
  "./tabs.stories.tsx": tabs,
} satisfies Record<string, Module>;

/**
 * Every story of the DS, sorted by item and then by id (`button--accent`, `field--default`, `tabs--opened-on-the-second`):
 * the CSF 3 modules listed above through `@cssints/stories`' loader, so the ids, the args and the controls are the ones
 * Storybook builds.
 */
export const stories: ReadonlyArray<Entry> = entries(modules, (path) =>
  path.slice("./".length, -".stories.tsx".length),
);

/**
 * The story an id names.
 *
 * @param {string} id the story id, `button--accent`
 * @returns {Entry | undefined} the story, or nothing when no file declares it
 */
export const storyOfId = (id: string) => stories.find((entry) => entry.id === id);
