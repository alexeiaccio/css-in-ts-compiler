// Rune's item 7, second half (`solid/app/Dev.tsx`'s fourth section): the live values. The panel's own keys pick one of
// the picked box's style numbers and move it through the value channel (`ui.value`) while the page runs — a
// renderer-level table, one frame long, so the page's own literals are untouched and a reset is the declare's literal
// again, byte for byte.
//
// Everything here is read from the frame the panel declared (its texts) and from the frame itself (the page's pixels, the
// a11y tree's bounds, `ui.hash()`), so a live value is asserted as a developer sees it. The panel reads the layout of the
// frame before, so a reading after an edit is taken a frame later (`idle`), as the panel itself prints it. Three
// mechanisms' mutations are named beside the checks they fail — for the write, both of its variants: a width's row
// writing its neighbour's floats, a radius's row one float along, a reset that writes the live value back instead of
// dropping it, and a step that is not clamped.
import {
  at,
  fresh,
  isLive,
  type Probe,
  rowName,
  rowValue,
  selected,
  stats,
  ui,
  valueRows,
  _dispose,
} from "./dev-harness.ts";

const { tuneRows } = await import("./app/Dev.tsx");
const { variant } = await import("./src/pack.ts");
const { keyName } = await import("./src/input.ts");

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};
const ms = (n: number) => n.toFixed(3);
const box = (id: string) => [...ui.bounds(Buffer.from(id))!];
/** The same bytes, pixel for pixel. */
const same = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const px = (x: number, y: number) => ui.pixel(x, y).join(",");

/** The page's half of a frame, byte for byte: the 360 columns on the left. The panel's own frame section prints the
 *  milliseconds of the frame that last changed the page, so no two readings of the whole window are identical — but the
 *  page's pixels are, and the panel's sections are compared by their texts. */
const pageOf = (frame: Uint8Array) => {
  const out = new Uint8Array(360 * 760 * 4);
  for (let y = 0; y < 760; y++) out.set(frame.subarray(y * 660 * 4, y * 660 * 4 + 360 * 4), y * 360 * 4);
  return out;
};

/** Down to the row with that name (Home first, so a row above the cursor is reached too). */
function select(p: Probe, name: string) {
  p.tap("Home");
  for (let i = 0; i < 40; i++) {
    const line = selected(p.sections().values);
    if (line !== undefined && rowName(line) === name) return;
    p.tap("ArrowDown");
  }
  throw new Error(`no row "${name}" in the values section`);
}
/** The row of that name, or undefined. */
const rowOf = (p: Probe, name: string) =>
  valueRows(p.sections().values).find((line) => rowName(line) === name);

const WIFI = [300, 132] as const; // a point in the switch's row, away from its track
const PRESS = [300, 92] as const; // the "Presses: 0" button, whose style draws a 1px border
const CORNER = [43, 121] as const; // inside a radius-8 corner, outside a radius-16 one
const FILL = [45, 134] as const; // the switch's own fill, left of its track

/** The switch's rows, as `pack.ts`'s FIELDS names them, in the panel's order: `s.row`'s numbers. */
const WIFI_ROWS = [
  ["width", 280],
  ["height", 32],
  ["padding.l", 10],
  ["padding.r", 10],
  ["padding.t", 4],
  ["padding.b", 4],
  ["gap", 12],
  ["radius", 8],
  ["bg.r", 48],
  ["bg.g", 53],
  ["bg.b", 68],
  ["bg.a", 255],
  ["alpha", 255],
  ["scale", 1],
  ["translateX", 0],
  ["translateY", 0],
  ["rotate", 0],
];

