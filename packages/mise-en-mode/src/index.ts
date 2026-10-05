// @cssints/mise-en-mode: the look layer. A look is a theme (a call member of cssints/plugin `scope()` that returns `themes`)
// set on a `data-mode` scope and resolved by the Mode Contract: the sources are the declared layers `app < author <
// viewer` (Rule 5), each variable fills from the most preferred source that sets it, and a `data-mode` value is one bare
// expression (the whole look) or `expression/aspect` fragments (Rule 4). An aspect is a top-level group of the token set
// (`color`, `typography`), and a look's overrides are split by it: each aspect is a theme whose selector matches the bare
// marker *or* its fragment. The theme path of the engine checks the overrides against the tokens, re-derives the aliases
// and shows the looks to `check.contrast`, which lays the looks of one selector over each other in layer order.
import { scope } from "cssints/plugin";

// The whole look, or one aspect: the marker or its fragment (Rule 4's `:where()` arms).
const selector = (expression: string, aspect: string) =>
  `:where([data-mode="${expression}"], [data-mode~="${expression}/${aspect}"])`;

const mise = scope("mise-en-mode", {
  "#sources": { layers: ["app", "author", "viewer"] },
  look: {
    args: [
      "$tokens",
      "<custom-ident> | <string>",
      "app | author | viewer",
      "$overrides",
      { "scope?": "$selector" },
    ],
    uses: ["sources"],
  },
}).build({
  look: (tokens, expression, source, overrides, options) => ({
    themes: Object.entries(overrides).map(([aspect, values]) => ({
      tokens,
      overrides: { [aspect]: values as object },
      selector: selector(expression.replace(/^"|"$/g, ""), aspect),
      layer: source,
      scope: options.scope,
    })),
  }),
});

/**
 * `look(tokens, expression, source, overrides, { scope? })`: the theme of one `data-mode` expression, in the layer of its
 * `source` (`"app"`, `"author"` or `"viewer"`), so a viewer's look fills over an author's over the app's, value by value.
 * `overrides` are values by token path, split by their top-level groups (aspects): `data-mode="dark"` takes every aspect,
 * `data-mode="dark/color"` only the color group. They are checked against `tokens` in the types and at build time, and
 * `check.contrast` reads them with the other looks of the expression. With `scope` the look is confined to that subtree
 * (`@scope`, Rule 7). A dotted reverse-DNS expression is quoted: `look(t, '"com.alice.midnight"', "author", { … })`. Call it
 * at a module's top level; it prints no class.
 */
// The annotation is for the declaration file: the inferred type of this member is too long for the compiler to write out.
export const look: ReturnType<typeof mise.export>["look"] = mise.export().look;
