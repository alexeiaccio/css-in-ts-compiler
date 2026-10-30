#!/bin/sh
# The generator on the Units example, then the C against Clay. CLAY_H is the folder of clay.h (vendor/clay by default;
# the same file as esp32's). Runs from native/ whatever the caller's directory is (`bun run test:native` at the repo root).
set -e
cd "$(dirname "$0")"
# Steps 1-5: the Clay headers and the C against them, and the Solid pages evaluated at build time to C against the C in
# git (check.sh, which a machine with no graphics stack runs on its own); it writes into $OUT here, beside the frames.
OUT="${TMPDIR:-/tmp}/cssints-native-test"
NATIVE_OUT="$OUT" sh check.sh

# The desktop: the Sensors page headless, against its stored frames: the SDL renderer (the software one; the window
# uses the GPU), dark, after a scripted click on Units, and the light theme
sh desktop/build.sh examples/sensors >/dev/null
./build/sensors/app --raster sdl --expect examples/sensors/expected.png
./build/sensors/app --raster sdl --click 180 250 --expect examples/sensors/expected-g.png
THEME=light ./build/sensors/app --raster sdl --expect examples/sensors/expected-light.png
# the same page on ThorVG's software raster (brew thorvg, the default), against its own frames
./build/sensors/app --raster thorvg --expect examples/sensors/expected-thorvg.png
./build/sensors/app --raster thorvg --click 180 250 --expect examples/sensors/expected-thorvg-g.png
THEME=light ./build/sensors/app --raster thorvg --expect examples/sensors/expected-thorvg-light.png
# Units held down: the pressed look (units_active), written while the pointer is still down
./build/sensors/app --raster thorvg --press 180 250 --expect examples/sensors/expected-pressed.png
# IMAGE=1 adds the page's image variant (a 32x32 glyph above the caption): the ThorVG renderer loads it from the path
# in imageData, once per path, and stretches it into the command's box. A frame of its own: the plain frames stay as they are
IMAGE=1 ./build/sensors/app --raster thorvg --expect examples/sensors/expected-thorvg-image.png
# the same page on ThorVG's WebGPU canvas (Metal through wgpu-native): only when its build exists, because brew's
# thorvg has no GPU engine. Its frame is its own: the shapes and colours are the CPU frame's, the anti-aliasing is not
if [ -x ./build/sensors/app-gpu ]; then
  ./build/sensors/app-gpu --raster thorvg-gpu --expect examples/sensors/expected-thorvg-gpu.png
fi
# The C page's command stream, through the emitter every target dumps with (desktop/clay_dump.c), against solid/goldens/
# sensors.json — the Solid Sensors page's last frame, not a golden of the C page's own: the two pages are the same tree
# from the same styles.ts, and both are laid out with ThorVG's metrics, so their commands are the same fields with the
# same values (measured: all 10 commands, boxes included). A C host keeps no id strings, so a command's `element` is null
# and dump-check.ts resolves it by id from the golden; that script compares the two byte for byte after solid/src/
# format.ts, and names the command and the field when one moved.
./build/sensors/app --raster thorvg --dump "$OUT/sensors-commands.json"
node dump-check.ts solid/goldens/sensors.json "$OUT/sensors-commands.json" --name sensors

# The generated page as the host's page (desktop/host.c, PAGE_STATES): the state is the host's, and a click on the pill
# asks the generated table (`sensors_next`) and draws `sensors_frame(state, light)` — no rebuild, no page signal. A click
# leaves the pointer over the pill, so the frame is the use_g one *hovered*: the same frame as the hand page's --click
# (expected-thorvg-g.png). The trajectory: base -> press -> release -> press -> release, ending in state 1, printed.
sh desktop/build.sh examples/sensors --generated >/dev/null
./build/sensors/app-generated --raster thorvg --dump "$OUT/sensors-generated.json"
node dump-check.ts solid/goldens/sensors.json "$OUT/sensors-generated.json" --name sensors-generated
./build/sensors/app-generated --raster thorvg --click 180 250 --expect examples/sensors/expected-thorvg-g.png
# the same click as a scene (examples/sensors/scenes/sensors-click.json, the format of solid/scenes/*.json), read by the
# C host's own parser (desktop/scene.c) and replayed one frame a step: the last frame is the same goldens' frame, and
# the state the replay ended in is the table's, printed
scene_out=$(./build/sensors/app-generated --raster thorvg --scene examples/sensors/scenes/sensors-click.json \
  --expect examples/sensors/expected-thorvg-g.png)
