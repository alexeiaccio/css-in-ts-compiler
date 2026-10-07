import {
  bg,
  bottom,
  border,
  borderRadius,
  cn,
  color,
  containerName,
  containerType,
  cv,
  fontSize,
  fontWeight,
  flex,
  height,
  left,
  marginLeft,
  marginTop,
  minHeight,
  padding,
  paddingLeft,
  position,
  scrollMarginTop,
  textAlign,
  top,
  width,
} from "cssints" with { type: "cssints" };
import { createEffect, createMemo, createSignal, Errored, For, Loading, Show } from "solid-js";
import type { JSX } from "@solidjs/web";

import { threadScreen } from "../api.ts";
import type { ThreadNode } from "../api.ts";
import { Feed } from "../post/Feed.tsx";
import { wide } from "../post/layout.ts" with { type: "cssints" };
import { Post, Tomb } from "../post/Post.tsx";
import { Header } from "../Shell.tsx";
import { t } from "../theme.ts" with { type: "cssints" };
import { branches, goneText, moreLabel, repliesOf, titleOf } from "../thread/model.ts";
import type { Branch } from "../thread/model.ts";

// ---- the connector lines ---------------------------------------------------------------------
// Every row is a "post" container like the card inside it, so that wide() here and in the card agree. The centre of the
// card's avatar is its border, its padding (0.5rem, 0.75rem when wide) and half the avatar, less half the line's 2 px:
// that is how far from the card's left (and top) a line must sit to run through the avatar.
const centre = "calc(var(--border-width) + 0.5rem + var(--avatar-feed) / 2 - 1px)";
const centreWide = "calc(var(--border-width) + 0.75rem + var(--avatar-feed) / 2 - 1px)";
const line = bg(t.color.borderStrong);

const row = cn(
  position("relative"),
  containerType("inline-size"),
  containerName("post"),
  scrollMarginTop("calc(var(--layout-header-height) + var(--space-sm))"),
);

// Under a parent: from the card's bottom to the next card, in the gap of the feed, through the avatar.
const down = cn(
  position("absolute"),
  top("100%"),
  left(centre),
  wide(left(centreWide)),
  width("2px"),
  height(t.space.sm),
  line,
);

// The replies of a post: indented by the avatar's centre, so the line the children hang on is the avatar's. Each child
// draws its own part of it (from the gap above to the bottom, or to its elbow when it is the last) and an elbow into its card.
const kids = cn(
  flex().direction("column").gap(t.space.sm),
  marginTop(t.space.sm),
  marginLeft(centre),
  wide(marginLeft(centreWide)),
  paddingLeft(t.space.lg),
);
const vline = cv({
  base: cn(
    position("absolute"),
    left("calc(0px - var(--space-lg))"),
    top("calc(0px - var(--space-sm))"),
    width("2px"),
    line,
  ),
  variants: {
    end: {
      through: bottom("0"),
      card: cn(
        height(`calc(var(--space-sm) + ${centre} + 2px)`),
        wide(height(`calc(var(--space-sm) + ${centreWide} + 2px)`)),
      ),
      mid: height("calc(var(--space-sm) + 50% + 1px)"),
    },
  },
});
const elbow = cv({
  base: cn(
    position("absolute"),
    left("calc(0px - var(--space-lg))"),
    width(t.space.lg),
    height("2px"),
    line,
  ),
  variants: {
    at: {
      card: cn(top(centre), wide(top(centreWide))),
      mid: top("calc(50% - 1px)"),
    },
  },
});

function Tie(props: { last: boolean; mid?: boolean }) {
  return (
    <>
      <span
        class={vline({ end: props.last ? (props.mid ? "mid" : "card") : "through" })}
        aria-hidden="true"
      />
      <span class={elbow({ at: props.mid ? "mid" : "card" })} aria-hidden="true" />
    </>
  );
}

// ---- rows ------------------------------------------------------------------------------------
const gone = (n: ThreadNode) => (n.kind === "gone" ? goneText[n.why] : "");

