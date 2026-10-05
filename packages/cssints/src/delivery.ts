// Runtime delivery (docs/research/plugins.md §5): a client module whose sites carry a member with a `runtime` imports
// `virtual:cssints/runtime/<name>`; what that module holds is decided from the runtime and the targets, never from use.
import { lacking, type Target } from "@cssints/css-grammar/support";
import { Effect, Formatter } from "effect";

import { MemberError } from "./errors.ts";
import type { BcdKey } from "./author-types.ts";
import { type At, type Plug, Registry, type RegistryState, type Runtime } from "./registry.ts";

/** The name of the runtime of derived tokens (derived.ts): not a plugin's, the engine registers it (derived-data.ts). */
export const DERIVED = "derived";

export const RUNTIME_ID = "virtual:cssints/runtime/";

// The entries of fallback rules start with this and a tab: `@fallback\t<json of the css>` (one line, like kernels).
export const FALLBACK = "@fallback\t";

/** Registers the runtime of a member by plugin name, with the file that uses it. The same name with another runtime is an error. */
export const addRuntime = Effect.fnUntraced(function* (
  { name, runtime }: Plug,
  at?: At,
): Effect.fn.Return<void, MemberError> {
  const { runtimes } = yield* Registry;
  const entry = runtimes.get(name);
  if (
    entry &&
    entry.runtime !== runtime &&
    Formatter.formatJson(entry.runtime) !== Formatter.formatJson(runtime)
  )
    return yield* new MemberError({
      message: `cssints: ${name}: its runtime is registered twice with a different definition`,
      pluginName: name,
      ...at,
    });
  const e = entry ?? { runtime: runtime!, users: new Set<string>() };
  runtimes.set(name, e);
  if (at) e.users.add(at.file);
});

/** Registers the runtime of derived tokens for the file that declares them; the features its literals need add up across calls. */
export const addDerived = Effect.fnUntraced(function* (
  file: string,
  keys: string[],
): Effect.fn.Return<void> {
  const { runtimes } = yield* Registry;
  const e = runtimes.get(DERIVED) ?? { runtime: { polyfills: [] }, users: new Set<string>() };
  e.runtime = { polyfills: [...new Set([...e.runtime.polyfills, ...keys])] as BcdKey[] };
  e.users.add(file);
  runtimes.set(DERIVED, e);
});

/**
 * Whether a target needs the runtime: it lacks a feature in `polyfills` and has `@property`, which the runtime stands
 * on (a target without it gets nothing from a polyfill).
 */
export const needed = Effect.fnUntraced(function* (
  { polyfills }: Runtime,
  ts?: Target[],
): Effect.fn.Return<boolean> {
  const noProperty = new Set((yield* lacking("css.at-rules.property", ts)).map((t) => t.join(" ")));
  for (const key of polyfills)
    for (const t of yield* lacking(key, ts)) if (!noProperty.has(t.join(" "))) return true;
  return false;
});

// The plugins whose runtime the styles of `file` use.
export const runtimeNames = ({ runtimes }: RegistryState, file: string): string[] =>
  [...runtimes].flatMap(([name, e]) => (e.users.has(file) ? [name] : []));

/** What a module records of fallback CSS: that of the runtimes it uses, when the targets need them. */
export const fallbackEntries = Effect.fnUntraced(function* (
  { runtimes }: RegistryState,
  file: string,
): Effect.fn.Return<string[]> {
  const out: string[] = [];
  for (const e of runtimes.values()) {
    const { css } = e.runtime;
    if (css && e.users.has(file) && (yield* needed(e.runtime)))
      out.push(`${FALLBACK}${Formatter.formatJson(css)}`);
  }
  return out;
});

/** The text of `virtual:cssints/runtime/<name>`: nothing, or the shared engine configured with the runtime's families (derived tokens: their runtime). */
export const runtimeModule = Effect.fnUntraced(function* (name: string): Effect.fn.Return<string> {
  const { runtimes } = yield* Registry;
  const runtime = runtimes.get(name)?.runtime;
  if (name === DERIVED && runtime && (yield* needed(runtime)))
    return `import derived from "cssints/derived";\nderived();\n`;
  if (!runtime || !runtime.parentVars?.length || !(yield* needed(runtime))) return "export {};";
  return `import parentVars from "cssints/parent-vars";\nparentVars(${Formatter.formatJson(runtime.parentVars)});\n`;
});