echo "$scene_out"
case "$scene_out" in
  *'ending state 4 "use_g=true + hover Units"'*) ;;
  *) echo "FAIL: the scene's last state is not the table's use_g + hover"; exit 1 ;;
esac

# Solid 2 on the desktop: the Sensors page as JSX, its frames against the same stored ThorVG frames
sh solid/test.sh
# the focus manager (no DOM): Tab order, roving focus, restore, and a seeded random walk
node focus/test/focus.test.ts

# Headless widgets (button, switch, checkbox, disclosure) on neutral parts: ported scenarios and a walk against the Quint models
(cd headless && bun run typecheck:native && bun run test:native)

# Step 6: the terminal target. Clay's commands into character cells (terminal/cells.c, render.c, measure.c), the
# Sensors page plus a list in C. The cell layer's own checks, then three stored frames: the dark page, the light
# theme, and the page after Tab (focus the list) and ArrowDown (select the second row). A cell is 8x16, so the page
# is 80x20 cells. In a dump, '.' is a cell whose background is not the page's (the pill's fill, the selected row).
sh terminal/build.sh >/dev/null
cc -std=c99 -Wall -Wno-unused-variable -Wno-missing-field-initializers -I terminal -I vendor/clay \
  terminal/test_cells.c terminal/cells.c terminal/render.c -lm -o "$OUT/test_cells"
"$OUT/test_cells"
./terminal/demo --cols 80 --rows 20 --dump "$OUT/term-dark.txt"
cmp "$OUT/term-dark.txt" terminal/expected-dark.txt || { echo "FAIL: terminal/expected-dark.txt is stale"; exit 1; }
./terminal/demo --cols 80 --rows 20 --theme light --dump "$OUT/term-light.txt"
cmp "$OUT/term-light.txt" terminal/expected-light.txt || { echo "FAIL: terminal/expected-light.txt is stale"; exit 1; }
./terminal/demo --cols 80 --rows 20 --keys Tab,ArrowDown --dump "$OUT/term-focus.txt"
cmp "$OUT/term-focus.txt" terminal/expected-focus.txt || { echo "FAIL: terminal/expected-focus.txt is stale"; exit 1; }
# the ANSI path, which the dump cannot show: truecolour SGR for a known cell, and runs merged (the surface fill is
# one escape a row that carries it -- 4 rows, 123 cells -- not one an empty cell)
ESC=$(printf '\033')
./terminal/demo --cols 80 --rows 20 --ansi "$OUT/term.ansi"
grep -qF "${ESC}[38;2;230;60;60m" "$OUT/term.ansi" || { echo "FAIL: the title has no red (38;2;230;60;60)"; exit 1; }
grep -qF "${ESC}[38;2;235;235;240m" "$OUT/term.ansi" || { echo "FAIL: the pill's label has no ink (38;2;235;235;240)"; exit 1; }
runs=$(grep -oF "${ESC}[48;2;36;40;52m" "$OUT/term.ansi" | wc -l | tr -d ' ')
[ "$runs" = 4 ] || { echo "FAIL: the surface background has $runs SGR runs, want 4 (merged, not one a cell)"; exit 1; }
# the ported screen: apps/csssky-tui's home feed (terminal/sky.c), its styles from terminal/sky_styles.ts, its data from
# apps/csssky's recorded fixtures. 80x20: the bar, three post cards of six cells each, the footer
./terminal/demo --page sky --cols 80 --rows 20 --dump "$OUT/sky.txt"
cmp "$OUT/sky.txt" terminal/expected-sky.txt || { echo "FAIL: terminal/expected-sky.txt is stale"; exit 1; }
# a click is the pointer's cell and a button's down and up, through the same page input termbox2's events reach: a click
# on the second tab (cell 22,0 of the bar) switches the feed to Science, so Discover's first post is gone
./terminal/demo --page sky --cols 80 --rows 20 --click 22,0 --dump "$OUT/sky-click.txt"
grep -q "Erik Strub" "$OUT/sky-click.txt" || { echo "FAIL: a click on the Science tab did not switch the feed"; exit 1; }
grep -q "Michael Warburton" "$OUT/sky-click.txt" && { echo "FAIL: the click did not leave Discover"; exit 1; }
# and a selection below the visible rows scrolls the list (sky_settled: Clay's boxes, another layout pass): at 13 rows
# two cards fit, the third does not, and ArrowDown twice brings it into view from the top
./terminal/demo --page sky --cols 60 --rows 13 --keys ArrowDown,ArrowDown --dump "$OUT/sky-scroll.txt"
grep -q "alexjungle" "$OUT/sky-scroll.txt" || { echo "FAIL: the third post did not scroll into view"; exit 1; }
grep -q "Michael Warburton" "$OUT/sky-scroll.txt" && { echo "FAIL: the list did not scroll past the first post"; exit 1; }
# a click on a card focuses it and opens its thread (the app's onMouseDown), and Escape comes back to the same frame
./terminal/demo --page sky --cols 80 --rows 20 --click 10,3 --dump "$OUT/sky-open.txt"
grep -q "Thread (esc: back)" "$OUT/sky-open.txt" || { echo "FAIL: a click on a card did not open the thread"; exit 1; }
./terminal/demo --page sky --cols 80 --rows 20 --keys Enter,Escape --dump "$OUT/sky-back.txt"
cmp "$OUT/sky-back.txt" "$OUT/sky.txt" || { echo "FAIL: Escape did not come back to the feed frame"; exit 1; }

