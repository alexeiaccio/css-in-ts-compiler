#!/bin/sh
# Step 6, the Solid half: one page as Solid on the terminal. `solid/native/term.c` is Clay over terminal/cells.c,
# render.c, measure.c and termbox2 (build/solid/libterm.dylib), `terminal/solid.ts` is solid/main.ts's loop shape on it,
# and the page is `solid/app/Sensors.tsx` unmodified: the host re-cuts page.c's two lengths for cells through the value
# channel (the root's padding and gap, the pill's height) and draws the pill's ring from its own focus, as page.c's
# `pill_style(focused)` does.
#
# The C page is the oracle. At the page's own height (11 cells: the C page's list starts on row 12) the Solid frame is
# the C frame byte for byte, as a dump and as ANSI, dark and light, and after Tab and ArrowDown. At the suite's 20 rows
# the page's first 11 rows are the same and the rows below are the C page's list and footer, which Sensors.tsx does not
# draw: that gap is the one this slice does not close, and the last comparison counts the rows it does.
#
# Runs on its own (from any directory) and from native/test.sh, which calls it after the C page's own checks.
set -e
cd "$(dirname "$0")/.."
OUT="${NATIVE_OUT:-${TMPDIR:-/tmp}/cssints-terminal-solid}"
mkdir -p "$OUT"
[ -x ./terminal/demo ] || sh terminal/build.sh >/dev/null
sh solid/native/build.sh >/dev/null
SOLID="bun terminal/solid.ts"
ESC=$(printf '\033')
n=0
identical() { n=$((n + 1)); echo "solid, terminal: $1 -> identical"; }

# the page's own frame, in the two themes, and after the focus leaves the pill: one Bun start each (the page's styles and
# its .tsx are compiled by child processes, which is most of a run), and every frame the run makes is written beside it
rm -f "$OUT"/solid-dark.* "$OUT"/solid-light.* "$OUT"/solid-20.* "$OUT"/solid-click.*
$SOLID --cols 80 --rows 11 --keys Tab,ArrowDown --frames-out "$OUT/solid-dark"
./terminal/demo --cols 80 --rows 11 --dump "$OUT/term-page-dark.txt"
cmp "$OUT/solid-dark.0.txt" "$OUT/term-page-dark.txt" || {
  echo "FAIL: the Solid page's dark frame is not the C page's (80x11 cells)"; exit 1; }
identical "the page's frame, dark, is the C page's own (80x11 cells)"
./terminal/demo --cols 80 --rows 11 --keys Tab,ArrowDown --dump "$OUT/term-page-focus.txt"
cmp "$OUT/solid-dark.2.txt" "$OUT/term-page-focus.txt" || {
  echo "FAIL: the Solid frame after Tab,ArrowDown is not the C page's"; exit 1; }
identical "after Tab and ArrowDown (the ring off the pill, nowhere to go) the frame is the C page's own"
# ... and the stored focus frame's own rows: at 20 rows the C page's ring is the list's, on row 12, so the page's 11
# rows are expected-focus.txt's 11
head -11 terminal/expected-focus.txt > "$OUT/solid-focus-head.txt"
head -11 "$OUT/solid-dark.2.txt" > "$OUT/solid-focus-got.txt"
cmp "$OUT/solid-focus-got.txt" "$OUT/solid-focus-head.txt" || {
  echo "FAIL: the Solid frame after Tab,ArrowDown is not expected-focus.txt's first 11 rows"; exit 1; }
identical "and the page's rows are expected-focus.txt's own (the C page's ring is the list's, on row 12)"
# the ANSI path too: the same cells, the truecolour SGR, the runs merged
./terminal/demo --cols 80 --rows 11 --ansi "$OUT/term-page-dark.ansi"
cmp "$OUT/solid-dark.0.ansi" "$OUT/term-page-dark.ansi" || {
  echo "FAIL: the Solid frame's ANSI is not the C page's"; exit 1; }
identical "its ANSI is the C page's own (truecolour, SGR runs merged)"
# ... and the ANSI's own two properties, as the C page's test checks them: a truecolour ink, and a fill that is one
# escape a row rather than one a cell (3 rows of 25 cells = 3)
grep -qF "${ESC}[38;2;230;60;60m" "$OUT/solid-dark.0.ansi" || {
  echo "FAIL: the Solid ANSI has no red title (38;2;230;60;60)"; exit 1; }
