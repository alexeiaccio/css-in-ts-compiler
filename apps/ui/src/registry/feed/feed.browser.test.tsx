import { afterEach, describe, expect, it } from "vite-plus/test";

import { FEED_ARTICLES, type MountedFeed, mountFeed } from "./feed.fixture";

// @cssints/headless checks `createFeed` against specs/apg/feed.qnt and the ported APG scenarios. This file is the skin's
// oracle: it mounts the starter in a real Chromium and scrolls the same pane a reader does. The skin's own parts (the
// scrollport, the cards, the sentinel and its spinner, the status line and the focus that follows the primitive's
// cursor) are only observable through the DOM.
//
// The fixture's pane is 360 px wide and the skin caps it at 420 px tall, so the sentinel starts below the fold and the
// loader's 180 ms delay is long enough to see `aria-busy` and the spinner.

/** Solid applies setters on the next flush, and an IntersectionObserver callback lands after a frame: two frames settle. */
const frame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

/** Polls until `done` holds, so the fixture's delay is waited for rather than assumed. */
const waitFor = async (done: () => boolean, limit = 5000): Promise<void> => {
  const start = performance.now();
  while (!done()) {
    if (performance.now() - start > limit) {
      throw new Error("waitFor timed out");
    }
    await frame();
  }
};

const live: MountedFeed[] = [];

const mounted = (): MountedFeed => {
  const instance = mountFeed();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const required = <T extends Element>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`feed: no ${selector}`);
  }
  return element;
};

const feed = (root: ParentNode): HTMLElement => required(root, '[role="feed"]');

const articles = (root: ParentNode): HTMLElement[] => [
  ...root.querySelectorAll<HTMLElement>('[data-part="feed-article"]'),
];

const sentinel = (root: ParentNode): HTMLElement | null =>
  root.querySelector<HTMLElement>('[data-part="feed-sentinel"]');

const status = (root: ParentNode): HTMLElement => required(root, '[data-part="feed-status"]');

const spinner = (root: ParentNode): HTMLElement | null =>
  root.querySelector<HTMLElement>('[data-part="feed-spinner"]');

/** A key on the focused element, as a reader's would arrive. */
const press = async (target: HTMLElement, key: string, ctrlKey = false): Promise<void> => {
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, ctrlKey, bubbles: true, cancelable: true }),
  );
  await frame();
};

describe("Feed", () => {
  it("is a named feed whose articles carry the primitive's position and size", () => {
    const { root } = mounted();

    expect(feed(root).getAttribute("aria-label")).toBe("Studio notes");
    // the primitive brackets a load; nothing is in flight at mount
    expect(feed(root).hasAttribute("aria-busy")).toBe(false);

    const cards = articles(root);
    expect(cards).toHaveLength(6);
    expect(cards.map((card) => card.getAttribute("role"))).toEqual(
      Array.from({ length: 6 }, () => "article"),
    );
    expect(cards.map((card) => card.getAttribute("aria-posinset"))).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
    ]);
    expect(cards.map((card) => card.getAttribute("aria-setsize"))).toEqual(
      Array.from({ length: 6 }, () => "6"),
    );
    expect(cards.every((card) => card.tabIndex === 0)).toBe(true);

    // the title and the summary the primitive points at are the ones the page wrote
    const first = cards[0] as HTMLElement;
    expect(document.getElementById(first.getAttribute("aria-labelledby") ?? "")?.textContent).toBe(
      FEED_ARTICLES[0]?.title,
    );
    expect(document.getElementById(first.getAttribute("aria-describedby") ?? "")?.textContent).toBe(
      FEED_ARTICLES[0]?.excerpt,
    );
  });

  it("keeps every id and every key of the feed distinct", () => {
    const { root } = mounted();

    const ids = [...root.querySelectorAll<HTMLElement>("[id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);

    const keys = articles(root).map((card) => card.dataset["id"]);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(FEED_ARTICLES.slice(0, 6).map((article) => article.id));
  });

  it("loads the next three when the sentinel scrolls into view, and says so", async () => {
    const instance = mounted();
    const { root, pane } = instance;

    expect(status(root).textContent).toBe("6 of 9 articles.");
    const stop = sentinel(root);
    expect(stop?.textContent?.trim()).toBe("More articles below");
    // below the fold: nothing loads until the reader gets there
    const paneBox = pane.getBoundingClientRect();
    expect((stop as HTMLElement).getBoundingClientRect().top).toBeGreaterThanOrEqual(
      paneBox.top + pane.clientHeight,
    );
    expect(instance.runs).toEqual([]);

    pane.scrollTop = pane.scrollHeight;
    await waitFor(() => feed(root).getAttribute("aria-busy") === "true");
    // the spinner and the line are the skin's, while the primitive owns the busy state
    expect(spinner(root)).not.toBeNull();
    expect(status(root).textContent).toBe("Loading more articles…");

    await waitFor(() => articles(root).length === 9);
    expect(instance.runs).toEqual([6]);
    expect(feed(root).hasAttribute("aria-busy")).toBe(false);

    // the batch is counted, announced and positioned by the primitive
    expect(status(root).textContent).toBe("All 9 articles.");
    expect(articles(root).map((card) => card.getAttribute("aria-posinset"))).toEqual(
      Array.from({ length: 9 }, (_, at) => `${at + 1}`),
    );
    expect(articles(root)[8]?.getAttribute("aria-setsize")).toBe("9");
    // the last batch removes the sentinel: there is nothing left to ask for
    expect(sentinel(root)).toBeNull();
    expect(pane.scrollHeight).toBeGreaterThan(pane.clientHeight);
  });

  it("moves the focus between articles with Page Down and Page Up", async () => {
    const { root } = mounted();
    const first = articles(root)[0] as HTMLElement;
    first.focus();
    await frame();
    expect(document.activeElement).toBe(first);

    await press(first, "PageDown");
    expect(document.activeElement).toBe(articles(root)[1]);
    await press(document.activeElement as HTMLElement, "PageDown");
    expect(document.activeElement).toBe(articles(root)[2]);
    await press(document.activeElement as HTMLElement, "PageUp");
    expect(document.activeElement).toBe(articles(root)[1]);
  });

  it("leaves the feed at Control+End onto the sentinel, and keeps the focus when the batch lands", async () => {
    const { root } = mounted();
    const first = articles(root)[0] as HTMLElement;
    first.focus();
    await frame();

    await press(first, "End", true);
    const stop = sentinel(root);
    expect(document.activeElement).toBe(stop);

    // focusing the sentinel scrolls it into view, so the batch arrives; the sentinel then goes away, and the focus moves
    // to the first article that came in rather than back to the page
    await waitFor(() => articles(root).length === 9);
    await waitFor(() => document.activeElement === articles(root)[6]);
    expect(sentinel(root)).toBeNull();
  });
});
