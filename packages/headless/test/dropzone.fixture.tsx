import { type DropZone, createDropZone } from "../src/dropzone";
import { createSignal } from "solid-js";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import type { DropZoneConfig } from "@cssints/apg-specs/patterns/dropzone.bridge";
import { render } from "@solidjs/web";

/** The fixture's file rules, which the machine's one-file summary stands for. */
export const DROPZONE_ACCEPT = "image/*";
export const DROPZONE_MAX_SIZE = 1024;
export const DROPZONE_MAX_FILES = 2;

/**
 * Renders `createDropZone` as a `role=group` zone with one nested child, the
 * hidden input, the browse button and the `role=status` region. The file rules
 * are fixed so the machine's summary is one file: `accept: "image/*"`,
 * `maxSize: 1024`, `maxFiles: 2` — the driver's "accepted" batch is one small
 * image, its "rejected" batch one text file.
 */
export const mountDropZone = (config: DropZoneConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [disabled, setDisabled] = createSignal(config.disabled);
  let api: DropZone | undefined;

  const record = (name: string, payload: Json): void => {
    events.set(name, [...(events.get(name) ?? []), payload]);
  };

  const dispose = render(() => {
    const zone = createDropZone({
      accept: DROPZONE_ACCEPT,
      maxSize: DROPZONE_MAX_SIZE,
      maxFiles: DROPZONE_MAX_FILES,
      multiple: true,
      labels: { zone: "Upload files", browse: "Choose files" },
      get disabled() {
        return disabled();
      },
      onFiles: (files) => {
        record(
          "onFiles",
          files.map((file) => file.name),
        );
      },
      onReject: (reject) => {
        record("onReject", [reject.file.name, reject.reason]);
      },
    });
    api = zone;
    return (
      <div data-part="zone" {...zone.zoneProps}>
        <p data-part="child">Drop files here</p>
        <input data-part="input" {...zone.inputProps} />
        <button data-part="browse" {...zone.browseProps}>
          Choose files
        </button>
        <p data-part="status" {...zone.statusProps}>
          {zone.message() ?? ""}
        </p>
      </div>
    );
  }, root);

  return {
    root,
    events,
    value: () => ({
      dragging: api?.dragging() ?? false,
      message: api?.message() ?? null,
    }),
    setProp: (name, value) => {
      if (name === "disabled") {
        setDisabled(value === true);
        return;
      }
      throw new Error(`fixture has no prop ${name}`);
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
