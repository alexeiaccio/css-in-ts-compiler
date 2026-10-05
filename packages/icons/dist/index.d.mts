import { Style } from "cssints/plugin";
//#region src/index.d.ts
/** An iconify JSON collection as TypeScript sees it: `typeof import("@iconify-json/mdi/icons.json")`. */
export interface Collection {
  icons: Record<string, unknown>;
  aliases?: Record<string, unknown>;
}
/** The names of a collection: its icons and its aliases. `string` when the collection is not given. */
export type IconName<C extends Collection> = (keyof C["icons"] | keyof NonNullable<C["aliases"]>) & string;
/** `icons(...)` gives this: call it with a name where the style is used (`cn(mdi("home"), ...)`). */
export type Icons<N extends string> = (name: N) => Style;
/** Where the icons come from: the `@iconify-json/<collection>` package, or the `.svg` files of a directory. */
export type Options = {
  provider: "iconify-json";
  collection: string;
} | {
  provider: "fs";
  dir: string;
};
/**
 * Icons from the `@iconify-json/<collection>` package installed in the project (read from `node_modules` when the
 * module runs; the project is the working directory), or from the `.svg` files of a directory (relative to the working
 * directory, named without the extension). Say which collection in the type argument to have the names checked as you
 * type: `icons<typeof import("@iconify-json/mdi/icons.json")>({ provider: "iconify-json", collection: "mdi" })`. A name
 * that does not exist is a build error that suggests the nearest one.
 *
 * One scope, "icons", whatever the collection: its kernels are the same, and `build` is the same code, which the engine
 * takes as one definition however many times `icons()` runs.
 *
 * @param {Options} options where the icons come from
 * @returns {Icons<IconName<C>>} a function of the icon name: a style for `cn()`
 */
export declare const icons: <C extends Collection = Collection>(options: Options) => Icons<IconName<C>>;
//#endregion