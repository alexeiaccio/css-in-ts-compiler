// The text renderer's CLI: one glyph-kit spec as characters, the same drawing the desktop, the terminal and the browser
// make of it. It reads the layout (`src/figure/text.ts`), so a new kind draws here the moment `layout` returns its rows.
//
//   bun solid/figure.ts solid/specs/bars.json                 the figure, 80 cells wide
//   bun solid/figure.ts solid/specs/pipeline.json --width 60  cut at 60 display cells (a line that is longer says …)
//   bun solid/figure.ts solid/specs/funnel.json --compact      plain ASCII: # a cell, = a partial one, > the focus mark
//   bun solid/figure.ts solid/specs/funnel.json --markdown     ## title, the intent, the fence, _source_
//   bun solid/figure.ts solid/specs/pipeline.json --svg out.svg   the figure as one standalone SVG
//   bun solid/figure.ts solid/specs/palette.json --html page.html  the figure as one self-contained page
//   bun solid/figure.ts solid/specs/bars.json --svg -           any export to stdout with -
//   bun solid/figure.ts --redraw native/README.md             the document with every marked figure drawn again (stdout)
//
// An invalid spec is refused with every sentence `check` has, on stderr, exit 1, and no figure on stdout and no export
// file — as the desktop and terminal hosts refuse before a frame. `--redraw` throws the same way, naming the document and
// the line.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { parse } from "./src/figure/spec.ts";
import { html } from "./src/figure/export/html.ts";
import { svg } from "./src/figure/export/svg.ts";
import { markdown, redrawDoc, render } from "./src/figure/text.ts";

const fail = (message: string, code = 1): never => {
  console.error(`figure: ${message}`);
  process.exit(code);
};

const args = process.argv.slice(2);
let specPath: string | undefined;
let docPath: string | undefined;
let mode: "text" | "markdown" = "text";
let compact = false;
let width = 80;
/** An export's destination: an SVG or an HTML page, to a file or `-` for stdout. */
let exportAs: { mode: "svg" | "html"; path: string } | undefined;
for (let i = 0; i < args.length; i++) {
  const arg = args[i]!;
  if (arg === "--width") {
    width = Number(args[++i]);
    if (!Number.isInteger(width) || width < 1) fail(`--width needs a whole number of cells above zero: it is ${arg} ${args[i]}`, 2);
  } else if (arg === "--redraw") {
    docPath = args[++i];
    if (!docPath) fail("--redraw needs a Markdown file", 2);
  } else if (arg === "--svg" || arg === "--html") {
    const path = args[++i];
    if (!path) fail(`${arg} needs a file, or - for stdout`, 2);
    if (exportAs) fail(`one export at a time: --${exportAs.mode} and ${arg}`, 2);
    exportAs = { mode: arg === "--svg" ? "svg" : "html", path };
  } else if (arg === "--compact") compact = true;
  else if (arg === "--markdown") mode = "markdown";
  else if (arg === "--text") mode = "text";
  else if (arg.startsWith("--")) fail(`unknown flag ${arg}`, 2);
  else if (!specPath) specPath = arg;
  else fail(`one spec at a time: ${specPath} and ${arg}`, 2);
}

if (docPath) {
  const file = resolve(docPath);
  try {
    process.stdout.write(redrawDoc(readFileSync(file, "utf8"), file, { width, compact }));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
  process.exit(0);
}

if (!specPath) fail("a spec: bun solid/figure.ts solid/specs/bars.json [--text|--markdown|--compact] [--width N] [--svg|--html FILE]", 2);
const { spec, problems } = parse(readFileSync(resolve(specPath), "utf8"));
if (!spec) fail(problems.join("\n"));
// the validation is above, so an invalid spec has written nothing: no file is opened until the spec can be drawn
if (exportAs) {
  const output = exportAs.mode === "svg" ? svg(spec) : html(spec);
  if (exportAs.path === "-") process.stdout.write(output);
  else
    try {
      writeFileSync(resolve(exportAs.path), output);
    } catch (error) {
      fail(`cannot write ${exportAs.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  process.exit(0);
}
process.stdout.write(mode === "markdown" ? markdown(spec, { width, compact }) : `${render(spec, { width, compact })}\n`);
