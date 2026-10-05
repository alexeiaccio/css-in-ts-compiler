// @cssints/mise-en-mode: the look layer. A look is a theme (cssints/plugin, `Built.themes`) set on a `data-mode` scope and
// resolved by the Mode Contract: the sources are the declared layers `app < author < viewer` (Rule 5), each variable fills
// from the most preferred source that sets it, and a `data-mode` value is one bare expression (the whole look) or
// `expression/aspect` fragments (Rule 4). An aspect is a top-level group of the token set (`color`, `typography`), and a
// look's overrides are split by it: each aspect is a theme whose selector matches the bare marker *or* its fragment.
// The theme path of the engine checks the overrides against the tokens, re-derives the aliases and shows the looks to
// `check.contrast`, which lays the looks of one selector over each other in layer order.
import { style } from "cssints/plugin";

import type * as Types from "./types.ts";

const SOURCES = ["app", "author", "viewer"];

// The whole look, or one aspect: the marker or its fragment (Rule 4's `:where()` arms).
const selector = (expression: string, aspect: string) =>
  `:where([data-mode="${expression}"], [data-mode~="${expression}/${aspect}"])`;

// See types.ts. The arguments of a member are joined into one string, so the token set and the overrides are closed over,
// and only the expression goes through the grammar. A dotted reverse-DNS expression is a string: `<custom-ident>` has no dots.
export const look: typeof Types.look = (
  tokens: object,
  expression: string,
  source: string,
  overrides: object,
  options: { scope?: string } = {},
) =>
  style("<custom-ident> | <string>", (value) => ({
    decls: [],
    layers: SOURCES,
    themes: Object.entries(overrides).map(([aspect, values]) => ({
      tokens,
      overrides: { [aspect]: values as object },
      selector: selector(value.replace(/^"|"$/g, ""), aspect),
      layer: source,
      scope: options.scope,
    })),
  }))(expression) as never;
