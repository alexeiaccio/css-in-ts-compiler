import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { describe, expect, it } from "vite-plus/test";
import { userEvent } from "vite-plus/test/browser";

import { Dropzone, DropzoneBrowse } from "./dropzone.tsx";

// The primitive has its own scenario replay and differential walk
// (`packages/headless/test/dropzone-spec.browser.test.tsx`), so this test is the skin's: the dashed surface reacting to a
// real `DragEvent`, the copy in the live region, the one hidden input the browse button clicks, and `disabled`. The drag
// state is read off computed style, because that is what a reader sees; the tests that need the state itself live in the
// package that owns it.
const mount = (view: () => JSX.Element): HTMLElement => {
  const root = document.createElement("div");
  document.body.append(root);
  render(view, root);
  flush();
  return root;
};

const part = (root: HTMLElement, name: string): HTMLElement => {
  const found = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (found === null) {
    throw new Error(`no [data-part="${name}"] in ${root.innerHTML}`);
  }
  return found;
};

const file = (name: string, type: string): File => new File([new Uint8Array(8)], name, { type });

const transfer = (files: readonly File[]): DataTransfer => {
  const data = new DataTransfer();
  for (const item of files) {
    data.items.add(item);
  }
  return data;
};

const drag = (element: HTMLElement, type: string, dataTransfer?: DataTransfer): void => {
  element.dispatchEvent(
    new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dataTransfer ?? null }),
  );
  flush();
};

describe("Dropzone", () => {
  it("paints the zone while a drag is over it, through a child and out", () => {
    const root = mount(() => <Dropzone label="Upload an image" onFiles={() => undefined} />);
    const zone = part(root, "dropzone");
    const label = part(root, "dropzone-label");
    // the zone is the primitive's `role=group`, named by the visible label
    expect(zone.getAttribute("role")).toBe("group");
    expect(zone.getAttribute("aria-labelledby")).toBe(label.id);
    expect(label.textContent).toBe("Upload an image");

    const border = (): string => getComputedStyle(zone).borderTopColor;
    const idle = border();

    drag(zone, "dragenter");
    expect(border()).not.toBe(idle);
    // the pointer moved onto a child: the primitive's depth is 2, and the look stays
    drag(label, "dragenter");
    expect(border()).not.toBe(idle);
    // a child's leave leaves the pointer inside the zone: still painted
    drag(label, "dragleave");
    expect(border()).not.toBe(idle);
    // only the zone's own leave clears it
    drag(zone, "dragleave");
    expect(border()).toBe(idle);
  });

  it("reports an accepted drop through onFiles and keeps the live region mounted", () => {
    const accepted: string[][] = [];
    const root = mount(() => (
      <Dropzone
        label="Upload an image"
        description="PNG or JPEG"
        accept="image/*"
        onFiles={(files) => accepted.push(files.map((item) => item.name))}
      />
    ));
    const zone = part(root, "dropzone");
    const idle = getComputedStyle(zone).borderTopColor;
    const status = part(root, "dropzone-status");
    expect(status.getAttribute("role")).toBe("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toBe("");
    expect(zone.getAttribute("aria-describedby")).toBe(part(root, "dropzone-description").id);

    drag(zone, "dragenter");
    drag(zone, "drop", transfer([file("photo.png", "image/png")]));

    expect(accepted).toEqual([["photo.png"]]);
    expect(status.textContent).toBe("1 file");
    // the region is the element that was already there, not one mounted for the announcement
    expect(part(root, "dropzone-status")).toBe(status);
    // a drop clears the drag look: the primitive sets the depth back to zero
    expect(getComputedStyle(zone).borderTopColor).toBe(idle);
  });

  it("writes a refused file into the status with its reason", () => {
    const accepted: string[][] = [];
    const refused: string[][] = [];
    const root = mount(() => (
      <Dropzone
        label="Upload an image"
        accept="image/*"
        onFiles={(files) => accepted.push(files.map((item) => item.name))}
        onReject={(reject) => refused.push([reject.file.name, reject.reason])}
      />
    ));

    drag(part(root, "dropzone"), "drop", transfer([file("notes.txt", "text/plain")]));

    expect(accepted).toEqual([]);
    expect(refused).toEqual([["notes.txt", "type"]]);
    expect(part(root, "dropzone-status").textContent).toBe("1 file, 1 rejected: unsupported type");
  });

  it("clicks the one hidden input the primitive owns from the browse button", async () => {
    const root = mount(() => (
      <Dropzone label="Upload an image" onFiles={() => undefined}>
        <DropzoneBrowse />
      </Dropzone>
    ));
    const input = part(root, "dropzone-input") as HTMLInputElement;
    expect(input.type).toBe("file");
    expect(input.hidden).toBe(true);
    expect(root.querySelectorAll('input[type="file"]').length).toBe(1);

    let opened = 0;
    input.addEventListener("click", (event) => {
      // a real picker would block the browser test; the point is that the button asked for one
      event.preventDefault();
      opened += 1;
    });
    const browse = part(root, "dropzone").querySelector("button");
    if (browse === null) {
      throw new Error("no browse button");
    }
    await userEvent.click(browse);
    expect(opened).toBe(1);
  });

  it("takes neither a drop nor a click when disabled", () => {
    const accepted: string[][] = [];
    const root = mount(() => (
      <Dropzone
        label="Upload an image"
        disabled
        onFiles={(files) => accepted.push(files.map((item) => item.name))}
      >
        <DropzoneBrowse />
      </Dropzone>
    ));
    const zone = part(root, "dropzone");
    const input = part(root, "dropzone-input") as HTMLInputElement;
    let opened = 0;
    input.addEventListener("click", (event) => {
      event.preventDefault();
      opened += 1;
    });

    drag(zone, "dragenter");
    drag(zone, "drop", transfer([file("photo.png", "image/png")]));

    expect(accepted).toEqual([]);
    expect(part(root, "dropzone-status").textContent).toBe("");
    expect(zone.getAttribute("aria-disabled")).toBe("true");
    expect(input.disabled).toBe(true);
    const browse = zone.querySelector("button");
    if (browse === null) {
      throw new Error("no browse button");
    }
    // the kit's Button stays focusable at a disabled state and reports it with `aria-disabled`, as the APG asks
    expect(browse.getAttribute("aria-disabled")).toBe("true");
    browse.click();
    expect(opened).toBe(0);
  });
});
