// keyframes() and positionTry(): a typed name, the at-rule as a kernel of the modules that use it, the dedupe of
// identical blocks, and build errors at the call site (fixtures/keyframes-*.ts). Run: node keyframes.mjs
import assert from "node:assert/strict";
import { stripVTControlCharacters } from "node:util";

process.env.BROWSERSLIST = "chrome 100, safari 15.2";
const { createLogger, createServer } = await import("vite");
const { default: cssints } = await import("../src/plugin.ts");

const warnings = [];
const plugins = cssints();
const server = await createServer({
  root: import.meta.dirname,
  configFile: false,
  customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
  server: { middlewareMode: true, watch: null },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/fixtures/${f}`)).code;
const sheet = (f) => plugins[0].api.sheet([`${import.meta.dirname}/fixtures/${f}`]);

const out = await code("keyframes-use.ts");
const str = (n) => new RegExp(`export const ${n} = "([^"]+)"`).exec(out)?.[1];
const fade = str("own");
assert.match(fade, /^kf-[0-9a-f]{8}$/, "a keyframes() of a client module ships as its name");
assert.ok(!out.includes("keyframes") && !out.includes("kit"), "build-time imports are gone");
assert.match(str("a"), /^_\w+$/, "a: one class");
assert.equal(str("c").split(" ").length, 2, "c: cn() of two classes");

// The sheet of the module: its rules, in layer _.k, once; the unused rule and the token-less ones are not there.
const css = sheet("keyframes-use.ts");
const spin = /@keyframes (kf-\w+)\{from\{transform/.exec(css)[1];
const above = /@position-try (--pt-\w+)/.exec(css)[1];
const rule = (text) => assert.ok(css.includes(text), `${text}\n${css}`);
rule(`@keyframes ${fade}{from{opacity:0}to{opacity:1}}`);
rule(`@keyframes ${spin}{from{transform:rotate(0deg)}50%{transform:rotate(180deg);opacity:var(--kf-scale)}to{transform:rotate(360deg)}}`);
rule(`@position-try ${above}{top:anchor(bottom);margin:0.5rem}`);
rule(`animation:${spin} 1s linear infinite`);
rule(`animation-name:${fade}`);
rule(`position-try-fallbacks:${above} flip-block`);
rule("@property --kf-scale");
assert.equal(css.match(/@keyframes/g).length, 2, "fade and fadeAgain are one rule; unused is not in the sheet");
assert.ok(css.indexOf("@keyframes") > css.indexOf("@layer _.k {") && css.indexOf("@keyframes") < css.indexOf("@layer _.a {"), "in _.k");
assert.ok(!sheet("keyframes-plain.ts").includes("@keyframes"), "a module that does not use a name has no rule");
assert.ok(!sheet("keyframes-plain.ts").includes("@position-try"));

// The property of the same name still works with value parts.
assert.match(await code("position-try-prop.ts"), /export const a = "_\w+"/);
assert.ok(sheet("position-try-prop.ts").includes("position-try:flip-block"));

// Support: a target without @position-try gets one warning, naming the kernel.
const lines = warnings.map((w) => stripVTControlCharacters(w.split("\n")[0]).replace(/^.*warning: /, ""));
assert.ok(lines.some((l) => l.startsWith(`kernel @position-try ${above} needs css.at-rules.position-try, not supported by chrome 100`)), lines.join("\n"));

// Build errors, at the call site (the line of the `keyframes(` / `positionTry(` / `animation(` call).
for (const [f, text, line] of [
  ["keyframes-bad-decl", /^cssints: keyframes\(\) "to": opacity: unexpected "lots"/, 3],
  ["keyframes-bad-step", /^cssints: keyframes\(\) step "101%" is not from, to or a percentage from 0% to 100%$/, 3],
  ["keyframes-cond", /^cssints: keyframes\(\) "from" takes declarations without conditions or firstThatWorks\(\.\.\.\), got opacity$/, 3],
  ["keyframes-fallback", /^cssints: firstThatWorks\(\) cannot hold kf-\w+: a keyframes\(\) or positionTry\(\) name carries its at-rule/, 4],
  ["position-try-bad-prop", /^cssints: positionTry\(\): padding is not allowed in @position-try, which takes inset, margin, sizing/, 3],
  ["position-try-bad-value", /^cssints: positionTry\(\): position-area: unexpected "sideways"/, 3],
]) {
  await assert.rejects(code(`${f}.ts`), (e) => {
    assert.match(e.message.split("\n")[0], text);
    assert.equal(e.loc?.line, line, `${f}: the call site`);
    return true;
  });
}

await server.close();
console.log("keyframes: ok");
