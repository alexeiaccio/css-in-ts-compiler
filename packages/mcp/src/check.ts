// check_declaration and check_support: the engine's own entry points (css-grammar check.ts and support.ts), the ones a
// build calls per declaration, so the answer is the build's message word for word.
import { checkDeclaration as checkCore } from "@cssints/css-grammar/check";
import {
  browsers,
  get,
  messageOf,
  support,
  targets,
  type Target,
} from "@cssints/css-grammar/support";
import { Data, Effect } from "effect";

/** A tool could not answer (a bad browserslist query, a file it cannot read): `message` is what the agent sees. */
export class ToolError extends Data.TaggedError("ToolError")<{ readonly message: string }> {}

// `fontSize`, `WebkitLineClamp` (a member name) or `font-size`; a custom property stays as written.
export const kebab = (p: string) =>
  p.startsWith("--") ? p : p.trim().replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export const checkDeclaration = Effect.fn("mcp.checkDeclaration")(function* (
  property: string,
  value: string,
) {
  const p = kebab(property);
  return yield* checkCore(p, value, false).pipe(
    Effect.as({ ok: true, property: p, value }),
    Effect.catch((e) => Effect.succeed({ ok: false, property: p, value, message: e.message })),
  );
});

const RULE =
  "As the build's support warnings: a BCD statement counts when it has no prefix, alternative name or flag, and a partial_implementation counts as supported. A build also drops a warning for what LightningCSS lowers for the targets (oklch() to a hex fallback): compile shows the warnings a build gives.";

export const checkSupport = Effect.fn("mcp.checkSupport")(function* (
  property: string,
  value: string | undefined,
  query: string | undefined,
) {
  const p = kebab(property);
  const v = value ?? "";
  const ts: Target[] | undefined =
    query === undefined
      ? undefined
      : yield* targets(query).pipe(Effect.mapError((e) => new ToolError({ message: e.message })));
  const all = ts ?? (yield* targets().pipe(Effect.orElseSucceed(() => [])));
  const found = yield* support(p, v, ts);
  return {
    property: p,
    ...(value === undefined ? {} : { value }),
    query: query ?? "the browserslist config found from the working directory (else defaults)",
    targets: browsers(all.map((t) => t.join(" "))),
    known: get(`css.properties.${p}`)?.__compat !== undefined,
    supported: found.length === 0,
    lacking: found.map((w) => ({
      feature: w.feature,
      key: w.key,
      targets: browsers(w.lacking),
      message: messageOf(p, v, w),
    })),
    rule: RULE,
  };
});
