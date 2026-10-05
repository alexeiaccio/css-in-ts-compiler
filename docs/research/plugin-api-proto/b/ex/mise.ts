// @cssints/mise-en-mode: the whole package, on the public API only (peerDependency: cssints).
import { member } from "cssints/plugin";
import type { Global } from "cssints/plugin";

/** The source ranking, least to most preferred (Mode Contract Rule 5). */
export const LAYERS = ["app", "author", "viewer"] as const;
export type Source = (typeof LAYERS)[number];

/** The aspects a look is split into, by the prefix of the custom property it sets. */
export const ASPECTS: Record<string, string> = { "--color-": "color", "--typography-": "typography" };

// One global declares the top-level layer order; every look says it again and the engine keeps one (same content).
const order: Global = { css: `@layer ${LAYERS.join(", ")};`, layer: null };

const aspectOf = (name: string) => ASPECTS[Object.keys(ASPECTS).find((p) => name.startsWith(p)) ?? ""] ?? "";

const selector = (expression: string, aspect: string) =>
  aspect === ""
    ? `[data-mode="${expression}"]`
    : `:where([data-mode="${expression}"], [data-mode~="${expression}/${aspect}"])`;

/**
 * `look(tokens, expression, source, overrides, { scope? })`: the theme for one `data-mode` expression, in the layer of its
 * source (app < author < viewer), split by aspect (`data-mode="dark/color"` takes one). `overrides` are values by token
 * path, checked against the token set in the types and at build time, like `createGlobalTheme`'s. With `scope` the rule is
 * confined to that subtree (`@scope`, Rule 7). A look prints no class; call it at a module's top level.
 */
export const look = member({
  name: "look",
  args: ["@tokens", "<custom-ident> | <string>", "app | author | viewer", "@overrides", { "scope?": "<declaration-value>" }],
  emit: (_tokens, expression, source, declarations, { scope }) => {
    const groups = new Map<string, string[]>();
    for (const [name, value] of Object.entries(declarations)) {
      const aspect = aspectOf(name);
      groups.set(aspect, [...(groups.get(aspect) ?? []), `${name}: ${value}`]);
    }
    return {
      globals: [
        order,
        ...[...groups].map(([aspect, decls]): Global => {
          const rule = `${selector(expression.replace(/^"|"$/g, ""), aspect)} { ${decls.join("; ")} }`;
          return { css: scope ? `@scope (${scope}) { ${rule} }` : rule, layer: source };
        }),
      ],
    };
  },
});
