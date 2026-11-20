// A native `<dialog>` panel for `createDrawer`: modal or not, the platform owns the top layer; modal also owns the focus
// containment and return, Escape, the outside press and the scroll lock.
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { type Drawer, type DrawerOptions, createDrawer } from "../src/drawer";

const tick = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

interface MountOptions extends DrawerOptions {
  readonly controlled?: boolean;
  readonly accepts?: boolean;
}

const mount = (options: MountOptions = {}) => {
  const root = document.createElement("div");
  document.body.append(root);
  const [host, setHost] = createSignal(options.defaultOpen === true);
  const changes: boolean[] = [];
  let dialog: HTMLDialogElement | undefined;
  let api: Drawer | undefined;

  const dispose = render(() => {
    const drawer = createDrawer({
      id: "d",
      get open() {
        return options.controlled === true ? host() : undefined;
      },
      defaultOpen: options.controlled === true ? undefined : options.defaultOpen,
      get modal() {
        return options.modal;
      },
      get dismissable() {
        return options.dismissable;
      },
      labelledby: "rail-title",
      onOpenChange: (open) => {
        changes.push(open);
        if (options.controlled === true && options.accepts !== false) setHost(open);
      },
    });
    api = drawer;
    return (
      <dialog
        {...drawer.nativeProps}
        ref={(element) => {
          dialog = element;
          drawer.attachDialog(element);
        }}
      >
        <h2 id="rail-title">Rail</h2>
        <button data-part="inside" type="button">
          Inside
        </button>
      </dialog>
    );
  }, root);

  return {
    dialog: () => dialog as HTMLDialogElement,
    api: () => api as Drawer,
    changes,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

describe("createDrawer on a native <dialog>", () => {
  it("opens modal, holds the focus, and Escape closes it and gives the focus back", async () => {
    const page = document.createElement("button");
    document.body.append(page);
    page.focus();
    const { dialog, api, changes, dispose } = mount();
    await tick();
    expect(dialog().open).toBe(false);
    expect(dialog().getAttribute("closedby")).toBe("any");
    api().triggerProps.onClick();
    await tick();
    expect(dialog().open).toBe(true);
    expect(dialog().matches(":modal")).toBe(true);
    expect(dialog().contains(document.activeElement)).toBe(true);
    await userEvent.keyboard("{Escape}");
    await tick();
    expect(dialog().open).toBe(false);
    expect(api().open()).toBe(false);
    expect(changes).toEqual([true, false]);
    expect(document.activeElement).toBe(page);
    page.remove();
    dispose();
  });

  it("a non-dismissable drawer is closerequest: Escape closes, and the attribute says so", async () => {
    const { dialog, api, dispose } = mount({ dismissable: false });
    api().triggerProps.onClick();
    await tick();
    expect(dialog().getAttribute("closedby")).toBe("closerequest");
    await userEvent.keyboard("{Escape}");
    await tick();
    expect(dialog().open).toBe(false);
    dispose();
  });

  it("a controlled host that refuses the request never shows the drawer", async () => {
    const { dialog, api, changes, dispose } = mount({ controlled: true, accepts: false });
    api().triggerProps.onClick();
    await tick();
    expect(changes).toEqual([true]);
    expect(dialog().open).toBe(false);
    dispose();
  });

  it("modal: false is show(), not showModal(): no modal layer, and Escape still closes it through the shell", async () => {
    const { dialog, api, dispose } = mount({ modal: false });
    expect(dialog().getAttribute("closedby")).toBe("none");
    api().triggerProps.onClick();
    await tick();
    expect(dialog().open).toBe(true);
    expect(dialog().matches(":modal")).toBe(false);
    dialog().querySelector<HTMLElement>("[data-part=inside]")!.focus();
    await userEvent.keyboard("{Escape}");
    await tick();
    expect(dialog().open).toBe(false);
    expect(api().open()).toBe(false);
    dispose();
  });

  it("the close event of the platform is the same request the shell's close is", async () => {
    const { dialog, api, dispose } = mount();
    api().triggerProps.onClick();
    await tick();
    dialog().close();
    await tick();
    expect(api().open()).toBe(false);
    dispose();
  });
});
