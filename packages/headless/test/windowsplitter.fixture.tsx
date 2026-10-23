import { type WindowSplitter, createWindowSplitter } from "../src/windowsplitter";
import { createEffect, createSignal } from "solid-js";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import type { WindowsplitterConfig } from "@cssints/apg-specs/src/apg/windowsplitter.bridge";
import { render } from "@solidjs/web";

const MIN = 0;
const MAX = 6;

/**
 * Renders `createWindowSplitter` as a `role=separator` bar between a primary and
 * a secondary pane. The panes are focusable (`tabindex=0`) so the F6 cycle can
 * move DOM focus onto them, which the primitive mirrors in `focusPart`.
 * Controlled, the fixture is the host: it keeps the size in a signal, passes it
 * as `value`, and writes every request back only when `accepts`.
 */
export const mountWindowSplitter = (config: WindowsplitterConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [orientation, setOrientation] = createSignal(config.orientation);
  const [fixed, setFixed] = createSignal(config.fixed);
  const [host, setHost] = createSignal(config.value);
  let api: WindowSplitter | undefined;

  const partElement = (part: string): HTMLElement | undefined => {
    const name = part === "splitter" ? "separator" : part;
    return [...root.querySelectorAll<HTMLElement>("[data-part]")].find(
      (candidate) => candidate.dataset["part"] === name,
    );
  };

  const dispose = render(() => {
    const splitter = createWindowSplitter({
      get orientation() {
        return orientation();
      },
      get fixed() {
        return fixed();
      },
      get value() {
        return config.controlled ? host() : undefined;
      },
      defaultValue: config.value,
      labelledby: config.labelledby ?? undefined,
      onValueChange: (next) => {
        events.set("onValueChange", [...(events.get("onValueChange") ?? []), next]);
        if (config.accepts) {
          setHost(next);
        }
      },
    });
    api = splitter;
    createEffect(
      () => splitter.focusPart(),
      (part) => {
        if (part === "none") {
          return;
        }
        const element = partElement(part);
        if (element !== undefined && document.activeElement !== element) {
          element.focus();
        }
      },
    );
    return (
      <>
        {config.labelledby !== null && <span id={config.labelledby}>Primary pane</span>}
        <div data-part="primary" {...splitter.primaryProps}>
          Primary pane
        </div>
        <div
          data-part="separator"
          {...splitter.separatorProps}
          aria-label={config.labelledby === null ? "Primary pane" : undefined}
        />
        <div data-part="secondary" {...splitter.secondaryProps}>
          Secondary pane
        </div>
      </>
    );
  }, root);

  return {
    root,
    events,
    value: () => api?.value() ?? config.value,
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
        case "fixed":
        case "makeFixed":
          setFixed(value !== false);
          break;
        case "makeResizable":
          setFixed(false);
          break;
        case "cycleFocus":
          api?.keyDown("F6");
          break;
        case "setValue":
          api?.freezeCollapse();
          setHost(typeof value === "number" ? value : MIN);
          break;
        case "hostToggle":
          api?.freezeCollapse();
          setHost(host() === MAX ? MIN : MAX);
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
