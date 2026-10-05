// A call member that emits a global rule in a declared layer, over declarations it was given.
import { arg, scope } from "cssints/plugin";

export const { look } = scope("seam-look", {
  order: { layers: ["app", "author", "viewer"] },
  look: { args: ["<custom-ident>", "<custom-ident>", arg<Record<string, string>>()], uses: ["order"] },
}).build({
  look: (name, layer, declarations) => ({
    globals: [
      {
        css: `[data-mode="${name}"] { ${Object.entries(declarations)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ")} }`,
        layer,
      },
    ],
  }),
}).export();
