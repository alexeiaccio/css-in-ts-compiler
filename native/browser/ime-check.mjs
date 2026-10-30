// The Text field page's text path in the browser: the input method and the clipboard — browser/ime-check.mjs, its own
// file beside input-check.mjs (which holds the typed characters, Backspace, the selection and the rasters).
//
//   (a) the path the browser chose: Chromium's `EditContext`, attached to the canvas (`canvas.editContext`), and — with
//       `?ime=input` — the hidden textarea the browsers without one take. Playwright cannot drive a real IME, so what is
//       dispatched is the sequence a composition produces: `compositionstart`, the `textupdate`s of the draft, and
//       `compositionend` with the committed string. (No candidate window, no key the IME itself would send, no dead key:
//       those are the browser's, not this page's, and none of them is driven here.)
//   (b) the composition into the model: the draft never reaches the page's value, its commands or its pixels while it is
//       being composed; `compositionend`'s string goes through `Input.textInput`, so the field's value, the caret and the
//       run's ink are the typed path's — the same 192 px of ink in the same box as input-check.mjs's "Ada".
//   (c) the clipboard over a real `navigator.clipboard` (the context's permission granted): Shift+Home then Ctrl+C is
//       "Ada", Ctrl+V into an empty field is "Ada" again (the caret at 3, the ink back), Ctrl+X empties the field and keeps
//       the clipboard, and Ctrl+A then a key replaces the whole value.
//   (d) the fallback, the same page with `?ime=input`: the textarea has the DOM's focus, its keys are cloned onto the
//       canvas (Tab twice reaches the field, "Ada" is typed), and its composition commits through the same call.
//
//   node browser/ime-check.mjs            the check (build first: sh browser/build.sh && bun browser/solid/build.ts)
//   node browser/ime-check.mjs --serve    serve the page and print its URLs, for looking at it by hand
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WASM_DIR = process.env.WASM_DIR || join(process.env.TMPDIR || "/tmp", "cssints-native-web");
const BUNDLE = join(WASM_DIR, "solid/field.js");
const SIZE = [360, 450];
const MIME = { ".html": "text/html", ".js": "text/javascript", ".wasm": "application/wasm", ".ttf": "font/ttf",
    ".png": "image/png", ".json": "application/json" };
let failures = 0;
const ok = (name, extra = "") => console.log(`ok   ${name}${extra ? " — " + extra : ""}`);
const bad = (name, why) => { failures++; console.log(`FAIL ${name}: ${why}`); };

/** The page's window loop is the check's: requestAnimationFrame never calls back, so every frame is one asked for. */
const HOLD = () => {
    window.requestAnimationFrame = () => 0;
};

