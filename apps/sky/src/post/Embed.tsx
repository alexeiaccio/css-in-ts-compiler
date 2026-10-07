import { cx } from "cssints";
import {
  aspectRatio,
  bg,
  borderColor,
  borderRadius,
  cn,
  color,
  cv,
  display,
  flex,
  fontSize,
  fontWeight,
  gap,
  gridColumn,
  gridTemplateColumns,
  height,
  inset,
  left,
  margin,
  maxHeight,
  minWidth,
  objectFit,
  overflow,
  overflowWrap,
  padding,
  position,
  textDecoration,
  textOverflow,
  top,
  transform,
  WebkitBoxOrient,
  WebkitLineClamp,
  whiteSpace,
  width,
  zIndex,
} from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };
import { createMemo, For, Match, Show, Switch } from "solid-js";
import type { AppBskyFeedDefs } from "@atcute/bluesky";

import type { Quote } from "../api.ts";
import { ph } from "../icons.ts" with { type: "cssints" };
import { t } from "../theme.ts" with { type: "cssints" };
import { Avatar } from "./Avatar.tsx";
import { wide } from "./layout.ts" with { type: "cssints" };
import {
  ago,
  embedParts,
  gridOf,
  hostOf,
  postHref,
  quoteMedia,
  recordOf,
  safeHref,
} from "./model.ts";
import type { Media, Tile } from "./model.ts";
import { RichText } from "./RichText.tsx";

// Every media box is a frame with no padding of its own: inside the card its radius is the card's inner radius, inside
// the quote it is the quote's, so the three corners stay concentric without a radius written here.
const box = cn(frame(), position("relative"), overflow("hidden"));
const block = display("block");

// The columns come from the card's width ("post" container), the variant from how many images there are.
const grid = cv({
  base: cn(display("grid"), gap(t.space["2xs"])),
  variants: {
    n: {
      "1": gridTemplateColumns("minmax(0, 1fr)"),
      "2": gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
      "3": cn(
        gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
        wide(gridTemplateColumns("repeat(3, minmax(0, 1fr))")),
      ),
      "4": gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
      gallery: cn(
        gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
        wide(gridTemplateColumns("repeat(4, minmax(0, 1fr))")),
      ),
    },
  },
  defaultVariants: { n: "1" },
});
// With three images the first is a banner across a narrow card and one of three columns in a wide one.
const cell = cv({
  base: cn(display("block"), position("relative"), minWidth("0")),
  variants: {
    banner: {
      yes: cn(gridColumn("1 / -1"), wide(gridColumn("auto"))),
      no: zIndex(0),
    },
  },
  defaultVariants: { banner: "no" },
});
const pic = cv({
  base: cn(display("block"), width("100%"), objectFit("cover"), bg(t.color.bgMuted)),
  variants: {
    shape: {
      single: maxHeight("34rem"), // the ratio is inline (data); a tall image is cropped
      tile: aspectRatio("4 / 3"),
      banner: cn(aspectRatio("16 / 9"), wide(aspectRatio("4 / 3"))),
    },
  },
});
const more = cn(
  position("absolute"),
  inset("0"),
  flex().alignItems("center").justifyContent("center"),
  bg("rgb(0 0 0 / 0.5)"),
  color("#ffffff"),
  fontSize(t.fontSize.xl),
  fontWeight(t.fontWeight.bold),
);

function Tiles(props: { media: Media & { tiles: Tile[] } }) {
  const n = () => gridOf(props.media);
  return (
    <div class={cx(box, grid({ n: n() }))}>
      <For each={props.media.tiles}>
        {(tile, i) => (
          <a
            class={cell({ banner: n() === "3" && i() === 0 ? "yes" : "no" })}
            href={safeHref(tile.full)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              class={pic({
                shape: n() === "1" ? "single" : n() === "3" && i() === 0 ? "banner" : "tile",
              })}
              style={n() === "1" ? { "aspect-ratio": String(tile.ratio) } : undefined}
              src={tile.thumb}
              alt={tile.alt}
              loading="lazy"
            />
            <Show when={props.media.kind === "gallery" && i() === 3 && props.media.more > 0}>
              <span class={more}>+{props.media.kind === "gallery" ? props.media.more : 0}</span>
            </Show>
          </a>
        )}
      </For>
    </div>
  );
}

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
  flex().direction("column").gap(t.space["2xs"]),
  padding(t.space.md),
  minWidth("0"),
);
const muted = cn(color(t.color.textMedium), fontSize(t.fontSize.sm));
const extHost = cn(muted, overflow("hidden"), textOverflow("ellipsis"), whiteSpace("nowrap"));
const extTitle = cn(fontWeight(t.fontWeight.semiBold), overflowWrap("anywhere"));
const extDesc = cn(
  muted,
  margin("0"),
  display("-webkit-box"), // -webkit-line-clamp needs the box in every engine (LightningCSS adds nothing)
  WebkitBoxOrient("vertical"),
  WebkitLineClamp(2),
  overflow("hidden"),
  overflowWrap("anywhere"),
);

