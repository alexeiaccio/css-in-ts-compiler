// What the stored frames of the Dialog page cannot show: the trap (Tab cycles Cancel and OK and never reaches the page
// behind), Escape and Cancel closing without a write, OK writing the volume onto the page, a press on the backdrop doing
// nothing and not reaching the page under it, where Clay put the two floats (`ui.bounds`), the menu's arrows, Escape
// and Enter, and the motion of the two overlays (the value channel's offset y and shadow blur, frame by frame). Driven
// as the window does: pointer and keys in, then one frame.
import "./plugin.ts";

const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render, Txt } = await import("./src/renderer.ts");
const { Dialog, size } = await import("./app/Dialog.tsx");

ui.init(size.width, size.height);
ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname);

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};

let dispose = () => {};
function fresh(theme?: string, glass = true) {
  dispose();
  const root = new El("root");
  const input = createInput();
  const unhandled: string[] = [];
  input.fallback = (name) => (unhandled.push(name), false);
  // the page's frame hook, wired as solid/main.ts does: its tick is the motion of the menu and the dialog
  const motion: { tick?: (dt: number) => void } = {};
  dispose = render(() => Dialog({ input, glass, motion }), root);
  const frame = createFrame(root, {
    theme,
    onPressMiss: () => input.pressMiss(),
    tick: (dt) => motion.tick?.(dt),
  });
  let at = [-1, -1];
  const step = (down = false) => frame(at[0]!, at[1]!, down, 1 / 60);
  /** More frames at 1/60 with nothing pressed: a motion track's settle (the menu's slide, the dialog's drop). */
  const settle = (n = 30) => {
    for (let i = 0; i < n; i++) step();
  };
  step(), step();

  const find = (pred: (el: El) => boolean, from: El = root): El[] =>
    from.children.flatMap((c) => (c instanceof El ? [...(pred(c) ? [c] : []), ...find(pred, c)] : []));
  const text = (el: El): string => el.children.map((c) => (c instanceof Txt ? c.text : text(c))).join("");
  const texts = () => find((el) => el.tag === "text").map(text);
  const volume = () => texts().find((t) => t.startsWith("Volume:"))?.split(": ")[1];
  const zoom = () => texts().find((t) => /^\d+%$/.test(t));
  const box = (id: string) => ui.bounds(Buffer.from(id))!;
  return {
    input,
    unhandled,
    volume,
    zoom,
    focused: () => input.focus.focused(),
    open: () => find((el) => el.props.id === "settings-dialog").length > 0,
    menuOpen: () => find((el) => el.props.id === "zoom-menu").length > 0,
    exists: (id: string) => find((el) => el.props.id === id).length > 0,
    down: (name: string, repeat = false) => (input.down(name, repeat), step()),
    up: (name: string) => (input.up(name), step()),
    tap(name: string) {
      this.down(name);
      this.up(name);
    },
    /** open the settings dialog from the keyboard: Tab to its trigger (from wherever focus is), Enter */
    openDialog() {
      for (let n = 0; n < 4 && this.focused() !== "settings-trigger"; n++) this.tap("Tab");
      this.tap("Enter");
    },
    move: (id: string, dx = 0.5, dy = 0.5, down = false) => {
      const b = box(id);
      at = [b[0]! + b[2]! * dx, b[1]! + b[3]! * dy];
      step(down);
    },
    press: () => step(true),
    release: () => step(false),
    click(id: string) {
      this.move(id);
      this.press();
      this.release();
    },
    clickAt(x: number, y: number) {
      at = [x, y];
      step();
      step(true);
      step(false);
    },
    step,
    settle,
    box,
  };
}

