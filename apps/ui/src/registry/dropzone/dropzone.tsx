import {
  createDropZone,
  type DropZone as DropZoneController,
  type DropZoneMessage,
  type DropZoneReject,
} from "@cssints/headless";
import type { JSX } from "@solidjs/web";
import * as css from "cssints" with { type: "cssints" };
import { createContext, createUniqueId, merge, untrack, useContext } from "solid-js";

import { Button } from "../button/button.tsx";
import { type PartProps, renderPart, type Renderable } from "../render.tsx";
import { t } from "../theme.ts" with { type: "cssints" };

/**
 * What `render` gets: the browse button's props (the primitive's `onClick`, `disabled`, `aria-label`) and the class.
 */
export type DropzoneBrowsePartProps = PartProps;

export interface DropzoneBrowseProps extends Renderable<DropzoneBrowsePartProps, void> {
  readonly class?: string;
  /** The visible label; left out, "Choose files". `browseLabel` on the zone names an icon-only button. */
  readonly children?: JSX.Element;
}

export interface DropzoneProps {
  /** The visible label above the zone; it is the zone's `aria-labelledby`, so it is required. */
  readonly label: string;
  /** The line under the label; the zone's `aria-describedby`. */
  readonly description?: string;
  /** The HTML `accept` grammar: extensions (`.png`) and MIME types, wildcards included (`image/*`). */
  readonly accept?: string;
  readonly multiple?: boolean;
  /** Bytes; a larger file is refused. */
  readonly maxSize?: number;
  /** Files taken from one batch; the rest are refused. */
  readonly maxFiles?: number;
  readonly disabled?: boolean;
  /** The browse button's accessible name for an icon-only button; with visible text, leave it out. */
  readonly browseLabel?: string;
  /** The announcement in the host's words, from the same counts the default English sentence uses. */
  readonly formatMessage?: (message: DropZoneMessage) => string | undefined;
  /** The files that passed, one call per batch; a batch with none does not call it. */
  readonly onFiles: (files: File[]) => void;
  /** Each refused file with the reason the page shows, once. */
  readonly onReject?: (reject: DropZoneReject) => void;
  readonly class?: string;
  /** Put the `DropzoneBrowse` here; the zone renders the input and the status itself. */
  readonly children?: JSX.Element;
  /** The primitive, once: a page that reads `dragging()` or drives the picker. */
  readonly onReady?: (zone: DropZoneController) => void;
}

const DropzoneContext = createContext<{ readonly zone: DropZoneController }>();

// A dashed target on the surface. The disabled look reads the primitive's real `aria-disabled` with `attr()`. The drag look
// is a second class computed from `dragging()`: the primitive has no `data-dragging` on purpose, `dragging()` is the one hook
// a skin may read, and keeping the depth in a second signal here would be two states to disagree. The accessor is read in
// `class`, so the class list changes when the drag enters or leaves.
const zoneClass = css.cn(
  css.boxSizing("border-box"),
  css.display("flex"),
  css.flexDirection("column"),
  css.alignItems("center"),
  css.gap(t.space._2),
  css.padding(t.space._6, t.space._4),
  css.border("1px dashed", t.color.border),
  css.borderRadius(t.radius.lg),
  css.bg(t.color.surface),
  css.color(t.color.text),
  css.textAlign("center"),
  css.transition("border-color 120ms, background-color 120ms"),
  css.attr("aria-disabled", "true")(
    css.border("1px dashed", t.color.borderDisabled),
    css.color(t.color.textDisabled),
    css.cursor("not-allowed"),
  ),
);

const zoneDraggingClass = css.cn(
  css.border("1px dashed", t.color.highlight),
  css.bg(t.color.buttonBackground),
);

const labelClass = css.cn(css.margin("0"), css.fontWeight("500"), css.fontSize(t.font.size));
const descriptionClass = css.cn(
  css.margin("0"),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);
const statusClass = css.cn(
  css.margin("0"),
  css.minHeight(t.space._5),
  css.fontSize(t.font.sizeSm),
  css.color(t.color.muted),
);

/**
 * A file drop target, styled: `createDropZone` owns the drag depth, the batch summary, the `accept`/`maxSize`/`maxFiles`
 * decision and the hidden input; this component adds the dashed surface, the label, the browse button and the live region.
 *
 * The zone is inline, not a portal: it is a target in the page's layout, so it stays where the page put it. The
 * `role="status"` region is rendered here and always mounted, in the zone's own document position — a live region that
 * appears only when there is a message is a region a reader has not been watching.
 */
export const Dropzone = (props: DropzoneProps): JSX.Element => {
  const labelId = createUniqueId();
  const descriptionId = createUniqueId();
  const zone = createDropZone({
    get accept() {
      return props.accept;
    },
    get multiple() {
      return props.multiple;
    },
    get maxSize() {
      return props.maxSize;
    },
    get maxFiles() {
      return props.maxFiles;
    },
    get disabled() {
      return props.disabled;
    },
    labels: { labelledby: labelId, browse: props.browseLabel },
    get formatMessage() {
      return props.formatMessage;
    },
    get onFiles() {
      return props.onFiles;
    },
    get onReject() {
      return props.onReject;
    },
  });
  // a structural prop, read once: it is the primitive for a page, not a signal
  untrack(() => props.onReady)?.(zone);

  const own = {
    "data-part": "dropzone",
    get "aria-describedby"() {
      return descriptionId;
    },
    get class() {
      return css.cn(zoneClass, zone.dragging() ? zoneDraggingClass : undefined, props.class);
    },
  } as PartProps;

  return (
    <DropzoneContext value={{ zone }}>
      <div {...merge(zone.zoneProps, own)}>
        <input {...zone.inputProps} data-part="dropzone-input" />
        <p id={labelId} data-part="dropzone-label" class={labelClass}>
          {props.label}
        </p>
        {/* always rendered, hidden when absent, so `aria-describedby` never names a missing id */}
        <p
          id={descriptionId}
          data-part="dropzone-description"
          class={descriptionClass}
          hidden={props.description === undefined}
        >
          {props.description}
        </p>
        {props.children}
        <p {...zone.statusProps} data-part="dropzone-status" class={statusClass}>
          {zone.message() ?? ""}
        </p>
      </div>
    </DropzoneContext>
  );
};

/** The browse button: `browseProps` clicks the hidden input the primitive owns, so there is one file picker, not two. */
export const DropzoneBrowse = (props: DropzoneBrowseProps): JSX.Element => {
  const { zone } = useContext(DropzoneContext);
  const merged = merge(zone.browseProps, {
    get class() {
      return css.cn(props.class);
    },
  } as PartProps) as DropzoneBrowsePartProps & typeof zone.browseProps;
  return renderPart(props, merged, undefined, (part) => (
    <Button tone="accent" {...part}>
      {props.children ?? "Choose files"}
    </Button>
  ));
};
