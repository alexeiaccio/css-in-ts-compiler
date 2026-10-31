import { createSignal, flush } from "solid-js";
import { render } from "@solidjs/web";
import { describe, expect, it, vi } from "vite-plus/test";
import { type Alert, createAlert } from "../src/alert";
import {
  type DropZone,
  type DropZoneOptions,
  type DropZoneReject,
  createDropZone,
} from "../src/dropzone";
import { type Listbox, createListbox } from "../src/listbox";
import { type RadioGroup, createRadioGroup } from "../src/radio";
import { type Status, createStatus } from "../src/status";
import { type Table, type TableColumn, createTable } from "../src/table";
import { type Tabs, createTabs } from "../src/tabs";
import { type TimelineSpan, createTimeline } from "../src/timeline";

// The feedback that adoption produced: data and host-owned values that arrive
// after mount. Every widget here is mounted once, fed by a signal, and must
// keep its state instead of being rebuilt.

const root = (): HTMLDivElement => {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
};

const COLUMNS: ReadonlyArray<TableColumn> = [{ key: "title" }, { key: "status", sortable: false }];

describe("items that arrive later", () => {
  it("keeps the listbox's selection and active option across a late list", () => {
    const [items, setItems] = createSignal<ReadonlyArray<string>>([]);
    let api: Listbox | undefined;
    const container = root();
    const dispose = render(() => {
      const listbox = createListbox({
        items: () => items(),
        defaultValue: [1],
      });
      api = listbox;
      return (
        <div {...listbox.listboxProps}>
          {items().map((label, index) => (
            <div data-part={`option:${index}`} {...listbox.optionProps(index)}>
              {label}
            </div>
          ))}
        </div>
      );
    }, container);

    setItems(["a", "b", "c"]);
    flush();

    const listbox = api as Listbox;
    expect(listbox.items.length).toBe(3);
    expect(listbox.selected()).toEqual([1]);
    expect(container.querySelectorAll('[data-part^="option:"]').length).toBe(3);
    const option = container.querySelector('[data-part="option:1"]');
    expect(option?.getAttribute("aria-selected")).toBe("true");

    // the active option and the focus survive a change of the list
    listbox.clickOption(2);
    setItems(["a", "b", "c", "d"]);
    flush();
    expect(listbox.active()).toBe(2);
    expect(listbox.items.length).toBe(4);
    dispose();
    container.remove();
  });

  it("keeps the table's selection across a late row list", () => {
    const [rows, setRows] = createSignal<ReadonlyArray<string>>([]);
    let api: Table | undefined;
    const container = root();
    const dispose = render(() => {
      const table = createTable({
        columns: COLUMNS,
        rows: () => rows(),
        selection: "multiple",
        defaultSelected: ["b"],
      });
      api = table;
      return <div>{rows().length}</div>;
    }, container);

    setRows(["a", "b", "c"]);
    flush();

    const table = api as Table;
    expect(table.isSelected("b")).toBe(true);
    expect(table.rowProps("b")["aria-selected"]).toBe("true");
    expect(table.rowProps("a")["aria-selected"]).toBe("false");
    expect(table.selectAllProps?.["aria-checked"]).toBe("mixed");

    table.toggleRow("a");
    setRows(["a", "b", "c", "d"]);
    flush();
    expect([...table.selected()].sort()).toEqual(["a", "b"]);
    dispose();
    container.remove();
  });

  it("reads the timeline's rows and reports the focused one", () => {
    const [rows, setRows] = createSignal<ReadonlyArray<TimelineSpan>>([]);
    const api = createTimeline({
      rows: () => rows(),
      selected: undefined,
    });

    expect(api.extent()).toEqual({ start: 0, end: 0 });
    expect(api.focusedId()).toBeUndefined();

    setRows([
      { id: "root", label: "GET /", start: 0, end: 100 },
      { id: "db", label: "SELECT", start: 10, end: 40, depth: 1 },
    ]);
    flush();

    expect(api.extent()).toEqual({ start: 0, end: 100 });
    expect(api.focusedId()).toBe("root");
    api.rowProps("db").onClick();
    flush();
    expect(api.selectedId()).toBe("db");
    expect(api.focusedId()).toBe("db");
    expect(api.rowProps("root").tabindex).toBe(-1);
    expect(api.rowProps("db").tabindex).toBe(0);
  });
});

