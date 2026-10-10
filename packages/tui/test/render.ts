// The OpenTUI adapter on OpenTUI's test renderer (Bun): the built styles of test/tui.mjs (out/card.mjs) on a box and a
// text, then a simulated mouse over, press, out, a theme switch and focus, read back from the renderables, the frame and
// the mouse pointer. Run: bun test/render.ts (after node test/tui.mjs)
import assert from "node:assert/strict";

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
import { attach, setTheme, use } from "../src/opentui.ts";

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
