// The system theme's solver on three known palettes (every role meets its contrast, keeps its source's hue, is no more
// colourful than its source), its fallbacks and the appearance, the parser of the terminal's replies on byte strings,
// and the run-time table it fills. Run: node test/system.ts
import assert from "node:assert/strict";

import { converter, parse } from "culori/fn";

import { followSystemTheme } from "../src/bomb-system.ts";
import { defineTheme, resolve, setTheme, theme } from "../src/index.ts";
import {
  contrast,
  createSystemTheme,
  NOTIFY,
  QUERY,
  type Report,
  type Role,
  scan,
  SLOTS,
  UNNOTIFY,
} from "../src/system.ts";

const oklch = converter("oklch");
const lch = (hex: string) => oklch(parse(hex)!);

// createTokens at run time: each leaf is its var()
const c = {
  color: Object.fromEntries(
    [
      "bg",
      "card",
      "hover",
      "text",
      "muted",
      "border",
      "accent",
      "link",
      "onAccent",
      "error",
      "success",
      "warning",
    ].map((n) => [n, `var(--color-${n})`]),
  ) as Record<string, string>,
};
const t = c.color;
const panels = [t.bg, t.card, t.hover];
const roles = {
  color: {
    bg: { surface: true },
    card: { surface: true, on: [t.bg], contrast: 1.1 },
    hover: { surface: true, on: [t.bg], contrast: 1.25 },
    text: { hue: "fg", on: panels, contrast: 7 },
    muted: { hue: "brightBlack", on: panels, contrast: 4.5 },
    border: { hue: "brightBlack", on: [t.bg, t.card], contrast: 1.6 },
    accent: { hue: "blue", on: [t.bg, t.card], contrast: 3 },
    link: { hue: "blue", on: panels, contrast: 4.5 },
    onAccent: { hue: "fg", on: [t.accent], contrast: 4.5, ansi: 15 },
    error: { hue: "red", on: panels, contrast: 4.5 },
    success: { hue: "green", on: panels, contrast: 4.5 },
    warning: { hue: "yellow", on: panels, contrast: 4.5 },
  },
} satisfies Record<string, Record<string, Role>>;
const system = createSystemTheme(c, roles, { themes: { light: "light" } });

const palette = (fg: string, bg: string, ansi: string): Report => ({
  fg,
  bg,
  ansi: ansi.split(" "),
});
const PALETTES: Record<string, [Report, "dark" | "light"]> = {
  "Gruvbox dark": [
    palette(
      "#ebdbb2",
      "#282828",
      "#282828 #cc241d #98971a #d79921 #458588 #b16286 #689d6a #a89984 #928374 #fb4934 #b8bb26 #fabd2f #83a598 #d3869b #8ec07c #ebdbb2",
    ),
    "dark",
  ],
  "Catppuccin Latte": [
    palette(
      "#4c4f69",
      "#eff1f5",
      "#5c5f77 #d20f39 #40a02b #df8e1d #1e66f5 #ea76cb #179299 #acb0be #6c6f85 #d20f39 #40a02b #df8e1d #1e66f5 #ea76cb #179299 #bcc0cc",
    ),
    "light",
  ],
  Nord: [
    palette(
      "#d8dee9",
      "#2e3440",
      "#3b4252 #bf616a #a3be8c #ebcb8b #81a1c1 #b48ead #88c0d0 #e5e9f0 #4c566a #bf616a #a3be8c #ebcb8b #81a1c1 #b48ead #8fbcbb #eceff4",
    ),
    "dark",
  ],
};

