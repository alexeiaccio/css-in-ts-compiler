import { type CanvasMounted, mountCanvas } from "./canvas.fixture";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

// A card is not only a label: a host puts a button, a field or a link in it, and that control owns
// its own press. The canvas must stay idle there - no selection, no drag - the same way it ignores
// a non-primary button, because a press on a control is not a gesture. react-resizable-panels
// learned this for its tabs in 4.22.1; `data-canvas-ignore` is the host's opt-out for the rest.
// The differential walk cannot see it: it drives `pointerDown` directly, while this rule lives in
// the DOM adapter, where the event's target is known.

const NODE = { id: "a", x: 100, y: 100, width: 200, height: 100, label: "Alpha" };

const settle = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });

const part = (mounted: CanvasMounted, name: string): HTMLElement => {
  const element = mounted.root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (element === null) {
    throw new Error(`no part ${name}`);
  }
  return element;
};

const press = (
  element: HTMLElement,
  type: string,
  at: { readonly x: number; readonly y: number },
): void => {
  element.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      button: 0,
      clientX: at.x,
      clientY: at.y,
    }),
  );
};

describe("createCanvas controls (real DOM)", () => {
  it("a press on a control inside a node selects nothing and starts no drag", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: [NODE], controls: true });
    try {
      await settle();
      const { canvas } = mounted;
      for (const name of ["buttona", "inputa", "ignorea"]) {
        await userEvent.click(part(mounted, name));
        expect(canvas.peek().mode).toBe("idle");
        expect(canvas.peek().selection).toEqual([]);
        expect(canvas.peek().owner).toBeNull();
      }
      // and a press that keeps moving over the control is still not a drag: the card stays put
      const button = part(mounted, "buttona");
      const box = button.getBoundingClientRect();
      const from = { x: box.left + 2, y: box.top + 2 };
      press(button, "pointerdown", from);
      press(button, "pointermove", { x: from.x + 80, y: from.y });
      press(button, "pointerup", { x: from.x + 80, y: from.y });
      await settle();
      expect(canvas.position("a")).toEqual({ x: 100, y: 100 });
      expect(canvas.peek().selection).toEqual([]);
      expect(canvas.peek().mode).toBe("idle");
    } finally {
      mounted.dispose();
    }
  });

  it("a press beside the controls is the canvas's: it selects and drags the card", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes: [NODE], controls: true });
    try {
      await settle();
      const { canvas } = mounted;
      // the node's own box, below the label and its controls
      const shell = part(mounted, "nodea");
      const box = shell.getBoundingClientRect();
      const at = { x: box.left + 6, y: box.bottom - 6 };
      press(shell, "pointerdown", at);
      expect(canvas.peek().mode).toBe("pointing");
      expect(canvas.peek().selection).toEqual(["a"]);
      press(shell, "pointermove", { x: at.x + 60, y: at.y });
      await settle();
      expect(canvas.peek().mode).toBe("dragging");
      press(shell, "pointerup", { x: at.x + 60, y: at.y });
      await settle();
      expect(canvas.position("a")).toEqual({ x: 160, y: 100 });
    } finally {
      mounted.dispose();
    }
  });
});
