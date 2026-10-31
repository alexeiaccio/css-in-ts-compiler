// The Sky page's fourth screen: **the notifications**, opened with `n` on the feed (the app's nav has no notifications
// item and its bar is the three feed tabs, so the key is the page's, as the C shell's `n` is) and closed with Escape, the
// back control, or a feed tab. It is built as the thread's and the profile's are — a root float over the content area
// under the same bar, a 44px header with the Back control and the word "Notifications", a clip element of one card a
// notification on the page's own scroll machine (src/vscroll.ts, a fresh instance), and the page's card entry as one
// group (12px low, 0 opacity, 0.3s, reversed on the way out with `presence`).
//
// The rows are the app's five kinds over the app's own recordings (`notify.ts`: who, what and when from
// apps/csssky/test/fixtures; the verbs are the app's words, the one thing no fixture has) — the screen the C shell
// hand-carries in terminal/notify.c, now the page's own. A card is the feed's card (`s.card`): the actor with the verb
// on one line, the time after it on the same line, and the post's first line under them (a follow has none). The C
// page's kind glyphs (✦ ⟲ ♥ ↩) are not here: Roboto carries none of them, and a cell prints them only because the
// terminal's own font does. The focused row wears `s.cardOn` — the next panel tone and the accent border, which is the C page's ring.
//
// The focus is `src/input.ts`'s: the back control, then the rows in document order (`input.add`, so the Tab order is the
// list's), a row's `:focus` state through the `focused` prop its bind carries. A row is a stop of its own; the arrows,
// j/k, Home and End rove between them without leaving the list, as the C page's do, and Tab past the last row wraps to
// the first (`wrap`, the page's fallback: the manager releases the focus past the end, and a terminal has nowhere to hand
// Tab to). Enter or Space on a row opens its post's thread — the page's own `openThread`, with the same `load` the feed
// uses, so the recorded thread is the terminal's and a promise in a test; a follow has no post, so Enter opens nothing.
// The wheel scrolls the clip; five rows fit the 696px the bar leaves, so its offset stays at its top — a longer list
// would be the machine's and the rows would need the C page's `scroll_into`.
import * as css from "cssints/clay" with { type: "cssints" };
import { createSignal, For, Show } from "solid-js";

import { a11y } from "../a11y.ts";
import { createButton } from "../../headless/src/index.ts";
import { effect, presence, spatial, track } from "../src/motion.ts";
import { scroll, type Scroll } from "../src/vscroll.ts";
import { ui } from "../src/ffi.ts";
import type { Bind, FocusPart, Input } from "../src/input.ts";
import { FIELDS } from "../src/pack.ts";
import { notificationsOf, type NotificationRow } from "./notify.ts";
import { font, t } from "./Sky.styles.ts";
import type { AppBskyFeedDefs } from "@atcute/bluesky";
import type { Post } from "./Sky.tsx";

/** The page's own style bundle (`app/Sky.tsx`'s `s`): the thread's float, header, cards and back control. */
type Styles = typeof import("./Sky.tsx").s;

// The ids: the screen (the float and the a11y region), its header, the back control, the clip element the list scrolls
// (the feed's machine, a fourth instance) and its thumb. A row's id is `sky-notify-card-<i>`, which the terminal host
// re-cuts as a card.
const REGION = "sky-notify";
const HEAD = "sky-notify-head";
const BACK = "sky-notify-back";
const VIEW = "sky-notify-view";
const BAR = "sky-notify-thumb";
const ROW = (i: number) => `sky-notify-card-${i}`;
/** The clip's padding and the gap between cards: the styles' 12 and 8, and the list's content measurement. */
const PAD = 12;
/** The screen's entry: the page's card entry's tracks (12px low, 0 opacity, 0.3s), the whole screen at once. */
const ENTRY_TIME = 0.3;
const ENTRY_Y = 12;

// The row's two lines over the page's card: the actor and the verb, then the time on the same line, and the post's
// first line under them. They are in this file and built from the shared palette (`Sky.styles.ts`'s tokens and
// font) because they are the screen's own two lines — the card, the header, the back control and the title are the
// page's (`styles`), as the thread's and the profile's are.
const line = css.cn(css.width("stretch"), css.flexDirection("row"), css.alignItems("center"), css.gap(6));
const snippet = css.cn(font.Roboto, css.color(t.color.muted), css.fontSize(14), css.lineHeight(20), css.whiteSpace("normal"));
// the list's thumb: 4px at the clip's inner right edge, a float on this screen's own clip (the thread's thumb floats on
// the thread's), rounded, the muted token — the page's other two scrollbars' look
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

