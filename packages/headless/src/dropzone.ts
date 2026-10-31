import { type Accessor, createSignal, createUniqueId } from "solid-js";

/** Why a file was refused: the `accept` grammar, `maxSize`, or `maxFiles`. */
export type DropZoneRejectReason = "type" | "size" | "count";

export interface DropZoneReject {
  readonly file: File;
  readonly reason: DropZoneRejectReason;
}

export interface DropZoneLabels {
  /** The zone's accessible name (`aria-label` on the `role=group` zone). */
  readonly zone?: string | undefined;
  /**
   * The id of the host's own heading: `aria-labelledby` on the zone, which
   * takes precedence over `zone`. Use it to name the zone with visible text.
   */
  readonly labelledby?: string | undefined;
  /** The browse button's accessible name; render it visibly, or use it for an icon-only button. */
  readonly browse?: string | undefined;
}

export interface DropZoneOptions {
  /** The HTML `accept` grammar: extensions (`.png`) and MIME types, wildcards included (`image/*`). */
  readonly accept?: string | undefined;
  readonly multiple?: boolean | undefined;
  /** Bytes; a larger file is rejected with `"size"`. */
  readonly maxSize?: number | undefined;
  /** Files taken from one batch; the rest are rejected with `"count"`. */
  readonly maxFiles?: number | undefined;
  readonly disabled?: boolean | undefined;
  /** The files that passed, one call per batch; not called when the batch has none. */
  readonly onFiles: (files: File[]) => void;
  /** Each refused file, once, with the reason the host shows. */
  readonly onReject?: ((reject: DropZoneReject) => void) | undefined;
  readonly labels?: DropZoneLabels | undefined;
  /**
   * The announcement sentence in the host's language, from the same counts the
   * default sentence uses. Absent, `message()` is English built from
   * `labels.browse`-less words; a host with a locale always passes this.
   */
  readonly formatMessage?: ((message: DropZoneMessage) => string | undefined) | undefined;
}

/** Spread onto the hidden `<input type=file>`; render it, always. */
export interface DropZoneInputProps {
  /** The id the browse button clicks; generated. */
  readonly id: string;
  readonly type: "file";
  readonly accept: string | undefined;
  readonly multiple: true | undefined;
  readonly disabled: true | undefined;
  readonly hidden: true;
  readonly onChange: (event: { currentTarget: HTMLInputElement }) => void;
}

/** Spread onto the drop target (any element). `dragging()` is the styling hook. */
export interface DropZoneZoneProps {
  readonly role: "group";
  readonly "aria-label": string | undefined;
  readonly "aria-labelledby": string | undefined;
  readonly "aria-disabled": "true" | undefined;
  readonly onDragEnter: (event: DragEvent) => void;
  readonly onDragOver: (event: DragEvent) => void;
  readonly onDragLeave: (event: DragEvent) => void;
  readonly onDrop: (event: DragEvent) => void;
}

/** Spread onto a real `<button type="button">`: Enter and Space are the platform's. */
export interface DropZoneBrowseProps {
  readonly type: "button";
  readonly disabled: true | undefined;
  readonly "aria-disabled": "true" | undefined;
  readonly "aria-label": string | undefined;
  readonly onClick: () => void;
}

/** Spread onto the live region; render it once, always. */
export interface DropZoneStatusProps {
  readonly role: "status";
  readonly "aria-live": "polite";
  readonly "aria-atomic": "true";
}

export interface DropZone {
  /** A drag is over the zone; `dragleave` on a child does not clear it. */
  readonly dragging: Accessor<boolean>;
  /**
   * A default sentence for the last batch ("2 files, 1 rejected: too large"),
   * or `undefined` before one arrived. The host may write its own words from
   * the same counts.
   */
  readonly message: Accessor<string | undefined>;
  readonly inputProps: DropZoneInputProps;
  readonly zoneProps: DropZoneZoneProps;
  readonly browseProps: DropZoneBrowseProps;
  readonly statusProps: DropZoneStatusProps;
}

export interface DropZoneMessage {
  /** Files in the batch, accepted and refused. */
  readonly total: number;
  readonly accepted: number;
  readonly rejected: readonly DropZoneRejectReason[];
}

interface Batch {
  readonly total: number;
  readonly rejected: readonly DropZoneRejectReason[];
  readonly accepted: number;
}

const REASON_TEXT: Readonly<Record<DropZoneRejectReason, string>> = {
  type: "unsupported type",
  size: "too large",
  count: "too many files",
};

