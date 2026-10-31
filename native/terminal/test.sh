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

# ---- the Sky feed, the terminal host's second page ---------------------------------------------------------------
# `solid/app/Sky.tsx` unmodified: the bar with the tablist, the feed the page scrolls itself, the status line. The C feed
# (terminal/sky.c) is the behaviour's oracle, not the cells': the C card has a hand-cut border and separator, its name and
# meta share one row, its body is one clipped row, its counts are the glyphs `↩ ⟲ ♥`, it draws no avatar and its footer is
# the key hints; the Solid card has one cell of side padding and no border at rest, its meta is its own row, its body wraps
# at words, its counts are words, its avatar is an image the host skips, and its footer is the page's status line. So the
# two frames are not identical: this block stores the Solid frame as its own guard and counts the distance.
WHEELS="WheelDown,WheelDown,WheelDown,WheelDown,WheelDown,WheelDown,WheelDown,WheelDown"
rm -f "$OUT"/solid-sky* "$OUT"/c-sky*
$SOLID --page sky --cols 80 --rows 20 --dump "$OUT/solid-sky.txt"
cmp "$OUT/solid-sky.txt" terminal/expected-solid-sky.txt || {
  echo "FAIL: the Solid Sky feed at 80x20 is not terminal/expected-solid-sky.txt"; exit 1; }
identical "the Sky feed's frame is terminal/expected-solid-sky.txt (80x20 cells, the page's own guard)"
$SOLID --page sky --cols 80 --rows 20 --keys Tab,ArrowRight --dump "$OUT/solid-sky-focus.txt"
cmp "$OUT/solid-sky-focus.txt" terminal/expected-solid-sky-focus.txt || {
  echo "FAIL: the Solid Sky feed after Tab,ArrowRight is not terminal/expected-solid-sky-focus.txt"; exit 1; }
identical "after Tab and ArrowRight (the bar focused, Science) it is expected-solid-sky-focus.txt, the C focus frame's twin"
grep -q "Erik Strub" "$OUT/solid-sky-focus.txt" || {
  echo "FAIL: ArrowRight on the tablist did not switch the feed (the bar's active tab is still Discover)"; exit 1; }
grep -q "Michael Warburton" "$OUT/solid-sky-focus.txt" && {
  echo "FAIL: the tab switch showed Science but left Discover's first post"; exit 1; }
identical "and the tab switch is the page's: the tablist's ArrowRight shows Science, Discover's first post gone"

# the focus order: the tablist is the first stop, on the active tab, and a cell's tab focus is the C bar's active tab (the
# accent fill and an on-accent label), because a 2px border on a one-row tab is the label's own row; the feed is the second
# stop and its `:focus` ring is the page's ring token, one cell of box characters around the viewport
$SOLID --page sky --cols 80 --rows 20 --keys Tab --ansi "$OUT/solid-sky-tab.ansi" --dump "$OUT/solid-sky-tab.txt"
grep -qF "${ESC}[48;2;59;156;240m" "$OUT/solid-sky-tab.ansi" || {
  echo "FAIL: Tab reaches the tablist but the active tab has no accent fill (48;2;59;156;240)"; exit 1; }
grep -qF "${ESC}[38;2;255;255;255m" "$OUT/solid-sky-tab.ansi" || {
  echo "FAIL: the focused tab's label is not the on-accent white (38;2;255;255;255)"; exit 1; }
grep -q "Discover" "$OUT/solid-sky-tab.txt" || { echo "FAIL: the focused tab lost its label"; exit 1; }
identical "Tab is the tablist: the active tab wears the accent fill and a white label (the C bar's active tab, not its ring)"
$SOLID --page sky --cols 80 --rows 20 --keys Tab,Tab --ansi "$OUT/solid-sky-feed.ansi" --dump "$OUT/solid-sky-feed.txt"
grep -qF "${ESC}[38;2;92;176;255m" "$OUT/solid-sky-feed.ansi" || {
  echo "FAIL: Tab,Tab gives the feed no ring (the page's 92,176,255 border)"; exit 1; }