export interface NotifyScreen {
  /** `n` on the feed, or the host's `notify` entry: the screen opens over the feed. */
  open(): void;
  /** Back, Escape or a feed tab: the open state falls; the node leaves when its 0.3s exit is over (`presence`). */
  close(): void;
  isOpen(): boolean;
  shown(): boolean;
  /** One frame: the screen's entry/exit, the list's content and its scroll. */
  tick(dt: number): void;
  /** The rows' Tab stops are the screen's while it is up (the feed's and a thread's under it are the page's). */
  enable(on: boolean): void;
  /** Back from a notification's thread: the row that opened it has the focus again. */
  refocus(): void;
  /** Tab past the last row wraps to the first (the manager released the focus there; the terminal has no platform for it). */
  wrap(): boolean;
  wheel(dx: number, dy: number): void;
  pointer(x: number, y: number, down: boolean, touch?: boolean): void;
  /** The screen's element (a `Show` over the presence's answer), declared before the thread's so a thread draws over it. */
  screen: () => unknown;
}

/**
 * The notifications screen's state, its data, its motion and its element. The back control and the rows are stops
 * registered **disabled** until the screen is opened (then `stops(true)`), so a Tab on the feed never lands on a screen
 * that is not there; a close blurs and disables them at once, while the exit's 0.3s still draws the node. `openPost` is
 * the page's `openThread`, so a row's post is the thread the feed would open; `mutate` is the terminal host's
 * deliberately broken run (`--mutate verbs`: the same verb on every row; `rows`: the rows are not Tab stops).
 */
