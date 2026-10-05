// (c) @cssints/mise-en-mode: the look layer, all of it, on the public API. A look is a theme (createGlobalTheme) at a
// `data-mode` selector, in a declared layer, optionally in an @scope. The tokens are the caller's, the declarations are
// the overrides of a theme (checked against them), and an aspect is a top-level group of the token tree.
import { plugin } from "cssints/plugin";
import type { Overrides, Themed } from "cssints";
import type { Css } from "cssints/plugin";

const p = plugin("mise-en-mode");

/** The source ranking, least to most preferred (Mode Contract Rule 5). */
export const LAYERS = ["app", "author", "viewer"] as const;
export type Source = (typeof LAYERS)[number];

/** The aspects of a look: the groups of the token tree that `data-mode="expression/aspect"` can take alone. */
const ASPECTS: readonly string[] = ["color", "typography"];

// Rule 4: the bare marker, or the marker with this aspect's fragment. The expression is quoted for the attribute.
const quoted = (expression: string): string => expression.replace(/["\\]/g, "\\$&");
const selector = (expression: string, aspect?: string): string => {
  const e = quoted(expression);
  return aspect === undefined
    ? `[data-mode="${e}"]`
    : `:where([data-mode="${e}"], [data-mode~="${e}/${aspect}"])`;
};

export interface LookOptions {
  /** Rule 7: confine the look to a subtree (`@scope (article.post)`). */
  scope?: string;
}

/**
 * `look(t, "dark", "app", { color: { bg: "#0b0b0f" } })`: the theme for one `expression`, in the layer of its `source`
 * (a viewer's fills over an author's over the app's, value by value). A dotted reverse-DNS expression is plain:
 * `look(t, "com.alice.midnight", "author", { … })`. It prints no class.
 */
export const look = p.member(
  <const T extends object, const O extends Overrides<T>>(
    css: Css,
    tokens: T,
    expression: string,
    source: Source,
    overrides: Themed<T, O>,
    options: LookOptions = {},
  ): void => {
    const layer = css.layers(...LAYERS)[source];
    const { scope } = options;
    const rest: Record<string, unknown> = {};
    for (const [group, values] of Object.entries(overrides)) {
      if (ASPECTS.includes(group))
        css.createGlobalTheme(tokens, selector(expression, group), { [group]: values } as never, {
          layer,
          scope,
        });
      else rest[group] = values;
    }
    if (Object.keys(rest).length)
      css.createGlobalTheme(tokens, selector(expression), rest as never, { layer, scope });
  },
);
