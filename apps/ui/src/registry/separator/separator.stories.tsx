// The separator's stories: one pixel of the border colour, and the one prop that matters — `decorative` announces nothing,
// because a rule between two groups of content is not a widget.
import type { Meta, Story } from "@cssints/stories";

import { Separator, type SeparatorProps } from "./separator.tsx";

const meta = {
  title: "Separator",
  component: Separator,
  argTypes: {
    orientation: { type: "select", options: ["horizontal", "vertical"] },
    decorative: { type: "boolean" },
  },
} satisfies Meta<SeparatorProps>;
export default meta;

export const Horizontal: Story<SeparatorProps> = {};

export const Vertical: Story<SeparatorProps> = {
  args: { orientation: "vertical" },
  render: () => (
    <div class="demo-row">
      <span>Files</span>
      <Separator orientation="vertical" decorative />
      <span>Shared</span>
    </div>
  ),
};

// A decorative rule is `role="none"`: the orientation is then a look and not an announcement.
export const Decorative: Story<SeparatorProps> = { args: { decorative: true } };
