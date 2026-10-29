// Clay's render commands on a 2D canvas. The wasm (browser/page.c) lays the page out; this file only draws what the
// command array says: rectangles, borders (inside, the ring between the box and the box inset by each side's width),
// text, and a scissor via clip(). No framework and no build step: the module is loaded by index.html.
//
// The state is the wasm's: the generated page's transition table (examples/sensors/page_generated_events.c) is asked on
// a pointer's press and release, exactly as the desktop host asks it, so a click on the pill toggles the units and `w`
// (or the button) is the same click at the pill's centre.

const W = 360, H = 360;
const FONT = 'Roboto, "Helvetica Neue", Arial, sans-serif'; // bundled Roboto (vendor/fonts), system fallback
const canvas = document.getElementById('frame');
const ctx = canvas.getContext('2d');
const dpr = Math.max(1, window.devicePixelRatio || 1);
canvas.width = W * dpr;
canvas.height = H * dpr;

const TYPE = { RECTANGLE: 1, BORDER: 2, TEXT: 3, IMAGE: 4, SCISSOR_START: 5, SCISSOR_END: 6 };

/** Loads the same Roboto the desktop draws with; a fallback font is fine, it is measured the same way. */
async function loadFont() {
    try {
        const face = new FontFace('Roboto', 'url(../vendor/fonts/Roboto-Regular.ttf)');
        await face.load();
        document.fonts.add(face);
    } catch (e) {
        console.info('Roboto not loaded, using the system fallback:', e.message);
    }
}

function fontFor(size) { return `400 ${size}px ${FONT}`; }

const ascent = new Map(); // font size -> ascent in px, for the baseline

/** The wasm's env.measure: Canvas2D measures the string with the font the canvas draws with. */
function measureText(wasm, ptr, len, fontId, size) {
    const text = new TextDecoder().decode(new Uint8Array(wasm.memory.buffer, ptr, len));
    ctx.font = fontFor(size);
    const m = ctx.measureText(text);
    const up = m.fontBoundingBoxAscent ?? size * 0.8;
    ascent.set(size, up);
    const slot = new Float32Array(wasm.memory.buffer, wasm.measure_slot(), 2);
    slot[0] = m.width;
    // Roboto's line height is 2400/2048 em, and the desktop's SDL_ttf measure returns it rounded up; Clay stacks the
    // lines with it, so the two rasters put the same line at the same y (16.4 -> 17 at 14px, 37.5 -> 38 at 32px).
    slot[1] = Math.ceil(size * 2400 / 2048);
}

function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, [r[0], r[1], r[2], r[3]]);
}

/** Clay's border: inside the box, the fill rule's ring between the outer and the inner rounded rect. */
function borderRect(c) {
    const [l, r, t, b] = c.border, w = c.w - l - r, h = c.h - t - b;
    const inner = [c.radius[0] - l, c.radius[1] - r, c.radius[2] - r, c.radius[3] - l];
    roundRect(c.x, c.y, c.w, c.h, c.radius);
    if (w > 0 && h > 0) ctx.roundRect(c.x + l, c.y + t, w, h, inner.map(v => Math.max(0, v)));
    ctx.fillStyle = c.color;
    ctx.fill('evenodd');
}

function draw(commands) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const c of commands) {
        switch (c.type) {
        case TYPE.RECTANGLE:
            roundRect(c.x, c.y, c.w, c.h, c.radius);
            ctx.fillStyle = c.color;
            ctx.fill();
            break;
        case TYPE.BORDER:
            borderRect(c);
            break;
        case TYPE.TEXT:
            ctx.font = fontFor(c.fontSize);
            ctx.fillStyle = c.color;
            ctx.textBaseline = 'alphabetic';
            // Clay's box is the text's line box; the alphabetic baseline sits one ascent below its top
            ctx.fillText(c.text, c.x, c.y + (ascent.get(c.fontSize) ?? c.fontSize * 0.8));
            break;
        case TYPE.SCISSOR_START: {
            const clip = new Path2D();
            clip.rect(c.x, c.y, c.w, c.h);
            ctx.save();
            ctx.clip(clip);
            break;
        }
        case TYPE.SCISSOR_END: ctx.restore(); break;
        case TYPE.IMAGE: break; // the page has none; counted, not drawn
        }
    }
}

