// The card's stories: a card is a surface one step off the page, and a frame that hands its inner radius down — put a card
// in a card and the inner corners stay concentric. The second story is the same card under a `data-mode="dark"` scope: the
// mode is the context, not a prop.
import type { JSX } from "@solidjs/web";
import type { Meta, Story } from "@cssints/stories";

import { Button } from "../button/button.tsx";
import { Card, CardBody, CardFooter, CardHeader } from "./card.tsx";

const meta = { title: "Card" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <div class="demo-column">
      <Card>
        <CardHeader>
          <strong>Monthly report</strong>
          <Button size="sm" tone="quiet">
            Open
          </Button>
        </CardHeader>
        <CardBody>
          A card is a surface one step off the page and a frame that hands its inner radius down:
          put a card in a card and the inner corners stay concentric.
        </CardBody>
        <CardFooter>
          <Button size="sm" tone="quiet">
            Share
          </Button>
          <Button size="sm" tone="accent">
            Download
          </Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

export const InDarkMode: Story = {
  name: "In dark mode",
  render: () => (
    <div data-mode="dark">
      <Card>
        <CardBody>
          The same card in <code>data-mode="dark"</code>: the mode is the context, not a prop.
        </CardBody>
      </Card>
    </div>
  ),
};
