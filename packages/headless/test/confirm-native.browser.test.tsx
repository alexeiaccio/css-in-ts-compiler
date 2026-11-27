// A native `<dialog>` host for `createConfirm`: the platform owns the modal layer, the focus containment and return, Escape
// and the scroll lock; the promise, the Cancel-first focus and the request/answer split stay the primitive's.
import { Show } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { ConfirmPendingError, type Confirm, createConfirm } from "../src/confirm";

const tick = () => Promise.resolve();

const mount = () => {
  const root = document.createElement("div");
  document.body.append(root);
  let dialog: HTMLDialogElement | undefined;
  let api: Confirm | undefined;

  const dispose = render(() => {
    const confirm = createConfirm({ id: "c" });
    api = confirm;
    return (
      <Show when={confirm.request()}>
        {(view) => (
          <dialog
            {...confirm.nativeProps}
            aria-label="Confirm"
            ref={(element) => {
              dialog = element;
              confirm.attachDialog(element);
            }}
          >
            <h2 id="c-title">{view().title}</h2>
            <p id="c-description" hidden={view().description === undefined}>
              {view().description}
            </p>
            <button {...confirm.cancelProps} data-part="cancel">
              {view().cancelLabel}
            </button>
            <button {...confirm.confirmProps} data-part="confirm">
              {view().confirmLabel}
            </button>
          </dialog>
        )}
      </Show>
    );
  }, root);

  return {
    dialog: () => dialog as HTMLDialogElement,
    api: () => api as Confirm,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

describe("createConfirm on a native <dialog>", () => {
  it("opens modal with the focus on Cancel, and Cancel answers false", async () => {
    const { dialog, api, dispose } = mount();
    const answer = api().confirm({
      title: "Delete the file?",
      description: "It cannot be undone.",
    });
    await tick();
    expect(dialog().open).toBe(true);
    expect(dialog().matches(":modal")).toBe(true);
    expect(dialog().getAttribute("role")).toBe("alertdialog");
    expect(dialog().getAttribute("aria-labelledby")).toBe("c-title");
    expect(document.activeElement?.getAttribute("data-part")).toBe("cancel");
    dialog().querySelector<HTMLElement>("[data-part=cancel]")!.click();
    await tick();
    expect(await answer).toBe(false);
    expect(dialog().open).toBe(false);
    dispose();
  });

  it("the confirm button answers true, and a second request while pending rejects", async () => {
    const { dialog, api, dispose } = mount();
    const first = api().confirm({ title: "Save?" });
    await tick();
    await expect(api().confirm({ title: "Another?" })).rejects.toBeInstanceOf(ConfirmPendingError);
    dialog().querySelector<HTMLElement>("[data-part=confirm]")!.click();
    await tick();
    expect(await first).toBe(true);
    dispose();
  });

  it("Escape is the platform's cancel: false, and the focus goes back to the invoker", async () => {
    const page = document.createElement("button");
    document.body.append(page);
    page.focus();
    const { dialog, api, dispose } = mount();
    const answer = api().confirm({ title: "Delete?" });
    await tick();
    expect(dialog().matches(":modal")).toBe(true);
    await userEvent.keyboard("{Escape}");
    await tick();
    expect(await answer).toBe(false);
    expect(dialog().open).toBe(false);
    expect(document.activeElement).toBe(page);
    page.remove();
    dispose();
  });

  it("a platform close (the close event) answers false", async () => {
    const { dialog, api, dispose } = mount();
    const answer = api().confirm({ title: "Discard?" });
    await tick();
    dialog().close();
    await tick();
    expect(await answer).toBe(false);
    expect(api().open()).toBe(false);
    dispose();
  });

  it("closedby is any: a modal confirm takes a light dismiss", async () => {
    const { dialog, api, dispose } = mount();
    void api().confirm({ title: "Delete?" });
    await tick();
    expect(dialog().getAttribute("closedby")).toBe("any");
    dispose();
  });
});
