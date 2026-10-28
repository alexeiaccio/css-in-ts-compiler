#!/bin/sh
# Solid 2 on the desktop (step 4), from the repo root: the Solid Sensors page, its Clay tree built each frame through
# bun:ffi, against the C page's ThorVG frames, pixel for pixel. Needs bun and brew sdl3 sdl3_image thorvg.
set -e
cd "$(dirname "$0")/.."
sh solid/native/build.sh >/dev/null
# every page now has a first-mount entry (src/entry.ts: the root's subtree rises 8px and fades in over 0.25s, ~21 frames
# to its settle): a stored frame of a page at rest is taken after `--warm 30`, which is the settled frame the frames below
# have always been. The Sensors page gets it too.
S0="bun solid/main.ts --warm 30"
$S0 --expect examples/sensors/expected-thorvg.png
$S0 --click 180 250 --expect examples/sensors/expected-thorvg-g.png
THEME=light $S0 --expect examples/sensors/expected-thorvg-light.png
bun solid/test.ts
# the Widgets page (headless button, switch, checkbox, disclosure, radio, tabs, slider, toolbar; the focus manager): scripted keys, then the frame
# the page's entry is over by the first key: every frame below is at rest (`--warm 30`)
W() { bun solid/main.ts widgets --warm 30 "$@"; }
W --expect solid/frames/widgets-initial.png
W --keys Tab,Tab --expect solid/frames/widgets-tab2.png
W --keys Tab,Tab,Space --expect solid/frames/widgets-switch-on.png
W --keys Tab,Tab,Tab,Tab,Space --expect solid/frames/widgets-mixed.png
W --keys Tab,Tab,Space,Tab,Tab,Tab,Tab,Enter --expect solid/frames/widgets-disclosure.png
# the groups: Tab to each (6 stops before the radio, then the tab, its panel, the slider, the toolbar, the tree), then its keys
W --keys Tab,Tab,Tab,Tab,Tab,Tab,Tab,ArrowRight --expect solid/frames/widgets-radio.png
W --keys Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,ArrowRight --expect solid/frames/widgets-tabs.png
W --keys Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,ArrowRight --expect solid/frames/widgets-slider.png
# a drag: press the slider's rail at a quarter, hold, move to three quarters (the knob follows, 80% at this step)
W --drag 0.25 0.75 --expect solid/frames/widgets-slider-drag.png
# the toolbar: Bold on, to Italic, Tab away to the slider and back: Italic has the ring again (memory)
W --keys Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Enter,ArrowRight,Shift+Tab,Tab --expect solid/frames/widgets-toolbar.png
# the toolbar's menu button: to Size, Down opens the menu under the item (the checked Medium has the dot and the focus ring)
W --keys Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,ArrowRight,ArrowRight,ArrowDown --expect solid/frames/widgets-toolbar-menu.png
THEME=light bun solid/main.ts widgets --warm 30 --keys Tab,Tab,Space,Tab,Tab,Space,Tab,Tab,Enter,Tab,ArrowRight,Tab,ArrowRight,Tab,Tab,ArrowRight,ArrowRight,Tab,Enter --expect solid/frames/widgets-light.png
# the settings tree, 12 Tabs in: the ring on Network, the first visible row; Down moves it without selecting;
# Right on the closed Display opens it; Space selects the roving node
TREE="Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab"
W --keys $TREE --expect solid/frames/widgets-tree-focus.png
W --keys $TREE,ArrowDown --expect solid/frames/widgets-tree-down.png
W --keys $TREE,ArrowDown,ArrowDown,ArrowDown,ArrowRight --expect solid/frames/widgets-tree-expanded.png
W --keys $TREE,ArrowDown,ArrowDown,ArrowDown,ArrowRight,Space --expect solid/frames/widgets-tree-select.png
THEME=light bun solid/main.ts widgets --warm 30 --keys $TREE,ArrowDown,Space --expect solid/frames/widgets-tree-light.png
bun solid/widgets.test.ts
# the Dialog page (a modal dialog on a root-float backdrop and a menu floated off its trigger): its frames and asserts.
# The panel drops in (its float's offset y -14 -> 0, its shadow's blur 0 -> 32) and the menu slides out of its trigger
# (offset y -10 -> -20, blur 0 -> 14) through the value channel, so a stored frame is taken at rest (`--settle 30`) and
# the mid-slide one three frames after the key opens it (one for the key, two settles, dt = 1/60). The panel and the
# menu also arrive as one scene each (the group: alpha 88% -> 100% and scale 96% -> 100%, fields 46 and 47), and the
# menu leans out of a -2° tilt (`FIELDS.ROTATE`, field 55, about its box centre: a scene transform, so no box moves), so
# `dialog-entry-mid` is three frames in and `dialog-menu-mid` two.
# Closing runs the same tracks the other way (panel
# 0 -> 14, 32 -> 0, 225 -> 0 and 100% -> 96%; backdrop 140 -> 0; menu -20 -> -10, 14 -> 0, the tilt back to -2° and the
# same fade) while the
# node stays mounted (`presence`), so `dialog-exit-mid` is two frames into the exit and is the one stored frame whose
# pixels moved for the group (a settled frame writes alpha 255 and scale 1, which makes no scene at all); a
# `--reduced-motion` run lands on `dialog-open` in one frame (no entry, no exit: the flag is the platform's)
D="bun solid/main.ts dialog"
$D --expect solid/frames/dialog-closed.png
$D --keys Tab,Enter --settle 30 --expect solid/frames/dialog-open.png
$D --keys Tab,Enter --settle 3 --expect solid/frames/dialog-entry-mid.png
THEME=light $D --keys Tab,Enter --settle 30 --expect solid/frames/dialog-light.png
$D --keys Tab,Tab,Enter --settle 30 --expect solid/frames/dialog-menu.png
$D --keys Tab,Tab,Enter --settle 2 --expect solid/frames/dialog-menu-mid.png
$D --keys Tab,Enter,Escape --settle 2 --expect solid/frames/dialog-exit-mid.png
$D --reduced-motion --keys Tab,Enter --expect solid/frames/dialog-open.png
# the menu's glass (css.backdrop) over the light page: a translucent white, the blurred page showing through
THEME=light $D --keys Tab,Tab,Enter --settle 30 --expect solid/frames/dialog-menu-light.png
bun solid/dialog.test.ts
# the Text field page (the neutral createTextField on SDL's text input): an empty field with the caret, "Ada",
# a selection with Shift+ArrowLeft twice, a submit, and the light theme; then the caret and selection pixels and the keys
F() { bun solid/main.ts form --warm 30 "$@"; }
F --keys Tab,Tab --expect solid/frames/field-empty.png
F --keys Tab,Tab,text:Ada --expect solid/frames/field-typed.png
F --keys Tab,Tab,text:Ada,Shift+ArrowLeft,Shift+ArrowLeft --expect solid/frames/field-selection.png
F --keys Tab,Tab,text:Ada,Enter --expect solid/frames/field-submit.png
THEME=light bun solid/main.ts form --warm 30 --keys Tab,Tab,text:Ada --expect solid/frames/field-light.png
bun solid/field.test.ts
# the List page (its viewport on the page's own track: the wheel's 10px, the keyboard's reveal, the drag, the band): the
# top, scrolled 32 notches (a rest frame between them, so the run is the notches' own 320 and not a flick), the selection
# moved past the viewport and eased into view, the light theme
# (the settles after a scroll are 90 frames, not 60: the scrollbar holds 0.6s after the track stops and fades out in
# 0.15s, so a frame at rest — today's pixels, no thumb on it — is a little later than the offset's own settle)
L() { bun solid/main.ts list --warm 30 "$@"; }
# the entry's own frame: four frames in, the page a blend of its colour over the ground (main.ts --settle 3)
bun solid/main.ts list --settle 3 --expect solid/frames/list-entry.png
DOWN12="Tab,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown"
L --expect solid/frames/list-top.png
L --wheel 32 --wheel-rest --settle 90 --expect solid/frames/list-wheel.png
# the wide layout: the same 240px viewport with 900px rows, 12 horizontal notches right (120px of the 620 the rows are
# wider than the viewport) a rest frame apart, so the run is the notches' own 120 and not a flick; the page's tree is the
# default one plus the wide cells and the horizontal bar, so list-top/list-wheel/list-select/list-light are untouched
L --wide --wheel-x 12 --wheel-rest --settle 90 --expect solid/frames/list-wide.png
L --keys $DOWN12 --settle 90 --expect solid/frames/list-select.png
THEME=light bun solid/main.ts list --warm 30 --keys $DOWN12 --settle 90 --expect solid/frames/list-light.png
bun solid/list.test.ts
# the motion model (a spring from duration and bounce, a track that retargets from the presented x and v, the exact
# settle, the effect class's clamp, the decay's projection): no page, no Clay
bun solid/motion.test.ts
# the Sky page (csssky's feed: the tablist, the cards with drawn avatars, the wrapped bodies, the feed's own motion track):
# Discover, the Science tab, the light theme, and the Science feed eight notches down, settled (the track flings to the end).
# The cards arrive on mount (12px low, at 0 opacity, each 50ms after the one above, 0.3s: the group's translate and alpha),
# a card's and a tab's hover is a 120ms fade and a tab's underline fades with it, so the resting frames are taken after
# `--settle` (the entry is over 0.4s from the mount) — every one of them is byte-identical to its old self, the entry and
# the hover are the frames that moved. `sky-entry` is ten frames in (the three cards at 2, 4 and 10px of their 12),
# `sky-hover` is the pointer on the second card three frames into its fade (no press: `--move`), and `sky-band` is
# Discover four notches past its end (its content is shorter than the viewport, so the first notch is already past it):
# the resistance's f(40) puts it 21.3px out, and the band has let go 80ms later. `sky-tab-mid` is a tab switch two
# frames in: the label's colour fading between the muted token and the accent (`FIELDS.TEXT_COLOR` on the text's id).
S="bun solid/main.ts sky"
$S --settle 40 --expect solid/frames/sky.png
$S --click 180 32 --settle 40 --expect solid/frames/sky-science.png
THEME=light $S --settle 40 --expect solid/frames/sky-light.png
$S --click 180 32 --wheel 8 --wheel-over sky-feed --settle 90 --expect solid/frames/sky-scrolled.png
$S --settle 9 --expect solid/frames/sky-entry.png
$S --settle 40 --move 180 300 3 --expect solid/frames/sky-hover.png
$S --warm 40 --wheel 4 --wheel-over sky-status --expect solid/frames/sky-band.png
# a tab switch two frames in (the tablist's first stop, then ArrowRight): the label's colour and the 2px underline both
# mid-fade, the new label between the muted token and the accent — the text's own four floats, not the tab's box's
$S --warm 40 --keys Tab,ArrowRight --settle 2 --expect solid/frames/sky-tab-mid.png
# the thread screen (the page's second screen): a click on the second card opens Titania's thread — the header with the
# Back control, the root card with the accent border, the replies indented 16px a depth, the tombstone and the
# "Show 1 more reply" row. The screen enters as one group (12px low, 0 opacity, 0.3s: the page's card entry), so the
# resting frame is 40 frames after the click and `sky-thread-mid` is two frames into the entry. `sky-thread-scrolled` is
# six notches down with a rest frame between them (the notches' own 60, not a flick) and its thumb faded out by the 90
# frames; `sky-thread-light` is the light theme. `sky-thread-more` is the deeper thread a "Show 1 more reply" row opens:
# that row is only in view at the thread's end, so it takes a second click there (`--click2`, a frame's press and release
# after the settle, then its own settle)
$S --warm 40 --click 180 380 --settle 40 --expect solid/frames/sky-thread.png
$S --warm 40 --click 180 380 --settle 2 --expect solid/frames/sky-thread-mid.png
$S --warm 40 --click 180 380 --wheel 6 --wheel-rest --settle 90 --expect solid/frames/sky-thread-scrolled.png
THEME=light $S --warm 40 --click 180 380 --settle 40 --expect solid/frames/sky-thread-light.png
$S --warm 40 --click 180 380 --wheel 20 --wheel-over sky-thread-view --settle 90 --click2 180 730 --settle2 40 --expect solid/frames/sky-thread-more.png
# a finger's tap is the mouse's click through the same mapping (ui_touch_map: SDL's normalised 0..1 of the window to the
# layout's pixels): a tap at the window's middle (0.5,0.5 -> 180,380) is the frame of a click at 180,380 (the second card
# selected). No touchscreen here: this is the mapping, and what a page does with the flag is sky.test.ts's (a finger's 2px
# drag is not a card click, the mouse's is).
$S --click 180 380 --png "${TMPDIR:-/tmp}/cssints-touch.png" >/dev/null
$S --touch 0.5 0.5 --expect "${TMPDIR:-/tmp}/cssints-touch.png"
bun solid/sky.test.ts
# ... and the thread screen's own test: the rows and their indents, its scroll and thumb, back's frame, the history, the
# entry and reduced motion, the a11y tree, the stored frame, and the mutations
bun solid/thread.test.ts
# the text sheet (the strings and the sizes the app draws) and its oracle: the frame, then the metric against the same
# lines drawn by CoreText — the ink weight and the shape of every line (solid/text.test.ts). The oracle is a stored PNG;
# re-draw it with `bun solid/text-oracle.ts --update` (needs swiftc, so only there)
X="bun solid/main.ts sheet"
$X --expect solid/frames/text-sheet.png
$X --density 2 --expect solid/frames/text-sheet-2x.png
bun solid/text.test.ts
# the window (src/virtual.ts) with more data than a screen: 1,000 fixed rows and 200 cards of mixed height — the declared
# subset (nine to eleven rows, at most ten cards), the spacers are the real content, the reveal outside the window, the
# fallback for a jumped-over card, and the declare cost of 1,000 rows against 30 (and 200 cards against 3)
bun solid/virtual.test.ts
# a gradient and a clip inside a *rotated* group (no page has one): the clip paint turns with its scene, the gradient with
# its shape, and the dither's mark is the rotated quad, so no page pixel around it is stippled (a hand-built tree, no page)
bun solid/rotated.test.ts
# idle frames: a page at rest declares and lays out every frame but draws and presents none (`--idle N` prints the draws
# it made), and a key is a discrete input that draws its own frame
$S --settle 60 --idle 60 | grep -q "draws 0 of 60"
$S --settle 60 --idle 60 --idle-keys 20 | grep -q "draws 3 of 60, 3 of them the keys"
bun solid/idle.test.ts
# the inline-styles page (styles in the .tsx) against the same page with a .styles.ts: identical pixel for pixel, and its frame
bun solid/inline.test.ts
bun solid/main.ts --png "${TMPDIR:-/tmp}/cssints-native-solid.png" --bench 1000
bun solid/a11y.test.ts
# metamorphic relations (Rune's research 14): a pass-through wrapper, a whole-pixel move, wrap monotonicity, and the same
# tree twice in one process — properties with no stored frame and no oracle
bun solid/metamorphic.test.ts
# the Sky thread's data is the AppView's now (the page's `load` prop; solid/app/Sky.tsx), and a stored frame never fetches:
# a --png/--expect run loads apps/csssky's recorded getPostThread answer (apps/csssky/test/fixtures/thread.json) through
# the page's own shaping of it, which is what the five thread frames above show (`--offline` says so for a run that writes
# no frame). The loader's other two states have frames of their own: `--pending` a promise that never settles (the
# muted "Loading the thread…" row) and `--fail` a loader that throws ("The thread could not be loaded" and its Retry).
# Nothing here makes a request; solid/thread.test.ts injects its own promises.
$S --offline --warm 40 --click 180 380 --settle 40 --expect solid/frames/sky-thread.png
$S --offline --warm 40 --click 180 380 --settle 40 --pending --expect solid/frames/sky-thread-loading.png
$S --offline --warm 40 --click 180 380 --settle 40 --fail --expect solid/frames/sky-thread-error.png