describe("host-owned values", () => {
  it("treats a radio group's accessor as controlled, `undefined` included", () => {
    const [checked, setChecked] = createSignal<string | undefined>(undefined);
    const requests: (string | undefined)[] = [];
    const api: RadioGroup<string> = createRadioGroup<string>({
      values: ["all", "draft", "live"],
      value: () => checked(),
      onValueChange: (value) => {
        requests.push(value);
      },
    });

    expect(api.value()).toBeNull();
    expect(api.radioProps(0)["aria-checked"]).toBe("false");
    expect(api.radioProps(0).type).toBe("button");

    setChecked("draft");
    flush();
    expect(api.value()).toBe("draft");
    expect(api.radioProps(1)["aria-checked"]).toBe("true");

    api.click(2);
    flush();
    expect(requests).toEqual(["live"]);
    // controlled: the request changes nothing until the host writes it back
    expect(api.value()).toBe("draft");
  });

  it("maps panel and tab ids onto the generated ones", () => {
    const panels = ["traces", "logs", "metrics"];
    const api: Tabs = createTabs({
      id: "view",
      items: 3,
      tabId: (index) => `view-tab-${index}`,
      panelId: (index) => panels[index],
    });

    expect(api.tabProps(1).id).toBe("view-tab-1");
    expect(api.tabProps(1)["aria-controls"]).toBe("logs");
    expect(api.tabpanelProps(1).id).toBe("logs");
    expect(api.tabpanelProps(1)["aria-labelledby"]).toBe("view-tab-1");
    // untouched tabs keep the generated ids
    expect(api.tabpanelProps(2).id).toBe("metrics");
  });

  it("renders a status and an alert from the host's own signal", () => {
    const [message, setMessage] = createSignal<string | undefined>(undefined);
    const status: Status = createStatus({ from: () => message() });
    expect(status.message()).toBeUndefined();
    setMessage("Link copied");
    flush();
    expect(status.message()).toBe("Link copied");
    expect(status.statusProps.role).toBe("status");

    const [error, setError] = createSignal<string | undefined>(undefined);
    const dismissed = vi.fn();
    const alert: Alert = createAlert({ from: () => error(), onDismiss: dismissed });
    expect(alert.alertProps.role).toBeUndefined();
    expect(alert.alertProps.hidden).toBe(true);
    setError("Upload failed");
    flush();
    expect(alert.message()).toBe("Upload failed");
    expect(alert.alertProps.role).toBe("alert");
    expect(alert.alertProps.hidden).toBe(false);
    alert.dismiss();
    expect(dismissed).toHaveBeenCalledTimes(1);
    // controlled: the host clears its signal, the primitive does not
    expect(alert.alertProps.role).toBe("alert");
  });

  it("limits a batch, names the zone by id and speaks the host's language", () => {
    const accepted: File[][] = [];
    const rejected: DropZoneReject[] = [];
    let api: DropZone | undefined;
    const container = root();
    const options: DropZoneOptions = {
      maxFiles: 2,
      labels: { labelledby: "upload-heading" },
      formatMessage: ({ total, rejected: refused }) =>
        refused.length === 0 ? `${total} файла` : `${total} файла, отклонено ${refused.length}`,
      onFiles: (files) => accepted.push(files),
      onReject: (reject) => rejected.push(reject),
    };
    const dispose = render(() => {
      const zone = createDropZone(options);
      api = zone;
      return (
        <div data-part="zone" {...zone.zoneProps}>
          <input data-part="input" {...zone.inputProps} />
        </div>
      );
    }, container);

    const zone = api as DropZone;
    expect(zone.zoneProps["aria-labelledby"]).toBe("upload-heading");

    const files = ["a.png", "b.png", "c.png"].map(
      (name) => new File([new Uint8Array(8)], name, { type: "image/png" }),
    );
    const transfer = new DataTransfer();
    for (const file of files) {
      transfer.items.add(file);
    }
    zone.zoneProps.onDrop(
      new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }),
    );

    flush();
    expect(accepted).toEqual([files.slice(0, 2)]);
    expect(rejected).toEqual([{ file: files[2], reason: "count" }]);
    expect(zone.message()).toBe("3 файла, отклонено 1");
    dispose();
    container.remove();
  });
});
