// css.check.contrast(fg, bg, { min }): the WCAG 2.x contrast ratio of two colour tokens for their default values and for
// every theme that sets either one or a token they are aliases of. Build time only: color.ts (culori) is imported
// here, when the first check runs, and nowhere the browser bundle reaches (runtime.ts imports nothing). A value it
// cannot read (color-mix(), a relative colour, light-dark(), currentColor, a system colour, a var()) or that is
// translucent is a warning that names the token.
import { Effect } from "effect";

import { MacroError } from "./errors.ts";
import { type Check, registry, type RegistryState } from "./registry.ts";

// The value of a token where `values` (a theme's) sets some: an alias follows its target unless a theme set it.
const valueOf = (
  { defs }: RegistryState,
  name: string,
  values?: Map<string, string>,
): string | undefined => {
  for (let n: string | undefined = name; n !== undefined; ) {
    const v = values?.get(n);
    if (v !== undefined) return v;
    const def = defs.get(n);
    if (!def?.alias) return def?.value;
    n = def.alias;
  }
  return undefined;
};
const chainOf = ({ defs }: RegistryState, name: string): string[] => {
  const out: string[] = [];
  for (
    let n: string | undefined = name;
    n !== undefined && !out.includes(n);
    n = defs.get(n)?.alias
  )
    out.push(n);
  return out;
};

type Colours = typeof import("./color.ts");

// The floor at two places, so that 4.499 does not read as the 4.5 it misses.
const shown = (r: number) => (Math.floor(r * 100) / 100).toFixed(2);

// The failures of a check, one message each, and the warnings; the warnings are recorded once per build.
const verify = (check: Check, state: RegistryState, { luminance, ratio }: Colours): string[] => {
  const { fg, bg, min } = check;
  const path = (n: string) => state.defs.get(n)?.path ?? n;
  const affecting = new Set([...chainOf(state, fg), ...chainOf(state, bg)]);
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
      if ("why" in p.l) {
        ok = false;
        const key = `contrast ${p.name} ${p.text}`;
        if (!state.warned.has(key)) {
          state.warned.add(key);
          state.warnings.push(
            `cssints: contrast is not checked for ${path(p.name)} in ${label}: "${p.text}" ${p.l.why}`,
          );
        }
      }
    if (!ok || !("lum" in f.l) || !("lum" in b.l)) continue;
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
