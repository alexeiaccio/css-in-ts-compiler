// The browser target's check: build the wasm (browser/build.sh), load browser/index.html in Chromium through
// Playwright, and compare two things that a pixel comparison alone would miss:
//
//   (a) the command array. The wasm dumps the frame through desktop/clay_dump.c — the emitter the Solid host and the C
//       page on the desktop write — and the check compares that JSON with solid/goldens/sensors.json, the same golden
//       the Solid page and the C page are held to. Every field must match exactly but the box: the golden's boxes are
//       ThorVG's metrics (the page's design), the wasm's are Canvas2D's, which does not hint a font — a 20px line comes
//       out up to 3px wider, and a centred text box moves by half of that, so the boxes keep a 4px tolerance.
//   (b) the raster, in two steps, because anti-aliasing, glyph hinting and rounded-corner coverage differ between
//       Canvas2D and ThorVG, so "the same pixels" is not a claim that holds:
//       — against browser/expected.png, this browser's own frame (a regression guard, rewritten with --update): every
//         8x8 block's mean colour within 3/255;
//       — against examples/sensors/expected-thorvg.png, the desktop's frame (the design): the mean colour of every
//         command's box, each text line's ink box, and the whole frame's mean colour, so a region in the wrong place
//         or colour fails while another rasteriser's edges do not.
//
//   node browser/check.mjs [--update]     --update rewrites browser/expected*.png from this run
//   node browser/check.mjs --serve        serve the page and print its URL, for looking at it by hand
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// the goldens' formatter (solid/dump.ts stores them with it), for a value's message and the effects' comparison
import { format } from '../solid/src/format.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BROWSER = join(ROOT, 'browser');
const WASM_DIR = process.env.WASM_DIR || join(process.env.TMPDIR || '/tmp', 'cssints-native-web');
const SIZE = 360;
const update = process.argv.includes('--update');

// The golden the whole page is held to: the Solid page's last frame (solid/dump.ts), the same tree as the generated C
// this wasm runs. It is the base state; the use_g frame has no golden, only its two stored rasters below.
const GOLDEN = JSON.parse(readFileSync(join(ROOT, 'solid/goldens/sensors.json'), 'utf8'));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.ttf': 'font/ttf',
    '.png': 'image/png', '.json': 'application/json' };
let failures = 0;
const ok = (name, extra = '') => console.log(`ok   ${name}${extra ? ' — ' + extra : ''}`);
const bad = (name, why) => { failures++; console.log(`FAIL ${name}: ${why}`); };

function serve() {
    return new Promise(done => {
        const server = createServer(async (req, res) => {
            const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
            const file = path === '/browser/page.wasm' ? join(WASM_DIR, 'page.wasm') : join(ROOT, path);
            try {
                const body = await readFile(file);
                res.writeHead(200, { 'content-type': MIME[extname(file)] || 'text/plain' });
                res.end(body);
            } catch {
                res.writeHead(404).end('not found');
            }
        });
        server.listen(0, '127.0.0.1', () => done({ server, port: server.address().port }));
    });
}

/** The golden's names, by Clay id: the wasm has no id strings (a C page has Clay's hashes only), so a command's
 *  `element` is null and is filled from the golden — the same page, the same ids. */
function named(dump) {
    const names = new Map();
    for (const command of GOLDEN.commands) if (command.element) names.set(command.id, command.element);
    for (const command of dump.commands)
        if (command.element == null && names.has(command.id)) command.element = names.get(command.id);
}

/** (a) the command array, field by field, against the golden of the same page: every field exactly but the boxes. */
function compareCommands(useG, dump) {
    const name = `commands frame(${useG})`;
    const want = GOLDEN.commands;
    if (dump.commands.length !== want.length) return bad(name, `${dump.commands.length} commands, want ${want.length}`);
    let worst = 0, worstAt = 0;
    for (let i = 0; i < want.length; i++) {
        const a = want[i], b = dump.commands[i];
        const text = typeof b.text === 'string' ? ` ${JSON.stringify(b.text)}` : '';
        const who = `${name} #${i} (${b.type}${text})`;
        for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
            if (key === 'box') {
                for (let k = 0; k < 4; k++) {
                    const d = Math.abs(a.box[k] - b.box[k]);
                    if (d > worst) worst = d, worstAt = i;
                }
                continue;
            }
            if (format(a[key]) !== format(b[key]))
                return bad(who, `${key === 'color' ? 'colour' : key} ${format(b[key])}, want ${format(a[key])}`);
        }
    }
    // Canvas2D and the golden's ThorVG measure the same Roboto differently: Canvas2D does not hint, ThorVG sums glyph
    // advances, so a 20px line is up to 3px wider here and the centred box starts up to 1.5px to the side
    if (worst > 4) return bad(name, `command ${worstAt}'s box is ${worst.toFixed(2)}px off the golden's`);
    const effects = format(GOLDEN.effects) === format(dump.effects) ? '' : ` (the effects differ: ${format(dump.effects)})`;
    if (effects) return bad(`${name} effects`, effects);
    ok(name, `${want.length} commands, same order and fields as the golden; worst box ${worst.toFixed(2)}px`);
}

