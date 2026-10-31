// The Sky page: csssky's home feed as a phone-shaped page (360x760), the first real app on this renderer. The bar has the
// wordmark and the three feeds as a headless tablist (roving focus, arrows switch the feed), the feed is one Clay clip
// element that the wheel scrolls (as on the List page), and each post is a card with a drawn avatar, a name and handle, a
// wrapped body, the media line and the counts. The data is the app's recorded fixtures, verbatim (the same six posts
// terminal/sky.c carries): times are the app's ago() with the clock pinned to the fixtures' capture moment, so a frame
// reads the same today as it did when recorded, and News has no fixture, so its feed is the app's empty case.
//
// The palette is terminal/sky_styles.ts's (apps/csssky-tui's styles.ts, read only): the sky palette in the dark theme here,
// the light one under THEME=light.
// A card click records the selection and opens **the thread screen** (the second screen of this page, below the same
// bar): the post the card's at-uri names, fetched from the AppView, as the focused card, then the app's own flattening of
// its reply tree (apps/csssky-tui's rowsOf): post rows indented by depth, the tombstones' words, and the "Show N more
// replies" row a branch cut at the app's depth limit ends in. The screen opens **immediately in its loading state** — the
// header and one muted row — and the answer lands in the rows, or in an error state with a Retry row: the loader is the
// page's own prop (`load`, `main.ts`'s is the AppView's getPostThread, the tests' a promise they settle). The thread is a
// root float over the content area, so the feed stays declared and untouched under it (its offset and its selected card),
// and the screen comes in and goes out as one group (12px, alpha, 0.3s) — the page's own card entry, through
// `presence`. The body is the first text on these pages that wraps: it is a text in a stretch box in a card of percent
// width, and Clay wraps a text element only when something constrains its width (a clip element lets its children grow
// past the viewport).
import * as css from "cssints/clay" with { type: "cssints" };
import { createSignal, For, onCleanup, Show } from "solid-js";

import { a11y } from "../a11y.ts";
import { createButton, createTabs } from "../../headless/src/index.ts";
import type { Motion } from "../src/entry.ts";
import { effect, presence, reduced, spatial, track, type Track } from "../src/motion.ts";
import { scroll, type Scroll } from "../src/vscroll.ts";
import { measuredWindow, type Window } from "../src/virtual.ts";
import { ui } from "../src/ffi.ts";
import type { FocusPart, Input } from "../src/input.ts";
import { FIELDS, variant } from "../src/pack.ts";
import type { State } from "../src/pack.ts";
// the page's third screen (the feed, the thread, then settings): its own file, so this one keeps the feed, the bar and
// the thread — its gear, its frame and its controls are `Settings.tsx`'s
import { skySettings } from "./Settings.tsx";
// the app's own thread model: rowsOf flattens a ThreadScreen (the API's ThreadNode over PostView) the way csssky-tui's
// rows and the terminal's cells do, and the words (goneText, moreLabel), the sort (topFirst) and the depth cut
// (MAX_DEPTH) are the app's, imported rather than copied. Its PostView becomes this page's card in `postOf` below.
import { topFirst } from "../../../apps/csssky/src/api.ts";
import type { threadScreen, ThreadNode } from "../../../apps/csssky/src/api.ts";
import { embedParts } from "../../../apps/csssky/src/post/model.ts";
import { mediaText, rowsOf } from "../../../apps/csssky-tui/src/model.ts";
import { createProfile } from "./Profile.tsx";
import { createNotify } from "./Notify.tsx";
import type { AppBskyFeedDefs } from "@atcute/bluesky";

// the sky palette (the page, the card one tonal step above it, the hover step, the muted step and the accent blue) is
// `Sky.styles.ts`'s: the settings screen's styles are built from the same tokens, so the two screens are one palette
import { font, t } from "./Sky.styles.ts";

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

// ---- the thread screen ---------------------------------------------------------------------------------------------
// The ids: the screen (the float and the a11y region), the header, the clip element the page scrolls (the feed's machine,
// a second instance) and its thumb.
const THREAD = "sky-thread";
const HEAD = "sky-thread-head";
const THREAD_VIEW = "sky-thread-view";
const THREAD_BAR = "sky-thread-thumb";
/** The thread's height: the window less the bar (64), which stays put above it. */
const THREAD_H = 696;
/** The indent a reply's depth puts between the screen's left padding and its card: the app's marginLeft, 16px a level. */
const INDENT = 16;

