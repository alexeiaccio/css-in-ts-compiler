// Clay's render commands on a 2D canvas, shared by the two web targets: the no-JS page (browser/render.js: the generated
// C page) and the Solid page (browser/solid/page.ts: the ui_* wasm module). Clay lays out in the wasm; this file draws
// what the command array says and nothing else: rectangles, borders (inside, the ring between the box and the box inset
// by each side's width), text, and a scissor via clip(). No framework and no build step.
//
// The command record is browser/page.c's WebCommand and browser/ui.c's copy of it: 19 32-bit slots, type, id, box,
// colour (r<<16 | g<<8 | b | a<<24), four radii, four border widths, the text's pointer and length, its font and size.

export const W = 360;
export const H = 360;
export const FONT = 'Roboto, "Helvetica Neue", Arial, sans-serif'; // bundled Roboto (vendor/fonts), system fallback

export const TYPE = { RECTANGLE: 1, BORDER: 2, TEXT: 3, IMAGE: 4, SCISSOR_START: 5, SCISSOR_END: 6 };

/** Loads the same Roboto the desktop draws with; a fallback font is fine, it is measured the same way. `url` is
 *  resolved against the document, so each page passes its own path to vendor/fonts. */
export async function loadFont(url) {
    try {
        const face = new FontFace('Roboto', `url(${url})`);
        await face.load();
        document.fonts.add(face);
    } catch (e) {
        console.info('Roboto not loaded, using the system fallback:', e.message);
    }
}

/**
 * A canvas and the two things a Clay frame needs from it: `measure`, the wasm's env.measure, and `draw`, the command
 * array as pixels. They share the ascent map, so the text a frame measured is the text it puts on the alphabetic
 * baseline Clay's line box implies.
 */
export function createSurface(ctx, { width = W, height = H, dpr = 1 } = {}) {
    const fontFor = (size) => `400 ${size}px ${FONT}`;
    const ascent = new Map(); // font size -> ascent in px, for the baseline

    /** The wasm's env.measure: Canvas2D measures the string with the font the canvas draws with. */
    function measure(wasm, ptr, len, fontId, size) {
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
        ctx.clearRect(0, 0, width, height);
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
            case TYPE.IMAGE: break; // no target of this file has one; counted, not drawn
            }
        }
    }

    return { width, height, dpr, measure, draw, ascent };
}

/** Reads the command array out of the wasm's memory. */
export function readCommands(wasm) {
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
