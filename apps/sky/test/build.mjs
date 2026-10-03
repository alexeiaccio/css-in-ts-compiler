// The build check, as the demo's in packages/cssints/test/sheet.mjs: one CSS file with the layer order first, the
// classes Solid compiled into its template, and none of the engine in the JavaScript.
// The working directory is the project, as in a user's build: icons() reads @iconify-json/* from it.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { build } from "vite";

process.chdir(`${import.meta.dirname}/..`);
const out = await build({ root: process.cwd(), logLevel: "warn", build: { write: false } });
const files = [out].flat().flatMap((o) => o.output);
const css = files.filter((f) => f.fileName.endsWith(".css"));
assert.equal(css.length, 1);
const sheet = String(css[0].source);
assert.ok(sheet.startsWith("@layer "), sheet);
assert.match(
  sheet,
  /@container column \(width ?< ?500px\)\{[^@]*\._\w+\{padding-inline:var\(--gutter-compact\)/,
); // container()
assert.match(
  sheet,
  /@media \(width ?>= ?1300px\)\{[^@]*grid-template-columns:var\(--layout-left-nav-width\)/,
); // media()
assert.match(sheet, /\._\w+\{--fr-r:var\(--radius-lg\)\}/); // frame()
assert.match(sheet, /\._\w+\{--_svg:url\(/); // the icon

// the post card (src/post): the card's own width through container(), concentric radii through frame(), tonal steps through
// surface(); the only radius written for the card is its own, the quote and the media inside get theirs from the kernel
assert.match(sheet, /@container post \(width ?>= ?28rem\)\{[^@]*grid-column:2/); // avatar beside the text when wide
assert.match(sheet, /@container post \(width ?>= ?28rem\)\{[^@]*grid-template-columns:repeat\(3/); // media columns
assert.match(sheet, /@container post \(width ?>= ?28rem\)\{[^@]*--fr-p:\.75rem/); // a wide card pads more, the quote follows
assert.match(sheet, /\._\w+\{--fr-r:var\(--radius-xl\)\}/); // the card's radius
assert.match(sheet, /@container style\(--fr-c: ?e\)/); // the frame kernel
assert.match(sheet, /\._\w+\{--sf-d:\.04\}/); // surface().lighten(0.04): the card above the feed
assert.match(sheet, /\._\w+\{--sf-d:calc\(\.03 \* clamp\(/); // surface().contrast(0.03): the quote away from the card
assert.match(sheet, /@container style\(--sf-p: ?e\)/); // the surface kernel
const embeds = readFileSync("src/post/Embed.tsx", "utf8");
assert.ok(
  !embeds.includes(".radius("),
  "no frame of the quote or the media has a radius of its own",
);
assert.equal(embeds.match(/borderRadius\(/g).length, 1, "only the play mark's disc");

// the home screen: the skeleton's shimmer is a keyframes() rule used by one class, and prefers-reduced-motion switches it
// (and the tab indicator's slide) off; the tab bar sticks under the 52 px header and slides its indicator with a transition
assert.match(
  sheet,
  /@keyframes kf-\w+\{0%\{background-position:200% 0\}to\{background-position:-200% 0\}\}/,
);
assert.match(sheet, /\._\w+\{animation:1\.4s linear infinite kf-\w+\}/);
assert.match(sheet, /@media \(prefers-reduced-motion: ?reduce\)\{[^@]*\._\w+\{animation:none\}/);
assert.match(sheet, /@media \(prefers-reduced-motion: ?reduce\)\{[^@]*\._\w+\{transition:none\}/);
assert.match(sheet, /\._\w+\{transition:transform \.25s ease-out\}/); // the indicator
assert.match(sheet, /\._\w+\{top:var\(--layout-header-height\)\}/); // under the header
assert.match(sheet, /\._\w+:hover\{--sf-d:calc\(\.03 \* -1\)\}/); // a tab a step darker on hover (surface().darken)
assert.equal(sheet.match(/@keyframes kf-/g).length, 1, "one rule, however many skeletons use it");

// the profile header (src/profile/Header.tsx): its layout is the column's container, not the window's: the avatar beside the name
// and 96 px by default, stacked and 72 px under 500 px of column; the avatar's radius is the token the square flag moves
assert.match(sheet, /@container column \(width ?< ?500px\)\{[^@]*\._\w+\{flex-direction:column\}/);
assert.match(sheet, /@container column \(width ?< ?500px\)\{[^@]*\._\w+\{width:72px\}/);
assert.match(sheet, /\._\w+\{width:96px\}/);
assert.match(sheet, /\._\w+\{border-radius:var\(--radius-avatar\)\}/);
assert.match(sheet, /\._\w+\{aspect-ratio:3\}/); // the banner, 3:1
assert.match(sheet, /\._\w+\{font-family:inherit\}/); // a CSS-wide keyword is a value of every property

// the themes: the system's dark is the media query, a class beats it; the accent steps keep the hue (a reference in an override)
assert.match(sheet, /@media \(prefers-color-scheme: ?dark\)\{:root\{--color-bg:#000/);
for (const mode of [".light", ".dim", ".dark"])
  assert.ok(sheet.includes(`${mode}{--color-bg:`), mode);
assert.match(sheet, /\.dim\{[^}]*--color-accent-hover:oklch\(\.697 \.177 var\(--hue-accent\)\)/);
assert.ok(!sheet.includes("accent-tone"), "no accentTone workaround");
assert.match(sheet, /@media \(width ?>= ?800px\)\{:root\{--gutter-compact:12px;--gutter-base:20px/);

// Witchsky's square flags are theme classes that point the radius tokens at smaller ones; the shell reads them, and so does
// a frame() (its radius is the token)
assert.match(
  sheet,
  /:root\{[^}]*--radius-button:var\(--radius-full\);--radius-avatar:var\(--radius-full\)/,
);
assert.match(sheet, /\.square-buttons\{--radius-button:var\(--radius-sm\)\}/);
assert.match(
  sheet,
  /\.square-avatars\{--radius-avatar:var\(--radius-sm\);--radius-avatar-small:3px\}/,
);
assert.match(sheet, /\._\w+\{border-radius:var\(--radius-button\)\}/); // the nav items
assert.match(sheet, /\._\w+\{--fr-r:var\(--radius-button\)\}/); // a frame on the token
assert.match(sheet, /\._\w+\{border-radius:var\(--radius-avatar-small\)\}/);
assert.match(
  sheet,
  /@property --radius-button\{syntax:"<length>";inherits:true;initial-value:999px\}/,
);
// the page colour is set on <html>, so the first frame has it before a component is drawn: a global rule (src/base.ts), in
// layer _.k, before the layers of the classes
assert.match(sheet, /html\{background-color:var\(--color-bg\)\}/);
assert.match(sheet, /\*,:before,:after\{box-sizing:border-box\}/);
assert.ok(
  sheet.indexOf("button{font-family:inherit}") < sheet.indexOf("@layer _.a{"),
  "globals come first",
);
// the active nav item reads the attribute the router sets, and the card's timestamp the card's hover
assert.match(sheet, /\._\w+\[aria-current=page\]\{font-weight:var\(--font-weight-bold\)\}/); // attr()
assert.match(sheet, /:where\(\._g:hover\) \._\w+\{color:var\(--color-text\)\}/); // within()

// Inter, self-hosted, with its licence
assert.match(sheet, /font-family:"?Inter Variable"?/);
assert.ok(existsSync("public/fonts/inter/OFL.txt"));
assert.ok(existsSync("public/fonts/inter/inter-latin-wght-normal.woff2"));

const js = files.find((f) => f.fileName.endsWith(".js"));
assert.match(js.code, /<main class="_\w+( _\w+)+">/, "Solid kept the classes in its template");
assert.match(js.code, /_cv\(\{/, "the cv() config is class strings");
assert.ok(!/createTokens|css-grammar|toDecls/.test(js.code), "no engine code in the client");
const all = files
  .filter((f) => f.fileName.endsWith(".js"))
  .map((f) => f.code)
  .join("");
assert.match(all, /class="_f _s _\w+( _\w+)*"/, "the card's classes are in Solid's template");
assert.ok(!all.includes("quoteDetached"), "the dev page and its recorded posts are not in a build");
// the thread screen: the focused post is a cv() variant of the card (class strings in the config, its font size in the sheet), and
// the connector lines are placed from the avatar's centre, narrow and (inside the card's own container) wide
assert.match(
  all,
  /"variants": \{ "look": \{ "focus": "_\w+" \} \}/,
  "the focused card is a cv() variant",
);
assert.match(sheet, /\._\w+\{font-size:var\(--font-size-xl\)\}/);
assert.match(
  sheet,
  /\._\w+\{margin-left:calc\(var\(--border-width\) ?\+ ?\.5rem ?\+ ?var\(--avatar-feed\) ?\/ ?2 ?- ?1px\)\}/,
);
assert.match(
  sheet,
  /@container post \(width ?>= ?28rem\)\{[^@]*margin-left:calc\(var\(--border-width\) ?\+ ?\.75rem ?\+ ?var\(--avatar-feed\) ?\/ ?2 ?- ?1px\)/,
);
assert.ok(all.includes("Show ") && all.includes("more "), "the collapsed branch has its button");

// the token fallbacks (cssints-33pa; the default targets hold chrome 109, which has no oklch()): the initial value is a
// hex colour and the :root value is the default, the live colour of the hue comes under @supports of the literal
assert.match(sheet, /@property --color-accent\{[^}]*initial-value:#[0-9a-f]{6}\}/);
assert.match(sheet, /@property --color-shadow\{[^}]*initial-value:#[0-9a-f]{6,8}\}/);
assert.match(sheet, /:root\{[^}]*--color-accent:#[0-9a-f]{6}[;}]/);
assert.match(
  sheet,
  /@supports \(color: ?oklch\(0\.637 0\.203 345\)\)\{:root\{--color-accent:oklch\(\.637 \.203 var\(--hue-accent\)\)\}\}/,
);
console.log(
  `sky build: ${css[0].fileName} ${sheet.length} bytes, ${js.fileName} ${js.code.length} bytes`,
);
process.exit(0);