grep -q "┌" "$OUT/solid-sky-feed.txt" || { echo "FAIL: the feed's ring is not drawn in box characters"; exit 1; }
identical "Tab again is the feed: its focus ring is the page's 92,176,255 border, one cell around the viewport"

# the feed's own scroll (solid/src/vscroll.ts): ArrowDown 40px, the wheel a 10px notch. At 80x20 the feed's end is 24px
# (its content is 312: the cards plus the page's 12px paddings and 8px gaps, less the 288px viewport), so a key and a wheel
# flick land on the same clamp; at 80x12 the wheel runs to the 152px end.
$SOLID --page sky --cols 80 --rows 20 --keys Tab,Tab,ArrowDown --settle 40 --offset --dump "$OUT/solid-sky-20down.txt" |
  tee "$OUT/solid-sky-20down.log"
grep -q "offset -24 px (-1.50 rows)" "$OUT/solid-sky-20down.log" || {
  echo "FAIL: ArrowDown did not reach the feed's 24px end at 80x20"; exit 1; }
$SOLID --page sky --cols 80 --rows 20 --keys "$WHEELS" --settle 90 --offset --dump "$OUT/solid-sky-20wheel.txt" |
  tee "$OUT/solid-sky-20wheel.log"
grep -q "offset -24 px (-1.50 rows)" "$OUT/solid-sky-20wheel.log" || {
  echo "FAIL: the wheel did not land on the key's -24px at 80x20"; exit 1; }
identical "ArrowDown (40px) and eight WheelDown notches land on the same clamp, -24px (-1.5 rows) at 80x20"

# the scroll the C page can compare: at 80x12 both pages scroll to the end. The C page's list holds no offset — scroll_into
# re-declares from the selected card — and the Solid page's track moves 9.5 rows; the states and the row/cell count below
# are the comparison.
./terminal/demo --page sky --cols 80 --rows 12 --keys ArrowDown,ArrowDown --dump "$OUT/c-sky-12-down.txt"
grep -q "Michael Warburton" "$OUT/c-sky-12-down.txt" && {
  echo "FAIL: the C page's list did not scroll past its first post"; exit 1; }
grep -q "alexjungle" "$OUT/c-sky-12-down.txt" || {
  echo "FAIL: the C page's list did not show its third post"; exit 1; }
$SOLID --page sky --cols 80 --rows 12 --keys "$WHEELS" --settle 90 --offset --dump "$OUT/solid-sky-12.txt" |
  tee "$OUT/solid-sky-12.log"
grep -q "offset -152 px (-9.50 rows)" "$OUT/solid-sky-12.log" || {
  echo "FAIL: the wheel did not run to the feed's 152px end at 80x12"; exit 1; }
grep -q "Michael Warburton" "$OUT/solid-sky-12.txt" && {
  echo "FAIL: the Solid feed did not scroll past its first post (Michael Warburton is still visible)"; exit 1; }
grep -q "357 likes" "$OUT/solid-sky-12.txt" || {
  echo "FAIL: the Solid feed did not scroll to its third post's counts"; exit 1; }
identical "the feed scrolls to its end at 80x12 (9.5 rows), as the C list scrolls to its third post (one card at a time)"

# a card's own onClick: a click on the body opens the thread screen (Enter on the feed presses the first card's own onClick
# in the thread's block below; the page's cards are not Tab stops, so Enter has no card of its own). The host's `load`
# settles the screen with the app's recorded thread a frame after it mounts, so the frame the click's release makes is
# still the loading row (`--settle 1`), and the app's rows are the frame after it
$SOLID --page sky --cols 80 --rows 20 --click 20,4 --settle 1 --dump "$OUT/solid-sky-open.txt"
thread_opened() {
  grep -q "Loading the thread…" "$1" || {
    echo "FAIL: a click on a card did not open its thread's loading state"; return 1; }
  return 0
}
thread_opened "$OUT/solid-sky-open.txt" || exit 1
identical "a click on a card runs the page's own onClick: the thread screen opens in its loading state"

