import type { AccordionConfig } from "@cssints/apg-specs/apg/accordion.bridge";
import { type Accordion as AccordionController } from "@cssints/headless";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./accordion-driver.ts";
import { Accordion } from "./accordion.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

const indicesOf = (expanded: ReadonlyArray<boolean>): ReadonlyArray<number> =>
  expanded.flatMap((open, index) => (open ? [index] : []));

/**
 * Mounts the styled accordion for the scenario walk. The panels are focusable (`tabindex=0`), so a
 * hidden panel drops out of the Tab sequence, matching the spec's "content slot shown while
 * expanded" rule. Controlled, the fixture is the host: it keeps the expanded set in a signal,
 * passes it as `value`, and either writes every request back (`accepts`) or ignores it.
 */
export const mountAccordion = (config: AccordionConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal<ReadonlyArray<number>>(indicesOf(config.expanded));
  let api: AccordionController | undefined;

  const writeHost = (next: ReadonlyArray<number>): void => {
    if (config.controlled) {
      setHost([...next]);
    }
  };

  const dispose = render(() => {
    return (
      <Accordion
        items={config.items}
        defaultValue={indicesOf(config.expanded)}
        value={config.controlled ? host() : undefined}
        multiple={config.multiple}
        collapsible={config.collapsible}
        onReady={(controller) => {
          api = controller;
        }}
        onValueChange={(expanded) => {
          events.set("onExpandedChange", [
            ...(events.get("onExpandedChange") ?? []),
            [...expanded],
          ]);
          if (config.accepts) {
            setHost([...expanded]);
          }
        }}
        trigger={(index) => `Section ${index + 1}`}
        panel={(index) => `Panel ${index + 1}`}
      />
    );
  }, root);

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "multiple":
          api?.setMultiple(value === true);
          break;
        case "collapsible":
          api?.setCollapsible(value === true);
          break;
        case "headingLevel":
          api?.setHeadingLevel(Number(value));
          break;
        case "expanded":
        case "setValue":
          if (typeof value === "boolean") {
            writeHost(value ? [0] : []);
          } else if (Array.isArray(value)) {
            writeHost(value.map(Number));
          } else {
            throw new Error(`expanded needs an array, got ${JSON.stringify(value)}`);
          }
          break;
        case "hostToggle":
          writeHost(host().includes(0) ? host().filter((index) => index !== 0) : [...host(), 0]);
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
