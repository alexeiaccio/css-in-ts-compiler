#!/bin/sh
# Everything that needs no drawing: a Solid styles module to a header, the C that uses it compiled and run, and the Solid
# pages evaluated at build time to C and compared with the C the repository commits (the Sensors page's five files, the
# InlineDemo page, and the --text hook). Any machine with node, bun and cc runs it — no SDL3, no ThorVG, no browser:
# test.sh calls it first and then the targets that draw, ci.sh calls it on its own.
set -e
cd "$(dirname "$0")"
CLAY_H="${CLAY_H:-$PWD/vendor/clay}"
OUT="${NATIVE_OUT:-${TMPDIR:-/tmp}/cssints-native-check}"
mkdir -p "$OUT/sensors" "$OUT/sensors-gen"
node --conditions=development generator/clay-header.ts examples/units/styles.ts "$OUT/styles.h"
cc -std=c99 -I "$OUT" -I "$CLAY_H" examples/units/same.c -lm -o "$OUT/same"
"$OUT/same"
# the Sensors header (a state, a theme, fonts) against the same clay.h
node --conditions=development generator/clay-header.ts examples/sensors/styles.ts "$OUT/sensors/styles.h"
cc -std=c99 -Wall -Wno-unused-variable -I "$OUT/sensors" -I "$CLAY_H" examples/sensors/header.c -lm -o "$OUT/header"
"$OUT/header"

# The Solid Sensors page evaluated at build time to C, in three states, and its render commands compared by gen.c with
# the hand-written page.c (base, clicked, pressed; each in the dark and the light theme). The generator is deterministic:
# the committed C is regenerated here and must come out byte for byte, so the file in git cannot rot. The fourth file is
# the same page as a state machine (`--events`): one frame a state, and the transition table gen.c then walks (base, a
# press on Units, its release, the click again, and back) against the hand page at every step.
P="bun --conditions=development generator/page-to-c.ts solid/app/Sensors.tsx --styles examples/sensors/styles.ts --states examples/sensors/states.json"
$P --state use_g=false --out "$OUT/sensors-gen/page_generated.c"
$P --state use_g=true --name app_frame_g --out "$OUT/sensors-gen/page_generated_g.c"
$P --state pressed=true --name app_frame_pressed --out "$OUT/sensors-gen/page_generated_pressed.c"
# the IMAGE=1 variant: the page's 32x32 glyph, a prop of the Solid page (--prop) as page.c's IMAGE=1 is the host's
$P --prop image=true --name app_frame_image --out "$OUT/sensors-gen/page_generated_image.c"
$P --events "$OUT/sensors-gen/page_generated_events.c" --events-name sensors
for f in page_generated.c page_generated_g.c page_generated_pressed.c page_generated_image.c page_generated_events.c; do
  cmp "$OUT/sensors-gen/$f" "examples/sensors/$f" || { echo "FAIL: examples/sensors/$f is stale"; exit 1; }
done
cc -std=c99 -Wall -Wno-unused-variable -I "$OUT/sensors" -I "$CLAY_H" -I generator examples/sensors/gen.c \
  "$OUT/sensors-gen/page_generated.c" "$OUT/sensors-gen/page_generated_g.c" \
  "$OUT/sensors-gen/page_generated_pressed.c" "$OUT/sensors-gen/page_generated_image.c" \
  "$OUT/sensors-gen/page_generated_events.c" -lm -o "$OUT/gen"
"$OUT/gen"
# a page with its styles in the .tsx (InlineDemo.tsx, no styles module): the literals header() prints, compiled
bun --conditions=development generator/page-to-c.ts solid/app/InlineDemo.tsx --out "$OUT/sensors-gen/inline_generated.c"
cc -std=c99 -Wall -Wno-unused-variable -I "$CLAY_H" -c "$OUT/sensors-gen/inline_generated.c" -o "$OUT/inline_generated.o"
# ...and a page whose strings are the target's (--text): the board's live sample, one call per text element. The
# header lists the indices; the file has to compile on its own, with only the hook's prototype from it.
bun --conditions=development generator/page-to-c.ts solid/app/Sensors.tsx --styles examples/sensors/styles.ts \
  --text sensors_text --out "$OUT/sensors-gen/page_text.c"
grep -q 'CLAY_TEXT(sensors_text(6), unitsLabel_text)' "$OUT/sensors-gen/page_text.c" ||
  { echo "FAIL: --text did not hook the pill's label"; exit 1; }
cc -std=c99 -Wall -Wno-unused-variable -I "$OUT/sensors" -I "$CLAY_H" -c "$OUT/sensors-gen/page_text.c" -o "$OUT/page_text.o"

echo "c: the headers, the C against them and the generated pages are current"