# the C feed is the oracle of behaviour, not of cells: the row-by-row distance at rest, after the tab switch, and after the
# scroll. `sky_diff` counts code points, one a cell, over the 80 columns: rows, cells, the worst row.
sky_diff() {
  node -e '
    const fs = require("fs");
    const [a, b, n] = process.argv.slice(1);
    const read = (p) => fs.readFileSync(p, "utf8").split("\n").slice(0, +n);
    const A = read(a), B = read(b);
    const per = [];
    let cells = 0, same = 0, worst = 0, wv = 0;
    for (let y = 0; y < +n; y++) {
      const p = [...(A[y] ?? "")].slice(0, 80), q = [...(B[y] ?? "")].slice(0, 80);
      while (p.length < 80) p.push(" ");
      while (q.length < 80) q.push(" ");
      let d = 0;
      for (let x = 0; x < 80; x++) if (p[x] !== q[x]) d++;
      cells += d;
      if (!d) same++;
      if (d > wv) (wv = d), (worst = y);
      per.push(d);
    }
    console.log(cells + " cells, " + same + " of " + n + " rows the same, the worst row " + worst + " (" + wv + " of 80); rows " + per.join(","));
  ' "$1" "$2" "$3"
}
base=$(sky_diff terminal/expected-sky.txt "$OUT/solid-sky.txt" 20)
echo "solid, terminal: the Sky feed against terminal/expected-sky.txt (the C feed): $base"
case "$base" in
  "1251 cells, 0 of 20 rows the same, the worst row 1 (80 of 80);"*) ;;
  *) echo "FAIL: the Sky feed's row/cell distance from the C feed changed (expected 1251 cells, row 1 the worst)"; exit 1 ;;
esac
science=$(sky_diff terminal/expected-sky-focus.txt "$OUT/solid-sky-focus.txt" 20)
echo "solid, terminal: after the tab switch against terminal/expected-sky-focus.txt: $science"
case "$science" in
  "1397 cells, 0 of 20 rows the same, the worst row 1 (80 of 80);"*) ;;
  *) echo "FAIL: the Science frame's row/cell distance from the C feed changed (expected 1397 cells)"; exit 1 ;;
esac
scrolled=$(sky_diff "$OUT/c-sky-12-down.txt" "$OUT/solid-sky-12.txt" 12)
echo "solid, terminal: after the scroll against the C list's scrolled frame (80x12): $scrolled"
case "$scrolled" in
  "684 cells, 0 of 12 rows the same, the worst row 1 (80 of 80);"*) ;;
  *) echo "FAIL: the scrolled frame's row/cell distance from the C list changed (expected 684 cells)"; exit 1 ;;
esac
echo "solid, terminal: no row is identical to the C feed's: its bar labels carry '1/2/3' and its padding, its six separator"
echo "solid, terminal: rows (the card borders) and its key-hint footer have no counterpart, and its body rows are one clipped"
echo "solid, terminal: row where the page wraps. The nearest rows are the body lines (row 3: 31 of 80 cells, row 15: 6 of 80:"
echo "solid, terminal: the same words at a one-cell inset), not a match."

# the two mutations this slice has to catch. `--mutate scroll` drops the page's offset before Clay (term_scroll_to 0): the
# feed stays at row 0, and the scrolling check's own message fails. `--mutate tab` never flushes the frame the tab key lands
# on: the feed switches inside the page but the bar's active tab stays Discover, and the switch check's message fails.
sky_scrolled() {
  grep -q "Michael Warburton" "$1" && {
    echo "FAIL: the Solid feed did not scroll past its first post (Michael Warburton is still visible)"; return 1; }
  grep -q "357 likes" "$1" || { echo "FAIL: the Solid feed did not scroll to its third post's counts"; return 1; }
  return 0
}
$SOLID --page sky --cols 80 --rows 12 --mutate scroll --keys "$WHEELS" --settle 90 --offset \
  --dump "$OUT/solid-sky-mut-scroll.txt" > "$OUT/solid-sky-mut-scroll.log"