# the focus layer (terminal/focus.c, the counterpart of focus/src/focus.ts): Tab order and the release at either end,
# the roving group's arrows with and without wrap, leaving a group at its edge, memory, Home/End, a disabled stop
cc -std=c99 -Wall -Wno-unused-variable -I terminal terminal/test_focus.c terminal/focus.c -o "$OUT/test_focus"
"$OUT/test_focus"
# the focus state, drawn from the focus and not from two ints: Tab out of the list (it is the last stop, so the layer
# releases it and the page presses it again) lands on the bar, and Right moves the roving tab focus, which is the
# active feed. The frame is the Science feed, and the accent's glyphs are the title's three: no card has the ring.
./terminal/demo --page sky --cols 80 --rows 20 --keys Tab,ArrowRight --dump "$OUT/sky-focus.txt"
cmp "$OUT/sky-focus.txt" terminal/expected-sky-focus.txt || { echo "FAIL: terminal/expected-sky-focus.txt is stale"; exit 1; }
acc=$(awk '$2 == "59,156,240" { print $3 }' "$OUT/sky-focus.txt")
[ "$acc" = 3 ] || { echo "FAIL: the accent has $acc glyphs with the bar focused, want 3 (the title, no card ring)"; exit 1; }
# the bar's arrows wrap (its group says so): Left from the first tab is News, whose feed has no fixture ("Nothing here yet")
./terminal/demo --page sky --cols 80 --rows 20 --keys Tab,ArrowLeft --dump "$OUT/sky-wrap.txt"
grep -q "Nothing here yet" "$OUT/sky-wrap.txt" || { echo "FAIL: Left from the first tab did not wrap to News"; exit 1; }
# and the list's edge leaves it (its group says leave): three rows down is the last card, then the bar, where no card
# has the accent border: the accent's glyphs are the title's three again
./terminal/demo --page sky --cols 80 --rows 20 --keys ArrowDown,ArrowDown,ArrowDown --dump "$OUT/sky-leave.txt"
acc=$(awk '$2 == "59,156,240" { print $3 }' "$OUT/sky-leave.txt")
[ "$acc" = 3 ] || { echo "FAIL: the last card's edge left the ring on $acc accent glyphs, want 3 (the bar's focus)"; exit 1; }

