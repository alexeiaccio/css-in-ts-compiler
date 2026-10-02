// Cursor paging on Solid 2: an async derived store for the first page, `loadMore()` for the next ones.
import { createSignal, createStore, untrack } from "solid-js";

import type { Page } from "./api.ts";

export interface Paged<T> {
  items: T[];
  cursor: string | undefined; // undefined = no more pages
}

/**
 * First page: an async derived store. `source()` is read synchronously, so a new actor or tab re-runs it, and
 * reading `feed.items` under <Loading> shows the fallback until the first page lands.
 * Next pages: `loadMore()`, called by a sentinel at the end of the list.
 *
 * The in-flight flag is a separate signal on purpose: in solid-js 2.0.0-rc.13 a write to the derived store in
 * the same tick as a change of `source()` makes the store skip the re-run and keep showing the old source.
 * The store is only written after an `await`.
 *
 * The guard against a double call is a plain variable: a signal write is not visible to reads until the next
 * flush, so two calls in the same tick would both see `loadingMore() === false`.
 */
export function createPaged<S, T>(
  source: () => S,
  load: (s: S, cursor?: string) => Promise<Page<T>>,
) {
  const [feed, setFeed] = createStore<Paged<T>>(
    async (draft) => {
      const page = await load(source());
      draft.items = page.items;
      draft.cursor = page.cursor;
    },
    { items: [], cursor: undefined },
  );
  const [loadingMore, setLoadingMore] = createSignal(false); // for the UI only
  let busy = false;

  async function loadMore() {
    const from = feed.cursor;
    if (from === undefined || busy) return;
    const s = untrack(source);
    busy = true;
    setLoadingMore(true);
    let page: Page<T>;
    try {
      page = await load(s, from);
    } finally {
      busy = false;
      setLoadingMore(false); // on an error the sentinel may call again: that is the retry
    }
    setFeed((d) => {
      if (d.cursor !== from) return; // the source changed meanwhile: this page is stale
      d.items.push(...page.items);
      d.cursor = page.cursor;
    });
    // moderation can empty a whole page: keep going while there is a cursor, or the sentinel never fires again
    if (page.items.length === 0 && page.cursor !== undefined) await loadMore();
  }

  return { feed, loadMore, loadingMore } as const;
}
