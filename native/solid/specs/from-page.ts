// `solid/specs/screen.json` and `solid/specs/responsive-pair.json`, written from pages this repository draws: the
// Widgets page at its own 360x760, and the Sky feed at a 240px column and at its own width. The frames are
// `solid/dump.ts`'s `capture` — the same call the goldens are stored with — and `frameOf` keeps the boxes
// (`rectangle`/`border`) and the texts (`text`) and drops the rest (see `src/figure/kinds/wireframe.ts`), so a wireframe
// is a cut of what the page drew. The sizes are the captured frames' own, so a page that changes size changes the spec.
//
//   bun solid/specs/from-page.ts                  # rewrite both specs here
//   bun solid/specs/from-page.ts "$TMPDIR/specs"  # ... or into another directory, for solid/test.sh's cmp
//
// `solid/test.sh` regenerates them and `cmp`s: a page edit changes its wireframe in the same commit, and a size that
// moved is a `cmp` line, not a review note. The specs' `source` records each page and the size it was captured at.
import "../plugin.ts";

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { FrameDump } from "../src/dump.ts";
import { frameOf } from "../src/figure/kinds/wireframe.ts";
import { check, type ResponsivePairSpec, type ScreenSpec, type WireSide } from "../src/figure/spec.ts";

/** The screen's page: its own size (PAGES.widgets, 360x760) is the capture's. */
export const SCREEN_PAGE = "widgets";
/** The pair's page (the Sky feed, a second real page) and the narrow width; the two heights are the page's own. 240
 *  and 360 are 30 and 45 cells: 30 + 2 + 45 fits a README's 80, and the pair's 469 nodes fit the browser's 512. */
export const PAIR_PAGE = "sky";
export const PAIR_NARROW_WIDTH = 240;

/** One captured frame as a side: its own size and the boxes and texts the wireframe draws. */
const sideOf = (dump: FrameDump): WireSide => ({
  width: dump.size[0],
  height: dump.size[1],
  ...frameOf(dump.commands),
});

/** The two specs, with the frames' own counts in their intent and their source naming the page and the size. */
export function specsOf(screen: FrameDump, pairWide: FrameDump, pairNarrow: FrameDump) {
  const screenSide = sideOf(screen);
  const wideSide = sideOf(pairWide);
  const narrowSide = sideOf(pairNarrow);
  const screenData = { page: SCREEN_PAGE, ...screenSide };
  const pairData = { page: PAIR_PAGE, narrow: narrowSide, wide: wideSide };
  const screenSpec: ScreenSpec = {
    kind: "screen",
    title: "The Widgets page, as a wireframe",
    intent:
      `The Widgets page's own last frame, cut to the cell grid: its ${screenData.boxes.length} rectangles and borders ` +
      `outlined and its ${screenData.texts.length} text runs in its words. The data is the page's command stream, not a ` +
      `drawing of it.`,
    source: `solid/specs/from-page.ts: solid/dump.ts's capture of the ${SCREEN_PAGE} page at ` +
      `${screenData.width}x${screenData.height}; ${screenData.boxes.length} boxes, ${screenData.texts.length} texts`,
    data: screenData,
  };
  const pairSpec: ResponsivePairSpec = {
    kind: "responsivePair",
    title: "The Sky page, at two widths",
    intent:
      `The same page at ${narrowSide.width} and ${wideSide.width}px, each its own captured frame: ` +
      `${narrowSide.boxes.length} boxes and ${narrowSide.texts.length} texts at ${narrowSide.width}, ` +
      `${wideSide.boxes.length} boxes and ${wideSide.texts.length} texts at ${wideSide.width}, side by side when ` +
      `they fit.`,
    source: `solid/specs/from-page.ts: solid/dump.ts's captures of the ${PAIR_PAGE} page at ` +
      `${narrowSide.width}x${narrowSide.height} and ${wideSide.width}x${wideSide.height}`,
    data: pairData,
  };
  return { screenSpec, pairSpec };
}

if (import.meta.main) {
  const { capture, PAGES } = await import("../dump.ts");
  const screen = await capture(SCREEN_PAGE);
  const wide = await capture(PAIR_PAGE);
  // the narrow side is the same page at 240px and the page's own height
  const narrow = await capture(PAIR_PAGE, undefined, { width: PAIR_NARROW_WIDTH, height: PAGES[PAIR_PAGE].height });
  const { screenSpec, pairSpec } = specsOf(screen, wide, narrow);
  for (const spec of [screenSpec, pairSpec]) {
    const problems = check(spec);
    if (problems.length) throw new Error(`${spec.kind} would not draw: ${problems.join(" ")}`);
  }
  for (const [name, dump] of [[SCREEN_PAGE, screen], [PAIR_PAGE, wide]] as const)
    if (dump.size[0] !== PAGES[name].width || dump.size[1] !== PAGES[name].height)
      throw new Error(`the ${name} capture is ${dump.size.join("x")}, PAGES says ${PAGES[name].width}x${PAGES[name].height}`);
  const dir = process.argv[2] ?? new URL(".", import.meta.url).pathname;
  mkdirSync(dir, { recursive: true });
  for (const [name, spec] of [["screen.json", screenSpec], ["responsive-pair.json", pairSpec]] as const) {
    writeFileSync(join(dir, name), `${JSON.stringify(spec, null, 2)}\n`);
    console.log(`from-page: ${join(dir, name)}`);
  }
  console.log(
    `from-page: ${screenSpec.data.boxes.length} boxes and ${screenSpec.data.texts.length} texts of the ${SCREEN_PAGE} page; ` +
      `${pairSpec.data.narrow.boxes.length}+${pairSpec.data.wide.boxes.length} boxes of the ${PAIR_PAGE} page at two widths`,
  );
}
