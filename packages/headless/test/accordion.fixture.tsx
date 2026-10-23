import { type Accordion, createAccordion } from "../src/accordion";
import type { AccordionConfig } from "@cssints/apg-specs/src/apg/accordion.bridge";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

const indicesOf = (expanded: ReadonlyArray<boolean>): ReadonlyArray<number> =>
  expanded.flatMap((open, index) => (open ? [index] : []));

/**
 * Renders `createAccordion` as headings + triggers + regions, each part carrying
 * `data-part`, and exposes the `Mounted` the DOM driver needs. The panels are
 * focusable (`tabindex=0`) so a hidden panel drops out of the Tab sequence,
 * matching the spec's "content slot shown while expanded" rule. Controlled, the
 * fixture is the host: it keeps the expanded set in a signal, passes it as
 * `value`, and either writes every request back (`accepts`) or ignores it.
 */
export const mountAccordion = (config: AccordionConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [host, setHost] = createSignal<ReadonlyArray<number>>(indicesOf(config.expanded));
  let api: Accordion | undefined;

  const writeHost = (next: ReadonlyArray<number>): void => {
    if (config.controlled) {
      setHost([...next]);
    }
  };

  const dispose = render(() => {
    const accordion = createAccordion({
      items: config.items,
      defaultValue: indicesOf(config.expanded),
      get value() {
        return config.controlled ? host() : undefined;
      },
      get multiple() {
        return config.multiple;
      },
      get collapsible() {
        return config.collapsible;
      },
      onValueChange: (expanded) => {
        events.set("onExpandedChange", [...(events.get("onExpandedChange") ?? []), [...expanded]]);
        if (config.accepts) {
          setHost([...expanded]);
        }
      },
    });
    api = accordion;
    return (
      <div>
        {Array.from({ length: config.items }, (_, index) => (
          <>
            <h3 data-part="heading" {...accordion.headingProps(index)}>
              <button data-part="trigger" {...accordion.triggerProps(index)}>
                Section {index + 1}
              </button>
            </h3>
            <div data-part="panel" {...accordion.panelProps(index)}>
              Panel {index + 1}
            </div>
          </>
        ))}
      </div>
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
