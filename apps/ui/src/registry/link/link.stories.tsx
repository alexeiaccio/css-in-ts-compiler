// The link's stories: `createLink` decides whether the element is a native `<a href>` or a custom `role="link"`, and owns
// `aria-current`, `aria-disabled` and the activation. The address is a fragment of this page, so a click stays here
// instead of leaving the site; a real page passes its own.
import type { Meta, Story } from "@cssints/stories";

import { Link, type LinkProps } from "./link.tsx";

const meta = {
  title: "Link",
  component: Link,
  args: { children: "Read the guide", href: "#link", tone: "default" },
  argTypes: {
    children: { type: "text" },
    href: { type: "text" },
    tone: { type: "select", options: ["default", "muted"] },
    native: { type: "boolean" },
    current: { type: "boolean" },
    disabled: { type: "boolean" },
  },
} satisfies Meta<LinkProps>;
export default meta;

export const Default: Story<LinkProps> = {};

// The current page of a trail: weight and colour together, never colour alone.
export const CurrentPage: Story<LinkProps> = {
  name: "Current page",
  args: { children: "Installation", current: true },
};

// A disabled link greys and drops the pointer, while `aria-disabled` keeps it in the accessibility tree.
export const Disabled: Story<LinkProps> = { args: { disabled: true } };
