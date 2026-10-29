// The Sky page's profile screen (app/Profile.tsx): a post card's author — its name-and-handle row, the app's own
// `<a href="/profile/…">` on the name — opens the author's profile as the page's third screen. The data is the app's
// recorded profile (apps/csssky/test/fixtures/profile-head.json and the three author feeds, read by app/profile.ts), so
// nothing here makes a request: the fixture page is what the frames show. The header, the tabs and their lists, the
// list's own scroll and thumb, back / Escape to the feed's exact frame, a profile opened from a thread returning to that
// thread, the entry (and reduced motion's none), the a11y tree, the stored frames, and the mutations.
import "./plugin.ts";

const { readFileSync } = await import("node:fs");
const { ui } = await import("./src/ffi.ts");
const { createFrame } = await import("./src/frame.ts");
const { createInput } = await import("./src/input.ts");
const { El, render, Txt } = await import("./src/renderer.ts");
const { Sky, screenOf, size, postOf } = await import("./app/Sky.tsx");
const { PROFILE_TABS, profileOf } = await import("./app/profile.ts");
const { setReducedMotion } = await import("./src/motion.ts");
const { thumbOf } = await import("./src/vscroll.ts");
const { snapshot } = await import("./a11y.ts");

/** apps/csssky's recorded getPostThread answer, so a thread can be under the profile (the page's own shaping). */
const FIXTURE = JSON.parse(
  readFileSync(new URL("../../apps/csssky/test/fixtures/thread.json", import.meta.url), "utf8"),
) as { thread: unknown };
const SCREEN = screenOf(FIXTURE.thread);
/** The recorded profile through the page's own mapper: what the screen draws. */
const DATA = profileOf(postOf);

ui.init(size.width, size.height);
ui.font(new URL("../vendor/fonts/Roboto-Regular.ttf", import.meta.url).pathname);

let failed = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const [a, b] = [JSON.stringify(got), JSON.stringify(want)];
  if (a !== b) failed++, console.error(`FAIL ${what}: ${a}, wanted ${b}`);
};

const ACCENT = [59, 156, 240]; // the accent token: the active tab's underline
const RING = [92, 176, 255]; // the clip's focus ring, and the underline of a tab a click focused
const PAGE = [16, 19, 22]; // the dark theme's page (the bar's: no group over it)
const near = (got: number[], want: number[], d = 2) =>
  got.length === 3 && want.every((v, i) => Math.abs(got[i]! - v) <= d);
/** Is a colour strictly between two others, channel by channel (a group fading in over the page)? */
const between = (c: number[], a: number[], b: number[]) =>
  c.length === 3 &&
  c.join() !== a.join() &&
  c.join() !== b.join() &&
  c.every((v, i) => v >= Math.min(a[i]!, b[i]!) && v <= Math.max(a[i]!, b[i]!));
/** An offset from layout, to the pixel: Clay's float32 turns 78 into 77.99998. */
const r = (x: number) => Math.round(x * 100) / 100;
const around = (got: number, want: number, d = 0.5) => Math.abs(got - want) <= d;
/** How many bytes two frames differ in: 0 is byte-identical (the RGBA of the same 360x760). */
const diffs = (a: Uint8Array, b: Uint8Array): number => {
  if (a.length !== b.length) return -1;
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
};

let dispose = () => {};
/** A fresh page. The thread's loader answers the recording at once (the only network-shaped path); the profile never
 *  asks it. Every block wants a page at rest. */
