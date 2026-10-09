// @cssints/icons: an icon is a style (cssints/plugin `scope()`) with a marker, a kernel and one custom property, the SVG as a
// data URL. The kernel is global CSS printed once, so each icon costs one declaration. Build time only; no runtime.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

import {
  convertParsedSVG,
  getIconData,
  iconToHTML,
  iconToSVG,
  parseSVGContent,
  svgToURL,
} from "@iconify/utils";
import { arg, dependsOn, scope, type Style } from "cssints/plugin";

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
/** Where the icons come from: the `@iconify-json/<collection>` package, or the `.svg` files of a directory. */
export type Options =
  | { provider: "iconify-json"; collection: string }
  | { provider: "fs"; dir: string };

type Json = Parameters<typeof getIconData>[0];
type Icon = NonNullable<ReturnType<typeof convertParsedSVG>>;
interface Source {
  /** Where the icons come from, for the error text. */
  label: string;
  get(name: string): Icon | undefined;
  names(): string[];
}

// One-colour icons (they paint with currentColor, iconify's own rule) are masks and take the text colour; the rest are
// images. LightningCSS adds -webkit-mask for the browserslist targets, so the mask kernel requires nothing: a
// `requires` key would warn for targets that have only the prefixed form, which LightningCSS covers.
const box = "display:inline-block;width:1em;height:1em";
const mask = {
  css: `&{${box};background-color:currentColor;mask:var(--_svg) no-repeat center/100% 100%}`,
};
const image = { css: `&{${box};background:var(--_svg) no-repeat center/100% 100%}` };

const distance = (a: string, b: string) => {
  let row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++)
      next[j] = Math.min(
        row[j]! + 1,
        next[j - 1]! + 1,
        row[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    row = next;
  }
  return row[b.length]!;
};

// The nearest name, when it is near enough to be a typo.
const nearest = (name: string, names: string[]) => {
  const near = Math.max(2, name.length >> 1);
  let best: string | undefined;
  let least = near + 1;
  for (const n of names) {
    const d = distance(name, n);
    if (d < least) [best, least] = [n, d];
  }
  return best;
};

// The engine evaluates this module again for every module that imports the one that calls icons(), and a collection is
// megabytes of JSON (ph: 4.5 MB, 55 ms): parsed once per file version, kept on globalThis, which the engine's runner shares.
const g = globalThis as typeof globalThis & {
  __cssintsIcons?: Map<string, { mtime: number; json: Json }>;
};

const iconify = (collection: string): Source => {
  const pkg = `@iconify-json/${collection}/icons.json`;
  let json: Json;
  try {
    const file = createRequire(join(process.cwd(), "_")).resolve(pkg);
    const mtime = statSync(file).mtimeMs;
    const cache = (g.__cssintsIcons ??= new Map<string, { mtime: number; json: Json }>());
    const hit = cache.get(file);
    json = hit?.mtime === mtime ? hit.json : (JSON.parse(readFileSync(file, "utf8")) as Json);
    cache.set(file, { mtime, json });
  } catch (e) {
    throw new Error(
      `cssints: icons: cannot read ${pkg} from ${process.cwd()}: install @iconify-json/${collection}`,
      { cause: e },
    );
  }
  return {
    label: `iconify-json ${collection}`,
    get: (name) => getIconData(json, name) ?? undefined,
    names: () => [...Object.keys(json.icons), ...Object.keys(json.aliases ?? {})],
  };
};

const files = (dir: string): Source => {
  const abs = resolve(dir);
  const list = () => {
    try {
      return readdirSync(abs).filter((f) => f.endsWith(".svg"));
    } catch (e) {
      throw new Error(`cssints: icons: cannot read the directory ${abs}`, { cause: e });
    }
  };
  list();
  return {
    label: dir,
    names: () => list().map((f) => f.slice(0, -4)),
    get: (name) => {
      if (!list().includes(`${name}.svg`)) return undefined;
      const file = join(abs, `${name}.svg`);
      dependsOn(file);
      const svg = parseSVGContent(readFileSync(file, "utf8"));
      const icon = svg && convertParsedSVG(svg);
      if (!icon) throw new Error(`cssints: icons: ${name}.svg is not an SVG with a viewBox`);
      return icon;
    },
  };
};

// The data URL of an icon on a square view box, as iconify's own CSS makes it: currentColor is black, the mask uses
// only the alpha.
const urlOf = (icon: Icon) => {
  const { body, viewBox } = iconToSVG(icon);
  const [x, y, w, h] = viewBox;
  const side = Math.max(w, h);
  return svgToURL(
    iconToHTML(body.replace(/currentColor/g, "black"), {
      viewBox: `${x - (side - w) / 2} ${y - (side - h) / 2} ${side} ${side}`,
      width: `${side}`,
      height: `${side}`,
    }),
  );
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
export const icons = <C extends Collection = Collection>(options: Options): Icons<IconName<C>> => {
  const source = options.provider === "fs" ? files(options.dir) : iconify(options.collection);
  return scope("icons", { mask, image, icon: { args: arg<IconName<C>>() } })
    .build({
      icon: (name) => {
        const icon = source.get(name);
        if (!icon) {
          const near = nearest(name, source.names());
          throw new Error(
            `cssints: icons: no icon ${JSON.stringify(name)} in ${source.label}${near ? `, did you mean ${near}?` : ""}`,
          );
        }
        return {
          decls: [["--_svg", urlOf(icon)]],
          uses: [icon.body.includes("currentColor") ? "mask" : "image"],
        };
      },
    })
    .export().icon;
};
