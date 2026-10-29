// The dev page (`solid/app/Dev.tsx`): the Widgets page with a panel beside it, and the panel's sections asserted from
// the page's own strings — the a11y tree's rows (roles, names, states, bounds), the hovered box, the frame's phases and
// counters (the live values have `tune.test.ts` of their own). Frames are driven as the window does it (the pointer and
// the keys in, then one frame) by `dev-harness.ts`, and the panel is read from the tree the frame declared, so a section
// is asserted as a developer sees it.
//
// The phase sanity is not a benchmark: the four are ≥ 0, they are a frame's own (printed to 0.01ms), the draw is the
// largest of them on a frame that draws, a frame at rest measures no draw, and `ui.draws()` stands still — a panel that
// reprinted its numbers every frame would fail that last one. The mutations are named beside the checks they fail.
import { at, fresh, size, stats, ui, _dispose } from "./dev-harness.ts";

import type { A11yNode } from "./a11y.ts";

const { setReducedMotion } = await import("./src/motion.ts");

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};
const two = (n: number) => (n / 1e6).toFixed(2);
const box = (id: string) => [...ui.bounds(Buffer.from(id))!];
const dispose = _dispose;

// --- the Widgets page inside the dev page is that page, at its own size, in the left column
{
  const p = fresh();
  check("the page's root is the Widgets page's own box", p.left().props.id, "Root");
  check("the page keeps its 360", box("Root")[2], 360);
  check("the page is the left column, the panel starts at 360", [box("Root")[0], box("dev-panel")[0]], [0, 360]);
  check("the panel is 300 wide, the window's height", box("dev-panel").slice(2), [300, 760]);
  check("the dev page is 660x760", size, { width: 660, height: 760 });
}

// --- the a11y tree: the rows the panel prints for the page's initial state, in document order
{
  const p = fresh();
  const rows = p.sections().rows;
  check("one row per node of the page's tree", rows.length, 28);
  check("the page's first rows: the button, the switch, the unnamed group, the checkboxes", rows.slice(0, 8), [
    'button "Presses: 0" 40,72 280×40',
    'switch "Wi-Fi" [checked=false] 40,118 280×32',
    "group no bounds",
    'checkbox "Select all" [checked=false] 40,156 280×28',
    'checkbox "Wired" [checked=false] 40,190 280×28',
    'checkbox "Wireless" [checked=false] 40,224 280×28',
    'checkbox "Beta (disabled)" [checked=false disabled=true] 40,258 280×28',
    'button "Details" [expanded=false] 40,292 280×29',
  ]);
  // the groups' items are nested: the roles are the page's, and the last five rows are the settings tree
  check("the groups and their items", rows.slice(8, 18), [
    'radiogroup "Speed" 40,327 280×27',
    'radio "1x" [checked=true] 118,327 59×27',
    'radio "4x" [checked=false] 181,327 59×27',
    'radio "16x" [checked=false] 244,327 68×27',
    "tablist 40,359 228×33",
    'tab "Overview" [selected=true] 40,359 97×33',
    'tab "Stats" [selected=false] 139,359 69×33',
    'tab "Log" [selected=false] 210,359 59×33',
    'tabpanel "Overview" 40,392 280×58',
    'slider "Volume" 118,456 188×24',
  ]);
  check("the tree and its visible rows", rows.slice(-6), [
    "tree 40,527 280×124",
    'treeitem "Network" [expanded=true selected=false] 40,527 280×25',
    'treeitem "Wi-Fi" [selected=false] 40,552 280×25',
    'treeitem "Bluetooth" [selected=false] 40,576 280×25',
    'treeitem "Display" [expanded=false selected=false] 40,601 280×25',
    'treeitem "Storage" [selected=false] 40,626 280×25',
  ]);
  // the rows are the snapshot's own nodes, in its own order
  check("the rows are the snapshot's, in document order", rows.map((r) => r.split(" ")[0]), (function walk(n: A11yNode): string[] {
    return n.children.flatMap((c) => [c.role, ...walk(c)]);
  })(p.snap()));
  // a node the page drew no box for says so, and a nested row is indented 8px a level
  check("a node without bounds says so", rows[2], "group no bounds");
  const indentOf = (line: string) => {
    const el = p.find((e) => e.tag === "text", p.panel()).find((e) => p.text(e) === line)!;
    return (el.parent!.props.style as any).layout.padding.left;
  };
  check("a child row is indented", indentOf('treeitem "Wi-Fi" [selected=false] 40,552 280×25'), 8);
  check("a top-level row is not", indentOf('button "Presses: 0" 40,72 280×40'), 0);
}

