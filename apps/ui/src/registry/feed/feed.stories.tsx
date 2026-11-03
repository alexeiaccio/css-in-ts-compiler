// The feed's stories: a list that grows at its end. The articles are local and their covers are gradients, so the example
// fetches neither data nor images, and the loader hands over the rest of the same list after a short wait. The scrollport is
// the component's: scroll it to the end and the next batch arrives, with the status line saying how many.
import type { JSX } from "@solidjs/web";

import type { Meta, Story } from "@cssints/stories";
import { Feed, type FeedArticle } from "./feed.tsx";

interface Seed {
  readonly id: string;
  readonly title: string;
  readonly byline: string;
  readonly excerpt: string;
  /** The two ends of the cover's gradient. */
  readonly from: string;
  readonly to: string;
}

const SEEDS: ReadonlyArray<Seed> = [
  {
    id: "quiet-cost",
    title: "The quiet cost of a design system",
    byline: "Rae Molina · 4 March",
    excerpt:
      "Every component you add to a kit is a promise to keep it working. The teams that win say no.",
    from: "#f3d9c6",
    to: "#d98e63",
  },
  {
    id: "focus",
    title: "Focus is a place, not a state",
    byline: "Ivo Petrović · 2 March",
    excerpt:
      "A focus ring says where the keyboard is. A feed says where the reader is: two different maps.",
    from: "#c9dbe8",
    to: "#6d9dc0",
  },
  {
    id: "tokens",
    title: "Tokens are a contract with the dark",
    byline: "Mira Okafor · 27 February",
    excerpt:
      "The palette that reads well on paper turns to mud at night. Derive both from the same scale.",
    from: "#d5cfdf",
    to: "#8b7aa8",
  },
  {
    id: "scroll",
    title: "Infinite scroll needs an end",
    byline: "Rae Molina · 24 February",
    excerpt:
      "A list that never ends has no landmark, no footer and no way back. Say how much is left.",
    from: "#cfe0cd",
    to: "#7ba382",
  },
  {
    id: "pictures",
    title: "Pictures that keep their shape",
    byline: "Noor Haddad · 20 February",
    excerpt:
      "An aspect ratio on the frame is worth more than a rule about image sizes: the crop is the layout's.",
    from: "#f0dfb8",
    to: "#b99a4f",
  },
  {
    id: "words",
    title: "Write the sentence before the component",
    byline: "Ivo Petrović · 18 February",
    excerpt:
      "If you cannot say what the widget does in one line, the reader will not find out either.",
    from: "#e6c6c0",
    to: "#b06a63",
  },
];

const INITIAL = 3;
const BATCH = 2;
const LOAD_DELAY = 250;

const cover = (seed: Seed): JSX.Element => (
  <div
    aria-hidden="true"
    style={{
      width: "100%",
      height: "100%",
      background: `linear-gradient(135deg, ${seed.from}, ${seed.to})`,
    }}
  />
);

/** Fresh articles per story: the cover is a DOM node, and two stories must not share one. */
const articles = (): ReadonlyArray<FeedArticle> =>
  SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    byline: seed.byline,
    excerpt: seed.excerpt,
    thumbnail: cover(seed),
  }));

/** The demo's loader: a wait, then whatever is left of the same local list. */
const loadMore = async (loaded: number): Promise<number> => {
  await new Promise((resolve) => setTimeout(resolve, LOAD_DELAY));
  return Math.min(BATCH, SEEDS.length - loaded);
};

const meta = { title: "Feed" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <div class="demo-feed" style={{ width: "100%" }}>
      <Feed articles={articles()} initial={INITIAL} label="Studio notes" loadMore={loadMore} />
    </div>
  ),
};
