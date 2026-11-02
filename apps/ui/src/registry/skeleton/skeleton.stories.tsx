// The skeleton's stories: a filled box with a pulse, and the pulse is the only motion in the kit — it is declared inside
// `prefers-reduced-motion: no-preference`, so a reader who asked for less motion gets a still box.
import type { Meta, Story } from "@cssints/stories";

import { Skeleton, type SkeletonProps } from "./skeleton.tsx";

const meta = {
  title: "Skeleton",
  component: Skeleton,
  args: { height: "2.5rem" },
  argTypes: {
    width: { type: "text" },
    height: { type: "text" },
  },
} satisfies Meta<SkeletonProps>;
export default meta;

export const Block: Story<SkeletonProps> = {};

export const Lines: Story<SkeletonProps> = {
  render: () => (
    <div class="demo-column">
      <Skeleton height="2.5rem" />
      <Skeleton width="60%" />
      <Skeleton width="40%" height="0.75rem" />
    </div>
  ),
};