// --- the list: the hovered switch's fields, as the panel prints them, and the same numbers from the style's own resolve
{
  const p = fresh();
  p.hover(WIFI[0], WIFI[1]);
  check("the hovered box is the switch", p.sections().hover[0], 'wifi  switch "Wi-Fi"');
  check(
    "the values section names the box it picked, with its bounds",
    p.sections().values.target,
    'wifi  switch "Wi-Fi"  40,118 280×32',
  );
  const rows = valueRows(p.sections().values);
  check(
    "the switch's rows and their numbers",
    rows.map((line) => [rowName(line), rowValue(line)]),
    WIFI_ROWS,
  );
  check("the first row is selected", rows[0], ">  width 280");
  check("no row is live before an edit", rows.filter(isLive).length, 0);
  console.log(`tune: the switch's ${rows.length} rows: ${rows.map((l) => l.slice(3)).join(", ")}`);
  // the rows are the style's own numbers: resolve `s.row` as the declare does, pack it, and read the same rows
  const bounds = ui.bounds(Buffer.from("wifi"))!;
  const style = p.find((el) => el.props.id === "wifi")[0]!.props.style;
  const declared = variant(style, undefined, [":hover"]).box;
  const tuned = tuneRows(declared, bounds, variant(style, undefined, [":hover"]));
  check("the row list is the resolved style's", tuned.map((r) => r.name), rows.map(rowName));
  check(
    "and each row's number is the packed float's",
    tuned.map((r) => r.at(declared!, bounds)),
    rows.map(rowValue),
  );
  // what the channel cannot reach is not a row: a text's colour (the hovered box is not a text), the modes and the enums
  check(
    "no mode or enum is a row",
    rows.some((l) => /text|capture|clip|type|align|attach/.test(rowName(l))),
    false,
  );
  // the theme the declare resolves under is the panel's too: the light theme's hover fill, not the dark one's
  const light = fresh({ theme: "light" });
  light.hover(WIFI[0], WIFI[1]);
  check(
    "the rows are the numbers the same theme makes",
    [rowValue(rowOf(light, "bg.r")!), rowValue(rowOf(light, "bg.g")!), rowValue(rowOf(light, "bg.b")!)],
    [232, 235, 241],
  );
}

// --- the panel's parts: the page's last three Tab stops, and Tab/Shift+Tab between them
{
  const p = fresh();
  const order = p.input.focus.tabOrder();
  check("the panel's three stops end the page's tab order", order.slice(-3), [
    "dev-tree",
    "dev-hover",
    "dev-values",
  ]);
  p.tabTo("dev-values");
  check("Tab through the page reaches the values part", p.input.focus.focused(), "dev-values");
  p.focus("dev-tree");
  p.tap("Tab");
  check("Tab: the hovered box", p.input.focus.focused(), "dev-hover");
  p.tap("Tab");
  check("Tab: the values", p.input.focus.focused(), "dev-values");
  p.tap("Shift+Tab");
  check("Shift+Tab: the hovered box", p.input.focus.focused(), "dev-hover");
  p.tap("Shift+Tab");
  check("Shift+Tab: the tree", p.input.focus.focused(), "dev-tree");
  // the window's own path to the reset-all chord: SDL's R with Shift is a name of its own, not the plain letter
  check("Shift+R is a key name of its own", [keyName(0x72), keyName(0x72, 0x3)], ["r", "Shift+R"]);
}

// --- the radius: Right rounds the corner (a pixel of the page), the row's text says so, and r is the literal again
// (mutation: a row that writes its neighbour's field — `put` one float along — leaves the corner filled:
// `FAIL the radius rounds the corner: "48,53,68,255", wanted "16,18,24,255"`)
{
  const p = fresh();
  p.hover(WIFI[0], WIFI[1]);
  p.tabTo("dev-values");
  select(p, "radius");
  p.idle(2);
  check("the corner of a radius-8 row is the row's own fill", px(CORNER[0], CORNER[1]), "48,53,68,255");
  const before = p.sections();
  const page = pageOf(ui.pixels(660, 760));
  // 1 a pixel: 8 more round the corner past this pixel (16 of a 32-high row)
  for (let i = 0; i < 8; i++) p.tap("ArrowRight");
  check("the row prints the live number and the marker", selected(p.sections().values), ">* radius 16");
  check("the radius rounds the corner", px(CORNER[0], CORNER[1]), "16,18,24,255");
  // a radius is a paint, not a layout: the page's own box does not move
  check("a radius moves no box", at(box("wifi")), "40,118 280×32");
  p.tap("ArrowLeft");
  check("Left takes it back a step", selected(p.sections().values), ">* radius 15");
  p.tap("r");
  p.idle(2);
  check("r resets the row to the style's literal", selected(p.sections().values), ">  radius 8");
  check("... and the corner is the fill again", px(CORNER[0], CORNER[1]), "48,53,68,255");
  check("... and the page is the page before the edit, byte for byte", same(pageOf(ui.pixels(660, 760)), page), true);
  check("... and the panel's sections are the ones before it", [p.sections().rows, p.sections().hover, p.sections().values], [before.rows, before.hover, before.values]);
  console.log(
    `tune: radius 8 -> 16: the corner pixel ${px(CORNER[0], CORNER[1])}, the row ">* radius 16"; r: ` +
      `${valueRows(p.sections().values).filter(isLive).length} live rows, the page ` +
      `${same(pageOf(ui.pixels(660, 760)), page) ? "byte-identical" : "MOVED"} to before the edit`,
  );
}

