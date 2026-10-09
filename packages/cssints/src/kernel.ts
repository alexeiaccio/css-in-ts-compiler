// Kernels: the global rules a style needs (markers and kernels of a style node), registered with the sheet by key.
// Kept out of sheet.ts, which reads mdn-data, because the library (macro.ts) registers them at evaluation.
import { browsers, lacking, messageOf } from "@cssints/css-grammar/support";
import { Effect, Formatter } from "effect";

import { uncovered } from "./delivery.ts";
import { MacroError } from "./errors.ts";
import {
  type At,
  type Kernel,
  type KernelWarning,
  Registry,
  type RegistryState,
  type Runtime,
  warn,
} from "./registry.ts";

// The entries of kernels start with this and a tab: `@kernel\t<json>`.
export const KERNEL = "@kernel\t";

/** The support warnings of the declarations of a kernel written as styles (scope-engine.ts), weighed by `addKernel`. */
export const kernelWarnings = new WeakMap<Kernel, readonly KernelWarning[]>();

// The custom properties a kernel declares: `--x:` in its css, `@property --x` in its atProperty.
const VARS = /(--[\w-]+)\s*:|@property\s+(--[\w-]+)/g;

/**
 * Registers a kernel by key, on first use (a global rule with atProperty: its css in _.k, its atProperty at the top
 * of the sheet, both once however many styles use it). The same key with other css, another key that declares one of
 * its custom properties, and another key for a marker it prints are build errors at `at`; a `requires` that a target
 * lacks is a support warning, unless one of `runtimes` (those of the style) polyfills it and reaches that target
 * (`uncovered`); so is a declaration of a kernel written as styles that a target lacks (`kernelWarnings`), by the same rule.
 */
export const addKernel = Effect.fnUntraced(function* (
  kernel: Kernel,
  markers: readonly (readonly [marker: string, kernel: string])[],
  at?: At,
  runtimes: readonly Runtime[] = [],
): Effect.fn.Return<void, MacroError> {
  const registry = yield* Registry;
  const { kernels } = registry;
  const fail = (message: string) => new MacroError({ message: `cssints: ${message}`, ...at });
  const { key } = kernel;
  let entry = kernels.get(key);
  if (entry) {
    const k = entry.kernel;
    if (k.css !== kernel.css || k.atProperty !== kernel.atProperty)
      return yield* fail(
        `kernel ${key} is registered twice with different CSS: a kernel that changes needs a new key (name@version)`,
      );
  } else {
    // A key that starts with `@` is an at-rule of local names (keyframes(), positionTry()): a custom property in its
    // steps is a use, not a declaration.
    const vars = key.startsWith("@")
      ? []
      : [...`${kernel.css}\n${kernel.atProperty ?? ""}`.matchAll(VARS)].map((m) => m[1] ?? m[2]!);
    for (const [other, e] of kernels) {
      const v = vars.find((x) => e.vars.includes(x));
      if (v)
        return yield* fail(
          `kernels ${other} and ${key} both declare ${v}: a plugin picks its own short custom-property names`,
        );
    }
    kernels.set(key, (entry = { kernel, vars, markers: new Set(), users: new Set() }));
    for (const r of kernel.requires ?? []) {
      const { key: feature, exact } = typeof r === "string" ? { key: r, exact: false } : r;
      const all = (yield* lacking(feature, undefined, exact)).map((t) => t.join(" "));
      const off = yield* uncovered(feature, all, runtimes);
      if (off.length)
        warn(
          registry,
          `${key} ${feature}`,
          `kernel ${key} needs ${feature}, not supported by ${browsers([...off])}${exact ? " (a partial implementation counts as lacking)" : ""}`,
          at,
        );
    }
    for (const { prop, value, warning } of kernelWarnings.get(kernel) ?? []) {
      const off = yield* uncovered(warning.key, warning.lacking, runtimes);
      // the key of a user's declaration of the same feature, unless a runtime covers some of the targets
      const w = `${prop} ${warning.key}${off.length < warning.lacking.length ? ` ${off.join()}` : ""}`;
      if (off.length)
        warn(registry, w, messageOf(prop, value, { ...warning, lacking: [...off] }), at);
    }
  }
  if (at) entry.users.add(at.file);
  for (const [marker, owner] of markers) {
    if (owner !== key) continue;
    for (const [other, e] of kernels)
      if (other !== key && e.markers.has(marker))
        return yield* fail(`kernels ${other} and ${key} both print the marker ${marker}`);
    entry.markers.add(marker);
  }
});

// What a module records of kernels: those its styles use. One line each (JSON has no newline), so the sheet needs no
// registry.
export const kernelEntries = ({ kernels }: RegistryState, file: string): string[] =>
  [...kernels.values()].flatMap((e) =>
    e.users.has(file) ? [`${KERNEL}${Formatter.formatJson(e.kernel)}`] : [],
  );
