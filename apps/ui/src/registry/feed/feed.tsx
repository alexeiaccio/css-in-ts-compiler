import { createFeed } from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createEffect, createSignal, For, onCleanup, onSettled, Show } from "solid-js";

import { t } from "../theme.ts" with { type: "cssints" };

/** One article of the feed: the words, and the picture a page puts beside them. */
export interface FeedArticle {
  /** Identity of the article: the list's key, and what a page's data is matched by. */
  readonly id: string;
  /** The heading, which names the article for a reader. */
  readonly title: string;
  /** Who wrote it and when, one line: "Rae Molina · 4 March". */
  readonly byline: string;
  /** The summary the article is described by. */
  readonly excerpt: string;
  /** The picture beside the words; decorative, so it carries no text of its own. */
  readonly thumbnail?: JSX.Element | undefined;
}

export interface FeedProps {
  /**
   * The whole list the page has, in reading order. Its length is read once, when the primitive is created: a page that
   * appends to it for good makes a new feed, while more articles of the same list arrive through `loadMore`.
   */
  readonly articles: ReadonlyArray<FeedArticle>;
  /** The feed's accessible name; ignored while `labelledBy` names it. @default "Articles" */
  readonly label?: string | undefined;
  /** The id of the heading that names the feed, when the page has one in sight. */
  readonly labelledBy?: string | undefined;
  /** How many articles are shown before the first load. @default 3 */
  readonly initial?: number | undefined;
  /**
   * Loads the next batch: resolve with how many articles arrived (0 says there are no more). The skin brackets the
   * promise with the primitive's `aria-busy`, and a rejection is announced instead of leaving the sentinel spinning.
   */
  readonly loadMore: (loaded: number) => Promise<number>;
  /** The line under the feed; left out, the keys and the announcement in one sentence. */
  readonly hint?: string | undefined;
  readonly class?: string | undefined;
}

const DEFAULT_HINT =
  "Page Down and Page Up move the focus between articles; when the end of the list comes into view the next ones arrive, and a status line says how many.";

const rootClass = css.cn(css.display("grid"), css.gap(t.space._2));

// The scrollport is the skin's: a feed is a list that grows at its end, and the sentinel at the end is what asks for
// more. The border and the radius are the kit's, and the dark mode moves the tokens underneath.
const paneClass = css.cn(
  css.maxHeight("26.25rem"),
  css.overflowY("auto"),
  css.overflowX("hidden"),
  // the scrollbar appears with the first batch and does not move the cards when it does
  css.scrollbarGutter("stable"),
  css.overscrollBehavior("contain"),
  css.padding(t.space._3),
  css.boxSizing("border-box"),
  css.bg(t.color.page),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.xl),
  css.color(t.color.text),
  css.fontSize(t.font.size),
);

// The feed itself is inside the scrollport and holds only articles; the focusable sentinels sit before and after it.
const feedClass = css.cn(css.display("flex"), css.flexDirection("column"), css.gap(t.space._2));

const cardClass = css.cn(
  css.display("grid"),
  css.gridTemplateColumns("auto minmax(0, 1fr)"),
  css.alignItems("start"),
  css.gap(t.space._3),
  css.padding(t.space._3),
  css.bg(t.color.surface),
  css.border("1px solid", t.color.border),
  css.borderRadius(t.radius.lg),
  css.outline("none"),
  css.hover(css.borderColor(t.color.borderHover)),
  // the primitive keeps the article focusable, and the ring is the one every card of the kit paints
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("2px")),
);

// A 3:2 picture: the crop is the skin's, so a portrait or a wide one keeps the card's shape.
const thumbnailClass = css.cn(
  css.width("6rem"),
  css.aspectRatio("3 / 2"),
  css.flexShrink("0"),
  css.overflow("hidden"),
  css.borderRadius(t.radius.md),
  css.bg(t.color.buttonBackground),
);

const thumbnailFallbackClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.height("100%"),
  css.color(t.color.muted),
  css.fontWeight("600"),
);

const bodyClass = css.cn(css.display("grid"), css.gap(t.space._1), css.minWidth("0"));

