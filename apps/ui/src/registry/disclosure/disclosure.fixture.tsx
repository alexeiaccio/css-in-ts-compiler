import { type Disclosure } from "@cssints/headless";
import { type DisclosureConfig } from "@cssints/apg-specs/apg/disclosure.bridge";
import { type Json } from "@cssints/apg-specs/scenario";
import { type Mounted } from "./disclosure-driver.ts";
import { Disclosure as StyledDisclosure } from "./disclosure.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Mounts the styled disclosure for the scenario walk and exposes what the driver needs. The
 * second `trigger` part is the host's outside button, as in the primitive's own fixture.
 *
 * @param {DisclosureConfig} config the state the walk starts from and the host's policy
 * @returns {Mounted} the mounted element and the driver's view of it
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
    return (
      <>
        <StyledDisclosure
          summary="Details"
          defaultValue={config.expanded}
          value={config.controlled ? host() : undefined}
          disabled={disabled()}
          onReady={(controller) => {
            api = controller;
          }}
          onValueChange={(expanded) => {
            events.set("onExpandedChange", [...(events.get("onExpandedChange") ?? []), expanded]);
            if (config.accepts) {
              setHost(expanded);
            }
          }}
        >
          Content
        </StyledDisclosure>
        <button
          data-part="trigger"
          type="button"
          aria-expanded={host() ? "true" : "false"}
          aria-controls={api?.panelProps.id}
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
