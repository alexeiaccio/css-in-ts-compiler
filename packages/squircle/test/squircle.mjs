// @cssints/squircle through the engine: the native kernel, the classes of radius(), the mask fallback (in the sheet for
// targets without corner-shape, out of it for targets that all have it, no warning either way), the conflicts and the
// build error of the grammar. Run: node test/squircle.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import cssints from "cssints/vite";
import { createLogger, createServer } from "vite";

const root = `${import.meta.dirname}/fixtures`;
const mode = process.argv[2];
const warnings = [];
const plugins = cssints();
const server = await createServer({
  root,
  configFile: false,
  customLogger: { ...createLogger("warn"), warn: (m) => warnings.push(m) },
  server: { middlewareMode: true, watch: null, ws: false },
  plugins,
});
const client = server.environments.client;
const code = async (f) => (await client.transformRequest(`/${f}`)).code;
const failure = async (f) => {
  try {
    await code(f);
  } catch (e) {
    return e;
  }
  throw new Error(`${f} passed`);
};

const transformed = await code("use.ts");
const css = plugins[0].api.sheet([`${root}/use.ts`]);
const native =
  "._squircle-core{border-radius:var(--squircle-r);corner-shape:squircle;--squircle-r:1rem}";
const fallback = css.includes("@supports not (corner-shape:squircle)");
// the runtime covers the kernel's requires and its declarations: never a warning
assert.ok(!warnings.some((w) => w.includes("corner-shape")), warnings.join("\n"));
assert.ok(css.includes(native), css);

if (mode) {
  assert.equal(fallback, mode === "old", css);
  await server.close();
  console.log(`squircle (${mode} targets) ok`);
  process.exit(0);
}
console.log(css);

// a member is a class string, and nothing is imported at run time
assert.match(transformed, /export const a = "_squircle-core";/);
assert.match(transformed, /export const b = "_squircle-core _\w+ _\w+ _\w+";/);
assert.ok(!transformed.includes("@cssints/squircle"), transformed);
// radius() sets the custom property, under a condition too
assert.match(css, /\._\w+\{--squircle-r:24px\}/);
assert.match(css, /\._\w+:hover\{--squircle-r:2rem\}/);

// the default targets lack corner-shape: the mask, kept from browsers that have it by @supports not
assert.ok(fallback, css);
const [, svg, mask] =
  /@supports not \(corner-shape:squircle\)\{\._squircle-core\{--squircle-m:url\("data:image\/svg\+xml,([^"]+)"\);border-radius:0;mask:([^}]*)\}\}/.exec(
    css,
  ) ?? [];
assert.ok(mask, css);
assert.match(
  decodeURIComponent(svg),
  /^<svg [^>]*viewBox='-1 -1 2 2' preserveAspectRatio='none'><path d='M1 0C[^']+Z'\/><\/svg>$/,
);
const corners = mask.match(
  /var\(--squircle-m\) (0|100%) (0|100%)\/min\(2\*var\(--squircle-r\),100%\) min\(2\*var\(--squircle-r\),100%\) no-repeat/g,
);
assert.equal(corners?.length, 4, mask);
assert.equal(mask.match(/linear-gradient\(#000 0 0\) 50%\//g)?.length, 2, mask);
assert.ok(mask.includes("max(0px,100% - 2*var(--squircle-r))"), mask);

// conflicts, derived from the kernel
let e = await failure("conflict.ts");
assert.equal(
  e.message,
  "cssints: squircle: kernel core sets border-radius, corner-shape (this style also sets border-top-left-radius)",
);
assert.equal(e.loc?.line, 4);
// derived: a corner-*-shape longhand too
e = await failure("conflict-corner.ts");
assert.match(
  e.message,
  /kernel core sets border-radius, corner-shape \(this style also sets corner-top-left-shape\)/,
);
// the grammar of radius(), at build time
e = await failure("bad-radius.ts");
assert.match(
  e.message,
  /^squircle\.radius: unexpected "-4px" in "-4px", expected <length-percentage \[0,∞\]>/,
);
assert.equal(e.loc?.line, 4);
await server.close();

// targets that all have corner-shape, and ones that lack it: another process each, the targets are read once
for (const [m, targets] of [
  ["native", "chrome 139"],
  ["old", "firefox 140, safari 18"],
])
  console.log(
    execFileSync(process.execPath, [import.meta.filename, m], {
      env: { ...process.env, BROWSERSLIST: targets },
      encoding: "utf8",
    }).trim(),
  );
console.log("squircle ok");
process.exit(0);
