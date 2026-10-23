import { type ActionStep, type Driver, Unsupported } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import { userEvent } from "vite-plus/test/browser";

/**
 * The DOM side of the resizable-panels bridge. Keys go to whatever holds focus
 * inside the group (a key with focus elsewhere is a no-op in the spec too); the
 * drag is dispatched as real `PointerEvent`s on the separator, with the pointer
 * moved by the step's percent delta of the group's measured width, so the
 * primitive's own pointer maths (clientX -> percent) runs.
 */
const BOOLEAN_ATTRS = new Set(["hidden", "disabled"]);
const NAMED_KEYS = new Set(["Enter", "Home", "End"]);

const keyToken = (key: string): string =>
  NAMED_KEYS.has(key) || key.startsWith("Arrow") ? `{${key}}` : key;

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });

export const resizablePanelsDriver = (mounted: Mounted): Driver => {
  const { root } = mounted;

  const partOf = (target: string | undefined): HTMLElement => {
    const element = root.querySelector<HTMLElement>(`[data-part="${target ?? ""}"]`);
    if (element === null) {
      throw new Unsupported(`part ${target ?? ""}`);
    }
    return element;
  };

  const activePart = (): string | null => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !root.contains(active)) {
      return null;
    }
    const part = active.closest<HTMLElement>("[data-part]")?.dataset["part"];
    return part ?? null;
  };

  // x is the drag axis for a vertical separator (columns), y for a horizontal one
  const axisOf = (element: HTMLElement): "x" | "y" =>
    element.getAttribute("aria-orientation") === "horizontal" ? "y" : "x";

  const groupRect = (): DOMRect => partOf("group").getBoundingClientRect();

  const pointer = (
    element: HTMLElement,
    type: string,
    position: { readonly x: number; readonly y: number },
    buttons: number,
  ): void => {
    element.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        button: 0,
        buttons,
        clientX: position.x,
        clientY: position.y,
      }),
    );
  };

  // the pointer's start position, and where it currently is (percent of the group)
  let drag:
    | {
        readonly element: HTMLElement;
        readonly start: { readonly x: number; readonly y: number };
        readonly axis: "x" | "y";
        readonly length: number;
        percent: number;
      }
    | undefined;

  const at = (percent: number): { readonly x: number; readonly y: number } => {
    if (drag === undefined) {
      throw new Unsupported("no drag");
    }
    const offset = (percent / 100) * drag.length;
    return drag.axis === "x"
      ? { x: drag.start.x + offset, y: drag.start.y }
      : { x: drag.start.x, y: drag.start.y + offset };
  };

  return {
    perform: async (step: ActionStep) => {
      switch (step.event) {
        case "focus":
          partOf(step.target).focus();
          break;
        case "blur": {
          const active = document.activeElement;
          if (active instanceof HTMLElement && root.contains(active)) {
            active.blur();
          }
          break;
        }
        case "key": {
          // exactly like a user: only the focused element receives the key
          const active = document.activeElement;
          if (active instanceof HTMLElement && root.contains(active)) {
            await userEvent.keyboard(keyToken(step.key ?? ""));
          }
          break;
        }
        case "dragStart": {
          // a new pointerdown takes the drag over (as in the primitive and the spec)
          const element = partOf(step.target);
          const rect = element.getBoundingClientRect();
          const start = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          const axis = axisOf(element);
          const group = groupRect();
          drag = {
            element,
            start,
            axis,
            length: axis === "x" ? group.width : group.height,
            percent: 0,
          };
          pointer(element, "pointerdown", start, 1);
          break;
        }
        case "dragBy": {
          const delta = step.value;
          if (typeof delta !== "number") {
            throw new Unsupported(`dragBy ${JSON.stringify(delta)}`);
          }
          if (drag === undefined) {
            break; // no drag in the primitive either
          }
          drag.percent += delta;
          pointer(drag.element, "pointermove", at(drag.percent), 1);
          break;
        }
        case "dragEnd":
        case "dragCancel": {
          if (drag === undefined) {
            break;
          }
          pointer(
            drag.element,
            step.event === "dragCancel" ? "pointercancel" : "pointerup",
            at(drag.percent),
            0,
          );
          drag = undefined;
          break;
        }
        case "prop":
          mounted.setProp(step.prop ?? "", step.value);
          break;
        case "hover":
          await userEvent.hover(partOf(step.target));
          break;
        case "unhover":
          await userEvent.unhover(partOf(step.target));
          break;
        default:
          throw new Unsupported(`event ${step.event}`);
      }
      await settle();
    },
    observer: {
      focus: () => mounted.focus?.() ?? activePart(),
      attr: (target, name) => {
        if (name.startsWith("data-")) {
          throw new Unsupported(`styling hook ${name}`);
        }
        const value = partOf(target).getAttribute(name);
        if (value === null) {
          return null;
        }
        return value === "" && BOOLEAN_ATTRS.has(name) ? "true" : value;
      },
      visible: () => [],
      events: (name) => mounted.events.get(name) ?? [],
      ...(mounted.value === undefined ? {} : { value: mounted.value }),
    },
    dispose: mounted.dispose,
  };
};