grep -q "offset 0 px" "$OUT/solid-sky-mut-scroll.log" || {
  echo "FAIL: the scroll mutation did not keep the feed at row 0"; exit 1; }
if sky_scrolled "$OUT/solid-sky-mut-scroll.txt"; then
  echo "FAIL: the scroll mutation was not caught by the scrolling check"; exit 1; fi
echo "solid, terminal: mutation (the page's offset dropped before Clay): caught — the feed stays at row 0, and the FAIL above is the check's message"
sky_switched() {
  grep -q "Erik Strub" "$1" || {
    echo "FAIL: ArrowRight on the tablist did not switch the feed (the bar's active tab is still Discover)"; return 1; }
  return 0
}
$SOLID --page sky --cols 80 --rows 20 --mutate tab --keys Tab,ArrowRight --dump "$OUT/solid-sky-mut-tab.txt"
if sky_switched "$OUT/solid-sky-mut-tab.txt"; then
  echo "FAIL: the tab-switch mutation was not caught by the switch check"; exit 1; fi
echo "solid, terminal: mutation (no flush after the tab key): caught — the bar's active tab stays Discover, and the FAIL above is the check's message"

# the cost: the feed's frame over 1600 cells and 34 commands, and the same cells as ANSI
skybench=$($SOLID --page sky --cols 80 --rows 20 --bench 50)
echo "$skybench"
case "$skybench" in
  *"ms a frame"*"1600 cells"*) ;;
  *) echo "FAIL: the Sky --bench printed no frame time or cell count"; exit 1 ;;
esac
echo "solid, terminal: the Sky feed's 8 comparisons above; the C feed is the oracle of behaviour, not of cells"

# ---- the thread, the page's second screen -------------------------------------------------------------------------
# `Sky.tsx` mounts the thread as a root float over the feed when a card is opened: its own onClick (a click on the card,
# or Enter on the feed, which the host delivers as the first card's onClick — the C feed's Enter opens the focused post's
# thread). Its data is the app's **recorded** answer, apps/csssky/test/fixtures/thread.json through the page's own
# `screenOf` (the fixture solid/thread.test.ts hands it): the host's `load` is a promise it settles with that screen one
# frame after the screen mounts, so the loading row is a frame the run draws and the app's rows are the one after it.
# The C thread (terminal/thread.c) is the behaviour's oracle, not the cells': its cards all carry a hand-cut border, its
# name and meta share a row, its body is clipped to one row, its counts are the glyphs `↩ ⟲ ♥` and its bar says
# "sky · Thread (esc: back)", where the page's bar stays the page's. The row/cell distance is counted, as the feed's is.
rm -f "$OUT"/solid-thread*
$SOLID --page sky --cols 80 --rows 26 --keys Tab,Tab,Enter --settle 3 --dump "$OUT/solid-thread.txt"
cmp "$OUT/solid-thread.txt" terminal/expected-solid-thread.txt || {
  echo "FAIL: the Solid thread at 80x26 is not terminal/expected-solid-thread.txt"; exit 1; }
identical "the thread's frame is terminal/expected-solid-thread.txt (80x26 cells, the page's own guard)"
grep -q "Mina Kimes" "$OUT/solid-thread.txt" || {
  echo "FAIL: the loader's answer did not land (the recorded thread's parent row is missing)"; exit 1; }
grep -q "Thanks for being with us here on Bluesky" "$OUT/solid-thread.txt" || {
  echo "FAIL: the recorded thread's posts are not all drawn"; exit 1; }