// the screen: a root float over the content area, the bar's width and the rest of the window's height, so the feed and its
// status line stay declared underneath (their boxes, the selected card and the clip's offset are the feed's, untouched)
const thread = css.cn(
  css.width("stretch"),
  css.height(THREAD_H),
  css.flexDirection("column"),
  css.bg(t.color.page),
  css.float({
    root: true,
    attach: { element: "left top", parent: "left top" },
    offset: { y: 64 },
    zIndex: 2,
    capture: true,
  }),
);
// the header: the back control, then the title; a 44px row that stays put while the thread scrolls under it
const head = css.cn(css.width("stretch"), css.height(44), css.p(0, 12), css.gap(12), css.alignItems("center"), css.bg(t.color.page));
const back = css.cn(
  css.height(28),
  css.p(0, 10),
  css.justifyContent("center"),
  css.borderRadius(8),
  css.bg(t.color.panel),
  css.border(1, t.color.muted),
  css.hover(css.bg(t.color.hover)),
  css.active(css.bg(t.color.hoverDeep)),
  css.focus(css.border(2, t.color.ring)),
);
const backText = css.cn(font.Roboto, css.color(t.color.ink), css.fontSize(14));
const threadTitle = css.cn(font.Roboto, css.color(t.color.ink), css.fontSize(16));
// the clip element: the feed's own shape (padding, 8px gap, a column that clips), with the thread's track
const threadView = css.cn(
  css.width("stretch"),
  css.height("stretch"),
  css.p(12),
  css.gap(8),
  css.flexDirection("column"),
  css.overflow("hidden"),
  css.bg(t.color.page),
  css.focus(css.border(2, t.color.ring)),
);
const threadThumb = css.cn(
  css.width(4),
  css.height(24),
  css.borderRadius(2),
  css.bg(t.color.muted),
  css.float({
    parent: THREAD_VIEW,
    attach: { element: "right top", parent: "right top" },
    offset: { x: -2 },
    zIndex: 1,
    capture: false,
  }),
);
// a row's wrapper: the indent is its left padding, so the card keeps a percent width and wraps as the feed's does
const threadRow0 = css.cn(css.width("stretch"));
const threadRow1 = css.cn(css.width("stretch"), css.paddingLeft(16));
const threadRow2 = css.cn(css.width("stretch"), css.paddingLeft(32));
const threadRow3 = css.cn(css.width("stretch"), css.paddingLeft(48));
const threadRow4 = css.cn(css.width("stretch"), css.paddingLeft(64));
const threadRowIndent = [threadRow0, threadRow1, threadRow2, threadRow3, threadRow4];
// a tombstone — and the loader's own one or two rows (loading, the error and its retry): the app's tombstone card, its
// own words (goneText, or the state's line), no author and no counts
const tomb = css.cn(css.width("100%"), css.p(12), css.gap(8), css.flexDirection("column"), css.bg(t.color.panel), css.borderRadius(12));
const tombText = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(14), css.lineHeight(20), css.whiteSpace("normal"));
// the "Show N more replies" row: the app's outlined button, the accent's words
const more = css.cn(
  css.width("100%"),
  css.height(36),
  css.p(0, 12),
  css.alignItems("center"),
  css.bg(t.color.panel),
  css.borderRadius(8),
  css.border(1, t.color.muted),
  css.hover(css.bg(t.color.hover)),
  css.active(css.bg(t.color.hoverDeep)),
);
const moreText = css.cn(font.Roboto, css.color(t.color.accent), css.fontSize(13));

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
  thread,
  head,
  back,
  backText,
  threadTitle,
  threadView,
  threadThumb,
  threadRowIndent,
  tomb,
  tombText,
  more,
  moreText,
  THREAD,
  HEAD,
  THREAD_VIEW,
  THREAD_BAR,
  INDENT,
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

/** One post of a feed: the fields the card draws (terminal/sky.c's SkyPost), and the at-uri its thread is opened from —
 *  the loader's argument, so a card that the page cannot open (no uri) does nothing. */