function fresh(theme?: string) {
  dispose();
  const root = new El("root");
  const input = createInput();
  // the page's frame hook, as the host wires it: the wheel in, one tick a frame, the pointer for the drags
  const motion: {
    onWheel?: (dx: number, dy: number) => void;
    onPointer?: (x: number, y: number, down: boolean, touch: boolean) => void;
    tick?: (dt: number) => void;
  } = {};
  dispose = render(() => Sky({ input, motion, theme: () => theme, load: () => SCREEN }), root);
  const frame = createFrame(root, {
    theme,
    onPressMiss: () => input.pressMiss(),
    onPointer: (x, y, down, touch) => motion.onPointer?.(x, y, down, touch),
    onWheel: (dx, dy) => motion.onWheel?.(dx, dy),
    tick: (dt) => motion.tick?.(dt),
  });
  let at = [-1, -1];
  const step = (down = false, touch = false) => frame(at[0]!, at[1]!, down, 1 / 60, true, touch);
  step();
  // Clay keeps a clip element's offset by its id across `fresh()` calls: every clip starts at its top
  ui.scrollTo("sky-feed", 0);
  ui.scrollTo("sky-thread-view", 0);
  ui.scrollTo("sky-profile-view", 0);
  step();
  // the feed's cards arrive staggered on mount (0.3s from the last one's start): a page at rest is 40 frames later
  for (let i = 0; i < 40; i++) step();

  const find = (pred: (el: El) => boolean, from: El = root): El[] =>
    from.children.flatMap((c) => (c instanceof El ? [...(pred(c) ? [c] : []), ...find(pred, c)] : []));
  const text = (el: El): string => el.children.map((c) => (c instanceof Txt ? c.text : text(c as El))).join("");
  const texts = () => find((el) => el.tag === "text").map(text);
  /** The texts of one element's subtree (the hidden feed's are in the tree too: an a11y `hidden` is not a removal). */
  const textsUnder = (id: string) => {
    const el = find((e) => e.props.id === id)[0];
    return el ? find((e) => e.tag === "text", el).map(text) : [];
  };
  const box = (id: string) => [...(ui.bounds(Buffer.from(id)) ?? [])];
  const pixel = (x: number, y: number) => ui.pixel(Math.floor(x), Math.floor(y)).slice(0, 3);

  return {
    root,
    input,
    box,
    pixel,
    texts,
    textsUnder,
    step,
    /** The status line: "Discover — 3 posts" or the selected card's "name — 2 of 3". */
    status: () => texts().find((s) => / — \d+ (of \d+|posts?)$/.test(s))!,
    pixels: () => ui.pixels(size.width, size.height),
    point(x: number, y: number) {
      at = [x, y];
      step();
    },
    /** A press and a release at x, y with a frame each, as the host's scripted click. */
    click(x: number, y: number) {
      at = [x, y];
      step(false);
      step(true);
      step(false);
      step(false);
    },
    clickOn(id: string) {
      const b = box(id);
      if (!b.length) throw new Error(`no box ${id}`);
      this.click(b[0]! + b[2]! / 2, b[1]! + b[3]! / 2);
    },
    /** One wheel notch down (negative for up) over the point the pointer is at, then a frame. */
    notch(n = 1) {
      motion.onWheel?.(0, -n);
      step();
    },
    wheel(n: number) {
      this.point(180, 560);
      for (let i = 0; i < n; i++) this.notch(1);
    },
    settle(n = 40) {
      for (let i = 0; i < n; i++) step();
    },
    tap(name: string) {
      input.down(name);
      step();
      input.up(name);
      step();
    },
    /** The pointer on the second card's author row, its hover settled: the feed's frame as the press leaves it. */
    onAuthor() {
      const a = box("sky-author-1");
      this.point(a[0]! + a[2]! / 2, a[1]! + a[3]! / 2);
      this.settle(40);
    },
    /** Its press: the profile opens over the feed, and 40 frames settle the entry. */
    openProfile() {
      this.clickOn("sky-author-1");
      this.settle(40);
    },
    card: (i: number) => box(`sky-card-${i}`),
    author: (i: number) => box(`sky-author-${i}`),
    profileCard: (i: number) => box(`sky-profile-card-${i}`),
    tab: (i: number) => box(`sky-profile-tabs-tab-${i}`),
    region: () => box("sky-profile"),
    head: () => box("sky-profile-head"),
    view: () => box("sky-profile-view"),
    back: () => box("sky-profile-back"),
    thumb: () => box("sky-profile-thumb"),
    offset: () => ui.scrollOffset("sky-profile-view"),
    feedOffset: () => ui.scrollOffset("sky-feed"),
    threadOffset: () => ui.scrollOffset("sky-thread-view"),
    threadRegion: () => box("sky-thread"),
    /** The articles of the profile's list, in the a11y tree: their names, in document order. */
    articles: () => {
      const out: string[] = [];
      const walk = (n: { role: string; name?: string; children: unknown[] }) => {
        if (n.role === "article" && n.name) out.push(n.name);
        (n.children as { role: string; name?: string; children: unknown[] }[]).forEach(walk);
      };
      walk(snapshot(root) as never);
      return out;
    },
  };
}

