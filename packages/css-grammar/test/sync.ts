// The Effect API of src/ as plain functions, for the test scripts: a failure is thrown as the tagged error itself
// (so `e.message` is the user-facing text). Only for tests, which are not Effect programs.
import { Cause, Effect, Exit } from "effect";

import { checkQuery as checkQueryFx } from "../src/check.ts";
import { checkRules as checkRulesFx } from "../src/rules.ts";
import {
  lacking as lackingFx,
  message as messageFx,
  support as supportFx,
  type Target,
} from "../src/support.ts";
import { matches as matchesFx, parse as parseFx, valid as validFx } from "../src/twin.ts";

export { nullable, type Node } from "../src/twin.ts";

const run = <A, E>(effect: Effect.Effect<A, E>): A => {
  const exit = Effect.runSyncExit(effect);
  if (Exit.isSuccess(exit)) return exit.value;
  throw Cause.squash(exit.cause);
};

// a value of a property: a var(), env() or if() in it stands for any value
export const matches = (syntax: string, s: string) => run(matchesFx(syntax, s, true));
export const valid = (p: string, s: string) => run(validFx(p, s));
export const parse = (grammar: string) => run(parseFx(grammar));
export const checkRules = (p: string, v: string) => run(checkRulesFx(p, v));
export const support = (p: string, v: string, ts?: Target[]) => run(supportFx(p, v, ts));
export const lacking = (key: string, ts?: Target[], exact?: boolean) =>
  run(lackingFx(key, ts, exact));
export const message = (...args: Parameters<typeof messageFx>) => run(messageFx(...args));
export const checkQuery = (...args: Parameters<typeof checkQueryFx>) => run(checkQueryFx(...args));
