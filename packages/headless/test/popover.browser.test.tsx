import { type Popover, type PopoverPlacement, createPopover } from "../src/popover";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";

// Solid 2 delivers events through its delegated listener on a later turn.
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

interface MountOptions {
  readonly placement?: PopoverPlacement;
  readonly controlled?: boolean;
  readonly defaultOpen?: boolean;
}

const mount = (options: MountOptions = {}) => {
  const root = document.createElement("div");
  document.body.append(root);
  const [host, setHost] = createSignal(options.defaultOpen === true);
  const changes: boolean[] = [];
  let pageCount = 0;
  let triggerEl: HTMLButtonElement | undefined;
  let contentEl: HTMLDivElement | undefined;
  let detach: (() => void) | undefined;
  let api: Popover | undefined;

  const attachOnce = (): void => {
    if (triggerEl !== undefined && contentEl !== undefined && detach === undefined) {
      detach = api?.attach(triggerEl, contentEl);
    }
  };

  const dispose = render(() => {
    const popover = createPopover({
      id: "p",
      get placement() {
        return options.placement;
      },
      get open() {
        return options.controlled === true ? host() : undefined;
      },
      defaultOpen: options.defaultOpen,
      onOpenChange: (open) => {
        changes.push(open);
      },
    });
    api = popover;
    return (
      <>
        <button
          data-part="page"
          type="button"
          onClick={() => {
            pageCount += 1;
          }}
        >
          Page
        </button>
        <button
          data-part="trigger"
          {...popover.triggerProps}
          ref={(element) => {
            triggerEl = element;
            attachOnce();
          }}
        >
          Open
        </button>
        <div
          data-part="content"
          {...popover.contentProps}
          style={popover.contentStyle()}
          ref={(element) => {
            contentEl = element;
            attachOnce();
          }}
        >
          <div style={{ width: "180px", height: "80px" }}>
            <button data-part="inside" type="button">
              Inside
            </button>
          </div>
        </div>
      </>
    );
  }, root);

  const part = (name: string): HTMLElement => {
    const element = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
    if (element === null) {
      throw new Error(`no part ${name}`);
    }
    return element;
  };

  return {
    part,
    changes,
    setHost,
    pageCount: () => pageCount,
    dispose: () => {
      detach?.();
      dispose();
      root.remove();
    },
  };
};

const press = (element: HTMLElement): void => {
  element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
};

const escape = (element: HTMLElement): void => {
  element.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
  );
};

describe("createPopover", () => {
  it("wires the trigger and the content, closed and non-modal", async () => {
    const { part, dispose } = mount();
    await tick();
    const trigger = part("trigger");
    const content = part("content");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
    expect(content.getAttribute("role")).toBe("dialog");
    expect(content.getAttribute("aria-modal")).toBeNull();
    expect(content.getAttribute("tabindex")).toBe("-1");
    expect(content.hidden).toBe(true);
    dispose();
  });

  it("opens and closes on a trigger click", async () => {
    const { part, dispose } = mount();
    const trigger = part("trigger");
    const content = part("content");
    trigger.click();
    await tick();
    expect(content.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    trigger.click();
    await tick();
    expect(content.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    dispose();
  });

  it("moves focus into the content on open and returns it to the trigger on Escape", async () => {
    const { part, dispose } = mount();
    const trigger = part("trigger");
    trigger.focus();
    trigger.click();
    await tick();
    expect(document.activeElement).toBe(part("inside"));

    escape(part("inside"));
    await tick();
    expect(part("content").hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    dispose();
  });

  it("closes on an outside pointerdown without taking the focus back", async () => {
    const { part, dispose } = mount();
    part("trigger").click();
    await tick();
    const page = part("page");
    page.focus();
    press(page);
    await tick();
    expect(part("content").hidden).toBe(true);
    expect(document.activeElement).toBe(page);
    dispose();
  });

  it("leaves the page interactive: an outside button still takes its click", async () => {
    const { part, pageCount, dispose } = mount();
    part("trigger").click();
    await tick();
    const page = part("page");
    press(page);
    page.click();
    await tick();
    expect(pageCount()).toBe(1);
    expect(part("content").hidden).toBe(true);
    expect(document.activeElement).not.toBe(part("trigger"));
    dispose();
  });

  it("requests in controlled mode and leaves the open state to the host", async () => {
    const { part, changes, setHost, dispose } = mount({ controlled: true });
    part("trigger").click();
    await tick();
    expect(changes).toEqual([true]);
    expect(part("content").hidden).toBe(true);
    expect(part("trigger").getAttribute("aria-expanded")).toBe("false");

    setHost(true);
    await tick();
    expect(part("content").hidden).toBe(false);
    expect(part("trigger").getAttribute("aria-expanded")).toBe("true");
    dispose();
  });

  it("positions from the trigger's rect once it is open", async () => {
    const { part, dispose } = mount();
    part("trigger").click();
    await tick();
    await tick();
    const content = part("content");
    expect(content.style.position).toBe("absolute");
    expect(content.style.top.endsWith("px")).toBe(true);
    expect(content.style.left.endsWith("px")).toBe(true);
    dispose();
  });

  it("flips the placement when the room below is not there", () => {
    const popover = createPopover({ id: "p", placement: "bottom-start" });
    const content = { top: 0, left: 0, width: 180, height: 80 };
    const viewport = { width: 800, height: 600 };
    const room = { top: 100, left: 40, width: 60, height: 30 };
    const low = { top: 560, left: 40, width: 60, height: 30 };

    expect(popover.position(room, content, viewport)).toEqual({
      top: 134,
      left: 40,
      placement: "bottom-start",
    });
    expect(popover.position(low, content, viewport)).toEqual({
      top: 476,
      left: 40,
      placement: "top-start",
    });
  });

  it("centres a plain placement and keeps it in the viewport", () => {
    const popover = createPopover({ id: "p", placement: "bottom", offset: 8 });
    const content = { top: 0, left: 0, width: 180, height: 80 };
    const viewport = { width: 800, height: 600 };
    const clipped = popover.position(
      { top: 100, left: 0, width: 60, height: 30 },
      content,
      viewport,
    );
    expect(clipped.top).toBe(138);
    expect(clipped.left).toBe(0);
    expect(clipped.placement).toBe("bottom");

    const flipped = popover.position(
      { top: 500, left: 400, width: 60, height: 30 },
      content,
      viewport,
    );
    expect(flipped.top).toBe(412);
    expect(flipped.left).toBe(340);
    expect(flipped.placement).toBe("top");
  });
});
