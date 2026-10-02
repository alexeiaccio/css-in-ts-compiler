// What TypeScript sees of "@cssints/icons" (the "types" condition of package.json). The implementation (index.ts) runs at
// build time only: an icon is a style, so user code gets a class string like from any other member.
import type { Style } from "cssints/plugin";

/** An iconify JSON collection as TypeScript sees it: `typeof import("@iconify-json/mdi/icons.json")`. */
export interface Collection {
  icons: Record<string, unknown>;
  aliases?: Record<string, unknown>;
}
/** The names of a collection: its icons and its aliases. `string` when the collection is not given. */
export type IconName<C extends Collection> = (keyof C["icons"] | keyof NonNullable<C["aliases"]>) &
  string;
/** `icons(...)` gives this: call it with a name where the style is used (`cn(mdi("home"), ...)`). */
export type Icons<N extends string> = (name: N) => Style;

/**
 * Icons from the `@iconify-json/<collection>` package installed in the project (read from `node_modules` when the
 * module runs; the project is the working directory). Say which collection in the type argument to have the names
 * checked as you type: `icons<typeof import("@iconify-json/mdi/icons.json")>({ provider: "iconify-json", collection: "mdi" })`.
 * A name that does not exist is a build error that suggests the nearest one.
 */
export declare function icons<C extends Collection = Collection>(options: {
  provider: "iconify-json";
  collection: string;
}): Icons<IconName<C>>;
/** Icons from the `.svg` files of a directory (relative to the working directory), named without the extension. */
export declare function icons(options: { provider: "fs"; dir: string }): Icons<string>;
