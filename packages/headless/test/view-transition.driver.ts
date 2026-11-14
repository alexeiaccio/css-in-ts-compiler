import { type ActionStep, type Driver, Unsupported } from "@cssints/apg-specs/scenario";
import { type MountedViewTransition } from "./view-transition.fixture";
import { userEvent } from "vite-plus/test/browser";

// mutating a signal and resolving the run promise happen in microtasks; one
// macrotask lets both land before the walk reads
const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const PARTS = ["run", "surface", "pair"] as const;

/**
 * The DOM side of the view-transition bridge. `run` clicks the button, so the
 * primitive's own `run` starts the transition; `settle` and `abort` drive the
 * fixture's `startViewTransition` stub, standing in for the platform.
 */
export const viewTransitionDriver = (mounted: MountedViewTransition): Driver => {
  const { root } = mounted;

  const partOf = (target: string | undefined): HTMLElement => {
    const element = root.querySelector<HTMLElement>(`[data-part="${target ?? "run"}"]`);
    if (element === null) {
      throw new Unsupported(`part ${target ?? ""}`);
    }
    return element;
  };

  return {
    perform: async (step: ActionStep) => {
      switch (step.event) {
        case "run":
          await userEvent.click(partOf(step.target), { force: true });
          break;
        case "settle":
          mounted.settle();
          break;
        case "abort":
          mounted.abort();
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
      focus: () => null,
      attr: (target, name) => {
        throw new Unsupported(`attribute ${name} on ${target}`);
      },
      visible: () => PARTS.filter((part) => root.querySelector(`[data-part="${part}"]`) !== null),
      events: (name) => mounted.events.get(name) ?? [],
      value: mounted.value,
    },
    dispose: mounted.dispose,
  };
};
