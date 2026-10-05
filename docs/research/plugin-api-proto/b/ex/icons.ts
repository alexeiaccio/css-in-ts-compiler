// @cssints/icons on `member`: index.ts and types.ts become one file; the name checking stays a type of the package.
import { member } from "cssints/plugin";
import type { Kernel, Style } from "cssints/plugin";

const box = "display:inline-block;width:1em;height:1em";
const MASK: Kernel = { css: `&{${box};background-color:currentColor;mask:var(--_svg) no-repeat center/100% 100%}` };
const IMAGE: Kernel = { css: `&{${box};background:var(--_svg) no-repeat center/100% 100%}` };

interface Icon { body: string }
interface Source { label: string; get(name: string): Icon | undefined; names(): string[] }
declare const iconify: (collection: string) => Source;
declare const files: (dir: string) => Source;
declare const urlOf: (icon: Icon) => string;
declare const nearest: (name: string, names: string[]) => string | undefined;

/** An iconify JSON collection as TypeScript sees it: `typeof import("@iconify-json/mdi/icons.json")`. */
export interface Collection {
  icons: Record<string, unknown>;
  aliases?: Record<string, unknown>;
}
export type IconName<C extends Collection> = (keyof C["icons"] | keyof NonNullable<C["aliases"]>) & string;
export type Icons<N extends string> = (name: N) => Style;
/** What member() derives is wider (any name); this is the narrowing the package promises, checked by assignment. */
interface IconsFn {
  <C extends Collection = Collection>(options: { provider: "iconify-json"; collection: string }): Icons<IconName<C>>;
  (options: { provider: "fs"; dir: string }): Icons<string>;
}

export const icons: IconsFn = member({
  name: "icons",
  args: { provider: "iconify-json | fs", "collection?": "<declaration-value>", "dir?": "<declaration-value>" },
  emit: ({ provider, collection, dir }) => {
    const source = provider === "fs" ? files(dir ?? "") : iconify(collection ?? "");
    return member({
      name: "icon",
      args: "<declaration-value>",
      emit: (name) => {
        const icon = source.get(name);
        if (!icon) {
          const near = nearest(name, source.names());
          throw new Error(`no icon ${JSON.stringify(name)} in ${source.label}${near ? `, did you mean ${near}?` : ""}`);
        }
        return { decls: { "--_svg": urlOf(icon) }, kernel: icon.body.includes("currentColor") ? MASK : IMAGE };
      },
    });
  },
});
