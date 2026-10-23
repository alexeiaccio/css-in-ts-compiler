import {
  type ActionStep,
  type Driver,
  type Json,
  Unsupported,
} from "@cssints/apg-specs/src/scenario";
import {
  HOST_POSITIONS,
  NODES,
  PALETTE,
  VIEWPORTS,
  ZOOM_LEVELS,
  anchorPoint,
  formatValue,
  parseCameraOp,
  parsePointerOp,
} from "@cssints/apg-specs/src/canvas/canvas.bridge";
import { ZMAX, ZMIN, ZONE } from "../src";
import type { CanvasMounted } from "./canvas.fixture";

/**
 * The DOM side of the canvas scenario bridge. Camera ops call the primitive's camera methods;
 * pointer ops are dispatched as real `PointerEvent`s on the viewport element, at the palette
 * position, so the whole path (event props -> local coordinates -> machine -> rendered styles) runs.
 * Observations read the DOM (attributes, inline custom properties, the live region, real focus);
 * `state` reads the primitive's own snapshot.
 */
export interface CanvasDriverOptions {
  readonly kind: "camera" | "pointer";
}

// Solid flushes on a microtask and runs effects after the DOM update; a task boundary is enough.
const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const NODE_PART = /^node/;

export const canvasDriver = (mounted: CanvasMounted, options: CanvasDriverOptions): Driver => {
  const { root, canvas } = mounted;

  const partOf = (name: string): HTMLElement => {
    const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
    if (element === null) {
      throw new Unsupported(`part ${name}`);
    }
    return element;
  };

  const lastAt = new Map<number, readonly [number, number]>();

  const dispatch = (type: string, pointerId: number, at: readonly [number, number]): void => {
    const viewport = partOf("viewport");
    const rect = viewport.getBoundingClientRect();
    lastAt.set(pointerId, at);
    viewport.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId,
        pointerType: "mouse",
        isPrimary: true,
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
        clientX: rect.left + viewport.clientLeft + at[0],
        clientY: rect.top + viewport.clientTop + at[1],
      }),
    );
  };

  const pointerStep = (step: ActionStep): void => {
    const op = parsePointerOp(step);
    switch (op.op) {
      case "down":
        dispatch("pointerdown", op.pointer, PALETTE[op.at] ?? [0, 0]);
        break;
      case "move":
        dispatch("pointermove", op.pointer, PALETTE[op.at] ?? [0, 0]);
        break;
      case "up":
        dispatch("pointerup", op.pointer, lastAt.get(op.pointer) ?? [0, 0]);
        break;
      case "cancel":
        dispatch("pointercancel", op.pointer, lastAt.get(op.pointer) ?? [0, 0]);
        break;
      case "shift":
        canvas.setShift(op.on);
        break;
      case "space":
        canvas.setSpace(op.on);
        break;
      case "snap":
        canvas.setSnap(op.on);
        break;
      case "marquee":
        canvas.setMarqueeMode(op.mode);
        break;
      case "zoom":
        canvas.zoomTo(Math.round((ZOOM_LEVELS[op.level] ?? 1) * ZONE));
        break;
      case "edit":
        canvas.toggleEdit();
        break;
      case "place": {
        const [x, y] = HOST_POSITIONS[op.position] ?? [0, 0];
        canvas.setGeometry([{ id: NODES[op.node]?.id ?? "", x, y }]);
        break;
      }
    }
  };

  const cameraStep = (step: ActionStep): void => {
    const op = parseCameraOp(step);
    const { width, height } = canvas.peek().viewport;
    switch (op.op) {
      case "resize": {
        const [w, h] = VIEWPORTS[op.viewport] ?? [width, height];
        canvas.resize(w, h);
        break;
      }
      case "motion":
        canvas.setReducedMotion(op.reduced);
        break;
      case "pan":
        canvas.panBy(op.dx, op.dy);
        break;
      case "zoom":
        canvas.zoomBy(op.factor, anchorPoint(op.anchor, width, height));
        break;
      case "zoomLimit":
        canvas.zoomTo(op.limit === "min" ? ZMIN : ZMAX, anchorPoint(op.anchor, width, height));
        break;
      case "tween":
        canvas.animateTo(
          op.goal.kind === "centre"
            ? { kind: "centre", x: op.goal.x, y: op.goal.y }
            : {
                kind: "zoom",
                zoom: op.goal.zoom,
                anchor: anchorPoint(op.goal.anchor, width, height),
              },
        );
        break;
      case "tick":
        canvas.tick();
        break;
      case "cancelTween":
        canvas.cancelTween();
        break;
    }
  };

  const attr = (target: string, name: string): string | null => {
    if (target === "state") {
      // a JSON round trip: the snapshot is plain data, this gives it the `Json` record type
      const snapshot: Readonly<Record<string, Json>> = JSON.parse(JSON.stringify(canvas.peek()));
      if (!Object.hasOwn(snapshot, name)) {
        throw new Unsupported(`state ${name}`);
      }
      return formatValue(snapshot[name]);
    }
    const element = partOf(target);
    if (target === "live") {
      return element.textContent;
    }
    if (name.startsWith("--") || name === "content-visibility") {
      const value = element.style.getPropertyValue(name);
      return value === "" ? null : value;
    }
    return element.getAttribute(name);
  };

  return {
    perform: async (step) => {
      if (options.kind === "camera") {
        cameraStep(step);
      } else {
        pointerStep(step);
      }
      await settle();
    },
    observer: {
      focus: () => {
        const active = document.activeElement;
        const part =
          active instanceof HTMLElement ? active.closest<HTMLElement>("[data-part]") : null;
        const name = part?.dataset["part"] ?? "";
        return part !== null && root.contains(part) && NODE_PART.test(name) ? name : null;
      },
      attr,
      visible: () => [],
      events: (name) => mounted.events.get(name) ?? [],
    },
    dispose: mounted.dispose,
  };
};