const nameOf = (token: string) => token.slice(6, -1);
const hueGap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
for (const [label, [report, appearance]] of Object.entries(PALETTES)) {
  const solved = system.solve(report);
  assert.equal(solved.appearance, appearance, label);
  assert.equal(solved.base, appearance === "light" ? "light" : "");
  const v = solved.values;
  assert.equal(v["color-bg"], report.bg, `${label}: bg is the terminal's`);
  for (const [key, role] of Object.entries(roles.color) as [string, Role][]) {
    const got = v[`color-${key}`];
    assert.match(got, /^#[0-9a-f]{6}$/, `${label} ${key}`);
    const hue = role.hue ?? (role.surface ? "bg" : "fg");
    const source =
      hue === "bg" ? report.bg! : hue === "fg" ? report.fg! : report.ansi![SLOTS.indexOf(hue)]!;
    for (const on of (role.on ?? []) as string[]) {
      const r = contrast(got, v[nameOf(on)]);
      if (role.surface)
        assert.ok(
          Math.abs(r - role.contrast!) < 0.06,
          `${label} ${key}: ${r} is not ${role.contrast}`,
        );
      else assert.ok(r >= role.contrast!, `${label} ${key} on ${on}: ${r} < ${role.contrast}`);
    }
    const [a, b] = [lch(got), lch(source)];
    assert.ok(a.c <= b.c + 0.004, `${label} ${key}: chroma ${a.c} above the source's ${b.c}`);
    if (a.c > 0.03 && b.c > 0.03)
      assert.ok(hueGap(a.h!, b.h!) < 6, `${label} ${key}: hue ${a.h} far from the source's ${b.h}`);
  }
  console.log(label, JSON.stringify(v));
}

const [gruvbox] = PALETTES["Gruvbox dark"];
const g = system.solve(gruvbox).values;
// Gruvbox's dark red misses 4.5:1 on its background: it becomes lighter; its foreground passes and is kept
assert.ok(contrast(gruvbox.ansi![1]!, gruvbox.bg!) < 4.5);
assert.ok(lch(g["color-error"]).l > lch(gruvbox.ansi![1]!).l, "the red is lighter");
assert.equal(g["color-text"], gruvbox.fg, "a source that passes is kept");
// a pastel moved darker keeps its chroma (Pi's Catppuccin Frappé case)
const pink = "#f4b8e4"; // Catppuccin Frappé's magenta, on a light background
const pastel = createSystemTheme(
  c,
  { color: { bg: { surface: true }, accent: { hue: "magenta", on: [t.bg], contrast: 4.5 } } },
  {},
).solve({ bg: "#ffffff", ansi: [...Array<undefined>(5), pink] }).values["color-accent"];
assert.ok(contrast(pastel, "#ffffff") >= 4.5);
assert.ok(lch(pastel).c <= lch(pink).c + 0.004, `${pastel} is no more vivid than ${pink}`);

// ---------- fallbacks
// only the background: the app's hues, placed for it
const app = createSystemTheme(c, roles, { hues: { blue: "#3b9cf0", fg: "#e6e9ec" } });
const bgOnly = app.solve({ bg: "#ffffff" });
assert.equal(bgOnly.appearance, "light");
assert.ok(contrast(bgOnly.values["color-link"], "#ffffff") >= 4.5);
assert.ok(hueGap(lch(bgOnly.values["color-link"]).h!, lch("#3b9cf0").h!) < 6, "the app's blue");
assert.ok(contrast(bgOnly.values["color-text"], "#ffffff") >= 7, "the app's light text, darkened");
// nothing: ANSI indices where the renderer draws them, else no values (the static theme of the appearance)
const none = system.solve({}, { indexed: true, colorfgbg: "" });
assert.deepEqual(none, {
  appearance: "dark",
  base: "",
  values: {
    "color-bg": "default",
    "color-card": "default",
    "color-hover": "default",
    "color-text": "default",
    "color-muted": "ansi:8",
    "color-border": "ansi:8",
    "color-accent": "ansi:4",
    "color-link": "ansi:4",
    "color-onAccent": "ansi:15",
    "color-error": "ansi:1",
    "color-success": "ansi:2",
    "color-warning": "ansi:3",
  },
});
assert.deepEqual(system.solve({}, { colorfgbg: "" }), { appearance: "dark", base: "", values: {} });
// the appearance: the background, then the scheme report, then COLORFGBG, then dark
assert.equal(system.solve({ scheme: "light" }, { colorfgbg: "15;0" }).appearance, "light");
assert.equal(system.solve({}, { colorfgbg: "0;15" }).appearance, "light");
assert.equal(system.solve({}, { colorfgbg: "15;default;0" }).appearance, "dark");
assert.equal(system.solve({ bg: "#202020", scheme: "light" }).appearance, "dark");
assert.equal(system.solve({}, { colorfgbg: "" }).base, "");
assert.equal(system.solve({ scheme: "light" }).base, "light");

// the roles are checked
assert.throws(
  () => createSystemTheme(c, { color: { text: { on: [t.card], contrast: 4.5 } } }),
  /color-text sits on color-card, which has no role/,
);
assert.throws(
  () =>
    createSystemTheme(c, {
      color: { card: { surface: true, on: [t.hover] }, hover: { surface: true, on: [t.card] } },
    }),
  /a cycle of on/,
);
assert.throws(() => createSystemTheme(c, { color: { nope: {} } }), /color.nope is no token/);

// ---------- the replies, as bytes
const ESC = "\x1b";
const ST = `${ESC}\\`;
const BEL = "\x07";
assert.ok(QUERY.startsWith(`${ESC}]10;?${ST}${ESC}]11;?${ST}${ESC}]4;0;?${ST}`));
assert.ok(QUERY.endsWith(`${ESC}]4;15;?${ST}${ESC}[?996n`));
const chunk =
  `j${ESC}]11;rgb:2828/2828/2828${ST}` +
  `${ESC}]10;rgb:eb/db/b2${BEL}` +
  `${ESC}]4;1;rgb:cccc/2424/1d1d${ST}k` +
  `${ESC}]4;4;#458588${BEL}${ESC}[?997;1n${ESC}[A` +
  `${ESC}]4;12;rgba:8383/a5a5/9898/ffff${ST}`;
let r = scan(chunk);
assert.equal(r.rest, `jk${ESC}[A`, "keys stay, replies go");
assert.equal(r.tail, "");
assert.equal(r.replies.bg, "#282828");
assert.equal(r.replies.fg, "#ebdbb2");
assert.equal(r.replies.scheme, "dark");
assert.deepEqual(
  [...r.replies.ansi],
  [
    [1, "#cc241d"],
    [4, "#458588"],
    [12, "#83a598"],
  ],
);
// a reply cut by the end of a chunk is kept for the next; a lone ESC (the Escape key) is not
r = scan(`q${ESC}]11;rgb:ef`);
assert.deepEqual([r.rest, r.tail], ["q", `${ESC}]11;rgb:ef`]);
r = scan(`${r.tail}f/f1/f5${ST}`);
assert.equal(r.replies.bg, "#eff1f5");
assert.deepEqual(scan(`x${ESC}`).rest, `x${ESC}`);
r = scan(`${ESC}[?99`);
assert.deepEqual([r.rest, r.tail], ["", `${ESC}[?99`]);
assert.equal(scan(`${r.tail}7;2n`).replies.scheme, "light");

// ---------- the run-time table
const style = {
  color: "#111111",
  backgroundColor: "#222222",
  themes: { light: { color: "#eeeeee" } },
  ":hover": { color: "#333333" },
  vars: { color: "color-text", ":hover": { color: "color-link" } },
};
const latte = system.apply(PALETTES["Catppuccin Latte"][0]);
setTheme("system");
assert.deepEqual(resolve(style), { color: latte.values["color-text"], backgroundColor: "#222222" });
assert.equal(resolve(style, { hover: true }).color, latte.values["color-link"]);
defineTheme("system", {}, "light");
assert.equal(resolve(style).color, "#eeeeee", "a token it leaves out: the static theme under it");
setTheme("");
assert.equal(resolve(style).color, "#111111");
// ---------- the bomb.sh follower: the queries out, the replies taken from stdin's bytes
const bytes = (s: string) => Uint8Array.from(s, (ch) => ch.charCodeAt(0));
const written: string[] = [];
const follow = followSystemTheme(system, {
  write: (s) => written.push(s),
  wait: 50,
  colorfgbg: "",
});
assert.deepEqual(written, [QUERY + NOTIFY]);
assert.equal(theme(), "system");
assert.equal(
  resolve(style).color,
  "#111111",
  "nothing yet: the static theme (no indexed colour in bomb.sh)",
);
const [nord] = PALETTES.Nord;
const answers =
  `${ESC}]10;rgb:d8/de/e9${BEL}${ESC}]11;rgb:2e/34/40${BEL}` +
  nord.ansi!.map((hex, i) => `${ESC}]4;${i};${hex}${ST}`).join("") +
  `${ESC}[?997;1n`;
const split = answers.length >> 1;
// the replies arrive with a key, cut in two chunks
assert.deepEqual([...follow.feed(bytes(`a${answers.slice(0, split)}`))], [97]);
assert.deepEqual([...follow.feed(bytes(`${answers.slice(split)}é`))], [...bytes("é")]);
await follow.ready;
const nordText = system.solve(nord).values["color-text"];
assert.equal(resolve(style).color, nordText, "every reply in: the theme of the palette");
// a change notification: the queries again, and the new replies applied as they come
follow.feed(bytes(`${ESC}[?997;2n`));
assert.equal(written.at(-1), QUERY);
follow.feed(bytes(`${ESC}]11;rgb:ff/ff/ff${BEL}${ESC}]10;rgb:00/00/00${BEL}`));
assert.notEqual(resolve(style).color, nordText);
assert.ok(contrast(resolve(style).color!, "#ffffff") >= 7);
follow.stop();
assert.equal(written.at(-1), UNNOTIFY);
// a terminal that does not answer: ready after `wait`, the static theme of COLORFGBG's appearance
defineTheme("system", {});
const silent = followSystemTheme(system, { write: () => {}, wait: 10, colorfgbg: "0;15" });
await silent.ready;
assert.equal(resolve(style).color, "#eeeeee", "light by COLORFGBG: the light theme");
silent.stop();
setTheme("");
console.log("system ok");