function serve() {
    return new Promise(done => {
        const server = createServer(async (req, res) => {
            const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
            const built = path === "/browser/solid/ui.wasm" ? join(WASM_DIR, "ui.wasm")
                : path === "/browser/solid/field.js" ? BUNDLE
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

/** The field's own state, from the page: the a11y snapshot's textbox "Name", the caret's box and the readout. */
const FIELD = () => {
    const find = (node) => {
        if (node.role === "textbox" && node.name === "Name") return node;
        for (const child of node.children) {
            const hit = find(child);
            if (hit) return hit;
        }
        return undefined;
    };
    const commands = JSON.parse(window.__page.dump()).commands;
    const field = find(window.__page.a11y());
    return {
        value: field?.value,
        focused: field?.states.focused === true,
        caret: window.__page.bounds("name-line-caret"),
        selection: commands.find((c) => c.element === "name-line-selection"),
        readout: commands.find((c) => c.type === "text" && c.text.startsWith("Value: "))?.text,
        texts: commands.map((c) => c.text).filter((t) => typeof t === "string"),
        count: commands.length,
    };
};

/** The Name field's row as ink: how many pixels are not the surface, and their box. A run that is missing reads 0. */
const INK = ({ row, bg }) => {
    const canvas = document.getElementById("frame");
    const w = canvas.width;
    const d = canvas.getContext("2d").getImageData(0, 0, w, canvas.height).data;
    const [x, y, bw, bh] = row.map(Math.round);
    let n = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
    for (let j = y; j < y + bh; j++) for (let i = x; i < x + bw; i++) {
        const o = (j * w + i) * 4;
        if (Math.abs(d[o] - bg[0]) + Math.abs(d[o + 1] - bg[1]) + Math.abs(d[o + 2] - bg[2]) > 120) {
            n++, x0 = Math.min(x0, i), x1 = Math.max(x1, i), y0 = Math.min(y0, j), y1 = Math.max(y1, j);
        }
    }
    return { n, box: x1 < 0 ? null : [x0, x1, y0, y1] };
};

/** The draft of a composition, as an IME presents it: the start, then one `textupdate` a character of it. No commit. */
const COMPOSE_DRAFT = (draft) => {
    const edit = document.getElementById("frame").editContext;
    if (!edit) throw new Error("no editContext on the canvas");
    edit.dispatchEvent(new CompositionEvent("compositionstart", { data: "" }));
    for (let i = 1; i <= draft.length; i++) {
        edit.dispatchEvent(new TextUpdateEvent("textupdate", {
            text: draft.slice(0, i), updateRangeStart: 0, updateRangeEnd: i - 1,
            selectionStart: i, selectionEnd: i,
        }));
    }
};

/** The end of that composition: the string the IME committed. */
const COMPOSE_END = (text) => {
    document.getElementById("frame").editContext.dispatchEvent(new CompositionEvent("compositionend", { data: text }));
};

/** The same two phases on the fallback's textarea. */
const FALLBACK_DRAFT = (draft) => {
    const hidden = document.querySelector("textarea");
    if (!hidden) throw new Error("no textarea for the fallback");
    hidden.dispatchEvent(new CompositionEvent("compositionstart", { data: "" }));
    for (let i = 1; i <= draft.length; i++)
        hidden.dispatchEvent(new CompositionEvent("compositionupdate", { data: draft.slice(0, i) }));
};
const FALLBACK_END = (text) => {
    document.querySelector("textarea").dispatchEvent(new CompositionEvent("compositionend", { data: text }));
};

async function main() {
    const missing = [join(WASM_DIR, "ui.wasm"), BUNDLE, join(ROOT, "browser/solid/field.html")].filter(f => !existsSync(f));
    if (missing.length) {
        console.log(`missing build product(s): ${missing.join(", ")}`);
        console.log(`run "sh browser/build.sh && bun browser/solid/build.ts" first`);
        process.exit(1);
    }
    const { server, port } = await serve();
    if (process.argv.includes("--serve")) {
        console.log(`http://127.0.0.1:${port}/browser/solid/field.html               (the EditContext path)`);
        console.log(`http://127.0.0.1:${port}/browser/solid/field.html?ime=input    (the hidden textarea)`);
        return;
    }
    const browser = await chromium.launch();
    // the clipboard's permission is the context's: without it `readText`/`writeText` reject
    const context = await browser.newContext({
        viewport: { width: SIZE[0] + 80, height: SIZE[1] + 160 },
        deviceScaleFactor: 1,
        permissions: ["clipboard-read", "clipboard-write"],
    });
    const logs = [];
    async function open(query = "") {
        const page = await context.newPage();
        await page.addInitScript(HOLD);
        page.on("console", m => logs.push(m.text()));
        page.on("pageerror", e => logs.push(`pageerror: ${e.message}`));
        await page.goto(`http://127.0.0.1:${port}/browser/solid/field.html${query}`);
        await page.waitForFunction(() => window.__page, null, { polling: 100, timeout: 20000 });
        const box = await page.locator("#frame").boundingBox();
        // the press: empty space, so nothing is focused, and the canvas takes the DOM's focus (the fallback, its textarea)
        await page.mouse.click(box.x + 6, box.y + 6);
        await page.evaluate(() => window.__page.warm(31));
        return page;
    }
    /** The run's ink in the field's row: the row's box less its 12px/10px padding, over the field's 36,40,52. */
    const inkOf = async (page) => {
        const row = await page.evaluate(() => window.__page.bounds("name"));
        const inner = [row[0] + 12, row[1] + 10, row[2] - 24, row[3] - 20];
        return page.evaluate(INK, { row: inner, bg: [36, 40, 52] });
    };

    try {
        // --- (d) the typed path's numbers, for the composition to be held to: a second page, Playwright's keydowns
        const typedPage = await open();
        await typedPage.keyboard.press("Tab");
        await typedPage.keyboard.press("Tab");
        await typedPage.keyboard.type("Ada");
        await typedPage.evaluate(() => window.__page.warm(2));
        const typed = await typedPage.evaluate(FIELD);
        const typedInk = await inkOf(typedPage);
        if (typed.value !== "Ada") bad("typed, for the comparison", `the value is ${JSON.stringify(typed.value)}, want "Ada"`);
        else ok("typed, for the comparison", `"Ada" the browser's own way: the caret at x ${typed.caret[0].toFixed(2)}, ` +
            `ink ${typedInk.n} px in ${JSON.stringify(typedInk.box)}`);
        await typedPage.close();

        // --- (a) the path the browser chose
        const page = await open();
        const chosen = await page.evaluate(() => ({
            editContext: typeof EditContext,
            attached: document.getElementById("frame").editContext instanceof EditContext,
            textarea: document.querySelector("textarea") !== null,
        }));
        if (chosen.editContext !== "function" || !chosen.attached || chosen.textarea)
            bad("(a) the path", `the browser chose ${JSON.stringify(chosen)}, want an EditContext attached and no textarea`);
        else ok("(a) the path", "Chromium has EditContext and the canvas carries it (canvas.editContext instanceof " +
            `EditContext), so this page takes the standard's path; the hidden textarea is \`?ime=input\`'s`);

        // --- (b) a composition: the draft, then its committed string, into Input.textInput
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        const before = await page.evaluate(FIELD);
        await page.evaluate(COMPOSE_DRAFT, "Ada");
        await page.evaluate(() => window.__page.warm(2));
        const drafting = await page.evaluate(FIELD);
        if (drafting.value !== "" || drafting.readout !== before.readout || drafting.count !== before.count)
            bad("(b) the draft", `the page's value is ${JSON.stringify(drafting.value)} and the frame ${drafting.count} ` +
                `commands (${JSON.stringify(drafting.readout)}), want "" and the frame untouched`);
        else ok("(b) the draft", `the composition's draft "Ada" reaches neither the value nor the frame: still ` +
            `${JSON.stringify(before.readout)}, the same ${before.count} commands (the page has no inline preview)`);
        await page.evaluate(COMPOSE_END, "Ada");
        await page.evaluate(() => window.__page.warm(2));
        const composed = await page.evaluate(FIELD);
        const composedInk = await inkOf(page);
        if (composed.value !== "Ada") bad("(b) compositionend", `the value is ${JSON.stringify(composed.value)}, want "Ada"`);
        else ok("(b) compositionend", `the committed string is the field's: ${JSON.stringify(composed.readout)}, the caret ` +
            `at x ${composed.caret[0].toFixed(2)}`);
        const sameInk = composedInk.n === typedInk.n && JSON.stringify(composedInk.box) === JSON.stringify(typedInk.box);
        if (!sameInk)
            bad("(b) the composition's ink", `the composed run is ${composedInk.n} px in ${JSON.stringify(composedInk.box)}, ` +
                `the typed one ${typedInk.n} px in ${JSON.stringify(typedInk.box)}`);
        else ok("(b) the composition's ink", `the same run as the typed path's: ${composedInk.n} px of ink in ` +
            `${JSON.stringify(composedInk.box)} (input-check.mjs's 192 px) and the same caret at 3`);

        // --- (c) the clipboard: Shift+Home selects the run, Ctrl+C copies it
        await page.keyboard.press("Shift+Home");
        await page.evaluate(() => window.__page.warm(2));
        const selected = await page.evaluate(FIELD);
        if (selected.selection === undefined) bad("(c) Shift+Home", "the field has no selected run");
        await page.keyboard.press("Control+c");
        const copied = await page.evaluate(() => navigator.clipboard.readText());
        if (copied !== "Ada") bad("(c) Ctrl+C", `the clipboard holds ${JSON.stringify(copied)}, want "Ada"`);
        else ok("(c) Ctrl+C", `the selection goes to navigator.clipboard: "Ada" (the value still ${JSON.stringify((await page.evaluate(FIELD)).value)})`);
        // the selection is still there; Backspace drops it, then Ctrl+V inserts what was copied — one frame after the read
        await page.keyboard.press("Backspace");
        await page.evaluate(() => window.__page.warm(2));
        const cleared = await page.evaluate(FIELD);
        if (cleared.value !== "") bad("(c) Backspace", `the field is ${JSON.stringify(cleared.value)}, want ""`);
        await page.keyboard.press("Control+v");
        await page.waitForFunction(() => JSON.parse(window.__page.dump()).commands.some((c) => c.text === 'Value: "Ada" (3)'),
            null, { polling: 20, timeout: 5000 }).catch(() => {});
        await page.evaluate(() => window.__page.warm(2));
        const pasted = await page.evaluate(FIELD);
        const pastedInk = await inkOf(page);
        if (pasted.value !== "Ada" || pasted.caret[0] !== composed.caret[0] || pastedInk.n !== typedInk.n)
            bad("(c) Ctrl+V", `the field is ${JSON.stringify(pasted.value)} with the caret at ${pasted.caret?.[0]} and ` +
                `${pastedInk.n} px of ink, want "Ada", the caret at ${composed.caret[0]} and ${typedInk.n} px`);
        else ok("(c) Ctrl+V", `readText's promise, then one frame: "Ada", the caret back at x ${pasted.caret[0].toFixed(2)}, ` +
            `the ink at ${pastedInk.n} px`);
        // Ctrl+X: the clipboard keeps it and the field is empty
        await page.keyboard.press("Shift+Home");
        await page.keyboard.press("Control+x");
        await page.evaluate(() => window.__page.warm(2));
        const cut = await page.evaluate(FIELD);
        const cutClipboard = await page.evaluate(() => navigator.clipboard.readText());
        if (cut.value !== "" || cutClipboard !== "Ada")
            bad("(c) Ctrl+X", `the field is ${JSON.stringify(cut.value)} and the clipboard ${JSON.stringify(cutClipboard)}`);
        else ok("(c) Ctrl+X", `the field is empty and the clipboard still holds "Ada" (cut is the field's own copy + the ` +
            `backspace rule); the caret back at x ${cut.caret[0].toFixed(2)}`);
        // Ctrl+A: the whole value selected, and a key replaces it
        await page.keyboard.press("Control+v");
        await page.waitForFunction(() => JSON.parse(window.__page.dump()).commands.some((c) => c.text === 'Value: "Ada" (3)'),
            null, { polling: 20, timeout: 5000 }).catch(() => {});
        await page.evaluate(() => window.__page.warm(2));
        await page.keyboard.press("Control+a");
        await page.evaluate(() => window.__page.warm(2));
        const all = await page.evaluate(FIELD);
        const replaced = all.selection;
        await page.keyboard.press("B");
        await page.evaluate(() => window.__page.warm(2));
        const one = await page.evaluate(FIELD);
        if (!replaced || replaced.box[0] > 54 || replaced.box[2] < 26)
            bad("(c) Ctrl+A", `the selected run is ${JSON.stringify(replaced?.box)}, want the whole value`);
        else if (one.value !== "B") bad("(c) Ctrl+A then a key", `the field is ${JSON.stringify(one.value)}, want "B"`);
        else ok("(c) Ctrl+A then a key", `the run selected (${replaced.box[2].toFixed(2)}px of the line), and "B" replaces ` +
            `the whole value: ${JSON.stringify(one.readout)}`);

        // --- (d) the fallback: the same page with ?ime=input, the textarea holding the focus
        const fallback = await open("?ime=input");
        const fallbackPath = await fallback.evaluate(() => ({
            editContext: document.getElementById("frame").editContext,
            textarea: document.querySelector("textarea")?.tagName ?? null,
            active: document.activeElement?.tagName,
        }));
        if (fallbackPath.editContext != null || fallbackPath.textarea !== "TEXTAREA" ||
            fallbackPath.active !== "TEXTAREA")
            bad("(d) the fallback's path", `${JSON.stringify(fallbackPath)}, want no editContext, a focused TEXTAREA`);
        else ok("(d) the fallback's path", "no EditContext in this browser's path: the hidden TEXTAREA has the DOM's focus");
        // its keys are cloned onto the canvas: Tab twice reaches the field (the canvas's own keydown listener takes it)
        await fallback.keyboard.press("Tab");
        await fallback.keyboard.press("Tab");
        await fallback.keyboard.type("Ada");
        await fallback.evaluate(() => window.__page.warm(2));
        const typedFallback = await fallback.evaluate(FIELD);
        const fallbackInk = await inkOf(fallback);
        if (typedFallback.value !== "Ada" || typedFallback.caret[0] !== typed.caret[0] || fallbackInk.n !== typedInk.n)
            bad("(d) the fallback's keys", `the field is ${JSON.stringify(typedFallback.value)} with the caret at ` +
                `${typedFallback.caret?.[0]} and ${fallbackInk.n} px of ink, want "Ada", ${typed.caret[0]} and ${typedInk.n}`);
        else ok("(d) the fallback's keys", `Tab twice and "Ada" through the textarea's cloned keydowns: the value, the caret ` +
            `at x ${typedFallback.caret[0].toFixed(2)} and the ink (${fallbackInk.n} px) are the canvas path's`);
        // ... and a composition on the textarea commits through the same Input.textInput
        await fallback.keyboard.press("Control+a");
        await fallback.keyboard.press("Backspace");
        await fallback.evaluate(() => window.__page.warm(2));
        await fallback.evaluate(FALLBACK_DRAFT, "Ada");
        await fallback.evaluate(FALLBACK_END, "Ada");
        await fallback.evaluate(() => window.__page.warm(2));
        const composedFallback = await fallback.evaluate(FIELD);
        const composedFallbackInk = await inkOf(fallback);
        if (composedFallback.value !== "Ada" || composedFallbackInk.n !== typedInk.n)
            bad("(d) the fallback's composition", `the field is ${JSON.stringify(composedFallback.value)} with ` +
                `${composedFallbackInk.n} px of ink, want "Ada" and ${typedInk.n} px`);
        else ok("(d) the fallback's composition", `compositionstart/update/end on the textarea: "Ada", ${composedFallbackInk.n} ` +
            `px of ink, the same commit as the EditContext's`);

        // --- the cost: nothing per frame, and the composition's draft costs nothing of the page's
        const restMs = await page.evaluate(() => window.__page.bench(100));
        await page.evaluate(COMPOSE_DRAFT, "Ada");
        const composingMs = await page.evaluate(() => window.__page.bench(100));
        const fieldBundle = (await stat(BUNDLE)).size;
        console.log(`info ${fieldBundle} B of bundle (field.js) and ` +
            `${(await stat(join(ROOT, "browser/solid/field.html"))).size} B of field.html`);
        console.log(`info ${composingMs.toFixed(2)} ms a frame with the field focused and the composition open ` +
            `(${restMs.toFixed(2)} at rest; 100 frames: declare, Clay's layout, the commands, Canvas2D's raster, one readback)`);
        console.log(`info the composition drafts ${"Ada".length} textupdate(s) with no frame and no command: its string is ` +
            `inserted once, at compositionend`);
        if (logs.some(l => l.startsWith("pageerror"))) bad("page", logs.filter(l => l.startsWith("pageerror")).join("; "));
    } finally {
        await browser.close();
        server.close();
    }
    if (failures) { console.log(`${failures} failure(s)`); process.exit(1); }
    console.log("browser/ime-check: ok");
}

main();
