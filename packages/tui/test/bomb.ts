// The bomb.sh adapter on @bomb.sh/tty's own renderer (WASM, Node): the built styles of test/tui.mjs (out/card.mjs) in a
// frame of ops at 30x8 cells, read back as a grid of cells (characters, colours, attributes) from the ANSI output; then a
// pointer move, a press and a release (:hover, :active, the click, the OSC 22 pointer), a theme switch, focus and the
// caret, and the mapping of the layout props. Run: node test/bomb.ts (after node test/tui.mjs)
import assert from "node:assert/strict";

import { close, createTerm, fixed, grow, open, percent } from "@bomb.sh/tty";

import { createTracker, openProps, resolve, rgbaOf, setTheme, textProps } from "../src/bomb.ts";
import type { TuiShape } from "../src/index.ts";

const built = "./out/card.mjs"; // written by test/tui.mjs
const styles = (await import(built)) as Record<"button" | "label" | "field" | "layout", TuiShape>;

interface Cell {
  ch: string;
  fg: string;
  bg: string;
  attrs: Set<number>;
}
// A screen that plays the bytes bomb.sh writes: cursor moves (CUP), SGR colours and attributes, and OSC strings.
const screen = (width: number, height: number) => {
  const blank = (): Cell => ({ ch: " ", fg: "", bg: "", attrs: new Set() });
  const cells = Array.from({ length: height }, () => Array.from({ length: width }, blank));
  const oscs: string[] = [];
  let row = 0;
  let col = 0;
  let fg = "";
  let bg = "";
  let attrs = new Set<number>();
  const hex = (n: string[]) => `#${n.map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;
  const sgr = (params: string[]) => {
    for (let i = 0; i < params.length; i++) {
      const n = Number(params[i] || 0);
      if (n === 0) [fg, bg, attrs] = ["", "", new Set()];
      else if (n === 38 || n === 48) {
        const c = hex(params.slice(i + 2, i + 5));
        if (n === 38) fg = c;
        else bg = c;
        i += 4;
      } else attrs.add(n);
    }
  };
  const play = (bytes: Uint8Array) => {
    const s = new TextDecoder().decode(bytes);
    let i = 0;
    while (i < s.length) {
      const esc = s[i] === "\x1b";
      const csi = esc ? /^\[([?\d;]*)( ?[A-Za-z])/.exec(s.slice(i + 1, i + 32)) : null;
      if (csi) {
        const [all, p = "", cmd] = csi;
        if (cmd === "H") [row, col] = p.split(";").map((v) => Number(v) - 1) as [number, number];
        else if (cmd === "m") sgr(p.split(";"));
        i += 1 + all.length;
      } else if (esc && s[i + 1] === "]") {
        const end = s.indexOf("\x1b\\", i);
        oscs.push(s.slice(i + 2, end));
        i = end + 2;
      } else {
        const ch = String.fromCodePoint(s.codePointAt(i) ?? 32);
        const cell = cells[row]?.[col];
        if (cell) Object.assign(cell, { ch, fg, bg, attrs: new Set(attrs) });
        col++;
        i += ch.length;
      }
    }
  };
  const line = (r: number) => (cells[r] ?? []).map((c) => c.ch).join("");
  const at = (r: number, c: number) => cells[r]?.[c] ?? blank();
  return { play, line, at, oscs };
};

// the layout props, without a terminal
assert.deepEqual(
  openProps({
    width: "50%",
    flexGrow: 1,
    maxHeight: 10,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingLeft: 1,
    paddingTop: "10%",
    rowGap: 2,
    columnGap: 5,
    overflow: "scroll",
    position: "absolute",
    right: 1,
    top: 2,
    zIndex: 3,
    margin: 1,
  } as Parameters<typeof openProps>[0]),
  {
    layout: {
      width: percent(0.5),
      height: grow(0, 10),
      direction: "ttb",
      padding: { left: 1 },
      gap: 2,
      alignX: "right",
      alignY: "center",
    },
    clip: { horizontal: true, vertical: true },
    floating: {
      attachTo: "parent",
      attachPoints: { element: "right-top", parent: "right-top" },
      x: -1,
      y: 2,
      zIndex: 3,
    },
  },
);
// display: none is a box of no size that clips what is inside; the row direction and gap of a compiled style
assert.deepEqual(openProps(resolve(styles.layout)), {
  layout: { width: fixed(0), height: fixed(0), direction: "ltr", gap: 1 },
  clip: { horizontal: true, vertical: true },
});
assert.deepEqual(textProps(resolve(styles.label)), { color: rgbaOf("#cdd6f4"), attrs: 1 | 8 });
assert.equal(rgbaOf("#ff000080"), ((0x80 << 24) | 0xff0000) >> 0);

const term = await createTerm({ width: 30, height: 8 });
const scr = screen(30, 8);
const ui = createTracker();
const frame = () => [
  open("root", { layout: { width: grow(), height: grow(), direction: "ttb" } }),
  ui.open("button", styles.button),
  ui.text("Save", styles.label, "button"),
  close(),
  ui.open("field", styles.field, { layout: { width: fixed(10), height: fixed(1) } }),
  ui.text("ab", {}, undefined, { caret: 1 }),
  close(),
  close(),
];
const render = (x: number, y: number, down = false) => {
  const r = ui.render(term, frame, { pointer: { x, y, down } });
  scr.play(r.output);
  return r;
};

// the base style: a rounded border in its colour, the background, the label's colour and attributes
render(25, 7);
assert.equal(scr.line(0).slice(0, 12), "╭──────────╮", scr.line(0));
assert.equal(scr.line(1).slice(0, 12), "│ Save     │", scr.line(1)); // padding 0 1
assert.equal(scr.line(2).slice(0, 12), "╰──────────╯", scr.line(2));
assert.equal(scr.at(0, 0).fg, "#585b70");
assert.equal(scr.at(1, 6).bg, "#1e1e2e");
assert.equal(scr.at(1, 2).fg, "#cdd6f4");
assert.deepEqual([...scr.at(1, 2).attrs].sort(), [1, 4]); // SGR bold, underline
assert.deepEqual(ui.state("button"), { hover: false, active: false, focus: false });

// a pointer move over it: :hover in the same frame, and the OSC 22 pointer
let r = render(2, 1);
assert.ok(r.events.some((e) => e.type === "pointerenter" && e.id === "button"));
assert.equal(ui.state("button").hover, true);
assert.equal(scr.at(1, 6).bg, "#303140");
assert.equal(scr.at(0, 0).fg, "#89b4fa");
assert.equal(scr.oscs.at(-1), "22;pointer");

// a press: :active (a double border is drawn single: bomb.sh has one line), then the release is a click
render(2, 1, true);
assert.equal(ui.state("button").active, true);
assert.equal(scr.at(0, 0).ch, "┌");
r = render(2, 1);
assert.ok(r.events.some((e) => e.type === "pointerclick" && e.id === "button"));
assert.equal(ui.state("button").active, false);
assert.equal(scr.at(0, 0).ch, "╭");

// the theme: the next frame takes the light values, hover included
setTheme("light");
render(2, 1);
assert.equal(scr.at(1, 6).bg, "#f1f2f6");
assert.equal(scr.at(1, 2).fg, "#4c4f69");

// a move away: the base again, the default pointer
render(25, 7);
assert.equal(ui.state("button").hover, false);
assert.equal(scr.at(1, 6).bg, "#eff1f5");
assert.equal(scr.at(0, 0).fg, "#585b70");
assert.equal(scr.oscs.at(-1), "22;default");
setTheme("");

// focus: the :focus background, and the caret: a steady bar (DECSCUSR 6) in its colour (OSC 12)
ui.focus("field");
r = render(25, 7);
assert.equal(scr.at(3, 4).bg, "#45475a");
const out = new TextDecoder().decode(r.output);
assert.ok(out.includes("\x1b[6 q"), JSON.stringify(out));
assert.equal(scr.oscs.at(-1), "12;#f5e0dc");
ui.focus(undefined);
r = render(25, 7);
assert.ok(new TextDecoder().decode(r.output).includes("\x1b[0 q\x1b]112\x1b\\"));
assert.equal(new TextDecoder().decode(ui.reset()), "\x1b]22;default\x1b\\\x1b[0 q\x1b]112\x1b\\");
console.log("bomb ok");
