// One declaration against everything the package knows: the grammar (twin), the prose rules, and, when asked, the
// browser support warnings. One Effect boundary around the plain cores, because a build checks a few dozen
// declarations per module and an Effect step for each of the three was over the perf budget.
import { Effect } from "effect";

import { isTwinError, RuleError, type TwinError } from "./errors.ts";
import { violation } from "./rules.ts";
import { supportOf, type Warning } from "./support.ts";
import { valid as validCore } from "./twin-core.ts";

export type DeclarationError = TwinError | RuleError;

const isDeclarationError = (e: unknown): e is DeclarationError => isTwinError(e) || e instanceof RuleError;

/** The support warnings of `p: v` (none unless `warnings`), or why the declaration is invalid. */
export const checkDeclaration = Effect.fnUntraced(function* (
  p: string,
  v: string,
  warnings: boolean,
): Effect.fn.Return<Warning[], DeclarationError> {
  return yield* Effect.try({
    try: () => {
      validCore(p, v); // build-time twin of the type-level check; fails at the bad token
      const error = violation(p, v); // spec prose rules; fail like valid
      if (error) throw error;
      return warnings ? supportOf(p, v) : [];
    },
    catch: (e) => {
      if (isDeclarationError(e)) return e;
      throw e; // a bug, not a user error: a defect
    },
  });
});
