// The OpenTUI adapter on OpenTUI's test renderer (Bun): the built styles of test/tui.mjs (out/card.mjs) on a box and a
// text, then a simulated mouse over, press, out, a theme switch and focus, read back from the renderables, the frame and
// the mouse pointer. Run: bun test/render.ts (after node test/tui.mjs)
import assert from "node:assert/strict";

import { BoxRenderable, InputRenderable, type RGBA, rgbToHex, TextRenderable } from "@opentui/core";
import { createTestRenderer } from "@opentui/core/testing";

import type { TuiShape } from "../src/index.ts";
import { attach, setTheme, use } from "../src/opentui.ts";

const built = "./out/card.mjs"; // written by test/tui.mjs
const styles = (await import(built)) as Record<"button" | "label" | "field", TuiShape>;

const hex = (c: RGBA) => rgbToHex(c).slice(0, 7);

const setup = await createTestRenderer({ width: 30, height: 8 });
const { renderer, mockMouse, renderOnce, captureCharFrame } = setup;
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
  input.blur();
  await renderOnce();
  assert.notEqual(hex(input.backgroundColor), "#45475a");
  console.log("render ok");
} finally {
  renderer.destroy();
}
