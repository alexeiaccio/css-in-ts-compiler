// A list on @bomb.sh/tty styled with cssints/tui: hover and press an item with the mouse, `t` swaps the theme, `q` quits.
// Run: bun run example (examples/run.mjs builds it with the cssints plugin first)
import {
  alternateBuffer,
  close,
  createInput,
  createTerm,
  cursor,
  mouseTracking,
  settings,
} from "@bomb.sh/tty";

import { createTracker, setTheme, theme } from "../src/bomb.ts";
import { help, item, label, list, screen } from "./styles.ts";

const items = ["Inbox", "Drafts", "Sent", "Archive"];
let picked = "nothing yet";

const tty = settings(alternateBuffer(), cursor(false), mouseTracking());
const term = await createTerm({
  width: process.stdout.columns || 80,
  height: process.stdout.rows || 24,
});
const input = await createInput();
const ui = createTracker();
let pointer = { x: -1, y: -1, down: false };

const build = () => [
  ui.open("screen", screen),
  ui.open("list", list),
  ...items.flatMap((name) => [ui.open(name, item), ui.text(name, label, name), close()]),
  close(),
  ui.text(`picked: ${picked}`, help),
  ui.text(`theme: ${theme() || "dark"} (t to swap, q to quit)`, help),
  close(),
];
const frame = () => {
  const { output, events } = ui.render(term, build, { pointer });
  process.stdout.write(output);
  const click = events.find((e) => e.type === "pointerclick" && items.includes(e.id));
  if (click) {
    picked = click.id;
    process.stdout.write(ui.render(term, build, { pointer }).output);
  }
};
const quit = () => {
  process.stdout.write(ui.reset());
  process.stdout.write(tty.revert);
  process.stdin.setRawMode(false);
  process.exit(0);
};

process.stdout.write(tty.apply);
process.stdin.setRawMode(true);
process.stdin.on("data", (bytes: Buffer) => {
  for (const e of input.scan(new Uint8Array(bytes)).events) {
    if (e.type === "keydown" && (e.key === "q" || (e.ctrl && e.key === "c"))) return quit();
    if (e.type === "keydown" && e.key === "t") setTheme(theme() ? "" : "light");
    if (e.type === "mousemove" || e.type === "mousedown" || e.type === "mouseup")
      pointer = {
        x: e.x,
        y: e.y,
        down: e.type === "mousedown" || (e.type === "mousemove" && pointer.down),
      };
  }
  frame();
});
frame();
