import {
  cn,
  color,
  display,
  fontSize,
  margin,
  padding,
  textAlign,
} from "cssints" with { type: "cssints" };
import { createSignal, Errored, flush, For, isPending, Loading, onSettled, Show } from "solid-js";
import type { ResourceUri } from "@atcute/lexicons";

import { homeScreen } from "../api.ts";
import { Skeletons, SkeletonPost } from "../home/Skeleton.tsx";
import { Tabs } from "../home/Tabs.tsx";
import { createTabs, FEEDS } from "../home/tabs.ts";
import { createPaged } from "../paged.ts";
import { Feed } from "../post/Feed.tsx";
import { Post } from "../post/Post.tsx";
import { Header } from "../Shell.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

const hidden = cn(display("none"));
const note = cn(
  margin("0"),
  padding(t.space.lg),
  textAlign("center"),
  color(t.color.textMedium),
  fontSize(t.fontSize.sm),
);

// Calls `onVisible` when the sentinel comes within 800 px of the viewport. The observer only fires on a change, so after a
// page lands it looks again: a short page leaves the sentinel in view, and that is another call.
function Sentinel(props: { onVisible: () => Promise<boolean> }) {
  let el!: HTMLDivElement;
  onSettled(() => {
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (entry?.isIntersecting && (await props.onVisible()) && el.isConnected) {
          io.unobserve(el);
          io.observe(el);
        }
      },
      { rootMargin: "800px" },
    );
    io.observe(el);
    return () => io.disconnect();
  });
  return <div ref={el} aria-hidden="true" />;
}

// One tab. It is made when the tab is first opened and kept, hidden, so its pages stay where they were.
function Panel(props: { uri: ResourceUri; name: string; active: boolean }) {
  const { feed, loadMore, loadingMore } = createPaged(
    () => props.uri,
    (uri, cursor) => homeScreen(cursor, uri),
  );
  const [failed, setFailed] = createSignal(false);
  const more = () =>
    loadMore().then(
      () => true,
      () => (setFailed(true), false),
    );
  return (
    <div role="tabpanel" aria-label={props.name} class={props.active ? undefined : hidden}>
      <Feed>
        <Errored
          fallback={(err, reset) => (
            <p class={note}>
              Could not load {props.name}: {String(err())} <button onClick={reset}>Retry</button>
            </p>
          )}
        >
          <Loading fallback={<Skeletons />}>
            <For each={feed.items}>{(item) => <Post post={item.post} />}</For>
            <Show
              when={feed.cursor !== undefined}
              fallback={
                <p class={note} data-testid="end">
                  That's all for now.
                </p>
              }
            >
              <Show when={isPending(() => feed.items.length) || loadingMore()}>
                <SkeletonPost />
              </Show>
              <Show
                when={!failed()}
                fallback={
                  <p class={note}>
                    Could not load more. <button onClick={() => setFailed(false)}>Retry</button>
                  </p>
                }
              >
                <Sentinel onVisible={more} />
              </Show>
            </Show>
          </Loading>
        </Errored>
      </Feed>
    </div>
  );
}

// A fixed list of feeds as tabs. Switching keeps each tab's pages and its scroll position.
export default function Home() {
  const tabs = createTabs(FEEDS.length);
  const select = (i: number) => {
    tabs.select(i, window.scrollY);
    flush(); // the panels swap now, so the saved position can be restored on the same frame
    window.scrollTo(0, tabs.scrollOf(i));
  };
  return (
    <>
      <Header title="Home" />
      <Tabs names={FEEDS.map((f) => f.name)} active={tabs.active()} onSelect={select} />
      <For each={FEEDS}>
        {(f, i) => (
          <Show when={tabs.opened().includes(i())}>
            <Panel uri={f.uri} name={f.name} active={tabs.active() === i()} />
          </Show>
        )}
      </For>
    </>
  );
}
