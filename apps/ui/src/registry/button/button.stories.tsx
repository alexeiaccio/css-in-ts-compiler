// The button's stories: the tones and sizes the skin has, the states the primitive announces, and the link a `render`
// makes of it. A control writes an arg; the canvas remounts the story, so every one of them is the component as a reader
// gets it, not a second copy that reads args.
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import type { Meta, Story } from "../../stories/csf.ts";
import { Button, type ButtonProps } from "./button.tsx";

const meta = {
  title: "Button",
  component: Button,
  args: { children: "Save", tone: "neutral", size: "md" },
  argTypes: {
    tone: { type: "select", options: ["neutral", "accent", "quiet"] },
    size: { type: "select", options: ["sm", "md"] },
    disabled: { type: "boolean" },
  },
} satisfies Meta<ButtonProps>;
export default meta;

export const Default: Story<ButtonProps> = {};

export const Accent: Story<ButtonProps> = { args: { tone: "accent", children: "Publish" } };

export const Quiet: Story<ButtonProps> = { args: { tone: "quiet", children: "Cancel" } };

export const Disabled: Story<ButtonProps> = { args: { disabled: true } };

export const Tones: Story<ButtonProps> = {
  render: () => (
    <div class="demo-row">
      <Button>Save</Button>
      <Button tone="accent">Publish</Button>
      <Button tone="quiet">Cancel</Button>
    </div>
  ),
};

export const Sizes: Story<ButtonProps> = {
  render: () => (
    <div class="demo-row">
      <Button size="sm">Small</Button>
      <Button>Medium</Button>
    </div>
  ),
};

// A toggle keeps its pressed state in the host: the primitive announces aria-pressed and the skin paints it.
export const Toggle: Story<ButtonProps> = {
  render: (): JSX.Element => {
    const [pressed, setPressed] = createSignal(false);
    return (
      <Button isToggle value={pressed()} onValueChange={setPressed}>
        {pressed() ? "Pinned" : "Pin"}
      </Button>
    );
  },
};

// `render` replaces the element: a link that acts as a button keeps the button's props, so the skin and the keyboard
// behaviour arrive on an anchor.
export const AsLink: Story<ButtonProps> = {
  name: "As a link",
  render: () => (
    <Button tone="quiet" render={(props) => <a {...props} href="#a-link" />}>
      A link
    </Button>
  ),
};
