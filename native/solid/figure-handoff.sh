#!/bin/sh
# The handoff and QA figures' desktop half (kinds/handoff.ts): the three stored frames are the page at rest, and
# `before-after.json` is what `specs/from-frames.ts` writes from two frames of the Widgets page, and `layer-stack.json`
# from the Dialog's modal and menu frames — the same discipline as `from-tokens.ts`: a stale spec is this `cmp`, not a
# review note.
#
#   sh solid/figure-handoff.sh        # from native/, or from anywhere (it cds)
#
# The three frames are the page's at rest (`--warm 30`), as every other figure's; the two Widgets frames the spec is made
# from are the switch off (`Tab,Tab`, focused) and on (`Tab,Tab,Space`), captured in-process by solid/dump.ts.
set -e
cd "$(dirname "$0")/.."
FIG="${TMPDIR:-/tmp}/cssints-figure-handoff"
mkdir -p "$FIG/specs"
bun solid/main.ts figure --spec solid/specs/redline.json --warm 30 --expect solid/frames/figure-redline.png
bun solid/main.ts figure --spec solid/specs/before-after.json --warm 30 --expect solid/frames/figure-before-after.png
bun solid/main.ts figure --spec solid/specs/qa-checklist.json --warm 30 --expect solid/frames/figure-qa-checklist.png
bun solid/specs/from-frames.ts "$FIG/specs" >/dev/null
cmp "$FIG/specs/before-after.json" solid/specs/before-after.json || {
  echo "FAIL: solid/specs/before-after.json is not what specs/from-frames.ts writes from the two Widgets frames; commit its output"
  exit 1
}
cmp "$FIG/specs/layer-stack.json" solid/specs/layer-stack.json || {
  echo "FAIL: solid/specs/layer-stack.json is not what specs/from-frames.ts writes from the Dialog's modal and menu frames; commit its output"
  exit 1
}
echo "figure handoff: three stored frames are the page's, and before-after.json and layer-stack.json are from-frames.ts's frames, byte for byte (cmp)"
# ... and the same three in the browser, by name: browser/solid/figure.ts fetches the same files with `?spec=`, and
# browser/figure-handoff-check.mjs holds each frame to its golden within 4px (Canvas2D's advance against ThorVG's).
if command -v zig >/dev/null 2>&1 && command -v bun >/dev/null 2>&1 &&
   node -e 'process.exit(require("node:fs").existsSync(require("playwright").chromium.executablePath()) ? 0 : 1)' 2>/dev/null; then
  bun browser/solid/build.ts >/dev/null
  node browser/figure-handoff-check.mjs
else
  echo "figure handoff, in a browser: no zig, bun or Playwright chromium, skipped (bun browser/solid/build.ts && node browser/figure-handoff-check.mjs)"
fi
