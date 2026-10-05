import { scope } from "cssints/plugin";

const plugin = scope("frame", {
  length: "<length [0,∞]>",
  core: { css: "&{border-radius:var(--_r)}" },
  frame: {
    uses: ["core"],
    chain: {
      radius: { args: "<length>", emit: (v) => [["--_r", v]] },
      padding: { args: "<length>", spacing: true, emit: (v) => [["--_p", v]] },
      border: { args: "<length>", emit: (v) => [["--_b", v]] },
      margin: { args: "<length>", spacing: true, emit: (v) => [["--_m", v]] },
    },
  },
});
export const { frame } = plugin.export();

