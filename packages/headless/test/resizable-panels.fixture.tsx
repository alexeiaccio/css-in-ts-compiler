import { type ResizablePanels, createResizablePanels } from "../src/resizable-panels";
import { createEffect, createSignal } from "solid-js";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import {
  PANELS_LAYOUTS,
  type PanelsConfig,
  type PanelsLayout,
} from "@cssints/apg-specs/src/patterns/resizable-panels.bridge";
import { render } from "@solidjs/web";

const isLayout = (value: Json | undefined): value is PanelsLayout =>
  typeof value === "string" && Object.hasOwn(PANELS_LAYOUTS, value);

/**
 * Renders `createResizablePanels` as a flex group of three panes with two
 * `role=separator` bars, 600 px wide so a 10% step is a whole 60 px (the drag
 * steps are percent deltas, the DOM dispatches them as pointer coordinates).
 * Controlled, the fixture is the host: it keeps the layout in a signal, passes it
 * as `sizes`, and writes every request back only when `accepts`.
 */
export const mountResizablePanels = (config: PanelsConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [orientation, setOrientation] = createSignal(config.orientation);
  const [host, setHost] = createSignal<ReadonlyArray<number>>(config.sizes);
  let api: ResizablePanels | undefined;

  const partElement = (part: string): HTMLElement | undefined =>
    root.querySelector<HTMLElement>(`[data-part="${part}"]`) ?? undefined;

  const dispose = render(() => {
    const panels = createResizablePanels({
      panes: [
        { label: "Sidebar", collapsible: true },
        { label: "Content" },
        { label: "Inspector" },
      ],
      get orientation() {
        return orientation();
      },
      get sizes() {
        return config.controlled ? host() : undefined;
      },
      defaultSizes: config.sizes,
      onSizesChange: (next) => {
        events.set("onSizesChange", [...(events.get("onSizesChange") ?? []), [...next]]);
        if (config.accepts) {
          setHost(next);
        }
      },
    });
    api = panels;
    createEffect(
      () => panels.focusSeparator(),
      (index) => {
        if (index === null) {
          return;
        }
        const element = partElement(`separator:${index}`);
        if (element !== undefined && document.activeElement !== element) {
          element.focus();
        }
      },
    );
    return (
      <div
        data-part="group"
        {...panels.groupProps}
        style={{ display: "flex", width: "600px", height: "400px" }}
      >
        {[0, 1, 2].map((index) => (
          <>
            <div
              data-part={`pane:${index}`}
              {...panels.paneProps(index)}
              style={{ flex: `${panels.sizes()[index]}%` }}
            />
            {index < 2 && (
              <div
                data-part={`separator:${index}`}
                {...panels.separatorProps(index)}
                style={{ flex: "0 0 8px" }}
              />
            )}
          </>
        ))}
      </div>
    );
  }, root);

  return {
    root,
    events,
    value: () => [...(api?.sizes() ?? config.sizes)],
    focus: () => {
      const index = api?.focusSeparator();
      return index === undefined || index === null ? null : `separator:${index}`;
    },
    setProp: (name, value) => {
      switch (name) {
        case "orientation":
          setOrientation(value === "horizontal" ? "horizontal" : "vertical");
          break;
        case "orientHorizontal":
          setOrientation("horizontal");
          break;
        case "orientVertical":
          setOrientation("vertical");
          break;
        case "hostLayout":
          if (isLayout(value)) {
            setHost([...PANELS_LAYOUTS[value]]);
          }
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
