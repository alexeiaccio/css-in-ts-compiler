// css.check.contrast(fg, bg, { min }): the WCAG 2.x contrast ratio of two colour tokens for their default values and for
// every theme that sets either one or a token they are aliases of or derived from. Build time only: color.ts (culori) is imported
// here, when the first check runs, and nowhere the browser bundle reaches (runtime.ts imports nothing). A value it
// cannot read (color-mix(), a relative colour, light-dark(), currentColor, a system colour, a var()) or that is
// translucent is a warning that names the token.
import { Effect } from "effect";

import { MacroError } from "./errors.ts";
import { type Check, registry, type RegistryState } from "./registry.ts";

const VAR = /var\((--[^\s,)]+)\)/g;

// The value of a token where `values` (a theme's) sets some: the theme's text or the token's template, with the value
// of each token it refers to put in place of its `var()`, recursively (the theme's own value, else the base).
const valueOf = (
  state: RegistryState,
  name: string,
  values?: Map<string, string>,
): string | undefined => {
  const def = state.defs.get(name);
  const text = values?.get(name) ?? def?.template;
  return text === undefined
    ? def?.value
    : text.replace(VAR, (m, n: string) => (state.defs.has(n) ? valueOf(state, n, values)! : m));
};
// The token and every token it refers to, through aliases and derived tokens.
const affectedBy = (defs: RegistryState["defs"], names: string[], out = new Set<string>()) => {
  for (const n of names)
    if (!out.has(n)) {
      out.add(n);
      affectedBy(defs, defs.get(n)?.refs ?? [], out);
    }
  return out;
};

type Colours = typeof import("./color.ts");

// The floor at two places, so that 4.499 does not read as the 4.5 it misses.
const shown = (r: number) => (Math.floor(r * 100) / 100).toFixed(2);

// The failures of a check, one message each, and the warnings; the warnings are recorded once per build.
const verify = (check: Check, state: RegistryState, { luminance, ratio }: Colours): string[] => {
  const { fg, bg, min } = check;
  const path = (n: string) => state.defs.get(n)?.path ?? n;
  const affecting = affectedBy(state.defs, [fg, bg]);
  const subjects: { label: string; values?: Map<string, string> }[] = [
    { label: "the default values" },
  ];
  for (const { theme } of state.themed.values())
    if (theme && [...theme.values.keys()].some((n) => affecting.has(n)))
      subjects.push({ label: `theme ${theme.label}`, values: theme.values });
  const errors: string[] = [];
  for (const { label, values } of subjects) {
    const pair = [fg, bg].map((n) => {
      const text = valueOf(state, n, values) ?? "";
      return { name: n, text, l: luminance(text) };
    });
    const [f, b] = pair as [(typeof pair)[number], (typeof pair)[number]];
    let ok = true;
    for (const p of pair)
      if (p.l.why !== undefined) {
        ok = false;
        const key = `contrast ${p.name} ${p.text}`;
        if (!state.warned.has(key)) {
          state.warned.add(key);
          state.warnings.push(
            `cssints: contrast is not checked for ${path(p.name)} in ${label}: "${p.text}" ${p.l.why}`,
          );
        }
      }
    if (!ok || f.l.lum === undefined || b.l.lum === undefined) continue;
    const r = ratio(f.l.lum, b.l.lum);
    if (r < min)
      errors.push(
        `cssints: contrast ${shown(r)} is below ${min}: ${path(fg)} ${f.text} on ${path(bg)} ${b.text}, in ${label}`,
      );
  }
  return errors;
};

// Runs the checks that `select` picks: the first failure is the error, at the call of the check.
export const verifyChecks = Effect.fnUntraced(function* (
  select: (c: Check) => boolean,
): Effect.fn.Return<void, MacroError> {
  const checks = [...registry.checks.values()].filter(select);
  if (!checks.length) return;
  const colours = yield* Effect.promise(() => import("./color.ts"));
  for (const check of checks) {
    const errors = verify(check, registry, colours);
    if (errors.length) return yield* new MacroError({ message: errors.join("\n"), ...check.at });
  }
});
