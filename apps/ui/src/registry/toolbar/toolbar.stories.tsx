// The toolbar's stories: the container is a context, not a control. `size="sm"` reaches the buttons inside through
// `data-size` and `within()`, so a button has no size prop of its own here.
import type { Meta, Story } from "@cssints/stories";

import { Button } from "../button/button.tsx";
import { Toolbar } from "./toolbar.tsx";

const meta = { title: "Toolbar" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <Toolbar label="Default">
      <Button>Undo</Button>
      <Button tone="quiet">Redo</Button>
      <Button tone="quiet">Share</Button>
    </Toolbar>
  ),
};

export const Compact: Story = {
  render: () => (
    <Toolbar label="Compact" size="sm">
      <Button>Undo</Button>
      <Button tone="quiet">Redo</Button>
      <Button tone="quiet">Share</Button>
    </Toolbar>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Toolbar label="Vertical" orientation="vertical">
      <Button tone="quiet">Top</Button>
      <Button tone="quiet">Middle</Button>
      <Button tone="quiet">Bottom</Button>
    </Toolbar>
  ),
};
