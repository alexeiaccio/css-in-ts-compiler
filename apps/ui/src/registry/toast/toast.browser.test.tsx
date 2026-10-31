import { afterEach, describe, expect, it } from "vite-plus/test";

import { type MountedToaster, mountToaster } from "./toast.fixture";

/** Solid 2 applies setters and delivers delegated events on a later tick. */
const tick = (ms = 20): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Polls until `done` holds and returns how long it took. Timers run late on a loaded machine, so a countdown is waited for,
 * never slept through.
 */
const waitFor = async (done: () => boolean, limit = 10_000): Promise<number> => {
  const start = Date.now();
  while (!done()) {
    if (Date.now() - start > limit) {
      throw new Error(`waitFor timed out after ${limit} ms`);
    }
    await tick();
  }
  return Date.now() - start;
};

const mounts: MountedToaster[] = [];

const mount = (options = {}, host?: HTMLElement): MountedToaster => {
  const mounted = mountToaster(options, host);
  mounts.push(mounted);
  return mounted;
};

afterEach(() => {
  for (const mounted of mounts.splice(0)) {
    mounted.dispose();
  }
});

// The stack is portalled, so the region is in `document.body`, not inside the element the fixture rendered into.
const stack = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-part="toast-region"]');

const rows = (): ReadonlyArray<HTMLElement> => [
  ...document.querySelectorAll<HTMLElement>('[data-part="toast"]'),
];

const rowOf = (title: string): HTMLElement | undefined =>
  rows().find((row) => row.querySelector('[data-part="toast-title"]')?.textContent === title);

describe("Toaster", () => {
  it("renders a pushed toast in the region with the live-region role it announces", async () => {
    const mounted = mount({ labels: { region: "Toasts" } });
    mounted.api.show({ title: "Draft saved" });
    mounted.api.show({
      title: "Upload failed",
      description: "The file is larger than 10 MB.",
      tone: "error",
    });
    await tick();

    const region = stack();
    expect(region?.getAttribute("role")).toBe("region");
    expect(region?.getAttribute("aria-label")).toBe("Toasts");
    // the F6 target the primitive's docs describe: focusable by a host handler, out of the page's tab order
    expect(region?.getAttribute("tabindex")).toBe("-1");
    expect(rows()).toHaveLength(2);

    const info = rowOf("Draft saved");
    const error = rowOf("Upload failed");
    expect(info?.getAttribute("role")).toBe("status");
    expect(info?.getAttribute("aria-atomic")).toBe("true");
    expect(info?.getAttribute("data-tone")).toBe("info");
    expect(info?.querySelector('[data-part="toast-description"]')).toBeNull();
    expect(error?.getAttribute("role")).toBe("alert");
    expect(error?.getAttribute("aria-atomic")).toBe("true");
    expect(error?.getAttribute("data-tone")).toBe("error");
    expect(error?.querySelector('[data-part="toast-description"]')?.textContent).toBe(
      "The file is larger than 10 MB.",
    );
  });

  it("dismisses a toast from its close button", async () => {
    const mounted = mount({ timeout: 10_000 });
    mounted.api.show({ title: "Saved" });
    await tick();
    expect(rows()).toHaveLength(1);

    rowOf("Saved")?.querySelector<HTMLButtonElement>('[data-part="toast-close"]')?.click();
    await tick();

    expect(rows()).toHaveLength(0);
    expect(mounted.dismissed).toHaveLength(1);
  });

  it("auto-dismisses after the timeout", async () => {
    const mounted = mount({ timeout: 200 });
    const id = mounted.api.show({ title: "Gone soon" });
    await tick();
    expect(rows()).toHaveLength(1);

    await waitFor(() => rows().length === 0);
    expect(mounted.dismissed).toEqual([id]);
  });

  it("pauses the countdown on hover and resumes from where it stopped", async () => {
    // Hovered at ~800 of 1200: after the release about 400 ms are left, so a dismissal well before another 1200 ms is what
    // tells a resume from a restart.
    const mounted = mount({ timeout: 1200 });
    const id = mounted.api.show({ title: "Hover me" });
    await tick(800);
    const toast = rowOf("Hover me");
    expect(toast).not.toBeUndefined();

    toast?.dispatchEvent(new MouseEvent("mouseenter"));
    // held well past the deadline it was armed with
    await tick(1200);
    expect(rowOf("Hover me")).not.toBeUndefined();

    toast?.dispatchEvent(new MouseEvent("mouseleave"));
    const released = Date.now();
    await waitFor(() => rowOf("Hover me") === undefined);
    expect(Date.now() - released).toBeLessThan(1200);
    expect(mounted.dismissed).toEqual([id]);
  });

  it("keeps the fixed stack in the viewport's corner inside a transformed ancestor", async () => {
    // the ancestor a layer in the page flow would be trapped by: its `transform` is a containing block for `fixed`, and
    // its `overflow` clips a child that stays inside it
    const wrapper = document.createElement("div");
    wrapper.style.transform = "translateX(40px)";
    wrapper.style.overflow = "hidden";
    const mounted = mount({ timeout: 10_000 }, wrapper);
    mounted.api.show({ title: "Still in the corner" });
    await tick();

    const region = stack();
    expect(region).not.toBeNull();
    // the portal took the stack out of the wrapper
    expect(wrapper.contains(region)).toBe(false);
    expect(region?.parentElement).toBe(document.body);
    expect(getComputedStyle(region as HTMLElement).position).toBe("fixed");

    const rect = (region as HTMLElement).getBoundingClientRect();
    expect(window.innerWidth - rect.right).toBeLessThan(48);
    expect(window.innerHeight - rect.bottom).toBeLessThan(48);
    expect(rect.right).toBeGreaterThan(window.innerWidth / 2);
    expect(rect.bottom).toBeGreaterThan(window.innerHeight / 2);
  });
});