/** (b1) the raster as 8x8 block means, done in the page: the canvas and a reference image, both on a 2D canvas. */
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

/** (b2) per command box: the mean colour of the region, and for text the ink box inside it. */
const REGIONS = async ({ refURL, boxes }) => {
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
    const mean = (d, x0, y0, x1, y1) => {
        const s = [0, 0, 0], n = Math.max(1, (x1 - x0) * (y1 - y0));
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
            const i = (y * a.width + x) * 4;
            for (let k = 0; k < 3; k++) s[k] += d[i + k];
        }
        return s.map(v => v / n);
    };
    // a text box's background is the fill of the last rectangle drawn before it (the root's, or the pill's); ink is
    // what is far from that colour, so anti-aliased edge pixels do not count as glyph
    const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const inkBox = (d, box, bg) => {
        let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
        for (let y = Math.max(0, box.y); y < Math.min(a.height, box.y + box.h); y++)
            for (let x = Math.max(0, box.x); x < Math.min(a.width, box.x + box.w); x++) {
                const i = (y * a.width + x) * 4;
                const dd = Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]);
                if (dd > 120) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
            }
        return x1 < 0 ? null : [x0, x1, y0, y1];
    };
    // the whole frame's mean colour: moved ink cancels out, a wrong palette does not
    let differing = 0;
    const meanA = [0, 0, 0], meanB = [0, 0, 0];
    for (let i = 0; i < a.data.length; i += 4) {
        if (a.data[i] !== b[i] || a.data[i + 1] !== b[i + 1] || a.data[i + 2] !== b[i + 2]) differing++;
        for (let k = 0; k < 3; k++) meanA[k] += a.data[i + k], meanB[k] += b[i + k];
    }
    const n = a.width * a.height;
    const frameMean = Math.max(...meanA.map((v, k) => Math.abs(v / n - meanB[k] / n)));
    const regionDelta = [], inkDelta = [];
    let fill = '#000000'; // the last rectangle's colour: a text box's background
    for (const box of boxes) {
        if (box.type === 1) fill = box.color;
        const r = { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.w), h: Math.round(box.h) };
        r.x = Math.max(0, r.x), r.y = Math.max(0, r.y);
        r.w = Math.min(a.width - r.x, r.w), r.h = Math.min(a.height - r.y, r.h);
        if (r.w <= 0 || r.h <= 0) continue;
        const ma = mean(a.data, r.x, r.y, r.x + r.w, r.y + r.h);
        const mb = mean(b, r.x, r.y, r.x + r.w, r.y + r.h);
        regionDelta.push({ box, delta: Math.max(...ma.map((v, k) => Math.abs(v - mb[k]))) });
        if (box.type === 3) {
            const bg = rgb(fill), ia = inkBox(a.data, r, bg), ib = inkBox(b, r, bg);
            if (ia && ib) inkDelta.push({ box, ia, ib, delta: Math.max(...ia.map((v, k) => Math.abs(v - ib[k]))) });
            else if (!ia && !ib) inkDelta.push({ box, delta: 0 });
            else inkDelta.push({ box, delta: 99 });
        }
    }
    const worst = list => list.reduce((m, e) => (e.delta > m.delta ? e : m), { delta: 0 });
    return { differing, total: n, frameMean, region: worst(regionDelta), ink: worst(inkDelta) };
};

function assertBlocks(name, diff, { blockMax, pixelPct }) {
    const pct = (100 * diff.differing) / diff.total;
    if (diff.worstBlock > blockMax) return bad(name, `block ${diff.worstAt} differs by ${diff.worstBlock.toFixed(1)}/255, over ${blockMax}`);
    if (pct > pixelPct) return bad(name, `${pct.toFixed(1)}% of pixels differ, over ${pixelPct}%`);
    ok(name, `${pct.toFixed(2)}% of pixels differ, worst 8x8 block ${diff.worstBlock.toFixed(1)}/255 at (${diff.worstAt})`);
}