// --- the data: the recording through the page's own mapper — the head's four fields, and the app's three tabs
{
  check("the recording's head is Bluesky", [DATA.head.name, DATA.head.handle], ["Bluesky", "bsky.app"]);
  check("its bio is the recording's, with its blank line", DATA.head.bio.includes("\n\n"), true);
  check("the counts are the app's compact forms", [DATA.head.followers, DATA.head.following, DATA.head.posts], ["35M", "15", "865"]);
  check(
    "the app's tabs, in its order",
    PROFILE_TABS.map((t) => t.label),
    ["Posts", "Replies", "Media"],
  );
  check(
    "each tab holds its fixture's posts (11, 10, 13)",
    DATA.tabs.map((t) => t.posts.length),
    [11, 10, 13],
  );
  check("the Posts tab starts with the pinned Bluesky post", DATA.tabs[0]!.posts[0]!.name, "Bluesky");
  check("... one recording per tab: three different feeds", new Set(DATA.tabs.map((t) => t.posts[0]!.uri)).size, 3);
  check("the Replies tab starts with a reply by Aster ID", DATA.tabs[1]!.posts[0]!.name, "Aster ID");
  check(
    "the Media tab's every post carries a media line, as the terminal prints it",
    DATA.tabs[2]!.posts.every((p) => (p.media ?? "").startsWith("[")),
    true,
  );
  check("a card's counts are the record's, in the app's words", DATA.tabs[0]!.posts[0]!.likes > 0, true);
  console.log(
    `solid/profile.test.ts: the recording: ${DATA.head.name} @${DATA.head.handle}, ${DATA.head.followers} followers, ` +
      `${DATA.head.posts} posts; the tabs ${DATA.tabs.map((t) => `${t.label} ${t.posts.length}`).join(", ")}`,
  );
}

// --- a card's author opens the profile: the third screen, the window under the bar, its own header with the back control
//     and the word "Profile", then the recorded head (the disc, the name, the handle, the bio, the counts)
{
  const p = fresh();
  check("the author's row is the press: its box is the name line's", p.author(1), [24, 334, 312, 38]);
  p.openProfile();
  check("the screen is the window under the bar", p.region(), [0, 64, 360, 696]);
  check("the header is its first 44", p.head(), [0, 64, 360, 44]);
  check("the back control is on the header's left, 28 tall", [p.back()[0], r(p.back()[1]!), p.back()[3]], [12, 72, 28]);
  check("the title is the screen's word", p.texts().includes("Profile"), true);
  check("the back control has the focus on opening", p.input.focus.focused(), "sky-profile-back");
  check("the head's name, handle and bio are the recording's", ["Bluesky", "@bsky.app"].every((s) => p.texts().includes(s)), true);
  check("... the bio wrapped in one text", p.texts().some((s) => s.includes("Bugs, feature requests, feedback: support@bsky.app")), true);
  check("... and the counts in the app's words", p.texts().includes("35M followers · 15 following · 865 posts"), true);
  check("the drawn disc is the avatar (the recording's author has no committed PNG)", [p.box("sky-profile-avatar")[2], p.box("sky-profile-avatar")[3]], [56, 56]);
  check("the three tabs are the app's", ["Posts", "Replies", "Media"].every((s) => p.texts().includes(s)), true);
  check("the first tab is the active one: its underline is the accent", near(p.pixel(p.tab(0)[0]! + 4, p.tab(0)[1]! + p.tab(0)[3]! - 1), ACCENT, 2), true);
  check("... and the others' none: the screen's page", near(p.pixel(p.tab(1)[0]! + 4, p.tab(1)[1]! + p.tab(1)[3]! - 1), PAGE, 2), true);
  check("the card body's press did not open the thread (the author's row is not the card's)", [p.threadRegion(), p.status()], [[], "Discover — 3 posts"]);
  check("the feed's offset is untouched under it", p.feedOffset(), 0);
  check("the feed's card kept its box", p.card(1), [12, 274, 336, 208]);
  console.log(
    `solid/profile.test.ts: the screen ${JSON.stringify(p.region())}, head ${JSON.stringify(p.head())} at the window's ` +
      `64, view ${JSON.stringify(p.view())} (a 44 header, the 166 head, the 35.6 tablist), the back 28 tall`,
  );
}

