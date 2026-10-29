// The Sky page's third screen: a post card's author opens the profile the card names. The app's own affordance is the
// author's name — apps/csssky/src/post/Post.tsx makes the name (with the handle) an `<a href="/profile/handle">` — so
// here the card's name-and-handle row is the press; the avatar and the rest of the card still open the post's thread.
//
// The screen is built like the thread's (app/Sky.tsx's second screen, whose styles it reuses through `styles`): a root
// float over the content area under the same bar, its own 44px header with the back control and the word "Profile", and a
// list on the page's own scroll machine (src/vscroll.ts, a fresh instance per tab, so **the offset is reset to the top
// when the tab changes**: the header and the tablist stay put, the list scrolls under them). The history is one deep: a
// profile opened from a card returns to the feed, one opened from a thread's card returns to that thread, which stays
// declared under this screen at its own offset and rows.
//
// The header is the recording's (apps/csssky/test/fixtures/profile-head.json through `profile.ts`'s `profileOf`): the
// avatar disc (the recording's author has no committed PNG, so it is drawn, not an image), the display name, `@handle`,
// the bio wrapped, and the three counts in the app's words. The tabs are the app's (Posts, Replies, Media), a headless
// tablist as the bar's is (roving focus, arrows switch, the 2px underline), and each holds its fixture's posts as the
// feed's cards. No fetching: `profile.ts` reads the app's recorded answers once, on the first opening.
import * as css from "cssints/clay" with { type: "cssints" };
import { createSignal, For, Show } from "solid-js";

import { a11y } from "../a11y.ts";
import { createButton, createTabs } from "../../headless/src/index.ts";
import { effect, presence, spatial, track } from "../src/motion.ts";
import { scroll, type Scroll } from "../src/vscroll.ts";
import { ui } from "../src/ffi.ts";
import type { FocusPart, Input } from "../src/input.ts";
import { FIELDS } from "../src/pack.ts";
import { profileOf, PROFILE_TABS, type ProfileData } from "./profile.ts";
import type { AppBskyFeedDefs } from "@atcute/bluesky";
import type { Post } from "./Sky.tsx";

/** The page's own style bundle (`app/Sky.tsx`'s `s`): the thread's floats, header, cards, tabs and back control. */
type Styles = typeof import("./Sky.tsx").s;

// The ids: the screen (the float and the a11y region), its header, the back control, its tablist, the clip element the
// list scrolls (the feed's machine, a third instance) and its thumb. The tabs' own ids are the tablist's plus `-tab-<i>`.
const REGION = "sky-profile";
const HEAD = "sky-profile-head";
const BACK = "sky-profile-back";
const TABLIST = "sky-profile-tabs";
const VIEW = "sky-profile-view";
const BAR = "sky-profile-thumb";
/** The clip's padding and the gap between cards: the styles' 12 and 8, and the list's content measurement. */
const PAD = 12;
/** The screen's entry: the page's card entry's tracks (12px low, 0 opacity, 0.3s), the whole screen at once. */
const ENTRY_TIME = 0.3;
const ENTRY_Y = 12;

// The screen's own colours: the page's palette, from `Sky.tsx`'s tokens? A token set is named by its paths, and a second
// `createTokens` would claim the same names, so this module's is prefixed (`--profile-color-ink`) and carries the sky
// palette's dark values and its light theme beside it. The cards, the tabs and the header row are the page's styles
// (`styles`), so this is only what the profile adds: the disc, the header's type, the tabs' row and its thumb.
const t = css.createTokens(
  {
    color: {
      $type: "color",
      page: { $value: "rgb(16 19 22)" },
      panel: { $value: "rgb(27 32 38)" },
      hover: { $value: "rgb(34 40 49)" },
      ink: { $value: "rgb(230 233 236)" },
      muted: { $value: "rgb(139 152 165)" },
    },
  },
  (path) => `profile-${(path as string[]).join("-")}`,
);
css.createGlobalTheme(t, "light", {
  color: {
    page: "rgb(243 245 247)",
    panel: "rgb(255 255 255)",
    hover: "rgb(232 238 244)",
    ink: "rgb(15 20 25)",
    muted: "rgb(86 99 111)",
  },
});
const font = css.fonts("Roboto");

