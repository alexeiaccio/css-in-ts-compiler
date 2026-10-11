// sky's home feed and thread on @bomb.sh/tty, styled by apps/csssky-tui's styles.ts through @cssints/tui/bomb: the same styles
// and models as the OpenTUI app (sky's api.ts, post and thread models, sky-tui's rows), drawn as a frame of ops. It does no
// I/O: bytes in (`input`), bytes out (`write`), as in a terminal; the page wires them to ghostty-web (host.ts).
// Keys: j/k or the arrows move the selection, tab and shift-tab (or 1-3) switch the feed, enter opens a post, esc goes back.
// The mouse: the row and the tab under the pointer are highlighted, a click opens or selects.
import {
  alternateBuffer,
  close,
  createInput,
  createTerm,
  cursor,
  mouseTracking,
  open,
  type Op,
  percent,
  settings,
} from "@bomb.sh/tty";
import type { AppBskyFeedDefs } from "@atcute/bluesky";
import {
  createTracker,
  followSystemTheme,
  onTheme,
  openProps,
  resolve,
  type OpenProps,
} from "@cssints/tui/bomb";
import type { TuiShape } from "@cssints/tui";

import { homeScreen, postVerdict, threadScreen } from "../../../csssky/src/api.ts";
import { FEEDS } from "../../../csssky/src/home/feeds.ts";
import {
  ago,
  count,
  embedParts,
  fullTime,
  quoteMedia,
  recordOf,
  stats,
} from "../../../csssky/src/post/model.ts";
import { goneQuote, mediaText, type Row, rowsOf } from "../../../csssky-tui/src/model.ts";
import * as s from "../../../csssky-tui/src/styles.ts";
import { system } from "../../../csssky-tui/src/system.ts";

type PostView = AppBskyFeedDefs.PostView;
type Layout = NonNullable<OpenProps["layout"]>;

interface Feed {
  items: AppBskyFeedDefs.FeedViewPost[];
  loading: boolean;
  error: string;
  selected: number;
  top: number;
}
interface Thread {
  rows: Row[];
  loading: boolean;
  error: string;
  selected: number;
  top: number;
}

export interface Screen {
  /** Bytes from the terminal: keys, the mouse, the replies to the colour queries. */
  input(bytes: Uint8Array): void;
  resize(cols: number, rows: number): void;
  stop(): void;
}

const clamp = (i: number, n: number) => Math.max(0, Math.min(i, n - 1));
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Starts the screen: the terminal settings (alternate screen, no cursor, mouse tracking), the system theme's queries,
 * then the first frame.
 *
 * @param {object} io `write` (the bytes to the terminal), and its size in cells
 * @returns {Promise<Screen>} the screen
 */
