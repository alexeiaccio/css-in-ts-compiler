// Compiles the token data into a plain stylesheet: every token the theme declares, as a
// custom property, whatever the page happens to use.
//
// cssints writes a token only when a class reads it, which keeps an app's sheet small — and
// which means a project without the plugin cannot lean on `var(--color-border)` unless the app
// happens to use that exact token. The registry ships this file instead, so a plain stylesheet
// reads the whole theme. `--check` compares it with the file in the tree (CI), and says nothing
// when they agree.
//
//   node scripts/theme-css.ts > src/registry/theme.css
//   node scripts/theme-css.ts --check
//
//   node scripts/theme-css.ts > src/registry/theme.css
import { readFileSync } from "node:fs";

import { darkTheme, forcedColorsTheme, lightTokens } from "../src/registry/tokens.ts";

const kebab = (path: ReadonlyArray<string>): string =>
  path
    .join("-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

type Shadow = {
  readonly color: string;
  readonly offsetX: string;
  readonly offsetY: string;
  readonly blur: string;
  readonly spread: string;
};

const isShadow = (value: unknown): value is Shadow =>
  typeof value === "object" && value !== null && "offsetX" in value;

const toCss = (raw: unknown): string => {
  if (isShadow(raw)) {
    return `${raw.offsetX} ${raw.offsetY} ${raw.blur} ${raw.spread} ${raw.color}`;
  }
  // A `{color.accent}` reference is the custom property of that path: the value the token
  // starts with is only a fallback for a browser that cannot read the reference.
  return String(raw).replace(
    /\{([a-z0-9.]+)\}/gi,
    (_, ref: string) => `var(--${kebab(ref.split("."))})`,
  );
};

const flatten = (
  node: Record<string, unknown>,
  path: ReadonlyArray<string> = [],
): Array<{ path: ReadonlyArray<string>; value: string }> => {
  const out: Array<{ path: ReadonlyArray<string>; value: string }> = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === "$type") {
      continue;
    }
    if (typeof value === "object" && value !== null && "$value" in value) {
      out.push({
        path: [...path, key],
        value: toCss((value as { readonly $value: unknown }).$value),
      });
    } else if (typeof value === "object" && value !== null) {
      out.push(...flatten(value as Record<string, unknown>, [...path, key]));
    }
  }
  return out;
};

const block = (node: Record<string, unknown>, indent: string): string =>
  flatten(node)
    .map(({ path, value }) => `${indent}--${kebab(path)}: ${value};`)
    .join("\n");

const sheet = [
  "/* Generated from tokens.ts by scripts/theme-css.ts. Do not edit. */",
  "/* Derived from React Aria's starter theme (Apache-2.0); see NOTICE. */",
  ":root {",
  block(lightTokens, "  "),
  "}",
  "",
  "@media (prefers-color-scheme: dark) {",
  "  :root {",
  block(darkTheme, "    "),
  "  }",
  "}",
  "",
  "@media (forced-colors: active) {",
  "  :root {",
  block(forcedColorsTheme, "    "),
  "  }",
  "}",
  "",
].join("\n");

if (process.argv.includes("--check")) {
  const file = new URL("../src/registry/theme.css", import.meta.url);
  if (readFileSync(file, "utf8") !== sheet) {
    process.stderr.write(
      "theme.css is stale: node scripts/theme-css.ts > src/registry/theme.css\n",
    );
    process.exit(1);
  }
} else {
  process.stdout.write(sheet);
}
