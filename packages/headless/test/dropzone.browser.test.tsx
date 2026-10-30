import {
  type DropZone,
  type DropZoneOptions,
  type DropZoneReject,
  createDropZone,
} from "../src/dropzone";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it, vi } from "vite-plus/test";

// Solid 2 delivers events through its delegated listener on a later turn.
const tick = () => new Promise((resolve) => setTimeout(resolve, 20));

const fileOf = (name: string, type = "image/png", bytes = 8): File =>
  new File([new Uint8Array(bytes)], name, { type });

const transferOf = (files: readonly File[]): DataTransfer => {
  const transfer = new DataTransfer();
  for (const file of files) {
    transfer.items.add(file);
  }
  return transfer;
};

const fireDrag = (
  element: Element,
  type: string,
  transfer: DataTransfer = new DataTransfer(),
): void => {
  element.dispatchEvent(
    new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }),
  );
};

const mount = (options: Omit<Partial<DropZoneOptions>, "onFiles" | "onReject"> = {}) => {
  const root = document.createElement("div");
  document.body.append(root);
  const accepted: File[][] = [];
  const rejected: DropZoneReject[] = [];
  const [disabled, setDisabled] = createSignal(options.disabled === true);
  let api: DropZone | undefined;

  const dispose = render(() => {
    const zone = createDropZone({
      ...options,
      get disabled() {
        return disabled();
      },
      onFiles: (files) => {
        accepted.push(files);
      },
      onReject: (reject) => {
        rejected.push(reject);
      },
    });
    api = zone;
    return (
      <div data-part="zone" {...zone.zoneProps}>
        <p data-part="child">Drop files here</p>
        <input {...zone.inputProps} />
        <button {...zone.browseProps}>Choose files</button>
        <p {...zone.statusProps}>{zone.message()}</p>
      </div>
    );
  }, root);

  const part = <T extends HTMLElement>(name: string): T =>
    root.querySelector<T>(`[data-part="${name}"]`)!;

  return {
    root,
    zone: () => part("zone"),
    child: () => part("child"),
    input: () => root.querySelector("input")!,
    button: () => root.querySelector("button")!,
    output: () => root.querySelector('[role="status"]')!,
    api: () => api!,
    accepted,
    rejected,
    setDisabled,
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};

describe("createDropZone", () => {
  it("maps accept, multiple and disabled onto the hidden input", () => {
    const { input, dispose } = mount({ accept: "image/png,.pdf", multiple: true });
    expect(input().type).toBe("file");
    expect(input().hidden).toBe(true);
    expect(input().accept).toBe("image/png,.pdf");
    expect(input().multiple).toBe(true);
    expect(input().disabled).toBe(false);
    dispose();

    const closed = mount({ disabled: true });
    expect(closed.input().disabled).toBe(true);
    expect(closed.input().multiple).toBe(false);
    expect(closed.input().hasAttribute("accept")).toBe(false);
    closed.dispose();
  });

  it("names the zone and the browse button when labels are given", () => {
    const { zone, button, dispose } = mount({ labels: { zone: "Images", browse: "Add images" } });
    expect(zone().getAttribute("role")).toBe("group");
    expect(zone().getAttribute("aria-label")).toBe("Images");
    expect(button().getAttribute("type")).toBe("button");
    expect(button().getAttribute("aria-label")).toBe("Add images");
    dispose();
  });

  it("delivers a drop as one batch of accepted files", async () => {
    const { zone, api, accepted, dispose } = mount({ multiple: true });
    fireDrag(zone(), "dragenter");
    fireDrag(zone(), "drop", transferOf([fileOf("a.png"), fileOf("b.pdf", "application/pdf")]));
    await tick();
    expect(accepted).toHaveLength(1);
    expect(accepted[0]?.map((file) => file.name)).toEqual(["a.png", "b.pdf"]);
    expect(api().message()).toBe("2 files");
    expect(api().dragging()).toBe(false);
    dispose();
  });

  it("refuses a wrong type and an oversized file once each, with a reason", async () => {
    const { zone, api, accepted, rejected, dispose } = mount({
      accept: "image/*",
      maxSize: 1024,
      multiple: true,
    });
    fireDrag(
      zone(),
      "drop",
      transferOf([
        fileOf("ok.png"),
        fileOf("notes.txt", "text/plain"),
        fileOf("big.png", "image/png", 2048),
      ]),
    );
    await tick();
    expect(accepted[0]?.map((file) => file.name)).toEqual(["ok.png"]);
    expect(rejected.map((reject) => [reject.file.name, reject.reason])).toEqual([
      ["notes.txt", "type"],
      ["big.png", "size"],
    ]);
    expect(api().message()).toBe("3 files, 2 rejected: unsupported type, too large");
    dispose();

    // a batch with nothing accepted calls neither onFiles nor an empty array
    const none = mount({ accept: "image/*" });
    fireDrag(none.zone(), "drop", transferOf([fileOf("notes.txt", "text/plain")]));
    await tick();
    expect(none.accepted).toHaveLength(0);
    expect(none.rejected).toHaveLength(1);
    expect(none.api().message()).toBe("1 file, 1 rejected: unsupported type");
    none.dispose();
  });

  it("keeps dragging while the pointer is over a child", async () => {
    const { zone, child, api, dispose } = mount();
    expect(api().dragging()).toBe(false);
    fireDrag(zone(), "dragenter");
    await tick();
    expect(api().dragging()).toBe(true);
    fireDrag(child(), "dragenter");
    await tick();
    expect(api().dragging()).toBe(true);
    fireDrag(child(), "dragleave");
    await tick();
    expect(api().dragging()).toBe(true);
    fireDrag(zone(), "dragleave");
    await tick();
    expect(api().dragging()).toBe(false);
    dispose();
  });

  it("ignores a drop while disabled, and follows the option when it flips", async () => {
    const { zone, api, accepted, setDisabled, dispose } = mount({ disabled: true });
    fireDrag(zone(), "dragenter");
    await tick();
    expect(api().dragging()).toBe(false);
    expect(zone().getAttribute("aria-disabled")).toBe("true");
    fireDrag(zone(), "drop", transferOf([fileOf("a.png")]));
    await tick();
    expect(accepted).toHaveLength(0);
    expect(api().message()).toBeUndefined();

    setDisabled(false);
    await tick();
    expect(zone().hasAttribute("aria-disabled")).toBe(false);
    fireDrag(zone(), "drop", transferOf([fileOf("a.png")]));
    await tick();
    expect(accepted).toHaveLength(1);
    dispose();
  });

  it("opens the picker through the hidden input from the browse button", async () => {
    const { button, input, dispose } = mount();
    const click = vi.spyOn(input(), "click");
    button().click();
    await tick();
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
    dispose();

    const closed = mount({ disabled: true });
    const blocked = vi.spyOn(closed.input(), "click");
    closed.button().click();
    await tick();
    expect(blocked).not.toHaveBeenCalled();
    expect(closed.button().disabled).toBe(true);
    blocked.mockRestore();
    closed.dispose();
  });

  it("validates a pick from the input the same way, and can pick the same file twice", async () => {
    const { input, accepted, rejected, dispose } = mount({ accept: "image/*" });
    input().files = transferOf([fileOf("notes.txt", "text/plain")]).files;
    input().dispatchEvent(new Event("change", { bubbles: true }));
    await tick();
    expect(rejected.map((reject) => reject.reason)).toEqual(["type"]);
    expect(accepted).toHaveLength(0);
    // cleared, so choosing the same file again fires change again
    expect(input().value).toBe("");

    input().files = transferOf([fileOf("a.png")]).files;
    input().dispatchEvent(new Event("change", { bubbles: true }));
    await tick();
    expect(accepted[0]?.map((file) => file.name)).toEqual(["a.png"]);
    dispose();
  });

  it("treats an empty transfer as a no-op", async () => {
    const { zone, api, accepted, rejected, dispose } = mount();
    fireDrag(zone(), "drop");
    await tick();
    expect(accepted).toHaveLength(0);
    expect(rejected).toHaveLength(0);
    expect(api().message()).toBeUndefined();
    dispose();
  });
});
