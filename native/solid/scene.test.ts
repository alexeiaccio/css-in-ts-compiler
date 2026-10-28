// A scene as a file, replayed: Rune's item 4 (docs/map.md). Four scenes are the record of how four stored frames were
// made — the sequence of keys, a click and wheel notches, not a state each — and every one of them must come out of the
// replayer byte-identical to its frame. The test also proves the record can lie in a way the pixels see: a scene with two
// of its steps' keys swapped, or with its settle dropped, is a different frame, which is what makes these files the
// record and not a caption for one state. And a file that is not a scene says where it stopped being one: the step's
// index and the reason (`solid/src/scene.ts` parses; this test pins the messages).
import "./plugin.ts";

import { readFileSync } from "node:fs";

import type { Node } from "./src/renderer.ts";
import type { Scene, SceneRun, Step } from "./src/scene.ts";

const { ui } = await import("./src/ffi.ts");
const { parseScene, runScene } = await import("./src/scene.ts");
const { El, Txt } = await import("./src/renderer.ts");

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};
const fixed = (x: number) => Math.round(x * 100) / 100;
const scenes = new URL("./scenes/", import.meta.url).pathname;
const frames = new URL("./frames/", import.meta.url).pathname;
const tmp = process.env.TMPDIR ?? "/tmp";

/** The text under a node, as the page drew it. */
const textOf = (n: Node): string => (n instanceof Txt ? n.text : n.children.map(textOf).join(""));
/** The page's text runs in tree order. */
const textsOf = (el: El, out: string[] = []): string[] => {
  for (const c of el.children) {
    if (!(c instanceof El)) continue;
    if (c.tag === "text") out.push(textOf(c));
    else textsOf(c, out);
  }
  return out;
};
/** The steps as one line: a key's press and release, typed text, a pointer, a notch, a settle or a frame. */
const label = (s: Step): string => {
  const t = `${s.t} `;
  switch (s.kind) {
    case "key":
      return `${t}${s.name}${s.down ? "+" : "-"}`;
    case "text":
      return `${t}text:${s.text}`;
    case "pointer":
      return `${t}pointer ${s.x},${s.y} ${s.down ? "down" : "up"}${s.touch ? " touch" : ""}`;
    case "wheel":
      return `${t}wheel ${s.dx},${s.dy}`;
    case "settle":
      return `${t}settle ${s.frames}`;
    case "frame":
      return `${t}frame`;
  }
};
/**
 * The ending state a page shows that its pixels do not spell out: the List's readout and offset, the Sky's feed offset,
 * and the focus of a page whose point is what has it.
 */
function endingState(page: Scene["page"], run: SceneRun): string {
  const texts = textsOf(run.root);
  const focus = run.input.focus.focused() ?? "none";
  switch (page) {
    case "list":
      return `the readout "${texts.find((t) => / of \d+$/.test(t)) ?? "?"}", the offset ${fixed(ui.scrollOffset("list"))}`;
    case "sky":
      return `focus ${focus}, the feed's offset ${fixed(ui.scrollOffset("sky-feed"))}`;
    case "widgets":
    case "dialog":
      return `focus ${focus}`;
    default:
      return "";
  }
}
/** Differing RGBA bytes of two PNGs of one size (-1 when either is missing or the sizes differ). */
function bytesBetween(a: string, b: string): number {
  const [pa, pb] = [ui.png(a), ui.png(b)];
  if (!pa || !pb || pa.pixels.length !== pb.pixels.length) return -1;
  let n = 0;
  for (let i = 0; i < pa.pixels.length; i++) n += pa.pixels[i] === pb.pixels[i] ? 0 : 1;
  return n;
}
/** The message a JSON object raises in `parseScene`, or "(no error)". */
function messageOf(raw: unknown): string {
  try {
    parseScene(JSON.stringify(raw), "scenes/bad.json");
  } catch (e) {
    return (e as Error).message;
  }
  return "(no error)";
}

// --- the four scenes, replayed in-process: each its stored frame, 0 pixels and 0 bytes, and what its last frame's
//     pixels do not say (the List's selection and offset, the Sky's feed offset, the focus)
const NAMES = ["widgets-switch-on", "list-select", "sky-scrolled", "dialog-menu"];
for (const name of NAMES) {
  const scene = parseScene(readFileSync(`${scenes}${name}.json`, "utf-8"), `scenes/${name}.json`);
  check(`${name} names its own stored frame`, scene.name, name);
  const run = await runScene(scene);
  const frame = `${frames}${name}.png`;
  const n = ui.diffPng(frame, `${frame}.actual.png`);
  check(`${name} replayed from its scene is its stored frame, 0 pixels`, n, 0);
  check(`${name}: no Clay error`, ui.errors(), 0);
  console.log(
    `solid/scene.test.ts: ${name}.json: ${scene.page} ${scene.size[0]}x${scene.size[1]} ${scene.theme}, ` +
      `${scene.steps.length} steps, ${run.frames} frames, ${n} pixels differ; ${endingState(scene.page, run)}`,
  );
  console.log(`solid/scene.test.ts:   ${scene.steps.map(label).join("  ")}`);
  run.dispose();
}

