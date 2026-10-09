// check_declaration and check_support: the engine's own entry points (css-grammar check.ts and support.ts, cssints/check
// loweredOf), the ones a build calls per declaration, so the answer is the build's message word for word.
import { checkDeclaration as checkCore } from "@cssints/css-grammar/check";
import {
  browsers,
  get,
  messageOf,
  support,
  targets,
  type Target,
} from "@cssints/css-grammar/support";
import { resolve } from "node:path";

import { loweredOf } from "cssints/check";
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
  "As the build's support warnings: a BCD statement counts when it has no prefix, alternative name or flag, and a partial_implementation counts as supported. What LightningCSS lowers for the lacking targets (oklch() to a hex fallback) is supported through it, as a build drops that warning: `lowered` holds what it writes. An inline style() never goes through LightningCSS and keeps the warning.";

export const checkSupport = Effect.fn("mcp.checkSupport")(function* (
  property: string,
  value: string | undefined,
  query: string | undefined,
  root: string | undefined,
) {
  const p = kebab(property);
  const v = value ?? "";
  const from = resolve(root ?? process.cwd());
  // a query, else the project's config, as the plugin reads it from its Vite root
  const ts: Target[] = yield* targets(query, from).pipe(
    Effect.mapError((e) => new ToolError({ message: e.message })),
  );
  const found = [];
  for (const w of yield* support(p, v, ts))
    found.push({ ...w, lowered: value === undefined ? undefined : yield* loweredOf(p, v, w) });
  const lacking = found.filter((w) => w.lowered === undefined);
  return {
    property: p,
    ...(value === undefined ? {} : { value }),
    query: query ?? `the browserslist config found from ${from} (else defaults)`,
    targets: browsers(ts.map((t) => t.join(" "))),
    known: get(`css.properties.${p}`)?.__compat !== undefined,
    supported: lacking.length === 0,
    lacking: lacking.map((w) => ({
      feature: w.feature,
      key: w.key,
      targets: browsers(w.lacking),
      message: messageOf(p, v, w),
    })),
    lowered: found.flatMap((w) =>
      w.lowered === undefined
        ? []
        : [{ feature: w.feature, key: w.key, targets: browsers(w.lacking), value: w.lowered }],
    ),
    rule: RULE,
  };
});