export interface Post {
  readonly uri: string; // at://<actor>/app.bsky.feed.post/<rkey>
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
    uri: "at://did:plc:ccscygoww4uf76s5eyu7pqut/app.bsky.feed.post/3mwviv6b3u22w",
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
    uri: "at://did:plc:p32pqknh5qh7yjpylmzlgnqo/app.bsky.feed.post/3mwvn4tpt4s23",
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
    uri: "at://did:plc:ljtkbowqaiooic3koshhwsxl/app.bsky.feed.post/3mwvjrzq2pk2i",
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
    uri: "at://did:plc:5x72aocwx5dlm56hzefcmkhr/app.bsky.feed.post/3mwvpfejk2k2g",
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
    uri: "at://did:plc:yh5kl53hwy7rhahgcsuyef5a/app.bsky.feed.post/3mwvoy6gt7k23",
    name: "David Blanchflower BSc",
    handle: "davidbflower.bsky.social",
    text: "Tonight Mars continues to near the Beehive Cluster. Early on Monday morning joined by the Waning Crescent Moon.",
    replies: 0,
    reposts: 1,
    likes: 6,
    created: 1790955129,
  },
  {
    uri: "at://did:plc:fgg73erlhkthcabpjgaieykp/app.bsky.feed.post/3mwvmpqfeis2v",
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
const BLANK: Post = { uri: "", name: "", handle: "", text: "", replies: 0, reposts: 0, likes: 0, created: 0 };

// ---- the thread's data: the AppView's screen, through the app's own model ----------------------------------------------
// A screen is what `apps/csssky/src/api.ts`'s threadScreen returns: the parents above the post (the chain the screen
// draws first, all at depth 0) and the root (the post the screen is about, `focus` in rowsOf's rows) with its reply tree.
// The page's rows are `rowsOf` over it — the app's cut at MAX_DEPTH, its sort (topFirst), its words (goneText,
// moreLabel) — and each of its PostViews becomes the card below in `postOf`, the six fields the feed draws.
export type ThreadScreen = Awaited<ReturnType<typeof threadScreen>>;

/** The page's one async boundary: a thread's screen for a post's at-uri. A promise (the AppView's), or the screen itself
 *  when it is already at hand (the recorded fixture of an offline frame, a test); a throw is the error state. */
export type Loader = (uri: string) => ThreadScreen | Promise<ThreadScreen>;

/** The AppView's getPostThread, the call `apps/csssky/src/api.ts` makes: the same endpoint, the same query (`depth` 6 is
 *  the replies' levels, the API's default; `parentHeight` 20 the parents the screen shows). No retry — a thread is a
 *  screen the reader asked for and can ask again (the error state's Retry row) — and a timeout, so a dead network is
 *  that error state and not a spinner forever. */
export const APPVIEW = "https://public.api.bsky.app";
export const THREAD_TIMEOUT = 8000; // ms
export const threadUrl = (uri: string) =>
  `${APPVIEW}/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=6&parentHeight=20`;

export const fetchThread: Loader = async (uri) => {
  const r = await fetch(threadUrl(uri), { signal: AbortSignal.timeout(THREAD_TIMEOUT) });
  if (!r.ok) throw new Error(`getPostThread: HTTP ${r.status}`);
  const body = (await r.json()) as { thread: unknown };
  return screenOf(body.thread);
};

/** A thread view as it comes off the wire: the unions' branches the screen cares about. */
interface RawNode {
  $type?: string;
  post?: AppBskyFeedDefs.PostView;
  replies?: readonly RawNode[];
  parent?: RawNode;
  uri?: string;
}

/** One node of the answer as the API's ThreadNode: a post with its replies (topFirst's order, as the app sorts them),
 *  or a tombstone. api.ts's node() also moderates by labeler verdict; this page has no labels, so a hidden post would be
 *  drawn (README's "not here"). */
function nodeOf(t: RawNode): ThreadNode {
  if (t.$type === "app.bsky.feed.defs#threadViewPost" && t.post)
    return { kind: "post", post: t.post, replies: (t.replies ?? []).map(nodeOf).sort(topFirst) };
  return {
    kind: "gone",
    why: t.$type === "app.bsky.feed.defs#blockedPost" ? "blocked" : "notFound",
    uri: t.uri ?? "",
  };
}

/** The recorded (or fetched) `getPostThread` answer's `thread`, as threadScreen's return: the parents from the nearest
 *  outward (a handle resolves in the at-uri, as in the app), then the root. */
export function screenOf(thread: unknown): ThreadScreen {
  const t = thread as RawNode;
  if (t.$type !== "app.bsky.feed.defs#threadViewPost") return { parents: [], root: nodeOf(t) };
  const parents: ThreadNode[] = [];
  for (let p = t.parent; p; p = p.$type === "app.bsky.feed.defs#threadViewPost" ? p.parent : undefined)
    parents.unshift(nodeOf(p));
  return { parents, root: nodeOf(t) };
}

/** A row of the screen: rowsOf's post (at its depth, the root `focus`ed), its tombstone (`note`), the row a cut branch
 *  ends in (`more`, `open` being the post whose thread it opens), and the loader's own three. */
type Row =
  | { readonly kind: "post"; readonly post: Post; readonly depth: number; readonly focus: boolean }
  | { readonly kind: "note"; readonly text: string; readonly depth: number }
  | { readonly kind: "more"; readonly text: string; readonly depth: number; readonly open: string }
  | { readonly kind: "loading"; readonly depth: 0 }
  | { readonly kind: "error"; readonly depth: 0 }
  | { readonly kind: "retry"; readonly depth: 0 };

const LOADING_TEXT = "Loading the thread…";
const ERROR_TEXT = "The thread could not be loaded";
const LOADING: readonly Row[] = [{ kind: "loading", depth: 0 }];
const FAILED: readonly Row[] = [{ kind: "error", depth: 0 }, { kind: "retry", depth: 0 }];

/** A note row's words: the app's tombstone, or the loader's state (the retry row is never a note). */
const noteText = (r: Row) => (r.kind === "note" ? r.text : r.kind === "loading" ? LOADING_TEXT : ERROR_TEXT);

/** What the screen shows: the loader's request (its uri, and the row's one line), its answer (the screen, and the rows
 *  the page draws it as), or its failure (the note and the retry row). */
type State =
  | { readonly kind: "loading"; readonly uri: string }
  | { readonly kind: "ready"; readonly uri: string; readonly t: ThreadScreen; readonly rows: readonly Row[] }
  | { readonly kind: "error"; readonly uri: string };

/** The API's PostView as the card's record: the author, the record's text and time, the media as the terminal's line
 *  (`mediaText`, csssky-tui's own), the counts. */
export function postOf(p: AppBskyFeedDefs.PostView): Post {
  const record = p.record as { text?: string; createdAt?: string };
  const media = embedParts(p).media;
  return {
    uri: p.uri,
    name: p.author.displayName ?? "",
    handle: p.author.handle,
    text: record.text ?? "",
    media: media ? mediaText(media) : undefined,
    replies: p.replyCount ?? 0,
    reposts: p.repostCount ?? 0,
    likes: p.likeCount ?? 0,
    created: Math.floor(Date.parse(record.createdAt ?? p.indexedAt) / 1000),
  };
}

/** The screen's rows, as the page draws them: the app's `rowsOf`, its PostViews mapped into this page's cards. */
export function rowsView(t: ThreadScreen): readonly Row[] {
  return rowsOf(t).map((r) =>
    r.kind === "post"
      ? { kind: "post", post: postOf(r.post), depth: r.depth, focus: r.focus === true }
      : r.open
        ? { kind: "more", text: r.text, depth: r.depth, open: r.open.uri }
        : { kind: "note", text: r.text, depth: r.depth },
  );
}

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
      uri: `at://did:plc:synthetic/app.bsky.feed.post/${i}`,
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
 * app's). Two Tab stops of its own: the tablist (one stop on the active tab, arrows move and switch) and the feed, and
 * each screen's once it is up. `n` on the feed opens the notifications (`Notify.tsx`), Esc or the back control returns.
 * The feed's keys
 * scroll it: Down and Up 40px, PageDown and PageUp a viewport, Home and End to the ends. The wheel adds 10px a notch and
 * a flick keeps going (a decay) to its projection, clamped to the content; both are one motion track (src/motion.ts) the
 * page owns, retargeted from the presented (x, v), and `ui.scrollTo` puts the value on Clay's clip element each frame.
 * Past an end the wheel pushes into a rubber band (Rune's `f(x)`), which lets go 80ms after the last notch and settles on
 * the clamp. **The pointer drags the feed as a phone would**: a press inside it grabs the offset and follows the pointer
 * 1:1 (the same band past an end), a press that travels past 4px is not a click on the card it started on, and the
 * release flings it on the speed of its last frames (or lets the band go). The bar and the status line are the feed's
 * siblings, so they stay put. On mount the
 * cards arrive staggered (translate + opacity through the group fields, so nothing moves in the layout), a card and a tab
 * fade their hover, and the tabs fade the 2px underline and the label's colour from the one that was active to the one
 * that is — the label through the text's own four floats (`ui.value` on its id), which its box does not hold.
 *
 * **A card press opens the thread screen** (or, from a "Show N more replies" row, a deeper thread: the history is one
 * deep, so that row's back returns to the thread it came from and a card's back to the feed). The screen is a root float
 * over the content area, so the feed stays declared underneath — its offset and its selected card are the feed's own and
 * are not written while the thread is up — and the screen enters and leaves as one group: 12px up and 0 opacity on the
 * page's card entry's tracks (`spatial(0.3)`/`effect(0.3)`), reversed on the way out, with `presence` keeping it mounted
 * for the exit. It opens in its **loading state** (the header and one muted row) and the loader's answer replaces it: the
 * app's rows, or the error state with a retry row. Its two Tab stops are the back control and the clip element, which
 * scrolls on the feed's own machine (src/vscroll.ts): the wheel over it, Down/Up 40px, PageDown/PageUp a viewport,
 * Home/End. Escape (from either of them, or from the bar) and a click on a tab return to the feed; the cards are not
 * stops.
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
  /** The host's write-back of the theme: the settings screen's radio calls it, so that the frame's theme — the one every
   *  style's variant is picked by — is the page's too (`main.ts` sets its own `theme` variable, which its frame reads). */
  setTheme?: (theme: string | undefined) => void;
  posts?: readonly Post[];
  /** The thread's data: a post's at-uri in, its screen out (the AppView's call by default; a test's promise, or the
   *  recorded fixture of an offline frame, replaces it). */
  load?: Loader;
  /** The screen the page starts on: the feed, or the notifications (`bun solid/main.ts notify`, `terminal/solid.ts
   *  --page notify` — the page `n` leaves the feed on, as the C shell starts its stack at a page). */
  screen?: "notifications";
  /** A deliberately broken run for the terminal host's mutation lines (`Notify.tsx`): `verbs` draws one wrong verb on
   *  every notification row, `rows` makes the rows no Tab stops. */
  mutate?: string;
}) {
  const { input } = props;
  // The page's theme: the host's (`main.ts`'s `t` key, `THEME=light`) or the settings screen's pick, which is written back
  // to the host so that its frame — the one that picks every style's variant — and the page's fades agree. A signal, kept
  // while the page runs and never stored.
  const [theme, setTheme] = createSignal(props.theme?.());
  const pickTheme = (next: string | undefined): void => {
    setTheme(next);
    props.setTheme?.(next);
  };
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
  const cardEnds = () => [backgroundOf(s.card, theme()), backgroundOf(s.cardHover, theme())];
  const tabEnds = () => [backgroundOf(s.root, theme()), backgroundOf(s.tab, theme(), true)];
  /** The label's two ends: the muted token and the accent, as the packed text styles carry them under the frame's theme. */
  const labelEnds = () => [textColorOf(s.tabText, theme()), textColorOf(s.tabTextOn, theme())];

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

  // ---- the thread screen ---------------------------------------------------------------------------------------------
  // what the screen shows (a loader's answer, or its own loading or error state — kept while its exit runs), whether it
  // is open, and the screen it was opened from — the history is one deep, so a "Show N more replies" row's back returns
  // to the thread it came from and a card's to the feed
  const [state, setState] = createSignal<State | null>(null);
  const [threadOpen, setThreadOpen] = createSignal(false);
  const [parent, setParent] = createSignal<{ readonly uri: string; readonly t: ThreadScreen } | null>(null);
  // whether the screen's node is in the tree this frame: the presence's answer, set by the tick before the flush
  const [threadShown, setThreadShown] = createSignal(false);
  const [threadFocused, setThreadFocused] = createSignal(false);
  // the group's motion: 12px low and transparent on the way in — the card entry's own tracks, on the whole screen — and the
  // same shape reversed on the way out, with `presence` keeping the node mounted for it
  const tfx = {
    present: presence(false, ENTRY.time),
    mounted: false,
    open: false,
    y: track(0, ENTRY_Y),
    a: track(255, ENTRY_A),
  };
  const threadId = Buffer.from(THREAD);
  const threadViewId = Buffer.from(THREAD_VIEW);
  const threadBarId = Buffer.from(THREAD_BAR);
  // the thread's real content from the last layout (the rows' block plus the clip's two 12px paddings)
  let threadContent = 0;
  /** How far the thread can scroll: its content less the clip's height. 0 when the rows fit. */
  const threadMax = () => Math.max(0, threadContent - (ui.bounds(threadViewId)?.[3] ?? 0));
  /** The thread's own scroll (a second instance of the feed's machine). A fresh one on every opening, so a screen always
   *  starts at its top, even when the thread it replaces was scrolled. */
  let threadScroll: Scroll = scroll(THREAD_VIEW, threadMax, THREAD_BAR);

  // the loader the page asks (the AppView's by default; main.ts's flag, or a test's promise, replaces it) and the count of
  // asks, so an answer that a back, a tab or a second open overtook cannot land on the screen it was not asked for
  const load = props.load ?? fetchThread;
  let asked = 0;
  /** Asks the loader for a post's thread and lands the answer in the state it belongs to: the loading state at once, then
   *  the rows, or the error state the retry row is offered from. Nothing throws out of here: a loader that throws does
   *  so inside this call, and one that rejects in a promise. */
  const ask = (uri: string) => {
    const n = ++asked;
    const land = (s: State) => {
      if (n === asked) setState(s);
    };
    setState({ kind: "loading", uri });
    let answer: ThreadScreen | Promise<ThreadScreen>;
    try {
      answer = load(uri);
    } catch {
      return land({ kind: "error", uri });
    }
    if (typeof answer.then !== "function") return land({ kind: "ready", uri, t: answer, rows: rowsView(answer) });
    answer.then(
      (t) => land({ kind: "ready", uri, t, rows: rowsView(t) }),
      () => land({ kind: "error", uri }),
    );
  };
  /** The rows the screen draws this frame: the loader's answer's, or the one or two rows its own state has. */
  const rows = (): readonly Row[] => {
    const s = state();
    if (s === null) return [];
    return s.kind === "ready" ? s.rows : s.kind === "loading" ? LOADING : FAILED;
  };
  /** The post the screen is about: rowsOf's `focus` row (the root; a parent is drawn above it at the same depth). It names
   *  the region, and it is the card with the accent border, the app's focused post. */
  const headPost = (): Post | undefined => {
    for (const r of rows()) if (r.kind === "post" && r.focus) return r.post;
    return undefined;
  };
  /** The screen the history goes back to: this one, once it has an answer. */
  const here = () => {
    const s = state();
    return s?.kind === "ready" ? { uri: s.uri, t: s.t } : null;
  };

  /** Opens a thread: the loader is asked for its screen, the screen it came from (null for a card's) is kept for back,
   *  and the open state mounts it — on this frame's tick, in its loading state, so the row's words are what the mount's
   *  entry draws. The entry is the presence's. */
  const openThread = (uri: string, from: { readonly uri: string; readonly t: ThreadScreen } | null) => {
    threadScroll = scroll(THREAD_VIEW, threadMax, THREAD_BAR);
    setParent(from);
    setThreadOpen(true);
    ask(uri);
    // its stops at once: the frame the screen opens on is still the one the tick reads the last committed state in, and a
    // key on that frame (Escape, a notification row's Enter) is the thread's, its back control's, not the list's under it
    stops(true);
  };
  /** Back: one step of the one-deep history, else the feed. The thread it came from is restored as the answer it already
   *  had (no second request) and an answer still on its way is dropped (`ask`'s token). */
  const leaveThread = () => {
    const up = parent();
    asked++;
    if (up === null) {
      setThreadOpen(false);
      return;
    }
    threadScroll = scroll(THREAD_VIEW, threadMax, THREAD_BAR);
    setState({ kind: "ready", uri: up.uri, t: up.t, rows: rowsView(up.t) });
    setParent(null);
  };
  /** The bar's tabs: the feed, whatever the history says. */
  const closeThread = () => {
    asked++;
    setParent(null);
    setThreadOpen(false);
  };

  // the back control is a headless button (role, Enter and Space, the pointer) and it takes Escape as the page's back
  // does; the clip element is the second stop, and its keys scroll it
  const back = createButton({ id: "sky-back", onClick: () => leaveThread() });
  const backPart: FocusPart & { readonly disabled: boolean } = {
    id: back.part.id,
    disabled: false,
    get focused() {
      return back.part.focused;
    },
    focus: () => back.part.focus(),
    blur: () => back.part.blur(),
    press: () => back.part.press(),
    keyDown: (key) => (key === "Escape" ? (leaveThread(), true) : back.part.keyDown(key)),
    keyUp: (key) => back.part.keyUp(key),
  };
  const backBind = input.bind(backPart);
  const regionPart: FocusPart & { readonly disabled: boolean } = {
    id: THREAD_VIEW,
    disabled: false,
    get focused() {
      return threadFocused();
    },
    focus: () => setThreadFocused(true),
    blur: () => setThreadFocused(false),
    keyDown: (key) => {
      if (key === "Escape") return leaveThread(), true;
      const view = ui.bounds(threadViewId)?.[3] ?? 0;
      const step = key === "ArrowDown" ? 40 : key === "ArrowUp" ? -40 : key === "PageDown" ? view : key === "PageUp" ? -view : 0;
      if (!step && key !== "Home" && key !== "End") return false;
      threadScroll.seek(key === "Home" ? 0 : key === "End" ? threadMax() : threadScroll.target() + step);
      return true;
    },
    keyUp: () => false,
  };
  const regionBind = input.bind(regionPart);
  // The Tab stops follow the screen: the feed's stop is disabled while the thread is open (its cards and its clip are
  // under the float), and the back control and the clip are registered then, in that order after the tablist. Focus
  // leaves with the screen, so the feed comes back as it was — nothing focused — and the frame is the one before the click.
  let stopsForThread = false;
  const stops = (open: boolean) => {
    if (open === stopsForThread) return;
    stopsForThread = open;
    input.focus.register(VIEW, { disabled: open });
    if (open) {
      input.add(backPart);
      input.add(regionPart);
      input.focus.focus(backPart.id);
    } else {
      input.focus.unregister(backPart.id);
      input.focus.unregister(regionPart.id);
      input.focus.blur();
    }
  };
  // ... and the screens' cover: the feed's stop is out of the Tab order while any screen is up, the thread's two stops
  // leave it while the profile is over them, and a thread opened from a notification hands the focus back to its row.
  // The notifications' own stops are `notify.enable`'s, each frame (a screen may open over them).
  let covered = "";
  const cover = () => {
    const thread = threadOpen();
    const up = profile.isOpen();
    const notes = notify.isOpen();
    const key = up ? (thread ? "under" : "profile") : thread ? "thread" : notes ? "notify" : "feed";
    if (key === covered) return;
    const was = covered;
    covered = key;
    input.focus.register(VIEW, { disabled: key !== "feed" });
    if (thread) {
      input.focus.register(backPart.id, { disabled: up });
      input.focus.register(regionPart.id, { disabled: up });
    }
    if (key === "thread") input.focus.focus(backPart.id);
    else if (key === "notify" && was === "thread") notify.refocus();
    else if (key === "feed" && was !== "") input.focus.blur();
  };
  // Escape anywhere else (the bar's tablist) is the page's last resort, with the host's own fallback beside it: the top
  // screen first (the profile, then a notification's thread, then the notifications), then the thread. `n` is the
  // notifications' key — the app's nav has no item for one, so the page carries it as the C shell does — and Tab past the
  // notifications' last row wraps the list.
  const hostFallback = input.fallback;
  input.fallback = (name) =>
    name === "Escape" && profile.isOpen()
      ? (profile.close(), true)
      : name === "Escape" && threadOpen()
        ? (leaveThread(), true)
        : name === "Escape" && notify.isOpen()
          ? (notify.close(), true)
          : name === "n" && !notify.isOpen() && !threadOpen() && !profile.isOpen() && !settings.open()
            ? (notify.open(), true)
            : name === "Tab" && notify.isOpen()
              ? notify.wrap()
              : (hostFallback?.(name) ?? false);
  onCleanup(() => (input.fallback = hostFallback));

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
    // the settings screen's own frame: an entry, its scroll, and the text size, whose answer re-measures the feed (a
    // taller card is another content end and another thumb)
    if (settings.tick(dt)) heights.length = 0;
    // the host's `t` key flips the frame's theme behind the page's back: the page follows it
    if (props.setTheme !== undefined && props.theme?.() !== theme()) pickTheme(props.theme?.());
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

    // ---- the thread screen ----
    // the presence decides whether its node is mounted; the group's two tracks are the card entry's (12px low, 0 opacity,
    // 0.3s) and run reversed on the way out. A fresh arrival starts them from the entry, a screen that comes back mid-exit
    // retargets from what it presents, and a settled screen writes nothing — its frame is the style's literals.
    const open = threadOpen();
    const wasMounted = tfx.mounted;
    const { mounted, closing } = tfx.present.update(open, dt);
    if (mounted !== tfx.mounted) setThreadShown(mounted);
    tfx.mounted = mounted;
    if (mounted) {
      if (!wasMounted) {
        tfx.y = track(ENTRY.y, ENTRY_Y, t);
        tfx.a = track(0, ENTRY_A, t);
        tfx.y.retarget(t, 0);
        tfx.a.retarget(t, 255);
      } else if (open !== tfx.open) {
        tfx.y.retarget(t, open ? 0 : ENTRY.y);
        tfx.a.retarget(t, open ? 255 : 0);
      }
      const y = tfx.y.at(t),
        a = tfx.a.at(t);
      if (!y.done) ui.value(threadId, FIELDS.TRANSLATE_Y, y.x);
      if (!a.done) ui.value(threadId, FIELDS.ALPHA, a.x);
      // a closing screen passes the press through, so the feed under it is the feed's again the moment it closes
      if (closing) ui.value(threadId, FIELDS.CAPTURE, 1);
    }
    tfx.open = open;
    // the node has left: the data it showed is no longer needed
    if (!mounted && state() !== null) setState(null);
    stops(open);
    // the notifications' rows are stops only while the screen is the page's top one: a thread, the profile or the settings
    // screen may be over it (each has the Tab order then)
    notify.enable(notify.isOpen() && !open && !profile.isOpen() && !settings.open());
    cover();
    if (mounted) {
      // the rows' real content from the last frame's layout (the last row's bottom, the clip's own offset added back, and
      // the 12px padding below it), then the offset the machine presents and the fade of its thumb
      const shown = rows();
      const view = ui.bounds(threadViewId);
      const last = shown.length ? ui.bounds(Buffer.from(`sky-thread-row-${shown.length - 1}`)) : undefined;
      // the offset is Clay's (negative down), the last row's bounds are drawn shifted by it: adding the presented offset
      // back gives the row's place in the content, and the content ends 12px below it
      if (view && last) threadContent = Math.max(0, last[1] + last[3] - view[1] - ui.scrollOffset(THREAD_VIEW) + PAD);
      threadScroll.tick(dt);
    }
    // the profile screen's own frame: its entry (or exit), its list's content and its machine
    profile.tick(dt);
    // ... and the notifications': the same, over the feed
    notify.tick(dt);
  };
  // The wheel is the screen's under the pointer: the profile's clip and thumb while it is up (over the thread), then the
  // thread's, then the notifications', and the feed's everywhere else, as it always was (a wheel over the status line
  // scrolls it).
  const wheel = (dx: number, dy: number) => {
    if (profile.isOpen()) return profile.wheel(dx, dy);
    if (settings.open()) return settings.wheel(dx, dy);
    if (notify.isOpen() && !threadOpen()) return notify.wheel(dx, dy);
    if (!threadOpen()) return feedScroll.wheel(dx, dy);
    if (ui.over(threadViewId) || ui.over(threadBarId)) threadScroll.wheel(dx, dy);
  };
  // ... and so is the pointer: only the open screen's machine may see a drag, so the feed's press never travels under it
  const pointer = (x: number, y: number, down: boolean, touch?: boolean) => {
    if (profile.isOpen()) profile.pointer(x, y, down, touch);
    else if (settings.open()) settings.pointer(x, y, down, touch);
    else if (threadOpen()) threadScroll.pointer(x, y, down, touch);
    else if (notify.isOpen()) notify.pointer(x, y, down, touch);
    else feedScroll.pointer(x, y, down, touch);
  };
  if (props.motion)
    (props.motion.onWheel = wheel), (props.motion.tick = tick), (props.motion.onPointer = pointer);

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
  // the settings screen, the page's third: its gear is a Tab stop after the feed's (the page's keys are the ones it has
  // always had first, and the gear is the tablist's neighbour in the bar), and its own frame runs first in the tick — the
  // text size re-measures the feed — and its stops are the page's while it is up
  const settings = skySettings({ input, styles: s, theme: () => theme(), pickTheme, under: () => threadOpen() });

  // the page's third screen (app/Profile.tsx): a card's author opens the profile. It is set up here, after the feed's stop,
  // so its own stops (the back control, the tablist, the clip) sit after the feed's in the page's order; the screen itself
  // keeps its state, its motion and its element.
  const profile = createProfile({ input, styles: s, postOf, ago, num });

  // The page's fourth screen (app/Notify.tsx): the feed's `n` opens the notifications. Set up after the profile's, so its
  // stops (the back control and the five rows) come after the page's in the Tab order; its posts open the same thread the
  // feed's cards do (`openThread`, the page's `load`). The host's own entry — `terminal/solid.ts --page notify`,
  // `solid/main.ts notify` — is the page as `n` leaves it.
  const notify = createNotify({
    input,
    styles: s,
    postOf,
    ago,
    mutate: props.mutate,
    openPost: (uri) => openThread(uri, null),
    // its own node is the one under a thread: a notification's thread, the profile and the settings draw over it
    covered: () => threadShown() || profile.shown() || settings.shown(),
  });
  if (props.screen === "notifications") notify.open();

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
            <box
              {...binds[i]!}
              {...a11y(tab)}
              style={under(i) ? s.tabOn : s.tab}
              // a tab is the feed's: it switches the feed and leaves a thread, a profile and the settings screen
              // over it, whatever their history says
              onClick={() => {
                binds[i]!.onClick?.();
                if (profile.isOpen()) profile.close();
                if (threadOpen()) closeThread();
                if (notify.isOpen()) notify.close();
                settings.close();
              }}
            >
              <text id={`sky-tabs-label-${i}`} style={tab.selected ? s.tabTextOn : s.tabText}>{feeds[i]!.name}</text>
            </box>
          ))}
        </box>
        {/* the settings screen's gear, at the bar's right end: the app's own Settings control, a button named "Settings".
            A press on it is the screen's and takes no focus of its own (a click on it leaves the focus where it was, and
            the screen gives it back when it closes) */}
        <box
          {...a11y(settings.gear.part)}
          label="Settings"
          onPress={settings.gear.press}
          onClick={settings.gear.bind.onClick}
          style={settings.gear.style}
        >
          <box style={settings.gear.bar} />
          <box style={settings.gear.bar} />
          <box style={settings.gear.bar} />
        </box>
      </box>
      {/* the feed and its status line stay declared under the thread (its clip keeps its offset, its cards their boxes and
          the selection); the covered screen is out of the a11y tree while a screen is up */}
      <box
        {...bind}
        hidden={threadShown() || profile.shown() || settings.shown() || notify.shown()}
        onPress={() => (bind.onPress(), feedScroll.press())}
        style={s.view}
      >
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
                  // a press that dragged the feed is not a click on the card it started on; one on the author's row is that
                  // row's own (it opens the profile), and the rest of the card selects the post and opens its thread, by the
                  // record's own at-uri (no uri, no thread)
                  if (feedScroll.dragged) return;
                  if (ui.over(Buffer.from(`sky-author-${i}`))) return;
                  const p = feed().posts[i];
                  if (!p?.uri) return;
                  setSelected({ feed: active(), i });
                  openThread(p.uri, null);
                }}
              >
                <box id={`sky-avatar-${i}`} style={AVATARS[post().handle.split(".")[0]!]!} />
                <box
                  id={`sky-author-${i}`}
                  style={s.nameLine}
                  onClick={() => {
                    if (!feedScroll.dragged) profile.open();
                  }}
                >
                  <text style={settings.tx.name()}>{post().name || post().handle}</text>
                  <text style={settings.tx.meta()}>
                    {post().name ? `@${post().handle} · ${ago(post().created)}` : ago(post().created)}
                  </text>
                </box>
                <box id={`sky-body-${i}`} style={s.bodyBox}>
                  <text style={settings.tx.body()}>{post().text}</text>
                </box>
                {post().media ? <text style={settings.tx.media()}>{post().media}</text> : null}
                <text style={settings.tx.counts()}>
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
      <box id="sky-status" hidden={threadShown() || profile.shown() || settings.shown() || notify.shown()} style={s.status}>
        <text style={s.statusText}>{statusOf()}</text>
      </box>
      {/* the notifications screen: declared before the thread and the profile, so their root floats (the same z) draw over
          it — the thread a notification opens is over the list, as the C shell's stack has it; the node is the presence's,
          so it stays mounted for its 0.3s exit */}
      {notify.screen()}
      {/* the thread screen: a root float over the content area, its header (the back control and the title) above its own
          clip element. The region is named by the root's author; the rows are the app's: the posts at their depths, a
          tombstone's words as a note, a "Show N more replies" row as a button, and — while the loader has no answer — the
          one muted row its state has, the error one beside the retry it offers */}
      <Show when={threadShown()}>
        <box
          id={THREAD}
          role="region"
          label={headPost() ? `Thread — @${headPost()!.handle}` : "Thread"}
          hidden={profile.shown() || settings.shown()}
          style={s.thread}
        >
          <box id={HEAD} style={s.head}>
            <box {...backBind} {...a11y(back.part)} label="Back" style={s.back}>
              <text style={s.backText}>Back</text>
            </box>
            <text style={s.threadTitle}>Thread</text>
          </box>
          <box
            {...regionBind}
            onPress={() => (regionBind.onPress(), threadScroll.press())}
            style={s.threadView}
          >
            <For each={rows()}>
              {(row, index) => (
                <box id={`sky-thread-row-${index()}`} style={s.threadRowIndent[Math.min(row.depth, 4)]!}>
                  {row.kind === "post" ? (
                    <box
                      id={`sky-thread-card-${index()}`}
                      role="article"
                      label={row.post.name || row.post.handle}
                      style={row.focus ? s.cardOn : s.card}
                    >
                      {row.focus && AVATARS[row.post.handle.split(".")[0]!] ? (
                        <box id="sky-thread-avatar" style={AVATARS[row.post.handle.split(".")[0]!]!} />
                      ) : null}
                      <box
                        id={`sky-thread-author-${index()}`}
                        style={s.nameLine}
                        onClick={() => profile.open()}
                      >
                        <text style={s.name}>{row.post.name || row.post.handle}</text>
                        <text style={s.meta}>
                          {row.post.name ? `@${row.post.handle} · ${ago(row.post.created)}` : ago(row.post.created)}
                        </text>
                      </box>
                      {row.post.text ? (
                        <box id={`sky-thread-body-${index()}`} style={s.bodyBox}>
                          <text style={s.body}>{row.post.text}</text>
                        </box>
                      ) : null}
                      {row.post.media ? <text style={s.media}>{row.post.media}</text> : null}
                      <text style={s.counts}>
                        {`${num(row.post.replies)} replies · ${num(row.post.reposts)} reposts · ${num(row.post.likes)} likes`}
                      </text>
                    </box>
                  ) : row.kind === "note" || row.kind === "loading" || row.kind === "error" ? (
                    <box
                      id={`sky-thread-card-${index()}`}
                      role="note"
                      label={noteText(row)}
                      style={s.tomb}
                    >
                      <text style={s.tombText}>{noteText(row)}</text>
                    </box>
                  ) : row.kind === "more" ? (
                    <box
                      id={`sky-thread-card-${index()}`}
                      role="button"
                      label={row.text}
                      onClick={() => openThread(row.open, here())}
                      style={s.more}
                    >
                      <text style={s.moreText}>{row.text}</text>
                    </box>
                  ) : (
                    <box
                      id={`sky-thread-card-${index()}`}
                      role="button"
                      label="Retry"
                      onClick={() => {
                        const s = state();
                        if (s) ask(s.uri);
                      }}
                      style={s.more}
                    >
                      <text style={s.moreText}>Retry</text>
                    </box>
                  )}
                </box>
              )}
            </For>
          </box>
          {/* the thread's thumb: a float on its clip, as the feed's is on the feed */}
          <box id={THREAD_BAR} style={s.threadThumb} onPress={() => threadScroll.thumb()} />
        </box>
      </Show>
      {/* the profile screen: declared last, so its root float (the thread's style, z 2) draws over the thread when
          one is under it; the whole screen keeps its own state, its list and its motion (app/Profile.tsx) */}
      {profile.screen()}
      {/* the settings screen: a float over the content area (and over the thread, if one is up); its own file draws
          it, and the node is the presence's, so it stays mounted for its exit */}
      <Show when={settings.shown()}>{settings.view()}</Show>
    </box>
  );
}