// --- the record can lie: the widgets scene with Space where its first Tab was (and a Tab where its Space was) is not
//     widgets-switch-on's frame — the switch never turns on, and the pixels say so
{
  const scene = parseScene(readFileSync(`${scenes}widgets-switch-on.json`, "utf-8"));
  // the same times, the keys swapped: "Space before Tab"
  const swapped: Scene = {
    ...scene,
    steps: scene.steps.map((s, i) =>
      s.kind !== "key" ? s : i < 2 ? { ...s, name: "Space" } : i < 4 ? s : i < 6 ? { ...s, name: "Tab" } : s,
    ),
  };
  const run = await runScene(swapped);
  const actual = `${tmp}/scene-widgets-space-before-tab.png`;
  const pixels = ui.diffPng(`${frames}widgets-switch-on.png`, actual);
  const bytes = bytesBetween(`${frames}widgets-switch-on.png`, actual);
  check("the widgets scene with Space before Tab is not its stored frame", pixels > 0, true);
  check("and its byte count is the frame's own", bytes > 0, true);
  console.log(
    `solid/scene.test.ts: widgets-switch-on with Space before Tab: ${pixels} pixels, ${bytes} bytes differ; ` +
      `${endingState(scene.page, run)}`,
  );
  run.dispose();
}

// --- and the times are the motion: the list scene without its settle compares the frame the twelfth ArrowDown left,
//     still easing the row into view, not list-select.png (the selection is 13 already, the offset is not yet -148)
{
  const scene = parseScene(readFileSync(`${scenes}list-select.json`, "utf-8"));
  const dropped: Scene = { ...scene, steps: scene.steps.filter((s) => s.kind !== "settle") };
  const run = await runScene(dropped);
  const actual = `${tmp}/scene-list-no-settle.png`;
  const pixels = ui.diffPng(`${frames}list-select.png`, actual);
  const bytes = bytesBetween(`${frames}list-select.png`, actual);
  check("the list scene with its settle dropped compares a mid-ease frame", pixels > 0, true);
  check("... which differs in bytes too", bytes > 0, true);
  check("... after 43 frames, the last being the twelfth ArrowDown", run.frames, 43);
  console.log(
    `solid/scene.test.ts: list-select without its settle: ${run.frames} frames, ${pixels} pixels, ${bytes} bytes ` +
      `differ; ${endingState(scene.page, run)}`,
  );
  run.dispose();
}

// --- the step kind the four stored scenes do not use: typed text reaches the focused part (`text:Ada`, as the form page's
//     stored frame is taken). The page is the Text field's, and there is no stored frame for this one: the value in the
//     tree is the assertion
{
  const scene: Scene = {
    name: "form-typed",
    page: "form",
    size: [360, 450],
    theme: "dark",
    reducedMotion: false,
    steps: [
      { t: 0.5, kind: "key", name: "Tab", down: true },
      { t: 0.5, kind: "key", name: "Tab", down: false },
      { t: 0.5166667, kind: "key", name: "Tab", down: true },
      { t: 0.5166667, kind: "key", name: "Tab", down: false },
      { t: 0.5333333, kind: "text", text: "Ada" },
    ],
  };
  const run = await runScene(scene);
  check("a text step types into the focused field", textsOf(run.root).includes("Ada"), true);
  check("... which is the Name field, after two Tabs", run.input.focus.focused(), "name");
  console.log(`solid/scene.test.ts: a text step: "Ada" in the Name field, ${run.frames} frames`);
  run.dispose();
}

// --- a file that is not a scene says where it stopped being one: the step's index and the reason
{
  const bad = messageOf({
    name: "bad",
    page: "list",
    size: [360, 400],
    theme: "dark",
    steps: [{ t: 0, kind: "drag", x: 1, y: 2 }],
  });
  check(
    "an unknown kind fails at its index",
    bad,
    "scenes/bad.json: step 0: kind \"drag\" is not key, text, pointer, wheel, settle or frame",
  );
  console.log(`solid/scene.test.ts: an unknown kind: ${bad}`);
}
{
  const bad = messageOf({
    name: "bad",
    page: "list",
    size: [360, 400],
    theme: "dark",
    steps: [
      { t: 0.5, kind: "key", name: "Tab", down: true },
      { t: 0.1, kind: "key", name: "Tab", down: true },
    ],
  });
  check(
    "a step out of order fails with both times",
    bad,
    "scenes/bad.json: step 1: out of order: t 0.1 is frame 6, after a step at t 0.5 (frame 30)",
  );
  console.log(`solid/scene.test.ts: a step out of order: ${bad}`);
}
{
  const bad = messageOf({ name: "bad", page: "list", theme: "dark", steps: [] });
  check("a missing size fails", bad, "scenes/bad.json: size must be [width, height], two whole pixels");
  console.log(`solid/scene.test.ts: a missing size: ${bad}`);
}
{
  // the size is the page's own: a window of another size is a different page's frame
  const scene = parseScene(
    JSON.stringify({ name: "bad", page: "list", size: [360, 480], theme: "dark", steps: [] }),
    "scenes/bad.json",
  );
  let message = "(no error)";
  try {
    await runScene(scene);
  } catch (e) {
    message = (e as Error).message;
  }
  check("a size that is not the page's fails", message, "page list is 360x400, the scene 360x480");
  console.log(`solid/scene.test.ts: a size that is not the page's: ${message}`);
}

if (failed) process.exit(1);
console.log(
  "solid/scene.test.ts: four scenes replayed out of their files (the Widgets switch, the List's selection, the Sky's " +
    "feed after a click and eight notches, the Dialog's menu), each its stored frame with 0 pixels and 0 bytes; typed " +
    "text in a scene of its own; the two mutations that make a scene lie (Space before Tab, the settle dropped) each a " +
    "different frame; and the four files that are not scenes failing with their step's index and the reason",
);
process.exit(0);
