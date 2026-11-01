// The Figure page in the browser: one spec from the page's URL (`?spec=bars` reads solid/specs/bars.json), declared by
// the desktop's app/Figure.tsx **unmodified**, over Clay in ui.wasm (browser/solid/ffi-browser.ts) and drawn by
// browser/draw.js. The spec is the same file the desktop's `--spec` reads and the terminal's: it is fetched, checked with
// solid/src/figure/spec.ts, and only then mounted, so a refused spec throws with its sentences and no frame is drawn.
//
// `?spec=` and not an inlined literal: one spec file serves every target, and a page carries no copy of it to keep in
// step with solid/specs/. The canvas's CSS size is the layout's, so a 392x112 figure is a 392x112 canvas.
import { Figure, size } from "../../solid/app/Figure.tsx";
import { parse } from "../../solid/src/figure/spec.ts";
import { mountPage } from "./shell.ts";

const name = new URLSearchParams(location.search).get("spec") ?? "bars";
const response = await fetch(new URL(`../../solid/specs/${name}.json`, location.href));
if (!response.ok) throw new Error(`figure: solid/specs/${name}.json is ${response.status}`);
const { spec, problems } = parse(await response.text());
if (!spec) throw new Error(`figure: ${problems.join(" ")}`);

const { width, height } = size(spec);
const canvas = document.getElementById("frame") as HTMLCanvasElement;
canvas.style.width = `${width}px`;
canvas.style.height = `${height}px`;
canvas.setAttribute("aria-label", spec.title ?? "A figure from a glyph-kit spec");
await mountPage({ width, height, tree: ({ motion }) => () => Figure({ spec, motion }) });