const tokensOf = (accept: string | undefined): readonly string[] =>
  (accept ?? "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token !== "");

/** The HTML `accept` grammar: a token starting with "." is an extension, else a MIME type, `*` allowed. */
const accepts = (accept: string | undefined, file: File): boolean => {
  const tokens = tokensOf(accept);
  if (tokens.length === 0) {
    return true;
  }
  const name = file.name.toLowerCase();
  const [fileType = "", fileSubtype = ""] = file.type.toLowerCase().split("/");
  return tokens.some((token) => {
    if (token.startsWith(".")) {
      return name.endsWith(token);
    }
    const [type = "", subtype = ""] = token.split("/");
    return type === fileType && (subtype === "*" || subtype === fileSubtype);
  });
};

const refusal = (options: DropZoneOptions, file: File): DropZoneRejectReason | undefined => {
  if (!accepts(options.accept, file)) {
    return "type";
  }
  if (options.maxSize !== undefined && file.size > options.maxSize) {
    return "size";
  }
  return undefined;
};

const messageOf = (batch: Batch | undefined): string | undefined => {
  if (batch === undefined) {
    return undefined;
  }
  const files = batch.total === 1 ? "1 file" : `${batch.total} files`;
  if (batch.rejected.length === 0) {
    return files;
  }
  const reasons = [...new Set(batch.rejected)].map((reason) => REASON_TEXT[reason]).join(", ");
  return `${files}, ${batch.rejected.length} rejected: ${reasons}`;
};

/**
 * A file drop zone. There is no APG pattern for one: the contract is HTML's
 * file input plus WAI-ARIA's live region. The drag state and the last delivery
 * have a machine (`specs/patterns/dropzone.qnt`), `test/dropzone-spec.browser.test.tsx`
 * replays it, and `test/dropzone.browser.test.tsx` is the DOM oracle for the
 * picker, the `DataTransfer` details and the attributes the machine omits.
 *
 * Decisions:
 * - **The zone is never drag-only.** `browseProps` spreads onto a real
 *   `<button type="button">` that clicks the hidden input, so the picker is the
 *   keyboard path (Enter and Space are the platform's) and a pointer user can
 *   click as well as drag. The drop handlers add nothing the button cannot do.
 * - **Validation happens once per file**, in the order type then size, and a
 *   refused file reaches `onReject` with the reason the host shows. `accept` is
 *   the HTML grammar (`.` extension, MIME type, `*`); `maxSize` is bytes.
 * - **Dropping a folder or a `DataTransfer` with no files is a no-op**: no
 *   `onFiles`, no `onReject`, no message, and the previous announcement stays.
 * - **`dragleave` counts.** A child's `dragleave` bubbles to the zone, so the
 *   state is a depth counter: it clears only when the drag leaves the zone
 *   itself, or on a drop.
 * - **The zone is `role=group`** so `labels.zone` is exposed; `dragging()` is
 *   the only drag state a skin reads (no `data-dragging`).
 * - `disabled` marks the zone `aria-disabled`, disables the input natively and
 *   the browse button, and drops every drag before it becomes a batch.
 */
export const createDropZone = (options: DropZoneOptions): DropZone => {
  const id = createUniqueId();
  const [depth, setDepth] = createSignal(0);
  const [batch, setBatch] = createSignal<Batch | undefined>();
  const messageState = (): DropZoneMessage => {
    const current = batch();
    return current === undefined
      ? { total: 0, accepted: 0, rejected: [] }
      : { total: current.total, accepted: current.accepted, rejected: current.rejected };
  };

  const disabled = (): boolean => options.disabled === true;

  const deliver = (files: readonly File[]): void => {
    if (disabled() || files.length === 0) {
      return;
    }
    const accepted: File[] = [];
    const rejected: DropZoneRejectReason[] = [];
    const limit = options.maxFiles ?? Number.POSITIVE_INFINITY;
    for (const file of files) {
      let reason = refusal(options, file);
      if (reason === undefined && accepted.length >= limit) {
        reason = "count";
      }
      if (reason === undefined) {
        accepted.push(file);
      } else {
        rejected.push(reason);
        options.onReject?.({ file, reason });
      }
    }
    setBatch({ total: files.length, rejected, accepted: accepted.length });
    if (accepted.length > 0) {
      options.onFiles(accepted);
    }
  };

  const dropped = (event: DragEvent): void => {
    event.preventDefault();
    setDepth(0);
    if (disabled()) {
      return;
    }
    const transfer = event.dataTransfer;
    if (transfer === null) {
      return;
    }
    const items = Array.from(transfer.items).filter((item) => item.kind === "file");
    const files = Array.from(transfer.files);
    if (files.length === 0) {
      return;
    }
    const folder =
      items.length > 0 && items.every((item) => item.webkitGetAsEntry?.()?.isDirectory === true);
    if (folder) {
      return;
    }
    deliver(files);
  };

  const picked = (event: { currentTarget: HTMLInputElement }): void => {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    input.value = "";
    deliver(files);
  };

  const browse = (): void => {
    if (disabled()) {
      return;
    }
    document.getElementById(id)?.click();
  };

  return {
    dragging: () => depth() > 0,
    message: () => options.formatMessage?.(messageState()) ?? messageOf(batch()),
    inputProps: {
      id,
      type: "file",
      get accept() {
        return options.accept;
      },
      get multiple() {
        return options.multiple === true ? true : undefined;
      },
      get disabled() {
        return disabled() ? true : undefined;
      },
      hidden: true,
      onChange: picked,
    },
    zoneProps: {
      role: "group",
      get "aria-label"() {
        return options.labels?.zone;
      },
      get "aria-labelledby"() {
        return options.labels?.labelledby;
      },
      get "aria-disabled"() {
        return disabled() ? "true" : undefined;
      },
      onDragEnter: (event) => {
        event.preventDefault();
        if (!disabled()) {
          setDepth(depth() + 1);
        }
      },
      onDragOver: (event) => {
        event.preventDefault();
      },
      onDragLeave: (event) => {
        event.preventDefault();
        if (!disabled()) {
          setDepth(Math.max(0, depth() - 1));
        }
      },
      onDrop: dropped,
    },
    browseProps: {
      type: "button",
      get disabled() {
        return disabled() ? true : undefined;
      },
      get "aria-disabled"() {
        return disabled() ? "true" : undefined;
      },
      get "aria-label"() {
        return options.labels?.browse;
      },
      onClick: browse,
    },
    statusProps: { role: "status", "aria-live": "polite", "aria-atomic": "true" },
  };
};