export async function startSky(io: {
  write: (bytes: Uint8Array | string) => void;
  cols: number;
  rows: number;
}): Promise<Screen> {
  const term = await createTerm({ width: io.cols, height: io.rows });
  const keys = await createInput();
  const ui = createTracker();
  const tty = settings(alternateBuffer(), cursor(false), mouseTracking());
  io.write(tty.apply);
  const theme = followSystemTheme(system, { write: io.write, colorfgbg: "" });

  const feeds: Feed[] = FEEDS.map(() => ({
    items: [],
    loading: false,
    error: "",
    selected: 0,
    top: 0,
  }));
  let active = 0;
  const stack: Thread[] = [];
  let pointer = { x: -1, y: -1, down: false };

  const view = () => stack.at(-1) ?? feeds[active]!;
  const rowCount = () => {
    const t = stack.at(-1);
    return t ? t.rows.length : feeds[active]!.items.length;
  };

  // ---- the frame
  // `open` with the layout of the style and `layout` laid over it (a style has no width for a row of a list)
  const box = (id: string, style: TuiShape, layout: Layout = {}, more: OpenProps = {}) =>
    ui.open(id, style, {
      ...more,
      layout: { ...openProps(resolve(style, ui.state(id))).layout, ...layout },
    });
  // a row is as wide as the list: `grow` would take the width of its widest word (a long URL) when that is wider. Only a
  // line that does not wrap clips: Clay lays out what a horizontal clip holds at any width, so its text would not wrap.
  const wide = { width: percent(1) };
  const clipX = { clip: { horizontal: true } };
  const line = (id: string, parts: [string, TuiShape][]) => [
    open(id, { layout: { ...wide, direction: "ltr" }, ...clipX }),
    ...parts.map(([t, style]) => ui.text(t, style, undefined, { wrap: 2 })),
    close(),
  ];

  const quote = (id: string, p: PostView): Op[] => {
    const q = embedParts(p).quote;
    if (!q) return [];
    const ops: Op[] = [box(`${id}-quote`, s.quote, wide)];
    if (q.kind === "post") {
      const r = recordOf(q.post);
      ops.push(
        ...line(`${id}-quote-head`, [
          [q.post.author.displayName || q.post.author.handle, s.name],
          [` @${q.post.author.handle} · ${ago(r.createdAt ?? q.post.indexedAt)}`, s.meta],
        ]),
      );
      if (r.text) ops.push(ui.text(r.text, s.body));
      const m = quoteMedia(q.post);
      if (m) ops.push(ui.text(mediaText(m), s.muted));
    } else ops.push(ui.text(q.kind === "hidden" ? goneQuote.hidden : goneQuote[q.why], s.muted));
    ops.push(close());
    return ops;
  };

  const card = (id: string, p: PostView, focus: boolean, reason?: string): Op[] => {
    const r = recordOf(p);
    const ops: Op[] = [box(id, s.card, wide)];
    if (reason) ops.push(ui.text(reason, s.muted));
    ops.push(
      ...line(`${id}-head`, [
        [p.author.displayName || p.author.handle, s.name],
        [` @${p.author.handle}${focus ? "" : ` · ${ago(r.createdAt ?? p.indexedAt)}`}`, s.meta],
      ]),
    );
    if (postVerdict(p) === "warn") ops.push(ui.text("[content warning]", s.muted));
    else {
      if (r.text) ops.push(ui.text(r.text, s.body));
      const m = embedParts(p).media;
      if (m) ops.push(ui.text(mediaText(m), s.muted));
      ops.push(...quote(id, p));
    }
    if (focus) {
      ops.push(ui.text(fullTime(r.createdAt ?? p.indexedAt), s.muted));
      ops.push(
        ...line(
          `${id}-stats`,
          stats(p).flatMap((x): [string, TuiShape][] => [
            [x.n, s.name],
            [` ${x.label}   `, s.meta],
          ]),
        ),
      );
    } else
      ops.push(
        ui.text(
          `↩ ${count(p.replyCount) || 0}   ⟲ ${count(p.repostCount) || 0}   ♥ ${count(p.likeCount) || 0}`,
          s.muted,
        ),
      );
    ops.push(close());
    return ops;
  };
  const note = (id: string, text: string, opens: boolean) => [
    box(id, opens ? s.card : s.row, wide),
    ui.text(text, s.muted),
    close(),
  ];
  const indent = (id: string, depth: number, ops: Op[]) =>
    depth
      ? [
          open(`${id}-in`, { layout: { ...wide, padding: { left: Math.min(depth, 6) * 2 } } }),
          ...ops,
          close(),
        ]
      : ops;

  const rows = (): Op[] => {
    const t = stack.at(-1);
    if (t) {
      if (t.loading) return note("loading", "Loading…", false);
      if (t.error) return note("error", `Could not load the thread: ${t.error}`, false);
      return t.rows.slice(t.top).flatMap((r, k) => {
        const id = `row-${t.top + k}`;
        return indent(
          id,
          r.depth,
          r.kind === "post" ? card(id, r.post, !!r.focus) : note(id, r.text, !!r.open),
        );
      });
    }
    const f = feeds[active]!;
    if (f.error) return note("error", `Could not load the feed: ${f.error}`, false);
    if (f.loading && !f.items.length) return note("loading", "Loading…", false);
    if (!f.items.length) return note("empty", "Nothing here yet", false);
    return f.items.slice(f.top).flatMap((item, k) => {
      const reason =
        item.reason?.$type === "app.bsky.feed.defs#reasonRepost"
          ? `⟲ reposted by ${item.reason.by.displayName || item.reason.by.handle}`
          : undefined;
      return card(`row-${f.top + k}`, item.post, false, reason);
    });
  };

  const build = (): Op[] => [
    box("screen", s.screen),
    box("bar", s.bar, wide),
    ui.text("sky", s.title),
    ...(stack.length
      ? [ui.text(" · Thread (esc: back)", s.meta)]
      : FEEDS.flatMap((f, i) => {
          const style = i === active ? s.tabActive : s.tab;
          return [
            ui.open(`tab-${i}`, style),
            ui.text(` ${i + 1} ${f.name} `, style, `tab-${i}`),
            close(),
          ];
        })),
    close(),
    box(
      "list",
      s.list,
      { direction: "ttb", gap: 0 },
      { clip: { horizontal: true, vertical: true } },
    ),
    ...rows(),
    close(),
    box("footer", s.footer, wide),
    ui.text(
      "j/k move · enter open · tab feed · esc back · mouse: hover, click",
      s.footer,
      undefined,
      {
        wrap: 2,
      },
    ),
    close(),
    close(),
  ];

  const draw = () => {
    const v = view();
    ui.focus(rowCount() ? `row-${v.selected}` : undefined);
    if (v.selected < v.top) v.top = v.selected;
    let r = ui.render(term, build, { pointer });
    io.write(r.output);
    // keep the selected row in view: scroll a row at a time until its bottom is inside the list
    for (let i = 0; i < 50; i++) {
      const list = r.info.get("list")?.bounds;
      const row = r.info.get(`row-${v.selected}`)?.bounds;
      if (!list || !row || row.y + row.height <= list.y + list.height || v.top >= v.selected) break;
      v.top++;
      r = ui.render(term, build, { pointer });
      io.write(r.output);
    }
    return r;
  };
  const frame = () => {
    const r = draw();
    const click = r.events.find((e) => e.type === "pointerclick");
    if (!click) return;
    const tab = /^tab-(\d+)$/.exec(click.id);
    const row = /^row-(\d+)$/.exec(click.id);
    if (tab) select(Number(tab[1]));
    else if (row) {
      view().selected = Number(row[1]);
      openRow();
    }
  };

  // ---- the state
  const load = async (i: number) => {
    const f = feeds[i]!;
    if (f.loading || f.items.length) return;
    f.loading = true;
    try {
      f.items = (await homeScreen(undefined, FEEDS[i]!.uri)).items;
    } catch (e) {
      f.error = message(e);
    }
    f.loading = false;
    frame();
  };
  const select = (i: number) => {
    active = clamp(i, FEEDS.length);
    void load(active);
    frame();
  };
  const openPost = async (p: PostView) => {
    const t: Thread = { rows: [], loading: true, error: "", selected: 0, top: 0 };
    stack.push(t);
    frame();
    try {
      const x = await threadScreen(p.author.did, p.uri.slice(p.uri.lastIndexOf("/") + 1));
      t.rows = rowsOf(x);
      t.selected = x.parents.length;
    } catch (e) {
      t.error = message(e);
    }
    t.loading = false;
    frame();
  };
  const openRow = () => {
    const t = stack.at(-1);
    if (!t) {
      const item = feeds[active]!.items[feeds[active]!.selected];
      if (item) void openPost(item.post);
      return;
    }
    const r = t.rows[t.selected];
    if (r?.kind === "post" && !r.focus) void openPost(r.post);
    if (r?.kind === "note" && r.open) void openPost(r.open);
  };

  const handle = (events: ReturnType<typeof keys.scan>) => {
    for (const e of events.events) {
      if (e.type === "keydown" || e.type === "keyrepeat") {
        const step =
          e.code === "j" || e.code === "ArrowDown"
            ? 1
            : e.code === "k" || e.code === "ArrowUp"
              ? -1
              : 0;
        if (step && rowCount()) view().selected = clamp(view().selected + step, rowCount());
        else if ((e.code === "Tab" || e.code === "Backtab") && !stack.length)
          select(
            (active + (e.code === "Backtab" || e.shift ? -1 : 1) + FEEDS.length) % FEEDS.length,
          );
        else if (/^[1-9]$/.test(e.code) && !stack.length) select(Number(e.code) - 1);
        else if (e.code === "Enter") openRow();
        else if (e.code === "Escape" || e.code === "Backspace" || e.code === "h") stack.pop();
      } else if (e.type === "mousemove" || e.type === "mousedown" || e.type === "mouseup")
        pointer = {
          x: e.x,
          y: e.y,
          down: e.type === "mousedown" || (e.type === "mousemove" && pointer.down),
        };
    }
    frame();
    if (events.pending) setTimeout(() => handle(keys.scan()), events.pending.delay);
  };

  const stopTheme = onTheme(() => frame());
  void load(active);
  frame();
  return {
    input: (bytes) => handle(keys.scan(theme.feed(bytes))),
    resize: (cols, rows) => {
      term.update({ width: cols, height: rows });
      frame();
    },
    stop: () => {
      stopTheme();
      theme.stop();
      io.write(ui.reset());
      io.write(tty.revert);
    },
  };
}
