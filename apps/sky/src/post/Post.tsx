import { cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };
import { createMemo, createSignal, Show } from "solid-js";
import type { AppBskyFeedDefs } from "@atcute/bluesky";

import { mediaHidden, postVerdict } from "../api.ts";
import { ph } from "../icons.ts" with { type: "cssints" };
import { t } from "../theme.ts" with { type: "cssints" };
import { Avatar } from "./Avatar.tsx";
import { Embed } from "./Embed.tsx";
import { wide } from "./layout.ts" with { type: "cssints" };
import { ago, count, postHref, recordOf } from "./model.ts";
import { RichText } from "./RichText.tsx";

// The cell is the container the card's width is read from. The card is a frame (rounded, padded, bordered) on a surface
// one tonal step above the feed's; the quote and the media inside it are concentric with it and a step from it.
const cell = css.cn(css.containerType("inline-size"), css.containerName("post"));
const card = css.cn(
  frame().radius(t.radius.xl).padding(2).border(t.border.width),
  wide(frame().padding(3)),
  surface().lighten(0.04),
  css.borderColor(t.color.border),
  css.grid().templateColumns("auto minmax(0, 1fr)").columnGap(t.space.sm).rowGap(t.space.xs),
);
const tombCard = css.cn(
  frame().radius(t.radius.xl).padding(3).border(t.border.width),
  surface().lighten(0.04),
  css.borderColor(t.color.border),
  css.color(t.color.textMedium),
  css.fontSize(t.fontSize.sm),
);

// Narrow: the avatar sits in a row with the name, the text runs full width under it. Wide: the avatar is a column beside
// the name and the text.
const avatarSlot = css.cn(
  css.gridColumn("1"),
  css.gridRow("1"),
  css.alignSelf("start"),
  wide(css.gridRow("1 / span 2")),
);
const head = css.cn(
  css.gridColumn("2"),
  css.gridRow("1"),
  css.flex().alignItems("baseline").gap(t.space.xs),
  css.minWidth("0"),
  css.alignSelf("center"),
  wide(css.alignSelf("start")),
);
const body = css.cn(
  css.gridColumn("1 / -1"),
  css.gridRow("2"),
  css.minWidth("0"),
  wide(css.gridColumn("2")),
);
const name = css.cn(
  css.fontWeight(t.fontWeight.bold),
  css.color(t.color.text),
  css.textDecoration("none"),
  css.overflow("hidden"),
  css.textOverflow("ellipsis"),
  css.whiteSpace("nowrap"),
  css.flexShrink(1),
);
const meta = css.cn(
  css.color(t.color.textMedium),
  css.fontSize(t.fontSize.sm),
  css.textDecoration("none"),
  css.whiteSpace("nowrap"),
  css.overflow("hidden"),
  css.textOverflow("ellipsis"),
  css.hover(css.textDecoration("underline")),
);
const time = css.cn(meta, css.flexShrink(0));

const guard = css.position("relative");
const content = css.flex().direction("column").gap(t.space.sm);
const blurred = css.cn(
  css.filter("blur(14px)"),
  css.pointerEvents("none"),
  css.overflow("hidden"),
  css.maxHeight("16rem"),
);
const reveal = css.cn(
  css.position("absolute"),
  css.top("50%"),
  css.left("50%"),
  css.transform("translate(-50%, -50%)"),
  css.padding(t.space.sm, t.space.lg),
  css.borderRadius(t.radius.button),
  css.border(t.border.width, "solid", t.color.borderStrong),
  css.bg(t.color.bg),
  css.color(t.color.text),
  css.fontWeight(t.fontWeight.semiBold),
);

const actions = css.cn(
  css.flex().alignItems("center").gap(t.space["3xl"]),
  css.color(t.color.textMedium),
  css.fontSize(t.fontSize.sm),
  css.marginTop(t.space.sm),
);
const action = css.cn(css.flex().alignItems("center").gap(t.space.xs), css.minWidth("3rem"));
const actionIcon = css.fontSize(t.fontSize.xl);
const reply = css.cn(ph("chat-circle"), actionIcon);
const repost = css.cn(ph("repeat"), actionIcon);
const like = css.cn(ph("heart"), actionIcon);

/** A post as a card: author, text, embed, counts. A moderated post is hidden or blurred behind a reveal button. */
export function Post(props: { post: AppBskyFeedDefs.PostView }) {
  const verdict = createMemo(() => postVerdict(props.post));
  const [revealed, setRevealed] = createSignal(false);
  const covered = () => verdict() === "warn" && !revealed();
  return (
    <article class={cell}>
      <Show when={verdict() !== "hide"} fallback={<div class={tombCard}>Post hidden</div>}>
        <div class={card}>
          <div class={avatarSlot}>
            <Avatar
              src={
                mediaHidden(props.post.author.did, props.post.author.labels)
                  ? undefined
                  : props.post.author.avatar
              }
            />
          </div>
          <div class={head}>
            <a class={name} href={`/profile/${props.post.author.handle}`}>
              {props.post.author.displayName || props.post.author.handle}
            </a>
            <span class={meta}>@{props.post.author.handle}</span>
            <a class={time} href={postHref(props.post)}>
              · {ago(recordOf(props.post).createdAt ?? props.post.indexedAt)}
            </a>
          </div>
          <div class={body}>
            <div class={guard}>
              <div class={cx(content, covered() && blurred)} inert={covered()}>
                <Show when={recordOf(props.post).text}>
                  {(text) => <RichText text={text()} facets={recordOf(props.post).facets} />}
                </Show>
                <Embed post={props.post} />
              </div>
              <Show when={covered()}>
                <button class={reveal} type="button" onClick={() => setRevealed(true)}>
                  Show anyway
                </button>
              </Show>
            </div>
            <div class={actions}>
              <span class={action} aria-label={`${props.post.replyCount ?? 0} replies`}>
                <span class={reply} />
                {count(props.post.replyCount)}
              </span>
              <span class={action} aria-label={`${props.post.repostCount ?? 0} reposts`}>
                <span class={repost} />
                {count(props.post.repostCount)}
              </span>
              <span class={action} aria-label={`${props.post.likeCount ?? 0} likes`}>
                <span class={like} />
                {count(props.post.likeCount)}
              </span>
            </div>
          </div>
        </div>
      </Show>
    </article>
  );
}
