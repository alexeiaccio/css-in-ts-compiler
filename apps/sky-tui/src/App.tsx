// The screens: the home feed with its tabs and the thread, on a stack (enter pushes a thread, esc pops it). Keys: j/k or
// the arrows move the selection, enter opens it, tab and shift-tab (or 1-3) switch the feed, t switches the theme, q quits.
// The mouse: a click opens a row, the wheel scrolls, the row under the pointer is highlighted.
import type { AppBskyFeedDefs } from "@atcute/bluesky";
import type { KeyEvent, MouseEvent, ScrollBoxRenderable } from "@opentui/core";
import { useKeyboard, useRenderer } from "@opentui/solid";
import { createEffect, createResource, createSignal, For, Match, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";

import { homeScreen, threadScreen } from "../../sky/src/api.ts";
import type { ThreadNode } from "../../sky/src/api.ts";
import { FEEDS } from "../../sky/src/home/feeds.ts";
import { branches, goneText, moreLabel } from "../../sky/src/thread/model.ts";
import type { Branch } from "../../sky/src/thread/model.ts";
import { Note, Post } from "./Post.tsx";
import * as s from "./styles.ts";

type PostView = AppBskyFeedDefs.PostView;
interface Target {
  actor: string;
  rkey: string;
}
const targetOf = (p: PostView): Target => ({
  actor: p.author.did,
  rkey: p.uri.slice(p.uri.lastIndexOf("/") + 1),
});

// j/k and the arrows as a step of the selection, or 0
const step = (k: KeyEvent) =>
  k.name === "j" || k.name === "down" ? 1 : k.name === "k" || k.name === "up" ? -1 : 0;
const clamp = (i: number, n: number) => Math.max(0, Math.min(i, n - 1));

// Keep the selected row in view: the scrollbox's renderBefore, so the rows' layout is the one of this frame (a
// microtask after the move would see the layout of the previous screen).
function follow(id: () => string) {
  let pending: string | undefined;
  createEffect(() => {
    pending = id();
  });
  return function (this: ScrollBoxRenderable) {
    if (pending === undefined) return;
    if (this.content.findDescendantById(pending)) this.scrollChildIntoView(pending);
    pending = undefined;
  };
}

// ---- home ------------------------------------------------------------------------------------
interface FeedState {
  items: AppBskyFeedDefs.FeedViewPost[];
  cursor: string | undefined;
  loading: boolean;
  done: boolean;
  error: string;
  selected: number;
}

function createHome() {
  const [feeds, setFeeds] = createStore<FeedState[]>(
    FEEDS.map(() => ({
      items: [],
      cursor: undefined,
      loading: false,
      done: false,
      error: "",
      selected: 0,
    })),
  );
  const [active, setActive] = createSignal(0);
  // the next page of a feed; a plain flag guards against a second call before the store write lands
  const busy = new Set<number>();
  async function load(i: number) {
    const f = feeds[i]!;
    if (busy.has(i) || f.done) return;
    busy.add(i);
    setFeeds(i, { loading: true, error: "" });
    try {
      const page = await homeScreen(f.cursor, FEEDS[i]!.uri);
      setFeeds(i, (x) => ({
        items: [...x.items, ...page.items],
        cursor: page.cursor,
        done: page.cursor === undefined,
        loading: false,
      }));
    } catch (e) {
      setFeeds(i, { loading: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      busy.delete(i);
    }
  }
  const select = (i: number) => {
    setActive(clamp(i, FEEDS.length));
    if (!feeds[active()]!.items.length) void load(active());
  };
  const move = (to: number) => {
    const i = active();
    const n = feeds[i]!.items.length;
    if (!n) return;
    setFeeds(i, "selected", clamp(to, n));
    if (to >= n - 3) void load(i); // near the end: the next page
  };
  return { feeds, active, select, move, load } as const;
}
type Home = ReturnType<typeof createHome>;

function Tab(props: { name: string; index: number; active: boolean; onSelect: () => void }) {
  const h = s.hoverable();
  return (
    <text
      style={s.tab({ active: props.active, hovered: h.hovered(), selected: false })}
      onMouseOver={h.over}
      onMouseOut={h.out}
      onMouseDown={(e: MouseEvent) => e.button === 0 && props.onSelect()}
    >
      {` ${props.index + 1} ${props.name} `}
    </text>
  );
}

function HomeScreen(props: { home: Home; open: (t: Target) => void }) {
  const { feeds, active, select, move } = props.home;
  const feed = () => feeds[active()]!;
  const openAt = (i: number) => {
    const item = feed().items[i];
    if (item) props.open(targetOf(item.post));
  };
  useKeyboard((k) => {
    const d = step(k);
    if (d) return move(feed().selected + d);
    if (k.name === "tab")
      return select((active() + (k.shift ? -1 : 1) + FEEDS.length) % FEEDS.length);
    if (/^[1-9]$/.test(k.name)) return select(Number(k.name) - 1);
    if (k.name === "return" || k.name === "enter") openAt(feed().selected);
  });
  const keepInView = follow(() => `post-${active()}-${feed().selected}`);
  if (!feed().items.length) void props.home.load(active());
  return (
    <>
      <box style={s.bar()}>
        <text>
          <span style={s.title()}>sky</span>
        </text>
        <For each={FEEDS}>
          {(f, i) => (
            <Tab name={f.name} index={i()} active={i() === active()} onSelect={() => select(i())} />
          )}
        </For>
      </box>
      <scrollbox style={s.list()} renderBefore={keepInView}>
        <Show when={feed().error}>
          {(e) => <Note id="error" text={`Could not load the feed: ${e()}`} selected={false} />}
        </Show>
        <For each={feed().items}>
          {(item, i) => (
            <Post
              id={`post-${active()}-${i()}`}
              post={item.post}
              selected={i() === feed().selected}
              reason={
                item.reason?.$type === "app.bsky.feed.defs#reasonRepost"
                  ? `⟲ reposted by ${item.reason.by.displayName || item.reason.by.handle}`
                  : undefined
              }
              onOpen={() => {
                move(i());
                openAt(i());
              }}
            />
          )}
        </For>
        <Show when={feed().loading}>
          <Note id="loading" text="Loading…" selected={false} />
        </Show>
        <Show when={feed().done && !feed().items.length}>
          <Note id="empty" text="Nothing here yet" selected={false} />
        </Show>
      </scrollbox>
    </>
  );
}

// ---- thread ----------------------------------------------------------------------------------
type Row =
  | { kind: "post"; post: PostView; depth: number; focus?: boolean }
  | { kind: "note"; text: string; depth: number; open?: PostView };

const nodeRow = (n: ThreadNode, depth: number, focus = false): Row =>
  n.kind === "post"
    ? { kind: "post", post: n.post, depth, focus }
    : { kind: "note", text: goneText[n.why], depth };

// The replies as rows, indented by level; a branch cut at the depth limit ends in a "Show N more" row that opens its post.
const flat = (bs: Branch[], depth: number): Row[] =>
  bs.flatMap((b) => [
    nodeRow(b.node, depth),
    ...flat(b.replies, depth + 1),
    ...(b.more && b.node.kind === "post"
      ? [
          {
            kind: "note",
            text: moreLabel(b.more.count),
            depth: depth + 1,
            open: b.node.post,
          } as Row,
        ]
      : []),
  ]);

export function rowsOf(t: Awaited<ReturnType<typeof threadScreen>>): Row[] {
  return [
    ...t.parents.map((p) => nodeRow(p, 0)),
    nodeRow(t.root, 0, true),
    ...(t.root.kind === "post" ? flat(branches(t.root.replies), 1) : []),
  ];
}

function ThreadScreen(props: { target: Target; open: (t: Target) => void; back: () => void }) {
  const [thread] = createResource(
    () => props.target,
    (t) => threadScreen(t.actor, t.rkey),
  );
  const rows = () => (thread.state === "ready" ? rowsOf(thread()) : []);
  const [selected, setSelected] = createSignal(-1);
  // the thread's own post is selected when it lands
  const sel = () =>
    selected() < 0 ? (thread.state === "ready" ? thread().parents.length : 0) : selected();
  const openRow = (r: Row | undefined) => {
    if (r?.kind === "post" && !r.focus) props.open(targetOf(r.post));
    if (r?.kind === "note" && r.open) props.open(targetOf(r.open));
  };
  useKeyboard((k) => {
    const d = step(k);
    if (d && rows().length) return setSelected(clamp(sel() + d, rows().length));
    if (k.name === "escape" || k.name === "backspace" || k.name === "h") return props.back();
    if (k.name === "return" || k.name === "enter") openRow(rows()[sel()]);
  });
  const keepInView = follow(() => `row-${sel()}`);
  return (
    <>
      <box style={s.bar()}>
        <text>
          <span style={s.title()}>sky</span>
          <span style={s.meta()}> · Thread (esc: back)</span>
        </text>
      </box>
      <scrollbox style={s.list()} renderBefore={keepInView}>
        <Switch>
          <Match when={thread.loading}>
            <Note id="loading" text="Loading…" selected={false} />
          </Match>
          <Match when={thread.error as unknown}>
            <Note
              id="error"
              text={`Could not load the thread: ${String(thread.error)}`}
              selected={false}
            />
          </Match>
        </Switch>
        <For each={rows()}>
          {(r, i) =>
            r.kind === "post" ? (
              <Post
                id={`row-${i()}`}
                post={r.post}
                depth={r.depth}
                focus={r.focus}
                selected={i() === sel()}
                onOpen={() => {
                  setSelected(i());
                  openRow(r);
                }}
              />
            ) : (
              <Note
                id={`row-${i()}`}
                text={r.text}
                depth={r.depth}
                selected={i() === sel()}
                onOpen={r.open && (() => openRow(r))}
              />
            )
          }
        </For>
      </scrollbox>
    </>
  );
}

// ---- the app ---------------------------------------------------------------------------------
export function App() {
  const renderer = useRenderer();
  const home = createHome();
  const [stack, setStack] = createSignal<Target[]>([]);
  const open = (t: Target) => setStack((x) => [...x, t]);
  const back = () => setStack((x) => x.slice(0, -1));
  useKeyboard((k) => {
    if (k.name === "q") renderer.destroy();
    if (k.name === "t") s.toggleMode();
  });
  return (
    <box style={s.screen()}>
      <Show when={stack().at(-1)} keyed fallback={<HomeScreen home={home} open={open} />}>
        {(t) => <ThreadScreen target={t} open={open} back={back} />}
      </Show>
      <text style={s.footer()} wrapMode="none" truncate>
        j/k move · enter open · tab feed · esc back · t theme · q quit
      </text>
    </box>
  );
}