// --- the width: it moves the box, the a11y tree's bounds, and the panel's own target line
{
  const p = fresh();
  p.hover(WIFI[0], WIFI[1]);
  p.tabTo("dev-values");
  check("the switch's row as the tree prints it", p.sections().rows[1], 'switch "Wi-Fi" [checked=false] 40,118 280×32');
  select(p, "width");
  p.tap("ArrowRight");
  p.idle(2); // the panel reads the layout of the frame before: its rows and the target catch up a frame later
  const b = box("wifi");
  check("the width row", selected(p.sections().values), ">* width 281");
  check("the box is a pixel wider", at(b), "40,118 281×32");
  check("... and the a11y tree's bounds with it", p.sections().rows[1], 'switch "Wi-Fi" [checked=false] 40,118 281×32');
  check("... and the panel's target line", p.sections().values.target.endsWith(at(b)), true);
  // a stretch width has no pixel of its own in the packed style: the row reads the box, and a step pins the axis
  check("the row's number is the box's width", rowValue(rowOf(p, "width")!), 281);
  const row = p.sections().rows[1];
  p.tap("r");
  p.idle(2);
  check("r puts the stretch back", [rowValue(rowOf(p, "width")!), box("wifi")![2]], [280, 280]);
  console.log(
    `tune: width 280 -> 281: the box ${at(b)}, its a11y row ${JSON.stringify(row)}; r: ${box("wifi")![2]}`,
  );
}

// --- a colour: the row's fill takes the channel, and the clamps hold at 255 and at 0
// (mutation: a step that is not clamped — the alpha runs past 255 and the size below 0:
// `FAIL an alpha past 255 stays 255: 259, wanted 255`)
{
  const p = fresh();
  p.hover(WIFI[0], WIFI[1]);
  p.tabTo("dev-values");
  check("the row's fill at the style's colour", px(FILL[0], FILL[1]), "48,53,68,255");
  select(p, "bg.r");
  // 4 a channel: 48 -> 255 is 52 steps (the 52nd is the clamp: 48 + 52 * 4 = 256)
  for (let i = 0; i < 52; i++) p.tap("ArrowRight");
  check("the red channel ran to the clamp", rowValue(rowOf(p, "bg.r")!), 255);
  check("... and the row's fill is red", px(FILL[0], FILL[1]), "255,53,68,255");
  console.log(`tune: bg.r 48 -> 255 (clamped): the fill ${px(FILL[0], FILL[1])}`);
  // an alpha at 255 stays there, and the row says it is live
  select(p, "bg.a");
  p.tap("ArrowRight");
  check("an alpha past 255 stays 255", rowValue(rowOf(p, "bg.a")!), 255);
  check("... and the row is live at the literal", rowOf(p, "bg.a"), ">* bg.a 255");
  // the low clamp: a padding of 10 runs to 0 and stays there
  select(p, "padding.l");
  for (let i = 0; i < 11; i++) p.tap("ArrowLeft");
  check("a size's step does not go below 0", rowValue(rowOf(p, "padding.l")!), 0);
  check("... and it is live at 0", rowOf(p, "padding.l")!.startsWith(">*"), true);
  // `-` and `+` are the same keys as Left and Right
  select(p, "rotate");
  p.tap("+");
  check("+ steps like Right", rowOf(p, "rotate"), ">* rotate 1");
  p.tap("-");
  check("- steps like Left, and the override stays", rowOf(p, "rotate"), ">* rotate 0");
  console.log(
    `tune: bg.a 255 + a step: ${rowValue(rowOf(p, "bg.a")!)}; padding.l 10 - 11: ${rowValue(rowOf(p, "padding.l")!)}; rotate 0, +, -: ${rowValue(rowOf(p, "rotate")!)}`,
  );
}