// --- a click on the card's body still opens the post's thread: only the author's row changed what it opens
{
  const p = fresh();
  p.clickOn("sky-body-1");
  p.settle(40);
  check("a click on the body opens the thread, not the profile", [p.threadRegion(), p.region()], [[0, 64, 360, 696], []]);
  check("... and selects the card", p.status(), "Titania — 2 of 3");
  p.clickOn("sky-back");
  p.settle(40);
  check("back to the feed, where the author's row is still the profile's", p.region(), []);
  p.clickOn("sky-author-1");
  p.settle(40);
  check("and the author opens the profile", [p.region(), p.threadRegion()], [[0, 64, 360, 696], []]);
}

// --- the tabs switch the list: the first article's author and the count of cards per tab, one list at a time
{
  const p = fresh();
  p.openProfile();
  check("Posts: eleven cards, the first by Bluesky", [p.articles().length, p.articles()[0]], [11, "Bluesky"]);
  check("... the pinned post's text on screen", p.texts().some((s) => s.includes("Bluesky is an open social network")), true);
  p.clickOn("sky-profile-tabs-tab-1");
  p.settle(20);
  check("Replies: ten cards, the first by Aster ID", [p.articles().length, p.articles()[0]], [10, "Aster ID"]);
  check("... and no Posts card's text any more", p.texts().some((s) => s.includes("Bluesky is an open social network")), false);
  // a clicked tab has the focus, so its underline is the ring (the ring's 2px border is drawn over the 2px accent one), as
  // the bar's tab is in solid/sky.test.ts
  check("the Replies tab is the underlined one", near(p.pixel(p.tab(1)[0]! + 4, p.tab(1)[1]! + p.tab(1)[3]! - 1), RING, 2), true);
  p.clickOn("sky-profile-tabs-tab-2");
  p.settle(20);
  check("Media: thirteen cards, the first by Bluesky", [p.articles().length, p.articles()[0]], [13, "Bluesky"]);
  check("... every card's media line on screen", p.textsUnder("sky-profile").filter((s) => s.startsWith("[")).length, 13);
  check("... the media tab's underline moved", near(p.pixel(p.tab(2)[0]! + 4, p.tab(2)[1]! + p.tab(2)[3]! - 1), RING, 2), true);
  check("the first tab's is gone", near(p.pixel(p.tab(0)[0]! + 4, p.tab(0)[1]! + p.tab(0)[3]! - 1), PAGE, 2), true);
  console.log(
    `solid/profile.test.ts: the tabs: Posts 11 cards, then Replies' 10 (Aster ID), then Media's 13 with 13 media lines`,
  );
}

// --- the list scrolls on the page's own machine, with its own thumb; a tab switch resets the offset to the top, and the
//     feed's offset (and the thread's) are never written by it
{
  const p = fresh();
  p.openProfile();
  const view = p.view()[3]!;
  const last = p.profileCard(10);
  const content = r(last[1]! + last[3]! - p.view()[1]! + 12);
  check("the Posts list's content is the last card's bottom plus the clip's 12px padding", content, 2652);
  check("at the top its thumb is at the clip's top", r(p.thumb()[1]! - p.view()[1]!), 0);
  check("... the machine's height for the content in the view", r(p.thumb()[3]!), r(Math.max(24, (view * view) / content)));
  check("in the feed's 4px, 2px in from the right edge", [p.thumb()[0], p.thumb()[2]], [354, 4]);
  p.wheel(1);
  p.settle(40);
  const offset = -p.offset();
  check("one notch settles at exactly 10px", r(offset), 10);
  check("the feed's offset is untouched while the profile scrolls", p.feedOffset(), 0);
  const t = thumbOf(content, view, offset)!;
  check(
    "the thumb is the machine's geometry for the offset",
    [r(p.thumb()[1]! - p.view()[1]!), r(p.thumb()[3]!)],
    [r(t.top), r(t.height)],
  );
  check("its height never drops below 24", t.height >= 24, true);
  // the keys: the clip is a stop after the back control and the tablist
  p.tap("Tab");
  check("Tab reaches the screen's tablist", p.input.focus.focused(), "sky-profile-tabs-tab-0");
  p.tap("Tab");
  check("... then its clip", p.input.focus.focused(), "sky-profile-view");
  check("the clip wears the ring at its edge", p.pixel(1, p.view()[1]! + 200), RING);
  p.tap("End");
  p.settle(40);
  check("End reaches the list's end", around(-p.offset(), content - view), true);
  p.tap("Home");
  p.settle(40);
  check("Home brings it back to the top", around(p.offset(), 0), true);
  // a tab switch: another list, and the offset is the top again (not the old list's)
  p.wheel(2);
  p.settle(40);
  check("the list is scrolled before the switch", -p.offset() > 10, true);
  p.clickOn("sky-profile-tabs-tab-2");
  p.settle(20);
  check("the new tab's list starts at its top: the offset reset", r(p.offset()), 0);
  check("... and it is the media list: thirteen cards", p.articles().length, 13);
  check("the feed's offset is still its own", p.feedOffset(), 0);
  console.log(
    `solid/profile.test.ts: the list: content ${content} in ${r(view)} (${r(content - view)} to scroll), the thumb ` +
      `${r(p.thumb()[3]!)} tall; one notch 10, End ${r(content - view)}, Home 0, a tab switch back to 0`,
  );
}

