// A native `<dialog>` host for `createDialogModal`: the platform owns the top layer, focus containment, Escape, focus
// return and the scroll lock, and the primitive keeps the controlled open state and the request/commit split.
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { type DialogModal, type DialogModalOptions, createDialogModal } from "../src/dialog-modal";

// Solid 2 delivers events through its delegated listener on a later turn.
const tick = () => new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

interface MountOptions extends DialogModalOptions {
  readonly controlled?: boolean;
  /** a controlled host that takes every request (the default) or one that refuses them */
  readonly accepts?: boolean;
}

const mount = (options: MountOptions = {}) => {
  const root = document.createElement("div");
  document.body.append(root);
  const [host, setHost] = createSignal(options.defaultOpen === true);
  const changes: boolean[] = [];
  let dialog: HTMLDialogElement | undefined;
  let api: DialogModal | undefined;

  const dispose = render(() => {
    const modal = createDialogModal({
      id: "d",
      get value() {
        return options.controlled === true ? host() : undefined;
      },
      defaultOpen: options.controlled === true ? undefined : options.defaultOpen,
      get modal() {
        return options.modal;
      },
      get keyboardDismissDisabled() {
        return options.keyboardDismissDisabled;
      },
      get dismissable() {
        return options.dismissable;
      },
      labelledby: "d-title",
      onOpenChange: (open) => {
        changes.push(open);
        if (options.controlled === true && options.accepts !== false) setHost(open);
      },
    });
    api = modal;
    return (
      <dialog
        {...modal.nativeProps}
        aria-label="native dialog"
        ref={(element) => {
          dialog = element;
          modal.attachDialog(element);
        }}
      >
        <button data-part="inside" type="button">
          Inside
        </button>
        <button {...modal.dismissProps} data-part="dismiss">
          Close
        </button>
      </dialog>
    );
  }, root);

  return {
    dialog: () => dialog as HTMLDialogElement,
    api: () => api as DialogModal,
    changes,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

describe("createDialogModal on a native <dialog>", () => {
  it("opens modal, holds the focus, and Escape closes it and gives the focus back", async () => {
    const page = document.createElement("button");
    document.body.append(page);
    page.focus();
    const { dialog, api, changes, dispose } = mount();
    await tick();

    expect(dialog().open).toBe(false);
    api().openDialog();
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

  it("a Cancel button goes through the same close, and the closedby attribute is the platform's policy", async () => {
    const { dialog, api, dispose } = mount();
    api().openDialog();
    await tick();
    expect(dialog().getAttribute("closedby")).toBe("any");
    dialog().querySelector<HTMLElement>("[data-part=dismiss]")!.click();
    await tick();
    expect(dialog().open).toBe(false);

    api().openDialog();
    await tick();
    dialog().close();
    await tick();
    expect(api().open()).toBe(false);
    dispose();
  });

  it("keyboardDismissDisabled is closedby=none: Escape leaves it open", async () => {
    const { dialog, api, dispose } = mount({ keyboardDismissDisabled: true });
    api().openDialog();
    await tick();
    expect(dialog().getAttribute("closedby")).toBe("none");
    await userEvent.keyboard("{Escape}");
    await tick();
    expect(dialog().open).toBe(true);
    expect(api().open()).toBe(true);
    dispose();
  });

  it("a controlled host that refuses the request never shows the dialog", async () => {
    const { dialog, api, changes, dispose } = mount({ controlled: true, accepts: false });
    api().openDialog();
    await tick();
    expect(changes).toEqual([true]);
    expect(dialog().open).toBe(false);
    expect(api().open()).toBe(false);
    dispose();
  });

  it("modal: false is a non-modal dialog", async () => {
    const { dialog, api, dispose } = mount({ modal: false });
    api().openDialog();
    await tick();
    expect(dialog().open).toBe(true);
    expect(dialog().matches(":modal")).toBe(false);
    dispose();
  });
});
