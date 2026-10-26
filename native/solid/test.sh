#!/bin/sh
# Solid 2 on the desktop (step 4), from the repo root: the Solid Sensors page, its Clay tree built each frame through
# bun:ffi, against the C page's ThorVG frames, pixel for pixel. Needs bun and brew sdl3 sdl3_image thorvg.
set -e
cd "$(dirname "$0")/.."
sh solid/native/build.sh >/dev/null
bun solid/main.ts --expect examples/sensors/expected-thorvg.png
bun solid/main.ts --click 180 250 --expect examples/sensors/expected-thorvg-g.png
THEME=light bun solid/main.ts --expect examples/sensors/expected-thorvg-light.png
bun solid/test.ts
# the Widgets page (headless button, switch, checkbox, disclosure, radio, tabs, slider, toolbar; the focus manager): scripted keys, then the frame
W="bun solid/main.ts widgets"
$W --expect solid/frames/widgets-initial.png
$W --keys Tab,Tab --expect solid/frames/widgets-tab2.png
$W --keys Tab,Tab,Space --expect solid/frames/widgets-switch-on.png
$W --keys Tab,Tab,Tab,Tab,Space --expect solid/frames/widgets-mixed.png
$W --keys Tab,Tab,Space,Tab,Tab,Tab,Tab,Enter --expect solid/frames/widgets-disclosure.png
# the groups: Tab to each (6 stops before the radio, then the tab, its panel, the slider, the toolbar, the tree), then its keys
$W --keys Tab,Tab,Tab,Tab,Tab,Tab,Tab,ArrowRight --expect solid/frames/widgets-radio.png
$W --keys Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,ArrowRight --expect solid/frames/widgets-tabs.png
$W --keys Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,ArrowRight --expect solid/frames/widgets-slider.png
# a drag: press the slider's rail at a quarter, hold, move to three quarters (the knob follows, 80% at this step)
$W --drag 0.25 0.75 --expect solid/frames/widgets-slider-drag.png
# the toolbar: Bold on, to Italic, Tab away to the slider and back: Italic has the ring again (memory)
$W --keys Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Enter,ArrowRight,Shift+Tab,Tab --expect solid/frames/widgets-toolbar.png
# the toolbar's menu button: to Size, Down opens the menu under the item (the checked Medium has the dot and the focus ring)
$W --keys Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,ArrowRight,ArrowRight,ArrowDown --expect solid/frames/widgets-toolbar-menu.png
THEME=light $W --keys Tab,Tab,Space,Tab,Tab,Space,Tab,Tab,Enter,Tab,ArrowRight,Tab,ArrowRight,Tab,Tab,ArrowRight,ArrowRight,Tab,Enter --expect solid/frames/widgets-light.png
# the settings tree, 12 Tabs in: the ring on Network, the first visible row; Down moves it without selecting;
# Right on the closed Display opens it; Space selects the roving node
TREE="Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab,Tab"
$W --keys $TREE --expect solid/frames/widgets-tree-focus.png
$W --keys $TREE,ArrowDown --expect solid/frames/widgets-tree-down.png
$W --keys $TREE,ArrowDown,ArrowDown,ArrowDown,ArrowRight --expect solid/frames/widgets-tree-expanded.png
$W --keys $TREE,ArrowDown,ArrowDown,ArrowDown,ArrowRight,Space --expect solid/frames/widgets-tree-select.png
THEME=light $W --keys $TREE,ArrowDown,Space --expect solid/frames/widgets-tree-light.png
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
F="bun solid/main.ts form"
$F --keys Tab,Tab --expect solid/frames/field-empty.png
$F --keys Tab,Tab,text:Ada --expect solid/frames/field-typed.png
$F --keys Tab,Tab,text:Ada,Shift+ArrowLeft,Shift+ArrowLeft --expect solid/frames/field-selection.png
$F --keys Tab,Tab,text:Ada,Enter --expect solid/frames/field-submit.png
THEME=light $F --keys Tab,Tab,text:Ada --expect solid/frames/field-light.png
bun solid/field.test.ts
# the List page (Clay's own scroll container: the wheel moves its offset, the keys move the selection and scroll it into
# view): the top, scrolled by the wheel (both edges cut), the selection moved past the viewport, the light theme
L="bun solid/main.ts list"
DOWN12="Tab,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowDown"
$L --expect solid/frames/list-top.png
$L --wheel 32 --expect solid/frames/list-wheel.png
$L --keys $DOWN12 --expect solid/frames/list-select.png
THEME=light $L --keys $DOWN12 --expect solid/frames/list-light.png
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
$S --click 180 32 --wheel 8 --wheel-over sky-feed --settle 60 --expect solid/frames/sky-scrolled.png
$S --settle 9 --expect solid/frames/sky-entry.png
$S --settle 40 --move 180 300 3 --expect solid/frames/sky-hover.png
$S --warm 40 --wheel 4 --wheel-over sky-status --expect solid/frames/sky-band.png
# a tab switch two frames in (the tablist's first stop, then ArrowRight): the label's colour and the 2px underline both
# mid-fade, the new label between the muted token and the accent — the text's own four floats, not the tab's box's
$S --warm 40 --keys Tab,ArrowRight --settle 2 --expect solid/frames/sky-tab-mid.png
bun solid/sky.test.ts
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
