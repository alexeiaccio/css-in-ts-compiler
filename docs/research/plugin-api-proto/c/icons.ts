// (b) @cssints/icons on the new API: no types.ts, no `as never`. The signatures below are the ones users see.
import { plugin } from "cssints/plugin";
import type { Css, Style } from "cssints/plugin";

import { files, iconify, nearest, urlOf, type Source } from "./sources.ts";

const p = plugin("icon");

// One private-ish custom property: the SVG as a data URL. `<url>` registered, `inherits: false`: --icon-svg.
const svg = p.token.url('url("data:,")', "svg");

const box = (css: Css) => [css.display("inline-block"), css.width("1em"), css.height("1em")];
// One-colour icons (iconify's `currentColor`) are masks and take the text colour; the rest are images.
const MASK = p.kernel("_i", (css) => [
  ...box(css),
  css.backgroundColor("currentColor"),
  css.mask(svg, "no-repeat", "center / 100% 100%"),
]);
const IMAGE = p.kernel("_ic", (css) => [
  ...box(css),
  css.background(svg, "no-repeat", "center / 100% 100%"),
]);

export interface Collection {
  icons: Record<string, unknown>;
  aliases?: Record<string, unknown>;
}
export type IconName<C extends Collection> = (keyof C["icons"] | keyof NonNullable<C["aliases"]>) &
  string;

const iconsOf = <N extends string>(source: Source) =>
  p.member((css, name: N): Style => {
    const icon = source.get(name);
    if (!icon) {
      const near = nearest(name, source.names());
      throw new Error(
        `no icon ${JSON.stringify(name)} in ${source.label}${near ? `, did you mean ${near}?` : ""}`,
      );
    }
    return css.cn(icon.body.includes("currentColor") ? MASK : IMAGE, p.set(svg, urlOf(icon)));
  });

export function icons<C extends Collection = Collection>(options: {
  provider: "iconify-json";
  collection: string;
}): (name: IconName<C>) => Style;
export function icons(options: { provider: "fs"; dir: string }): (name: string) => Style;
export function icons(options: { provider: "iconify-json"; collection: string } | { provider: "fs"; dir: string }) {
  return iconsOf(options.provider === "fs" ? files(options.dir) : iconify(options.collection));
}
