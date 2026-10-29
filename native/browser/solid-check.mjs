// The Solid page in the browser, checked against the two things that make it the same page as the desktop's:
//
//   (a) its command array. browser/ui.c dumps the frame through desktop/clay_dump.c — the emitter every host writes —
//       and the base frame is compared with solid/goldens/sensors.json, the golden the Solid page on the desktop and the
//       generated C page are held to: every field exactly, the boxes within 4 px (the golden's are ThorVG's metrics;
//       Canvas2D does not hint a font, so a 20 px line comes out up to 3 px wider and a centred box moves by half).
//   (b) a click on the Units pill. The real one: Playwright puts the mouse on the pill, the page's DOM listeners set the
//       pointer src/frame.ts's View reads, and the release runs the element's onClick. The frame it makes must be the
//       no-JS page's use_g frame — the same wasm layout, the same Canvas2D measure — field for field, box for box; the
//       no-JS page (browser/index.html) is opened beside this one for it, so the comparison is between two runs of the
//       same Clay and the same font, and a difference is this page's alone.
//   (c) the raster: its canvas against browser/expected.png (the no-JS page's own base frame), every 8x8 block's mean
//       colour within 3/255 — check.mjs's tolerance for this browser's own frames.
//
//   node browser/solid-check.mjs            the check (build first: sh browser/build.sh && bun browser/solid/build.ts)
//   node browser/solid-check.mjs --serve    serve the page and print its URL, for looking at it by hand
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// the goldens' formatter (solid/dump.ts stores them with it), for a field's message
import { format } from "../solid/src/format.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BROWSER = join(ROOT, "browser");
const WASM_DIR = process.env.WASM_DIR || join(process.env.TMPDIR || "/tmp", "cssints-native-web");
const BUNDLE = join(WASM_DIR, "solid/page.js");
const SIZE = 360;

// the golden the page is held to: the Solid page's last frame on the desktop, the same tree as the generated C
const GOLDEN = JSON.parse(readFileSync(join(ROOT, "solid/goldens/sensors.json"), "utf8"));

const MIME = { ".html": "text/html", ".js": "text/javascript", ".wasm": "application/wasm", ".ttf": "font/ttf",
    ".png": "image/png", ".json": "application/json" };
let failures = 0;
const ok = (name, extra = "") => console.log(`ok   ${name}${extra ? " — " + extra : ""}`);
const bad = (name, why) => { failures++; console.log(`FAIL ${name}: ${why}`); };

function serve() {
    return new Promise(done => {
        const server = createServer(async (req, res) => {
            const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
            // the build products, outside the repo: the two wasms and the bundle
            const built = path === "/browser/page.wasm" ? join(WASM_DIR, "page.wasm")
                : path === "/browser/solid/ui.wasm" ? join(WASM_DIR, "ui.wasm")
                : path === "/browser/solid/page.js" ? BUNDLE
                : join(ROOT, path);
            try {
                const body = await readFile(built);
                res.writeHead(200, { "content-type": MIME[extname(built)] || "text/plain" });
                res.end(body);
            } catch {
                res.writeHead(404).end("not found");
            }
        });
        server.listen(0, "127.0.0.1", () => done({ server, port: server.address().port }));
    });
}

/** The no-JS page has no id strings: its dump names nothing, and the Solid page's names fill a command's `element`. */
function named(dump, names) {
    for (const command of dump.commands)
        if (command.element == null && names.has(command.id)) command.element = names.get(command.id);
}

/** (a) the base frame against the golden: every field exactly but the boxes (ThorVG's metrics, 4 px). */
function compareGolden(dump) {
    const name = "commands, base frame vs solid/goldens/sensors.json";
    const want = GOLDEN.commands;
    if (dump.commands.length !== want.length) return bad(name, `${dump.commands.length} commands, want ${want.length}`);
    let worst = 0, worstAt = 0;
    for (let i = 0; i < want.length; i++) {
        const a = want[i], b = dump.commands[i];
        const text = typeof b.text === "string" ? ` ${JSON.stringify(b.text)}` : "";
        const who = `${name} #${i} (${b.type}${text})`;
        for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
            if (key === "box") {
                for (let k = 0; k < 4; k++) {
                    const d = Math.abs(a.box[k] - b.box[k]);
                    if (d > worst) worst = d, worstAt = i;
                }
                continue;
            }
            if (format(a[key]) !== format(b[key]))
                return bad(who, `${key === "color" ? "colour" : key} ${format(b[key])}, want ${format(a[key])}`);
        }
    }
    const at = want[worstAt];
    const where = at?.text ? `command #${worstAt} (${JSON.stringify(at.text)})` : `command #${worstAt}`;
    if (worst > 4) return bad(name, `${where}'s box is ${worst.toFixed(2)}px off the golden's`);
    const effects = format(GOLDEN.effects) === format(dump.effects) ? "" : ` (the effects differ: ${format(dump.effects)})`;
    if (effects) return bad(`${name} effects`, effects);
    // the worst box is the pill's, below the texts: the measure callback rounds every line height up (37.5 -> 38 at
    // 32px, 16.4 -> 17 at 14px, as browser/render.js does for the no-JS page), ThorVG's is exact, and five lines put it
    // 3.375px lower. The no-JS page's check reports the same 3.38 on this command
    ok(name, `${want.length} commands, same order and fields as the golden; worst box ${worst.toFixed(2)}px ` +
        `(${where}: the line heights Canvas2D's measure rounds up)`);
}

