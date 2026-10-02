import { _cv, cx } from "cssints";
import * as css from "cssints" with { type: "cssints" };
import { frame } from "cssints/frame" with { type: "cssints" };
import { surface } from "cssints/surface" with { type: "cssints" };
import { createMemo, For, Match, Show, Switch } from "solid-js";
import type { AppBskyFeedDefs } from "@atcute/bluesky";

import type { Quote } from "../api.ts";
import { ph } from "../icons.ts" with { type: "cssints" };
import { t } from "../theme.ts" with { type: "cssints" };
import { Avatar } from "./Avatar.tsx";
import { wide } from "./layout.ts" with { type: "cssints" };
import { ago, embedParts, gridOf, hostOf, postHref, quoteMedia, recordOf, safeHref } from "./model.ts";
import type { Media, Tile } from "./model.ts";
import { RichText } from "./RichText.tsx";

// Every media box is a frame with no padding of its own: inside the card its radius is the card's inner radius, inside
// the quote it is the quote's, so the three corners stay concentric without a radius written here.
const box = css.cn(frame(), css.position("relative"), css.overflow("hidden"));
const block = css.display("block");

// The columns come from the card's width ("post" container), the variant from how many images there are.
const grid = _cv(
  css.cv({
    base: css.cn(css.display("grid"), css.gap(t.space["2xs"])),
    variants: {
      n: {
        "1": css.gridTemplateColumns("minmax(0, 1fr)"),
        "2": css.gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
        "3": css.cn(
          css.gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
          wide(css.gridTemplateColumns("repeat(3, minmax(0, 1fr))")),
        ),
        "4": css.gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
        gallery: css.cn(
          css.gridTemplateColumns("repeat(2, minmax(0, 1fr))"),
          wide(css.gridTemplateColumns("repeat(4, minmax(0, 1fr))")),
        ),
      },
    },
    defaultVariants: { n: "1" },
  }),
);
// With three images the first is a banner across a narrow card and one of three columns in a wide one.
const cell = _cv(
  css.cv({
    base: css.cn(css.display("block"), css.position("relative"), css.minWidth("0")),
    variants: {
      banner: { yes: css.cn(css.gridColumn("1 / -1"), wide(css.gridColumn("auto"))), no: css.zIndex(0) },
    },
    defaultVariants: { banner: "no" },
  }),
);
const pic = _cv(
  css.cv({
    base: css.cn(
      css.display("block"),
      css.width("100%"),
      css.objectFit("cover"),
      css.bg(t.color.bgMuted),
    ),
    variants: {
      shape: {
        single: css.maxHeight("34rem"), // the ratio is inline (data); a tall image is cropped
        tile: css.aspectRatio("4 / 3"),
        banner: css.cn(css.aspectRatio("16 / 9"), wide(css.aspectRatio("4 / 3"))),
      },
    },
  }),
);
const more = css.cn(
  css.position("absolute"),
  css.inset("0"),
  css.flex().alignItems("center").justifyContent("center"),
  css.bg("rgb(0 0 0 / 0.5)"),
  css.color("#ffffff"),
  css.fontSize(t.fontSize.xl),
  css.fontWeight(t.fontWeight.bold),
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
              class={pic({ shape: n() === "1" ? "single" : n() === "3" && i() === 0 ? "banner" : "tile" })}
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

const ext = css.cn(
  frame().border(t.border.width),
  surface().contrast(0.04),
  css.borderColor(t.color.border),
  css.display("block"),
  css.overflow("hidden"),
  css.textDecoration("none"),
  css.color(t.color.text),
);
const extBody = css.cn(
  css.flex().direction("column").gap(t.space["2xs"]),
  css.padding(t.space.md),
  css.minWidth("0"),
);
const muted = css.cn(css.color(t.color.textMedium), css.fontSize(t.fontSize.sm));
const extHost = css.cn(muted, css.overflow("hidden"), css.textOverflow("ellipsis"), css.whiteSpace("nowrap"));
const extTitle = css.cn(css.fontWeight(t.fontWeight.semiBold), css.overflowWrap("anywhere"));
const extDesc = css.cn(muted, css.margin("0"), css.maxHeight("2.6em"), css.overflow("hidden"), css.overflowWrap("anywhere"));

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

const play = css.cn(
  css.position("absolute"),
  css.top("50%"),
  css.left("50%"),
  css.transform("translate(-50%, -50%)"),
  css.flex().alignItems("center").justifyContent("center"),
  css.width("3.5rem"),
  css.height("3.5rem"),
  css.borderRadius(t.radius.full),
  css.bg("rgb(0 0 0 / 0.6)"),
  css.color("#ffffff"),
  css.fontSize("1.75rem"),
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
          <span class={css.cn(ph("play-fill"))} />
        </span>
      </Show>
    </a>
  );
}

/** One media embed; `href` is where a video plays (on bsky.app). */
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
const quote = css.cn(
  frame().padding(1).border(t.border.width),
  surface().contrast(0.04),
  css.borderColor(t.color.border),
  css.flex().direction("column").gap(t.space.xs),
);
const quoteBody = css.cn(
  css.flex().direction("column").gap(t.space.xs),
  css.padding(t.space.sm),
  css.minWidth("0"),
);
const quoteHead = css.cn(
  css.flex().alignItems("center").gap(t.space.xs),
  css.color(t.color.textMedium),
  css.fontSize(t.fontSize.sm),
  css.textDecoration("none"),
  css.minWidth("0"),
);
const quoteName = css.cn(
  css.color(t.color.text),
  css.fontWeight(t.fontWeight.semiBold),
  css.overflow("hidden"),
  css.textOverflow("ellipsis"),
  css.whiteSpace("nowrap"),
);
const tomb = css.cn(css.padding(t.space.sm), css.color(t.color.textMedium), css.fontSize(t.fontSize.sm));

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

/** The embed of a post: its media first, then the quote (a post can have both: recordWithMedia). */
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
