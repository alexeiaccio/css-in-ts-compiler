import { flush } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { KANBAN_LABEL, type MountedKanban, mountKanban } from "./kanban.fixture.tsx";

const settle = async (): Promise<void> => {
  flush();
  await Promise.resolve();
  flush();
};

const live: MountedKanban[] = [];

const mounted = (): MountedKanban => {
  const instance = mountKanban();
  live.push(instance);
  return instance;
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

const required = <T extends Element>(parent: ParentNode, selector: string): T => {
  const element = parent.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`kanban: no ${selector}`);
  }
  return element;
};

const columns = (root: ParentNode): ReadonlyArray<HTMLElement> => [
  ...root.querySelectorAll<HTMLElement>("[data-column]"),
];

const column = (root: ParentNode, id: string): HTMLElement =>
  required(root, `[data-column="${id}"]`);

const labels = (root: ParentNode, id: string): ReadonlyArray<string> =>
  [...column(root, id).querySelectorAll<HTMLElement>("[data-card]")].map(
    (card) => required(card, "[data-part='kanban-card-label']").textContent ?? "",
  );

const cardByLabel = (root: ParentNode, label: string): HTMLElement => {
  const card = [...root.querySelectorAll<HTMLElement>("[data-card]")].find(
    (element) => required(element, "[data-part='kanban-card-label']").textContent === label,
  );
  if (card === undefined) {
    throw new Error(`kanban: no card ${label}`);
  }
  return card;
};

const centre = (element: Element): { readonly x: number; readonly y: number } => {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

const pointer = (
  target: Element,
  type: string,
  at: { readonly x: number; readonly y: number },
): void => {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      clientX: at.x,
      clientY: at.y,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
    }),
  );
};

const drag = async (
  card: HTMLElement,
  at: { readonly x: number; readonly y: number },
): Promise<void> => {
  pointer(card, "pointerdown", centre(card));
  pointer(card, "pointermove", at);
  await settle();
  pointer(card, "pointerup", at);
  await settle();
};

const press = async (element: HTMLElement, key: string): Promise<void> => {
  element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  await settle();
};

describe("Kanban", () => {
  it("renders three named columns and the cards they start with", async () => {
    const { root } = mounted();
    await settle();

    expect(columns(root).map((element) => element.getAttribute("data-column"))).toEqual([
      "todo",
      "doing",
      "done",
    ]);
    for (const element of columns(root)) {
      expect(element.getAttribute("role")).toBe("group");
      expect(element.getAttribute("aria-label")).toBeDefined();
    }
    expect(labels(root, "todo")).toEqual(["Write the spec", "Shape the API", "Empty states"]);
    expect(labels(root, "doing")).toEqual(["Drag a card", "Space, arrows, Enter"]);
    expect(labels(root, "done")).toEqual(["Ship 0.49"]);
    expect(root.textContent).toContain("6 cards");
    expect(required(root, '[data-part="status"]').textContent).toBe("");
  });

  it("drags a card into another column, at the index the measured boxes pick", async () => {
    const { root, calls } = mounted();
    await settle();

    const card = cardByLabel(root, "Write the spec");
    const done = column(root, "done");
    const last = required<HTMLElement>(done, "[data-card]");
    const below = { x: centre(done).x, y: last.getBoundingClientRect().bottom + 6 };

    pointer(card, "pointerdown", centre(card));
    pointer(card, "pointermove", below);
    await settle();
    expect(done.getAttribute("data-drop-column")).toBe("target");
    expect(card.getAttribute("data-drop-target")).toBe("true");
    expect(last.getAttribute("data-drop-index")).toBe("0");

    pointer(card, "pointerup", below);
    await settle();

    expect(labels(root, "todo")).toEqual(["Shape the API", "Empty states"]);
    expect(labels(root, "done")).toEqual(["Ship 0.49", "Write the spec"]);
    expect(calls()).toHaveLength(1);
    expect(calls()[0]).toMatchObject({ card: "spec", column: "done", index: 1 });
    expect(root.querySelectorAll("[data-drop-column]")).toHaveLength(0);
  });

  it("reorders inside one column", async () => {
    const { root, calls } = mounted();
    await settle();

    const card = cardByLabel(root, "Write the spec");
    const todo = column(root, "todo");
    const last = [...todo.querySelectorAll("[data-card]")].at(-1);
    if (last === undefined) {
      throw new Error("kanban: no last card");
    }
    await drag(card, { x: centre(todo).x, y: last.getBoundingClientRect().bottom + 4 });

    expect(labels(root, "todo")).toEqual(["Shape the API", "Empty states", "Write the spec"]);
    expect(calls()).toHaveLength(1);
    expect(calls()[0]).toMatchObject({ card: "spec", column: "todo", index: 2 });
  });

  it("walks the same states with Space, the arrows and Enter, and says where the card would land", async () => {
    const { root, calls } = mounted();
    await settle();

    const card = cardByLabel(root, "Write the spec");
    card.focus();
    await settle();
    await press(card, " ");
    const status = required(root, '[data-part="status"]');
    expect(status.getAttribute("role")).toBe("status");
    expect(status.textContent).toContain(
      `${KANBAN_LABEL}. Write the spec to Todo, position 1 of 3`,
    );

    await press(card, "ArrowRight");
    expect(column(root, "doing").getAttribute("data-drop-column")).toBe("target");
    expect(status.textContent).toContain("Write the spec to Doing, position 1 of 3");

    await press(card, "ArrowDown");
    expect(status.textContent).toContain("Doing, position 2 of 3");
    await press(card, "Enter");
    await settle();

    expect(labels(root, "doing")).toEqual([
      "Drag a card",
      "Write the spec",
      "Space, arrows, Enter",
    ]);
    expect(calls()).toHaveLength(1);
    expect(status.textContent).toBe("");
    expect(document.activeElement).toBe(cardByLabel(root, "Write the spec"));
  });

  it("Escape leaves the board where it was, and Reset puts it back after a move", async () => {
    const { root, calls } = mounted();
    await settle();

    const card = cardByLabel(root, "Shape the API");
    await press(card, " ");
    await press(card, "ArrowLeft");
    await press(card, "Escape");
    expect(calls()).toEqual([]);
    expect(labels(root, "todo")).toEqual(["Write the spec", "Shape the API", "Empty states"]);

    const done = column(root, "done");
    await drag(cardByLabel(root, "Empty states"), {
      x: centre(done).x,
      y: done.getBoundingClientRect().bottom - 4,
    });
    expect(labels(root, "done")).toEqual(["Ship 0.49", "Empty states"]);

    required<HTMLButtonElement>(root, "footer button, button")?.click();
    const reset = [...root.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent === "Reset",
    );
    reset?.click();
    await settle();
    expect(labels(root, "done")).toEqual(["Ship 0.49"]);
    expect(labels(root, "todo")).toEqual(["Write the spec", "Shape the API", "Empty states"]);
    expect(calls()).toHaveLength(1);
  });
});