/** (b) the clicked frame against the no-JS page's: the same Clay, the same font — every field and every box, exactly. */
function compareSamePage(name, want, got) {
    if (got.commands.length !== want.commands.length)
        return bad(name, `${got.commands.length} commands, the no-JS page's ${want.commands.length}`);
    let worst = 0, worstAt = 0;
    for (let i = 0; i < want.commands.length; i++) {
        const a = want.commands[i], b = got.commands[i];
        const text = typeof b.text === "string" ? ` ${JSON.stringify(b.text)}` : "";
        const who = `${name} #${i} (${b.type}${text})`;
        for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
            if (key === "box") {
                for (let k = 0; k < 4; k++) {
                    const d = Math.abs(a.box[k] - b.box[k]);
                    if (d > worst) worst = d, worstAt = i;
                }
                continue;
            }
            if (format(a[key]) !== format(b[key]))
                return bad(who, `${key === "color" ? "colour" : key} ${format(b[key])}, the no-JS page's ${format(a[key])}`);
        }
    }
    // both measured by the same Canvas2D call on the same bytes: anything but rounding is a different frame
    if (worst > 1e-3) return bad(name, `command ${worstAt}'s box is ${worst.toFixed(3)}px off the no-JS page's`);
    if (format(want.effects) !== format(got.effects))
        return bad(`${name} effects`, `${format(got.effects)}, the no-JS page's ${format(want.effects)}`);
    ok(name, `${want.commands.length} commands, every field and box the same; worst box ${worst.toExponential(1)}px`);
}

/** (c) the raster as 8x8 block means, done in the page: the canvas and a reference image, both on a 2D canvas. */
const DIFF = async (refURL) => {
    const a = document.getElementById('frame').getContext('2d').getImageData(0, 0, 360, 360);
    const img = new Image();
    img.src = refURL;
    await img.decode();
    const rc = document.createElement('canvas');
    rc.width = a.width;
    rc.height = a.height;
    const rcx = rc.getContext('2d');
    rcx.drawImage(img, 0, 0, a.width, a.height);
    const b = rcx.getImageData(0, 0, a.width, a.height).data;
    const B = 8, cols = Math.ceil(a.width / B), rows = Math.ceil(a.height / B);
    const blocks = new Float32Array(cols * rows);
    let differing = 0;
    for (let y = 0; y < a.height; y++) {
        for (let x = 0; x < a.width; x++) {
            const i = (y * a.width + x) * 4;
            let d = 0;
            for (let k = 0; k < 3; k++) d = Math.max(d, Math.abs(a.data[i + k] - b[i + k]));
            if (d > 0) differing++;
            blocks[Math.floor(y / B) * cols + Math.floor(x / B)] += d / (B * B);
        }
    }
    let worstBlock = 0, worstAt = 0;
    for (let i = 0; i < blocks.length; i++) if (blocks[i] > worstBlock) worstBlock = blocks[i], worstAt = i;
    return { differing, total: a.width * a.height, worstBlock, worstAt: [worstAt % cols, Math.floor(worstAt / cols)] };
};

function assertBlocks(name, diff, { blockMax, pixelPct }) {
    const pct = (100 * diff.differing) / diff.total;
    if (diff.worstBlock > blockMax) return bad(name, `block ${diff.worstAt} differs by ${diff.worstBlock.toFixed(1)}/255, over ${blockMax}`);
    if (pct > pixelPct) return bad(name, `${pct.toFixed(1)}% of pixels differ, over ${pixelPct}%`);
    ok(name, `${pct.toFixed(2)}% of pixels differ, worst 8x8 block ${diff.worstBlock.toFixed(1)}/255 at (${diff.worstAt})`);
}

