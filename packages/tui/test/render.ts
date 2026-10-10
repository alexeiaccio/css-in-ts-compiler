// The OpenTUI adapter on OpenTUI's test renderer (Bun): the built styles of test/tui.mjs (out/card.mjs) on a box and a
// text, then a simulated mouse over, press, out, a theme switch and focus, read back from the renderables, the frame and
// the mouse pointer; then the system theme on a fake terminal. Run: bun test/render.ts (after node test/tui.mjs)
import assert from "node:assert/strict";
import { once } from "node:events";
import { Readable } from "node:stream";
import { setTimeout as sleep } from "node:timers/promises";

import {
  BoxRenderable,
  InputRenderable,
  type RGBA,
  rgbToHex,
  TextNodeRenderable,
  TextRenderable,
} from "@opentui/core";
import { createTestRenderer } from "@opentui/core/testing";

import type { TuiShape } from "../src/index.ts";
import { attach, followSystemTheme, props, reportOf, setTheme, use } from "../src/opentui.ts";
import { contrast, createSystemTheme } from "../src/system.ts";

const built = "./out/card.mjs"; // written by test/tui.mjs
const styles = (await import(built)) as Record<"button" | "label" | "field" | "row", TuiShape>;

const hex = (c: RGBA) => rgbToHex(c).slice(0, 7);

const setup = await createTestRenderer({ width: 30, height: 12 });
const { renderer, mockMouse, renderOnce, captureCharFrame, captureSpans } = setup;
// the colours drawn at a cell
const drawn = (x: number, y: number) => {
  let col = 0;
  for (const span of captureSpans().lines[y].spans) {
    if (x < col + span.width) return { fg: hex(span.fg), bg: hex(span.bg) };
    col += span.width;
  }
  throw new Error(`no cell at ${x}, ${y}`);
};
const pointers: string[] = [];
const setPointer = renderer.setMousePointer.bind(renderer);
renderer.setMousePointer = (s) => {
  pointers.push(s);
  setPointer(s);
};
try {
  const box = attach(new BoxRenderable(renderer, { id: "button" }), styles.button);
  const label = new TextRenderable(renderer, { content: "Save" });
  // as Solid does with a spread: the ref is called with the renderable before its first frame
  use(styles.label).ref(label);
  box.add(label);
  let own = 0;
  box.onMouseOver = () => own++;
  renderer.root.add(box);
  await renderOnce();

  // the base style: a rounded border, cells, the colours
  const frame = captureCharFrame();
  assert.ok(frame.includes("╭──────────╮"), frame);
  assert.ok(frame.includes("Save"), frame);
  assert.equal(box.width, 12);
  assert.equal(box.height, 3);
  assert.equal(hex(box.backgroundColor), "#1e1e2e");
  assert.equal(hex(box.borderColor), "#585b70");
  assert.equal(hex(label.fg), "#cdd6f4");
  assert.equal(label.attributes, 1 | 8); // bold, underline

  // over: the :hover colours and the pointer; the user's own handler still runs
  await mockMouse.moveTo(box.x + 2, box.y + 1);
  await renderOnce();
  assert.equal(hex(box.backgroundColor), "#303140");
  assert.equal(hex(box.borderColor), "#89b4fa");
  assert.equal(pointers.at(-1), "pointer");
  assert.ok(own > 0);
  // down: :active, a double border
  await mockMouse.pressDown(box.x + 2, box.y + 1);
  await renderOnce();
  assert.equal(box.borderStyle, "double");
  assert.ok(captureCharFrame().includes("╔══════════╗"), captureCharFrame());
  await mockMouse.release(box.x + 2, box.y + 1);
  await renderOnce();
  assert.equal(box.borderStyle, "rounded");

  // the theme: every attached renderable takes the light values, hover included
  setTheme("light");
  await renderOnce();
  assert.equal(hex(box.backgroundColor), "#f1f2f6");
  assert.equal(hex(label.fg), "#4c4f69");

  // out: the base again, and the default pointer
  await mockMouse.moveTo(25, 7);
  await renderOnce();
  assert.equal(hex(box.backgroundColor), "#eff1f5");
  assert.equal(hex(box.borderColor), "#585b70");
  assert.equal(pointers.at(-1), "default");
  setTheme("");
  await renderOnce();
  assert.equal(hex(box.backgroundColor), "#1e1e2e");

  // focus: the :focus background and the caret of an editable
  const input = attach(
    new InputRenderable(renderer, { position: "absolute", top: 5, width: 20 }),
    styles.field,
  );
  renderer.root.add(input);
  await renderOnce();
  assert.deepEqual(input.cursorStyle, { style: "line", blinking: false });
  assert.equal(hex(input.cursorColor), "#f5e0dc");
  input.focus();
  await renderOnce();
  assert.equal(hex(input.backgroundColor), "#45475a");
  // as drawn: an editable draws focusedBackgroundColor while it has the focus (cssints-pkpg)
  assert.equal(drawn(input.x, input.y).bg, "#45475a");
  input.blur();
  await renderOnce();
  assert.notEqual(hex(input.backgroundColor), "#45475a");
  assert.notEqual(drawn(input.x, input.y).bg, "#45475a");

  // a focused box draws focusedBorderColor: the adapter keeps it on the :focus border colour, theme included
  // (cssints-pkpg; OpenTUI's own is #00aaff)
  const row = attach(
    new BoxRenderable(renderer, { position: "absolute", top: 8, focusable: true }),
    styles.row,
  );
  renderer.root.add(row);
  await renderOnce();
  assert.equal(drawn(row.x, row.y + 1).fg, "#585b70");
  row.focus();
  await renderOnce();
  assert.equal(drawn(row.x, row.y + 1).fg, "#89b4fa");
  setTheme("light");
  await renderOnce();
  assert.equal(drawn(row.x, row.y + 1).fg, "#1e66f5");
  setTheme("");
  row.blur();
  await renderOnce();
  assert.equal(drawn(row.x, row.y + 1).fg, "#585b70");

  // a text node (<span>, <a>: no mouse events, no focus): the props and the theme (cssints-5vnf)
  const line = new TextRenderable(renderer, { position: "absolute", top: 3, content: "" });
  const link = new TextNodeRenderable({});
  link.add("Link");
  use(styles.label).ref(link);
  line.add(link);
  renderer.root.add(line);
  await renderOnce();
  assert.equal(link.attributes, 1 | 8);
  assert.equal(drawn(line.x, line.y).fg, "#cdd6f4");
  setTheme("light");
  await renderOnce();
  assert.equal(drawn(line.x, line.y).fg, "#4c4f69");
  setTheme("");
  await renderOnce();
  assert.equal(drawn(line.x, line.y).fg, "#cdd6f4");
  // as @opentui/solid removes it: the theme no longer reaches it
  line.remove(link);
  link.destroyRecursively();
  setTheme("light");
  assert.equal(hex(link.fg!), "#cdd6f4");
  setTheme("");
  console.log("render ok");
} finally {
  renderer.destroy();
}

