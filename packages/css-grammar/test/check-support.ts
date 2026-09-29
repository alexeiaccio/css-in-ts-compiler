// node check-support.ts — support warnings (defaults targets) and prose rules, both ways.
import { checkRules, message, support } from "./sync.ts";

let failed = false;
const verify = (ok: boolean, what: string) => {
  if (!ok) failed = true;
  console.log(`${ok ? "ok  " : "FAIL"} ${what}`);
};

const warns: [string, string, string | null][] = [
  ["text-transform", "full-width", "css.properties.text-transform.full-width"],
  ["width", "fit-content(10px)", "css.properties.width.fit-content_function"],
  ["align-items", "anchor-center", "css.properties.align-items.anchor-center"],
  ["flex-basis", "fit-content(10px)", "css.properties.width.fit-content_function"],
  ["display", "flex", null],
  ["color", "rgb(1 2 3)", null],
  ["font-family", '"full-width", serif', null],
];
for (const [p, v, key] of warns) {
  const ws = support(p, v);
  ws.forEach((w) => console.log(`     ${message(p, v, w)}`));
  verify(key ? ws.some((w) => w.key === key && w.lacking.some((t) => t.startsWith("chrome "))) : ws.length === 0, `${p}: ${v} ${key ? "warns" : "no warning"}`);
}
// a target without the property gets the property warning only, not one per value
const ws = support("white-space-collapse", "preserve-spaces", [["firefox", "120"], ["chrome", "120"]]);
verify(JSON.stringify(ws.map((w) => [w.feature, w.lacking])) === '[["white-space-collapse",["firefox 120"]],["preserve-spaces",["chrome 120"]]]', `white-space-collapse: preserve-spaces on firefox 120 warns for the property only`);

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
  ["transition", "ease-in allow-discrete steps(2)", false],
  ["transition", "ease linear 1s -2s, normal allow-discrete", true],
  ["transition", "opacity -1s -2s", false],
  ["transition", "opacity 1s -1s", true],
  ["transition", "opacity 1s steps(0)", false],
  ["transition", "opacity 1s steps(1, jump-none)", false],
  ["transition", "opacity 1s steps(1), color 1s steps(2, jump-none)", true],
  ["width", "calc-size(any, 5)", false],
  ["width", "calc-size(any, 1px + 2)", false],
  ["width", "calc-size(any, 1px * 1px)", false],
  ["height", "calc-size(1deg, 1px)", false],
  ["width", "calc-size(any, (1px + 50%) * 2 - 1em / 4)", true],
  ["max-width", "calc-size(calc-size(any, 1px), 50%)", true],
  ["flex-basis", "calc-size(any, 5)", false],
  ["flex-basis", "anchor-size(width)", false],
  ["width", "anchor-size(width)", true],
  ["margin-top", "anchor-size(--a height, 1px)", true],
];
for (const [p, v, ok] of rules) {
  let err = "";
  try {
    checkRules(p, v);
  } catch (e) {
    err = (e as Error).message;
  }
  if (err) console.log(`     ${err}`);
  verify(!err === ok, `${p}: ${v} ${ok ? "ok" : "error"}`);
}
process.exit(failed ? 1 : 0);