// --- opening by click and by keyboard: focus moves into the dialog, onto its first control
{
  const p = fresh();
  check("closed at first", [p.open(), p.focused()], [false, null]);
  p.click("settings-trigger");
  check("a click opens the dialog", p.open(), true);
  check("focus moves into the dialog, onto Cancel", p.focused(), "cancel");
  check("the page's line is unchanged", p.volume(), "40%");
  p.click("cancel");
  check("Cancel closes it", p.open(), false);
  check("focus returns to the trigger", p.focused(), "settings-trigger");
  check("and writes nothing", p.volume(), "40%");

  p.openDialog();
  check("Tab then Enter opens it", [p.open(), p.focused()], [true, "cancel"]);
  p.tap("Escape");
  check("Escape closes it", [p.open(), p.focused()], [false, "settings-trigger"]);
  check("Escape writes nothing", p.volume(), "40%");
}

// --- the trap: Tab and Shift+Tab cycle Cancel and OK and never reach the page's own controls
{
  const p = fresh();
  p.openDialog();
  const lap = ["cancel"];
  for (let n = 0; n < 5; n++) p.tap("Tab"), lap.push(p.focused() ?? "none");
  check("Tab cycles the dialog's two controls", lap, ["cancel", "ok", "cancel", "ok", "cancel", "ok"]);
  const back = [p.focused()];
  for (let n = 0; n < 3; n++) p.tap("Shift+Tab"), back.push(p.focused() ?? "none");
  check("Shift+Tab cycles back", back, ["ok", "cancel", "ok", "cancel"]);
  check("and the dialog is still open", p.open(), true);
  check("the page's trigger is not a stop while the dialog is open", lap.includes("settings-trigger"), false);
}

// --- OK writes the value onto the page
{
  const p = fresh();
  p.openDialog();
  p.tap("Tab");
  check("Tab reaches OK", p.focused(), "ok");
  p.tap("Enter");
  check("Enter on OK closes the dialog", p.open(), false);
  check("and writes 55% onto the page", p.volume(), "55% (just set)");
  check("focus is back on the trigger", p.focused(), "settings-trigger");
  p.click("settings-trigger");
  p.tap("Tab"), p.tap(" ");
  check("Space on Cancel closes without a write", [p.open(), p.volume()], [false, "55% (just set)"]);
}

// --- the backdrop: a press on it does nothing and does not reach the page behind it
{
  const p = fresh();
  p.openDialog();
  const before = p.focused();
  p.click("settings-trigger"); // the page's Open button, behind the backdrop
  check("a press on the backdrop leaves the dialog open", p.open(), true);
  check("and focus where it was", p.focused(), before);
  check("and does not press the page's button behind (the volume is untouched)", p.volume(), "40%");
  p.click("zoom-trigger"); // behind the dialog's panel: still no menu
  check("a press on the panel or the page behind opens no menu", p.menuOpen(), false);
}

// --- the floats: the backdrop covers the window; the dialog is centred on the root; the page keeps its layout
{
  const p = fresh();
  const root = [...p.box("Root")];
  const trigger = [...p.box("settings-trigger")];
  const zoom = [...p.box("zoom-trigger")];
  p.openDialog();
  p.settle(); // the panel has dropped in: its box is measured at rest
  check("the backdrop is the whole window", [...p.box("settings-backdrop")], [0, 0, size.width, size.height]);
  const dialog = p.box("settings-dialog");
  check("the dialog's centre is the root's centre (x)", dialog[0]! + dialog[2]! / 2, size.width / 2);
  check("the dialog's centre is the root's centre (y)", dialog[1]! + dialog[3]! / 2, size.height / 2);
  check("the page's root did not move", [...p.box("Root")], root);
  check("the page's trigger did not move behind the backdrop", [...p.box("settings-trigger")], trigger);
  check("the menu's trigger did not move behind the backdrop", [...p.box("zoom-trigger")], zoom);
}