runs=$(grep -oF "${ESC}[48;2;36;40;52m" "$OUT/solid-dark.0.ansi" | wc -l | tr -d ' ')
[ "$runs" = 3 ] || {
  echo "FAIL: the pill's surface background has $runs SGR runs, want 3 (merged, not one a cell)"; exit 1; }
identical "the pill's fill is 3 SGR runs (one a row, not one a cell) and the title is 38;2;230;60;60"

$SOLID --cols 80 --rows 11 --theme light --frames-out "$OUT/solid-light"
./terminal/demo --cols 80 --rows 11 --theme light --dump "$OUT/term-page-light.txt"
cmp "$OUT/solid-light.0.txt" "$OUT/term-page-light.txt" || {
  echo "FAIL: the Solid page's light frame is not the C page's (80x11 cells)"; exit 1; }
identical "the same in the light theme (the theme variant, folded by the same styles.ts)"

# the suite's own size: 20 rows, where the C page's list (rows 12 to 17) and the footer (row 18) are Solid's gap. The
# page's rows are the stored frame's rows, byte for byte; the difference is counted, not hidden
$SOLID --cols 80 --rows 20 --keys Tab,ArrowDown --dump "$OUT/solid-20.txt"
head -11 terminal/expected-dark.txt > "$OUT/solid-20-head.txt"
head -11 "$OUT/solid-20.txt" > "$OUT/solid-20-got.txt"
cmp "$OUT/solid-20-got.txt" "$OUT/solid-20-head.txt" || {
  echo "FAIL: the Solid page's rows at 20 rows are not expected-dark.txt's first 11"; exit 1; }
identical "at 80x20 the page's 11 rows are expected-dark.txt's own (rows 12-19 are the C page's list, not the page's)"
page_rows=$(wc -l < "$OUT/solid-20-got.txt" | tr -d ' ')
echo "solid, terminal: the page is $page_rows of the C page's 20 rows; rows 12-19 ($((20 - page_rows)) rows, 9 x 80 cells) are terminal/page.c's list and footer, which Sensors.tsx does not have"

# the page is live: a press on the pill is the page's own onClick, so Units flips and the label, the values and the
# magnitude change with it; the pointer stays on the pill, so the pill is hovered (termbox2 reports no motion, so only a
# press moves the pointer)
$SOLID --cols 80 --rows 12 --click 40,9 --frames-out "$OUT/solid-click"
grep -q "switch to m/s²" "$OUT/solid-click.3.txt" || {
  echo "FAIL: a click on the Units pill did not flip the page to g"; exit 1; }
grep -q "accel g" "$OUT/solid-click.3.txt" || { echo "FAIL: the click did not change the caption"; exit 1; }
grep -qF "${ESC}[48;2;48;53;68m" "$OUT/solid-click.3.ansi" || {
  echo "FAIL: a click leaves the pointer on the pill, whose hover fill is 48,53,68"; exit 1; }
identical "a click on the pill flips Units through the page's own onClick (hover fill 48,53,68, as a mouse leaves it)"

# termbox2: the live binding needs a terminal -- tb_init opens /dev/tty -- so it runs under a pty, one frame and out (a
# screen, as main.c's --frames 1). Truecolour, because COLORTERM says the terminal has it
if command -v script >/dev/null 2>&1; then
  rm -f "$OUT/solid-live.log"
  script -q "$OUT/solid-live.log" sh -c "stty rows 24 cols 80; COLORTERM=truecolor bun terminal/solid.ts --frames 2" >/dev/null 2>&1
  grep -q "terminal: 2 frames, 80x24" "$OUT/solid-live.log" || {
    echo "FAIL: termbox2 drew no frame from the Solid host"; exit 1; }
  grep -qF "${ESC}[38;2;" "$OUT/solid-live.log" || { echo "FAIL: the live frame wrote no truecolour SGR"; exit 1; }
  identical "termbox2 drew the Solid page's screen (80x24, truecolour) under a pty"
else
  echo "solid, terminal: no script(1), the termbox2 screen check skipped"
fi

# the cost: the frame (declare + Clay + the commands into cells) and the same cells as ANSI, on this machine
bench=$($SOLID --bench 20)
echo "$bench"
case "$bench" in
  *"ms a frame"*) ;;
  *) echo "FAIL: --bench printed no frame time"; exit 1 ;;
esac
dylib=$(ls -l build/solid/libterm.dylib | awk '{ print $5 }')
echo "solid, terminal: $((dylib / 1024)) KB of libterm.dylib (Clay, cells.c, render.c, measure.c, termbox2)"
echo "solid, terminal: $n comparisons, all identical, and the two numbers above"
