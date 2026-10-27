import { alignItems, cn, display, flexWrap, gap } from "cssints" with { type: "cssints" };

import type { Meta, Story } from "../csf.ts";
import { Button, type ButtonProps } from "../components/Button.tsx";

const row = cn(display("flex"), flexWrap("wrap"), alignItems("center"), gap(3));

const meta = {
  title: "Button",
  component: Button,
  args: { tone: "primary", size: "md" },
} satisfies Meta<ButtonProps>;

export default meta;

export const Primary: Story<ButtonProps> = { args: { children: "Save" } };

export const Quiet: Story<ButtonProps> = {
  args: { tone: "quiet", children: "Cancel" },
};

export const Small: Story<ButtonProps> = {
  args: { tone: "quiet", size: "sm", children: "Small" },
};

// The pressed state is the widget's: the story only says the button is a toggle.
export const Toggle: Story<ButtonProps> = {
  args: { isToggle: true, children: "Mute" },
};

export const Disabled: Story<ButtonProps> = {
  args: { tone: "quiet", disabled: true, children: "Disabled" },
};

// A story with its own markup: every size of one component in a row.
export const Row: Story<ButtonProps> = {
  render: () => (
    <div class={row}>
      <Button tone="primary">Save</Button>
      <Button tone="quiet">Cancel</Button>
      <Button tone="quiet" size="sm">
        Small
      </Button>
      <Button tone="quiet" disabled>
        Disabled
      </Button>
    </div>
  ),
};
