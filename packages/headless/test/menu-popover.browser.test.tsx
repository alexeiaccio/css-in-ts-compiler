// The menu list as a popover: the top layer, the host's CSS anchor placement, and the platform's close coming back as a
// request (a `toggle` with `newState: "closed"` is what a light dismiss or an Escape the UA handled looks like).
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";

import { type Menu, createMenu } from "../src/menu";

const tick = () => Promise.resolve();

const mount = () => {
  const root = document.createElement("div");
  document.body.append(root);
  let trigger: HTMLButtonElement | undefined;
  let list: HTMLDivElement | undefined;
  let api: Menu | undefined;

  const dispose = render(() => {
    const menu = createMenu({ items: ["alpha", "bravo"], overlay: "popover" });
    api = menu;
    return (
      <>
        <button
          {...menu.triggerProps}
          ref={(element) => {
            trigger = element;
          }}
          style={{ "anchor-name": "--list" }}
        >
          Open
        </button>
        <div
          {...menu.menuProps}
          ref={(element) => {
            list = element;
            menu.menuProps.ref(element);
          }}
          style={{
            "position-anchor": "--list",
            inset: "auto",
            top: "anchor(bottom)",
            left: "anchor(left)",
            margin: "0",
          }}
        >
          {menu.items.map((_, index) => (
            <button {...menu.itemProps(index)} data-part="item">
              {menu.items[index]?.label}
            </button>
          ))}
        </div>
      </>
    );
  }, root);

  return {
    trigger: () => trigger as HTMLButtonElement,
    list: () => list as HTMLDivElement,
    api: () => api as Menu,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

describe("createMenu with overlay: popover", () => {
  it("shows the list in the top layer, placed from the trigger's anchor", async () => {
    const { trigger, list, api, dispose } = mount();
    await tick();
    expect(list().matches(":popover-open")).toBe(false);
    expect(list().hasAttribute("popover")).toBe(true);
    // the fallback's `hidden` is not used under the API
    expect(list().hasAttribute("hidden")).toBe(false);

    trigger().click();
    await tick();
    expect(api().open()).toBe(true);
    expect(list().matches(":popover-open")).toBe(true);
    expect(getComputedStyle(list()).position).toBe("fixed");
    const a = trigger().getBoundingClientRect();
    const m = list().getBoundingClientRect();
    expect(Math.round(m.top)).toBe(Math.round(a.bottom));
    expect(Math.round(m.left)).toBe(Math.round(a.left));

    api().closeMenu();
    await tick();
    expect(list().matches(":popover-open")).toBe(false);
    dispose();
  });

  it("a platform close (a light dismiss or Escape) is a close request", async () => {
    const { trigger, list, api, dispose } = mount();
    await tick();
    trigger().click();
    await tick();
    expect(api().open()).toBe(true);

    list().dispatchEvent(new ToggleEvent("toggle", { newState: "closed", oldState: "open" }));
    await tick();
    expect(api().open()).toBe(false);
    expect(list().matches(":popover-open")).toBe(false);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    dispose();
  });

  it("a controlled host that refuses the close keeps the list open", async () => {
    const [host, setHost] = createSignal(true);
    const root = document.createElement("div");
    document.body.append(root);
    let list: HTMLDivElement | undefined;
    let api: Menu | undefined;
    const dispose = render(() => {
      const menu = createMenu({
        items: ["alpha", "bravo"],
        overlay: "popover",
        get open() {
          return host();
        },
        onOpenChange: () => undefined,
      });
      api = menu;
      return (
        <div
          {...menu.menuProps}
          ref={(element) => {
            list = element;
            menu.menuProps.ref(element);
          }}
        >
          <button {...menu.itemProps(0)}>alpha</button>
        </div>
      );
    }, root);
    await tick();
    expect(api?.open()).toBe(true);
    expect(list?.matches(":popover-open")).toBe(true);
    list?.dispatchEvent(new ToggleEvent("toggle", { newState: "closed", oldState: "open" }));
    await tick();
    // the request reached the host by `leave`; the state is still the host's `true`, so `showPopover()` never ran twice
    expect(api?.open()).toBe(true);
    setHost(false);
    await tick();
    expect(api?.open()).toBe(false);
    expect(list?.matches(":popover-open")).toBe(false);
    dispose();
    root.remove();
  });
});