identical "the host's load promise lands the app's recorded thread: its parent, the post and the reply tree"
# Enter on the card: the loading row first, the rows a frame later (the screen mounts a frame after the ask, so the
# loading frame is the one after that)
$SOLID --page sky --cols 80 --rows 20 --keys Tab,Tab,Enter --settle 1 --dump "$OUT/solid-thread-loading.txt"
grep -q "Loading the thread…" "$OUT/solid-thread-loading.txt" || {
  echo "FAIL: Enter on the feed did not open the thread's loading state"; exit 1; }
identical "Enter on a card (the host's press of the page's own onClick) opens the thread in its loading state"
# the thread's clip on the page's own machine (a second instance of src/vscroll.ts): Tab from the Back reaches it, and
# ArrowDown is 40px. The keys need a frame with no input between the rows landing and the first scroll: the page measures
# its content from the last layout (`-` is that frame)
$SOLID --page sky --cols 80 --rows 26 --keys Tab,Tab,Enter,-,Tab,-,ArrowDown --settle 40 --offset \
  --dump "$OUT/solid-thread-scroll.txt" | tee "$OUT/solid-thread-scroll.log"
grep -q "thread offset -40 px (-2.50 rows)" "$OUT/solid-thread-scroll.log" || {
  echo "FAIL: ArrowDown on the thread's clip did not move it 40px"; exit 1; }
grep -q "Talked to @wired.com" "$OUT/solid-thread-scroll.txt" && {
  echo "FAIL: the thread did not scroll past its first card"; exit 1; }
identical "ArrowDown on the thread's clip scrolls it 40px (-2.5 rows), and the first card leaves"
# Escape is the page's back: the exit's 0.3s is drawn as the screen staying (its group's alpha and translate are a
# cell's to drop), so the check waits it out; then the feed is back, with the card the Enter selected
$SOLID --page sky --cols 80 --rows 26 --keys Tab,Tab,Enter,Escape --settle 30 --dump "$OUT/solid-thread-back.txt"
thread_back() {
  grep -q "Mina Kimes" "$1" && {
    echo "FAIL: Escape did not leave the thread (its rows are still drawn)"; return 1; }
  grep -q "Michael Warburton" "$1" || { echo "FAIL: Escape did not come back to the feed"; return 1; }
  return 0
}
thread_back "$OUT/solid-thread-back.txt" || exit 1
identical "Escape (the page's own back) leaves the thread, and the feed is back with its card selected"
# the counted comparison with the C thread (26 rows, 80 columns, as native/test.sh draws it)
base=$(sky_diff terminal/expected-thread.txt "$OUT/solid-thread.txt" 26)
echo "solid, terminal: the thread against terminal/expected-thread.txt (the C thread): $base"
case "$base" in
  "1957 cells, 0 of 26 rows the same, the worst row 1 (80 of 80);"*) ;;
  *) echo "FAIL: the thread's row/cell distance from the C thread changed (expected 1957 cells, row 1 the worst)"; exit 1 ;;
esac
echo "solid, terminal: the thread's worst row is the C card's top border against the page's head row (the C's bar is"
echo "solid, terminal: 'sky · Thread (esc: back)', the page's bar is the page's); the nearest rows are the body lines"
echo "solid, terminal: (row 2: 67, row 3: 79 — its words at a different inset and length) and the counts row (row 11: 71),"
echo "solid, terminal: where the words are the same and the C's are the glyphs ↩ ⟲ ♥. No row is identical."
# the two mutations of this screen. `--mutate open` drops a card's own onClick (a click and Enter leave the feed):
# the loading check's grep fails. `--mutate back` never hands the page an Escape: the thread stays, and the back check's
# "Escape did not leave the thread" is the message
$SOLID --page sky --cols 80 --rows 26 --mutate back --keys Tab,Tab,Enter,Escape --settle 30 \
  --dump "$OUT/solid-thread-mut-back.txt"
if thread_back "$OUT/solid-thread-mut-back.txt"; then
  echo "FAIL: the back mutation was not caught by the back check"; exit 1; fi
