import { render } from "@solidjs/web";
import { createSignal } from "solid-js";

import { Button } from "../button/button.tsx";
import { Input } from "../input/input.tsx";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer.tsx";

/** What a mounted demo hands the test: where it lives, what the controlled host saw, and a teardown. */
export interface MountedDrawer {
  readonly root: HTMLElement;
  /** Every open state the controlled drawer's host was asked for, in order. */
  readonly requests: ReadonlyArray<boolean>;
  /** The controlled host stops accepting requests: the next close is refused. */
  readonly hold: () => void;
  readonly dispose: () => void;
}

/**
 * Mounts the styled drawer in ordinary use: a controlled right-hand rail with a small form (and a `Cancel` in its footer),
 * and an uncontrolled bottom sheet. The trigger opens each; the primitive owns the rest. The host can `hold()` to show a
 * controlled drawer refusing to close.
 */
export const mountDrawer = (): MountedDrawer => {
  const root = document.createElement("div");
  document.body.append(root);
  const requests: boolean[] = [];
  let accept = true;
  const [filters, setFilters] = createSignal(false);

  const dispose = render(
    () => (
      <div>
        <Drawer
          open={filters()}
          onOpenChange={(open) => {
            requests.push(open);
            if (accept) {
              setFilters(open);
            }
          }}
        >
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
              <Button tone="quiet" onClick={() => setFilters(false)}>
                Cancel
              </Button>
              <Button tone="accent" onClick={() => setFilters(false)}>
                Apply
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <Drawer side="bottom">
          <DrawerTrigger>Open the sheet</DrawerTrigger>
          <DrawerContent>
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
      </div>
    ),
    root,
  );

  return {
    root,
    requests,
    hold: () => {
      accept = false;
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
