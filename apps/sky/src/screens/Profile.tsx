import { _cv } from "cssints";
import {
  bg,
  border,
  borderBottom,
  borderBottomColor,
  borderRadius,
  cn,
  color,
  cursor,
  cv,
  flex,
  flexGrow,
  fontFamily,
  fontSize,
  fontWeight,
  hover,
  margin,
  padding,
  position,
  textAlign,
  top,
  zIndex,
} from "cssints" with { type: "cssints" };
import { createEffect, createMemo, createSignal, Errored, For, Loading, Show } from "solid-js";

import { loadAuthorFeed, loadProfile } from "../api.ts";
import { createPaged } from "../paged.ts";
import { Feed } from "../post/Feed.tsx";
import { Post } from "../post/Post.tsx";
import { ProfileHeader } from "../profile/Header.tsx";
import { failure, pinnedFirst, reason, TABS, titleOf } from "../profile/model.ts";
import type { Failure } from "../profile/model.ts";
import { Sentinel } from "../profile/Sentinel.tsx";
import { Header } from "../Shell.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

const tabs = cn(
  flex(),
  position("sticky"),
  top(t.layout.headerHeight),
  zIndex(4),
  bg(t.color.bg),
  borderBottom(t.border.width, "solid", t.color.border),
);
const tab = _cv(
  cv({
    base: cn(
      flexGrow(1),
      padding(t.space.md, t.space.lg),
      bg("transparent"),
      border("0"),
      borderBottom("3px", "solid", "transparent"),
      fontFamily("inherit"),
      fontSize(t.fontSize.md),
      fontWeight(t.fontWeight.semiBold),
      cursor("pointer"),
      hover(bg(t.color.bgSubtle)),
    ),
    variants: {
      active: {
        yes: cn(color(t.color.text), borderBottomColor(t.color.accent)),
        no: color(t.color.textMedium),
      },
    },
    defaultVariants: { active: "no" },
  }),
);
const reasonLine = cn(
  color(t.color.textMedium),
  fontSize(t.fontSize.sm),
  fontWeight(t.fontWeight.semiBold),
  padding("0", t.space.sm, t.space.xs),
);
const note = cn(
  margin("0"),
  padding(t.space["2xl"], t.gutter.base),
  textAlign("center"),
  color(t.color.textMedium),
);
const retry = cn(
  padding(t.space.sm, t.space.lg),
  borderRadius(t.radius.button),
  border(t.border.width, "solid", t.color.borderStrong),
  bg(t.color.bg),
  color(t.color.text),
  fontFamily("inherit"),
  fontWeight(t.fontWeight.semiBold),
  cursor("pointer"),
);
const stateTitle = cn(margin("0", "0", t.space.xs), fontSize(t.fontSize.xl));

// The screen shows the document title of what it drew, over the generic one the title bar sets.
function useTitle(title: () => string) {
  createEffect(title, (name) => {
    document.title = `${name} · sky`;
  });
}

const STATES: Record<Failure | "hidden", { title: string; text: (handle: string) => string }> = {
  notFound: { title: "Profile not found", text: (h) => `There is no account named @${h}.` },
  suspended: { title: "Account suspended", text: (h) => `@${h} has been suspended.` },
  deactivated: {
    title: "Account deactivated",
    text: (h) => `@${h} has deactivated their account.`,
  },
  hidden: {
    title: "Not shown",
    text: (h) => `@${h} asks not to be shown to people who are logged out.`,
  },
  failed: { title: "Could not load the profile", text: () => "" },
};

function State(props: {
  kind: Failure | "hidden";
  handle: string;
  error?: unknown;
  retry?: () => void;
}) {
  const s = () => STATES[props.kind];
  useTitle(() => s().title);
  return (
    <div class={note} role="status" data-state={props.kind}>
      <h2 class={stateTitle}>{s().title}</h2>
      <p>{props.kind === "failed" ? String(props.error) : s().text(props.handle)}</p>
      <Show when={props.retry} keyed>
        {(again) => (
          <button type="button" class={retry} onClick={again}>
            Try again
          </button>
        )}
      </Show>
    </div>
  );
}

// The tabs and their list. The source of the paged store is the handle and the tab's filter: switching either starts again.
function Posts(props: { handle: string }) {
  const [current, setCurrent] = createSignal(TABS[0]!);
  const { feed, loadMore, loadingMore } = createPaged(
    () => ({ handle: props.handle, filter: current().filter }),
    (s, cursor) => loadAuthorFeed(s.handle, s.filter, cursor),
  );
  const [failed, setFailed] = createSignal(false);
  const more = () => {
    setFailed(false);
    loadMore().catch(() => setFailed(true));
  };
  const items = () => pinnedFirst(feed.items);
  return (
    <>
      <div class={tabs} role="tablist">
        <For each={TABS}>
          {(x) => (
            <button
              type="button"
              role="tab"
              class={tab({ active: current() === x ? "yes" : "no" })}
              aria-selected={current() === x ? "true" : "false"}
              onClick={() => setCurrent(x)}
            >
              {x.label}
            </button>
          )}
        </For>
      </div>
      <Errored
        fallback={(err, reset) => (
          <State kind="failed" handle={props.handle} error={err()} retry={reset} />
        )}
      >
        <Loading fallback={<p class={note}>Loading…</p>} on={[props.handle, current().id]}>
          <Show when={items().length} fallback={<p class={note}>Nothing here yet.</p>}>
            <Feed>
              <For each={items()}>
                {(item) => (
                  <div>
                    <Show when={reason(item)}>{(r) => <div class={reasonLine}>{r()}</div>}</Show>
                    <Post post={item.post} />
                  </div>
                )}
              </For>
            </Feed>
          </Show>
          <Show when={feed.cursor} keyed>
            {(after) => <Sentinel after={after} onVisible={more} />}
          </Show>
          <Show when={loadingMore()}>
            <p class={note}>Loading…</p>
          </Show>
          <Show when={failed()}>
            <p class={note}>
              Could not load more.{" "}
              <button type="button" class={retry} onClick={more}>
                Try again
              </button>
            </p>
          </Show>
        </Loading>
      </Errored>
    </>
  );
}

function Body(props: { handle: string }) {
  const head = createMemo(() => loadProfile(props.handle));
  useTitle(() => titleOf(head().profile));
  return (
    <Show when={head().verdict !== "hide"} fallback={<State kind="hidden" handle={props.handle} />}>
      <ProfileHeader profile={head().profile} hidden={head().mediaHidden} />
      <Posts handle={props.handle} />
    </Show>
  );
}

// /profile/:handle. A profile that did not load is a state (not found, suspended, deactivated, or an error with a retry).
export default function Profile(props: { handle: string }) {
  return (
    <>
      <Header title={`@${props.handle}`} />
      <Errored
        fallback={(err, reset) => {
          const kind = failure(err());
          return (
            <State
              kind={kind}
              handle={props.handle}
              error={err()}
              retry={kind === "failed" ? reset : undefined}
            />
          );
        }}
      >
        <Loading fallback={<p class={note}>Loading…</p>} on={props.handle}>
          <Body handle={props.handle} />
        </Loading>
      </Errored>
    </>
  );
}
