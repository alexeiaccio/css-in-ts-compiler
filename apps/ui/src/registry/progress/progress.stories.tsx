// The progress bar's stories: a pane of article text, the bar filling as the pane scrolls. The bar is one element with two
// halves — the native scroll timeline where it exists, the JS value and the `progressbar` role everywhere.
import type { Meta, Story } from "@cssints/stories";

import { Progress, type ProgressProps, type ProgressSection } from "./progress.tsx";

const LOREM =
  "A bar that fills with the scroll is the one progress indicator a reader never has to look away for. The pane below " +
  "is the scroll container: the bar reads its own nearest scrollport for the animation, and the primitive reads the same " +
  "element for the value. Where the browser has scroll-driven animations the fill is the compositor's; where it has not, " +
  "the inline scale is a listener's. Either way the number a screen reader hears is the same one the pane's position says.";

const sections = (count: number): ProgressSection[] =>
  Array.from({ length: count }, (_, index) => ({
    title: `${index + 1}. Section`,
    text: LOREM,
  }));

const meta = {
  title: "Progress",
  component: Progress,
  args: { sections: sections(6) },
} satisfies Meta<ProgressProps>;
export default meta;

export const Default: Story<ProgressProps> = {};

// A short article: the pane cannot scroll, so the bar is full — everything is read, and the value says so.
export const Short: Story<ProgressProps> = { args: { sections: sections(1) } };

// A name the host translates; the API leaves `aria-label` to it.
export const Named: Story<ProgressProps> = {
  args: { sections: sections(6), label: "How far through the article" },
};