async function main() {
    const missing = [join(WASM_DIR, "page.wasm"), join(WASM_DIR, "ui.wasm"), BUNDLE].filter(f => !existsSync(f));
    if (missing.length) {
        console.log(`missing build product(s): ${missing.join(", ")}`);
        console.log(`run "sh browser/build.sh && bun browser/solid/build.ts" first`);
        process.exit(1);
    }
    const { server, port } = await serve();
    if (process.argv.includes("--serve")) {
        console.log(`http://127.0.0.1:${port}/browser/solid/index.html   (Ctrl-C to stop)`);
        console.log(`http://127.0.0.1:${port}/browser/index.html         (the no-JS page)`);
        return; // no browser to drive: serve the pages for a person to open
    }
    const browser = await chromium.launch();
    const viewport = { width: SIZE + 80, height: SIZE + 160 };
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const cPage = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    const logs = [];
    for (const p of [page, cPage]) {
        p.on("console", m => logs.push(m.text()));
        p.on("pageerror", e => logs.push(`pageerror: ${e.message}`));
    }

    try {
        // the no-JS page: the frame its own state machine reaches through the same click at the same point, the reference
        // this page's click is compared with (its table is the generated one: press, release on the pill)
        await cPage.goto(`http://127.0.0.1:${port}/browser/index.html`);
        await cPage.waitForFunction(() => window.__page, null, { timeout: 15000 });
        await cPage.evaluate(() => (window.__page.press(180, 248), window.__page.release(180, 248)));
        const cState = await cPage.evaluate(() => [window.__page.state(), window.__page.stateName(window.__page.state())]);
        const cDump = JSON.parse(await cPage.evaluate(() => window.__page.dump()));

        await page.goto(`http://127.0.0.1:${port}/browser/solid/index.html`);
        await page.waitForFunction(() => window.__page, null, { timeout: 20000 });
        // the page's first-mount entry (the root's 8px rise and fade over 0.25s) writes the value channel, which this
        // target's commands do not carry; 31 frames at 1/60 is solid/dump.ts's `--warm 30`, past the settle
        await page.evaluate(() => window.__page.warm(31));

        const errors = await page.evaluate(() => window.__page.errors());
        if (errors) bad("clay", `${errors} Clay errors`); else ok("clay", "no errors");

        // (a) the base frame
        const base = JSON.parse(await page.evaluate(() => window.__page.dump()));
        compareGolden(base);

        // (c) the raster, before any click moves the page
        const diff = await page.evaluate(DIFF, "/browser/expected.png");
        assertBlocks("raster, base frame vs browser/expected.png", diff, { blockMax: 3, pixelPct: 2 });

        // (b) the click: the real input path — Playwright's mouse, the page's DOM listeners, src/frame.ts's events, the
        // Units element's onClick. The pill is at x 80..280, y 228.6..266.6 (the golden's box), so its centre is (180, 250)
        const rect = await page.locator("#frame").boundingBox();
        await page.mouse.move(rect.x + 180, rect.y + 250);
        await page.mouse.down();
        await page.mouse.up();
        await page.waitForFunction(() => window.__page.commands().some(c => c.text === "switch to m/s²"), null, { timeout: 5000 });
        ok("click on the Units pill", "the frame is the use_g one");

        // the pointer is still on the pill, so the frame carries its :hover (the value channel's states are the page's,
        // and the no-JS page has no events at all): 48,53,68 is the hover token, 36,40,52 the surface it rests on
        const hovered = await page.evaluate(() => window.__page.commands().find(c => c.type === 1 && c.w === 200));
        if (hovered?.color !== "#303544") bad("hover after the click", `the pill is ${hovered?.color}, not its hover #303544`);
        else ok("hover after the click", "the pill is on its hover token #303544");

        // ... and with the pointer still on the pill the frame is the no-JS page's clicked frame (its state machine's
        // "use_g + hover Units"), field for field and box for box: the two is the same Clay tree, laid out by Clay in
        // each and measured by the same Canvas2D
        await page.evaluate(() => window.__page.warm(2));
        const clicked = JSON.parse(await page.evaluate(() => window.__page.dump()));
        const names = new Map();
        for (const command of clicked.commands) if (command.element) names.set(command.id, command.element);
        named(cDump, names);
        compareSamePage(`commands, after the click vs the no-JS page's state ${cState[0]} "${cState[1]}"`, cDump, clicked);

        // the release is the click: a second one goes back, and its frame is the base frame again, field for field
        await page.mouse.move(rect.x + 180, rect.y + 250);
        await page.mouse.down();
        await page.mouse.up();
        await page.waitForFunction(() => window.__page.commands().some(c => c.text === "switch to g"), null, { timeout: 5000 });
        await page.evaluate(() => window.__page.pointer(10, 10));
        await page.evaluate(() => window.__page.warm(2));
        const back = JSON.parse(await page.evaluate(() => window.__page.dump()));
        compareSamePage("commands, after the second click vs the base frame", base, back);

        await page.evaluate(() => window.__page.warm(3));
        const ms = await page.evaluate(() => window.__page.bench(100));
        const bundle = (await stat(BUNDLE)).size;
        const wasm = (await stat(join(WASM_DIR, "ui.wasm"))).size;
        const html = (await stat(join(BROWSER, "solid/index.html"))).size;
        console.log(`info ${bundle} B of bundle (page.js), ${wasm} B of wasm (ui.wasm), ${html} B of index.html`);
        console.log(`info ${ms.toFixed(2)} ms a frame (100 frames: the tree declared, Clay's layout, the commands, ` +
            `Canvas2D's raster, one readback)`);
        if (logs.some(l => l.startsWith("pageerror"))) bad("page", logs.join("; "));
    } finally {
        await browser.close();
        server.close();
    }
    if (failures) { console.log(`${failures} failure(s)`); process.exit(1); }
    console.log("browser/solid: ok");
}

main();
