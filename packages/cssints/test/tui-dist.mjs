// cssints/tui as an app gets it from a build of this package (cssints-649r): `vp pack` into a temporary
// node_modules/cssints, then an SSR build of a style module with colours, with the plugin and the members of that dist
// (no `development` condition). The members of src/ run in every other test, so a module the build drops goes unseen.
// Run: node tui-dist.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { build } from "vite";

const here = import.meta.dirname;
const tmp = join(here, ".tmp-tui-dist");
const pkg = join(tmp, "node_modules/cssints");
const app = join(tmp, "app");

rmSync(tmp, { recursive: true, force: true });
mkdirSync(app, { recursive: true });
execFileSync(join(here, "../../../node_modules/.bin/vp"), ["pack", "-d", join(pkg, "dist")], {
  cwd: join(here, ".."),
  stdio: "pipe",
});
copyFileSync(join(here, "../package.json"), join(pkg, "package.json"));
// a package of its own: without it, "cssints" is the self-reference of packages/cssints (its tracked dist)
writeFileSync(join(app, "package.json"), JSON.stringify({ type: "module" }));
writeFileSync(
  join(app, "styles.ts"),
  `import * as css from "cssints/tui" with { type: "cssints" };
const t = css.createTokens({ color: { $type: "color", bg: { $value: "#101316" } } });
export const box = css.cn(css.bg(t.color.bg), css.color("oklch(0.7 0.15 30)"), css.borderColor("red"));
`,
);

const { default: cssints } = await import(join(pkg, "dist/vite.mjs"));
const out = await build({
  root: app,
  configFile: false,
  logLevel: "warn",
  plugins: cssints(),
  build: { ssr: "styles.ts", write: false, minify: false },
});
const code = [out].flat()[0].output[0].code;
assert.match(code, /"backgroundColor": "#101316"/, code);
assert.match(code, /"color": "#ed7665"/, code);
assert.match(code, /"borderColor": "#ff0000"/, code);
rmSync(tmp, { recursive: true, force: true });
console.log("tui dist ok");
