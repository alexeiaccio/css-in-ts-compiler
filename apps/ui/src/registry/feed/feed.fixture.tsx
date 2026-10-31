import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";

import { Feed, type FeedArticle, type FeedProps } from "./feed.tsx";

/** One article of the demo, before its picture is drawn: the words, and the two ends of its cover. */
interface FeedArticleSeed {
  readonly id: string;
  readonly title: string;
  readonly byline: string;
  readonly excerpt: string;
  readonly from: string;
  readonly to: string;
}

/**
 * The demo's journal: six articles at mount and three more that arrive in one batch, so the sentinel has something honest
 * to wait for and then goes away. The covers are drawn, not fetched: the example needs no network and no image files.
 */
export const FEED_ARTICLES: ReadonlyArray<FeedArticleSeed> = [
  {
    id: "feed-quiet-design",
    title: "The quiet cost of a design system",
    byline: "Rae Molina · 4 March",
    excerpt:
      "Every component you add to a kit is a promise to keep it working. The teams that win are the ones that say no.",
    from: "#f3d9c6",
    to: "#d98e63",
  },
  {
    id: "feed-focus",
    title: "Focus is a place, not a state",
    byline: "Ivo Petrović · 2 March",
    excerpt:
      "A focus ring says where the keyboard is. A feed says where the reader is: those are two different maps, and both have to be drawn.",
    from: "#c9dbe8",
    to: "#6d9dc0",
  },
  {
    id: "feed-tokens",
    title: "Tokens are a contract with the dark",
    byline: "Mira Okafor · 27 February",
    excerpt:
      "The palette that reads well on paper turns to mud at night. Derive the dark mode from the same scale and the two cannot drift.",
    from: "#d5cfdf",
    to: "#8b7aa8",
  },
  {
    id: "feed-scroll",
    title: "Infinite scroll needs an end",
    byline: "Rae Molina · 24 February",
    excerpt:
      "A list that never ends has no landmark, no footer and no way back. A feed should say how much is left, and then stop.",
    from: "#cfe0cd",
    to: "#7ba382",
  },
  {
    id: "feed-pictures",
    title: "Pictures that keep their shape",
    byline: "Noor Haddad · 20 February",
    excerpt:
      "An aspect ratio on the frame is worth more than a rule about image sizes: the crop is the layout's, not the photograph's.",
    from: "#f0dfb8",
    to: "#b99a4f",
  },
  {
    id: "feed-words",
    title: "Write the sentence before the component",
    byline: "Ivo Petrović · 18 February",
    excerpt:
      "If you cannot say what the widget does in one line, the reader will not find out either. Start with the line, then build it.",
    from: "#e6c6c0",
    to: "#b06a63",
  },
  {
    id: "feed-status",
    title: "The status line nobody reads",
    byline: "Mira Okafor · 15 February",
    excerpt:
      "A polite live region is not decoration: it is the only way a screen reader learns that three more articles arrived.",
    from: "#c8d8d4",
    to: "#6a9b92",
  },
  {
    id: "feed-motion",
    title: "Motion is a preference",
    byline: "Noor Haddad · 12 February",
    excerpt:
      "A spinner that turns for everyone turns against the reader who asked it not to. The preference is one line, and it is theirs.",
    from: "#d8d0c2",
    to: "#9b8c76",
  },
  {
    id: "feed-end",
    title: "Every feed ends somewhere",
    byline: "Rae Molina · 9 February",
    excerpt:
      "The last batch is the point of the exercise: say that the list is complete, and take the loading line away.",
    from: "#cdd3e4",
    to: "#7f88ab",
  },
];

/** The articles shown before the first batch: the first six of the list. */
export const FEED_INITIAL = 6;

/** How many articles a batch brings. */
export const FEED_BATCH = 3;

/** How long the demo's loader takes: the spinner is visible for this long, and the test waits it out. */
export const FEED_LOAD_DELAY = 180;

/** A cover for one seed: a drawn gradient, so the demo fetches nothing. */
const cover = (seed: FeedArticleSeed): JSX.Element => (
  <div
    aria-hidden="true"
    style={{
      width: "100%",
      height: "100%",
      background: `linear-gradient(135deg, ${seed.from}, ${seed.to})`,
    }}
  />
);

/** The seeds as the skin's articles; the test and the page read the same list. */
export const buildFeedArticles = (): ReadonlyArray<FeedArticle> =>
  FEED_ARTICLES.map((seed) => ({
    id: seed.id,
    title: seed.title,
    byline: seed.byline,
    excerpt: seed.excerpt,
    thumbnail: cover(seed),
  }));

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * The demo's loader: it waits, then hands over the next three of the same local list. No network, and no surprise: the
 * delay is the fixture's, and the count is what is actually left.
 */
export const demoLoadMore = async (loaded: number): Promise<number> => {
  await wait(FEED_LOAD_DELAY);
  return Math.min(FEED_BATCH, FEED_ARTICLES.length - loaded);
};

export interface FeedExampleProps {
  readonly class?: string | undefined;
  /** A test passes its own loader to count the requests; the demo's own waits and returns the rest of the list. */
  readonly loadMore?: FeedProps["loadMore"] | undefined;
}

/**
 * The starter in ordinary use: a journal of articles in a 360 px scrollport, six to begin with, three more when the end
 * of the list scrolls into view, and the sentence that says how the keyboard and the status line behave. A page copies
 * this and swaps `FEED_ARTICLES` for its own data and `demoLoadMore` for its fetch.
 */
export const FeedExample = (props: FeedExampleProps): JSX.Element => (
  <Feed
    class={props.class}
    articles={buildFeedArticles()}
    initial={FEED_INITIAL}
    label="Studio notes"
    loadMore={props.loadMore ?? demoLoadMore}
  />
);

/** What a mounted demo hands the test: the scrollport, the counts each loader call saw, and a teardown. */
export interface MountedFeed {
  readonly root: HTMLElement;
  /** The scroll container: scrolling it to the end brings the sentinel into view. */
  readonly pane: HTMLElement;
  /** How many articles each loader call was asked for. */
  readonly runs: number[];
  readonly dispose: () => void;
}

/** The demo's width, so the cards have the same room in every test run. */
const DEMO_WIDTH = 360;

/**
 * Mounts the styled feed in ordinary use at a 360 px scrollport. The primitive owns the loaded count, the article
 * semantics and the keys; the fixture is the page's content and its loader.
 */
export const mountFeed = (): MountedFeed => {
  const root = document.createElement("div");
  root.style.width = `${DEMO_WIDTH}px`;
  document.body.append(root);
  const runs: number[] = [];
  const dispose = render(
    () => (
      <FeedExample
        loadMore={async (loaded) => {
          runs.push(loaded);
          return demoLoadMore(loaded);
        }}
      />
    ),
    root,
  );
  const pane = root.querySelector<HTMLElement>('[data-part="feed-pane"]');
  if (pane === null) {
    throw new Error("feed fixture: the scrollport was not mounted");
  }
  return {
    root,
    pane,
    runs,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