# the thread screen (terminal/thread.c): the parent, the post (full time and counts in words) and the replies, the
# indented depth, the accent border on the focused row. 80x26: two and a half cards
./terminal/demo --page thread --cols 80 --rows 26 --dump "$OUT/thread.txt"
cmp "$OUT/thread.txt" terminal/expected-thread.txt || { echo "FAIL: terminal/expected-thread.txt is stale"; exit 1; }
# the ring is the focus: the root card's six rows start with the accent border. A click on the parent's author row
# moves it there (five... six rows of that card), so the row that starts with the accent is the parent's
ansi_rows() { awk -v esc="$ESC" '{gsub(esc "\\[[0-9]+;1H", "\n"); print}' "$1"; }
accent_rows() { ansi_rows "$1" | grep -ac "^${ESC}\\[38;2;59;156;240m" || true; }
./terminal/demo --page thread --cols 80 --rows 26 --ansi "$OUT/thread.ansi"
n=$(accent_rows "$OUT/thread.ansi")
[ "$n" = 6 ] || { echo "FAIL: the thread's focused card has $n accent rows, want 6 (the root's card)"; exit 1; }
./terminal/demo --page thread --cols 80 --rows 26 --click 20,2 --ansi "$OUT/thread-click.ansi"
n=$(accent_rows "$OUT/thread-click.ansi")
[ "$n" = 6 ] || { echo "FAIL: a click on the parent's card left $n accent rows, want 6"; exit 1; }
ansi_rows "$OUT/thread-click.ansi" | awk -v esc="$ESC" 'index($0, esc "[38;2;59;156;240m") == 1 {
  l = $0; gsub(esc "\\[[0-9;]*m", "", l); print l }' | grep -q "Mina Kimes" ||
  { echo "FAIL: the click did not put the ring on the parent's card"; exit 1; }
# ArrowDown moves it to the first reply, whose card is five rows: the ring follows the focus
./terminal/demo --page thread --cols 80 --rows 26 --keys ArrowDown --ansi "$OUT/thread-focus.ansi"
n=$(accent_rows "$OUT/thread-focus.ansi")
[ "$n" = 5 ] || { echo "FAIL: after ArrowDown $n accent rows, want 5 (the first reply's card)"; exit 1; }
ansi_rows "$OUT/thread-focus.ansi" | awk -v esc="$ESC" 'index($0, esc "[38;2;59;156;240m") == 1 {
  l = $0; gsub(esc "\\[[0-9;]*m", "", l); print l }' | grep -q "jlp2024" ||
  { echo "FAIL: ArrowDown did not move the ring to the first reply"; exit 1; }
# and the thread scrolls: five rows down puts a reply of a reply's parent in view, and the parent's card out
./terminal/demo --page thread --cols 80 --rows 26 --keys ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown \
  --dump "$OUT/thread-scroll.txt"
grep -q "Mdubs949" "$OUT/thread-scroll.txt" || { echo "FAIL: the thread did not scroll to the later replies"; exit 1; }
grep -q "Mina Kimes" "$OUT/thread-scroll.txt" && { echo "FAIL: the thread did not scroll past the parent"; exit 1; }

# the profile screen (terminal/profile.c): apps/csssky's profile on its recorded getProfile, its header and the three
# tabs' posts. 80x26: the banner band, the identity, the bio, the counts, the tabs, the pinned card and a repost
./terminal/demo --page profile --cols 80 --rows 26 --dump "$OUT/profile.txt"
cmp "$OUT/profile.txt" terminal/expected-profile.txt || { echo "FAIL: terminal/expected-profile.txt is stale"; exit 1; }
# a click on the Replies tab switches the list (its reason lines are new), as the app's tab does
./terminal/demo --page profile --cols 80 --rows 26 --click 12,8 --dump "$OUT/profile-click.txt"
grep -q "Replying to @minakimes.bsky.social" "$OUT/profile-click.txt" ||
  { echo "FAIL: a click on the Replies tab did not switch the tab"; exit 1; }
grep -q "Reposted by bsky.app" "$OUT/profile-click.txt" && { echo "FAIL: the click did not leave Posts"; exit 1; }
# Enter opens the focused post's thread, Escape comes back to the profile
./terminal/demo --page profile --cols 80 --rows 26 --keys Enter,Escape --dump "$OUT/profile-back.txt"
cmp "$OUT/profile-back.txt" "$OUT/profile.txt" || { echo "FAIL: Escape did not come back to the profile frame"; exit 1; }
# the list scrolls: two rows down brings the third card into view, where the first card was
./terminal/demo --page profile --cols 80 --rows 26 --keys ArrowDown,ArrowDown --dump "$OUT/profile-scroll.txt"
grep -q "Thread numbering is out of beta" "$OUT/profile-scroll.txt" ||
  { echo "FAIL: the third profile card did not scroll into view"; exit 1; }