// --- the menu: arrows, Home and End, Escape back to the trigger, Enter picks
{
  const p = fresh();
  p.tap("Tab"), p.tap("Tab");
  check("Tab reaches the menu trigger", p.focused(), "zoom-trigger");
  check("closed at first", [p.menuOpen(), p.zoom()], [false, "100%"]);
  p.tap("Enter");
  check("Enter opens the menu on the first item", [p.menuOpen(), p.focused()], [true, "zoom-item-0"]);
  p.tap("ArrowDown");
  check("ArrowDown moves", p.focused(), "zoom-item-1");
  p.tap("ArrowUp"), p.tap("ArrowUp");
  check("ArrowUp wraps to the last", p.focused(), "zoom-item-3");
  p.tap("ArrowDown");
  check("ArrowDown wraps to the first", p.focused(), "zoom-item-0");
  p.tap("End");
  check("End goes to the last", p.focused(), "zoom-item-3");
  p.tap("Home");
  check("Home goes to the first", p.focused(), "zoom-item-0");
  p.tap("Escape");
  check("Escape closes the menu", p.menuOpen(), false);
  check("and returns focus to the trigger", p.focused(), "zoom-trigger");
  check("nothing is picked yet", p.zoom(), "100%");

  p.tap("ArrowDown");
  check("ArrowDown on the trigger opens on the first", [p.menuOpen(), p.focused()], [true, "zoom-item-0"]);
  p.tap("ArrowDown"), p.tap("ArrowDown");
  check("to the third", p.focused(), "zoom-item-2");
  p.tap("Enter");
  check("Enter picks it and closes", [p.menuOpen(), p.zoom()], [false, "150%"]);
  check("and focus returns to the trigger", p.focused(), "zoom-trigger");

  p.click("zoom-trigger");
  check("a click opens the menu on the first item", [p.menuOpen(), p.focused()], [true, "zoom-item-0"]);
  p.settle(); // the menu has slid out: its items are where they will be pressed
  p.click("zoom-item-1");
  check("a click picks and closes", [p.menuOpen(), p.zoom()], [false, "125%"]);

  // the panel hangs off the trigger's left-bottom corner, overlapping it by 20px (the glass needs something under it)
  p.tap("Enter");
  p.settle(); // the slide's end is the style's own offset, which is what this measures
  const panel = p.box("zoom-menu");
  const trigger = p.box("zoom-trigger");
  check("the menu's left edge is the trigger's", panel[0], trigger[0]);
  check("the menu overlaps the trigger's bottom edge", panel[1], trigger[1]! + trigger[3]! - 20);
  p.tap("Escape");
  check("Escape closes it again", [p.menuOpen(), p.focused()], [false, "zoom-trigger"]);
}

// --- the shadows (css.shadow): a renderer effect by element id, so the frames' pixels are the proof
// The panel's shadow is its own box, 12px down and blurred: the page beside it is darker than the page far away, the
// falloff is a gradient (not a line), the panel's border still sits above it, and more of it is below the panel than
// above (the offset). The menu's shadow is smaller and hangs off it the same way.
const lum = (c: readonly number[]) => 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
const at = (x: number, y: number) => lum(ui.pixel(Math.round(x), Math.round(y)));
for (const theme of [undefined, "light"]) {
  const name = theme ?? "dark";
  const p = fresh(theme);
  p.openDialog();
  p.settle(); // the drop is over: the shadow is the style's own blur
  const [x, y, w, h] = p.box("settings-dialog");
  const mid = y! + h! / 2;
  const outside = at(x! - 1, mid);
  const far = at(x! - 24, mid);
  const edge = at(x!, mid);
  const outward = [x! - 1, x! - 4, x! - 8, x! - 16, x! - 24].map((ax) => at(ax, mid));
  const above = at(x! - 1, y! + 3);
  const below = at(x! - 1, y! + h! - 3);
  console.log(
    `shadow (${name}): page ${far.toFixed(1)}, beside the panel ${outside.toFixed(1)}, its border ${edge.toFixed(1)}, ` +
      `outward ${outward.map((v) => v.toFixed(1)).join(" ")}, above ${above.toFixed(1)}, below ${below.toFixed(1)}`,
  );
  check(`${name}: the page beside the panel is darker than the page`, outside < far, true);
  // a gradient: every step away from the panel is at least as light as the one before
  check(
    `${name}: the shadow fades outwards`,
    outward.every((v, i) => i === 0 || v >= outward[i - 1]!),
    true,
  );
  check(`${name}: the panel's edge still sits above its shadow`, edge > outside, true);
  check(`${name}: more shadow below the panel than above it`, below < above, true);
  // the shadow goes under the panel, not over it: two points of the panel's own surface, one of them near the shadow
  check(`${name}: the shadow does not tint the panel`, at(x! + 6, y! + h! - 6), at(x! + 100, y! + h! - 6));
  const root = p.box("Root");
  check(
    `${name}: the page and its panel fit the window`,
    root[1]! + root[3]! <= size.height && y! + h! <= size.height,
    true,
  );
}

