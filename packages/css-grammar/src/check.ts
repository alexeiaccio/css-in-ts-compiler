// One declaration against everything the package knows: the grammar (twin), the prose rules, and, when asked, the
// browser support warnings. `checkDeclaration` is the Effect. A build checks a few dozen declarations per module,
// so a caller that already sits inside its own Effect boundary (cssints classesOf) loops over the plain core,
// `checkDeclarationNow`, instead of paying an Effect step per declaration (over the perf budget).
import { Effect } from "effect";

import { InvalidValueError, isTwinError, RuleError, type TwinError } from "./errors.ts";
import { syntaxes } from "./mdn.ts";
import { ENTRY, type QueryKind } from "./query.ts";
import { violation } from "./rules.ts";
import { supportOf, type Warning } from "./support.ts";
import { consume, parseGrammar, valid as validCore } from "./twin-core.ts";

export type DeclarationError = TwinError | RuleError;

export const isDeclarationError = (e: unknown): e is DeclarationError =>
  isTwinError(e) || e instanceof RuleError;

// Plain core: the support warnings of `p: v` (none unless `warnings`); throws a DeclarationError.
export function checkDeclarationNow(p: string, v: string, warnings: boolean): Warning[] {
  validCore(p, v); // build-time twin of the type-level check; fails at the bad token
  const error = violation(p, v); // spec prose rules; fail like valid
  if (error) throw error;
  return warnings ? supportOf(p, v) : [];
}

/** The support warnings of `p: v` (none unless `warnings`), or why the declaration is invalid. */
export const checkDeclaration = Effect.fnUntraced(function* (
  p: string,
  v: string,
  warnings: boolean,
): Effect.fn.Return<Warning[], DeclarationError> {
  return yield* Effect.try({
    try: () => checkDeclarationNow(p, v, warnings),
    catch: (e) => {
      if (isDeclarationError(e)) return e;
      throw e; // a bug, not a user error: a defect
    },
  });
});

// The grammars take `:` and `/` as tokens of their own (query.ts): space them out, as ValidQuery does.
const spaced = (q: string) => q.replace(/[:/]/g, " $& ");

// Plain core: a query of media(), container() or supports(); throws an InvalidValueError at the furthest point it reached.
export function checkQueryNow(kind: QueryKind, q: string): void {
  const syntax: Record<string, string> = syntaxes;
  const v = spaced(q).trimStart();
  const ctx = { len: v.length, far: -1, expected: new Set<string>() };
  const rs = consume(parseGrammar(syntax[ENTRY[kind]]!), v, ctx);
  if (rs.has("")) return;
  for (const r of rs) {
    const at = v.length - r.length;
    if (at > ctx.far) Object.assign(ctx, { far: at, expected: new Set() });
    if (at === ctx.far) ctx.expected.add("end of query");
  }
  const token = /^[^ ,)]*/.exec(v.slice(ctx.far))![0];
  const expected = [...ctx.expected];
  throw new InvalidValueError({
    message: `@${kind}: ${token ? `unexpected "${token}"` : "unexpected end"} in "${q}", expected ${expected.join(" | ")}`,
    property: `@${kind}`,
    value: q,
    position: ctx.far, // in the spaced text
    expected,
  });
}

/** Twin of ValidQuery<K, S> (query.ts): the query of a media(), container() or supports() call is valid, or why not. */
export const checkQuery = Effect.fnUntraced(function* (
  kind: QueryKind,
  q: string,
): Effect.fn.Return<void, TwinError> {
  return yield* Effect.try({
    try: () => checkQueryNow(kind, q),
    catch: (e) => {
      if (isTwinError(e)) return e;
      throw e; // a bug, not a user error: a defect
    },
  });
});
