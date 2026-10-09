// cssints/check: the engine's own checks as functions, for tools that answer as a build would (@cssints/mcp). Node only:
// culori and LightningCSS, nothing that reaches a browser.
import type { Warning } from "@cssints/css-grammar/support";
import { Effect } from "effect";

import { luminance, ratio, shown } from "./color.ts";
import { ContrastError } from "./errors.ts";
import { fallbackOf } from "./lowered.ts";

export { ContrastError } from "./errors.ts";

/**
 * The WCAG 2.x contrast ratio of two CSS colours, as `css.check.contrast` computes it: culori reads the colour, one
 * outside sRGB is clipped to it, a translucent one has no contrast. `text` is the ratio cut (not rounded) at two places,
 * as the check's message prints it.
 */
export const contrast = Effect.fn("cssints.contrast")(function* (
  foreground: string,
  background: string,
): Effect.fn.Return<{ ratio: number; text: string }, ContrastError> {
  const [f, b] = yield* Effect.sync(() => [luminance(foreground), luminance(background)] as const);
  if (f.lum === undefined)
    return yield* new ContrastError({ colour: foreground, message: `"${foreground}" ${f.why}` });
  if (b.lum === undefined)
    return yield* new ContrastError({ colour: background, message: `"${background}" ${b.why}` });
  const r = ratio(f.lum, b.lum);
  return { ratio: r, text: shown(r) };
});

/**
 * What LightningCSS makes of `property: value` for the targets of a support warning (`support()` of
 * `@cssints/css-grammar/support`), when it lowers the feature the warning is about: the value of the first declaration it
 * writes (`oklch(…)` becomes a hex), else undefined. A build drops a warning that LightningCSS lowers; an inline `style()`
 * never goes through it and keeps the warning. A custom property is `--name`.
 */
export const loweredOf = Effect.fn("cssints.loweredOf")(function* (
  property: string,
  value: string,
  warning: Warning,
): Effect.fn.Return<string | undefined> {
  return yield* Effect.sync(() => fallbackOf(property, value, warning));
});
