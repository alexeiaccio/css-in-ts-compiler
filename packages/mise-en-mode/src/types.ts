// What TypeScript sees of "@cssints/mise-en-mode" (the "types" condition of package.json). The implementation (index.ts)
// runs at build time only: a look is a style that prints no class, so user code gets a class string like any member.
import type { createGlobalTheme, Overrides, Style } from "cssints";

/** The source ranking, least to most preferred (Mode Contract Rule 5). */
export type Source = "app" | "author" | "viewer";

// createGlobalTheme's own parameters: a look's overrides and scope are checked the way a theme's are.
type Theme<X extends object, O extends Overrides<X>, S extends string> = Parameters<
  typeof createGlobalTheme<X, O, S>
>;

/**
 * A look: the theme of one `data-mode` expression, in the layer of its `source`, so a viewer's look fills over an
 * author's over the app's, value by value. `overrides` are values by token path, split by their top-level groups
 * (aspects): `data-mode="dark"` takes every aspect, `data-mode="dark/color"` only the color group. They are checked
 * against `tokens` in the types and at build time, and `check.contrast` reads them with the other looks of the
 * expression. With `scope` the look is confined to that subtree (`@scope`, Rule 7). A dotted reverse-DNS expression is
 * quoted: `look(t, '"com.alice.midnight"', "author", { … })`. Call it at a module's top level; it prints no class.
 */
export declare function look<
  const X extends object,
  const O extends Overrides<X>,
  const S extends string = string,
>(
  tokens: X,
  expression: string,
  source: Source,
  overrides: Theme<X, O, S>[2],
  options?: { readonly scope?: NonNullable<Theme<X, O, S>[3]>["scope"] },
): Style;
