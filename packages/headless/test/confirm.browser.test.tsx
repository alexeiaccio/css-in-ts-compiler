import { afterEach, describe, expect, it } from "vite-plus/test";
import { type Confirm, ConfirmPendingError, createConfirm } from "../src/confirm";
import { flush } from "solid-js";
import { render } from "@solidjs/web";

interface Mounted {
  readonly api: Confirm;
  readonly changes: boolean[];
  readonly part: (name: string) => HTMLElement;
}

const disposers: (() => void)[] = [];

afterEach(() => {
  for (const dispose of disposers.splice(0)) {
    dispose();
  }
  document.body.replaceChildren();
});

const mount = (id = "c"): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const changes: boolean[] = [];
  let api: Confirm | undefined;
  const dispose = render(() => {
    const confirm = createConfirm({ id, onOpenChange: (open) => changes.push(open) });
    api = confirm;
    return (
      <>
        <button
          data-part="invoker"
          {...confirm.triggerProps}
          onClick={() => void confirm.confirm({ title: "Delete?" }).catch(() => {})}
        >
          Delete
        </button>
        <div data-part="backdrop" {...confirm.backdropProps} style={{ height: "20px" }} />
        <div data-part="dialog" {...confirm.dialogProps}>
          <h2 data-part="title" {...confirm.titleProps}>
            {confirm.request()?.title}
          </h2>
          <p data-part="description" {...confirm.descriptionProps}>
            {confirm.request()?.description}
          </p>
          <button data-part="confirm" {...confirm.confirmProps}>
            {confirm.request()?.confirmLabel}
          </button>
          <button data-part="cancel" {...confirm.cancelProps}>
            {confirm.request()?.cancelLabel}
          </button>
        </div>
      </>
    );
  }, root);
  disposers.push(dispose);
  const part = (name: string): HTMLElement => {
    const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
    if (element === null) {
      throw new Error(`no part ${name}`);
    }
    return element;
  };
  if (api === undefined) {
    throw new Error("not mounted");
  }
  return { api, changes, part };
};