// --- one Tab: the ring is on the switch, the panel's row says so, and the ring's pixels are on the box it names
// (mutation: a snapshot taken once at mount keeps `focused` off this row and the Shift+Tab check below fails)
{
  const p = fresh();
  check("nothing is focused at first", p.sections().rows.some((r) => r.includes("focused")), false);
  p.tap("Tab"), p.tap("Tab");
  const rows = p.sections().rows;
  check("the button's row has no focus", rows[0], 'button "Presses: 0" 40,72 280×40');
  check("the switch's row is the one that has it", rows[1], 'switch "Wi-Fi" [checked=false focused=true] 40,118 280×32');
  check("and it is the page's box for it", rows[1]!.endsWith(at(box("wifi"))), true);
  const b = box("wifi");
  check("the ring's pixel is on the switch's box", ui.pixel(b[0]! + 1, b[1]! + b[3]! / 2).join(","), "90,170,255,255");
  p.tap("Shift+Tab");
  check("Shift+Tab moves it back", p.sections().rows.slice(0, 2), [
    'button "Presses: 0" [focused=true] 40,72 280×40',
    'switch "Wi-Fi" [checked=false] 40,118 280×32',
  ]);
  // a key the page acts on: the panel's states follow the page's own fields
  p.tap("Tab"), p.tap(" ");
  check("Space checks the switch, and the row says so", p.sections().rows[1], 'switch "Wi-Fi" [checked=true focused=true] 40,118 280×32');
  p.tap(" ");
  check("... and back", p.sections().rows[1], 'switch "Wi-Fi" [checked=false focused=true] 40,118 280×32');
}

// --- the hovered box: the innermost a11y node under the pointer, its id, role, name and `ui.bounds`
// (mutation: the bounds of the outermost box under the pointer print the tablist's, and the tab's row fails)
{
  const p = fresh();
  check("nothing hovered at the page's start", p.sections().hover, ["nothing", "the pointer is over the page's background"]);
  // a tab: the tablist is under the pointer too, and the tab is the innermost node with a role
  const tab = box("tabs-tab-0");
  p.hover(tab[0]! + tab[2]! / 2, tab[1]! + tab[3]! / 2);
  check("the innermost box under the pointer, not its tablist", p.sections().hover, [
    'tabs-tab-0  tab "Overview"',
    at(tab),
  ]);
  // the button, away from the tab
  const press = box("press");
  p.hover(press[0]! + 10, press[1]! + press[3]! / 2);
  check("the button on the page", p.sections().hover, ['press  button "Presses: 0"', at(press)]);
  // the page's own padding: no box with a role under the pointer
  p.hover(5, 5);
  check("the page's background", p.sections().hover, ["nothing", "the pointer is over the page's background"]);
  // the panel itself is not the page: the pointer over a row reports nothing
  p.hover(600, 300);
  check("the panel's own boxes are not the page's", p.sections().hover[0], "nothing");
}

