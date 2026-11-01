import { type ActionStep, type Driver, type Json, Unsupported } from "@cssints/apg-specs/scenario";
import { flush } from "solid-js";

/**
 * The DOM side of the animation spec's vocabulary. The user-level steps reach the real trigger (a click and the two
 * pointer events); the effect steps act on the animation the component really created: `finish` completes it, and
 * `frame` advances its paused timeline one point of the spec's five-point grid. Nothing here counts frames or keeps a
 * second copy of the phase: `value` reads the machine and the animation's own `currentTime`.
 */
export interface Mounted {
  readonly root: HTMLElement;
  /** Apply a scenario `prop` step (a controlled host's intent, or the motion preference). */
  readonly setProp: (name: string, value: Json | undefined) => void;
  /** The spec's observable value: the phase, the split, and the box's position from real timing. */
  readonly value: () => Json;
  /** Deliver the completion of an effect that was cancelled: a `finish` carrying a dead handle id. */
  readonly finishStale: () => void;
  /** Fire the debounce window. */
  readonly debounce: () => void;
  readonly dispose: () => void;
}

// Solid's store writes land in its own schedule; a promise's completion (the animation's `finished`) is a microtask and
// the DOM write after it is another. Flush on both sides of the macrotask, so an observation is never read early.
const settle = async (): Promise<void> => {
  flush();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  flush();
};

const BOOLEAN_ATTRS = new Set(["hidden"]);

const endsOf = (animation: Animation): { readonly from: number; readonly to: number } => {
  const [from = "0", to = "0"] = animation.id.split(":");
  return { from: Number(from), to: Number(to) };
};

const durationOf = (animation: Animation): number =>
  Number(animation.effect?.getTiming().duration ?? 0);

/**
 * One grid point of the animation's own timeline. The component animates linearly from the position the box is at, so a
 * quarter of the distance is a quarter of the animation, and the frame lands on the spec's grid. A zero-distance
 * reversal (the box is already at the end it is heading to) has no point to advance; its progress is the end.
 */
const advance = (animation: Animation): void => {
  animation.pause();
  const { from, to } = endsOf(animation);
  const duration = durationOf(animation);
  if (duration === 0 || from === to) {
    return;
  }
  const time = Number(animation.currentTime ?? 0);
  const fraction = from + (to - from) * Math.min(1, Math.max(0, time / duration));
  const grid = Math.min(4, Math.max(0, Math.floor(fraction * 4 + 0.000001))) / 4;
  const direction = to > from ? 1 : -1;
  const next = Math.min(1, Math.max(0, grid + direction * 0.25));
  animation.currentTime = ((next - from) / (to - from)) * duration;
};

export const domDriver = (mounted: Mounted): Driver => {
  const { root } = mounted;

  const elementsOf = (name: string): HTMLElement[] => [
    ...root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`),
  ];

  const elementOf = (target: string): HTMLElement => {
    const [name = "", index = "0"] = target.split(":");
    const element = elementsOf(name)[Number(index)];
    if (element === undefined) {
      throw new Unsupported(`part ${target}`);
    }
    return element;
  };

  const content = (): HTMLElement => {
    const element = root.querySelector<HTMLElement>('[data-part="content"]');
    if (element === null) {
      throw new Unsupported("no content part");
    }
    return element;
  };

  const pointer = (element: HTMLElement, type: "pointerenter" | "pointerleave"): void => {
    // the two events do not bubble: the component listens on the trigger itself
    element.dispatchEvent(new PointerEvent(type, { bubbles: false, pointerType: "mouse" }));
  };

  return {
    perform: async (step: ActionStep) => {
      switch (step.event) {
        case "click":
          // a synthetic click, not a pointer: the protocol's click and the pointer plumbing are separate, and a real
          // pointer left over the next fixture's trigger would fire an unasked `pointerenter` at it
          elementOf(step.target ?? "trigger").click();
          break;
        case "pointerEnter":
          pointer(elementOf(step.target ?? "trigger"), "pointerenter");
          break;
        case "pointerLeave":
          pointer(elementOf(step.target ?? "trigger"), "pointerleave");
          break;
        case "debounce":
          mounted.debounce();
          break;
        case "frame":
          for (const animation of content().getAnimations()) {
            advance(animation);
          }
          break;
        case "finish":
          for (const animation of content().getAnimations()) {
            animation.finish();
          }
          break;
        case "finishStale":
          mounted.finishStale();
          break;
        case "prop":
          mounted.setProp(step.prop ?? "", step.value);
          break;
        default:
          throw new Unsupported(`event ${step.event}`);
      }
      await settle();
    },
    observer: {
      // the spec's own parts put no focus anywhere: the trigger is focused by the browser, not by the protocol
      focus: () => null,
      // the bridge's `visible` is empty; the panel's `hidden` is its own probed attribute
      visible: () => [],
      events: () => [],
      attr: (target, name) => {
        const element = elementOf(target);
        const value = element.getAttribute(name);
        if (name === "aria-controls" && value !== null) {
          // the bridge names the part, not its index: `content`, as `expect.attrs` writes it
          const referenced = root.querySelector<HTMLElement>(`[id="${value}"]`);
          return referenced?.dataset["part"] ?? value;
        }
        if (value === "") {
          return BOOLEAN_ATTRS.has(name) ? "true" : value;
        }
        return value;
      },
      value: mounted.value,
    },
    dispose: mounted.dispose,
  };
};
