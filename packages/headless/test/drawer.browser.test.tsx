import { type Drawer, type DrawerSide, createDrawer } from "../src/drawer";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";

// Solid 2 delivers events through its delegated listener on a later turn.
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

interface MountOptions {
  readonly side?: DrawerSide | undefined;
  readonly modal?: boolean | undefined;
  readonly dismissable?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly controlled?: boolean | undefined;
}

interface Mounted {
  readonly api: Drawer;
  readonly changes: boolean[];
  readonly pageClicks: () => number;
  readonly part: (name: string) => HTMLElement;
  readonly setHost: (value: boolean) => void;
  readonly dispose: () => void;
}

const disposers: (() => void)[] = [];

afterEach(() => {
  for (const dispose of disposers.splice(0)) {
    dispose();
  }
  document.body.replaceChildren();
});

const mount = (options: MountOptions = {}): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const [host, setHost] = createSignal(options.defaultOpen === true);
  const changes: boolean[] = [];
  let pageClicks = 0;
  let api: Drawer | undefined;

  const dispose = render(() => {
    const drawer = createDrawer({
      side: options.side,
      modal: options.modal,
      dismissable: options.dismissable,
      defaultOpen: options.defaultOpen,
      get open() {
        return options.controlled === true ? host() : undefined;
      },
      labelledby: "drawer-title",
      onOpenChange: (open) => {
        changes.push(open);
      },
    });
    api = drawer;
    return (
      <>
        <button
          data-part="page"
          type="button"
          onClick={() => {
            pageClicks += 1;
          }}
        >
          Page
        </button>
        <button data-part="trigger" type="button" {...drawer.triggerProps}>
          Menu
        </button>
        <div data-part="backdrop" {...drawer.backdropProps} />
        <div
          data-part="content"
          {...drawer.contentProps}
          style={{ position: "fixed", width: "200px", height: "300px" }}
        >
          <h2 id="drawer-title">Site</h2>
          <div data-part="handle" {...drawer.handleProps} />
          <div data-part="scroller" style={{ overflow: "auto", height: "40px" }}>
            <button data-part="first" type="button">
              First
            </button>
            <button data-part="second" type="button">
              Second
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
  if (api === undefined) {
    throw new Error("not mounted");
  }
  const mounted: Mounted = {
    api,
    changes,
    pageClicks: () => pageClicks,
    part,
    setHost,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
  disposers.push(mounted.dispose);
  return mounted;
};

const key = (element: HTMLElement, name: string, shiftKey = false): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", {
    key: name,
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
  return event;
};

const press = (element: HTMLElement): void => {
  element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
};

describe("createDrawer", () => {
  it("wires the trigger and the panel, closed and on the right by default", async () => {
    const { api, part } = mount();
    await tick();
    const trigger = part("trigger");
    const content = part("content");
    expect(api.side()).toBe("right");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
    expect(content.getAttribute("role")).toBe("dialog");
    expect(content.getAttribute("aria-modal")).toBeNull();
    expect(content.getAttribute("tabindex")).toBe("-1");
    expect(content.getAttribute("aria-labelledby")).toBe("drawer-title");
    expect(content.hidden).toBe(true);
    expect(part("backdrop").hidden).toBe(true);
    expect(part("handle").getAttribute("aria-hidden")).toBe("true");
  });

  it("reads side() from the option, so one drawer is a sheet or a rail", async () => {
    const bottom = mount({ side: "bottom" });
    const left = mount({ side: "left" });
    expect(bottom.api.side()).toBe("bottom");
    expect(left.api.side()).toBe("left");
  });

  it("opens on a trigger click and closes on the next one", async () => {
    const { part, changes } = mount();
    const trigger = part("trigger");
    const content = part("content");
    trigger.click();
    await tick();
    expect(content.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(content.getAttribute("aria-modal")).toBe("true");
    expect(part("backdrop").hidden).toBe(false);
    trigger.click();
    await tick();
    expect(content.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(changes).toEqual([true, false]);
  });

  it("opens on Enter and on Space from the trigger", async () => {
    const { part } = mount();
    key(part("trigger"), "Enter");
    await tick();
    expect(part("content").hidden).toBe(false);
    const escaped = key(part("first"), "Escape");
    expect(escaped.defaultPrevented).toBe(true);
    await tick();
    expect(part("content").hidden).toBe(true);
    key(part("trigger"), " ");
    await tick();
    expect(part("content").hidden).toBe(false);
  });

  it("moves focus into the panel on open and back to the trigger on close", async () => {
    const { part } = mount();
    const trigger = part("trigger");
    trigger.focus();
    trigger.click();
    await tick();
    expect(document.activeElement).toBe(part("first"));
    part("second").focus();
    key(part("second"), "Escape");
    await tick();
    expect(part("content").hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("answers Escape with the focus outside the panel", async () => {
    const { part } = mount();
    part("trigger").click();
    await tick();
    const page = part("page");
    page.focus();
    key(page, "Escape");
    await tick();
    expect(part("content").hidden).toBe(true);
    expect(document.activeElement).toBe(part("trigger"));
  });

  it("closes on a backdrop click, and not at all when it is not dismissable", async () => {
    const dismissable = mount();
    dismissable.part("trigger").click();
    await tick();
    dismissable.part("backdrop").click();
    await tick();
    expect(dismissable.part("content").hidden).toBe(true);

    const pinned = mount({ dismissable: false });
    pinned.part("trigger").click();
    await tick();
    pinned.part("backdrop").click();
    await tick();
    expect(pinned.part("content").hidden).toBe(false);
  });

  it("is not modal on request: no aria-modal, no backdrop, the page still takes its click", async () => {
    const { part, pageClicks } = mount({ side: "left", modal: false });
    part("trigger").click();
    await tick();
    expect(part("content").hidden).toBe(false);
    expect(part("content").getAttribute("aria-modal")).toBeNull();
    expect(part("backdrop").hidden).toBe(true);
    expect(document.documentElement.style.overflow).toBe("");
    const page = part("page");
    press(page);
    page.click();
    await tick();
    expect(pageClicks()).toBe(1);
    expect(part("content").hidden).toBe(true);
  });

  it("locks the document's scroll while modal, releases it, and leaves other scrollers alone", async () => {
    const root = document.documentElement;
    root.style.overflow = "scroll";
    try {
      const { part } = mount();
      part("trigger").click();
      await tick();
      expect(root.style.overflow).toBe("hidden");
      expect(part("scroller").style.overflow).toBe("auto");
      key(part("first"), "Escape");
      await tick();
      expect(root.style.overflow).toBe("scroll");
      expect(part("scroller").style.overflow).toBe("auto");
    } finally {
      root.style.overflow = "";
    }
  });

  it("counts the lock for nested drawers: the first takes it, the last releases it", async () => {
    const root = document.documentElement;
    root.style.overflow = "auto";
    try {
      const lower = mount({ defaultOpen: true });
      const upper = mount({ defaultOpen: true });
      await tick();
      expect(root.style.overflow).toBe("hidden");
      key(document.body, "Escape");
      await tick();
      expect(upper.part("content").hidden).toBe(true);
      expect(lower.part("content").hidden).toBe(false);
      expect(root.style.overflow).toBe("hidden");
      key(document.body, "Escape");
      await tick();
      expect(lower.part("content").hidden).toBe(true);
      expect(root.style.overflow).toBe("auto");
    } finally {
      root.style.overflow = "";
    }
  });

  it("cycles Tab inside a modal drawer and lets Tab be in a non-modal one", async () => {
    const modal = mount();
    modal.part("trigger").click();
    await tick();
    modal.part("second").focus();
    const forward = key(modal.part("second"), "Tab");
    expect(forward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(modal.part("first"));
    const backward = key(modal.part("first"), "Tab", true);
    expect(backward.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(modal.part("second"));

    const rail = mount({ modal: false });
    rail.part("trigger").click();
    await tick();
    rail.part("second").focus();
    const loose = key(rail.part("second"), "Tab");
    expect(loose.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(rail.part("second"));
  });

  it("requests in controlled mode and leaves the open state to the host", async () => {
    const { api, part, changes, setHost } = mount({ controlled: true });
    part("trigger").click();
    await tick();
    expect(changes).toEqual([true]);
    expect(api.open()).toBe(false);
    expect(part("content").hidden).toBe(true);

    setHost(true);
    await tick();
    expect(part("content").hidden).toBe(false);
    key(part("first"), "Escape");
    await tick();
    expect(changes).toEqual([true, false]);
    expect(part("content").hidden).toBe(false);
  });

  it("asks once for two dismissals in the same frame", async () => {
    // A controlled host's value is applied on the flush, so a second Escape (or a backdrop click) in the same tick would
    // read the old state and ask again: two dismissals, one intent.
    const { part, changes, setHost } = mount({ controlled: true });
    part("trigger").click();
    await tick();
    setHost(true);
    await tick();
    expect(changes).toEqual([true]);

    key(part("first"), "Escape");
    key(part("first"), "Escape");
    part("backdrop").click();
    await tick();
    expect(changes).toEqual([true, false]);

    // the host answered no: a later dismissal is a new intent, and it is asked again
    key(part("first"), "Escape");
    await tick();
    expect(changes).toEqual([true, false, false]);
  });

  it("releases the lock when the owner is disposed open", async () => {
    const root = document.documentElement;
    const { part } = mount();
    part("trigger").click();
    await tick();
    expect(root.style.overflow).toBe("hidden");
    for (const dispose of disposers.splice(0)) {
      dispose();
    }
    expect(root.style.overflow).toBe("");
    const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
    document.body.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(false);
  });
});