// --- back and Escape return to the feed with the offset, the selection and the frame it left (0 bytes), and nothing has
//     the focus, as before the press
{
  const p = fresh();
  p.onAuthor();
  const before = p.pixels();
  const status = p.status();
  const offset = p.feedOffset();
  p.openProfile();
  check("the profile took the focus, the feed's stop disabled", [p.input.focus.focused(), p.input.focus.tabOrder().includes("sky-feed")], ["sky-profile-back", false]);
  check("the feed's offset is the one it had", p.feedOffset(), offset);
  p.clickOn("sky-profile-back");
  p.settle(40);
  check("the feed's offset is the one it left", p.feedOffset(), offset);
  check("the status line is the one it left", p.status(), status);
  check("nothing has the focus any more, as before the press", p.input.focus.focused(), null);
  check("the profile's node has gone", p.region(), []);
  p.onAuthor();
  check("the feed's frame is byte-identical to the one before the press", diffs(before, p.pixels()), 0);
  // Escape does the same, and it moves no pointer at all: the frame is the one the press left
  p.openProfile();
  p.tap("Escape");
  p.settle(40);
  check("Escape returns to the feed too", [p.region(), p.feedOffset(), p.status()], [[], offset, status]);
  check("and the frame is the same one again", diffs(before, p.pixels()), 0);
  // Escape from the bar's tablist (the fallback) is the page's back as well
  p.openProfile();
  p.tap("Tab");
  check("Tab from the back control reaches the screen's tablist", p.input.focus.focused(), "sky-profile-tabs-tab-0");
  p.tap("Escape");
  p.settle(40);
  check("Escape from the tablist (the page's fallback) closes it too", p.region(), []);
  p.openProfile();
  p.clickOn("sky-tabs-tab-0");
  p.settle(40);
  check("a click on the bar's tab returns to the feed", p.region(), []);
  p.onAuthor();
  check("... and its frame is still the one before the press", diffs(before, p.pixels()), 0);
  console.log(`solid/profile.test.ts: back: offset ${p.feedOffset()}, "${p.status()}", the frame ${diffs(before, p.pixels())} bytes off`);
}

