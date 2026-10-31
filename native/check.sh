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

# The Dialog page's overlays (solid/app/Dialog.tsx, its styles in the .tsx, so header() prints them as literals): both of
# the modal's Clay root floats (the backdrop that dims the page and the panel over it) and the menu floated off
# zoom-trigger. Its state is a click, not a prop, so examples/dialog/states.json names one state per overlay and each file
# is the page at that state; the state's :focus comes with the click (the dialog focuses Cancel, the menu its first item),
# so the generated frame carries style_3_focus and style_10_focus. Regenerated here and cmp'd, as the Sensors page's are.
D="bun --conditions=development generator/page-to-c.ts solid/app/Dialog.tsx --states examples/dialog/states.json"
mkdir -p "$OUT/dialog-gen"
$D --out "$OUT/dialog-gen/page_generated.c"
$D --state menu --name app_frame_menu --out "$OUT/dialog-gen/page_generated_menu.c"
$D --state dialog --name app_frame_dialog --out "$OUT/dialog-gen/page_generated_dialog.c"
for f in page_generated.c page_generated_menu.c page_generated_dialog.c; do
  cmp "$OUT/dialog-gen/$f" "examples/dialog/$f" || { echo "FAIL: examples/dialog/$f is stale"; exit 1; }
done
# What a command array cannot show, because the field is the host's once the frame is declared: the float's pointer
# capture and the element it is attached to. A float's box and z are test.sh's command comparison; these are the
# declaration's (a mutation here names the field, not a box).
grep -qF '.pointerCaptureMode = CLAY_POINTER_CAPTURE_MODE_CAPTURE' examples/dialog/page_generated_dialog.c ||
  { echo "FAIL: the dialog's floats do not capture the pointer (floating.pointerCaptureMode)"; exit 1; }
grep -qF '.attachTo = CLAY_ATTACH_TO_ELEMENT_WITH_ID' examples/dialog/page_generated_menu.c ||
  { echo "FAIL: the menu is not attached to an element (floating.attachTo)"; exit 1; }
grep -qF '.attachPoints = { .element = CLAY_ATTACH_POINT_LEFT_TOP, .parent = CLAY_ATTACH_POINT_LEFT_BOTTOM }' \
  examples/dialog/page_generated_menu.c ||
  { echo "FAIL: the menu does not hang off its trigger's bottom edge (floating.attachPoints)"; exit 1; }
# and the literals compile on their own (Clay only: no ThorVG, no drawing)
for f in page_generated.c page_generated_menu.c page_generated_dialog.c; do
  cc -std=c99 -Wall -Wno-unused-variable -I "$CLAY_H" -c "$OUT/dialog-gen/$f" -o "$OUT/dialog-gen/$f.o"
done

# The List page's generated C (solid/app/List.tsx; its styles are in the .tsx, so header() prints them as literals): the
# page's own window of rows, its scrollbar's numbers — the value channel, baked, because the page wrote them from its tick
# and a static page has no channel — and its viewport as Clay's scroll container. Two files, because the window is the
# offset's: at rest (rows 0..8, the stored golden's frame) and one notch down (10px, rows 0..9: the tenth is the
# overscan). The offset itself is not a declaration: the clip element is declared through `clip_scroll`, which reads Clay's
# own offset where the element is open (Clay_GetScrollOffset(), exactly as solid/native/ui.c's ui_open does), and the C
# host puts the number in the container. The three greps below pin what a command array cannot show.
L="bun --conditions=development generator/page-to-c.ts solid/app/List.tsx --tick 31"
mkdir -p "$OUT/list-gen"
$L --name app_frame_list --out "$OUT/list-gen/page_generated.c"
$L --scroll list=10 --name app_frame_list_scrolled --out "$OUT/list-gen/page_generated_scrolled.c"
for f in page_generated.c page_generated_scrolled.c; do
  cmp "$OUT/list-gen/$f" "examples/list/$f" || { echo "FAIL: examples/list/$f is stale"; exit 1; }
done
grep -qF '.clip = { .horizontal = 1, .vertical = 1 }' examples/list/page_generated.c ||
  { echo 'FAIL: the viewport is not a clip element (css.overflow("hidden")): no Clay_ClipElementConfig'; exit 1; }
grep -qF 'CLAY(CLAY_ID("list"), clip_scroll(' examples/list/page_generated.c ||
  { echo "FAIL: the viewport is not declared through clip_scroll: its childOffset would stay 0"; exit 1; }
grep -qF 'd.clip.childOffset = Clay_GetScrollOffset();' examples/list/page_generated.c ||
  { echo "FAIL: clip_scroll does not read Clay's scroll offset (Clay_GetScrollOffset)"; exit 1; }
for f in page_generated.c page_generated_scrolled.c; do
  cc -std=c99 -Wall -Wno-unused-variable -I "$CLAY_H" -c "$OUT/list-gen/$f" -o "$OUT/list-gen/$f.o"
done

echo "c: the headers, the C against them and the generated pages are current"
