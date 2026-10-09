// check_contrast: the WCAG 2.x ratio as css.check.contrast computes it, from the engine itself (cssints/check).
import { contrast } from "cssints/check";
import { Effect } from "effect";

export const checkContrast = Effect.fn("mcp.checkContrast")(function* (
  foreground: string,
  background: string,
  min: number | undefined,
) {
  return yield* contrast(foreground, background).pipe(
    Effect.map(({ ratio: r, text: ratio }) => {
      if (min === undefined) return { ok: true, ratio };
      return r < min
        ? { ok: false, ratio, min, message: `contrast ${ratio} is below ${min}` }
        : { ok: true, ratio, min };
    }),
    Effect.catchTag("ContrastError", (e) =>
      Effect.succeed({ ok: false, message: `contrast is not checked: ${e.message}` }),
    ),
  );
});