/** Reads the command array out of the wasm's memory. */
function readCommands(wasm) {
    const count = wasm.cmd_count();
    const stride = wasm.cmd_size() / 4;
    const base = wasm.cmds();
    const i32 = new Int32Array(wasm.memory.buffer, base, count * stride);
    const f32 = new Float32Array(wasm.memory.buffer, base, count * stride);
    const decoder = new TextDecoder();
    const out = [];
    for (let i = 0; i < count; i++) {
        const o = i * stride, len = i32[o + 16];
        out.push({
            type: i32[o], id: i32[o + 1] >>> 0,
            x: f32[o + 2], y: f32[o + 3], w: f32[o + 4], h: f32[o + 5],
            color: `#${(i32[o + 6] & 0xffffff).toString(16).padStart(6, '0')}`,
            alpha: ((i32[o + 6] >>> 24) & 255) / 255,
            radius: [f32[o + 7], f32[o + 8], f32[o + 9], f32[o + 10]],
            border: [f32[o + 11], f32[o + 12], f32[o + 13], f32[o + 14]],
            text: len ? decoder.decode(new Uint8Array(wasm.memory.buffer, i32[o + 15], len)) : '',
            fontId: i32[o + 17], fontSize: i32[o + 18],
        });
    }
    return out;
}

async function instantiate() {
    let measure = () => {}; // called by Clay inside frame(), after the instance exists
    const imports = { env: { measure: (p, l, f, s) => measure(p, l, f, s) } };
    const response = await fetch('page.wasm');
    if (!response.ok) throw new Error(`page.wasm: HTTP ${response.status}; run "sh browser/build.sh" first`);
    // instantiateStreaming wants application/wasm; a plain static server may send octet-stream
    const module = await (response.headers.get('content-type') === 'application/wasm'
        ? WebAssembly.compileStreaming(response)
        : WebAssembly.compile(await response.arrayBuffer()));
    const instance = await WebAssembly.instantiate(module, imports);
    const wasm = instance.exports;
    if (wasm._initialize) wasm._initialize(); // reactor: libc's constructors
    measure = (p, l, f, s) => measureText(wasm, p, l, f, s);
    return wasm;
}

let wasm, lastFrame = [];

const button = document.getElementById('toggle');
const ms = document.getElementById('ms');

/** One frame of the state the wasm holds: Clay's layout, then the draw. Returns the commands, for a test to read. */
function render() {
    wasm.frame();
    lastFrame = readCommands(wasm);
    draw(lastFrame);
    button.textContent = lastFrame.some(c => c.text === 'switch to m/s²') ? 'switch to m/s²' : 'switch to g';
    return lastFrame;
}

/** The pointer's press and release at layout coordinates, through the wasm's table. */
function press(x, y) { wasm.press(x, y); render(); }
function release(x, y) { wasm.release(x, y); render(); }

/** The pill's centre: the click `w` and the button make. */
function clickPill() { press(180, 248); release(180, 248); }

await loadFont();
wasm = await instantiate();
wasm.init(W, H);
render();

button.addEventListener('click', clickPill);
window.addEventListener('keydown', e => { if (e.key === 'w' || e.key === 'W') clickPill(); });
// a click on the page itself: the canvas is 360 CSS px whatever its backing store is
const canvasXY = e => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
};
canvas.addEventListener('pointerdown', e => { const [x, y] = canvasXY(e); press(x, y); });
canvas.addEventListener('pointerup', e => { const [x, y] = canvasXY(e); release(x, y); });

// for browser/check.mjs: the commands of the last frame, a frame count for the timing, the Clay error count, the state,
// and the last frame as the JSON of desktop/clay_dump.c — the dump every target writes, which a check compares
window.__page = {
    commands: () => lastFrame,
    render,
    press,
    release,
    click: clickPill,
    state: () => wasm.state(),
    stateName(i) {
        const ptr = wasm.state_name(i);
        if (!ptr) return '';
        const bytes = new Uint8Array(wasm.memory.buffer);
        let end = ptr;
        while (end < bytes.length && bytes[end]) end++;
        return new TextDecoder().decode(bytes.subarray(ptr, end));
    },
    errors: () => wasm.errors(),
    dump() {
        const length = wasm.dump();
        const at = wasm.dump_ptr();
        return new TextDecoder().decode(new Uint8Array(wasm.memory.buffer, at, length));
    },
    bench(n = 100) {
        const t0 = performance.now();
        for (let i = 0; i < n; i++) {
            render();
            ctx.getImageData(0, 0, 1, 1); // a readback, so each frame's raster is done, not just queued
        }
        return (performance.now() - t0) / n; // ms a frame: layout in Clay, the commands, the canvas raster
    },
};
ms.textContent = `${window.__page.bench(20).toFixed(2)} ms a frame`;
