// One declaration against everything the package knows: the grammar (twin), the prose rules, and, when asked, the
// browser support warnings. `checkDeclaration` is the Effect. A build checks a few dozen declarations per module,
// so a caller that already sits inside its own Effect boundary (cssints classesOf) loops over the plain core,
// `checkDeclarationNow`, instead of paying an Effect step per declaration (over the perf budget).
import { Effect } from "effect";

import { isTwinError, RuleError, type TwinError } from "./errors.ts";
import { violation } from "./rules.ts";
import { supportOf, type Warning } from "./support.ts";
import { valid as validCore } from "./twin-core.ts";

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
