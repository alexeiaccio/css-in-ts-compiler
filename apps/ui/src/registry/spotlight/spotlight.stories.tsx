import type { Meta, Story } from "@cssints/stories";

import { Button } from "../button/button.tsx";
import { Spotlight } from "./spotlight.tsx";

const meta = { title: "Spotlight" } satisfies Meta;
export default meta;

export const Default: Story = {
  name: "Text",
  render: () => (
    <div class="demo-column">
      <Spotlight>
        <strong>Nothing here is a control</strong>
        <p>
          The light is decoration: it never takes a click, and it is not in the accessible tree.
          Point at the card, or tab to something inside it.
        </p>
      </Spotlight>
    </div>
  ),
};

export const WithAControl: Story = {
  name: "With a control",
  render: () => (
    <div class="demo-column">
      <Spotlight>
        <strong>Monthly report</strong>
        <p>A control inside the card lights it on keyboard focus, as the pointer does.</p>
        <Button size="sm" tone="accent">
          Download
        </Button>
      </Spotlight>
    </div>
  ),
};

export const InDarkMode: Story = {
  name: "In dark mode",
  render: () => (
    <div data-mode="dark" class="demo-column">
      <Spotlight>
        The light is the theme's highlight, so the mode moves it with everything else.
      </Spotlight>
    </div>
  ),
};