// --- the frame's phases: the last frame's four, the mean and the max of the last 30, and the counters
{
  const p = fresh();
  // a frame that draws: a hover is a new hash, and the panel prints its phases on the next reading. The first draws of
  // the process warm the raster (ThorVG's glyph and scene caches), so a few hover changes come first
  const press = box("press");
  const tab = box("tabs-tab-0");
  for (let i = 0; i < 3; i++) {
    p.hover(tab[0]! + tab[2]! / 2, tab[1]! + tab[3]! / 2);
    p.hover(press[0]! + 10, press[1]! + press[3]! / 2);
  }
  // the reading the panel printed last, and the frames it had seen by then (the change's own frame among them)
  const read = p.reads[p.reads.length - 1]!;
  const seen = stats.slice(0, read.frames);
  const frame = seen[seen.length - 1]!;
  check("all four phases are there, and none is negative", frame.every((n) => n >= 0), true);
  check("the panel prints that frame's four, in ms", p.sections().frame.slice(0, 2), [
    `events+flush ${two(frame[0]!)}   declare ${two(frame[1]!)}`,
    `layout ${two(frame[2]!)}   draw ${two(frame[3]!)}`,
  ]);
  check("the draw is the largest phase of a frame that draws", frame[3]! > frame[2]! && frame[3]! > frame[1]!, true);
  const win = seen.slice(-30).map((s) => s[0]! + s[1]! + s[2]! + s[3]!);
  const mean = win.reduce((a, b) => a + b, 0) / win.length / 1e6;
  check("the window line: last N, the mean and the max", p.sections().frame[2], `last ${win.length}: mean ${mean.toFixed(2)}  max ${(Math.max(...win) / 1e6).toFixed(2)} ms`);
  check("the counters are the process's, as of that reading", p.sections().frame[3], `draws ${read.draws}  presents ${read.presents}`);
  console.log(
    `dev: a frame that draws is ${two(frame[0]! + frame[1]! + frame[2]! + frame[3]!)} ms ` +
      `(events+flush ${two(frame[0]!)}, declare ${two(frame[1]!)}, layout ${two(frame[2]!)}, draw ${two(frame[3]!)}), ` +
      `mean ${mean.toFixed(2)} max ${(Math.max(...win) / 1e6).toFixed(2)}`,
  );
  // a page at rest: the frame draws nothing, so the draw phase is 0.00 and the counter stands still
  // (mutation: a panel that reprints every frame draws every frame, and both checks fail)
  p.idle(1);
  const before = ui.draws();
  p.idle(20);
  check("twenty frames at rest measure no draw at all", stats.slice(-20).every((s) => s[3]! / 1e6 < 0.01), true);
  check("and the draws counter stands still", ui.draws(), before);
  console.log(`dev: at rest, 20 frames: ${ui.draws() - before} draws, draw phase ${two(stats[stats.length - 1]![3]!)} ms`);
}

// --- the light theme: the panel draws in the light palette too, and the page with it
{
  fresh();
  check("the dark panel's ground", ui.pixel(600, 700).join(","), "24,26,33,255");
  check("the dark page's", ui.pixel(10, 10).join(","), "16,18,24,255");
  const light = fresh({ theme: "light" });
  check("the light panel's ground", ui.pixel(600, 700).join(","), "232,234,240,255");
  check("the light page's", ui.pixel(10, 10).join(","), "244,245,248,255");
  check("the same tree in the light theme", light.sections().rows.length, 28);
  check("... with the same rows", light.sections().rows[1], 'switch "Wi-Fi" [checked=false] 40,118 280×32');
}

// --- reduced motion: the dev page has no entry of its own (the Widgets page is given no motion hook), so its first frame
// is the settled one either way and the panel reads the same rows
{
  setReducedMotion(true);
  const p = fresh();
  check("reduced motion: the same 28 rows", p.sections().rows.length, 28);
  p.idle(1);
  const before = ui.draws();
  p.idle(10);
  check("reduced motion: at rest from the first frame", ui.draws(), before);
  setReducedMotion(false);
}

// --- the four stored frames are this page's. They are not compared pixel for pixel: the panel prints the frame's
// milliseconds, so two runs of the same page at rest differ by 13,661 of the 501,600 pixels (the digits, and the reflow
// they cause). What is checked is that each stored frame is the dev page's size, so a missing or foreign one shows up.
{
  for (const name of ["dev.png", "dev-hover.png", "dev-light.png", "dev-tree.png"]) {
    const png = ui.png(new URL(`./frames/${name}`, import.meta.url).pathname);
    check(`frames/${name} is the dev page's frame`, png === undefined ? undefined : [png.width, png.height], [660, 760]);
  }
}

dispose();
if (failed) process.exit(1);
console.log(
  "solid/dev.test.ts: the panel's 28 tree rows, the hovered box, the frame's four phases, the mean and max, the draws counter",
);
process.exit(0);