echo "solid, terminal: mutation (no Escape reaches the page): caught — the thread stays, and the FAIL above is the check's message"
$SOLID --page sky --cols 80 --rows 20 --mutate open --click 20,4 --settle 1 --dump "$OUT/solid-thread-mut-open.txt"
if thread_opened "$OUT/solid-thread-mut-open.txt"; then
  echo "FAIL: the open mutation was not caught by the loading check"; exit 1; fi
echo "solid, terminal: mutation (a card's own onClick dropped): caught — the feed's frame stays, and the FAIL above is the check's message"
# the cost: the thread's frame over 2080 cells (26 rows) and 66 commands, and the same cells as ANSI
threadbench=$($SOLID --page sky --cols 80 --rows 26 --keys Tab,Tab,Enter --settle 3 --bench 50)
echo "$threadbench"
case "$threadbench" in
  *"ms a frame"*"2080 cells"*) ;;
  *) echo "FAIL: the thread's --bench printed no frame time or cell count"; exit 1 ;;
esac
echo "solid, terminal: the thread's 5 comparisons above; the C thread is the oracle of behaviour, not of cells"

# ---- the profile, the page's third screen -------------------------------------------------------------------------
# `Profile.tsx` is not an entry of its own: `Sky.tsx` calls its `createProfile` and declares the screen in its own tree, so
# there is no `--page profile` here (the C `demo --page profile` is a stack entry point its own host has). It is the
# page's state: a click on a card's author row (the app's link to /profile/handle) opens it, with the app's recorded
# getProfile and three author feeds (apps/csssky's fixtures, read by app/profile.ts through the page's own postOf) —
# there is nothing for the host to hand it, unlike the thread's `load`. The C profile (terminal/profile.c) is the
# behaviour's oracle, not the cells': its banner is a two-row band, its tab is an accent pill, its cards carry the app's
# reason line ("Pinned", "Reposted by ...") and their bodies are clipped to one row.
rm -f "$OUT"/solid-profile*
$SOLID --page sky --cols 80 --rows 26 --click 20,2 --settle 5 --dump "$OUT/solid-profile.txt"
cmp "$OUT/solid-profile.txt" terminal/expected-solid-profile.txt || {
  echo "FAIL: the Solid profile at 80x26 is not terminal/expected-solid-profile.txt"; exit 1; }
identical "the profile's frame is terminal/expected-solid-profile.txt (80x26 cells, the page's own guard)"
grep -q "official Bluesky account" "$OUT/solid-profile.txt" || {
  echo "FAIL: the profile is not the recording's header"; exit 1; }
grep -q "35M followers · 15 following · 865 posts" "$OUT/solid-profile.txt" || {
  echo "FAIL: the profile's counts are not the recording's"; exit 1; }
profile_opened() {
  grep -q "Posts Replies Media" "$1" || {
    echo "FAIL: a click on a card's author row did not open the profile"; return 1; }
  return 0
}
profile_opened "$OUT/solid-profile.txt" || exit 1
identical "a click on a card's author row opens the profile: the recording's head, its bio, its counts and its tabs"
# the tabs are the page's headless tablist: Tab from the Back reaches it and ArrowRight switches Posts to Replies; the
# list starts at its top again (a fresh machine for the tab)
$SOLID --page sky --cols 80 --rows 26 --click 20,2 --keys Tab,ArrowRight --settle 5 --dump "$OUT/solid-profile-replies.txt"
grep -q "But we think that researchers should be the priority" "$OUT/solid-profile-replies.txt" || {
  echo "FAIL: Tab,ArrowRight on the profile's tablist did not switch Posts to Replies"; exit 1; }
grep -q "Bluesky is an open social network" "$OUT/solid-profile-replies.txt" && {
  echo "FAIL: the Replies tab still shows the Posts tab's pinned card"; exit 1; }