// --- a profile opened from a thread returns to that thread: its rows and its own offset are the thread's, untouched
//     under the profile, and a second back returns to the feed
{
  const p = fresh();
  p.clickOn("sky-body-1");
  p.settle(40);
  p.wheel(2);
  p.settle(90);
  const threadOffset = -p.threadOffset();
  check("the thread is scrolled first", threadOffset > 10, true);
  p.clickOn("sky-thread-author-1");
  p.settle(40);
  check("a thread's author opens the profile over it", [p.region(), p.threadRegion()], [[0, 64, 360, 696], [0, 64, 360, 696]]);
  check("the thread is under it, out of the a11y tree", JSON.stringify(snapshot(p.root) as never).includes("Thread — @"), false);
  // the thread it was opened from, as the profile found it: the press under the pointer re-grabbed its track within the
  // half-pixel its settle allows, and from here the profile never writes it
  const underOffset = -p.threadOffset();
  const underRow = p.box("sky-thread-row-1");
  check("the thread keeps its own offset under the profile", around(underOffset, threadOffset, 1), true);
  p.settle(20);
  check("... which the profile does not move while it is up", -p.threadOffset(), underOffset);
  check("the profile's own list starts at its top", p.offset(), 0);
  p.clickOn("sky-profile-back");
  p.settle(40);
  check("back returns to the thread it came from, not the feed", p.region(), []);
  check("... its rows where they were", p.box("sky-thread-row-1"), underRow);
  check("... at its own offset", -p.threadOffset(), underOffset);
  check("... its back control focused again", p.input.focus.focused(), "sky-back");
  p.clickOn("sky-back");
  p.settle(40);
  check("and that thread's back is the feed's", p.threadRegion(), []);
  check("the feed's offset was never written", p.feedOffset(), 0);
  console.log(
    `solid/profile.test.ts: from a thread: the profile over it (both regions declared), the thread at ${r(underOffset)} ` +
      `under it and back to the same rows, then the feed`,
  );
}

// --- the entry: the screen comes in as one group — 12px low and 0 opacity — on the page's card entry's tracks, so the
//     frames between are blends of the feed and the screen, and the layout never moves
{
  const p = fresh();
  p.onAuthor();
  const author = p.author(1);
  const feed = p.pixel(180, 155); // the author's row: the feed's card tone where the profile's header will be
  p.clickOn("sky-author-1");
  check("the screen's first frame is declared", p.region(), [0, 64, 360, 696]);
  const entry = p.pixel(180, 155);
  check(
    "and draws nothing of itself: the feed's pixel is still there",
    Math.max(...entry.map((v, i) => Math.abs(v - feed[i]!))) <= 2,
    true,
  );
  const boxes = p.region();
  p.settle(2);
  const mid = p.pixel(180, 155);
  check("two frames in, the pixel is a blend of the feed's and the page's", between(mid, feed, PAGE), true);
  check("and the screen's box has not moved (a group transform moves no layout)", p.region(), boxes);
  check("nor has the card under it", p.card(1), [12, 274, 336, 208]);
  p.settle(40);
  check("at rest the screen's box is the window's", p.region(), [0, 64, 360, 696]);
  console.log(`solid/profile.test.ts: the entry: the feed's ${feed.join("/")} → ${mid.join("/")} at two frames → the page`);
}

// --- reduced motion: no entry (the first frame of the screen is the settled one, which is the stored frame) and no exit
{
  setReducedMotion(true);
  const p = fresh();
  p.clickOn("sky-author-1");
  p.step(); // the frame the screen is declared on: the entry would be here
  const first = p.pixels();
  p.settle(20);
  check("reduced motion's first frame is the settled profile (nothing moves after it)", diffs(first, p.pixels()), 0);
  check(
    "and it is the stored frame (frames/sky-profile.png)",
    diffs((ui.png(new URL("./frames/sky-profile.png", import.meta.url).pathname)?.pixels ?? new Uint8Array()), first),
    0,
  );
  // no exit either: back unmounts on the falling edge of the click
  p.clickOn("sky-profile-back");
  p.step();
  check("the exit is the falling edge: the feed is back on the same frame", p.region(), []);
  setReducedMotion(false);
  console.log(`solid/profile.test.ts: reduced motion: the entry's 0 frames, the exit's 0, the settled screen ${first.length} bytes`);
}

// --- the a11y tree: the profile is a region named by its handle, the back control a button, the app's tabs a tablist, and
//     every card an article named by its author; the covered feed and the thread under it are pruned
{
  const p = fresh();
  p.openProfile();
  const nodes = (() => {
    const walk = (n: { role: string; name?: string; children: unknown[] }): { role: string; name?: string }[] => [
      { role: n.role, name: n.name },
      ...(n.children as { role: string; name?: string; children: unknown[] }[]).flatMap(walk),
    ];
    return walk(snapshot(p.root) as never);
  })();
  check("the screen is a region named by the head's handle", nodes.some((n) => n.role === "region" && n.name === "Profile — @bsky.app"), true);
  check("the back control is a button named Back", nodes.some((n) => n.role === "button" && n.name === "Back"), true);
  check(
    "the app's tabs are the screen's tablist",
    ["Posts", "Replies", "Media"].every((name) => nodes.some((n) => n.role === "tab" && n.name === name)),
    true,
  );
  check(
    "every card is an article named by its author",
    ["Bluesky", "Aster ID", "Ken Jennings"].every((name) => nodes.some((n) => n.role === "article" && n.name === name)),
    true,
  );
  check("the bar's tablist is still the page's first stop", nodes.some((n) => n.role === "tab" && n.name === "Discover"), true);
  check("the feed's own card is not a node of the tree (it has no role)", nodes.some((n) => n.name === "Titania"), false);
  console.log(`solid/profile.test.ts: ${nodes.length} nodes: ${nodes.filter((n) => n.name).map((n) => `${n.role} "${n.name}"`).join(", ")}`);
}

