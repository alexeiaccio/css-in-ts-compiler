// The Sky page: csssky's home feed as a phone-shaped page (360x760), the first real app on this renderer. The bar has the
// wordmark and the three feeds as a headless tablist (roving focus, arrows switch the feed), the feed is one Clay clip
// element that the wheel scrolls (as on the List page), and each post is a card with a drawn avatar, a name and handle, a
// wrapped body, the media line and the counts. The data is the app's recorded fixtures, verbatim (the same six posts
// terminal/sky.c carries): times are the app's ago() with the clock pinned to the fixtures' capture moment, so a frame
// reads the same today as it did when recorded, and News has no fixture, so its feed is the app's empty case.
//
// The palette is terminal/sky_styles.ts's (apps/csssky-tui's styles.ts, read only): the sky palette in the dark theme here,
// the light one under THEME=light.
// A card click records the selection in a signal and nothing more: there is no thread screen yet. The body is the first
// text on these pages that wraps: it is a text in a stretch box in a card of percent width, and Clay wraps a text
// element only when something constrains its width (a clip element lets its children grow past the viewport).
import * as css from "cssints/clay" with { type: "cssints" };
import { createSignal, onCleanup } from "solid-js";

import { a11y } from "../a11y.ts";
import { createTabs } from "../../headless/src/index.ts";
import type { Motion } from "../src/entry.ts";
import { decay, effect, reduced, rubber, spatial, track, type Decay, type Sample, type Spring } from "../src/motion.ts";
import { ui } from "../src/ffi.ts";
import type { FocusPart, Input } from "../src/input.ts";
import { FIELDS, variant } from "../src/pack.ts";
import type { State } from "../src/pack.ts";

// the sky palette: the page, the card one tonal step above it (its top; the gradient's deep end is a step below), the
// hover step, the muted step and the accent blue; the ring is the same blue the other pages use.
const t = css.createTokens({
  color: {
    $type: "color",
    page: { $value: "rgb(16 19 22)" },
    panel: { $value: "rgb(27 32 38)" },
    panelDeep: { $value: "rgb(21 25 30)" },
    hover: { $value: "rgb(34 40 49)" },
    hoverDeep: { $value: "rgb(28 33 40)" },
    ink: { $value: "rgb(230 233 236)" },
    muted: { $value: "rgb(139 152 165)" },
    accent: { $value: "rgb(59 156 240)" },
    ring: { $value: "rgb(92 176 255)" },
  },
});
css.createGlobalTheme(t, "light", {
  color: {
    page: "rgb(243 245 247)",
    panel: "rgb(255 255 255)",
    panelDeep: "rgb(240 243 246)",
    hover: "rgb(232 238 244)",
    hoverDeep: "rgb(222 229 236)",
    ink: "rgb(15 20 25)",
    muted: "rgb(86 99 111)",
    accent: "rgb(17 112 207)",
    ring: "rgb(11 98 189)",
  },
});
const font = css.fonts("Roboto");

const root = css.cn(css.width("stretch"), css.height("stretch"), css.flexDirection("column"), css.bg(t.color.page));

// the bar: the wordmark in the accent, then the tablist. The active tab is the accent with the app's 2px underline, and
// a hover lightens the one under the pointer (Clay draws a border inside the box, so the underline moves no layout). Both
// are colours of the tab's own box — its background floats and its border's alpha — so the page fades them
// (`FIELDS.BACKGROUND`, `FIELDS.BORDER_ALPHA`) and the tab keeps its `:hover` state, which is the literal a settled hover
// lands on. The label is a text: its colour is the text's own four floats, not its box's, so the page fades it through
// the text's id (`FIELDS.TEXT_COLOR`, an id on the `<text>`), with the underline beside it.
const bar = css.cn(css.width("stretch"), css.height(64), css.p(0, 16), css.gap(20), css.alignItems("center"), css.bg(t.color.page));
const wordmark = css.cn(font.Roboto, css.color(t.color.accent), css.fontSize(24));
const tablist = css.cn(css.gap(2), css.alignItems("center"));
const tab = css.cn(
  css.p(6, 10),
  css.borderRadius(8),
  css.hover(css.bg(t.color.hover)),
  css.focus(css.border(2, t.color.ring)),
);
// the app's underline: a 2px bottom border, square corners so the border does not curve around the whole tab (a rounded
// border with one side is drawn as a ring and leaves faint arcs along the other corners)
const tabOn = css.cn(tab, css.borderRadius(0), css.borderWidth(0, 0, 2, 0), css.borderColor(t.color.accent));
const tabText = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(15));
const tabTextOn = css.cn(font.Roboto, css.color(t.color.accent), css.fontSize(15));

// the feed: one clip element, the rest of the window's height, with the bar and the status line as its siblings, so they
// stay put when the wheel scrolls it. No height of its own: `stretch` takes what the bar and the status leave, which is
// why it scrolls on the Science feed and not on Discover's three short posts.
const view = css.cn(
  css.width("stretch"),
  css.height("stretch"),
  css.p(12),
  css.gap(8),
  css.flexDirection("column"),
  css.overflow("hidden"),
  css.bg(t.color.page),
  css.focus(css.border(2, t.color.ring)),
);

