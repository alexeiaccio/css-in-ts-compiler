// A call member that emits themes over a token set and the values it was given.
import { scope } from "cssints/plugin";

export const { modes } = scope("mem-modes", {
  order: { layers: ["app", "viewer"] },
  modes: { args: ["<custom-ident>", "$tokens", "$overrides"], uses: ["order"] },
}).build({
  modes: (name, tokens, overrides) => ({
    themes: [{ tokens, overrides, selector: `[data-mode="${name}"]`, layer: "viewer" }],
  }),
}).export();
