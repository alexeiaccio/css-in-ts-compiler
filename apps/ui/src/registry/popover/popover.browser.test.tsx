import { afterEach, describe, expect, it } from "vite-plus/test";

import { mountPopover } from "./popover.fixture";
import { popoverDriver, settle, type PopoverMounted } from "./popover-driver.ts";

// The panel is a `popover` in Chromium (the UA hides it and `showPopover()` puts it in the top layer), so "closed" is
// not `hidden` any more: it is the absence of `:popover-open`. The `hidden` attribute stays the fallback's way.
const shown = (element: HTMLElement): boolean => element.matches(":popover-open");

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
    expect(shown(content())).toBe(false);
    // closed has to mean not painted: no display in the panel's class may override the UA's rule for a closed popover
    expect(getComputedStyle(content()).display).toBe("none");
  });

  it("portals the panel out of a clipping, transformed ancestor", async () => {
    const { root, content, open } = mounted();
    await open();
    expect(root.contains(content())).toBe(false);
    expect(content().parentElement).toBe(document.body);
    expect(shown(content())).toBe(true);
    // the top layer is the containing block now: the panel is fixed to the viewport, out of the ancestor's transform
    expect(content().style.position).toBe("fixed");
    expect(content().style.top.endsWith("px")).toBe(true);
  });

  it("places the panel under the trigger, one gap below its bottom edge", async () => {
    const { trigger, content, open } = mounted();
    await open();
    await settle();
    const anchor = trigger().getBoundingClientRect();
    const panel = content().getBoundingClientRect();
    // placement="bottom-start", the primitive's default 4 px offset, both in the top layer's viewport space
    expect(Math.round(panel.top)).toBe(Math.round(anchor.bottom + 4));
    expect(Math.round(panel.left)).toBe(Math.round(anchor.left));
  });

  it("paints the surface from the theme and puts it under a dialog in the stack", async () => {
    const { content, open, style } = mounted();
    await open();
    const panel = style(content());
    // the surface is the theme's token, not a colour of the skin's own
    const probe = document.createElement("div");
    probe.style.backgroundColor = "var(--color-overlay-background)";
    document.body.append(probe);
    expect(panel.backgroundColor).toBe(style(probe).backgroundColor);
    probe.remove();
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
    expect(shown(content())).toBe(false);
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
    expect(shown(content())).toBe(false);
    expect(trigger().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(page);
    page.remove();
  });
});
