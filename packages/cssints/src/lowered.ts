// Does LightningCSS lower a value that a support warning is about, and to what? The build runs the sheet through it with the
// browserslist targets, so `color: oklch(…)` becomes `color: #db4aa7; color: lab(…)` and the target that lacks oklch()
// gets the first one. The answer comes from LightningCSS itself: transform `x{prop:value}` (a custom property in `:root`
// for a token value) for the lacking targets; the feature of the warning must be in the declaration and no longer in
// the first declaration of the output (`-webkit-backdrop-filter` is not `backdrop-filter`). Plain code, called per
// warning only (see macro.ts `checkNow`); the answer is cached in the registry per property, value, feature and targets.
// `fallbackOf` gives the value of that first declaration, which token.ts writes as the initial value of an `@property`
// rule (LightningCSS does not lower those).
import type { Warning } from "@cssints/css-grammar/support";
import { browserslistToTargets, transform } from "lightningcss";

import { registry } from "./registry.ts";

const first = (css: string) => /^[^{]*\{([^;}]*)/.exec(css)?.[1];

const lower = (
  prop: string,
  value: string,
  lacking: string[],
  feature: string,
): string | undefined => {
  const code = Buffer.from(
    prop.startsWith("--") ? `:root{${prop}:${value}}` : `x{${prop}:${value}}`,
  );
  const out = first(
    transform({
      filename: "x.css",
      code,
      minify: true,
      targets: browserslistToTargets(lacking),
    }).code.toString(),
  );
  const holds = new RegExp(`(?<![\\w-])${feature.replace(/\(\)$/, "")}(?![\\w-])`);
  return out !== undefined && holds.test(`${prop}:${value}`) && !holds.test(out)
    ? out.slice(out.indexOf(":") + 1)
    : undefined;
};

// What LightningCSS makes of `prop: value` for the targets of the warning `w` (the first declaration), or undefined when
// it does not lower it; a custom property is `--name`.
export const fallbackOf = (prop: string, value: string, w: Warning): string | undefined => {
  const key = `${prop}\0${value}\0${w.feature}\0${w.lacking.join()}`;
  let hit = registry.lowered.get(key);
  if (hit === undefined) {
    try {
      hit = lower(prop, value, w.lacking, w.feature) ?? false;
    } catch {
      hit = false; // a value LightningCSS does not parse is not lowered by it
    }
    registry.lowered.set(key, hit);
  }
  return hit || undefined;
};

export const loweredOf = (prop: string, value: string, w: Warning): boolean =>
  fallbackOf(prop, value, w) !== undefined;
