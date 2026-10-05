// The definitions of plugins.ts without its calls: the import floor of `cssints/plugin` and the cost of the table.
// A scope with a chain of four methods (a plugin author's module), a property, a call member,
// and 30 calls of them as user code writes them. Checked next to users.ts by `bun run bench`; plugins-defs.ts is the same
// without the calls, so what the calls cost is the difference of the two.
import { scope } from "cssints/plugin";

const length = "<length [0,∞]>" as const;
const {
  frame,
  webkitFontSmoothing: smoothing,
  icon,
} = scope("frame", {
  core: { css: "& { border-radius: var(--_r) }" },
  frame: {
    uses: ["core"],
    chain: {
      radius: { args: length, emit: (v) => [["--_r", v]] },
      padding: { args: length, spacing: true, emit: (v) => [["--_p", v]] },
      border: { args: length, emit: (v) => [["--_b", v]] },
      margin: { args: length, spacing: true, emit: (v) => [["--_m", v]] },
    },
  },
  "-webkit-font-smoothing": "auto | none | antialiased | subpixel-antialiased",
  icon: { args: "home | star | moon" },
})
  .build({ icon: (name) => ({ decls: [["--_svg", name]] }) })
  .export();
export { frame, smoothing, icon };
