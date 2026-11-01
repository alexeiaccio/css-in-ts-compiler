import {
  DISCLOSURE_ANIMATED_DEBOUNCE,
  DisclosureAnimated,
  type DisclosureAnimatedController,
  DisclosureAnimatedContent,
  DisclosureAnimatedTrigger,
} from "./disclosure-animated.tsx";
import { createFakeClock } from "@cssints/machine";
import { type Json, Unsupported } from "@cssints/apg-specs/scenario";
import { createSignal, flush } from "solid-js";
import { render } from "@solidjs/web";
import { type AnimationConfig } from "@cssints/apg-specs/patterns/animation.bridge";
import { type Mounted } from "./disclosure-animated-driver.ts";

/**
 * Mounts the styled animated disclosure for the scenario walk. The fake clock is the machine's: `debounce` advances it,
 * exactly as a pointer burst's window closes. `onAnimate` pauses every animation the host starts, so the test owns the
 * timeline and `frame` is a grid point rather than a guess at the browser's frame rate.
 */
export const mountDisclosureAnimated = (config: AnimationConfig): Mounted => {
  const root = document.createElement("div");
  // The walk reads attributes and animation time, never hit-testing. Parking the fixture outside the viewport keeps a real
  // pointer left by another test file's `user-event` from firing an unasked `pointerenter` at the trigger when it mounts.
  root.style.position = "fixed";
  root.style.insetBlockStart = "0";
  root.style.insetInlineStart = "-10000px";
  document.body.append(root);
  const clock = createFakeClock();
  const [reduced, setReduced] = createSignal(config.reducedMotion);
  let controller: DisclosureAnimatedController | undefined;

  const dispose = render(
    () => (
      <DisclosureAnimated
        clock={clock}
        reducedMotion={reduced()}
        onAnimate={(animation) => animation.pause()}
        onReady={(ready) => {
          controller = ready;
        }}
      >
        <DisclosureAnimatedTrigger>Shipping, returns and refunds</DisclosureAnimatedTrigger>
        <DisclosureAnimatedContent>
          A disclosure is one button and the panel it animates.
        </DisclosureAnimatedContent>
      </DisclosureAnimated>
    ),
    root,
  );
  flush();

  const api = (): DisclosureAnimatedController => {
    if (controller === undefined) {
      throw new Error("the disclosure did not report a controller");
    }
    return controller;
  };

  return {
    root,
    setProp: (name, value) => {
      switch (name) {
        case "open":
          api().setOpen(value === true);
          break;
        case "reducedMotion":
          setReduced(value === true);
          flush();
          break;
        default:
          throw new Unsupported(`prop ${name}`);
      }
    },
    value: () => {
      const state = api().machine.getState();
      return {
        open: state.context.logical,
        state: state.state,
        committed: state.context.committed,
        progress: api().progress(),
        optimistic: state.context.logical !== (state.context.committed === "open"),
      } satisfies Record<string, Json>;
    },
    finishStale: () => {
      // a completion carrying a handle the machine does not have: the late one of an effect it already cancelled
      api().machine.send({ type: "finish", id: -1 });
    },
    debounce: () => clock.advance(DISCLOSURE_ANIMATED_DEBOUNCE),
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