// --- the stored frames: the settled screen after a press on the author is frames/sky-profile.png, and the recording
//     reproduces it byte for byte (no request, no clock)
{
  const p = fresh();
  p.openProfile();
  check(
    "the settled profile is frames/sky-profile.png",
    ui.diffPng(
      new URL("./frames/sky-profile.png", import.meta.url).pathname,
      new URL("./frames/sky-profile.png.actual.png", import.meta.url).pathname,
    ),
    0,
  );
  const stored = ui.png(new URL("./frames/sky-profile.png", import.meta.url).pathname)?.pixels;
  check("the recorded fixtures reproduce it byte for byte", diffs(stored ?? new Uint8Array(), p.pixels()), 0);
  // the light theme: the profile's own palette (the page's light tokens) under the same screen
  const l = fresh("light");
  l.openProfile();
  check(
    "the light screen is frames/sky-profile-light.png",
    ui.diffPng(
      new URL("./frames/sky-profile-light.png", import.meta.url).pathname,
      new URL("./frames/sky-profile-light.png.actual.png", import.meta.url).pathname,
    ),
    0,
  );
}

// --- the mutations, as asserts: the affordance, the tab's list and the shared offsets
{
  // the affordance: the author's row opens the profile — its own press, not the card's (a card whose handler ran would
  // have selected it and opened its thread)
  const p = fresh();
  p.clickOn("sky-author-0");
  p.settle(40);
  check("the author's press opens the profile alone", [p.region().length, p.threadRegion().length, p.status()], [4, 0, "Discover — 3 posts"]);
  p.clickOn("sky-profile-back");
  p.settle(40);
  // the card's own press is still the thread's, with the selection (the status names it)
  p.clickOn("sky-body-0");
  p.settle(40);
  check("and the card's body is still the thread's, selected", [p.threadRegion().length, p.status()], [4, "Michael Warburton — 1 of 3"]);
  // the tab's list: the media tab is the media fixture's (13 cards, each with a media line) and starts at the top even
  // though the previous tab was scrolled
  const q = fresh();
  q.openProfile();
  q.wheel(3);
  q.settle(40);
  const scrolled = -q.offset();
  q.clickOn("sky-profile-tabs-tab-2");
  q.settle(20);
  check("a tab switch puts the new list at its top (the old offset is not reused)", [scrolled > 10, q.offset()], [true, 0]);
  check("... and it is the media list, not the one that was up", [q.articles().length, q.articles()[0]], [13, "Bluesky"]);
  // the shared offset: the profile's list is its own — the feed's stays where it was, and so does the thread's under it
  const s = fresh();
  s.openProfile();
  s.wheel(3);
  s.settle(40);
  check("the profile's offset moved its own clip only", [s.feedOffset(), -s.offset() > 10], [0, true]);
  console.log(
    `solid/profile.test.ts: the mutations: the author's row alone, the media tab at ${q.offset()} with 13 cards, ` +
      `the feed still at ${s.feedOffset()}`,
  );
}

dispose();
if (failed) process.exit(1);
console.log(
  "solid/profile.test.ts: the app's recorded profile as the page's third screen — a card's author opens it (the name and " +
    "handle row, the app's own link), the disc, name, handle, bio and counts, the app's three tabs and their three " +
    "fixtures' cards, the list's own scroll and thumb, a tab switch back to the top, back / Escape / a tab to the feed's " +
    "byte-identical frame, a profile from a thread back to that thread, the entry and reduced motion, the a11y tree, the " +
    "stored frames, and the mutations",
);
process.exit(0);
