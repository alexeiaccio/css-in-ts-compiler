// @cssints/icons: an icon is a style (cssints/plugin) with a marker, a kernel and one custom property, the SVG as a
// data URL. The kernel is global CSS printed once, so each icon costs one declaration. Build time only; no runtime.
import { readdirSync, readFileSync } from "node:fs";
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
import { style } from "cssints/plugin";
import type { Kernel } from "cssints/plugin";

import type * as Types from "./types.ts";

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
const MASK: Kernel = {
  key: "icon-mask@1",
  css: `._i{${box};background-color:currentColor;mask:var(--_svg) no-repeat center/100% 100%}`,
};
const IMAGE: Kernel = {
  key: "icon-image@1",
  css: `._ic{${box};background:var(--_svg) no-repeat center/100% 100%}`,
};

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

const iconify = (collection: string): Source => {
  const pkg = `@iconify-json/${collection}/icons.json`;
  let json: Json;
  try {
    json = JSON.parse(
      readFileSync(createRequire(join(process.cwd(), "_")).resolve(pkg), "utf8"),
    ) as Json;
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
      const svg = parseSVGContent(readFileSync(join(abs, `${name}.svg`), "utf8"));
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

// See types.ts. The grammar takes any name: the lookup says what is missing, and suggests.
export const icons: typeof Types.icons = (
  options: { provider: "iconify-json"; collection: string } | { provider: "fs"; dir: string },
) => {
  const source = options.provider === "fs" ? files(options.dir) : iconify(options.collection);
  return style("<declaration-value>", (name) => {
    const icon = source.get(name);
    if (!icon) {
      const near = nearest(name, source.names());
      throw new Error(
        `cssints: icons: no icon ${JSON.stringify(name)} in ${source.label}${near ? `, did you mean ${near}?` : ""}`,
      );
    }
    const mask = icon.body.includes("currentColor");
    return {
      decls: [["--_svg", urlOf(icon)]],
      markers: [mask ? "_i" : "_ic"],
      kernels: [mask ? MASK : IMAGE],
    };
  }) as never;
};
