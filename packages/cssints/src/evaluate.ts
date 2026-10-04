// Evaluate (client environment): run an instrumented module in the Vite Module Runner, one at a time, with a
// timeout and typed errors.
import { fileURLToPath } from "node:url";

import { Effect, Predicate, Semaphore } from "effect";
import { Window } from "happy-dom";
import {
  ESModulesEvaluator,
  type EvaluatedModuleNode,
  type EvaluatedModules,
  type ModuleRunner,
  type ModuleRunnerContext,
  ssrModuleExportsKey,
} from "vite/module-runner";

import { verifyChecks } from "./contrast.ts";
import { EvalError, MacroError, MemberError } from "./errors.ts";
import { forget, Registry, type RegistryState } from "./registry.ts";

// Same as Vite's ESModulesEvaluator, but every happy-dom global that Node lacks (document, window,
// HTMLElement, ...) is a closure binding around the module body. The real globalThis stays DOM-free,
// so Vite, externalized deps and the app's own SSR never see a browser. The wrapper keeps the same
// line padding as upstream, so the inherited startOffset (stack trace mapping) stays valid.
//
// A class because Vite asks for one (`evaluator`): the runner calls it, not a program of ours.
export class DomEvaluator extends ESModulesEvaluator {
  win = Object.assign(new Window(), { __jsx: () => null });
  names: string[] = Object.getOwnPropertyNames(this.win).filter((k) => !Reflect.has(globalThis, k));
  // @effect-diagnostics-next-line asyncFunction:off -- the evaluator interface of Vite returns a Promise
  override async runInlinedModule(context: ModuleRunnerContext, code: string): Promise<void> {
    const keys = Object.keys(context);
    // oxlint-disable-next-line typescript/no-implied-eval -- the module body is the point: it runs as a function
    const fn = new Function(
      ...this.names,
      `return async function (${keys.join(",")}) {"use strict";\n${code}\n}`,
    ) as (...globals: unknown[]) => (...values: unknown[]) => Promise<void>;
    const globals = this.win as unknown as Record<string, unknown>;
    const values = context as unknown as Record<string, unknown>;
    await fn(...this.names.map((k) => globals[k]))(...keys.map((k) => values[k]));
    Object.seal(context[ssrModuleExportsKey]);
  }
}

// One evaluation at a time, each from a runner cleared of app modules: no transform joins another's fetch of
// an older source or reuses exports computed from one, and no other evaluation touches the registry meanwhile.
// Process-global, like the registry. Invariants and interleavings: spec/runner.qnt.
const evalLock = Semaphore.makeUnsafe(1);

// Drops every app module from the runner; keeps the library (index.ts and all it imports: css-grammar). The
// library imports no app module, so its exports never depend on app sources, and the model (runner.qnt) has
// no library. Re-evaluating it cost ~60% of every evaluation (docs/research/engine-cost.md). A library file
// the ssr graph invalidates still comes back fresh: the runner's cached fetch returns new code.
const LIB = fileURLToPath(new URL("./index.ts", import.meta.url));
const clearApp = ({ idToModuleMap, urlToIdModuleMap, fileToModulesMap }: EvaluatedModules) => {
  const lib = new Set<EvaluatedModuleNode>();
  const walk = (m: EvaluatedModuleNode | undefined) => {
    if (!m || lib.has(m)) return;
    lib.add(m);
    m.imports.forEach((id) => walk(idToModuleMap.get(id)));
  };
  walk(idToModuleMap.get(LIB));
  for (const map of [idToModuleMap, urlToIdModuleMap])
    for (const [k, m] of map) if (!lib.has(m)) map.delete(k);
  for (const [k, ms] of fileToModulesMap)
    for (const m of ms) if (!lib.has(m) && ms.delete(m) && !ms.size) fileToModulesMap.delete(k);
};

const isMacroError = (e: unknown): e is MacroError => Predicate.isTagged(e, "MacroError");
const isMemberError = (e: unknown): e is MemberError => Predicate.isTagged(e, "MemberError");

// What came out of runner.import. The runner has its own copy of errors.ts, so a MacroError from the library is
// recognized by its tag and rebuilt here with the same fields; anything else is the module's own failure.
// A ReferenceError while a site's arguments run (`__at` set, `__site` not reached yet) is a value that exists only at
// runtime: a parameter, a prop, a block-scoped variable.
const failureOf = (id: string, registry: RegistryState) => (e: unknown) => {
  if (isMacroError(e))
    return new MacroError({
      message: e.message,
      file: e.file,
      site: e.site,
      offset: e.offset,
      cause: e.cause,
    });
  if (isMemberError(e))
    return new MemberError({
      message: e.message,
      pluginName: e.pluginName,
      file: e.file,
      site: e.site,
      offset: e.offset,
      cause: e.cause,
    });
  const at = registry.at;
  const name =
    at && e instanceof ReferenceError ? /^(\S+) is not defined$/.exec(e.message)?.[1] : undefined;
  return name
    ? new MacroError({
        message: `cssints: css arguments must be known at build time: \`${name}\` is not defined where the call is evaluated (a parameter, a prop or state). Use cx(on && p(4)), a cv variant, or a token in a style prop`,
        cause: e,
        ...at,
      })
    : new EvalError({ file: id, message: e instanceof Error ? e.message : String(e), cause: e });
};

const evaluateModule = Effect.fnUntraced(function* (
  runner: ModuleRunner,
  id: string,
): Effect.fn.Return<Map<number, string>, MacroError | MemberError | EvalError> {
  const registry = yield* Registry;
  registry.sites.delete(id);
  forget(id);
  registry.at = undefined;
  registry.gen++;
  clearApp(runner.evaluatedModules);
  yield* Effect.tryPromise({
    try: () =>
      runner.import<{ __cssints_hoisted?: () => void }>(id).then((m) => m.__cssints_hoisted?.()),
    catch: failureOf(id, registry),
  }).pipe(
    Effect.withSpan("cssints.runner.import", { attributes: { file: id } }),
    Effect.timeoutOrElse({
      duration: "30 seconds",
      orElse: () =>
        Effect.fail(
          new EvalError({
            file: id,
            message: `cssints: evaluating ${id} took more than 30 seconds`,
          }),
        ),
    }),
  );
  // contrast checks, once the module and what it imports have made their themes
  yield* verifyChecks((c) => c.gen === registry.gen);
  return registry.sites.get(id) ?? new Map();
});

/** Evaluates `id` and runs `whileLocked` on its sites before the next evaluation may start (runner.qnt `rules`). */
export const evaluate = Effect.fn("cssints.evaluate")(function* <A, E>(
  runner: ModuleRunner,
  id: string,
  whileLocked: (sites: Map<number, string>) => Effect.Effect<A, E>,
): Effect.fn.Return<A, E | MacroError | MemberError | EvalError> {
  return yield* evalLock.withPermit(evaluateModule(runner, id).pipe(Effect.flatMap(whileLocked)));
});
