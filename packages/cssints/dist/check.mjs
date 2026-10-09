import { s as ContrastError } from "./registry-n9JCX4pl.mjs";
import { t as fallbackOf } from "./lowered-CeoXbm0P.mjs";
import { n as ratio, r as shown, t as luminance } from "./color-BaPGO-sk.mjs";
import { Effect } from "effect";
//#region src/check.ts
/**
* The WCAG 2.x contrast ratio of two CSS colours, as `css.check.contrast` computes it: culori reads the colour, one
* outside sRGB is clipped to it, a translucent one has no contrast. `text` is the ratio cut (not rounded) at two places,
* as the check's message prints it.
*/
const contrast = Effect.fn("cssints.contrast")(function* (foreground, background) {
	const [f, b] = yield* Effect.sync(() => [luminance(foreground), luminance(background)]);
	if (f.lum === void 0) return yield* new ContrastError({
		colour: foreground,
		message: `"${foreground}" ${f.why}`
	});
	if (b.lum === void 0) return yield* new ContrastError({
		colour: background,
		message: `"${background}" ${b.why}`
	});
	const r = ratio(f.lum, b.lum);
	return {
		ratio: r,
		text: shown(r)
	};
});
/**
* What LightningCSS makes of `property: value` for the targets of a support warning (`support()` of
* `@cssints/css-grammar/support`), when it lowers the feature the warning is about: the value of the first declaration it
* writes (`oklch(…)` becomes a hex), else undefined. A build drops a warning that LightningCSS lowers; an inline `style()`
* never goes through it and keeps the warning. A custom property is `--name`.
*/
const loweredOf = Effect.fn("cssints.loweredOf")(function* (property, value, warning) {
	return yield* Effect.sync(() => fallbackOf(property, value, warning));
});
//#endregion
export { ContrastError, contrast, loweredOf };
