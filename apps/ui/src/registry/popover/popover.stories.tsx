// The popover's stories: a non-modal panel with `role="dialog"`, portalled to the body so an ancestor's `overflow: hidden`
// or `transform` cannot clip or offset it. Click the trigger to open it; Escape or a press outside closes it.
import type { Meta, Story } from "@cssints/stories";

import { Button } from "../button/button.tsx";
import { Input } from "../input/input.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./popover.tsx";

const meta = { title: "Popover" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <Popover label="Rename file" placement="bottom-start">
      <PopoverTrigger>Rename</PopoverTrigger>
      <PopoverContent>
        <div class="demo-column">
          <Input aria-label="Name" value="Report Q3" />
          <div class="demo-row">
            <Button size="sm">Save</Button>
            <Button size="sm" tone="quiet">
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

// The panel's other edge: `end` lines it up with the trigger's inline end, and the primitive flips it when the viewport
// has no room.
export const EndAligned: Story = {
  name: "End-aligned",
  render: () => (
    <div class="demo-row">
      <span class="demo-text">The panel opens from the right edge of its trigger.</span>
      <Popover label="Share the report" placement="bottom-end">
        <PopoverTrigger>Share</PopoverTrigger>
        <PopoverContent>
          <p class="demo-text">Anyone with the link can read it.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
