// The post card in cells: author, text with its facets, the embed as text (media placeholders, the quote in a box of its
// own), the counts. The model is apps/sky's: the same choices as the web card, drawn here.
import type { AppBskyFeedDefs } from "@atcute/bluesky";
import type { Facet } from "@atcute/bluesky-richtext-segmenter";
import type { MouseEvent } from "@opentui/core";
import { For, Match, Show, Switch } from "solid-js";

import type { Quote } from "../../sky/src/api.ts";
import { postVerdict } from "../../sky/src/api.ts";
import {
  ago,
  count,
  embedParts,
  fullTime,
  hostOf,
  parts,
  quoteMedia,
  recordOf,
  stats,
} from "../../sky/src/post/model.ts";
import type { Feature, Media } from "../../sky/src/post/model.ts";
import * as s from "./styles.ts";

type PostView = AppBskyFeedDefs.PostView;

export function RichText(props: { text: string; facets?: Facet<Feature>[] }) {
  return (
    <text style={s.body()}>
      <For each={parts(props.text, props.facets)}>
        {(p) =>
          p.link ? (
            <a href={p.link} style={s.link()}>
              {p.text}
            </a>
          ) : p.mention || p.tag ? (
            <span style={s.tag()}>{p.text}</span>
          ) : (
            <span style={s.body()}>{p.text}</span>
          )
        }
      </For>
    </text>
  );
}

// One media embed as a line of text: no pictures in a terminal.
export const mediaText = (m: Media) => {
  switch (m.kind) {
    case "images":
    case "gallery": {
      const n = m.tiles.length + (m.kind === "gallery" ? m.more : 0);
      const alt = m.tiles.find((t) => t.alt)?.alt;
      return `[${n === 1 ? "image" : `${n} images`}${alt ? `: ${alt}` : ""}]`;
    }
    case "video":
      return `[${m.gif ? "gif" : "video"}${m.alt ? `: ${m.alt}` : ""}]`;
    case "external":
      return `[link: ${m.title || m.uri} - ${hostOf(m.uri)}]`;
  }
};

const gone = {
  hidden: "Post hidden",
  blocked: "Blocked post",
  detached: "The author removed this post from the quote",
  notFound: "Post not found",
};

function QuoteBox(props: { quote: Quote }) {
  return (
    <box style={s.quote()}>
      <Switch>
        <Match when={props.quote.kind === "post" && props.quote.post}>
          {(q) => (
            <>
              <text style={s.body()}>
                <span style={s.name()}>{q().author.displayName || q().author.handle}</span>
                <span style={s.meta()}>
                  {` @${q().author.handle} · ${ago(recordOf(q()).createdAt ?? q().indexedAt)}`}
                </span>
              </text>
              <Show when={recordOf(q()).text}>
                {(text) => <RichText text={text()} facets={recordOf(q()).facets} />}
              </Show>
              <Show when={quoteMedia(q())}>
                {(m) => <text style={s.placeholder()}>{mediaText(m())}</text>}
              </Show>
            </>
          )}
        </Match>
        <Match when={props.quote.kind === "hidden"}>
          <text style={s.placeholder()}>{gone.hidden}</text>
        </Match>
        <Match when={props.quote.kind === "gone" && props.quote.why}>
          {(why) => <text style={s.placeholder()}>{gone[why()]}</text>}
        </Match>
      </Switch>
    </box>
  );
}

export interface CardProps {
  id: string;
  post: PostView;
  selected: boolean;
  focus?: boolean; // the thread's own post: the full time and the counts in words
  depth?: number;
  reason?: string; // "reposted by ..."
  onOpen: () => void;
}

export function Post(props: CardProps) {
  const h = s.hoverable();
  const rec = () => recordOf(props.post);
  const embed = () => embedParts(props.post);
  const down = (e: MouseEvent) => {
    if (e.button === 0) props.onOpen();
  };
  return (
    <box
      id={props.id}
      style={s.card({ selected: props.selected, hovered: h.hovered() }, props.depth)}
      onMouseOver={h.over}
      onMouseOut={h.out}
      onMouseDown={down}
    >
      <Show when={props.reason}>{(r) => <text style={s.muted()}>{r()}</text>}</Show>
      <text style={s.body()} wrapMode="none" truncate>
        <span style={s.name()}>{props.post.author.displayName || props.post.author.handle}</span>
        <span style={s.meta()}>
          {` @${props.post.author.handle}`}
          {props.focus ? "" : ` · ${ago(rec().createdAt ?? props.post.indexedAt)}`}
        </span>
      </text>
      <Show
        when={postVerdict(props.post) !== "warn"}
        fallback={<text style={s.placeholder()}>[content warning]</text>}
      >
        <Show when={rec().text}>{(text) => <RichText text={text()} facets={rec().facets} />}</Show>
        <Show when={embed().media}>
          {(m) => <text style={s.placeholder()}>{mediaText(m())}</text>}
        </Show>
        <Show when={embed().quote}>{(q) => <QuoteBox quote={q()} />}</Show>
      </Show>
      <Show
        when={props.focus}
        fallback={
          <text style={s.muted()}>
            {`↩ ${count(props.post.replyCount) || 0}   ⟲ ${count(props.post.repostCount) || 0}   ♥ ${count(props.post.likeCount) || 0}`}
          </text>
        }
      >
        <text style={s.muted()}>{fullTime(rec().createdAt ?? props.post.indexedAt)}</text>
        <text style={s.muted()}>
          <For each={stats(props.post)}>
            {(x) => (
              <>
                <span style={s.num()}>{x.n}</span>
                <span style={s.meta()}>{` ${x.label}   `}</span>
              </>
            )}
          </For>
        </text>
      </Show>
    </box>
  );
}

// A row that is not a post: a tombstone, or "Show N more replies".
export function Note(props: {
  id: string;
  text: string;
  selected: boolean;
  depth?: number;
  onOpen?: () => void;
}) {
  const h = s.hoverable();
  return (
    <box
      id={props.id}
      style={s.card(
        { selected: props.selected, hovered: !!props.onOpen && h.hovered() },
        props.depth,
      )}
      onMouseOver={props.onOpen && h.over}
      onMouseOut={props.onOpen && h.out}
      onMouseDown={(e: MouseEvent) => e.button === 0 && props.onOpen?.()}
    >
      <text style={s.placeholder()}>{props.text}</text>
    </box>
  );
}