// --- Shift+R: five fields overridden, one key, and the frame before the edits again
// (mutation: a reset that writes the live value back instead of dropping it — the frame keeps the numbers:
// `FAIL Shift+R is the frame before the edits: 6213141387223398809, wanted 3206899684397957705`)
{
  const p = fresh();
  p.hover(WIFI[0], WIFI[1]);
  p.tabTo("dev-values");
  select(p, "radius");
  p.idle(2);
  const before = p.sections();
  const page = pageOf(ui.pixels(660, 760));
  for (const name of ["width", "height", "radius", "bg.r", "bg.a"]) {
    select(p, name);
    p.tap("ArrowRight");
  }
  check("five rows are live", valueRows(p.sections().values).filter(isLive).length, 5);
  check(
    "each with the marker, in the style's own list",
    valueRows(p.sections().values).filter(isLive).map(rowName),
    ["width", "height", "radius", "bg.r", "bg.a"],
  );
  p.tap("Shift+R");
  p.idle(2);
  check("Shift+R drops all five", valueRows(p.sections().values).filter(isLive).length, 0);
  check("the box is the style's box again", at(box("wifi")), "40,118 280×32");
  select(p, "radius"); // the cursor back where the frame before the edits had it
  p.idle(2);
  check("Shift+R is the page before the edits, byte for byte", same(pageOf(ui.pixels(660, 760)), page), true);
  check("... and the panel's sections are the ones before them", [p.sections().rows, p.sections().hover, p.sections().values], [before.rows, before.hover, before.values]);
  console.log(
    `tune: five rows overridden, Shift+R: ${valueRows(p.sections().values).filter(isLive).length} live, the frame ` +
      `${same(pageOf(ui.pixels(660, 760)), page) ? "byte-identical" : "MOVED"} to before the edits`,
  );
}

// --- a longer list is a window: the button's border adds four rows, and the window follows the cursor
{
  const p = fresh();
  p.hover(PRESS[0], PRESS[1]);
  check("the hovered box is the button", p.sections().hover[0], 'press  button "Presses: 0"');
  p.tabTo("dev-values");
  const rows = valueRows(p.sections().values);
  check("a bordered box lists its border's four channels too", rows.map(rowName).slice(12, 16), [
    "border.r",
    "border.g",
    "border.b",
    "border.a",
  ]);
  check("21 rows, 18 of them in the window", [rows.length, 18], [18, 18]);
  check("the footer says which rows of how many", p.sections().values.footer, "Up/Down  Left/Right  r/Shift+R  * = live  1-18 of 21");
  p.tap("End");
  check("End: the last row is the rotation", (selected(p.sections().values) ?? "").endsWith("rotate 0"), true);
  check("... and the window followed it", p.sections().values.footer, "Up/Down  Left/Right  r/Shift+R  * = live  4-21 of 21");
  console.log(`tune: a bordered button: 21 rows, the window shows ${rows.length} rows (${p.sections().values.footer})`);
}

// --- the cost: five overrides are five `ui.value` calls and the memcpy `ui_open` already did for any element with one
{
  const p = fresh();
  p.hover(WIFI[0], WIFI[1]);
  p.tabTo("dev-values");
  p.idle(2);
  const from = stats.length;
  p.idle(120); // frames at rest through the host's drawer: declared and laid out, drawn only when the hash says so
  const plain = stats.slice(from);
  const edits: number[] = [];
  for (const name of ["width", "height", "radius", "bg.r", "bg.a"]) {
    select(p, name);
    p.tap("ArrowRight");
    edits.push(stats[stats.length - 1]![3]!);
  }
  const mark = stats.length;
  p.idle(120);
  const tuned = stats.slice(mark + 1); // the edit's own frame is drawn; the rest are at rest
  const phase = (frames: [number, number, number, number][], i: number) =>
    median(frames.map((f) => f[i]! / 1e6));
  check("a frame at rest draws nothing, overridden or not", tuned.every((f) => f[3]! / 1e6 < 0.01), true);
  // a band, not a benchmark: five writes are a few µs, and a loaded machine moves a median by more than that
  check("a value write is part of the declare, not of the page", phase(tuned, 1) < phase(plain, 1) + 0.25, true);
  console.log(
    `tune: 120 frames at rest: declare ${ms(phase(plain, 1))} ms, layout ${ms(phase(plain, 2))} ms; ` +
      `five rows overridden: declare ${ms(phase(tuned, 1))} ms, layout ${ms(phase(tuned, 2))} ms, ` +
      `${tuned.filter((f) => f[3]! / 1e6 >= 0.01).length} draws of ${tuned.length}; an edit's drawn frame ` +
      `${ms(median(edits) / 1e6)} ms of draw (median)`,
  );
}

_dispose();
if (failed) process.exit(1);
console.log(
  "solid/tune.test.ts: the switch's 17 rows and their numbers, the panel's three Tab stops, a radius's corner and its pixel, " +
    "a width's box and a11y bounds, a colour's fill, the clamps at 255 and 0, r and Shift+R byte for byte, the marker, the window",
);
process.exit(0);
