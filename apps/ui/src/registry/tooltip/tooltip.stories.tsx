// The tooltip's stories: a description that shows on hover and on focus, and the trigger keeps its own element — `render`
// puts the trigger's props on a link, so anything focusable can be described.
import type { Meta, Story } from "@cssints/stories";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip.tsx";

const meta = { title: "Tooltip" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger>Delete</TooltipTrigger>
      <TooltipContent>Deletes the file. There is no undo.</TooltipContent>
    </Tooltip>
  ),
};

export const OnALink: Story = {
  name: "On a link",
  render: () => (
    <Tooltip>
      <TooltipTrigger render={(props) => <a {...props} href="#share" />}>Share</TooltipTrigger>
      <TooltipContent>Copies a link to this file</TooltipContent>
    </Tooltip>
  ),
};
