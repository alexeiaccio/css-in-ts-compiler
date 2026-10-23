import { describe, expect, it } from "vite-plus/test";
import { mountCanvas } from "./canvas.fixture";
import { userEvent } from "vite-plus/test/browser";

// effects-of-atmosphere-0jlk, the editing contract from the `yvdy` decision. The primitive owns
// the keyboard side (an IME guard, focus-out ending editing, the layer's `user-select: none`); the
// host owns its editor element - it renders one inside the node and focuses it when the primitive
// says the node is being edited. The fixture is that host, so these tests exercise the two halves
// together. Keyboard is outside the Quint specs, hence a DOM test rather than a scenario.

const frames = async (count: number): Promise<void> => {
  for (let frame = 0; frame < count; frame += 1) {
    await new Promise((resolve) => {
      requestAnimationFrame(resolve);
    });
  }
};

const nodes = [
  { id: "a", x: 100, y: 100, width: 100, height: 60, label: "Alpha" },
  { id: "b", x: 300, y: 100, width: 100, height: 60, label: "Beta" },
];

const shell = (root: HTMLElement, id: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[data-part="node${id}"]`);
const editor = (root: HTMLElement, id: string): HTMLTextAreaElement | null =>
  root.querySelector<HTMLTextAreaElement>(`[data-part="editor${id}"]`);

describe("createCanvas text editing contract (real Chromium)", () => {
  it("F2 enters editing, the host focuses its editor, and the layer blocks text selection", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes, editor: true });
    try {
      shell(mounted.root, "a")?.focus({ preventScroll: true });
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard("{F2}");
      await frames(2);

      expect(mounted.canvas.state().editing).toBe("a");
      const field = editor(mounted.root, "a");
      expect(field).not.toBeNull();
      // the host focused its editor when the primitive said the node was editing
      expect(document.activeElement).toBe(field);
      // and the editor is not a second tab stop
      expect(field?.getAttribute("tabindex")).toBe("-1");
      expect(field?.style.getPropertyValue("user-select")).toBe("text");
      expect(
        mounted.root
          .querySelector<HTMLElement>('[data-part="layer"]')
          ?.style.getPropertyValue("user-select"),
      ).toBe("none");
    } finally {
      mounted.dispose();
    }
  });

  it("Tab from the editor leaves the node and ends editing, so native order continues", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes, editor: true });
    try {
      shell(mounted.root, "a")?.focus({ preventScroll: true });
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard("{F2}");
      await frames(2);
      expect(mounted.canvas.state().editing).toBe("a");

      await userEvent.tab();
      await frames(2);
      expect(mounted.canvas.state().editing).toBeNull();
      // the next node in spatial order (rows by y, then x) took the focus
      expect(document.activeElement).toBe(shell(mounted.root, "b"));
    } finally {
      mounted.dispose();
    }
  });

  it("Escape ends editing and puts focus back on the node", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes, editor: true });
    try {
      shell(mounted.root, "a")?.focus({ preventScroll: true });
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard("{F2}");
      await frames(2);
      expect(document.activeElement).toBe(editor(mounted.root, "a"));

      await userEvent.keyboard("{Escape}");
      await frames(2);
      expect(mounted.canvas.state().editing).toBeNull();
      expect(editor(mounted.root, "a")).toBeNull();
      expect(document.activeElement).toBe(shell(mounted.root, "a"));
    } finally {
      mounted.dispose();
    }
  });

  it("a key pressed during IME composition does not act", async () => {
    const mounted = mountCanvas({ kind: "camera", nodes, editor: true });
    try {
      shell(mounted.root, "a")?.focus({ preventScroll: true });
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard("{F2}");
      await frames(2);
      const field = editor(mounted.root, "a");
      expect(field).not.toBeNull();

      // `isComposing`, the standard marker ...
      field?.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          isComposing: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      await frames(2);
      expect(mounted.canvas.state().editing).toBe("a");

      // ... and keyCode 229, its legacy equivalent
      const legacy = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(legacy, "keyCode", { value: 229 });
      field?.dispatchEvent(legacy);
      await frames(2);
      expect(mounted.canvas.state().editing).toBe("a");

      // a plain Escape still leaves
      await userEvent.keyboard("{Escape}");
      await frames(2);
      expect(mounted.canvas.state().editing).toBeNull();
    } finally {
      mounted.dispose();
    }
  });
});