// a card: the panel, 12px radius and padding, a column of avatar, identity, body, media and counts. The panel is a
// vertical gradient (a renderer effect: Clay draws the solid colour under it, and the desktop renderer fills the gradient
// instead), the selected card is the hover panel with an accent border (a border draws inside, so it moves nothing).
// A hover is not a style state here (no `css.hover`): the page fades the box's own four background floats
// (`FIELDS.BACKGROUND`) from the resting panel to the hover tone *and* the opacity of its gradient (`GRADIENT_ALPHA`), so
// what is under the gradient is the tone the fade is between. The two ends are two styles: `card`, with the resting
// gradient, and `cardHover`, the same box with the hover one. Both gradients are opaque at rest; the page puts the hover
// style on the card while the fade runs either way (`hot`), because a `:hover` state would swap the gradient back the
// moment the pointer left and the fade out would never be seen. A card at rest and a settled hover are exactly their
// style's literals.
const cardTint = css.backgroundImage(`linear-gradient(180deg, ${t.color.panel}, ${t.color.panelDeep})`);
const cardHoverTint = css.backgroundImage(`linear-gradient(180deg, ${t.color.hover}, ${t.color.hoverDeep})`);
const cardBase = css.cn(
  // a percent width: a clip element lets its children grow past the viewport for their content, so a card that must
  // wrap its body takes the feed's width from the parent, not from what its text wants
  css.width("100%"),
  css.p(12),
  css.gap(8),
  css.flexDirection("column"),
  css.bg(t.color.panel),
  css.borderRadius(12),
);
const card = css.cn(cardBase, cardTint);
const cardHover = css.cn(cardBase, css.bg(t.color.hover), cardHoverTint);
const cardOn = css.cn(card, cardHoverTint, css.bg(t.color.hover), css.border(1, t.color.accent));
// the app's one <text> of spans, split in two here: a name and handle side by side do not fit a 312px card (the longest
// pair is about 340px) and Clay has no ellipsis, so the handle and age take the line under the name
const nameLine = css.cn(css.width("stretch"), css.flexDirection("column"));
const name = css.cn(font.Roboto, css.color(t.color.ink), css.fontSize(16), css.lineHeight(22));
const meta = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(12), css.lineHeight(16));
// the body's text sits in a stretch box inside the percent-width card: the card puts the width on the box, the box on
// the text, and only then does Clay wrap it
const bodyBox = css.cn(css.width("stretch"));
const body = css.cn(font.Roboto, css.color(t.color.ink), css.fontSize(14), css.lineHeight(20), css.whiteSpace("normal"));
// a media line wraps at spaces. Clay breaks only at spaces, so a media line must not contain a word wider than the card
// (a sixty-character URL would run over the gutter): the app's own fallback for a link with no title is the host, which
// is what the Science post carries here.
const media = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(13), css.lineHeight(18), css.whiteSpace("normal"));
const counts = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(13), css.lineHeight(18));

// the empty feed: the app's own line, centred in the viewport
const empty = css.cn(css.width("100%"), css.height("stretch"), css.justifyContent("center"), css.alignItems("center"));
const emptyText = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(14));

const status = css.cn(css.width("stretch"), css.height(32), css.p(0, 16), css.alignItems("center"), css.bg(t.color.page));
const statusText = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(12));

export const s = {
  t,
  font,
  root,
  bar,
  wordmark,
  tablist,
  tab,
  tabOn,
  tabText,
  tabTextOn,
  view,
  card,
  cardHover,
  cardOn,
  nameLine,
  name,
  meta,
  bodyBox,
  body,
  media,
  counts,
  empty,
  emptyText,
  status,
  statusText,
};

/** The phone: the bar (64) and the status line (32) around a feed that takes the rest of 760. */
export const size = { width: 360, height: 760 };

/** The fixtures' capture moment (2026-10-02T15:39:31Z): ago() is measured against this, never the clock. */
export const SKY_NOW = 1790955571;

