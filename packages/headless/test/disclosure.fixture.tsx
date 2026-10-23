import { type Disclosure, createDisclosure } from "../src";
import type { DisclosureConfig } from "@cssints/apg-specs/src/apg/disclosure.bridge";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Renders `createDisclosure` as a button + region and exposes the `Mounted` the
 * DOM driver needs. Controlled, the fixture is the host: it keeps the value in a
 * signal, passes it as `value`, and either writes every request back (`accepts`)
 * or ignores the callback. The second `trigger` part is the host's outside button.
 */
export const mountDisclosure = (config: DisclosureConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [disabled, setDisabled] = createSignal(config.disabled);
  const [host, setHost] = createSignal(config.expanded);
  const writeHost = (next: boolean): void => {
    if (config.controlled) {
      setHost(next);
    }
  };
  let api: Disclosure | undefined;

  const dispose = render(() => {
    const disclosure = createDisclosure({
      defaultValue: config.expanded,
      get value() {
        return config.controlled ? host() : undefined;
      },
      get disabled() {
        return disabled();
      },
      onValueChange: (expanded) => {
        events.set("onExpandedChange", [...(events.get("onExpandedChange") ?? []), expanded]);
        if (config.accepts) {
          setHost(expanded);
        }
      },
    });
    api = disclosure;
    return (
      <>
        <button data-part="trigger" {...disclosure.triggerProps}>
          Details
        </button>
        <div data-part="panel" {...disclosure.panelProps}>
          Content
        </div>
        <button
          data-part="trigger"
          type="button"
          aria-expanded={disclosure.expanded() ? "true" : "false"}
          aria-controls={disclosure.panelProps.id}
          onClick={() => writeHost(!host())}
        >
          Outside
        </button>
      </>
    );
  }, root);

  return {
    root,
    events,
    value: () => ({ isExpanded: api?.expanded() ?? false }),
    setProp: (name, value) => {
      switch (name) {
        case "disabled":
        case "isDisabled":
          setDisabled(value === true);
          break;
        case "expand":
          api?.expand();
          break;
        case "collapse":
          api?.collapse();
          break;
        case "toggle":
          api?.toggle();
          break;
        case "isExpanded":
          writeHost(value === true);
          break;
        case "hostToggle":
          writeHost(!host());
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