for (const theme of [undefined, "light"]) {
  const name = theme ?? "dark";
  const p = fresh(theme);
  p.tap("Tab"), p.tap("Tab"), p.tap("Enter");
  p.settle();
  const [x, y, w, h] = p.box("zoom-menu");
  const below = at(x! + 8, y! + h! + 1);
  const clear = at(x! + 8, y! + h! + 16);
  const left = at(x! - 1, y! + h! / 2);
  const leftClear = at(x! - 24, y! + h! / 2);
  console.log(
    `menu shadow (${name}): page ${clear.toFixed(1)}, below the menu ${below.toFixed(1)}, ` +
      `left of it ${left.toFixed(1)} against ${leftClear.toFixed(1)}`,
  );
  check(`${name}: the menu has a shadow below it`, below < clear, true);
  check(`${name}: the menu has a shadow to its left`, left < leftClear, true);
  check(`${name}: the menu fits the window`, y! + h! <= size.height, true);
}

// --- the value channel (ui.value): the menu slides out of its trigger and its shadow's blur grows with it, each from a
// track (src/motion.ts) written for the menu's id before the tree is declared. The offset is the menu's y less the
// trigger's bottom, which is where its float attaches it. Its targets are the style's own offset and blur, so a settled
// frame is the literal's (the stored `frames/dialog-menu.png` is byte-identical to the one before the channel).
{
  const p = fresh();
  p.tap("Tab"), p.tap("Tab");
  const trigger = p.box("zoom-trigger");
  const offset = () => p.box("zoom-menu")[1]! - (trigger[1]! + trigger[3]!);
  const beside = () => {
    const [x, y, w, h] = p.box("zoom-menu");
    return at(x! - 1, y! + h! / 2);
  };
  p.down("Enter"); // the frame the menu appears on: the entry value, a shadow with no blur
  const offsets = [offset()];
  const besideLum = [beside()];
  for (let n = 0; n < 20; n++) p.step(), offsets.push(offset()), besideLum.push(beside());
  const page = at(4, 470);
  console.log(
    `menu arrival: offsets ${offsets
      .slice(0, 15)
      .map((v) => v.toFixed(2))
      .join(", ")}; beside the menu ${besideLum[0]!.toFixed(1)} -> ${besideLum.at(-1)!.toFixed(1)} ` +
      `(the page ${page.toFixed(1)})`,
  );
  check("the menu appears 10px below the style's offset", Math.abs(offsets[0]! + 10) < 0.005, true);
  check("every frame of the slide moves it towards the offset", offsets.slice(0, 10).every((v, i) => i === 0 || v < offsets[i - 1]!), true);
  check("no frame of the slide passes the offset", offsets.every((v) => v >= -20.01), true);
  check("and it settles on exactly the style's own offset", Math.abs(offsets.at(-1)! + 20) < 0.005, true);
  check("the slide is over by the twentieth frame", new Set(offsets.slice(-5).map((v) => v.toFixed(3))).size, 1);
  check("the menu's shadow has no blur on its first frame (the page is beside it)", besideLum[0], page);
  check("its blur darkens the page beside the menu as it grows", besideLum.at(-1)! < page - 3, true);
  check("frame by frame, never lighter", besideLum.every((v, i) => i === 0 || v <= besideLum[i - 1]! + 0.01), true);

  // a reopen mid-slide: `Show` unmounts the menu, so its clock stops with it (there is no exit animation yet) and the
  // track keeps the value it froze on; the reopen retargets from that, never from the entry
  const q = fresh();
  q.tap("Tab"), q.tap("Tab");
  const anchor = q.box("zoom-trigger");
  const off = () => q.box("zoom-menu")[1]! - (anchor[1]! + anchor[3]!);
  q.down("Enter");
  q.step();
  const mid = off();
  q.tap("Escape");
  check("Escape closes the menu mid-slide", q.menuOpen(), false);
  q.down("Enter");
  const back = off();
  console.log(`reopen: closed at ${mid.toFixed(2)}, reopened at ${back.toFixed(2)} (a jump of ${(back - mid).toFixed(3)})`);
  check("a reopen starts from the value it froze on, not from the entry", Math.abs(back - mid) < 0.005, true);
  check("so its step is no bigger than the opening's first", Math.abs(back - mid) <= Math.abs(offsets[1]! - offsets[0]!), true);
  q.settle();
  check("and it goes on to settle on the style's offset", Math.abs(off() + 20) < 0.005, true);
}