identical "Tab,ArrowRight on the profile's tablist switches Posts to Replies (and its list starts at the top)"
# the list scrolls on its own machine: Tab,Tab from the Back to the clip, ArrowDown 40px. The header and the tablist are
# the clip's siblings, so they stay put
$SOLID --page sky --cols 80 --rows 26 --click 20,2 --keys Tab,Tab,ArrowDown --settle 40 --offset \
  --dump "$OUT/solid-profile-scroll.txt" | tee "$OUT/solid-profile-scroll.log"
grep -q "profile offset -40 px (-2.50 rows)" "$OUT/solid-profile-scroll.log" || {
  echo "FAIL: ArrowDown on the profile's clip did not move it 40px"; exit 1; }
grep -q "@bsky.app · Oct 17, 2024" "$OUT/solid-profile-scroll.txt" && {
  echo "FAIL: the profile's list did not scroll past its first card"; exit 1; }
grep -q "35M followers · 15 following · 865 posts" "$OUT/solid-profile-scroll.txt" || {
  echo "FAIL: the profile's header scrolled with its list"; exit 1; }
identical "ArrowDown on the profile's clip scrolls the list 40px (-2.5 rows); its header and tabs stay put"
# Escape is the page's back (its fallback, whichever stop is focused): the profile leaves, the feed is back
$SOLID --page sky --cols 80 --rows 26 --click 20,2 --keys Escape --settle 30 --dump "$OUT/solid-profile-back.txt"
profile_back() {
  grep -q "Posts Replies Media" "$1" && {
    echo "FAIL: Escape did not leave the profile (its tablist is still drawn)"; return 1; }
  grep -q "Michael Warburton" "$1" || { echo "FAIL: Escape did not come back to the feed"; return 1; }
  return 0
}
profile_back "$OUT/solid-profile-back.txt" || exit 1
identical "Escape leaves the profile, and the feed is back"
# the counted comparison with the C profile (26 rows, 80 columns)
base=$(sky_diff terminal/expected-profile.txt "$OUT/solid-profile.txt" 26)
echo "solid, terminal: the profile against terminal/expected-profile.txt (the C profile): $base"
case "$base" in
  "1837 cells, 0 of 26 rows the same, the worst row 2 (80 of 80);"*) ;;
  *) echo "FAIL: the profile's row/cell distance from the C profile changed (expected 1837 cells, row 2 the worst)"; exit 1 ;;
esac
echo "solid, terminal: the profile's worst row is the C profile's banner band (two rows of colour) against the page's"
echo "solid, terminal: head row and drawn disc; the nearest rows are the header's (row 5: 38, the bio's words; row 8: 35,"
echo "solid, terminal: the counts; row 11: 29, the tabs), where the words are the same and the C's are one row a line with"
echo "solid, terminal: its own tones. No row is identical."
# the profile's own mutation: a click that never opens it leaves the feed's frame, and the profile check's message fails
$SOLID --page sky --cols 80 --rows 26 --mutate open --click 20,2 --settle 5 --dump "$OUT/solid-profile-mut-open.txt"
if profile_opened "$OUT/solid-profile-mut-open.txt"; then
  echo "FAIL: the open mutation was not caught by the profile check"; exit 1; fi
echo "solid, terminal: mutation (the author row's own onClick dropped): caught — the feed's frame stays, and the FAIL above is the check's message"
# the cost: the profile's frame over 2080 cells and 69 commands, and the same cells as ANSI
profilebench=$($SOLID --page sky --cols 80 --rows 26 --click 20,2 --settle 5 --bench 50)
echo "$profilebench"
case "$profilebench" in
  *"ms a frame"*"2080 cells"*) ;;
  *) echo "FAIL: the profile's --bench printed no frame time or cell count"; exit 1 ;;
esac
echo "solid, terminal: the profile's 5 comparisons above; the C profile is the oracle of behaviour, not of cells"
echo "solid, terminal: three of the Sky page's four screens run as the page's own (the feed, the thread, the profile); the"
echo "solid, terminal: notifications stay C (terminal/notify.c) — Sky.tsx has no notifications screen to run"