const settled = async (): Promise<void> => {
  flush();
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

const keydown = (element: HTMLElement, key: string): void => {
  element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
};

describe("createConfirm", () => {
  it("starts closed, as an alertdialog with a name and a description", async () => {
    const { part } = mount();
    await settled();
    const dialog = part("dialog");
    expect(dialog.hidden).toBe(true);
    expect(dialog.getAttribute("role")).toBe("alertdialog");
    expect(dialog.getAttribute("aria-labelledby")).toBe(part("title").id);
    expect(dialog.getAttribute("aria-describedby")).toBe(part("description").id);
    expect(part("invoker").getAttribute("aria-expanded")).toBe("false");
    expect(part("invoker").getAttribute("aria-controls")).toBe(dialog.id);
  });

  it("opens with the request, focuses Cancel and fires onOpenChange", async () => {
    const { api, changes, part } = mount();
    const answer = api.confirm({
      title: "Delete post?",
      description: "It cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    await settled();
    expect(part("dialog").hidden).toBe(false);
    expect(part("dialog").getAttribute("aria-modal")).toBe("true");
    expect(part("title").textContent).toBe("Delete post?");
    expect(part("description").hidden).toBe(false);
    expect(part("description").textContent).toBe("It cannot be undone.");
    expect(part("confirm").textContent).toBe("Delete");
    expect(part("cancel").textContent).toBe("Cancel");
    expect(api.request()?.destructive).toBe(true);
    expect(document.activeElement).toBe(part("cancel"));
    expect(part("invoker").getAttribute("aria-expanded")).toBe("true");
    expect(changes).toEqual([true]);
    part("cancel").click();
    expect(await answer).toBe(false);
  });

  it("keeps aria-describedby on an element that is hidden when there is no description", async () => {
    const { api, part } = mount();
    const answer = api.confirm({ title: "Sure?" });
    await settled();
    expect(part("dialog").getAttribute("aria-describedby")).toBe(part("description").id);
    expect(part("description").hidden).toBe(true);
    part("cancel").click();
    await answer;
  });

  it("resolves true on confirm and returns focus to the invoker", async () => {
    const { api, changes, part } = mount();
    part("invoker").focus();
    const answer = api.confirm({ title: "Go?" });
    await settled();
    expect(document.activeElement).toBe(part("cancel"));
    part("confirm").click();
    expect(await answer).toBe(true);
    await settled();
    expect(part("dialog").hidden).toBe(true);
    expect(document.activeElement).toBe(part("invoker"));
    expect(changes).toEqual([true, false]);
  });

  it("resolves false on cancel and returns focus", async () => {
    const { api, changes, part } = mount();
    part("invoker").focus();
    const answer = api.confirm({ title: "Go?" });
    await settled();
    part("cancel").click();
    expect(await answer).toBe(false);
    await settled();
    expect(part("dialog").hidden).toBe(true);
    expect(document.activeElement).toBe(part("invoker"));
    expect(changes).toEqual([true, false]);
  });

  it("resolves false on Escape and returns focus", async () => {
    const { api, changes, part } = mount();
    part("invoker").focus();
    const answer = api.confirm({ title: "Go?" });
    await settled();
    keydown(part("cancel"), "Escape");
    expect(await answer).toBe(false);
    await settled();
    expect(part("dialog").hidden).toBe(true);
    expect(document.activeElement).toBe(part("invoker"));
    expect(changes).toEqual([true, false]);
  });

  it("resolves false on a backdrop click and returns focus", async () => {
    const { api, changes, part } = mount();
    part("invoker").focus();
    const answer = api.confirm({ title: "Go?" });
    await settled();
    part("backdrop").click();
    expect(await answer).toBe(false);
    await settled();
    expect(part("dialog").hidden).toBe(true);
    expect(document.activeElement).toBe(part("invoker"));
    expect(changes).toEqual([true, false]);
  });

  it("rejects a second request while one is pending and leaves the first alone", async () => {
    const { api, changes, part } = mount();
    const first = api.confirm({ title: "First" });
    await settled();
    await expect(api.confirm({ title: "Second" })).rejects.toBeInstanceOf(ConfirmPendingError);
    await settled();
    expect(part("title").textContent).toBe("First");
    expect(changes).toEqual([true]);
    part("confirm").click();
    expect(await first).toBe(true);
  });

  it("takes a new request once the last one settled, with its own text", async () => {
    const { api, part } = mount();
    const first = api.confirm({ title: "First" });
    await settled();
    part("cancel").click();
    expect(await first).toBe(false);
    const second = api.confirm({ title: "Second", cancelLabel: "Keep" });
    await settled();
    expect(part("title").textContent).toBe("Second");
    expect(part("cancel").textContent).toBe("Keep");
    part("confirm").click();
    expect(await second).toBe(true);
  });

  it("takes the host's labels, and falls back to the English defaults", async () => {
    const { api, part } = mount();
    const first = api.confirm({
      title: "Удалить?",
      confirmLabel: "Удалить",
      cancelLabel: "Отмена",
    });
    await settled();
    expect(part("confirm").textContent).toBe("Удалить");
    expect(part("cancel").textContent).toBe("Отмена");
    part("cancel").click();
    await first;
    const second = api.confirm({ title: "Go?", confirmLabel: undefined, cancelLabel: undefined });
    await settled();
    expect(part("confirm").textContent).toBe("Confirm");
    expect(part("cancel").textContent).toBe("Cancel");
    part("cancel").click();
    await second;
  });

  describe("the dialog shell", () => {
    it("wraps Tab from the last control to the first, and Shift+Tab back", async () => {
      const { api, part } = mount();
      const answer = api.confirm({ title: "Go?" });
      await settled();
      // the dialog's order is confirm, cancel; cancel has the focus
      const forward = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      part("cancel").dispatchEvent(forward);
      expect(forward.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(part("confirm"));
      const backward = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      part("confirm").dispatchEvent(backward);
      expect(backward.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(part("cancel"));
      part("cancel").click();
      await answer;
    });

    it("leaves Tab to the browser between the ends", async () => {
      const { api, part } = mount();
      const answer = api.confirm({ title: "Go?" });
      await settled();
      part("confirm").focus();
      const forward = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      part("confirm").dispatchEvent(forward);
      expect(forward.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(part("confirm"));
      part("cancel").click();
      await answer;
    });

    it("pulls focus back in when it escaped the dialog", async () => {
      const { api, part } = mount();
      const answer = api.confirm({ title: "Go?" });
      await settled();
      part("invoker").focus();
      keydown(part("invoker"), "Tab");
      expect(document.activeElement).toBe(part("confirm"));
      part("invoker").focus();
      part("invoker").dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(document.activeElement).toBe(part("cancel"));
      part("cancel").click();
      await answer;
    });

    it("answers false on Escape when focus is outside the dialog", async () => {
      const { api, changes, part } = mount();
      part("invoker").focus();
      const answer = api.confirm({ title: "Go?" });
      await settled();
      part("invoker").focus();
      keydown(document.body, "Escape");
      expect(await answer).toBe(false);
      await settled();
      expect(part("dialog").hidden).toBe(true);
      expect(document.activeElement).toBe(part("invoker"));
      expect(changes).toEqual([true, false]);
    });

    it("keeps Escape from reaching the elements around the dialog", async () => {
      const { api, part } = mount();
      const seen: string[] = [];
      const spy = (event: KeyboardEvent) => seen.push(event.key);
      document.body.addEventListener("keydown", spy);
      const answer = api.confirm({ title: "Go?" });
      await settled();
      keydown(part("cancel"), "Escape");
      await answer;
      document.body.removeEventListener("keydown", spy);
      expect(seen).toEqual([]);
    });

    it("ignores the document's keys while closed", async () => {
      const { part } = mount();
      await settled();
      part("invoker").focus();
      const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      part("invoker").dispatchEvent(tab);
      expect(tab.defaultPrevented).toBe(false);
      expect(document.activeElement).toBe(part("invoker"));
    });

    it("locks the document's scroll while open and restores it on every way out", async () => {
      const root = document.documentElement;
      root.style.overflow = "scroll";
      try {
        const { api, part } = mount();
        for (const close of [
          () => part("cancel").click(),
          () => part("confirm").click(),
          () => keydown(part("cancel"), "Escape"),
          () => part("backdrop").click(),
        ]) {
          const answer = api.confirm({ title: "Go?" });
          await settled();
          expect(root.style.overflow).toBe("hidden");
          close();
          await answer;
          await settled();
          expect(root.style.overflow).toBe("scroll");
        }
      } finally {
        root.style.overflow = "";
      }
    });

    it("releases the scroll lock and the key listener when the owner is disposed open", async () => {
      const root = document.documentElement;
      const { api } = mount();
      const answer = api.confirm({ title: "Go?" });
      await settled();
      expect(root.style.overflow).toBe("hidden");
      for (const dispose of disposers.splice(0)) {
        dispose();
      }
      expect(await answer).toBe(false);
      await settled();
      expect(root.style.overflow).toBe("");
      const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      document.body.dispatchEvent(tab);
      expect(tab.defaultPrevented).toBe(false);
    });

    it("stacks: the last opened takes Escape and Tab, and the lock outlives the first to close", async () => {
      const root = document.documentElement;
      root.style.overflow = "auto";
      try {
        const lower = mount("lower");
        const upper = mount("upper");
        const first = lower.api.confirm({ title: "Lower" });
        await settled();
        const second = upper.api.confirm({ title: "Upper" });
        await settled();
        expect(root.style.overflow).toBe("hidden");
        expect(document.activeElement).toBe(upper.part("cancel"));

        // Tab is the upper dialog's: it wraps there, and the lower one is not touched
        const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        upper.part("cancel").dispatchEvent(tab);
        expect(document.activeElement).toBe(upper.part("confirm"));

        keydown(document.body, "Escape");
        expect(await second).toBe(false);
        await settled();
        expect(lower.part("dialog").hidden).toBe(false);
        expect(lower.changes).toEqual([true]);
        expect(root.style.overflow).toBe("hidden");

        keydown(document.body, "Escape");
        expect(await first).toBe(false);
        await settled();
        expect(root.style.overflow).toBe("auto");
      } finally {
        root.style.overflow = "";
      }
    });
  });

  it("answers false when the owner is disposed with a request pending", async () => {
    const { api } = mount();
    const answer = api.confirm({ title: "Go?" });
    await settled();
    for (const dispose of disposers.splice(0)) {
      dispose();
    }
    expect(await answer).toBe(false);
  });
});
