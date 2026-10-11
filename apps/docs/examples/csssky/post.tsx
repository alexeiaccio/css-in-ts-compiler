import {
  alignSelf,
  bg,
  borderColor,
  borderRadius,
  cn,
  color,
  containerName,
  containerType,
  cv,
  display,
  flex,
  flexShrink,
  fontSize,
  fontWeight,
  grid,
  gridColumn,
  gridRow,
  group,
  height,
  hover,
  lineHeight,
  margin,
  marginTop,
  minWidth,
  objectFit,
  overflow,
  overflowWrap,
  padding,
  textDecoration,
  textOverflow,
  whiteSpace,
  width,
  within,
} from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };

import { wide } from "./layout.ts" with { type: "cssints" };
import { ago, count, hostOf, parts } from "./model.ts";
import type { Post as PostData } from "./model.ts";
import { t } from "./theme.ts" with { type: "cssints" };

// csssky's post card (apps/csssky/src/post/Post.tsx, Embed.tsx, RichText.tsx, Avatar.tsx) with the moderation, the images and the
// icons left out. The cell is the container the card's width is read from. The card is a frame (rounded, padded, bordered) on a
// surface one tonal step above the feed's; the link card inside it is concentric with it and a step from it.
const cell = cn(containerType("inline-size"), containerName("post"));
const card = cn(
  group(),
  frame().radius(t.radius.xl).padding(2).border(t.border.width),
  wide(frame().padding(3)),
  surface().lighten(0.04),
  borderColor(t.color.border),
  grid().templateColumns("auto minmax(0, 1fr)").columnGap(t.space.sm).rowGap(t.space.xs),
);

const avatar = cv({
  base: cn(display("block"), flexShrink(0), objectFit("cover"), bg(t.color.bgMuted)),
  variants: {
    size: {
      lg: cn(width(t.avatar.feed), height(t.avatar.feed), borderRadius(t.radius.avatar)),
      sm: cn(width("20px"), height("20px"), borderRadius(t.radius.avatarSmall)),
    },
  },
  defaultVariants: { size: "lg" },
});

// Narrow: the avatar sits in a row with the name, the text runs full width under it. Wide: the avatar is a column beside the
// name and the text.
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
// The timestamp turns from muted to full colour while the pointer is anywhere on the card (the card is a group).
const time = cn(meta, flexShrink(0), within(hover)(color(t.color.text)));

const content = flex().direction("column").gap(t.space.sm);
const text = cn(
  margin("0"),
  whiteSpace("pre-wrap"),
  overflowWrap("anywhere"),
  lineHeight(t.lineHeight.snug),
);
const link = cn(color(t.color.link), textDecoration("none"), hover(textDecoration("underline")));

const ext = cn(
  frame().border(t.border.width),
  surface().contrast(0.03),
  borderColor(t.color.border),
  display("block"),
  overflow("hidden"),
  textDecoration("none"),
  color(t.color.text),
);
const extBody = cn(
  flex().direction("column").gap(t.space._2xs),
  padding(t.space.md),
  minWidth("0"),
);
const muted = cn(color(t.color.textMedium), fontSize(t.fontSize.sm));
const extHost = cn(muted, overflow("hidden"), textOverflow("ellipsis"), whiteSpace("nowrap"));
const extTitle = cn(fontWeight(t.fontWeight.semiBold), overflowWrap("anywhere"));
const extDesc = cn(muted, margin("0"), overflowWrap("anywhere"));

const actions = cn(
  flex().alignItems("center").gap(t.space._3xl),
  color(t.color.textMedium),
  fontSize(t.fontSize.sm),
  marginTop(t.space.sm),
);
const action = cn(flex().alignItems("center").gap(t.space.xs), minWidth("3rem"));

// Text with its facets: a link goes to the uri of its facet, a hashtag is only coloured (there is no search without a login).
function RichText(props: { post: PostData }) {
  return (
    <p class={text}>
      {parts(props.post.text, props.post.facets).map((p) =>
        p.facet?.kind === "link" ? (
          <a class={link} href={p.facet.uri} target="_blank" rel="noopener noreferrer nofollow">
            {p.text}
          </a>
        ) : p.facet ? (
          <span class={link}>{p.text}</span>
        ) : (
          p.text
        ),
      )}
    </p>
  );
}

// A post as a card: author, text, embed, counts.
export function Post(props: { post: PostData }) {
  const { post } = props;
  return (
    <article class={cell}>
      <div class={card}>
        <div class={avatarSlot}>
          <span class={avatar({ size: "lg" })} />
        </div>
        <div class={head}>
          <a class={name} href="#">
            {post.name || post.handle}
          </a>
          <span class={meta}>@{post.handle}</span>
          <a class={time} href="#">
            · {ago(post.createdAt)}
          </a>
        </div>
        <div class={body}>
          <div class={content}>
            <RichText post={post} />
            {post.link && (
              <a
                class={ext}
                href={post.link.uri}
                target="_blank"
                rel="noopener noreferrer nofollow"
              >
                <div class={extBody}>
                  <span class={extHost}>{hostOf(post.link.uri)}</span>
                  <span class={extTitle}>{post.link.title}</span>
                  <p class={extDesc}>{post.link.description}</p>
                </div>
              </a>
            )}
          </div>
          <div class={actions}>
            <span class={action} aria-label={`${post.replies} replies`}>
              💬 {count(post.replies)}
            </span>
            <span class={action} aria-label={`${post.reposts} reposts`}>
              🔁 {count(post.reposts)}
            </span>
            <span class={action} aria-label={`${post.likes} likes`}>
              ♥ {count(post.likes)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
