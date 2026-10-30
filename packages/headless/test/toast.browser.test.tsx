import { For } from "solid-js";
import { type Status, createStatus } from "../src/status";
import { type Toast, type ToastOptions, createToast } from "../src/toast";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { render } from "@solidjs/web";

/** Solid 2 applies setters and delivers delegated events on a later tick. */
const tick = (ms = 20): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Polls until `done` holds and returns how long it took. Timers run late on a
 * loaded machine, so a countdown is waited for, never slept through.
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

interface MountedToast {
  readonly root: HTMLDivElement;
  readonly api: Toast;
  readonly dismissed: string[];
  readonly dispose: () => void;
}

const mounts: (() => void)[] = [];
afterEach(() => {
  for (const dispose of mounts.splice(0)) {
    dispose();
  }
});

const mountToast = (options: ToastOptions = {}): MountedToast => {
  const root = document.createElement("div");
  document.body.append(root);
  const dismissed: string[] = [];
  let api!: Toast;

  const dispose = render(() => {
    api = createToast({
      ...options,
      onDismiss: (id) => {
        dismissed.push(id);
        options.onDismiss?.(id);
      },
    });
    return (
      <div data-part="region" {...api.regionProps}>
        <For each={api.toasts()}>
          {(item) => (
            <div
              data-part="toast"
              data-id={item.id}
              data-tone={item.tone}
              {...api.toastProps(item.id)}
            >
              <span data-part="title">{item.title}</span>
              <span data-part="description">{item.description}</span>
              <button data-part="close" type="button" onClick={() => api.dismiss(item.id)}>
                Close
              </button>
            </div>
          )}
        </For>
      </div>
    );
  }, root);

  const teardown = (): void => {
    dispose();
    root.remove();
  };
  mounts.push(teardown);
  return { root, api, dismissed, dispose: teardown };
};

interface MountedStatus {
  readonly root: HTMLDivElement;
  readonly api: Status;
  readonly dispose: () => void;
}

const mountStatus = (): MountedStatus => {
  const root = document.createElement("div");
  document.body.append(root);
  let api!: Status;

  const dispose = render(() => {
    api = createStatus();
    return (
      <p data-part="status" {...api.statusProps}>
        {api.message()}
      </p>
    );
  }, root);

  const teardown = (): void => {
    dispose();
    root.remove();
  };
  mounts.push(teardown);
  return { root, api, dispose: teardown };
};