function External(props: { media: Media & { kind: "external" } }) {
  return (
    <a
      class={ext}
      href={safeHref(props.media.uri)}
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      <Show when={props.media.thumb}>
        {(src) => (
          <img
            class={pic({ shape: "tile" })}
            style={{ "aspect-ratio": "1.91 / 1" }}
            src={src()}
            alt=""
            loading="lazy"
          />
        )}
      </Show>
      <div class={extBody}>
        <span class={extHost}>{hostOf(props.media.uri)}</span>
        <span class={extTitle}>{props.media.title}</span>
        <Show when={props.media.description}>
          <p class={extDesc}>{props.media.description}</p>
        </Show>
      </div>
    </a>
  );
}

const play = cn(
  position("absolute"),
  top("50%"),
  left("50%"),
  transform("translate(-50%, -50%)"),
  flex().alignItems("center").justifyContent("center"),
  width("3.5rem"),
  height("3.5rem"),
  borderRadius(t.radius.full),
  bg("rgb(0 0 0 / 0.6)"),
  color("#ffffff"),
  fontSize("1.75rem"),
);

// No HLS player: the poster with a play mark, linking to the post on bsky.app. A gif has no mark.
function Video(props: { media: Media & { kind: "video" }; href: string }) {
  return (
    <a
      class={cx(box, block)}
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={props.media.alt || "Play the video on bsky.app"}
    >
      <img
        class={pic({ shape: "single" })}
        style={{ "aspect-ratio": String(props.media.ratio) }}
        src={props.media.poster}
        alt=""
        loading="lazy"
      />
      <Show when={!props.media.gif}>
        <span class={play}>
          <span class={cn(ph("play-fill"))} />
        </span>
      </Show>
    </a>
  );
}

// One media embed; `href` is where a video plays (on bsky.app).
export function MediaView(props: { media: Media; href: string }) {
  return (
    <Switch>
      <Match when={props.media.kind === "images" || props.media.kind === "gallery"}>
        <Tiles media={props.media as Media & { tiles: Tile[] }} />
      </Match>
      <Match when={props.media.kind === "external"}>
        <External media={props.media as Media & { kind: "external" }} />
      </Match>
      <Match when={props.media.kind === "video"}>
        <Video media={props.media as Media & { kind: "video" }} href={props.href} />
      </Match>
    </Switch>
  );
}

// ---- the quote -------------------------------------------------------------------------------
// A tonal step from the card (surface().contrast: darker on a light card, lighter on a dark one) and concentric with it.
const quote = cn(
  frame().padding(1).border(t.border.width),
  surface().contrast(0.03),
  borderColor(t.color.border),
  flex().direction("column").gap(t.space.xs),
);
const quoteBody = cn(
  flex().direction("column").gap(t.space.xs),
  padding(t.space.sm),
  minWidth("0"),
);
const quoteHead = cn(
  flex().alignItems("center").gap(t.space.xs),
  color(t.color.textMedium),
  fontSize(t.fontSize.sm),
  textDecoration("none"),
  minWidth("0"),
);
const quoteName = cn(
  color(t.color.text),
  fontWeight(t.fontWeight.semiBold),
  overflow("hidden"),
  textOverflow("ellipsis"),
  whiteSpace("nowrap"),
);
const tomb = cn(padding(t.space.sm), color(t.color.textMedium), fontSize(t.fontSize.sm));

const gone = {
  hidden: "Post hidden",
  blocked: "Blocked post",
  detached: "The author removed this post from the quote",
  notFound: "Post not found",
};

function QuoteCard(props: { quote: Quote }) {
  return (
    <Switch>
      <Match when={props.quote.kind === "post" && props.quote}>
        {(q) => {
          const post = () => (q() as Quote & { kind: "post" }).post;
          const media = createMemo(() => quoteMedia(post()));
          return (
            <div class={quote}>
              <div class={quoteBody}>
                <a class={quoteHead} href={postHref(post())}>
                  <Avatar size="sm" src={post().author.avatar} />
                  <span class={quoteName}>{post().author.displayName || post().author.handle}</span>
                  <span>@{post().author.handle}</span>
                  <span>· {ago(recordOf(post()).createdAt ?? post().indexedAt)}</span>
                </a>
                <Show when={recordOf(post()).text}>
                  {(text) => <RichText text={text()} facets={recordOf(post()).facets} />}
                </Show>
              </div>
              <Show when={media()}>
                {(m) => <MediaView media={m()} href={`https://bsky.app${postHref(post())}`} />}
              </Show>
            </div>
          );
        }}
      </Match>
      <Match when={props.quote.kind === "hidden"}>
        <div class={quote}>
          <div class={tomb}>{gone.hidden}</div>
        </div>
      </Match>
      <Match when={props.quote.kind === "gone" && props.quote}>
        {(q) => (
          <div class={quote}>
            <div class={tomb}>{gone[(q() as Quote & { kind: "gone" }).why]}</div>
          </div>
        )}
      </Match>
    </Switch>
  );
}

// The embed of a post: its media first, then the quote (a post can have both: recordWithMedia).
export function Embed(props: { post: AppBskyFeedDefs.PostView }) {
  const parts = createMemo(() => embedParts(props.post));
  return (
    <>
      <Show when={parts().media}>
        {(m) => <MediaView media={m()} href={`https://bsky.app${postHref(props.post)}`} />}
      </Show>
      <Show when={parts().quote}>{(q) => <QuoteCard quote={q()} />}</Show>
    </>
  );
}
