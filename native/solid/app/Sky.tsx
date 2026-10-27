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
import { effect, reduced, spatial, track, type Track } from "../src/motion.ts";
import { scroll } from "../src/vscroll.ts";
import { measuredWindow, type Window } from "../src/virtual.ts";
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
const VIEW = "sky-feed";
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

// the scrollbar's thumb (src/vscroll.ts writes its height, its top and its opacity every frame): 4px at the feed's inner
// right edge, a 2px inset (the float's right edge is the feed's, so the offset x is -2), rounded, the muted token. It is
// a float on the feed, so Clay positions it from the feed's own box: it draws over the cards and does not travel with
// them. Discover's three posts are shorter than the feed, so there the machine gives it height 0: no scrollbar when there
// is nothing to scroll.
const BAR = "sky-thumb";
const ABOVE = "sky-above";
const BELOW = "sky-below";
/** The window's two spacer cells. They and the cards are cells of one `For`, and not `Show`s either side of it, because
 *  Solid's renderer inserts a `For`'s items at its parent's end — a spacer declared after the `For` would come before its
 *  cards. A card's cell is `${feed}:${index}`, so a tab switch makes new cells (new nodes, created in the card's own child
 *  order) while a moved window keeps the nodes it shares. */
const TOP = "top";
const BOTTOM = "bottom";
const thumb = css.cn(
  css.width(4),
  css.height(24),
  css.borderRadius(2),
  css.bg(t.color.muted),
  css.float({
    parent: VIEW,
    attach: { element: "right top", parent: "right top" },
    offset: { x: -2 },
    zIndex: 1,
    // the press: a visible thumb takes it through the value channel (FIELDS.CAPTURE); an invisible one lets the page's
    // press through, so the strip at the edge is the cards' when there is no thumb
    capture: false,
  }),
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
// a window's spacer: an empty box in the feed's own gap-spaced column, its height written every frame through the value
// channel's FIXED axis (fields 4 and 5, as the scrollbar's thumb writes its own), so no style depends on the data
const spacer = css.cn(css.width("stretch"), css.height(0));

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
  thumb,
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
  spacer,
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
export interface Post {
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

/** The record a card renders for the frame a tab switch empties its feed: the node is removed in the same flush, but a
 *  card content's effect can run before the `For` takes it away, and `posts[i]` is not there any more. */
const BLANK: Post = { name: "", handle: "", text: "", replies: 0, reposts: 0, likes: 0, created: 0 };

/** The feed's gap and padding, as the styles above have them (8 and 12): the measured window's arithmetic. */
const GAP = 8;
const PAD = 12;
/** The cards declared either side of the feed: four or five are on screen, so the page declares at most nine. */
const OVERSCAN = 2;

/**
 * A synthetic feed for the window's page test: `count` posts cycling the six recorded authors (so every card has its
 * avatar), with bodies of one to four 20px lines and a media line every fourth, so the heights differ the way a real
 * feed's do. It is the same card the fixtures draw; only the records are made up.
 */
export function synthetic(count: number): readonly Post[] {
  const authors = [DISCOVER[0]!, DISCOVER[1]!, DISCOVER[2]!, SCIENCE[0]!, SCIENCE[1]!, SCIENCE[2]!];
  const bodies = [
    "A short one.",
    "A body that wraps to two lines in a 312px card, which is enough to make it taller than a card with one line.",
    "Three lines of body: the card grows by a line, then by another, and the feed's heights stop being the same. A measured window is what this feed is for.",
    "Four lines: a body long enough that a card is unmistakably taller than its neighbours, so the fallback for a card that was jumped over is one height among several.",
  ];
  return Array.from({ length: count }, (_unused, i) => {
    const a = authors[i % authors.length]!;
    return {
      name: a.name,
      handle: a.handle,
      text: bodies[i % bodies.length]!,
      media: i % 4 === 0 ? "[image]" : undefined,
      replies: (i * 3) % 40,
      reposts: (i * 7) % 90,
      likes: (i * 11) % 500,
      created: SKY_NOW - i * 600,
    };
  });
}

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
// 3 frames after the one before. The feed's scroll is the page's own track too (src/vscroll.ts: the wheel, the drag, the
// band and the fling — the List's viewport is the same machine). Reduced motion (the platform's, `motion.ts`'s flag) makes
// every retarget land at once, and the page skips the entry and the band altogether, so the frame is the settled one.
const HOVER = effect(0.12); // the card's and the tab's background
const UNDERLINE = effect(0.12); // the tab's 2px underline fading in or out
const LABEL = effect(0.15); // the tab label's colour, from the muted token to the accent and back
const ENTRY = { delay: 0.05, y: 12, time: 0.3 }; // seconds, px: a card starts 50ms after the one before it, 12px low
const ENTRY_Y = spatial(ENTRY.time);
const ENTRY_A = effect(ENTRY.time);
/** The cards whose mount entry the first frame starts: a screenful (four or five at the fixtures' heights) and the
 *  overscan, so a card that is only just below the feed does not pop in on the frame after it. */
const ENTRY_CARDS = 7;

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
 * The page (`posts` replaces Discover's fixture, which is what the page shows by default; Science and News stay the
 * app's). Two Tab stops: the tablist (one stop on the active tab, arrows move and switch) and the feed. The feed's keys
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
 *
 * The feed is **windowed** (src/virtual.ts): only the cards the viewport shows plus an overscan are declared, with a
 * spacer above and below. The cards' heights differ, so the window is measured, and it **measures once, then
 * virtualizes**: while a card's height is unknown the whole feed is declared (one frame of the full declare), so every
 * frame after it has exact heights and the content's end and the thumb never move as a card is first seen. The scroll's
 * clamp and the thumb read the *real* content (`src/virtual.ts`'s `content`, the block plus the feed's two 12px
 * paddings), never the declared subset's, so the bar and both ends behave as they did with every card declared.
 */
export function Sky(props: {
  input: Input;
  motion?: Motion;
  theme?: () => string | undefined;
  posts?: readonly Post[];
}) {
  const { input } = props;
  const [focused, setFocused] = createSignal(false);
  const [selected, setSelected] = createSignal<{ feed: number; i: number } | null>(null);
  // what the tree wears this frame, set by the tick (before the flush, so in this frame): the cards on their hover style
  // (kept while the fade leaves, or the resting gradient would come back under it before the fade was out), and the tabs
  // that keep the 2px underline while its colour fades. A page with no motion hook has neither.
  const [hot, setHot] = createSignal<ReadonlySet<number>>(new Set());
  const [underlined, setUnderlined] = createSignal([true, false, false]);
  // the declared window: the cells the tree renders (the cards' keys, and a spacer's sentinel at either end) — a signal,
  // so the tree updates only when the window moved; the spacer heights go to their boxes through the value channel
  const [cells, setCells] = createSignal<string[]>([]);
  // the heights the window has measured, by card index: a feed switch clears them (another feed, other posts)
  const heights: (number | undefined)[] = [];
  // the feed's real content this frame, paddings included: what the clamp and the thumb read
  let content = 0;

  // the feed scrolls itself: Clay's own wheel scrolling is off for this page, and the scroll (src/vscroll.ts) takes the
  // wheel, the pointer's drag and the band on a track of its own. The offset is positive-down (Clay's is negative-down).
  ui.autoScroll(false);
  onCleanup(() => ui.autoScroll(true));

  // the feeds: the `posts` prop (a synthetic feed in the window's test) takes Discover's place; the other two are the app's
  const feeds: readonly Feed[] = props.posts ? [{ name: FEEDS[0]!.name, posts: props.posts }, FEEDS[1]!, FEEDS[2]!] : FEEDS;

  // the cards' motion, by the ids the tree gives them: one state a card, made when the card is first declared (and the
  // first screenful's made here, so their entry starts on the first frame as it always did)
  interface CardFx {
    readonly id: Buffer;
    readonly delay: number;
    started: number; // the clock the entry started at: -1 before it, and forever under reduced motion
    arrived: boolean; // the entry is over: no write at all, so the card is its literal frame
    on: boolean; // the pointer is on it this frame
    hover: Track; // percent: a track settles within 0.5 of its unit, and 0.5 of 1 would be settled at once
    y: Track; // where the entry starts: 12px low until its delay, then 0
    a: Track; // ... and 0 opacity
  }
  const fx = new Map<number, CardFx>();
  const cardFx = (i: number): CardFx => {
    let c = fx.get(i);
    if (!c) {
      // a card the first screenful had: it waits its delay and arrives, as every card did when all of them were
      // declared; one that scrolled in later is simply there (its entry is the mount's, not the window's)
      const entry = i < ENTRY_CARDS;
      c = {
        id: Buffer.from(`sky-card-${i}`),
        delay: i * ENTRY.delay,
        started: -1,
        arrived: !entry,
        on: false,
        hover: track(0, HOVER),
        y: track(entry ? ENTRY.y : 0, ENTRY_Y),
        a: track(entry ? 0 : 255, ENTRY_A),
      };
      fx.set(i, c);
    }
    return c;
  };
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
  // the last window the tree was given, so a frame at rest sets no signal
  let shownFirst = -1;
  let shownLast = -1;
  let shownTop = false;
  let shownBottom = false;

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
  const feed = () => feeds[active()]!;

  // the first screenful's cards, so their mount entry starts on the first frame; and the column the tree shows before the
  // first tick: with no height measured yet the window declares the whole feed (the measuring pass)
  for (let i = 0; i < Math.min(ENTRY_CARDS, feed().posts.length); i++) cardFx(i);
  const firstWin = measuredWindow({
    offset: 0,
    view: 0,
    count: feed().posts.length,
    heights: [],
    gap: GAP,
    overscan: OVERSCAN,
  });
  /** The window's cells: the top spacer when there is one, the cards of the feed on screen, the bottom spacer. A card's
   *  cell carries the feed, so a tab switch gives it a node of its own (its child order is created, not toggled). */
  const cellsOf = (w: Window, feedIndex: number): string[] => {
    const list: string[] = [];
    if (w.above > 0) list.push(TOP);
    for (let i = w.first; i <= w.last; i++) list.push(`${feedIndex}:${i}`);
    if (w.below > 0) list.push(BOTTOM);
    return list;
  };
  setCells(cellsOf(firstWin, active()));

  /** Whether that tab wears the 2px underline this frame: the active one, and one whose underline is still fading out. */
  const under = (i: number) => (props.motion ? underlined()[i]! : active() === i);
  /** Whether that card wears the hover style: the pointer is on it, or its fade is still leaving it. */
  const isHot = (i: number) => (props.motion ? hot().has(i) : false);

  const feedId = Buffer.from(VIEW);
  const aboveId = Buffer.from(ABOVE);
  const belowId = Buffer.from(BELOW);
  /** The feed's height from the last layout (0 on the first frame). */
  const viewH = () => ui.bounds(feedId)?.[3] ?? 0;

  /** How far the feed can scroll: the real content (the cards' block from the measured cache, and the feed's two 12px
   *  paddings) less the viewport. 0 when the feed fits; never the declared subset's height, or the bar and both ends
   *  would move with what happens to be on screen. */
  const maxScroll = () => Math.max(0, content - viewH());

  /** The feed's scroll (src/vscroll.ts): the wheel, the drag, the band and the fling, on a track of its own; the feed's
   *  end is its real content's, as `maxScroll` measures it. The scrollbar's thumb (`BAR`) is the machine's too: it writes
   *  its box and its fade every frame. */
  const feedScroll = scroll(VIEW, maxScroll, BAR);

  /** One card a frame: its hover fade, and its entry while that runs (once, on mount). Writes nothing at all once both
   *  are the literals, so a frame at rest is the frame the style's literals make. */
  const cardFrame = (c: CardFx, i: number, t: number) => {
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

  /** One frame: the cards' and the tabs' motion at the scroll's clock (so a frame is one instant), then the feed's own
   *  scroll (src/vscroll.ts), which retargets on the wheel and a key and writes the offset to Clay's clip element; then
   *  the window that offset shows. The heights are the last frame's `ui.bounds` of each declared card: a card's own
   *  height does not depend on where the window put it, so one measurement serves every frame after its first — and while
   *  the window is the measuring pass's (every card declared) that is the whole feed in one frame. */
  const tick = (dt: number) => {
    const t = feedScroll.now;
    // the selection first: a tab that becomes active starts its underline at once (a frame later would flash the
    // literal's full colour before the fade's first 0), and the one that had it fades out; a new feed's cards are other
    // posts, so the heights measured for the old feed are not theirs
    const sel = active();
    const switched = sel !== activeWas;
    if (switched) {
      activeWas = sel;
      heights.length = 0;
      for (const [i, f] of tabFx.entries()) {
        f.under.retarget(t, i === sel ? 255 : 0, UNDERLINE);
        f.ink.retarget(t, i === sel ? 100 : 0, LABEL);
      }
    }
    if (!switched)
      for (let i = shownFirst; i <= shownLast; i++) {
        const b = ui.bounds(cardFx(i).id);
        if (b && b[3]! > 0) heights[i] = b[3]!;
      }
    const keep = tabFx.map((f, i) => tabFrame(f, i, t));
    // the cards this frame: the window the last frame declared, and any state still running (an entry, or a hover
    // leaving) — nothing else, so a feed of hundreds costs what is on screen
    const live = new Set<number>();
    for (let i = shownFirst; i <= shownLast; i++) live.add(i);
    for (const [i, c] of fx) if (!c.arrived || c.on || !c.hover.at(t).done) live.add(i);
    const hotNow = new Set<number>();
    for (const i of live) {
      const c = cardFx(i);
      cardFrame(c, i, t);
      if (c.on || c.hover.at(t).x > 0) hotNow.add(i);
    }
    if (keep.join() !== underlined().join()) setUnderlined(keep);
    if (hotNow.size !== hot().size || [...hotNow].some((i) => !hot().has(i))) setHot(hotNow);
    // the real content (every card of the feed, all of them measured once the pass is over, and both paddings), then the
    // offset as the track presents it, then the window it shows. A track that was at the old end follows the content's
    // new one while the pass is running (its frames read the mean's estimate), and a key's End must still land on the
    // real end.
    const oldMax = Math.max(0, content - viewH());
    const atEnd = oldMax > 0 && Math.abs(feedScroll.target() - oldMax) <= 0.5;
    const count = feed().posts.length;
    content = measuredWindow({ offset: 0, view: 0, count, heights, gap: GAP, overscan: OVERSCAN }).content + 2 * PAD;
    const max = Math.max(0, content - viewH());
    if (atEnd && max > oldMax + 0.5) feedScroll.seek(max);
    feedScroll.tick(dt);
    const w = measuredWindow({
      // the feed's padding is above the first card and below the last: the children's visible range starts that much
      // earlier than the clip's offset says, and is the clip's whole height tall
      offset: -ui.scrollOffset(VIEW) - PAD,
      view: viewH(),
      count,
      heights,
      gap: GAP,
      overscan: OVERSCAN,
    });
    const top = w.above > 0;
    const bottom = w.below > 0;
    if (w.first !== shownFirst || w.last !== shownLast || top !== shownTop || bottom !== shownBottom) {
      shownFirst = w.first;
      shownLast = w.last;
      shownTop = top;
      shownBottom = bottom;
      setCells(cellsOf(w, sel));
    }
    // a spacer's height is a FIXED axis's min and max, written every frame (the channel is a frame's) as the thumb's are
    ui.value(aboveId, FIELDS.HEIGHT + 1, w.above);
    ui.value(aboveId, FIELDS.HEIGHT + 2, w.above);
    ui.value(belowId, FIELDS.HEIGHT + 1, w.below);
    ui.value(belowId, FIELDS.HEIGHT + 2, w.below);
  };
  if (props.motion)
    (props.motion.onWheel = feedScroll.wheel),
      (props.motion.tick = tick),
      (props.motion.onPointer = feedScroll.pointer);

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
      feedScroll.seek(key === "Home" ? 0 : key === "End" ? max : feedScroll.target() + step);
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
              <text id={`sky-tabs-label-${i}`} style={tab.selected ? s.tabTextOn : s.tabText}>{feeds[i]!.name}</text>
            </box>
          ))}
        </box>
      </box>
      <box {...bind} onPress={() => (bind.onPress(), feedScroll.press())} style={s.view}>
        {/* the window: a spacer for the cards above, the declared cards, a spacer for the ones below — all cells of one
            `For`, so they are in that order in the feed's gap-spaced column and the declared cards are where the whole
            feed would have put them */}
        <For each={cells()}>
          {(cell) => {
            if (cell === TOP) return <box id={ABOVE} style={s.spacer} />;
            if (cell === BOTTOM) return <box id={BELOW} style={s.spacer} />;
            const i = Number(cell.slice(cell.indexOf(":") + 1));
            const post = (): Post => feed().posts[i] ?? BLANK;
            return (
              <box
                id={`sky-card-${i}`}
                style={
                  selected()?.feed === active() && selected()?.i === i ? s.cardOn : isHot(i) ? s.cardHover : s.card
                }
                onClick={() => {
                  // a press that dragged the feed is not a click on the card it started on
                  if (!feedScroll.dragged) setSelected({ feed: active(), i });
                }}
              >
                <box id={`sky-avatar-${i}`} style={AVATARS[post().handle.split(".")[0]!]!} />
                <box style={s.nameLine}>
                  <text style={s.name}>{post().name || post().handle}</text>
                  <text style={s.meta}>
                    {post().name ? `@${post().handle} · ${ago(post().created)}` : ago(post().created)}
                  </text>
                </box>
                <box id={`sky-body-${i}`} style={s.bodyBox}>
                  <text style={s.body}>{post().text}</text>
                </box>
                {post().media ? <text style={s.media}>{post().media}</text> : null}
                <text style={s.counts}>
                  {`${num(post().replies)} replies · ${num(post().reposts)} reposts · ${num(post().likes)} likes`}
                </text>
              </box>
            );
          }}
        </For>
        {feed().posts.length === 0 ? (
          <box id="sky-empty" style={s.empty}>
            <text style={s.emptyText}>Nothing here yet</text>
          </box>
        ) : null}
      </box>
      {/* the scrollbar: a float on the feed, over the cards and outside the clip's child offset (it does not scroll) */}
      <box id={BAR} style={s.thumb} onPress={() => feedScroll.thumb()} />
      <box id="sky-status" style={s.status}>
        <text style={s.statusText}>{statusOf()}</text>
      </box>
    </box>
  );
}
