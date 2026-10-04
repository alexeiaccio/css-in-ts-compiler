// "cssints/mise-en-mode": the look layer. A look is a theme applied at a `data-mode` scope, resolved by the Mode Contract
// (`@layer app, author, viewer`, per-variable fill-through, exact record-key matching). It supplies the part the core token
// system does not: the source ranking and the attribute-scoped theme rule. The values come from the caller (an emitter
// produces them from its tokens); the tokens themselves stay `createTokens` / `createGlobalTheme`.
//
// Rule 4 of the contract: a `data-mode` value is either one bare expression (the whole look) or a whitespace list of
// `expression/aspect` fragments (at most one per aspect). A look's declarations are split by aspect — `--color-*` and
// `--typography-*` — and each aspect gets a rule that matches the bare marker *or* its fragment, so `data-mode="dark"`
// applies every aspect while `data-mode="dark/color"` applies only color and lets the rest inherit.
import { style } from "cssints/plugin";

/** The source ranking, least to most preferred (Mode Contract Rule 5). */
export const LAYERS = ["app", "author", "viewer"] as const;
export type Source = (typeof LAYERS)[number];

/** The aspects a look is split into, by the prefix of the custom property it sets. */
export const ASPECTS: Record<string, string> = {
  "--color-": "color",
  "--typography-": "typography",
};

// One global declares the top-level layer order; each look adds one rule per aspect in its source's layer (the sheet wraps
// it in `@layer <source>`). Globals may share custom properties (unlike kernels): that is what lets the same `--color-*`
// fill through from app to author to viewer. The layers are top-level, above cssints's own `_.k`, so a look beats the
// engine's `:root` fallbacks.
const order = {
  key: "mise-en-mode@1",
  css: `@layer ${LAYERS.join(", ")};`,
  layer: null,
};

const groupByAspect = (declarations: Record<string, string>): Map<string, [string, string][]> => {
  const groups = new Map<string, [string, string][]>();
  for (const [name, value] of Object.entries(declarations)) {
    const prefix = Object.keys(ASPECTS).find((p) => name.startsWith(p));
    const aspect = prefix ? (ASPECTS[prefix] ?? "") : "";
    const list = groups.get(aspect);
    if (list) list.push([name, value]);
    else groups.set(aspect, [[name, value]]);
  }
  return groups;
};

// The whole-look marker, or the marker plus this aspect's fragment (Rule 4's `:where()` arms).
const selector = (expression: string, aspect: string): string =>
  aspect === ""
    ? `[data-mode="${expression}"]`
    : `:where([data-mode="${expression}"], [data-mode~="${expression}/${aspect}"])`;

// A look: the theme for one `expression`, set on `[data-mode="<expression>"]` in the layer of its `source`, so a viewer's
// look fills over an author's over the app's, value by value. Its declarations are split by aspect, so a scope may take
// the whole look or one aspect (`data-mode="dark/color"`). With `scope`, the rule is confined to that subtree with
// `@scope` (Rule 7), so a foreign look cannot repaint host chrome. Call it at a module's top level (it is a side effect,
// like `css.global()`); it prints no class. `declarations` are custom properties (`--color-action-primary-background: …`).
// A dotted reverse-DNS expression is quoted at the call: `look('"com.alice.midnight"', "author", { … })`. The returned
// class string is always empty (a look prints no class).
export const look = (
  expression: string,
  source: Source,
  declarations: Record<string, string>,
  options: { scope?: string } = {},
): string =>
  style("<custom-ident> | <string>", () => ({
    decls: [],
    globals: [
      order,
      ...[...groupByAspect(declarations)].map(([aspect, decls]) => {
        const rule = `${selector(
          expression.replace(/^"|"$/g, ""),
          aspect,
        )} { ${decls.map(([name, value]) => `${name}: ${value}`).join("; ")} }`;
        return {
          key: `mise-en-mode:${source}:${expression}:${aspect || "all"}:${options.scope ?? ""}`,
          css: options.scope ? `@scope (${options.scope}) { ${rule} }` : rule,
          layer: source,
        };
      }),
    ],
  }))(expression);
