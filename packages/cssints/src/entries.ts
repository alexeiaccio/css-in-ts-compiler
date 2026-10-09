// What a module records once its sites ran: its classes, the @property rules and themes they read, the kernels, global
// rules, layers and fallback CSS of its members (the sheet's entries, one a line), and the runtimes it needs. Called
// inside the evaluation lock by the plugin (plugin.ts `clientTransform`) and by any other host of the engine.
import { Effect } from "effect";

import { DERIVED, fallbackEntries, runtimeNames } from "./delivery.ts";
import { usesDerived } from "./derived-data.ts";
import { kernelEntries } from "./kernel.ts";
import { Registry } from "./registry.ts";
import { closeNames, globalEntries, globalNames, layerEntries, themedEntries } from "./sheet.ts";

export const moduleEntries = Effect.fnUntraced(function* (id: string, sites: Map<number, string>) {
  const registry = yield* Registry;
  const { rules, properties, themed } = registry;
  const texts = [...sites.values()];
  const classes = texts.flatMap((r) =>
    [...r.matchAll(/"(_[\w-]+(?: _[\w-]+)*)"/g)].flatMap((m) => m[1]!.split(" ")),
  );
  // The tokens of the module: those its classes read, and those a site names (a token, a style). Their
  // @property rules are recorded as text, so an edit of an initial value changes what the module recorded.
  const kernels = kernelEntries(registry, id);
  const names = new Set([...texts, ...kernels].flatMap((r) => r.match(/--[\w-]+/g) ?? []));
  globalNames(themed, id).forEach((n) => names.add(n));
  for (const c of classes) rules.get(c)?.tokens?.forEach((n) => names.add(n));
  closeNames(names, registry.defs, themed);
  const entries = [
    ...classes,
    ...[...names].flatMap((n) => properties.get(n)?.css ?? []),
    ...themedEntries(themed, id, names),
    ...kernels,
    ...globalEntries(registry, id),
    ...layerEntries(registry, id),
    ...(yield* fallbackEntries(registry, id)),
  ];
  const runtimes = runtimeNames(registry, id);
  // the module that declares the tokens is often not in the client; the ones that use them are
  if (!runtimes.includes(DERIVED) && usesDerived(registry, names)) runtimes.push(DERIVED);
  return { entries, runtimes };
});