// the drawn avatar: a 56px disc on the panel tone (the app's fallback tile when there is no avatar to show)
const disc = css.cn(css.width(56), css.height(56), css.borderRadius(28), css.bg(t.color.panel), css.border(1, t.color.hover));
// the header: the disc beside the name and handle, then the bio and the counts, the page under it
const header = css.cn(css.width("stretch"), css.p(6, 16, 10), css.gap(8), css.flexDirection("column"), css.bg(t.color.page));
const identRow = css.cn(css.width("stretch"), css.alignItems("center"), css.gap(12));
const ident = css.cn(css.flexDirection("column"), css.gap(2));
const name = css.cn(font.Roboto, css.color(t.color.ink), css.fontSize(20), css.lineHeight(26));
const handle = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(14), css.lineHeight(18));
const bioBox = css.cn(css.width("stretch"));
const bio = css.cn(font.Roboto, css.color(t.color.ink), css.fontSize(14), css.lineHeight(20), css.whiteSpace("normal"));
const counts = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(13), css.lineHeight(18));
// the tabs' row, the bar's tab styles inside it (the headless tablist the page copies: roving focus, arrows, the underline)
const tablist = css.cn(css.width("stretch"), css.p(0, 16, 6), css.gap(2), css.alignItems("center"), css.bg(t.color.page));
// the list's thumb: 4px at the clip's inner right edge, as the feed's and the thread's, a float on this clip
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
    capture: false,
  }),
);

export interface ProfileScreen {
  /** A card's author was pressed: the screen opens over whatever is under it — the feed, or the thread whose card was
   *  pressed — and back leaves that screen as it was (the history is one deep: the page keeps it declared). */
  open(): void;
  /** Back: the open state falls; the screen's node leaves when its 0.3s exit is over (`presence`). */
  close(): void;
  isOpen(): boolean;
  shown(): boolean;
  /** One frame: the screen's entry/exit, the list's content and its scroll, as the page's tick. */
  tick(dt: number): void;
  wheel(dx: number, dy: number): void;
  pointer(x: number, y: number, down: boolean, touch?: boolean): void;
  /** The screen's element (a `Show` over the presence's answer): declared after the thread's, so it floats above it. */
  screen: () => unknown;
}

/**
 * The profile screen's state, its motion and its element. The parts (the back control, the tablist, the clip) are made
 * once, here, and registered in the focus manager **disabled**; an opening enables them and focuses the back control, a
 * close blurs and disables them at once — the exit's 0.3s still draws the screen, but it is no longer anybody's stop, as
 * the thread's back is not while it leaves. `postOf`, `ago` and `num` are the page's (`Sky.tsx`), so a list's cards and
 * the feed's are one card.
 */