function assertRegions(name, diff, { regionMax, inkMax, meanMax, pixelPct }) {
    const pct = (100 * diff.differing) / diff.total;
    if (diff.region.delta > regionMax)
        return bad(name, `the region at (${diff.region.box.x},${diff.region.box.y}) differs by ${diff.region.delta.toFixed(1)}/255 in the mean, over ${regionMax}`);
    if (diff.ink.delta > inkMax)
        return bad(name, `the ink of "${diff.ink.box.text}" is ${diff.ink.delta.toFixed(0)}px off (${diff.ink.ia} vs ${diff.ink.ib}), over ${inkMax}`);
    if (diff.frameMean > meanMax) return bad(name, `the frame's mean colour is ${diff.frameMean.toFixed(2)}/255 off, over ${meanMax}`);
    if (pct > pixelPct) return bad(name, `${pct.toFixed(1)}% of pixels differ, over ${pixelPct}%`);
    ok(name, `${pct.toFixed(2)}% of pixels differ; region means within ${diff.region.delta.toFixed(1)}/255, ` +
        `text ink within ${diff.ink.delta.toFixed(2)}px ("${diff.ink.box?.text}"), the frame's mean colour within ${diff.frameMean.toFixed(2)}/255`);
}

async function main() {
    if (!existsSync(join(WASM_DIR, 'page.wasm'))) {
        console.log(`no ${join(WASM_DIR, 'page.wasm')}; run "sh browser/build.sh" first`);
        process.exit(1);
    }
    const { server, port } = await serve();
    if (process.argv.includes('--serve')) {
        console.log(`http://127.0.0.1:${port}/browser/index.html   (Ctrl-C to stop)`);
        return; // no browser to drive: serve the page for a person to open
    }
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: SIZE + 80, height: SIZE + 160 }, deviceScaleFactor: 1 });
    const logs = [];
    page.on('console', m => logs.push(m.text()));
    page.on('pageerror', e => logs.push(`pageerror: ${e.message}`));

    try {
        await page.goto(`http://127.0.0.1:${port}/browser/index.html`);
        await page.waitForFunction(() => window.__page, null, { timeout: 15000 });
        const errors = await page.evaluate(() => window.__page.errors());
        if (errors) bad('clay', `${errors} Clay errors`); else ok('clay', 'no errors');

        for (const useG of [0, 1]) {
            const got = await page.evaluate(g => window.__page.render(g), useG);
            // the golden is the page's base state; the use_g frame keeps its two rasters below
            if (!useG) {
                const dump = JSON.parse(await page.evaluate(() => window.__page.dump()));
                named(dump);
                compareCommands(useG, dump);
            }

            const shot = await page.locator('#frame').screenshot();
            const own = join(BROWSER, useG ? 'expected-g.png' : 'expected.png');
            if (update || !existsSync(own)) {
                await writeFile(own, shot);
                console.log(`wrote ${useG ? 'browser/expected-g.png' : 'browser/expected.png'} (${shot.length} bytes)`);
            } else {
                const diff = await page.evaluate(DIFF, `/browser/${useG ? "expected-g" : "expected"}.png`);
                assertBlocks(`raster frame(${useG}) vs browser's stored frame`, diff, { blockMax: 3, pixelPct: 2 });
            }
            // the design's frame: ThorVG's raster of the same page on the desktop. Per command box, not per 8x8 block:
            // another rasteriser's glyphs land a pixel or two away, which a block of 64 pixels exaggerates
            const desktop = `/examples/sensors/${useG ? 'expected-thorvg-g' : 'expected-thorvg'}.png`;
            const regions = await page.evaluate(REGIONS, { refURL: desktop, boxes: got });
            assertRegions(`raster frame(${useG}) vs the desktop's ${useG ? 'use_g ' : ''}frame`, regions,
                { regionMax: 20, inkMax: 4, meanMax: 3, pixelPct: 12 });
        }

        await page.evaluate(() => window.__page.render(0)); // the loop left the g frame up
        // the one interactive state: w and the button both flip use_g, and the frame's strings change with it
        await page.keyboard.press('w');
        await page.waitForFunction(() => window.__page.commands().some(c => c.text === 'switch to m/s²'));
        ok('w key', 'the g frame');
        await page.locator('#toggle').click();
        await page.waitForFunction(() => window.__page.commands().some(c => c.text === 'switch to g'));
        ok('button', 'back to m/s²');

        const ms = await page.evaluate(() => window.__page.bench(100));
        const wasmBytes = (await stat(join(WASM_DIR, 'page.wasm'))).size;
        // the page is index.html, its script, and the drawing both web targets share (draw.js)
        const pageBytes = (await stat(join(BROWSER, 'index.html'))).size +
            (await stat(join(BROWSER, 'render.js'))).size + (await stat(join(BROWSER, 'draw.js'))).size;
        console.log(`info ${wasmBytes} B of wasm, ${pageBytes} B of page (index.html + render.js + draw.js)`);
        console.log(`info ${ms.toFixed(2)} ms a frame (100 frames: layout in the wasm, the commands to Canvas2D, one readback)`);
        if (logs.some(l => l.startsWith('pageerror'))) bad('page', logs.join('; '));
    } finally {
        await browser.close();
        server.close();
    }
    if (failures) { console.log(`${failures} failure(s)`); process.exit(1); }
    console.log('browser: ok');
}

main();
