// The virtual list's stories: ten thousand rows in a scrollport, of which only the ones in sight exist. The primitive owns the
// arithmetic window; the page renders a row, and its own keys call `scrollToIndex` on the controller.
import { createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { VirtualList } from "./virtual-list.tsx";

const meta = { title: "Virtual list" } satisfies Meta;
export default meta;

export const TenThousand: Story = {
  render: () => (
    <div class="demo-column">
      <VirtualList
        count={10_000}
        itemSize={32}
        gap={4}
        height={320}
        renderItem={(index) => (
          <span class="demo-text">{`Name ${index + 1}`}</span>
        )}
      />
      <p class="demo-text">
        The scrollport holds 320 px of rows; the rest is one spacer at each end, so the arithmetic and the DOM agree.
      </p>
    </div>
  ),
};

// A short list is the same component: the window is the whole list, and the spacers are empty.
export const Short: Story = {
  render: () => (
    <VirtualList count={12} itemSize={32} height={320} renderItem={(index) => <span class="demo-text">{`Row ${index + 1}`}</span>} />
  ),
};