export function createProfile(props: {
  input: Input;
  styles: Styles;
  postOf: (p: AppBskyFeedDefs.PostView) => Post;
  ago: (created: number) => string;
  num: (v: number) => string;
}) {
  const { input, styles } = props;
  const [open, setOpen] = createSignal(false);
  const [shown, setShown] = createSignal(false);
  const [tab, setTabSignal] = createSignal(0);
  const [regionFocused, setRegionFocused] = createSignal(false);
  // the recording, read once: the first opening loads it (a few ms), and the screen's first frame has it
  let data: ProfileData | undefined;
  const loaded = () => (data ??= profileOf(props.postOf));

  const regionId = Buffer.from(REGION);
  const viewId = Buffer.from(VIEW);
  const barId = Buffer.from(BAR);
  // the list's real content from the last layout (the last card's bottom plus the clip's 12px padding), and its machine
  let content = 0;
  const view = () => ui.bounds(viewId)?.[3] ?? 0;
  const max = () => Math.max(0, content - view());
  let list: Scroll = scroll(VIEW, max, BAR);

  /** The list starts at its top: a fresh machine for the tab, and Clay's offset written to 0 at once — the frame that
   *  draws the new list draws it at the top, with no frame at the old tab's offset. */
  const reset = (i: number) => {
    setTabSignal(i);
    content = 0;
    ui.scrollTo(VIEW, 0);
    list = scroll(VIEW, max, BAR);
  };
  /** The tab changed: the list is another one, so it starts at its top. */
  const setTab = (i: number) => {
    if (i !== tab()) reset(i);
  };
  const backButton = createButton({ id: BACK, onClick: () => close() });
  const backBind = input.bind(backButton.part);
  // the back control's stop is made before the tablist's, so the screen's order is the back, the tablist, the clip (a
  // `bind` only fills the parts map; the order is the focus manager's registration)
  input.focus.register(backButton.part.id, { disabled: true });
  // the tabs are controlled by this screen's signal: a click, an arrow or Home/End a request, and the list follows it.
  // Created after the back control, so the screen's stops are the page's order: the back, the tablist, the clip.
  const tabs = createTabs({
    id: TABLIST,
    items: PROFILE_TABS.length,
    focus: input.focus,
    focusablePanels: PROFILE_TABS.map((_tab, i) => i),
    defaultSelected: 0,
    onValueChange: (i) => setTab(i),
  });
  const tabBinds = tabs.tabs.map((part) => input.bind(part));
  const regionPart: FocusPart & { readonly disabled: boolean } = {
    id: VIEW,
    disabled: false,
    get focused() {
      return regionFocused();
    },
    focus: () => setRegionFocused(true),
    blur: () => setRegionFocused(false),
    keyDown: (key) => {
      if (key === "Escape") return close(), true;
      const page = view();
      const step = key === "ArrowDown" ? 40 : key === "ArrowUp" ? -40 : key === "PageDown" ? page : key === "PageUp" ? -page : 0;
      if (!step && key !== "Home" && key !== "End") return false;
      list.seek(key === "Home" ? 0 : key === "End" ? max() : list.target() + step);
      return true;
    },
    keyUp: () => false,
  };
  const regionBind = input.bind(regionPart);
  // the stops exist from the page's setup (after the feed's, so their order is the page's), disabled until the screen is
  // open: a Tab on the feed never lands on a screen that is not there. The tabs are re-registered in their own group (an
  // entry registered without one would leave it, and the arrows with it).
  const GROUP = `${TABLIST}-tablist`;
  const stops = (on: boolean) => {
    for (const part of tabs.tabs) input.focus.register(part.id, { group: GROUP, disabled: !on });
    input.focus.register(backButton.part.id, { disabled: !on });
    input.focus.register(VIEW, { disabled: !on });
  };
  stops(false);

  // the group's motion: 12px low and transparent on the way in, the same reversed on the way out under `presence`
  const fx = {
    present: presence(false, ENTRY_TIME),
    mounted: false,
    open: false,
    y: track(0, spatial(ENTRY_TIME)),
    a: track(255, effect(ENTRY_TIME)),
  };
  let clock = 0;

  const openAt = () => {
    if (open()) return;
    loaded();
    // a profile always opens on its first tab, at its top (the tabs are created once, so their selection is put back too)
    reset(0);
    tabs.select(0);
    stops(true);
    setOpen(true);
    input.focus.focus(backButton.part.id);
  };
  const close = () => {
    if (!open()) return;
    setOpen(false);
    // the focus leaves with the screen, as the thread's does on its falling edge; the node stays for the exit
    input.focus.blur();
    stops(false);
  };

  const wheel = (dx: number, dy: number) => {
    if (!open()) return;
    if (ui.over(viewId) || ui.over(barId)) list.wheel(dx, dy);
  };
  const pointer = (x: number, y: number, down: boolean, touch?: boolean) => {
    if (open()) list.pointer(x, y, down, touch);
  };

  const posts = () => loaded().tabs[tab()]?.posts ?? [];

  // what the screen draws this frame (the loaded recording's head and the active tab's cards); the region is named by the
  // head's handle, as the thread's is by its post's author
  const body = () => (
    <box
      id={REGION}
      role="region"
      label={`Profile — @${loaded().head.handle}`}
      style={styles.thread}
    >
      <box id={HEAD} style={styles.head}>
        <box {...backBind} {...a11y(backButton.part)} label="Back" style={styles.back}>
          <text style={styles.backText}>Back</text>
        </box>
        <text style={styles.threadTitle}>Profile</text>
      </box>
      <box style={header}>
        <box style={identRow}>
          <box id="sky-profile-avatar" style={disc} />
          <box style={ident}>
            <text style={name}>{loaded().head.name}</text>
            <text style={handle}>{`@${loaded().head.handle}`}</text>
          </box>
        </box>
        <box style={bioBox}>
          <text style={bio}>{loaded().head.bio}</text>
        </box>
        <text style={counts}>
          {`${loaded().head.followers} followers · ${loaded().head.following} following · ${loaded().head.posts} posts`}
        </text>
      </box>
      <box {...a11y(tabs.tablist)} style={tablist}>
        {tabs.tabs.map((part, i) => (
          <box {...tabBinds[i]!} {...a11y(part)} style={part.selected ? styles.tabOn : styles.tab}>
            <text style={part.selected ? styles.tabTextOn : styles.tabText}>{PROFILE_TABS[i]!.label}</text>
          </box>
        ))}
      </box>
      {/* the list: one clip element on the page's own machine, the cards as the feed's (no window: a recorded feed is a
          dozen posts, so all of them are declared and the machine scrolls them) */}
      <box {...regionBind} onPress={() => (regionBind.onPress(), list.press())} style={styles.threadView}>
        <For each={posts()}>
          {(post, i) => (
            <box
              id={`sky-profile-card-${i()}`}
              role="article"
              label={post.name || post.handle}
              style={styles.card}
            >
              <box style={styles.nameLine}>
                <text style={styles.name}>{post.name || post.handle}</text>
                <text style={styles.meta}>
                  {post.name ? `@${post.handle} · ${props.ago(post.created)}` : props.ago(post.created)}
                </text>
              </box>
              {post.text ? (
                <box style={styles.bodyBox}>
                  <text style={styles.body}>{post.text}</text>
                </box>
              ) : null}
              {post.media ? <text style={styles.media}>{post.media}</text> : null}
              <text style={styles.counts}>
                {`${props.num(post.replies)} replies · ${props.num(post.reposts)} reposts · ${props.num(post.likes)} likes`}
              </text>
            </box>
          )}
        </For>
      </box>
      <box id={BAR} style={thumb} onPress={() => list.thumb()} />
    </box>
  );

  const tick = (dt: number) => {
    clock += dt;
    const at = clock;
    const on = open();
    const wasMounted = fx.mounted;
    const { mounted, closing } = fx.present.update(on, dt);
    if (mounted !== fx.mounted) setShown(mounted);
    fx.mounted = mounted;
    if (mounted) {
      if (!wasMounted) {
        fx.y = track(ENTRY_Y, spatial(ENTRY_TIME), at);
        fx.a = track(0, effect(ENTRY_TIME), at);
        fx.y.retarget(at, 0);
        fx.a.retarget(at, 255);
      } else if (on !== fx.open) {
        fx.y.retarget(at, on ? 0 : ENTRY_Y);
        fx.a.retarget(at, on ? 255 : 0);
      }
      const y = fx.y.at(at),
        a = fx.a.at(at);
      if (!y.done) ui.value(regionId, FIELDS.TRANSLATE_Y, y.x);
      if (!a.done) ui.value(regionId, FIELDS.ALPHA, a.x);
      if (closing) ui.value(regionId, FIELDS.CAPTURE, 1);
      // the list's content from the last frame's layout: the last card's bottom (the clip's offset added back) and the
      // 12px padding below it; then the machine, whose thumb is this screen's float
      const n = posts().length;
      const box = ui.bounds(viewId);
      const last = n ? ui.bounds(Buffer.from(`sky-profile-card-${n - 1}`)) : undefined;
      if (box && last) content = Math.max(0, last[1] + last[3] - box[1] - ui.scrollOffset(VIEW) + PAD);
      list.tick(dt);
    }
    fx.open = on;
  };

  return {
    open: openAt,
    close,
    isOpen: open,
    shown,
    tick,
    wheel,
    pointer,
    screen: () => <Show when={shown()}>{body()}</Show>,
  };
}
