import { cx } from "cssints";
import {
  alignSelf,
  bg,
  border,
  borderColor,
  borderRadius,
  cn,
  color,
  containerName,
  containerType,
  filter,
  flex,
  flexShrink,
  fontSize,
  fontWeight,
  grid,
  gridColumn,
  gridRow,
  hover,
  left,
  marginTop,
  maxHeight,
  minWidth,
  overflow,
  padding,
  pointerEvents,
  position,
  textDecoration,
  textOverflow,
  top,
  transform,
  whiteSpace,
} from "cssints" with { type: "cssints" };
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
const cell = cn(containerType("inline-size"), containerName("post"));
const card = cn(
  frame().radius(t.radius.xl).padding(2).border(t.border.width),
  wide(frame().padding(3)),
  surface().lighten(0.04),
  borderColor(t.color.border),
  grid().templateColumns("auto minmax(0, 1fr)").columnGap(t.space.sm).rowGap(t.space.xs),
);
const tombCard = cn(
  frame().radius(t.radius.xl).padding(3).border(t.border.width),
  surface().lighten(0.04),
  borderColor(t.color.border),
  color(t.color.textMedium),
  fontSize(t.fontSize.sm),
);

// Narrow: the avatar sits in a row with the name, the text runs full width under it. Wide: the avatar is a column beside
// the name and the text.
const avatarSlot = cn(
  gridColumn("1"),
  gridRow("1"),
  alignSelf("start"),
  wide(gridRow("1 / span 2")),
);
const head = cn(
  gridColumn("2"),
  gridRow("1"),
  flex().alignItems("baseline").gap(t.space.xs),
  minWidth("0"),
  alignSelf("center"),
  wide(alignSelf("start")),
);
const body = cn(gridColumn("1 / -1"), gridRow("2"), minWidth("0"), wide(gridColumn("2")));
const name = cn(
  fontWeight(t.fontWeight.bold),
  color(t.color.text),
  textDecoration("none"),
  overflow("hidden"),
  textOverflow("ellipsis"),
  whiteSpace("nowrap"),
  flexShrink(1),
);
const meta = cn(
  color(t.color.textMedium),
  fontSize(t.fontSize.sm),
  textDecoration("none"),
  whiteSpace("nowrap"),
  overflow("hidden"),
  textOverflow("ellipsis"),
  hover(textDecoration("underline")),
);
const time = cn(meta, flexShrink(0));

const guard = position("relative");
const content = flex().direction("column").gap(t.space.sm);
const blurred = cn(
  filter("blur(14px)"),
  pointerEvents("none"),
  overflow("hidden"),
  maxHeight("16rem"),
);
const reveal = cn(
  position("absolute"),
  top("50%"),
  left("50%"),
  transform("translate(-50%, -50%)"),
  padding(t.space.sm, t.space.lg),
  borderRadius(t.radius.button),
  border(t.border.width, "solid", t.color.borderStrong),
  bg(t.color.bg),
  color(t.color.text),
  fontWeight(t.fontWeight.semiBold),
);

const actions = cn(
  flex().alignItems("center").gap(t.space["3xl"]),
  color(t.color.textMedium),
  fontSize(t.fontSize.sm),
  marginTop(t.space.sm),
);
const action = cn(flex().alignItems("center").gap(t.space.xs), minWidth("3rem"));
const actionIcon = fontSize(t.fontSize.xl);
const reply = cn(ph("chat-circle"), actionIcon);
const repost = cn(ph("repeat"), actionIcon);
const like = cn(ph("heart"), actionIcon);

// A post as a card: author, text, embed, counts. A moderated post is hidden or blurred behind a reveal button.
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