export function createNotify(props: {
  input: Input;
  styles: Styles;
  postOf: (p: AppBskyFeedDefs.PostView) => Post;
  ago: (created: number) => string;
  openPost: (uri: string) => void;
  /** A screen is over this one (a notification's thread, the profile, the settings): its node leaves the a11y tree. */
  covered: () => boolean;
  mutate?: string;
}): NotifyScreen {
  const { input, styles } = props;
  // The open state twice: a plain flag for everything that must be true **now** (a key, a press, the page's cover — the
  // page's tick runs before the flush, so a signal still reads the value it committed last), and the signal the tree and
  // the presence follow.
  let up = false;
  const [open, setOpen] = createSignal(false);
  const [shown, setShown] = createSignal(false);
  // the row with the focus, or -1; and the row the focus last left, so a thread's back lands where it was and Tab wraps
  const [rowFocused, setRowFocused] = createSignal(-1);
  // ... and the same pair in plain variables: the page's tick and a key read before the flush see the row that has the
  // focus now, not the one the signal committed last
  let lastRow = 0;
  let at = -1;
  // the recording's rows, mapped once on the first opening: the three answers are the page's build's (JSON modules), so
  // what the opening costs is the five mappings, and the screen's first frame has the rows
  let data: readonly NotificationRow[] | undefined;
  const loaded = (): readonly NotificationRow[] => (data ??= notificationsOf(props.postOf));
  // the rows' parts and their box props, made on the first opening (their ids are the data's indices)
  const parts: (FocusPart & { readonly disabled: boolean })[] = [];
  const binds: Bind[] = [];

  const regionId = Buffer.from(REGION);
  const viewId = Buffer.from(VIEW);
  const barId = Buffer.from(BAR);
  // the list's real content from the last layout (the last card's bottom plus the clip's 12px padding), and its machine
  let content = 0;
  const view = () => ui.bounds(viewId)?.[3] ?? 0;
  const max = () => Math.max(0, content - view());
  let list: Scroll = scroll(VIEW, max, BAR);

  // the back control is a headless button (role, Enter and Space, the pointer); Escape is the page's fallback as well
  const back = createButton({ id: BACK, onClick: () => close() });
  const backBind = input.bind(back.part);
  input.focus.register(BACK, { disabled: true });

  /** A row: one Tab stop, and the list's roving row (the arrows, j/k and Home/End move the focus and nothing else). */
  const rowPart = (i: number): FocusPart & { readonly disabled: boolean } => ({
    id: ROW(i),
    disabled: false,
    get focused() {
      return rowFocused() === i;
    },
    focus: () => ((lastRow = i), (at = i), setRowFocused(i)),
    blur: () => ((at = -1), setRowFocused(-1)),
    press: () => openRow(i),
    keyDown: (key) => {
      if (key === "Escape" || key === "Backspace" || key === "h") return close(), true;
      if (key === "Enter" || key === " " || key === "Space") return openRow(i), true;
      const n = loaded().length;
      if (key === "Home") return input.focus.focus(ROW(0)), true;
      if (key === "End") return input.focus.focus(ROW(n - 1)), true;
      const step = key === "ArrowDown" || key === "j" ? 1 : key === "ArrowUp" || key === "k" ? -1 : 0;
      if (step) {
        const j = Math.min(n - 1, Math.max(0, i + step));
        if (j !== i) input.focus.focus(ROW(j));
        return true;
      }
      return false;
    },
    keyUp: () => false,
  });

  /** The rows' parts, on the first opening: the data's length is the list's, so the stops are made with it. Nothing is
   *  made under the host's `--mutate rows`: the rows are drawn and no Tab stop exists, which is the break the test's Tab
   *  check has to catch. */
  const ensure = () => {
    if (parts.length || props.mutate === "rows") return;
    for (let i = 0; i < loaded().length; i++) parts.push(rowPart(i));
    for (const part of parts) binds.push(input.add(part));
  };
  // the stops exist from the page's setup for the back control, and from the first opening for the rows; disabled until
  // the screen is open, and disabled again while a thread is over it
  let stopsOn = false;
  const stops = (on: boolean) => {
    if (on === stopsOn) return;
    stopsOn = on;
    input.focus.register(BACK, { disabled: !on });
    for (const part of parts) input.focus.register(part.id, { disabled: !on });
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

  /** A row's own press (Enter, Space or a click): its post's thread, through the page's loader; a follow opens nothing. */
  function openRow(i: number): void {
    const row = loaded()[i];
    if (!row?.uri) return;
    lastRow = i;
    at = i;
    setRowFocused(i);
    props.openPost(row.uri);
  }

  const openScreen = () => {
    if (up) return;
    ensure();
    up = true;
    setOpen(true);
    stops(true);
    // the first row has the ring on opening, as the C page's list does (the back control is one Shift+Tab away)
    input.focus.focus(ROW(0));
  };
  const close = () => {
    if (!up) return;
    up = false;
    setOpen(false);
    // the focus leaves with the screen, as the thread's does on its falling edge; the node stays for the exit
    input.focus.blur();
    stops(false);
  };

  const wheel = (dx: number, dy: number) => {
    if (!up) return;
    if (ui.over(viewId) || ui.over(barId)) list.wheel(dx, dy);
  };
  const pointer = (x: number, y: number, down: boolean, touch?: boolean) => {
    if (up) list.pointer(x, y, down, touch);
  };

  // the kind's words: the app's five, or — the terminal host's `--mutate verbs` — one wrong verb on every row, so the
  // stored dump and the test's rows both fail
  const verbOf = (row: NotificationRow) => (props.mutate === "verbs" ? "liked your post" : row.verb);

  // what the screen draws this frame: the recording's five rows; the region's name is the screen's own
  const body = () => (
    <box id={REGION} role="region" label="Notifications" hidden={props.covered()} style={styles.thread}>
      <box id={HEAD} style={styles.head}>
        <box {...backBind} {...a11y(back.part)} label="Back" style={styles.back}>
          <text style={styles.backText}>Back</text>
        </box>
        <text style={styles.threadTitle}>Notifications</text>
      </box>
      {/* the list: one clip element on the page's own machine, the cards as the feed's */}
      <box id={VIEW} onPress={() => list.press()} style={styles.threadView}>
        <For each={loaded()}>
          {(row, i) => (
            <box
              id={ROW(i())}
              role="article"
              label={`${row.actor} ${row.verb}`}
              {...binds[i()]!}
              style={rowFocused() === i() ? styles.cardOn : styles.card}
            >
              <box style={line}>
                <text style={styles.name}>{`${row.actor} ${verbOf(row)}`}</text>
                <text style={styles.meta}>{`· ${props.ago(row.created)}`}</text>
              </box>
              {row.snippet ? (
                <box style={styles.bodyBox}>
                  <text style={snippet}>{row.snippet}</text>
                </box>
              ) : null}
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
      const n = loaded().length;
      const box = ui.bounds(viewId);
      const last = n ? ui.bounds(Buffer.from(ROW(n - 1))) : undefined;
      if (box && last) content = Math.max(0, last[1] + last[3] - box[1] - ui.scrollOffset(VIEW) + PAD);
      list.tick(dt);
    }
    fx.open = on;
  };

  return {
    open: openScreen,
    close,
    isOpen: () => up,
    shown,
    tick,
    enable: stops,
    refocus: () => input.focus.focus(ROW(lastRow)),
    wrap: () => (up && at === -1 && lastRow === loaded().length - 1 ? input.focus.focus(ROW(0)) : false),
    wheel,
    pointer,
    screen: () => <Show when={shown()}>{body()}</Show>,
  };
}
