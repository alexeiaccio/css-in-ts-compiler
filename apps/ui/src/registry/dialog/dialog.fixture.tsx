import { render } from "@solidjs/web";
import { createSignal } from "solid-js";

import { Input } from "../input/input.tsx";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "./dialog.tsx";

/** What a mounted demo hands the test: the layer, what the controlled host saw, and the box's own timeline. */
export interface MountedDialog {
  readonly root: HTMLElement;
  /** Every open state the host was asked for, in order. */
  readonly requests: ReadonlyArray<boolean>;
  /** The controlled host stops accepting requests: the next close is refused. */
  readonly hold: () => void;
  readonly trigger: () => HTMLButtonElement;
  /** The panel, or `null` while the layer is unmounted. */
  readonly panel: () => HTMLElement | null;
  readonly layer: () => HTMLElement | null;
  /** The panel's `data-state`, the box's phase, or `null` while the layer is unmounted. */
  readonly phase: () => string | null;
  /** Every phase the panel announced, in order (a MutationObserver, so a phase that lasted a frame is in it). */
  readonly phases: () => ReadonlyArray<string>;
  /** How many times the trigger took the focus back. */
  readonly focuses: () => number;
  /** Every animation the layer started, in order; the fixture pauses each one. */
  readonly animations: () => ReadonlyArray<Animation>;
  /** Move the running animation to `fraction` of its track (0 closed .. 1 open). */
  readonly seek: (fraction: number) => void;
  /** Finish the running animation now, as the browser would at its end. */
  readonly finish: () => void;
  readonly dispose: () => void;
}

export interface MountDialogOptions {
  /** The panel enters and leaves on the machine. */
  readonly animated?: boolean | undefined;
  /** The host owns the open state, in a signal the test can write and refuse. */
  readonly controlled?: boolean | undefined;
  /** The motion preference, as the host would pass it. */
  readonly reducedMotion?: boolean | undefined;
  /** A backdrop click does not close it. */
  readonly dismissable?: boolean | undefined;
}

let counter = 0;

/**
 * Mounts the styled dialog in ordinary use: a dialog with a field and a `Cancel`, whose host records every request.
 * `animated` is the box; the fixture pauses every animation it starts, so a test owns the timeline instead of guessing at
 * the browser's frame rate.
 */
export const mountDialog = (options: MountDialogOptions = {}): MountedDialog => {
  const root = document.createElement("div");
  document.body.append(root);
  const id = `fixture-dialog-${(counter += 1)}`;
  const requests: boolean[] = [];
  const animations: Animation[] = [];
  const phases: string[] = [];
  let accept = true;
  let focusCount = 0;
  const [open, setOpen] = createSignal(false);

  const panel = (): HTMLElement | null => document.getElementById(`${id}-dialog`);
  const layer = (): HTMLElement | null => panel()?.closest('[data-part="dialog-layer"]') ?? null;
  const trigger = (): HTMLButtonElement => {
    const element = document.getElementById(`${id}-trigger`);
    if (!(element instanceof HTMLButtonElement)) {
      throw new Error("the dialog did not render its trigger");
    }
    return element;
  };

  // Every phase the panel announces, including one that lasts a single frame: the browser's own record, not a sample.
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
      <Dialog
        id={id}
        label="Rename file"
        description="The new name shows up in the list and in every link to it."
        animated={options.animated}
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
        <DialogTrigger>Rename</DialogTrigger>
        <DialogContent>
          <DialogTitle>Rename</DialogTitle>
          <Input value="Report Q3" aria-label="Name" />
          <DialogClose>Cancel</DialogClose>
        </DialogContent>
      </Dialog>
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
