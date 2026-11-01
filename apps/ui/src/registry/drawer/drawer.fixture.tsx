import { render } from "@solidjs/web";
import { createSignal } from "solid-js";

import type { DrawerSide } from "@cssints/headless";
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

/** What an animated drawer hands its test: the layer, the host's requests, and the box's own timeline. */
export interface MountedMotionDrawer {
  readonly root: HTMLElement;
  /** Every open state the host was asked for, in order. */
  readonly requests: ReadonlyArray<boolean>;
  /** The controlled host stops accepting requests: the next close is refused. */
  readonly hold: () => void;
  readonly trigger: () => HTMLButtonElement;
  /** The panel, or `null` while the layer is unmounted. */
  readonly panel: () => HTMLElement | null;
  readonly layer: () => HTMLElement | null;
  /** The panel's `data-state` (`<side>-<phase>`), or `null` while the layer is unmounted. */
  readonly phase: () => string | null;
  /** Every phase the panel announced, in order (a MutationObserver, so a phase that lasted a frame is in it). */
  readonly phases: () => ReadonlyArray<string>;
  /** How many times the trigger took the focus back. */
  readonly focuses: () => number;
  /** Every animation the layer started, in order; the fixture pauses each one. */
  readonly animations: () => ReadonlyArray<Animation>;
  /** Move the running animation to `fraction` of its track (0 off the edge .. 1 in place). */
  readonly seek: (fraction: number) => void;
  /** Finish the running animation now, as the browser would at its end. */
  readonly finish: () => void;
  readonly dispose: () => void;
}

export interface MountAnimatedDrawerOptions {
  /** The host owns the open state, in a signal the test can write and refuse. */
  readonly controlled?: boolean | undefined;
  /** The motion preference, as the host would pass it. */
  readonly reducedMotion?: boolean | undefined;
  readonly side?: DrawerSide | undefined;
  /** A backdrop click or an outside press does not close it. */
  readonly dismissable?: boolean | undefined;
}

let motionCounter = 0;

/**
 * Mounts one animated drawer: the panel is on the machine, the fixture pauses every animation it starts (so a test owns
 * the timeline), and the host records every request when `controlled`.
 */
export const mountAnimatedDrawer = (
  options: MountAnimatedDrawerOptions = {},
): MountedMotionDrawer => {
  const root = document.createElement("div");
  document.body.append(root);
  const id = `fixture-motion-drawer-${(motionCounter += 1)}`;
  const requests: boolean[] = [];
  const animations: Animation[] = [];
  const phases: string[] = [];
  let accept = true;
  let focusCount = 0;
  const [open, setOpen] = createSignal(false);

  const panel = (): HTMLElement | null => document.getElementById(`${id}-content`);
  const layer = (): HTMLElement | null => panel()?.closest('[data-part="drawer-layer"]') ?? null;
  const trigger = (): HTMLButtonElement => {
    const element = document.getElementById(`${id}-trigger`);
    if (!(element instanceof HTMLButtonElement)) {
      throw new Error("the drawer did not render its trigger");
    }
    return element;
  };

  const observer = new MutationObserver(() => {
    const phase = panel()?.getAttribute("data-state") ?? null;
    if (phase !== null && phases.at(-1) !== phase) {
      phases.push(phase);
    }
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-state"],
  });

  const dispose = render(
    () => (
      <Drawer
        id={id}
        side={options.side}
        animated
        reducedMotion={options.reducedMotion}
        dismissable={options.dismissable}
        open={options.controlled === true ? open() : undefined}
        onOpenChange={(next) => {
          requests.push(next);
          if (options.controlled === true && accept) {
            setOpen(next);
          }
        }}
        onAnimate={(animation) => {
          animations.push(animation);
          animation.pause();
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
            <Button tone="quiet" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button tone="accent" onClick={() => setOpen(false)}>
              Apply
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    ),
    root,
  );

  // count the focus the primitive gives back, instead of watching the activeElement after the fact
  const focus = trigger().focus.bind(trigger());
  trigger().focus = () => {
    focusCount += 1;
    focus();
  };

  return {
    root,
    requests,
    hold: () => {
      accept = false;
    },
    trigger,
    panel,
    layer,
    phase: () => panel()?.getAttribute("data-state") ?? null,
    phases: () => [...phases],
    focuses: () => focusCount,
    animations: () => [...animations],
    seek: (fraction) => {
      for (const animation of panel()?.getAnimations() ?? []) {
        const duration = Number(animation.effect?.getTiming().duration ?? 0);
        animation.currentTime = duration * fraction;
      }
    },
    finish: () => {
      for (const animation of panel()?.getAnimations() ?? []) {
        animation.finish();
      }
    },
    dispose: () => {
      observer.disconnect();
      dispose();
      root.remove();
    },
  };
};
