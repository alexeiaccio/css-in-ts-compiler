// squircle() in real browsers: a black 240×160 box with a 40px squircle radius (fixtures/app.ts), built twice and read
// back from screenshots in Chrome, Firefox and WebKit (playwright-core from node_modules/.bun; Chrome is the installed
// channel, the others Playwright's builds).
//   native    BROWSERSLIST=chrome 139: the kernel only, no mask in the sheet
//   fallback  with Firefox and Safari targets: the kernel and the mask under @supports not
//   forced    the fallback build with corner-shape cut out of the kernel and the @supports met: the mask alone, in every
//             browser (Playwright's WebKit has corner-shape, so this is how the mask runs in WebKit)
// A browser with corner-shape (CSS.supports) must show the squircle from both builds, and leave the mask off; one without
// it shows the squircle from the fallback build (the mask) and round corners from the native one, the control that lets
// the table fail. A point at (9, 9) from a corner is inside a squircle of radius 40 (its curve crosses the diagonal at
// 6.4px) and outside a round corner (11.7px).
//   node test/browsers.mjs          BROWSERS=firefox node test/browsers.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const here = import.meta.dirname;

// The targets are read once per process, so each build is a child: `--build` prints the bundle for $BROWSERSLIST.
if (process.argv[2] === "--build") {
  const { build } = await import("vite");
  const { default: cssints, cssTarget, targets } = await import("cssints/vite");
  const out = await build({
    root: join(here, "fixtures"),
    configFile: false,
    logLevel: "silent",
    plugins: cssints(),
    css: { transformer: "lightningcss", lightningcss: { targets } },
    build: {
      write: false,
      cssMinify: "lightningcss",
      cssTarget,
      rollupOptions: { input: join(here, "fixtures/app.ts") },
    },
  });
  const files = [out].flat().flatMap((o) => o.output);
  const text = (ext) =>
    files
      .filter((f) => f.fileName.endsWith(ext))
      .map((f) => String(f.code ?? f.source))
      .join("\n");
  process.stdout.write(`\nBUNDLE ${JSON.stringify({ js: text(".js"), css: text(".css") })}\n`);
  process.exit(0);
}
const bundle = (browserslist) =>
  JSON.parse(
    execFileSync(process.execPath, [import.meta.filename, "--build"], {
      env: { ...process.env, BROWSERSLIST: browserslist },
      encoding: "utf8",
      maxBuffer: 1 << 26,
    })
      .split("\n")
      .find((l) => l.startsWith("BUNDLE "))
      .slice(7),
  );

const modules = join(here, "../../../node_modules/.bun");
const pw = readdirSync(modules).find((d) => d.startsWith("playwright-core@"));
const { chromium, firefox, webkit } = await import(
  pathToFileURL(join(modules, pw, "node_modules/playwright-core/index.mjs")).href
);
const launchers = {
  chrome: () => chromium.launch({ channel: "chrome" }),
  firefox: () => firefox.launch(),
  webkit: () => webkit.launch(),
};

const builds = {
  native: bundle("chrome 139"),
  fallback: bundle("chrome 139, firefox 140, safari 18"),
};
assert.ok(!builds.native.css.includes("@supports not"), builds.native.css);
assert.ok(builds.fallback.css.includes("@supports not"), builds.fallback.css);
// forced: the fallback build as a browser without corner-shape reads it (the declaration dropped, the @supports met), so
// the mask runs in a browser that has corner-shape too
builds.forced = {
  js: builds.fallback.js,
  css: builds.fallback.css
    .replace(/;?corner-shape:squircle(?=[;}])/, "")
    .replace("@supports not (corner-shape:squircle)", "@supports (display:block)"),
};
assert.notEqual(builds.forced.css, builds.fallback.css);

// [x, y, black?] in the box, for a squircle and for round corners
const W = 240;
const H = 160;
const at = (x, y) => [
  [x, y],
  [W - 1 - x, y],
  [x, H - 1 - y],
  [W - 1 - x, H - 1 - y],
];
const points = [
  ...at(2, 2).map((p) => [...p, false, false]), // outside both
  ...at(9, 9).map((p) => [...p, true, false]), // a squircle only
  ...at(15, 15).map((p) => [...p, true, true]), // inside both
  [120, 0, true, true], // the edges and the middle: the bands of the mask
  [0, 80, true, true],
  [239, 80, true, true],
  [120, 159, true, true],
  [120, 80, true, true],
];

const read = async (browser, { css, js }) => {
  const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await page.setContent(
    `<!doctype html><style>body{margin:0;background:#fff}${css}</style><script type=module>${js}</script>`,
  );
  await page.locator("#box").waitFor();
  const supports = await page.evaluate(() => CSS.supports("corner-shape: squircle"));
  const mask = await page.evaluate(
    () => getComputedStyle(document.querySelector("#box")).maskImage ?? "",
  );
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: W, height: H } });
  const { black, corner } = await page.evaluate(
    async ([src, points]) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const corner = [...ctx.getImageData(0, 0, 40, 40).data].filter((_, i) => i % 4 === 0);
      return { black: points.map(([x, y]) => ctx.getImageData(x, y, 1, 1).data[0] < 128), corner };
    },
    [`data:image/png;base64,${png.toString("base64")}`, points],
  );
  await page.close();
  return { supports, mask, black, corner };
};

const failures = [];
for (const name of (process.env.BROWSERS ?? "chrome,firefox,webkit").split(",")) {
  const browser = await launchers[name]();
  const corners = {};
  for (const [kind, b] of Object.entries(builds)) {
    const { supports, mask, black, corner } = await read(browser, b);
    corners[kind] = supports && corner;
    const squircle = supports || kind !== "native";
    const masked = mask !== "" && mask !== "none";
    const wrong = points.filter(([, , s, r], i) => black[i] !== (squircle ? s : r));
    const line = `${name} ${kind}: corner-shape ${supports ? "native" : "missing"}, ${squircle ? "squircle" : "round"}${masked ? " (mask)" : ""}`;
    console.log(
      wrong.length
        ? `${line}: wrong at ${wrong.map(([x, y]) => `${x},${y}`).join(" ")}`
        : `${line} ok`,
    );
    if (wrong.length) failures.push(line);
    // the mask is on exactly where the fallback is needed
    if (masked !== (kind === "forced" || (!supports && kind === "fallback")))
      failures.push(`${line}: mask ${mask}`);
  }
  // where corner-shape is native, the mask cuts the same curve: the 40×40 corner of each build, pixel by pixel
  if (corners.native) {
    const off = corners.native.filter((v, i) => Math.abs(v - corners.forced[i]) > 64).length;
    console.log(`${name}: the mask's corner differs from the native one at ${off} of 1600 pixels`);
    if (off > 16) failures.push(`${name}: the mask is not the native curve (${off} pixels)`);
  }
  await browser.close();
}
assert.deepEqual(failures, []);
console.log("squircle browsers ok");
