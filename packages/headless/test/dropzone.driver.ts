import { type ActionStep, type Driver, Unsupported } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import {
  DROPZONE_BATCHES,
  type DropZoneBatch,
  type DropZoneConfig,
} from "@cssints/apg-specs/patterns/dropzone.bridge";
import { flush } from "solid-js";

/**
 * The DOM side of the drop zone bridge: real `DragEvent`s with a real
 * `DataTransfer`. The driver keeps the nesting level the primitive's counter
 * has (0..2, the fixture has one child) and the disabled flag, so a `dragEnter`
 * the browser could not deliver (already at the deepest element) or a leave the
 * primitive ignores (disabled) is not dispatched either. `dragLeave` on the
 * zone is the user leaving the zone: the browser fires the inner element's
 * leave first, so the driver does too.
 */
const MAX_DEPTH = 2;

const fileOf = (name: string, type: string, bytes: number): File =>
  new File([new Uint8Array(bytes)], name, { type });

const transferOf = (batch: DropZoneBatch): DataTransfer => {
  const transfer = new DataTransfer();
  for (const file of DROPZONE_BATCHES[batch].files) {
    transfer.items.add(fileOf(file.name, file.type, file.bytes));
  }
  return transfer;
};

const settle = (): Promise<void> => {
  flush();
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};

export const dropzoneDriver = (mounted: Mounted, config: DropZoneConfig): Driver => {
  const { root } = mounted;

  const partOf = (target: string | undefined): HTMLElement => {
    const element = root.querySelector<HTMLElement>(`[data-part="${target ?? ""}"]`);
    if (element === null) {
      throw new Unsupported(`part ${target ?? ""}`);
    }
    return element;
  };

  // the drag surface: the zone and its one child (a grandchild is the same column)
  const dragPart = (target: string | undefined): HTMLElement => {
    if (target !== "zone" && target !== "child") {
      throw new Unsupported(`part ${target ?? ""}`);
    }
    return partOf(target);
  };

  const drag = (element: HTMLElement, type: string, batch: DropZoneBatch = "accepted"): void => {
    element.dispatchEvent(
      new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transferOf(batch) }),
    );
  };

  // the primitive's raw depth, and the host's disabled prop
  let level = 0;
  let off = config.disabled;

  return {
    perform: async (step: ActionStep) => {
      switch (step.event) {
        case "dragEnter": {
          const element = dragPart(step.target);
          if (!off && level < MAX_DEPTH) {
            drag(element, "dragenter");
            level += 1;
          }
          break;
        }
        case "dragOver":
          // preventDefault only; the primitive never changes state here
          drag(dragPart(step.target), "dragover");
          break;
        case "dragLeave": {
          const target = step.target;
          dragPart(target);
          if (!off && level > 0) {
            if (target === "child") {
              drag(dragPart("child"), "dragleave");
              level -= 1;
            } else {
              // leaving the zone from inside: the inner element's leave, then the zone's;
              // one turn apart, as the browser delivers them (the primitive's writes land per turn)
              while (level > 0) {
                drag(dragPart(level === MAX_DEPTH ? "child" : "zone"), "dragleave");
                level -= 1;
                await settle();
              }
            }
          }
          break;
        }
        case "drop": {
          const batch = step.value;
          if (batch !== "accepted" && batch !== "rejected" && batch !== "empty") {
            throw new Unsupported(`drop ${JSON.stringify(batch)}`);
          }
          dragPart(step.target ?? "zone");
          drag(dragPart("zone"), "drop", batch);
          level = 0;
          break;
        }
        case "prop":
          mounted.setProp(step.prop ?? "", step.value);
          if (step.prop === "disabled") {
            off = step.value === true;
          }
          break;
        default:
          throw new Unsupported(`event ${step.event}`);
      }
      await settle();
    },
    observer: {
      focus: () => null,
      attr: (target, name) => {
        const value = partOf(target).getAttribute(name);
        return value === null ? null : value;
      },
      visible: () => [],
      events: (name) => mounted.events.get(name) ?? [],
      ...(mounted.value === undefined ? {} : { value: mounted.value }),
    },
    dispose: mounted.dispose,
  };
};
