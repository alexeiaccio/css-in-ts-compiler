import { afterEach, describe, expect, it } from "vite-plus/test";

import { mountPopover } from "./popover.fixture";
import { popoverDriver, settle, type PopoverMounted } from "./popover-driver.ts";

const live: PopoverMounted[] = [];

const mounted = (): ReturnType<typeof popoverDriver> & PopoverMounted => {
  const instance = mountPopover();
  live.push(instance);
  return { ...popoverDriver(instance), ...instance };
};

afterEach(() => {
  for (const instance of live.splice(0)) {
    instance.dispose();
  }
});

describe("Popover (the kit's DOM)", () => {
  it("is a closed dialog wired to its trigger", () => {
    const { trigger, content } = mounted();
    expect(trigger().getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(trigger().getAttribute("aria-controls")).toBe(content().id);
    expect(content().getAttribute("role")).toBe("dialog");
    expect(content().getAttribute("aria-modal")).toBeNull();
    expect(content().getAttribute("aria-label")).toBe("Rename file");
    expect(content().getAttribute("tabindex")).toBe("-1");
    expect(content().hidden).toBe(true);
    // hidden has to mean hidden: no display in the panel's class may override the UA's `[hidden] { display: none }`
    expect(getComputedStyle(content()).display).toBe("none");
  });

  it("portals the panel out of a clipping, transformed ancestor", async () => {
    const { root, content, open } = mounted();
    await open();
    expect(root.contains(content())).toBe(false);
    expect(content().parentElement).toBe(document.body);
    expect(content().hidden).toBe(false);
    // the ancestor's transform is not the panel's containing block: it is placed in page space
    expect(content().style.position).toBe("absolute");
    expect(content().style.top.endsWith("px")).toBe(true);
  });

  it("places the panel under the trigger, one gap below its bottom edge", async () => {
    const { trigger, content, open } = mounted();
    await open();
    await settle();
    const anchor = trigger().getBoundingClientRect();
    const panel = content().getBoundingClientRect();
    // placement="bottom-start", the primitive's default 4 px offset, both written in page space
    expect(Math.round(panel.top - window.scrollY)).toBe(Math.round(anchor.bottom + 4));
    expect(Math.round(panel.left - window.scrollX)).toBe(Math.round(anchor.left));
  });

  it("paints the surface from the theme and puts it under a dialog in the stack", async () => {
    const { content, open, style } = mounted();
    await open();
    const panel = style(content());
    expect(panel.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(panel.borderTopWidth).toBe("1px");
    expect(panel.borderRadius).not.toBe("0px");
    expect(panel.boxShadow).not.toBe("none");
    expect(panel.zIndex).toBe("10");
  });

  it("moves the focus into the panel on open and back to the trigger on Escape", async () => {
    const { trigger, content, inside, open, press } = mounted();
    trigger().focus();
    await open();
    expect(document.activeElement).toBe(inside("popover-field"));
    await press("Escape");
    expect(content().hidden).toBe(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger());
  });

  it("closes on an outside press and leaves the focus where the page put it", async () => {
    const { trigger, content, open } = mounted();
    await open();
    const page = document.createElement("button");
    document.body.append(page);
    page.focus();
    page.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    await settle();
    expect(content().hidden).toBe(true);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(page);
    page.remove();
  });
});