const titleClass = css.cn(
  css.margin("0"),
  css.fontSize(t.font.sizeLg),
  css.fontWeight("600"),
  css.lineHeight(1.3),
);

const bylineClass = css.cn(css.margin("0"), css.fontSize(t.font.sizeSm), css.color(t.color.muted));

const excerptClass = css.cn(
  css.margin("0"),
  css.fontSize(t.font.size),
  css.lineHeight(1.5),
  css.color(t.color.muted),
);

// The sentinel at the end of the list: it is the focusable element after the feed (Control+End lands on it) and the line
// that asks for the next batch when the scrollport reaches it.
const sentinelClass = css.cn(
  css.display("flex"),
  css.alignItems("center"),
  css.justifyContent("center"),
  css.gap(t.space._2),
  css.minHeight(t.space._9),
  css.margin("0"),
  css.padding(t.space._2),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
  css.outline("none"),
  css.focusVisible(css.outline("2px solid", t.color.focusRing), css.outlineOffset("-2px")),
);

// Nothing to look at, still in the tab order: the element before the feed is where Control+Home goes, and focusing it
// scrolls the pane back to the start.
const silentClass = css.cn(
  css.display("block"),
  css.width("1px"),
  css.height("1px"),
  css.overflow("hidden"),
  css.clipPath("inset(50%)"),
  css.whiteSpace("nowrap"),
);

const spin = css.keyframes({ to: css.transform("rotate(1turn)") });

// The spinner is motion, so it turns only for a reader who allows it; with less motion the ring stands still beside the
// words, and the words are what says "loading".
const spinnerClass = css.cn(
  css.width(t.space._3),
  css.height(t.space._3),
  css.flexShrink("0"),
  css.borderRadius("999px"),
  css.border("2px solid", t.color.border),
  css.borderTopColor(t.color.text),
  css.media("(prefers-reduced-motion: no-preference)")(
    css.animation(spin, "0.9s", "linear", "infinite"),
  ),
);