const byId = (root: HTMLElement, id: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[data-part="toast"][data-id="${id}"]`);

describe("createToast", () => {
  it("renders the region and one toast per show", async () => {
    const toast = mountToast({ labels: { region: "Toasts" } });
    toast.api.show({ title: "Saved" });
    toast.api.show({ title: "Synced", description: "3 files", tone: "success" });
    await tick();

    const region = toast.root.querySelector('[data-part="region"]');
    expect(region?.getAttribute("role")).toBe("region");
    expect(region?.getAttribute("aria-label")).toBe("Toasts");
    expect(toast.root.querySelectorAll('[data-part="toast"]')).toHaveLength(2);
    expect(toast.api.toasts().map((item) => item.title)).toEqual(["Saved", "Synced"]);
    expect(toast.api.toasts()[1]?.description).toBe("3 files");
  });

  it("gives an error toast role=alert and the rest role=status", async () => {
    const toast = mountToast();
    const info = toast.api.show({ title: "Copied" });
    const error = toast.api.show({ title: "Upload failed", tone: "error" });
    await tick();

    expect(byId(toast.root, info)?.getAttribute("role")).toBe("status");
    expect(byId(toast.root, error)?.getAttribute("role")).toBe("alert");
    expect(byId(toast.root, error)?.getAttribute("aria-atomic")).toBe("true");
    expect(toast.root.querySelector('[data-part="region"]')?.getAttribute("aria-label")).toBe(
      "Notifications",
    );
  });

  it("dismisses one by id and the rest all", async () => {
    const toast = mountToast({ timeout: 10_000 });
    const first = toast.api.show({ title: "One" });
    const second = toast.api.show({ title: "Two" });
    await tick();

    byId(toast.root, first)?.querySelector<HTMLButtonElement>('[data-part="close"]')?.click();
    await tick();

    expect(byId(toast.root, first)).toBeNull();
    expect(byId(toast.root, second)).not.toBeNull();
    expect(toast.dismissed).toEqual([first]);

    toast.api.dismissAll();
    await tick();

    expect(toast.root.querySelectorAll('[data-part="toast"]')).toHaveLength(0);
    expect(toast.dismissed).toEqual([first, second]);
  });

  it("drops the oldest toast at the ceiling", async () => {
    const toast = mountToast({ max: 2 });
    const first = toast.api.show({ title: "One" });
    const second = toast.api.show({ title: "Two" });
    const third = toast.api.show({ title: "Three" });
    await tick();

    expect(toast.api.toasts().map((item) => item.id)).toEqual([second, third]);
    expect(byId(toast.root, first)).toBeNull();
    expect(toast.root.querySelectorAll('[data-part="toast"]')).toHaveLength(2);
    expect(toast.dismissed).toEqual([first]);
  });

  it("auto-dismisses after the timeout", async () => {
    const toast = mountToast({ timeout: 200 });
    const id = toast.api.show({ title: "Gone soon" });
    await tick();

    expect(byId(toast.root, id)).not.toBeNull();
    await waitFor(() => byId(toast.root, id) === null);

    expect(toast.dismissed).toEqual([id]);
  });

  it("pauses the countdown on hover and resumes from where it stopped", async () => {
    // Hovered at ~800 of 1200: after the release about 400 ms are left, so a
    // dismissal well before another 1200 ms is what tells a resume from a restart.
    const toast = mountToast({ timeout: 1200 });
    const id = toast.api.show({ title: "Hover me" });
    await tick(800);
    const element = byId(toast.root, id);
    expect(element).not.toBeNull();

    element?.dispatchEvent(new MouseEvent("mouseenter"));
    // Held well past the deadline it was armed with.
    await tick(1200);
    expect(byId(toast.root, id)).not.toBeNull();

    element?.dispatchEvent(new MouseEvent("mouseleave"));
    const released = Date.now();
    await waitFor(() => byId(toast.root, id) === null);

    expect(Date.now() - released).toBeLessThan(1200);
    expect(toast.dismissed).toEqual([id]);
  });

  it("does not pause on hover when pauseOnHover is false", async () => {
    const toast = mountToast({ timeout: 300, pauseOnHover: false });
    const id = toast.api.show({ title: "Keep going" });
    await tick();

    byId(toast.root, id)?.dispatchEvent(new MouseEvent("mouseenter"));
    await waitFor(() => byId(toast.root, id) === null);

    expect(toast.dismissed).toEqual([id]);
  });

  it("pauses the countdown while a toast holds focus", async () => {
    const toast = mountToast({ timeout: 200 });
    const id = toast.api.show({ title: "Focusable" });
    await tick();
    const element = byId(toast.root, id);

    element?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    await tick(600);
    expect(byId(toast.root, id)).not.toBeNull();

    element?.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    await waitFor(() => byId(toast.root, id) === null);
    expect(toast.dismissed).toEqual([id]);
  });
});

describe("createStatus", () => {
  it("replaces its message in one polite live region", async () => {
    const status = mountStatus();
    const region = status.root.querySelector('[data-part="status"]');
    expect(region?.getAttribute("role")).toBe("status");
    expect(region?.getAttribute("aria-live")).toBe("polite");
    expect(region?.getAttribute("aria-atomic")).toBe("true");

    status.api.show("Link copied");
    await tick();
    expect(status.api.message()).toBe("Link copied");
    expect(region?.textContent).toBe("Link copied");

    status.api.show("Saved");
    await tick();
    expect(status.api.message()).toBe("Saved");
    expect(status.root.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(region?.textContent).toBe("Saved");

    status.api.clear();
    await tick();
    expect(status.api.message()).toBeUndefined();
    expect(region?.textContent).toBe("");
  });
});