// ---- the system theme: a renderer on a fake terminal that answers OSC 4, 10 and 11, and a change to a light palette
const stdin = Object.assign(new Readable({ read() {} }), { isTTY: true, setRawMode: () => {} });
const sys = await createTestRenderer({ width: 30, height: 4, stdin: stdin as never });
let colours = {
  fg: "#ebdbb2",
  bg: "#282828",
  ansi: "#282828 #cc241d #98971a #d79921 #458588 #b16286 #689d6a #a89984 #928374 #fb4934 #b8bb26 #fabd2f #83a598 #d3869b #8ec07c #ebdbb2".split(
    " ",
  ),
};
const answer = (n: string) => {
  const c = n === "10" ? colours.fg : n === "11" ? colours.bg : colours.ansi[Number(n.slice(2))];
  return c ? `\x1b]${n};rgb:${c.slice(1, 3)}/${c.slice(3, 5)}/${c.slice(5, 7)}\x07` : "";
};
const reply = (text: string) => {
  let out = "";
  // oxlint-disable-next-line no-control-regex
  for (const [, n] of text.matchAll(/\x1b\](10|11|4;\d+);\?/g)) out += answer(n);
  if (out) setTimeout(() => stdin.emit("data", Buffer.from(out)), 1);
};
const host = sys.renderer as unknown as {
  writeOut: (chunk: unknown, ...rest: unknown[]) => boolean;
};
const writeOut = host.writeOut.bind(sys.renderer);
host.writeOut = (chunk, ...rest) => {
  reply(String(chunk));
  return writeOut(chunk, ...rest);
};
try {
  const t = {
    color: { bg: "var(--color-bg)", text: "var(--color-text)", error: "var(--color-error)" },
  };
  const panels = [t.color.bg];
  const theme = createSystemTheme(t, {
    color: {
      bg: { surface: true },
      text: { hue: "fg", on: panels, contrast: 7 },
      error: { hue: "red", on: panels, contrast: 4.5 },
    },
  });
  const style = {
    color: "#ffffff",
    backgroundColor: "#000000",
    vars: { color: "color-error", backgroundColor: "color-bg" },
  } as TuiShape;
  const text = attach(new TextRenderable(sys.renderer, { content: "error" }), style);
  sys.renderer.root.add(text);
  // nothing reported yet: the terminal's own colours, by index
  const onMode = once(sys.renderer, "theme_mode");
  const stop = await followSystemTheme(sys.renderer, theme, { wait: 5000 });
  assert.equal(theme.name, "system");
  const red = theme.solve({ ...colours }).values["color-error"];
  assert.equal(hex(text.fg), red, "the terminal's red, made readable on its background");
  assert.equal(hex(text.bg), "#282828", "the terminal's background");
  assert.ok(contrast(red, "#282828") >= 4.5);
  assert.deepEqual(await onMode, ["dark"]);
  // the terminal turns light: a 2031 notification, then OpenTUI's own OSC 10/11 query, answered here
  colours = {
    fg: "#4c4f69",
    bg: "#eff1f5",
    ansi: "#5c5f77 #d20f39 #40a02b #df8e1d #1e66f5 #ea76cb #179299 #acb0be #6c6f85 #d20f39 #40a02b #df8e1d #1e66f5 #ea76cb #179299 #bcc0cc".split(
      " ",
    ),
  };
  const light = once(sys.renderer, "palette");
  stdin.emit("data", Buffer.from("\x1b[?997;2n"));
  await sleep(20);
  stdin.emit("data", Buffer.from(answer("10") + answer("11")));
  await light;
  await sys.renderOnce();
  assert.equal(hex(text.bg), "#eff1f5", "rebuilt for the light palette");
  assert.equal(hex(text.fg), theme.solve({ ...colours }).values["color-error"]);
  stop();
  // the fallback: ANSI indices and the default colours, drawn by the terminal
  const drawn = props({ color: "ansi:1", backgroundColor: "default", borderColor: "default" });
  assert.equal((drawn.fg as RGBA).intent, "indexed");
  assert.equal((drawn.fg as RGBA).slot, 1);
  assert.equal((drawn.backgroundColor as RGBA).intent, "default");
  assert.equal((drawn.borderColor as RGBA).intent, "default");
  assert.deepEqual(reportOf(undefined, "light"), {
    fg: undefined,
    bg: undefined,
    ansi: [],
    scheme: "light",
  });
  setTheme("");
  console.log("system theme on OpenTUI ok");
} finally {
  sys.renderer.destroy();
}