grep -q "Pinned" "$OUT/profile-scroll.txt" && { echo "FAIL: the profile list did not scroll past the first card"; exit 1; }

# the notifications screen (terminal/notify.c): apps/csssky has no notifications screen, model or fixture, so its five
# rows are hand-carried (terminal/notify.c says which): the five verbs the app's notifications have, an actor and a post
# out of the recorded fixtures, the post's own time. 80x26: the bar, the header row, five cards, the footer; the focused
# card is the accent border *and* the next panel tone, so the ring reads as '.' inside the card in a plain dump too.
./terminal/demo --page notifications --cols 80 --rows 26 --dump "$OUT/notify.txt"
cmp "$OUT/notify.txt" terminal/expected-notify.txt ||
  { echo "FAIL: terminal/expected-notify.txt is stale (a row's actor, verb, snippet or time changed)"; exit 1; }
for v in "liked your post" "reposted" "followed you" "mentioned you" "replied"; do
  grep -q "$v" "$OUT/notify.txt" || { echo "FAIL: no notification row has the verb \"$v\""; exit 1; }
done
echo "notifications: the five rows — liked your post, reposted, followed you, mentioned you, replied"
# the focus order is the document's: the ring is the focused card's accent rows, and Tab walks the rows in order (the
# layers release the focus at either end; the page presses Tab again, so it wraps). Each step prints the row it landed on.
ring_text() {
  ansi_rows "$1" | awk -v esc="$ESC" 'index($0, esc "[38;2;59;156;240m") == 1 {
    l = $0; gsub(esc "\\[[0-9;]*m", "", l); print l }'
}
./terminal/demo --page notifications --cols 80 --rows 26 --ansi "$OUT/notify.ansi"
n=$(accent_rows "$OUT/notify.ansi")
[ "$n" = 4 ] || { echo "FAIL: at rest the ring is $n rows, want 4 (Erik Strub's card, the first row)"; exit 1; }
ring_text "$OUT/notify.ansi" | grep -q "Erik Strub" || { echo "FAIL: at rest the ring is not on the first row"; exit 1; }
echo "notifications: at rest the ring is on the first row (Erik Strub, $n rows)"
for pair in "Tab|Titania|4" "Tab,Tab|Michael Warburton|4" "Tab,Tab,Tab|jlp2024|4" "Tab,Tab,Tab,Tab|Mina Kimes|3"; do
  k=${pair%%|*}; rest=${pair#*|}; who=${rest%%|*}; h=${rest##*|}
  ./terminal/demo --page notifications --cols 80 --rows 26 --keys "$k" --ansi "$OUT/notify-tab.ansi"
  n=$(accent_rows "$OUT/notify-tab.ansi")
  [ "$n" = "$h" ] || { echo "FAIL: $k: the ring is $n rows, want $h ($who's card)"; exit 1; }
  ring_text "$OUT/notify-tab.ansi" | grep -q "$who" || { echo "FAIL: $k: the ring is not on $who"; exit 1; }
  echo "notifications: $k — the ring is on $who ($n rows)"
done
# Shift+Tab from the first row is released by the layer and pressed again: the last row, the follow, whose card is 3 rows
./terminal/demo --page notifications --cols 80 --rows 26 --keys Shift+Tab --ansi "$OUT/notify-shift.ansi"
n=$(accent_rows "$OUT/notify-shift.ansi")
[ "$n" = 3 ] || { echo "FAIL: Shift+Tab from the first row: $n accent rows, want 3 (the follow, the last row)"; exit 1; }
ring_text "$OUT/notify-shift.ansi" | grep -q "Mina Kimes" ||
  { echo "FAIL: Shift+Tab from the first row did not wrap to the last"; exit 1; }
echo "notifications: Shift+Tab from the first row wraps to the last (Mina Kimes, 3 rows)"
# the arrows move the ring a row (the roving the app's list does): Tab to the second row, ArrowDown to the third
./terminal/demo --page notifications --cols 80 --rows 26 --keys Tab,ArrowDown --dump "$OUT/notify-focus.txt"
cmp "$OUT/notify-focus.txt" terminal/expected-notify-focus.txt ||
  { echo "FAIL: terminal/expected-notify-focus.txt is stale (Tab and ArrowDown did not land on Michael Warburton's row)"; exit 1; }
echo "notifications: Tab and ArrowDown put the ring on the third row (expected-notify-focus.txt)"
# Enter opens the notification's post as the thread, and Escape comes back to the frame it left
./terminal/demo --page notifications --cols 80 --rows 26 --keys Enter --dump "$OUT/notify-thread.txt"
grep -q "Thread (esc: back)" "$OUT/notify-thread.txt" ||
  { echo "FAIL: Enter on a notification did not open its post's thread"; exit 1; }
./terminal/demo --page notifications --cols 80 --rows 26 --keys Enter,Escape --dump "$OUT/notify-back.txt"
cmp "$OUT/notify-back.txt" "$OUT/notify.txt" || { echo "FAIL: Escape did not come back to the notifications frame"; exit 1; }
# a follow has no post: Enter on it opens nothing, and the screen stays
./terminal/demo --page notifications --cols 80 --rows 26 --keys Tab,Tab,Tab,Tab,Enter --dump "$OUT/notify-follow.txt"
grep -q "Thread (esc: back)" "$OUT/notify-follow.txt" && { echo "FAIL: Enter on a follow opened a thread"; exit 1; }
grep -q "Mina Kimes" "$OUT/notify-follow.txt" || { echo "FAIL: Tab four times did not reach the follow"; exit 1; }
echo "notifications: Enter opens a post's thread, Escape is its frame, and a follow opens none"
# a click focuses and opens a card as the feed's cards do; on the follow it only focuses it
./terminal/demo --page notifications --cols 80 --rows 26 --click 10,3 --dump "$OUT/notify-click.txt"
grep -q "Thread (esc: back)" "$OUT/notify-click.txt" || { echo "FAIL: a click on a card did not open its thread"; exit 1; }
./terminal/demo --page notifications --cols 80 --rows 26 --click 10,19 --ansi "$OUT/notify-click2.ansi"
n=$(accent_rows "$OUT/notify-click2.ansi")
[ "$n" = 3 ] || { echo "FAIL: a click on the follow card left $n accent rows, want 3"; exit 1; }
ring_text "$OUT/notify-click2.ansi" | grep -q "Mina Kimes" || { echo "FAIL: the click did not focus the follow's card"; exit 1; }
echo "notifications: a click opens a card's thread, and a follow's card only takes the ring"
# the page's own scroll, as the thread's and the profile's: four rows down at 12 rows has the follow in view, the first out
./terminal/demo --page notifications --cols 80 --rows 12 --keys ArrowDown,ArrowDown,ArrowDown,ArrowDown --dump "$OUT/notify-scroll.txt"
grep -q "Mina Kimes" "$OUT/notify-scroll.txt" || { echo "FAIL: the follow did not scroll into view"; exit 1; }
grep -q "Erik Strub" "$OUT/notify-scroll.txt" && { echo "FAIL: the list did not scroll past the first card"; exit 1; }
echo "notifications: four rows down at 12 rows scrolls the follow into view"
# the shell's path to it: the app's nav (Shell.tsx) is Home, a profile and Settings, and the feed's bar is the feed's
# tabs, so a notifications place is in neither: the feed opens it with `n`, and Escape is the feed's frame again
./terminal/demo --page sky --cols 80 --rows 20 --keys n --dump "$OUT/sky-notify.txt"
grep -q "Notifications (esc: back)" "$OUT/sky-notify.txt" ||
  { echo "FAIL: n on the feed did not open the notifications"; exit 1; }
./terminal/demo --page sky --cols 80 --rows 20 --keys n,Escape --dump "$OUT/sky-notify-back.txt"
cmp "$OUT/sky-notify-back.txt" "$OUT/sky.txt" ||
  { echo "FAIL: Escape from the notifications did not come back to the feed frame"; exit 1; }
echo "notifications: n from the feed opens it, and Escape is the feed's frame"

# termbox2 (terminal/tb2.c). It needs a terminal -- tb_init opens /dev/tty -- so it runs under a pty (script, whose
# stdin is the pty too, so a click is the bytes a terminal sends). 256 colours unless COLORTERM says truecolour.
if command -v script >/dev/null 2>&1; then
  rm -f "$OUT/tb2-256.log" "$OUT/tb2-true.log" "$OUT/tb2-mouse.log"
  script -q "$OUT/tb2-256.log" sh -c "stty rows 20 cols 80; env -u COLORTERM $PWD/terminal/demo --page sky --backend tb2 --frames 1" >/dev/null 2>&1
  n=$(grep -oF "${ESC}[38;5;" "$OUT/tb2-256.log" | wc -l | tr -d ' ')
  [ "$n" -gt 0 ] || { echo "FAIL: termbox2 without COLORTERM wrote no 256-colour SGR"; exit 1; }
  grep -qF "${ESC}[38;2;" "$OUT/tb2-256.log" && { echo "FAIL: the 256-colour fallback wrote truecolour SGR"; exit 1; }
  script -q "$OUT/tb2-true.log" sh -c "stty rows 20 cols 80; COLORTERM=truecolor $PWD/terminal/demo --page sky --backend tb2 --frames 1" >/dev/null 2>&1
  grep -qF "${ESC}[38;2;255;255;255;48;2;59;156;240m" "$OUT/tb2-true.log" ||
    { echo "FAIL: termbox2 with COLORTERM has no white-on-accent tab (38;2;255;255;255;48;2;59;156;240)"; exit 1; }
  grep -qF "${ESC}[38;5;" "$OUT/tb2-true.log" && { echo "FAIL: truecolour still wrote a 256-colour SGR"; exit 1; }
  # a mouse click through termbox2: a press on the Science tab (SGR 1006, 1-based: column 23, row 1) and its release,
  # then q. The frame after the release is the Science feed
  { sleep 0.4; printf '\033[<0;23;1M'; sleep 0.3; printf '\033[<0;23;1m'; sleep 0.4; printf 'q'; sleep 0.2; } |
    script -q "$OUT/tb2-mouse.log" sh -c "stty rows 20 cols 80; $PWD/terminal/demo --page sky --backend tb2" >/dev/null 2>&1
  grep -q "Erik Strub" "$OUT/tb2-mouse.log" || { echo "FAIL: termbox2's mouse click did not switch the feed"; exit 1; }
else
  echo "terminal: no script(1), termbox2's pty checks skipped"
fi
# ... and one page as Solid over the same cells (solid/native/term.c -> build/solid/libterm.dylib, terminal/solid.ts):
# Sensors.tsx unmodified, its frames against the C page's own. terminal/test.sh prints its comparisons.
NATIVE_OUT="$OUT" sh terminal/test.sh

# Step 8: the browser target. Clay + the generated C page as WebAssembly (zig cc -target wasm32-wasi: a libc, no
# emscripten), drawn on a canvas by browser/render.js. The check builds it, opens browser/index.html in Chromium
# through Playwright, dumps the wasm's last frame through the same emitter (desktop/clay_dump.c) and compares it with
# solid/goldens/sensors.json, the golden the Solid page and the C page are held to (the boxes keep a 4px tolerance:
# Canvas2D does not hint a font, the golden's ThorVG metrics sum glyph advances), then the raster with two stored
# frames: the browser's own and ThorVG's, as per-region means and text ink boxes, because another rasteriser's
# anti-aliasing and font metrics are not pixel-identical. Skips when zig, node or Playwright's chromium is not installed.
if command -v zig >/dev/null 2>&1 && command -v node >/dev/null 2>&1 &&
   node -e 'process.exit(require("node:fs").existsSync(require("playwright").chromium.executablePath()) ? 0 : 1)' 2>/dev/null; then
  sh browser/build.sh >/dev/null
  node browser/check.mjs
  # ... and the Solid pages in the same browser, on the desktop's own modules (browser/solid/): Sensors and Widgets (the
  # second driven by the keyboard), the Sky (browser/sky-check.mjs), the Dialog (browser/dialog-check.mjs: its floats
  # and the menu's backdrop), the List and the Text field (browser/input-check.mjs) and the Dev page with the Text sheet
  # (browser/dev-check.mjs: the panel's own readout); the dev server's reload loop (browser/serve-check.mjs) runs there
  # too. Their checks are in solid/test.sh, which has just run above with the same guard
else
  echo "browser: no zig, node or Playwright chromium, skipped (sh browser/build.sh && node browser/check.mjs)"
fi
