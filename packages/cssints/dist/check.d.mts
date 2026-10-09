import { t as ContrastError } from "./errors-D4ZbcwRo.mjs";
import { Warning } from "@cssints/css-grammar/support";
import { Effect } from "effect";
//#region src/check.d.ts
/**
 * The WCAG 2.x contrast ratio of two CSS colours, as `css.check.contrast` computes it: culori reads the colour, one
 * outside sRGB is clipped to it, a translucent one has no contrast. `text` is the ratio cut (not rounded) at two places,
 * as the check's message prints it.
 */
export declare const contrast: (foreground: string, background: string) => Effect.Effect<{
  ratio: number;
  text: string;
}, ContrastError, never>;
/**
 * What LightningCSS makes of `property: value` for the targets of a support warning (`support()` of
 * `@cssints/css-grammar/support`), when it lowers the feature the warning is about: the value of the first declaration it
 * writes (`oklch(…)` becomes a hex), else undefined. A build drops a warning that LightningCSS lowers; an inline `style()`
 * never goes through it and keeps the warning. A custom property is `--name`.
 */
export declare const loweredOf: (property: string, value: string, warning: Warning) => Effect.Effect<string | undefined, never, never>;
//#endregion
export { ContrastError };