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
  "-webkit-font-smoothing": "auto | none | antialiased | subpixel-antialiased",
  icon: { args: "home | star | moon" },
}).build({ icon: (name) => ({ decls: [["--_svg", name]] }) });
export const { frame, webkitFontSmoothing: smoothing, icon } = plugin.export();

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
];