// --- the dialog's drop: its float's offset y from 14px above its place to 0, and its shadow's blur 0 to the style's 32
{
  const p = fresh();
  for (let n = 0; n < 4 && p.focused() !== "settings-trigger"; n++) p.tap("Tab");
  p.down("Enter");
  const ys = [p.box("settings-dialog")[1]!];
  for (let n = 0; n < 30; n++) p.step(), ys.push(p.box("settings-dialog")[1]!);
  const h = p.box("settings-dialog")[3]!;
  const rest = size.height / 2 - h / 2;
  console.log(
    `dialog drop: y ${ys
      .slice(0, 15)
      .map((v) => v.toFixed(2))
      .join(", ")}; at rest ${rest.toFixed(2)}`,
  );
  check("the dialog appears 14px above its place", Math.abs(ys[0]! - (rest - 14)) < 0.01, true);
  check("it drops towards its place every frame", ys.slice(0, 10).every((v, i) => i === 0 || v > ys[i - 1]!), true);
  check("and is at its place, not past it", Math.abs(ys.at(-1)! - rest) < 0.01, true);
  check("the drop is finite: its last frames are the same", new Set(ys.slice(-5).map((v) => v.toFixed(3))).size, 1);
}

// --- the backdrop (css.backdrop): the page under the menu is blurred, the menu's own pixels are not
// The reference frame is the same page with the style dropped (the app's `glass` prop), so the only difference between
// the two is the blur: not a stored second frame, an A/B of one process.
const packed = (x: number, y: number) => {
  const [r, g, b, a] = ui.pixel(x, y);
  return (r! | (g! << 8) | (b! << 16) | (a! << 24)) >>> 0;
};
function capture(theme: string | undefined, glass: boolean) {
  const p = fresh(theme, glass);
  p.tap("Tab"), p.tap("Tab"), p.tap("Enter");
  p.settle(); // the glass and the shadow are the settled ones: the blur is a function of the box
  const menu = [...p.box("zoom-menu")];
  const trigger = [...p.box("zoom-trigger")];
  const px = new Array<number>(size.width * size.height);
  for (let y = 0; y < size.height; y++)
    for (let x = 0; x < size.width; x++) px[y * size.width + x] = packed(x, y);
  const rgb = (x: number, y: number) => {
    const v = px[y * size.width + x]!;
    return [v & 255, (v >> 8) & 255, (v >> 16) & 255];
  };
  return { menu, trigger, px, rgb };
}
const step = (a: number[], b: number[]) => Math.max(...a.map((v, i) => Math.abs(v - b[i]!)));
for (const theme of [undefined, "light"]) {
  const name = theme ?? "dark";
  const glass = capture(theme, true);
  const plain = capture(theme, false);
  const [mx, my, mw, mh] = glass.menu as [number, number, number, number];
  // the device-pixel rect the renderer blurs: the box rounded out to whole pixels
  const [bx0, by0] = [Math.floor(mx), Math.floor(my)];
  const [bx1, by1] = [Math.ceil(mx + mw), Math.ceil(my + mh)];
  // a pixel of the menu over the trigger's bottom border: a hard edge in the page under the glass
  const edge = Math.round(glass.trigger[1]! + glass.trigger[3]!) - 1;
  const col = Math.round(mx + 120);
  const under = glass.rgb(col, edge);
  const plainUnder = plain.rgb(col, edge);
  // ... and a 1px scan down across it, inside the menu: past the top border and the first item's focus ring, which are
  // the menu's own crisp pixels, and over the trigger's border alone
  const scan = (fx: (x: number, y: number) => number[], y0: number, y1: number, x: number) => {
    const lines: number[][] = [];
    for (let y = y0; y <= y1; y++) lines.push(fx(x, y));
    return lines.reduce((m, v, i) => (i ? Math.max(m, step(v, lines[i - 1]!)) : m), 0);
  };
  const scanGlass = scan(glass.rgb, by0 + 10, by0 + 26, col);
  const scanPlain = scan(plain.rgb, by0 + 10, by0 + 26, col);
  console.log(
    `backdrop (${name}): over the trigger's border ${under.join(",")} against ${plainUnder.join(",")}, ` +
      `max step down the scan ${scanGlass} against ${scanPlain} without the backdrop`,
  );
  check(`${name}: the glass differs from the page under it (the blur moved the edge)`, step(under, plainUnder) >= 8, true);
  check(`${name}: the border's step is soft under the glass`, scanGlass <= Math.max(2, scanPlain / 2), true);
  check(`${name}: no single-channel step over 8 in the scan`, scanGlass <= 8, true);
  // outside the menu's box the frame is the reference's: the blur did not leak
  let leaked = 0;
  let worst = 0;
  for (let y = 0; y < size.height; y++)
    for (let x = 0; x < size.width; x++) {
      if (x >= bx0 && x < bx1 && y >= by0 && y < by1) continue;
      const [a, b] = [glass.px[y * size.width + x]!, plain.px[y * size.width + x]!];
      if (a !== b) leaked++, (worst = Math.max(worst, step(glass.rgb(x, y), plain.rgb(x, y))));
    }
  check(`${name}: the blur does not leak outside the menu's box`, leaked, 0);
  console.log(`backdrop (${name}): ${leaked} pixels differ outside the box (worst channel ${worst})`);
  // the menu's own text is drawn after the blur: its ink box is the reference's, give or take a pixel
  const inkBox = (f: (x: number, y: number) => number[], x0: number, y0: number, x1: number, y1: number) => {
    // the text's ink is far from what the glass leaves of the page (60/255 is well past its edge)
    const base = f(x0, y0);
    let [left, top, right, bottom, n] = [Infinity, Infinity, -Infinity, -Infinity, 0];
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++)
        if (step(f(x, y), base) >= 60)
          (n++,
            (left = Math.min(left, x)),
            (top = Math.min(top, y)),
            (right = Math.max(right, x)),
            (bottom = Math.max(bottom, y)));
    return { n, box: [left, top, right, bottom] };
  };
  // the "125%" row: the second item's label, over a flat stretch of the page, so the two backgrounds agree
  const label: [number, number, number, number] = [
    Math.round(mx + 8),
    Math.round(my + 42),
    Math.round(mx + 60),
    Math.round(my + 62),
  ];
  const g1 = inkBox(glass.rgb, ...label);
  const p1 = inkBox(plain.rgb, ...label);
  console.log(
    `backdrop (${name}): the label's ink box ${g1.box.join(",")} (${g1.n} px) against ${p1.box.join(",")} (${p1.n} px)`,
  );
  check(`${name}: the menu's text is not blurred`, g1.n > 40 && step(g1.box, p1.box) <= 1, true);
}

dispose();
if (failed) process.exit(1);
console.log(
  "solid/dialog.test.ts: the modal trap, Escape and Cancel, OK's write, the backdrop, the floats' placement, the menu's keys, the shadows, the backdrop blur, the menu's slide and the dialog's drop",
);
process.exit(0);
