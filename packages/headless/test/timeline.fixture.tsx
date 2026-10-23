import { type Timeline, createTimeline } from "../src/timeline";
import { createEffect, createSignal } from "solid-js";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import type { TimelineConfig } from "@cssints/apg-specs/src/apg/timeline.bridge";
import { render } from "@solidjs/web";

/**
 * Renders `createTimeline` as a tree of rows plus a zoom ruler and exposes the
 * `Mounted` the DOM driver needs. Rows carry `data-part="row"` (so the driver
 * addresses span N as `row:N-1`) and a `data-row` id for the roving focus
 * effect: arrow navigation changes the primitive's focus signal, and this
 * fixture moves real DOM focus to match (a consumer would do the same).
 *
 * Controlled, the fixture is the host: it keeps the selection in a signal,
 * passes it as `value`, and either writes every request back (`accepts`) or
 * ignores the callback (a pinned value).
 */
export const mountTimeline = (config: TimelineConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal(config.pinned ?? config.selected);
  const writeHost = (next: number): void => {
    if (config.controlled) {
      setHost(next);
    }
  };
  let api: Timeline | undefined;

  const dispose = render(() => {
    const timeline = createTimeline({
      defaultExpanded: config.defaultExpanded,
      get value() {
        return config.controlled ? host() : undefined;
      },
      defaultValue: config.selected,
      viewStart: config.viewStart,
      viewEnd: config.viewEnd,
      onValueChange: (id) => {
        events.set("onValueChange", [...(events.get("onValueChange") ?? []), id]);
        if (config.accepts) {
          setHost(id);
        }
      },
    });
    api = timeline;

    createEffect(
      () => ({ focused: timeline.focus(), active: timeline.hasFocus() }),
      ({ focused, active }) => {
        if (!active) {
          return;
        }
        root.querySelector<HTMLElement>(`[data-part="row"][data-row="${focused}"]`)?.focus();
      },
    );

    return (
      <>
        <div data-part="timeline" {...timeline.treeProps}>
          {timeline.rows().map((row) => (
            <div data-part="row" data-row={row.id} {...timeline.rowProps(row.id)}>
              {`span ${row.id}`}
            </div>
          ))}
        </div>
        <div data-part="ruler" {...timeline.rulerProps} />
      </>
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "select":
          api?.select(Number(value));
          break;
        case "setValue":
          writeHost(Number(value));
          break;
        case "zoomIn":
          api?.zoomIn();
          break;
        case "zoomOut":
          api?.zoomOut();
          break;
        case "zoomReset":
          api?.zoomReset();
          break;
        case "panLeft":
          api?.panLeft();
          break;
        case "panRight":
          api?.panRight();
          break;
        default:
          throw new Error(`fixture has no prop ${name}`);
      }
    },
    dispose: () => {
      dispose();
      root.remove();
    },
  };
};
