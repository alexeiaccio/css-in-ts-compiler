// Kernels: the global rules a style needs (markers and kernels of a style node), registered with the sheet by key.
// Kept out of sheet.ts, which reads mdn-data, because the library (macro.ts) registers them at evaluation.
import { browsers, lacking } from "@cssints/css-grammar/support";
import { Effect } from "effect";

import { MacroError } from "./errors.ts";
import { type At, type Kernel, Registry, type RegistryState } from "./registry.ts";

// The entries of kernels start with this and a tab: `@kernel\t<json>`.
export const KERNEL = "@kernel\t";

// The custom properties a kernel declares: `--x:` in its css, `@property --x` in its atProperty.
const VARS = /(--[\w-]+)\s*:|@property\s+(--[\w-]+)/g;

/**
 * Registers a kernel by key, on first use (a global rule with atProperty: its css in _.k, its atProperty at the top
 * of the sheet, both once however many styles use it). The same key with other css, another key that declares one of
 * its custom properties, and another key for a marker it prints are build errors at `at`; a `requires` that a target
 * lacks is a support warning.
 */
export const addKernel = Effect.fnUntraced(function* (
  kernel: Kernel,
  markers: readonly (readonly [marker: string, kernel: string])[],
  at?: At,
): Effect.fn.Return<void, MacroError> {
  const { kernels, warnings, warned } = yield* Registry;
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
    for (const feature of kernel.requires ?? []) {
      const off = yield* lacking(feature);
      const w = `${key} ${feature}`;
      if (off.length && !warned.has(w)) {
        warned.add(w);
        warnings.push(
          `kernel ${key} needs ${feature}, not supported by ${browsers(off.map((t) => t.join(" ")))}`,
        );
      }
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
  [...kernels.values()]
    .filter((e) => e.users.has(file))
    .map((e) => `${KERNEL}${JSON.stringify(e.kernel)}`);
