// The command-stream goldens (Rune's item 5): each page's last frame compared as data — the command array with every
// field a draw reads, the renderer's tables beside it (shadow, backdrop, gradient, group, text weight) and the
// accessibility snapshot — against solid/goldens/<page>.json. The pixels stay the final gate (solid/test.sh); when 300
// of them move, this is the test that says which command and which field:
//
//   FAIL sensors: command 2 (text "accel m/s²") colour 150/155/170/255 -> 160/165/180/255
//
// Re-store a page after a deliberate change with `bun solid/dump.ts <page> --update`.
import "./plugin.ts";

import { readFileSync } from "node:fs";

import type { PageDump } from "./src/dump.ts";

// ... and the page renderer is imported dynamically for the same reason the script's is (a static import would load
// solid-js's server build): only `./plugin.ts` may be a static import here.
const { capture, nodes, PAGES } = await import("./dump.ts");
type PageName = keyof typeof PAGES;

const golden = (name: PageName) => new URL(`./goldens/${name}.json`, import.meta.url).pathname;
const primitive = (v: unknown) => v === null || typeof v !== "object";
const flat = (v: unknown[]) => v.every(primitive);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
/** A value as a line prints it: a box or a colour as its numbers, a string quoted, nothing as "(absent)". */
const show = (v: unknown) =>
  v === undefined ? "(absent)" : Array.isArray(v) ? v.map((x) => String(x)).join("/") : JSON.stringify(v);

/** The field names a page reads better than the JSON spells them. */
const DISPLAY: Record<string, string> = { color: "colour" };

/** "commands[3].color" is `command 3 (text "switch to g") colour`, the command's own type and text in the message. */
function where(path: string, goldenPage: PageDump): string {
  const m = /^commands\[(\d+)\](.*)$/.exec(path);
  if (m === null) return path;
  const command = goldenPage.commands[Number(m[1])];
  const text = typeof command?.text === "string" ? ` ${JSON.stringify(command.text)}` : "";
  const rest = m[2]!.replace(/^\.([a-z]+)/, (_, key: string) => ` ${DISPLAY[key] ?? key}`);
  return `command ${m[1]} (${command?.type}${text})${rest}`;
}

/** The extra a value needs when it is one that moved: an id that is another command's is out of order. */
function hint(path: string, got: unknown, goldenPage: PageDump): string {
  const m = /^commands\[(\d+)\]\.id$/.exec(path);
  if (m === null) return "";
  const at = goldenPage.commands.findIndex((command) => command.id === got);
  return at >= 0 && at !== Number(m[1]) ? ` (that is command ${at} in the golden: the order moved)` : "";
}

/** Every difference between a golden and the frame (at most a handful, the first one is the message), path by path. */
function compare(want: unknown, got: unknown, path: string, out: string[], goldenPage: PageDump): void {
  if (out.length >= 6) return;
  const place = where(path, goldenPage);
  if (Array.isArray(want) && Array.isArray(got)) {
    if (flat(want) && flat(got)) {
      // a colour, a box, a set of widths: one value with its numbers joined, not four diffs
      if (want.length !== got.length || want.some((v, i) => v !== got[i]))
        out.push(`${place} ${show(want)} -> ${show(got)}`);
      return;
    }
    if (want.length !== got.length) out.push(`${place}: ${want.length} -> ${got.length}`);
    for (let i = 0; i < Math.min(want.length, got.length); i++) compare(want[i], got[i], `${path}[${i}]`, out, goldenPage);
    return;
  }
  if (isObject(want) && isObject(got)) {
    // the keys the golden and the frame disagree on: a field that appeared or vanished is a difference too
    const keys = [...new Set([...Object.keys(want), ...Object.keys(got)])].sort();
    for (const key of keys) compare(want[key], got[key], path === "" ? key : `${path}.${key}`, out, goldenPage);
    return;
  }
  if (want !== got) out.push(`${place} ${show(want)} -> ${show(got)}${hint(path, got, goldenPage)}`);
}

let failed = 0;
for (const name of Object.keys(PAGES) as PageName[]) {
  const want = JSON.parse(readFileSync(golden(name), "utf8")) as PageDump;
  const got = await capture(name);
  const diffs: string[] = [];
  compare(want, got, "", diffs, want);
  if (diffs.length > 0) {
    failed++;
    console.error(`FAIL ${name}: ${diffs[0]}`);
    for (const line of diffs.slice(1)) console.error(`FAIL ${name}: ${line}`);
    console.error(`  re-store it with: bun solid/dump.ts ${name} --update`);
  } else console.log(`${name}: ${got.commands.length} commands, ${nodes(got.a11y)} a11y nodes, identical`);
}
if (failed) process.exit(1);
console.log(`dump.test.ts: ${Object.keys(PAGES).length} pages, the same commands, tables and a11y tree`);
