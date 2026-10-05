// The cost of plugin calls: a scope with a chain of four methods (a plugin author's module), a property, a call member, a value member,
// and 32 calls of them as user code writes them. Checked next to users.ts by `bun run bench`; plugins-defs.ts is the same
// without the calls, so what the calls cost is the difference of the two.
import { scope } from "cssints/plugin";

const length = "<length [0,∞]>" as const;
const {
  frame,
  webkitFontSmoothing: smoothing,
  icon,
  step,
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
  step: { args: "<number>", value: ([n]) => `${Number(n) * 4}px` },
})
  .build({ icon: (name) => ({ decls: [["--_svg", name]] }) })
  .export();
export { frame, smoothing, icon, step };

export const calls = [
  frame().radius("8px"),
  frame().radius("1rem").padding(4),
  frame().radius("calc(1rem + 2px)").padding("0.5rem").border("1px"),
  frame().padding(2).margin(1).radius("4px").border("2px"),
  frame().border("1px"),
  frame().margin("1rem"),
  frame().margin(2).padding(2),
  frame().radius("0"),
  frame().radius("1em").border("1px").margin(1),
  frame().padding(1).radius("2px"),
  frame().radius("8px").padding(4),
  frame().radius("1rem").padding(4).border("1px").margin(2),
  frame().radius("50px").padding(1),
  frame().border("3px").radius("6px"),
  frame().margin(4).border("1px"),
  smoothing("antialiased"),
  smoothing("auto"),
  smoothing("none"),
  smoothing("subpixel-antialiased"),
  icon("home"),
  icon("star"),
  icon("moon"),
  frame().radius("12px").padding(3),
  frame().radius("16px").padding(5),
  frame().radius("2rem").padding(6),
  frame().radius("2px"),
  frame().padding(8),
  frame().margin("0.25rem"),
  smoothing("antialiased"),
  icon("home"),
  step(10),
  step(1),
];
