// The no-JS browser target's page: the wasm (browser/page.c) lays the static generated C page out, and draw.js puts its
// commands on the canvas. This file is the page's own glue — the two frames, the toggle and the readouts a check reads;
// the drawing and the measure callback are in draw.js, shared with the Solid page (browser/solid/).
//
// The page has two frames: frame(0) is the static generated frame with the base sample, frame(1) the use_g one. w, or the
// button, switches between them, which is the only state this target has.

import { W, H, createSurface, loadFont, readCommands } from './draw.js';

const canvas = document.getElementById('frame');
const ctx = canvas.getContext('2d');
const dpr = Math.max(1, window.devicePixelRatio || 1);
canvas.width = W * dpr;
canvas.height = H * dpr;

const surface = createSurface(ctx, { width: W, height: H, dpr });

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
    measure = (p, l, f, s) => surface.measure(wasm, p, l, f, s);
    return wasm;
}

let wasm, useG = 0, lastFrame = [];

const button = document.getElementById('toggle');
const ms = document.getElementById('ms');

/** One frame: Clay's layout in the wasm, then the draw. Returns the commands, so a test can read the layout. */
function render(useG_) {
    useG = useG_ ? 1 : 0;
    wasm.frame(useG);
    lastFrame = readCommands(wasm);
    surface.draw(lastFrame);
    button.textContent = useG ? 'switch to m/s²' : 'switch to g';
    return lastFrame;
}

await loadFont('../vendor/fonts/Roboto-Regular.ttf');
wasm = await instantiate();
wasm.init(W, H);
render(0);

function toggle() { render(!useG); }
button.addEventListener('click', toggle);
window.addEventListener('keydown', e => { if (e.key === 'w' || e.key === 'W') toggle(); });

// for browser/check.mjs: the commands of the last frame, a frame count for the timing, the Clay error count, and the
// last frame as the JSON of desktop/clay_dump.c — the dump every target writes, which a check compares with a golden
window.__page = {
    commands: () => lastFrame,
    render,
    errors: () => wasm.errors(),
    dump() {
        const length = wasm.dump();
        const at = wasm.dump_ptr();
        return new TextDecoder().decode(new Uint8Array(wasm.memory.buffer, at, length));
    },
    bench(n = 100) {
        const t0 = performance.now();
        for (let i = 0; i < n; i++) {
            render(useG);
            ctx.getImageData(0, 0, 1, 1); // a readback, so each frame's raster is done, not just queued
        }
        return (performance.now() - t0) / n; // ms a frame: layout in Clay, the commands, the canvas raster
    },
};
ms.textContent = `${window.__page.bench(20).toFixed(2)} ms a frame`;
