import { scope } from "cssints/plugin";

declare const checkSelector: (s: string) => void;
const ASPECTS = ["color", "typography"];
const bare = (e: string) => e.replace(/^"|"$/g, "");
const fragment = (e: string, aspect: string) =>
  aspect === ""
    ? `[data-mode="${e}"]`
    : `:where([data-mode="${e}"], [data-mode~="${e}/${aspect}"])`;

export const modes = scope("mise-en-mode", {
    source: "app | author | viewer",
    expression: "<custom-ident> | <string>",
    selector: "<declaration-value>",
    layers: { rule: "@layer app, author, viewer;", layer: null },
    look: {
      args: {
        tokens: "$tokens",
        expression: "<expression>",
        source: "<source>",
        values: "$overrides",
        "scope?": "<selector>",
      },
      uses: ["layers"],
    },
}).build({
    look: ({ tokens, expression, source, values: overrides, scope: contain }) => {
      if (contain) checkSelector(contain);
      const groups = new Map<string, Record<string, unknown>>();
      for (const [group, values] of Object.entries(overrides)) {
        const aspect = ASPECTS.includes(group) ? group : "";
        groups.set(aspect, { ...groups.get(aspect), [group]: values });
      }
      return {
        themes: [...groups].map(([aspect, part]) => ({
          tokens,
          overrides: part,
          selector: fragment(bare(expression), aspect),
          layer: source,
          scope: contain,
        })),
      };
    },
  });
export const { look } = modes.export();
