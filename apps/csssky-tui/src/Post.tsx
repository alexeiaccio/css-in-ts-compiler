// The post card in cells: author, text with its facets, the embed as text (media placeholders, the quote in a box of its
// own), the counts. The model is apps/csssky's: the same choices as the web card, drawn here.
import type { AppBskyFeedDefs } from "@atcute/bluesky";
import type { Facet } from "@atcute/bluesky-richtext-segmenter";
import { attach, use } from "@cssints/tui/opentui";
import type { BoxRenderable, MouseEvent } from "@opentui/core";
import { createEffect, For, type JSX, Match, Show, Switch } from "solid-js";

import type { Quote } from "../../csssky/src/api.ts";
import { postVerdict } from "../../csssky/src/api.ts";
import {
  ago,
  count,
  embedParts,
  fullTime,
  parts,
  quoteMedia,
  recordOf,
  stats,
} from "../../csssky/src/post/model.ts";
import type { Feature } from "../../csssky/src/post/model.ts";
import { goneQuote, mediaText } from "./model.ts";
import * as s from "./styles.ts";

type PostView = AppBskyFeedDefs.PostView;

export function RichText(props: { text: string; facets?: Facet<Feature>[] }) {
  return (
    <text {...use(s.body)}>
      <For each={parts(props.text, props.facets)}>
        {(p) =>
          p.link ? (
            <a href={p.link} {...use(s.link)}>
              {p.text}
            </a>
          ) : p.mention || p.tag ? (
            <span {...use(s.tag)}>{p.text}</span>
          ) : (
            <span {...use(s.body)}>{p.text}</span>
          )
        }
      </For>
    </text>
  );
}

function QuoteBox(props: { quote: Quote }) {
  return (
    <box {...use(s.quote)}>
      <Switch>
        <Match when={props.quote.kind === "post" && props.quote.post}>
          {(q) => (
            <>
              <text {...use(s.body)}>
                <span {...use(s.name)}>{q().author.displayName || q().author.handle}</span>
                <span {...use(s.meta)}>
                  {` @${q().author.handle} · ${ago(recordOf(q()).createdAt ?? q().indexedAt)}`}
                </span>
              </text>
              <Show when={recordOf(q()).text}>
                {(text) => <RichText text={text()} facets={recordOf(q()).facets} />}
              </Show>
              <Show when={quoteMedia(q())}>
                {(m) => <text {...use(s.muted)}>{mediaText(m())}</text>}
              </Show>
            </>
          )}
        </Match>
        <Match when={props.quote.kind === "hidden"}>
          <text {...use(s.muted)}>{goneQuote.hidden}</text>
        </Match>
        <Match when={props.quote.kind === "gone" && props.quote.why}>
          {(why) => <text {...use(s.muted)}>{goneQuote[why()]}</text>}
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

// A row of a list: the selected one has the keyboard focus (the :focus of its style), indented by its depth; a row that
// opens something has the hover and the pointer of s.card.
function Row(props: {
  id: string;
  selected: boolean;
  depth?: number;
  onOpen?: () => void;
  children: JSX.Element;
}) {
  const style = props.onOpen ? s.card : s.row;
  const ref = (r: BoxRenderable) => {
    attach(r, style);
    createEffect(() => (props.selected ? r.focus() : r.blur()));
  };
  return (
    <box
      id={props.id}
      ref={ref}
      focusable
      marginLeft={Math.min(props.depth ?? 0, 6) * 2}
      onMouseDown={(e: MouseEvent) => e.button === 0 && props.onOpen?.()}
    >
      {props.children}
    </box>
  );
}

export function Post(props: CardProps) {
  const rec = () => recordOf(props.post);
  const embed = () => embedParts(props.post);
  return (
    <Row id={props.id} selected={props.selected} depth={props.depth} onOpen={props.onOpen}>
      <Show when={props.reason}>{(r) => <text {...use(s.muted)}>{r()}</text>}</Show>
      <text {...use(s.body)} wrapMode="none" truncate>
        <span {...use(s.name)}>{props.post.author.displayName || props.post.author.handle}</span>
        <span {...use(s.meta)}>
          {` @${props.post.author.handle}`}
          {props.focus ? "" : ` · ${ago(rec().createdAt ?? props.post.indexedAt)}`}
        </span>
      </text>
      <Show
        when={postVerdict(props.post) !== "warn"}
        fallback={<text {...use(s.muted)}>[content warning]</text>}
      >
        <Show when={rec().text}>{(text) => <RichText text={text()} facets={rec().facets} />}</Show>
        <Show when={embed().media}>{(m) => <text {...use(s.muted)}>{mediaText(m())}</text>}</Show>
        <Show when={embed().quote}>{(q) => <QuoteBox quote={q()} />}</Show>
      </Show>
      <Show
        when={props.focus}
        fallback={
          <text {...use(s.muted)}>
            {`↩ ${count(props.post.replyCount) || 0}   ⟲ ${count(props.post.repostCount) || 0}   ♥ ${count(props.post.likeCount) || 0}`}
          </text>
        }
      >
        <text {...use(s.muted)}>{fullTime(rec().createdAt ?? props.post.indexedAt)}</text>
        <text {...use(s.muted)}>
          <For each={stats(props.post)}>
            {(x) => (
              <>
                <span {...use(s.name)}>{x.n}</span>
                <span {...use(s.meta)}>{` ${x.label}   `}</span>
              </>
            )}
          </For>
        </text>
      </Show>
    </Row>
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
  return (
    <Row id={props.id} selected={props.selected} depth={props.depth} onOpen={props.onOpen}>
      <text {...use(s.muted)}>{props.text}</text>
    </Row>
  );
}
