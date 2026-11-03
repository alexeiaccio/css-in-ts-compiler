// The animated disclosure's stories: a click or a hover intent, the panel animating on `@cssints/machine` in both
// directions, and the one prop that changes the mode — `reducedMotion`. Left out, the preference is read from the reader's
// system, so `Default` is the motion the page's own setting allows and `ReducedMotion` is the same component settling at
// once.
import type { JSX } from "@solidjs/web";

import type { Meta, Story } from "@cssints/stories";
import {
  DisclosureAnimated,
  DisclosureAnimatedContent,
  DisclosureAnimatedTrigger,
} from "./disclosure-animated.tsx";

const meta = { title: "Animated disclosure" } satisfies Meta;
export default meta;

export const Default: Story = {
  render: () => (
    <div class="demo-column">
      <DisclosureAnimated>
        <DisclosureAnimatedTrigger>Shipping, returns and refunds</DisclosureAnimatedTrigger>
        <DisclosureAnimatedContent>
          A disclosure is one button and the panel it animates: a click reverses from wherever the
          box is, and reduced motion lands at the intent in the same frame.
        </DisclosureAnimatedContent>
      </DisclosureAnimated>
    </div>
  ),
};

export const ReducedMotion: Story = {
  render: () => (
    <div class="demo-column">
      <DisclosureAnimated reducedMotion>
        <DisclosureAnimatedTrigger>Shipping, returns and refunds</DisclosureAnimatedTrigger>
        <DisclosureAnimatedContent>
          No transition is entered: the panel is open or closed at once, and a reader who asked for
          less motion gets the same content without the movement.
        </DisclosureAnimatedContent>
      </DisclosureAnimated>
    </div>
  ),
};