/** The app's ago(), as terminal/format.c: now, 5m, 3h, 2d, then the date. */
export function ago(created: number): string {
  const s = Math.max(0, SKY_NOW - created);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  const d = new Date(created * 1000);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]!;
  const now = new Date(SKY_NOW * 1000);
  return d.getUTCFullYear() === now.getUTCFullYear()
    ? `${month} ${d.getUTCDate()}`
    : `${month} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** Intl's compact notation, as terminal/format.c's sky_num(): 999, 3.5K, 21K, 1M. */
export function num(v: number, unit = 1000, suffix = "K"): string {
  if (unit === 1000 && v < 1000) return String(v);
  const x = v / unit;
  if (x < 10) {
    const s = (Math.round(x * 10) / 10).toFixed(1);
    return (s.endsWith(".0") ? s.slice(0, -2) : s) + suffix;
  }
  const r = Math.round(x);
  if (r >= 1000 && unit === 1000) return num(v, 1e6, "M");
  return `${r}${suffix}`;
}

/** One post of a feed: the record's fields as the fixtures carry them (terminal/sky.c's SkyPost). */
interface Post {
  readonly name: string; // "" when the record has no display name: the handle is the name then
  readonly handle: string;
  readonly text: string;
  readonly media?: string;
  readonly replies: number;
  readonly reposts: number;
  readonly likes: number;
  readonly created: number;
}

interface Feed {
  readonly name: string;
  readonly posts: readonly Post[];
}

// apps/csssky/test/fixtures/home-discover-1.json (feed[20], [23], [9])
const DISCOVER: readonly Post[] = [
  {
    name: "Michael Warburton",
    handle: "michaelwarburton.bsky.social",
    text: "René Magritte at work in his living room in 1964",
    media: "[image]",
    replies: 8,
    reposts: 32,
    likes: 310,
    created: 1790948585,
  },
  {
    name: "Titania",
    handle: "titaniasrealm.bsky.social",
    text: "The Witch's Cat (1955) by Hilda Boswell",
    media: "[image: Painting of a witch riding a broom above rooftops. A cat is watching her.]",
    replies: 3,
    reposts: 27,
    likes: 128,
    created: 1790953138,
  },
  {
    name: "",
    handle: "alexjungle.bsky.social",
    text: "A man in China dislocates his shoulder playing basketball, and a foreigner saves the day.",
    media: "[video]",
    replies: 7,
    reposts: 61,
    likes: 357,
    created: 1790949554,
  },
];
// apps/csssky/test/fixtures/home-science-1.json (feed[11], [13], [25])
const SCIENCE: readonly Post[] = [
  {
    name: "Erik Strub",
    handle: "erikstrub.bsky.social",
    text:
      "Second paper of Marco (open access) on Tc-99m is online, congrats! Good timing for the weekend.\n\n" +
      "www.sciencedirect.com/science/arti...",
    media: "[link: sciencedirect.com]", // the app's external embed with no title: the host, not a 60-char URI
    replies: 0,
    reposts: 0,
    likes: 0,
    created: 1790955571,
  },
  {
    name: "David Blanchflower BSc",
    handle: "davidbflower.bsky.social",
    text: "Tonight Mars continues to near the Beehive Cluster. Early on Monday morning joined by the Waning Crescent Moon.",
    replies: 0,
    reposts: 1,
    likes: 6,
    created: 1790955129,
  },
  {
    name: "Jason GRIZZLED Bittel",
    handle: "bittelmethis.bsky.social",
    text: "Wondering what the big deal is about a few little bugs? Here's why the wine and beer industries are worried about spotted lanternflies!",
    media: "[link: Invasive spotted lanternflies seen in New York's wine region - nationalgeographic.com]",
    replies: 1,
    reposts: 1,
    likes: 3,
    created: 1790952698,
  },
];
const FEEDS: readonly Feed[] = [
  { name: "Discover", posts: DISCOVER },
  { name: "Science", posts: SCIENCE },
  { name: "News", posts: [] },
];

const VIEW = "sky-feed";
// The avatars: the committed 64x64 PNGs (examples/sky/avatars.py) drawn at 40x40. A css style is evaluated when the
// module loads, so each author is a style of its own with a literal path; a page cannot build one from a loop variable.
const SKY = new URL("../../examples/sky/", import.meta.url).pathname;
const AVATARS: Record<string, css.ClayStyle> = {
  michaelwarburton: css.image(`${SKY}michaelwarburton.png`, { width: 40, height: 40 }),
  titaniasrealm: css.image(`${SKY}titaniasrealm.png`, { width: 40, height: 40 }),
  alexjungle: css.image(`${SKY}alexjungle.png`, { width: 40, height: 40 }),
  erikstrub: css.image(`${SKY}erikstrub.png`, { width: 40, height: 40 }),
  davidbflower: css.image(`${SKY}davidbflower.png`, { width: 40, height: 40 }),
  bittelmethis: css.image(`${SKY}bittelmethis.png`, { width: 40, height: 40 }),
};

// The motion the page owns (src/motion.ts). A hover is 120ms of `effect`: a luminance field is clamped and critically
// damped, so it cannot overshoot. The entry is a 12px slide on `spatial` with the opacity's `effect` beside it, each card
// 3 frames after the one before. The band's return is `spatial(0.35, 0.1)` — Rune's light bounce — so it settles exactly
// on the clamp. Reduced motion (the platform's, `motion.ts`'s flag) makes every retarget land at once, and the page skips
// the entry and the band altogether, so the frame is the settled one.
const HOVER = effect(0.12); // the card's and the tab's background
const UNDERLINE = effect(0.12); // the tab's 2px underline fading in or out
const LABEL = effect(0.15); // the tab label's colour, from the muted token to the accent and back
const ENTRY = { delay: 0.05, y: 12, time: 0.3 }; // seconds, px: a card starts 50ms after the one before it, 12px low
const ENTRY_Y = spatial(ENTRY.time);
const ENTRY_A = effect(ENTRY.time);
const BAND_BACK = spatial(0.35, 0.1); // the band lets go with a light bounce, and settles exactly on the clamp
const BAND_HOLD = 0.08; // seconds without a notch before the band lets go
const DRAG_SLOP = 4; // px of travel: past it the press was a drag, and the card under it is not clicked on release
const FLING_FRAMES = 5; // the last frames' positions the release's speed is estimated from
const FLING_MIN = 1 / 120; // s: a span shorter than this is one frame's jitter, not a speed

/**
 * Four 0..255 channels of a style's background under a theme and a state: the two ends a fade runs between. The theme is
 * the frame's (`View.theme`), so the page asks for the packed variant of each end instead of hard-coding a palette: the
 * light theme fades between its own tones. A style with no box has no colour at all.
 */
function backgroundOf(shape: css.ClayStyle, theme: string | undefined, hover = false): number[] {
  const states: State[] = hover ? [":hover"] : [];
  const box = variant(shape, theme, states).box;
  return box ? [box[14]!, box[15]!, box[16]!, box[17]!] : [0, 0, 0, 0];
}

/** The four channels of a style's text colour under a theme: one end of a label's fade. */
function textColorOf(shape: css.ClayStyle, theme: string | undefined): number[] {
  const text = variant(shape, theme).text;
  return text ? [text[0]!, text[1]!, text[2]!, text[3]!] : [0, 0, 0, 0];
}

/** The four channels from `from` to `to` at `m` percent: a fade's colour at that instant. */
const mixColor = (from: number[], to: number[], m: number): number[] =>
  from.map((v, i) => v + ((to[i]! - v) * m) / 100);

/**
 * The page. Two Tab stops: the tablist (one stop on the active tab, arrows move and switch) and the feed. The feed's keys
 * scroll it: Down and Up 40px, PageDown and PageUp a viewport, Home and End to the ends. The wheel adds 10px a notch and
 * a flick keeps going (a decay) to its projection, clamped to the content; both are one motion track (src/motion.ts) the
 * page owns, retargeted from the presented (x, v), and `ui.scrollTo` puts the value on Clay's clip element each frame.
 * Past an end the wheel pushes into a rubber band (Rune's `f(x)`), which lets go 80ms after the last notch and settles on
 * the clamp. **The pointer drags the feed as a phone would**: a press inside it grabs the offset and follows the pointer
 * 1:1 (the same band past an end), a press that travels past 4px is not a click on the card it started on, and the
 * release flings it on the speed of its last frames (or lets the band go). The bar and the status line are the feed's
 * siblings, so they stay put. A card press only records the selection until there is a thread screen to open. On mount the
 * cards arrive staggered (translate + opacity through the group fields, so nothing moves in the layout), a card and a tab
 * fade their hover, and the tabs fade the 2px underline and the label's colour from the one that was active to the one
 * that is — the label through the text's own four floats (`ui.value` on its id), which its box does not hold.
 */
export function Sky(props: { input: Input; motion?: Motion; theme?: () => string | undefined }) {
  const { input } = props;
  const [focused, setFocused] = createSignal(false);
  const [selected, setSelected] = createSignal<{ feed: number; i: number } | null>(null);
  // what the tree wears this frame, set by the tick (before the flush, so in this frame): the cards on their hover style
  // (kept while the fade leaves, or the resting gradient would come back under it before the fade was out), and the tabs
  // that keep the 2px underline while its colour fades. A page with no motion hook has neither (the a11y test builds one).
  const [hot, setHot] = createSignal([false, false, false]);
  const [underlined, setUnderlined] = createSignal([true, false, false]);

  // the feed scrolls itself: Clay's own wheel scrolling is off for this page, and the page takes the notch through
  // `onWheel` instead. The offset is positive-down (Clay's is negative-down) and is what the track presents.
  const spring = spatial();
  let anim = track(0, spring);
  let fling: Decay | null = null;
  let now = 0; // seconds, the clock the tracks are given; no track reads the time
  let notches = 0; // the wheel's notches since the last tick, positive down (a notch is 10px)
  let notchDir = 0; // the last notch's direction: a fling only continues that way
  let burst = 0; // how many notches have come without a frame between them: one notch is a step, two are a flick
  let chasing = false; // the last tick had a notch, so this one decides whether a fling follows
  let target = 0; // where the track is going: the wheel's, clamped, plus the rubber band at an end
  let want = 0; // the wheel's own target before the clamp: past an end it feeds the band
  let band = 0; // raw px past an end (positive past the bottom, negative past the top): 0 is not over-scrolled
  let idle = 0; // seconds since the last notch, for the band's hold
  let maxWas = -1; // the content's clamp last frame: a changed one is a feed switch, and is clamped hard
  let keyed = false;
  // The drag is direct manipulation: a press inside the feed grabs it, and while the pointer holds it the offset is the
  // press point's offset less the pointer's own travel — no track between them, so a drag lags nothing. Past an end the
  // same `rubber` resists it as the wheel's pull. A press that travels past DRAG_SLOP is a drag and not a click. The
  // release starts whatever follows from where the finger left it: a `decay` from the speed of the last frames (a fling),
  // the band's way back at an end, or nothing at all (a click, or reduced motion).
  let held = false; // the pointer holds the feed: the offset is its own
  let pressed = false; // a press landed inside the feed (the feed's `onPress`), and this frame grabs it
  let dragX = 0; // the offset the pointer presents while it holds the feed
  let grabFrom = 0; // the offset when it grabbed, and ...
  let grabX = 0;
  let grabY = 0; // ... the pointer's x and y there: the drag is 1:1 from this pair
  let dragMoved = false; // the press passed DRAG_SLOP: the card under it is not clicked on release
  let trail: { t: number; x: number }[] = []; // the last frames' (clock, offset) while held
  ui.autoScroll(false);
  onCleanup(() => ui.autoScroll(true));

  // the cards' and the tabs' motion, by the ids the tree gives them
  const cards = [0, 1, 2].map((i) => ({
    id: Buffer.from(`sky-card-${i}`),
    delay: i * ENTRY.delay,
    started: -1, // the clock the entry started at: -1 before it, and forever under reduced motion
    arrived: false, // the entry is over: no write at all, so the card is its literal frame
    on: false, // the pointer is on it this frame
    hover: track(0, HOVER), // percent: a track settles within 0.5 of its unit, and 0.5 of 1 would be settled at once
    y: track(ENTRY.y, ENTRY_Y), // where the entry starts: 12px low until its delay, then 0
    a: track(0, ENTRY_A), // ... and 0 opacity
  }));
  const tabFx = [0, 1, 2].map((i) => ({
    id: Buffer.from(`sky-tabs-tab-${i}`),
    // the label is a text of its own: its colour is not in the tab's box, so it has an id to fade through
    label: Buffer.from(`sky-tabs-label-${i}`),
    on: false,
    hover: track(0, HOVER),
    under: track(i === 0 ? 255 : 0, UNDERLINE), // the underline's alpha (field 29): 255 on the tab that is active
    // the label's colour, as a percent from the muted token (0) to the accent (100): linear in it, so a track on the
    // percent is a track on the colour, continuous across a retarget
    ink: track(i === 0 ? 100 : 0, LABEL),
  }));
  let activeWas = 0;

  const clamp = (y: number, max: number) => Math.min(Math.max(y, 0), max);

  /** The ends of a fade, from the page's own packed styles: the card rests on the panel and lands on the hover tone; a
   *  tab rests on the page it sits on (its box has no background at rest) and lands on its hover tone. */
  const cardEnds = () => [backgroundOf(s.card, props.theme?.()), backgroundOf(s.cardHover, props.theme?.())];
  const tabEnds = () => [backgroundOf(s.root, props.theme?.()), backgroundOf(s.tab, props.theme?.(), true)];
  /** The label's two ends: the muted token and the accent, as the packed text styles carry them under the frame's theme. */
  const labelEnds = () => [textColorOf(s.tabText, props.theme?.()), textColorOf(s.tabTextOn, props.theme?.())];

  /** The tablist is the page's first stop and the feed the second. The panels are not stops of their own: the feed is one
   *  (the tabs' `focusablePanels` says so, or Tab would land on a panel the page draws no box for). */
  const tabs = createTabs({ id: "sky-tabs", items: FEEDS.length, focus: input.focus, focusablePanels: [0, 1, 2] });
  const binds = tabs.tabs.map((tab) => input.bind(tab));
  const active = () => tabs.selected();
  const feed = () => FEEDS[active()]!;

  /** Whether that tab wears the 2px underline this frame: the active one, and one whose underline is still fading out. */
  const under = (i: number) => (props.motion ? underlined()[i]! : active() === i);
  /** Whether that card wears the hover style: the pointer is on it, or its fade is still leaving it. */
  const isHot = (i: number) => (props.motion ? hot()[i]! : false);

  /** How far the feed can scroll: the last card's bottom (in screen coordinates, already shifted by Clay's offset) plus
   *  the 12px bottom padding, less the viewport's bottom, less the offset's own lift. 0 when the feed fits. */
  const maxScroll = () => {
    const posts = feed().posts.length;
    if (!posts) return 0;
    const view = ui.bounds(Buffer.from(VIEW));
    const last = ui.bounds(Buffer.from(`sky-card-${posts - 1}`));
    if (!view || !last) return 0;
    return Math.max(0, last[1]! + last[3]! + 12 - (view[1]! + view[3]!) - ui.scrollOffset(VIEW));
  };

  /** The viewport's height: the rubber band's `d`. */
  const viewHeight = () => ui.bounds(Buffer.from(VIEW))?.[3] ?? 0;

  /** Where the wheel's own target sits: clamped to the content, and past an end the band's resistance (`rubber` in
   *  motion.ts, Rune's f(x) = (1 - 1/(x·c/d + 1))·d, c = 0.55). Sets `band` to the raw overscroll it was given. */
  const place = (w: number, max: number): number => {
    const c = clamp(w, max);
    band = reduced() ? 0 : w - c; // reduced motion has no band: the wheel is clamped hard
    return band ? c + Math.sign(band) * rubber(Math.abs(band), viewHeight()) : c;
  };

  /** Where the feed is at t: the drag that holds it, the fling while one runs, the spring otherwise. */
  const presented = (t: number): Sample =>
    held ? { x: dragX, v: 0, done: false } : fling ? fling.at(t) : anim.at(t);

  /** Starts a segment at t from a presented (x, v), so position and velocity are continuous across a retarget. */
  const restart = (p: { x: number; v: number }, t: number, to: number, s: Spring = spring) => {
    anim = track(p.x, s, t);
    anim.v0 = p.v;
    anim.retarget(t, to, s); // samples the (x, v) above and starts the new segment from it
    fling = null;
  };

  /** The wheel: 10px a notch, accumulated for the next tick (positive down). A horizontal delta has no page to move. */
  const wheel = (_dx: number, dy: number) => {
    if (held) return; // the finger is the offset's: a wheel under it is not a scroll
    const n = -dy;
    if (n) (notches += n), (notchDir = Math.sign(n));
  };

  /** The speed the last frames carry at the release, px/s positive down: the last `FLING_FRAMES` samples' offsets over
   *  their span. A span under `FLING_MIN` is one frame's jitter and not a speed (Rune's rule: no single-sample spikes). */
  const speed = (): number => {
    const last = trail[trail.length - 1];
    const first = trail[Math.max(0, trail.length - FLING_FRAMES)];
    if (!last || !first) return 0;
    const dt = last.t - first.t;
    return dt < FLING_MIN ? 0 : (last.x - first.x) / dt;
  };

  /** The pointer moves the grab: the offset follows it from the press point, resisted at the ends as the wheel is. */
  const dragTo = (x: number, y: number, t: number) => {
    dragX = place(grabFrom - (y - grabY), maxScroll());
    if (!dragMoved && Math.hypot(x - grabX, y - grabY) > DRAG_SLOP) dragMoved = true;
    trail.push({ t, x: dragX });
    if (trail.length > FLING_FRAMES) trail.shift();
  };

  /** The release: the drag stops being the offset's owner, and what follows starts from where the finger left it. */
  const release = (x: number, y: number, t: number) => {
    held = false;
    dragTo(x, y, t); // the release's own point counts: the pointer may have moved into it
    const max = maxScroll();
    const end = clamp(dragX, max);
    const v = reduced() || !dragMoved || band ? 0 : speed();
    trail = [];
    fling = null;
    if (band) {
      // past an end: the band lets go on the next tick, from where the finger left it, and settles on the clamp
      anim = track(dragX, spring, t);
      want = dragX;
      target = end;
      idle = BAND_HOLD;
      return;
    }
    if (!v) {
      // a click (no travel), no speed, or reduced motion: the offset stops where the finger left it, clamped
      anim = track(end, spring, t);
      want = target = end;
      return;
    }
    const d = decay(dragX, v, t);
    const raw = d.project();
    const land = clamp(raw, max);
    want = target = land;
    if (land === raw) fling = d;
    else restart({ x: dragX, v }, t, land);
  };

  /** The host's pointer, once a frame: a press inside the feed grabs it, a held pointer drags the offset, a release
   *  hands the feed to the fling (or to the band at an end). A press elsewhere leaves the feed alone. */
  const pointer = (x: number, y: number, down: boolean) => {
    const t = now;
    if (!down) {
      pressed = false;
      if (held) release(x, y, t);
      return;
    }
    if (pressed) {
      // the press was inside the feed: grab it where it is, so the frame it lands on shows the offset it had
      pressed = false;
      held = true;
      grabX = x, grabY = y;
      grabFrom = dragX = clamp(presented(t).x, maxScroll());
      dragMoved = false;
      trail = [{ t, x: dragX }];
      // a glide or a fling under the finger stops, and the band has no hold: the pointer owns the offset from here
      fling = null;
      notches = 0;
      chasing = false;
      keyed = false;
      idle = 0;
      band = 0;
      return;
    }
    if (held) dragTo(x, y, t);
  };

  /** One card a frame: its hover fade, and its entry while that runs (once, on mount). Writes nothing at all once both
   *  are the literals, so a frame at rest is the frame the style's literals make. */
  const cardFrame = (c: (typeof cards)[number], i: number, t: number) => {
    if (!c.arrived) {
      if (c.started < 0 && !reduced() && t >= c.delay) {
        // the frame its delay is up on: from the entry's 12px and 0 opacity, both retargeted from what they present
        c.started = t;
        c.y = track(ENTRY.y, ENTRY_Y, t);
        c.a = track(0, ENTRY_A, t);
        c.y.retarget(t, 0);
        c.a.retarget(t, 255);
      }
      const y = c.y.at(t),
        a = c.a.at(t);
      // before its delay these are the entry's own values, so a card waits 12px low and transparent
      if (reduced() || (c.started >= 0 && y.done && a.done)) c.arrived = true;
      else ui.value(c.id, FIELDS.TRANSLATE_Y, y.x), ui.value(c.id, FIELDS.ALPHA, a.x);
    }
    const on = ui.over(c.id);
    if (on !== c.on) (c.on = on), c.hover.retarget(t, on ? 100 : 0, HOVER);
    // a selected card wears `cardOn` whatever the pointer does, so the fade writes nothing for it: its frame is the
    // literal's, as it was before the hover learned to fade
    if (selected()?.feed === active() && selected()?.i === i) return;
    const m = c.hover.at(t);
    // a fade in, or one still leaving: the four channels from the resting tone to the hover's, and the opacity of the
    // card's gradient, so the two gradients cross-fade through the tones under them. The card wears the hover style
    // while this runs (`hot`), which is the one whose gradient is fading in.
    if (c.on || !m.done) {
      const [rest, hover] = cardEnds();
      const [r, g, b, a] = mixColor(rest, hover, m.x);
      ui.value(c.id, FIELDS.BACKGROUND, r);
      ui.value(c.id, FIELDS.BACKGROUND + 1, g);
      ui.value(c.id, FIELDS.BACKGROUND + 2, b);
      ui.value(c.id, FIELDS.BACKGROUND_ALPHA, a);
      ui.value(c.id, FIELDS.GRADIENT_ALPHA, (m.x / 100) * 255);
    }
  };

  /** One tab a frame: its hover fade, the 2px underline's colour while that fades, and its label's colour. */
  const tabFrame = (f: (typeof tabFx)[number], i: number, t: number) => {
    const on = ui.over(f.id);
    if (on !== f.on) (f.on = on), f.hover.retarget(t, on ? 100 : 0, HOVER);
    const m = f.hover.at(t);
    if (f.on || !m.done) {
      const [rest, hover] = tabEnds();
      const [r, g, b, a] = mixColor(rest, hover, m.x);
      ui.value(f.id, FIELDS.BACKGROUND, r);
      ui.value(f.id, FIELDS.BACKGROUND + 1, g);
      ui.value(f.id, FIELDS.BACKGROUND + 2, b);
      ui.value(f.id, FIELDS.BACKGROUND_ALPHA, a);
    }
    // the underline is the tab's own border, so its colour is a field of the box
    const u = f.under.at(t);
    if (!u.done) ui.value(f.id, FIELDS.BORDER_ALPHA, u.x);
    // ... and the label is a text, whose colour is its own four floats: the muted token (0) to the accent (100), so the
    // label and the underline move together. A label that has settled writes nothing: its literal is the end it is on
    // (the page swaps tabText for tabTextOn at the switch), so a frame at rest is the literal's.
    const ink = f.ink.at(t);
    if (!ink.done) {
      const [muted, accent] = labelEnds();
      const [r, g, b, a] = mixColor(muted, accent, ink.x);
      ui.value(f.label, FIELDS.TEXT_COLOR, r);
      ui.value(f.label, FIELDS.TEXT_COLOR + 1, g);
      ui.value(f.label, FIELDS.TEXT_COLOR + 2, b);
      ui.value(f.label, FIELDS.TEXT_COLOR_ALPHA, a);
    }
    return i === active() || f.under.at(t).x > 0;
  };

  /** One frame: the wheel and the keys retarget, the release may fling, and the value goes to Clay. Input is applied at
   *  the frame's start and the frame presents the state one dt later, so the notch that arrived in this frame moves it.
   *  The cards and the tabs are written at the clock the frame is showing (`t`), so the entry's first frame is exactly
   *  its 12px and 0. */
  const tick = (dt: number) => {
    const t = now;
    // the selection first: a tab that becomes active starts its underline at once (a frame later would flash the
    // literal's full colour before the fade's first 0), and the one that had it fades out
    const sel = active();
    if (sel !== activeWas) {
      activeWas = sel;
      for (const [i, f] of tabFx.entries()) {
        f.under.retarget(t, i === sel ? 255 : 0, UNDERLINE);
        f.ink.retarget(t, i === sel ? 100 : 0, LABEL);
      }
    }
    const keep = tabFx.map((f, i) => tabFrame(f, i, t));
    for (const [i, c] of cards.entries()) cardFrame(c, i, t);
    if (keep.join() !== underlined().join()) setUnderlined(keep);
    const hotNow = cards.map((c) => c.on || c.hover.at(t).x > 0);
    if (hotNow.join() !== hot().join()) setHot(hotNow);

    const max = maxScroll();
    if (held) {
      // the pointer owns the offset: this frame only writes it — a band cannot let go under the finger, and no notch or
      // key retargets the track until the release
      maxWas = max;
      now += dt;
      if (band) ui.scrollPut(VIEW, -dragX);
      else ui.scrollTo(VIEW, -dragX);
      return;
    }
    const n = notches;
    notches = 0;
    const key = keyed;
    keyed = false;
    idle = n ? 0 : idle + dt;
    if (!band) want = clamp(want, max);
    target = clamp(target, max);
    // A shorter feed (a tab switch) must not leave the offset past the new end — its content would not fill the viewport
    // — so a clamp that moved is hard. A band past an end, and its spring back, are on purpose: those are the tracks'.
    const shrank = Math.abs(max - maxWas) > 0.01;
    maxWas = max;
    const before = presented(t);
    if (shrank && (before.x < 0 || before.x > max)) {
      const x = clamp(before.x, max);
      restart({ x, v: 0 }, t, x);
      target = want = x;
    }
    if (n) {
      burst += Math.abs(n);
      want += n * 10;
      const p = presented(t);
      const to = place(want, max);
      // a notch past an end is a pull of the edge, not a scroll of the content: once the content has arrived at the end
      // it is pushed past (or is already over it), the band is where the wheel puts it on this frame. A notch that only
      // reaches the end while the content is still travelling there is a scroll like any other: a snap would jump it.
      const pull = band !== 0 && (n > 0 ? p.x >= max - 0.5 : p.x <= 0.5);
      target = to;
      if (pull) (anim = track(to, spring, t)), (fling = null);
      else {
        restart(p, t, to);
        // a notch from rest starts with the velocity a critically damped spring needs to glide the 10px without
        // overshoot (ω·d): the offset moves on the first frame and each frame after it moves less. A notch during a
        // burst keeps the presented velocity, so the steps grow with the accumulated target.
        if (Math.abs(p.v) < 1) anim.v0 = spring.omega * (to - p.x);
      }
      chasing = true;
    } else if (key) {
      // a key drops the band and retargets the same track
      chasing = false;
      burst = 0;
      want = clamp(want, max);
      band = 0;
      target = want;
      restart(presented(t), t, target);
    } else if (chasing) {
      chasing = false;
      const p = anim.at(t);
      // a fling only for a burst (a flick, not one notch) whose presented velocity still follows the wheel — and not at
      // all over an end: a stroke that ends past one is a band's pull, and it lets go on the band's own clock
      if (!band && burst >= 2 && Math.abs(p.v) > 10 && Math.sign(p.v) === notchDir) {
        const d = decay(p.x, p.v, t);
        const raw = d.project();
        const land = clamp(notchDir > 0 ? Math.max(raw, target) : Math.min(raw, target), max);
        // inside the content: the decay runs to its projection. Past an end (or short of the wheel's target): a spring
        // from the presented (x, v) to the clamped end.
        if (land === raw) (fling = d), (target = land);
        else restart(p, t, land), (target = land);
        // the throw's landing is where the wheel's next notch counts from, as its target always was
        want = land;
      }
      burst = 0;
    } else if (fling) {
      const d = fling.at(t);
      if (d.done) restart({ x: d.x, v: 0 }, t, d.x), (target = want = d.x);
      else if (d.x < 0 || d.x > max) {
        const x = clamp(d.x, max);
        restart({ x, v: 0 }, t, x), (target = want = x);
      }
    }
    // the wheel has stopped past an end: the band lets go, from what it presents, and settles exactly on the clamp
    if (band && !chasing && idle >= BAND_HOLD) {
      want = clamp(want, max);
      band = 0;
      target = want;
      restart(presented(t), t, target, BAND_BACK);
    }
    now += dt;
    // the offset goes on Clay's clip element: clamped to the content as always, and past an end only while the band is
    // (it is out of the content on purpose there, and only the page knows how far)
    if (band) ui.scrollPut(VIEW, -presented(now).x);
    else ui.scrollTo(VIEW, -presented(now).x);
  };
  if (props.motion) (props.motion.onWheel = wheel), (props.motion.tick = tick), (props.motion.onPointer = pointer);

  const part: FocusPart & { readonly disabled: boolean } = {
    id: VIEW,
    disabled: false,
    get focused() {
      return focused();
    },
    focus: () => setFocused(true),
    blur: () => setFocused(false),
    keyDown: (key) => {
      const max = maxScroll();
      const page = ui.bounds(Buffer.from(VIEW))?.[3] ?? 0;
      // the offset is positive going down, so Down adds
      const step = key === "ArrowDown" ? 40 : key === "ArrowUp" ? -40 : key === "PageDown" ? page : key === "PageUp" ? -page : 0;
      if (!step && key !== "Home" && key !== "End") return false;
      // Home and End are targets too: the track eases to them, it does not jump. A key inside a band comes back to the
      // content first: it is not the wheel, so the band lets go.
      want = clamp(key === "Home" ? 0 : key === "End" ? max : clamp(want, max) + step, max);
      keyed = true;
      return true;
    },
    keyUp: () => false,
  };
  const bind = input.add(part);

  const statusOf = () => {
    const f = feed();
    const sel = selected();
    if (sel && sel.feed === active()) {
      const p = f.posts[sel.i]!;
      return `${p.name || p.handle} — ${sel.i + 1} of ${f.posts.length}`;
    }
    return `${f.name} — ${f.posts.length} ${f.posts.length === 1 ? "post" : "posts"}`;
  };

  return (
    <box id="Root" style={s.root}>
      <box id="sky-bar" style={s.bar}>
        <text style={s.wordmark}>sky</text>
        <box {...a11y(tabs.tablist)} style={s.tablist}>
          {tabs.tabs.map((tab, i) => (
            <box {...binds[i]!} {...a11y(tab)} style={under(i) ? s.tabOn : s.tab}>
              <text id={`sky-tabs-label-${i}`} style={tab.selected ? s.tabTextOn : s.tabText}>{FEEDS[i]!.name}</text>
            </box>
          ))}
        </box>
      </box>
      <box {...bind} onPress={() => (bind.onPress(), (pressed = true))} style={s.view}>
        {feed().posts.map((p, i) => (
          <box
            id={`sky-card-${i}`}
            style={selected()?.feed === active() && selected()?.i === i ? s.cardOn : isHot(i) ? s.cardHover : s.card}
            onClick={() => {
              // a press that dragged the feed is not a click on the card it started on
              if (!(held && dragMoved)) setSelected({ feed: active(), i });
            }}
          >
            <box id={`sky-avatar-${i}`} style={AVATARS[p.handle.split(".")[0]!]!} />
            <box style={s.nameLine}>
              <text style={s.name}>{p.name || p.handle}</text>
              <text style={s.meta}>{p.name ? `@${p.handle} · ${ago(p.created)}` : ago(p.created)}</text>
            </box>
            <box id={`sky-body-${i}`} style={s.bodyBox}>
              <text style={s.body}>{p.text}</text>
            </box>
            {p.media ? <text style={s.media}>{p.media}</text> : null}
            <text style={s.counts}>{`${num(p.replies)} replies · ${num(p.reposts)} reposts · ${num(p.likes)} likes`}</text>
          </box>
        ))}
        {feed().posts.length === 0 ? (
          <box id="sky-empty" style={s.empty}>
            <text style={s.emptyText}>Nothing here yet</text>
          </box>
        ) : null}
      </box>
      <box id="sky-status" style={s.status}>
        <text style={s.statusText}>{statusOf()}</text>
      </box>
    </box>
  );
}