function Row(props: {
  node: ThreadNode;
  focus?: boolean;
  down?: boolean; // a parent: a line to the next card
  tie?: { last: boolean }; // a reply: its place on its parent's line
  ref?: (el: HTMLElement) => void;
  children?: JSX.Element;
}) {
  return (
    <div class={row} ref={props.ref} data-row data-focus={props.focus ? "" : undefined}>
      <Show when={props.tie}>{(tie) => <Tie last={tie().last} />}</Show>
      <Show
        when={props.node.kind === "post" ? props.node.post : undefined}
        fallback={<Tomb>{gone(props.node)}</Tomb>}
      >
        {(post) => <Post post={post()} focus={props.focus} />}
      </Show>
      <Show when={props.down}>
        <span class={down} aria-hidden="true" />
      </Show>
      {props.children}
    </div>
  );
}

const moreBox = cn(position("relative"), flex().alignItems("center"));
const moreButton = cn(
  minHeight("2rem"),
  padding("0", t.space.md),
  border(t.border.width, "solid", t.color.border),
  borderRadius(t.radius.button),
  bg(t.color.bg),
  color(t.color.link),
  fontSize(t.fontSize.sm),
  fontWeight(t.fontWeight.semiBold),
);

// The replies of a branch, each on the parent's line; `trail` is true when a "show more" button comes after them.
function Rows(props: { items: Branch[]; trail?: boolean; top?: boolean }) {
  return (
    <For each={props.items}>
      {(b, i) => (
        <Row
          node={b.node}
          tie={props.top ? undefined : { last: !props.trail && i() === props.items.length - 1 }}
        >
          <Show when={b.replies.length || b.more}>
            <div class={kids}>
              <Rows items={b.replies} trail={!!b.more} />
              <Show when={b.more}>
                {(more) => <More rest={more().rest} count={more().count} />}
              </Show>
            </div>
          </Show>
        </Row>
      )}
    </For>
  );
}

// Deep branches are cut by branches(); the button opens the rest in place, as the next levels of the same tree.
function More(props: { rest: ThreadNode[]; count: number }) {
  const [open, setOpen] = createSignal(false);
  return (
    <Show
      when={open()}
      fallback={
        <div class={moreBox}>
          <Tie last mid />
          <button class={moreButton} type="button" onClick={() => setOpen(true)}>
            {moreLabel(props.count)}
          </button>
        </div>
      }
    >
      <Rows items={branches(props.rest)} />
    </Show>
  );
}

// ---- the screen ------------------------------------------------------------------------------
const message = cn(padding(t.gutter.base), color(t.color.textMedium), textAlign("center"));

function View(props: { data: Awaited<ReturnType<typeof threadScreen>> }) {
  let focused: HTMLElement | undefined;
  const root = () => props.data.root;
  const replies = createMemo(() => branches(repliesOf(root())));

  // the parents are above the post: bring the post itself into view, below the sticky header (a block body: Chrome's
  // scrollIntoView returns a promise, and an effect callback's return value is its cleanup)
  createEffect(
    () => props.data,
    () => {
      focused?.scrollIntoView({ block: "start" });
    },
  );
  createEffect(
    () => {
      const r = root();
      return r.kind === "post" ? titleOf(r.post) : gone(r);
    },
    (title) => {
      document.title = `${title} · sky`;
    },
  );
  return (
    <Feed>
      <For each={props.data.parents}>{(p) => <Row node={p} down />}</For>
      <Row node={root()} focus ref={(el) => (focused = el)} />
      <Rows items={replies()} top />
    </Feed>
  );
}

export default function Thread(props: { handle: string; rkey: string }) {
  const data = createMemo(() => threadScreen(props.handle, props.rkey));
  return (
    <>
      <Header title="Post" />
      <Errored
        fallback={(err, reset) => (
          <p class={message}>
            Could not load the thread: {String(err())} <button onClick={reset}>Retry</button>
          </p>
        )}
      >
        <Loading fallback={<p class={message}>Loading…</p>} on={`${props.handle}/${props.rkey}`}>
          <View data={data()} />
        </Loading>
      </Errored>
    </>
  );
}
