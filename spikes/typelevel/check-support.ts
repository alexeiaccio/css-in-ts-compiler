// node check-support.ts — support warnings (defaults targets) and prose rules, both ways.
import { checkRules } from "./rules.ts";
import { message, support } from "./support.ts";

let failed = false;
const expect = (ok: boolean, what: string) => {
  if (!ok) failed = true;
  console.log(`${ok ? "ok  " : "FAIL"} ${what}`);
};

const warns: [string, string, string | null][] = [
  ["text-transform", "full-width", "css.properties.text-transform.full-width"],
  ["width", "fit-content(10px)", "css.properties.width.fit-content_function"],
  ["align-items", "anchor-center", "css.properties.align-items.anchor-center"],
  ["display", "flex", null],
  ["color", "rgb(1 2 3)", null],
  ["font-family", '"full-width", serif', null],
];
for (const [p, v, key] of warns) {
  const ws = support(p, v);
  ws.forEach((w) => console.log(`     ${message(p, v, w)}`));
  expect(key ? ws.some((w) => w.key === key && w.lacking.some((t) => t.startsWith("chrome "))) : ws.length === 0, `${p}: ${v} ${key ? "warns" : "no warning"}`);
}

const rules: [string, string, boolean][] = [
  ["transition", "none, opacity 1s", false],
  ["transition", "opacity 1s, none", false],
  ["transition", "none", true],
  ["transition", "none 1s", true],
  ["transition", "opacity 1s cubic-bezier(0, 0, 1, 1), color 2s", true],
  ["font-family", "system-ui foo", false],
  ["font-family", "Arial serif", false],
  ["font-family", "a, inherit", false],
  ["font-family", "system-ui, Open Sans, serif", true],
  ["font-family", '"system-ui foo", Serif', true],
  ["font-family", "inherit", true],
];
for (const [p, v, ok] of rules) {
  let err = "";
  try {
    checkRules(p, v);
  } catch (e) {
    err = (e as Error).message;
  }
  if (err) console.log(`     ${err}`);
  expect(!err === ok, `${p}: ${v} ${ok ? "ok" : "error"}`);
}
process.exit(failed ? 1 : 0);
