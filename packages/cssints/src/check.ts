// cssints/check: the engine's own checks as functions, for tools that answer as a build would (@cssints/mcp). Node only:
// culori and LightningCSS, nothing that reaches a browser.
import { Effect } from "effect";

import { luminance, ratio, shown } from "./color.ts";
import { ContrastError } from "./errors.ts";

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
