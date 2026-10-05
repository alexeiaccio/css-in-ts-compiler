// The build side of the derived-token runtime (derived.ts, cssints-i9xo): which derived tokens the runtime computes where a
// target cannot parse their value (`standIn`, called by createTokens and createGlobalTheme), and the rule of the sheet that
// carries what it reads (`derivedRule`, called by renderSheet). Tokens are not members, so there is no plugin to register:
// the engine registers the runtime itself, through the same delivery as a plugin's (delivery.ts).
import { browsers, supportOf } from "@cssints/css-grammar/support";
import type { TokenType } from "@cssints/css-grammar/token";
import { Effect, Formatter, Result } from "effect";

import { addDerived, DERIVED, needed } from "./delivery.ts";
import { evaluate, KEY } from "./derived.ts";
import { Registry, type At, type RegistryState } from "./registry.ts";

// what stops the evaluator at `literal`, if anything
const refuses = (literal: string): string | undefined => {
  const tried = Result.try({
    try: () => evaluate(literal),
    catch: (e) => `does not evaluate "${(e as Error).message}"`,
  });
  return Result.isFailure(tried) ? tried.failure : undefined;
};

// Whether the runtime computes a derived token whose `literal` (its value with the defaults for each `var()`) a target
// cannot parse: a colour that inherits, set on :root (not under a container), in the subset of derived.ts. It then
// registers the runtime for the file being evaluated. Otherwise the token stays at its static default, and the build says so.
export const standIn = Effect.fnUntraced(function* (
  at: At,
  who: string,
  kind: TokenType,
  literal: string,
  inherits: boolean,
  rooted: boolean,
): Effect.fn.Return<boolean> {
  const { warned, warnings } = yield* Registry;
  let why: string | undefined;
  if (kind !== "color") why = "computes colours only";
  else if (!inherits) why = "does not write tokens that do not inherit";
  else if (!rooted) why = "does not read container themes";
  else why = refuses(literal);
  const ws =
    kind === "color" ? supportOf("color", literal).filter((w) => w.feature !== "color") : [];
  if (why === undefined) {
    yield* addDerived(at.file, [...new Set(ws.map((w) => w.key))]);
    return true;
  }
  const key = `derived ${who} ${why}`;
  if (!warned.has(key)) {
    warned.add(key);
    const lacking = browsers([...new Set(ws.flatMap((w) => w.lacking))]);
    warnings.push(
      `${who}: "${literal}" stays at its static default${lacking ? ` in ${lacking}` : " in the older targets"}: the runtime for derived tokens ${why}`,
    );
  }
  return false;
});

// Whether a module whose styles use the variables `names` needs the runtime: the tokens that declare them are often not in the client.
export const usesDerived = ({ defs, themed }: RegistryState, names: Iterable<string>): boolean =>
  [...names].some(
    (n) =>
      defs.get(n)?.poly !== undefined || [...themed.values()].some((t) => t.theme?.poly?.has(n)),
  );

// The rule that carries the data of the runtime: `:root{--_derived:'{"p":[…],"b":{…},"t":[…]}'}`. `properties` are the
// property rules of the sheet (the tokens it uses), `keys` the theme entries it holds, in order. `p` are the literals a
// browser must parse for the runtime to stay idle, `b` the templates of the default theme, `t` each theme's: its
// condition, and per token its template, or 0 where the theme sets a literal. Nothing when no target needs the runtime.
export const derivedRule = Effect.fnUntraced(function* (
  properties: string[],
  keys: string[],
): Effect.fn.Return<string | undefined> {
  const { runtimes, defs, themed } = yield* Registry;
  const entry = runtimes.get(DERIVED);
  if (!entry || !(yield* needed(entry.runtime))) return;
  const used = new Set(properties.map((p) => /^@property (--[\w-]+)/.exec(p)?.[1]));
  const byKey = new Map([...themed.values()].map((t) => [t.key, t.theme]));
  const themes = keys.flatMap((k) => byKey.get(k) ?? []);
  const probes = new Set<string>();
  const base: Record<string, string> = {};
  const names = new Set<string>();
  for (const [n, d] of defs)
    if (used.has(n) && d.poly) {
      base[n] = d.template!;
      probes.add(d.poly);
      names.add(n);
    }
  for (const { poly } of themes)
    for (const [n, literal] of poly ?? [])
      if (used.has(n)) {
        probes.add(literal);
        names.add(n);
      }
  if (!names.size) return;
  const t = themes.flatMap(({ label, values, poly }) => {
    const set = Object.fromEntries(
      [...values].flatMap(([n, css]) => (names.has(n) ? [[n, poly?.has(n) ? css : 0]] : [])),
    );
    return Object.keys(set).length ? [[label, set]] : [];
  });
  const json = Formatter.formatJson({ p: [...probes], b: base, t });
  return `:root{${KEY}:'${json.replace(/[\\']/g, "\\$&")}'}`;
});