const statusClass = css.cn(
  css.margin("0"),
  css.padding("0", t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);

const hintClass = css.cn(
  css.margin("0"),
  css.padding("0", t.space._1),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);

/** `1 article` / `3 articles`, so the status line reads as a sentence. */
const plural = (count: number): string => `${count} ${count === 1 ? "article" : "articles"}`;

/**
 * APG feed, styled: `createFeed` owns the loaded count, the `aria-posinset` / `aria-setsize` of each article, the one tab
 * stop per article, the Page Up / Page Down and Control+Home / Control+End keys, the focus on the article the reading
 * cursor is at, and `aria-busy` while a batch is in flight. The skin owns the scrollport, the cards (surface, border,
 * radius and the theme's tokens in light and dark), the thumbnail's 3:2 crop, the loading sentinel and its spinner, the
 * status line, and the `prefers-reduced-motion` rule the spinner reads.
 *
 * The sentinel is both of the ends the primitive names: it is the focusable element after the feed, and an
 * `IntersectionObserver` asks for the next batch when the scrollport brings it into view. A batch that arrives while the
 * sentinel holds the focus moves the focus to the first of the new articles, so the reader never loses their place.
 */
export const Feed = (props: FeedProps): JSX.Element => {
  const total = props.articles.length;
  const feed = createFeed({
    items: total,
    totalArticles: total,
    defaultValue: props.initial ?? 3,
    get labelledBy() {
      return props.labelledBy;
    },
  });

  const hasMore = (): boolean => feed.loaded() < total;
  const [failed, setFailed] = createSignal(false);

  let pane: HTMLDivElement | undefined;
  let before: HTMLSpanElement | undefined;
  let after: HTMLDivElement | undefined;
  let observer: IntersectionObserver | undefined;
  let disposed = false;
  onCleanup(() => {
    disposed = true;
    observer?.disconnect();
  });

  /** Focus the article at a posinset, or the sentinel on either side the primitive moved the cursor to. */
  const focusActive = (active: number | "before" | "after"): void => {
    if (typeof active === "string") {
      // the sentinels are only taken when the key came from inside the feed: mounting must not steal the page's focus
      if (pane === undefined || !pane.contains(document.activeElement)) {
        return;
      }
      (active === "before" ? before : after)?.focus();
      return;
    }
    const element = pane?.querySelector<HTMLElement>(`[data-posinset="${active}"]`);
    if (element !== undefined && element !== null && element !== document.activeElement) {
      element.focus();
    }
  };

  createEffect(
    () => feed.active(),
    (active) => focusActive(active),
  );

  // An arriving batch is the page's: the primitive only says that one is wanted.
  createEffect(
    () => feed.busy(),
    (busy) => {
      if (!busy) {
        return;
      }
      const loadedBefore = feed.loaded();
      const hadFocus = after !== undefined && document.activeElement === after;
      void (async () => {
        try {
          const arrived = await props.loadMore(loadedBefore);
          if (disposed) {
            return;
          }
          setFailed(false);
          feed.loadFinish(arrived);
          // the sentinel is gone when the last batch lands, so the focus goes to the first article that came in
          if (hadFocus && feed.loaded() > loadedBefore) {
            queueMicrotask(() => {
              if (!disposed) {
                focusActive(loadedBefore + 1);
              }
            });
          }
        } catch {
          if (!disposed) {
            feed.loadFail();
            setFailed(true);
          }
        }
      })();
    },
  );

  // The sentinel asks for a batch when the scrollport reaches it; the primitive ignores the request when one is in
  // flight or the whole list is already loaded.
  onSettled(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          feed.loadStart();
        }
      },
      { root: pane ?? null, rootMargin: "0px 0px 48px 0px" },
    );
    if (after !== undefined) {
      observer.observe(after);
    }
  });

  const status = (): string => {
    if (failed()) {
      return "Could not load more articles.";
    }
    if (feed.busy()) {
      return "Loading more articles…";
    }
    if (!hasMore()) {
      return `All ${plural(total)}.`;
    }
    return `${feed.loaded()} of ${plural(total)}.`;
  };

  return (
    <div data-part="feed-root" class={css.cn(rootClass, props.class)}>
      <div
        data-part="feed-pane"
        class={paneClass}
        ref={(node: HTMLDivElement) => {
          pane = node;
        }}
      >
        <span {...feed.beforeProps} data-part="feed-before" class={silentClass}>
          Start of feed
        </span>
        <div
          {...feed.feedProps}
          data-part="feed"
          aria-label={props.labelledBy === undefined ? (props.label ?? "Articles") : undefined}
          class={feedClass}
        >
          <For each={props.articles.slice(0, feed.loaded())}>
            {(article, index) => {
              const position = index() + 1;
              const own = feed.articleProps(position);
              return (
                <article
                  {...own}
                  data-part="feed-article"
                  data-posinset={position}
                  data-id={article.id}
                  class={cardClass}
                >
                  <div aria-hidden="true" class={thumbnailClass}>
                    <Show
                      when={article.thumbnail}
                      fallback={
                        <span class={thumbnailFallbackClass}>
                          {article.title.slice(0, 1).toUpperCase()}
                        </span>
                      }
                    >
                      {article.thumbnail}
                    </Show>
                  </div>
                  <div class={bodyClass}>
                    <h3 id={own["aria-labelledby"]} class={titleClass}>
                      {article.title}
                    </h3>
                    <p class={bylineClass}>{article.byline}</p>
                    <p id={own["aria-describedby"]} class={excerptClass}>
                      {article.excerpt}
                    </p>
                  </div>
                </article>
              );
            }}
          </For>
        </div>
        <Show when={hasMore() || feed.busy()}>
          <div
            {...feed.afterProps}
            data-part="feed-sentinel"
            class={sentinelClass}
            ref={(node: HTMLDivElement) => {
              after = node;
            }}
          >
            <Show when={feed.busy()} fallback={<span>More articles below</span>}>
              <span aria-hidden="true" data-part="feed-spinner" class={spinnerClass} />
              <span>Loading more…</span>
            </Show>
          </div>
        </Show>
      </div>
      <p data-part="feed-status" role="status" class={statusClass}>
        {status()}
      </p>
      <p data-part="feed-hint" class={hintClass}>
        {props.hint ?? DEFAULT_HINT}
      </p>
    </div>
  );
};
