// The drawer's stories: an edge-anchored modal panel with a small form, in the two edges the item has. Both are `animated`,
// which is what a reader actually gets: the panel enters and leaves on `@cssints/machine` and the layer unmounts only when
// the slide has finished. A drawer is a page overlay, so the preview shows the trigger and the panel arrives over the page.
import type { JSX } from "@solidjs/web";
import { createSignal } from "solid-js";

import type { Meta, Story } from "@cssints/stories";
import { Button } from "../button/button.tsx";
import { Input } from "../input/input.tsx";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer.tsx";

const meta = { title: "Drawer" } satisfies Meta;
export default meta;

const Filters = (): JSX.Element => {
  const [open, setOpen] = createSignal(false);
  return (
    <Drawer animated open={open()} onOpenChange={setOpen}>
      <DrawerTrigger>Filters</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerClose />
        </DrawerHeader>
        <DrawerBody>
          <Input aria-label="Search" placeholder="Search the report" />
        </DrawerBody>
        <DrawerFooter>
          <Button tone="quiet" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button tone="accent" onClick={() => setOpen(false)}>
            Apply
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export const Default: Story = {
  render: () => (
    <div class="demo-column">
      <Filters />
      <p class="demo-text">
        A right-hand rail: focus moves into the panel, Tab stays in it, Escape or a backdrop click
        closes it, and the focus returns to the button.
      </p>
    </div>
  ),
};

// The bottom sheet: the same dialog on another edge, with a grab handle. Only an animated sheet has the drag
// (`enabled: animated && side === "bottom"`), so the handle is here because the slide is: pull it down and the sheet
// follows the finger, then dismisses or snaps back.
export const SideSheet: Story = {
  render: () => (
    <div class="demo-column">
      <Drawer side="bottom" animated>
        <DrawerTrigger>Open the sheet</DrawerTrigger>
        <DrawerContent>
          <DrawerHandle />
          <DrawerHeader>
            <DrawerTitle>Share</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <DrawerBody>A bottom sheet for the action that belongs to the whole page.</DrawerBody>
          <DrawerFooter>
            <Button tone="accent">Copy link</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <p class="demo-text">
        The sheet slides from the bottom edge, and its handle is the drag surface: pull it down to
        dismiss.
      </p>
    </div>
  ),
};
