// The button group's stories: a group draws nothing and knows nothing of its children — it is a context. Its marker class
// is what the buttons read, so the corners two neighbours share square off and their two borders become one.
import type { Meta, Story } from "@cssints/stories";

import { Button } from "../button/button.tsx";
import { ButtonGroup } from "./button-group.tsx";

const meta = { title: "Button group" } satisfies Meta;
export default meta;

export const Horizontal: Story = {
  render: () => (
    <ButtonGroup label="Text alignment">
      <Button tone="quiet">Left</Button>
      <Button tone="quiet">Center</Button>
      <Button tone="quiet">Right</Button>
    </ButtonGroup>
  ),
};

// A vertical group squares the top and the bottom instead, and `size="sm"` is the context as in a toolbar.
export const Vertical: Story = {
  render: () => (
    <ButtonGroup label="Stacked" orientation="vertical" size="sm">
      <Button>Up</Button>
      <Button>Down</Button>
    </ButtonGroup>
  ),
};
