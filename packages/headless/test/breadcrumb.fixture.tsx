import type { BreadcrumbConfig } from "@cssints/apg-specs/src/apg/breadcrumb.bridge";
import type { Json } from "@cssints/apg-specs/src/scenario";
import type { Mounted } from "./dom-driver";
import { createBreadcrumb } from "../src/breadcrumb";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Renders `createBreadcrumb` as the APG markup: `nav` > `breadcrumb` (list) >
 * `item` (listitem) > `link`. The trail length is fixed at mount from `count`;
 * `renderText`/`renderLink`/`toggleMark` move the `aria-current=page` marker.
 */
export const mountBreadcrumb = (config: BreadcrumbConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [currentIndex, setCurrentIndex] = createSignal(config.count);
  const [currentIsLink, setCurrentIsLink] = createSignal(true);
  const [disabled, setDisabled] = createSignal(config.disabled);

  const items = Array.from({ length: config.count }, (_, index) => ({
    label: `Item ${index + 1}`,
    href: "#",
  }));

  const crumb = createBreadcrumb({
    items,
    get currentIndex() {
      return currentIndex();
    },
    get disabled() {
      return disabled();
    },
    label: config.label,
    labelledby: config.labelledby,
    describedby: config.describedby,
  });

  const depth = (): number => config.count;

  const dispose = render(
    () => (
      <nav data-part="nav" {...crumb.navProps}>
        <ol data-part="breadcrumb" {...crumb.listProps}>
          {items.map((item, index) => (
            <li data-part="item" {...crumb.itemProps(index)}>
              <a data-part="link" {...crumb.linkProps(index)}>
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    ),
    root,
  );

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "renderText":
          setCurrentIsLink(false);
          break;
        case "renderLink":
          setCurrentIsLink(true);
          setCurrentIndex(depth());
          break;
        case "toggleMark":
          if (!currentIsLink()) {
            setCurrentIndex((index) => (index === 0 ? depth() : 0));
          }
          break;
        case "isDisabled":
        case "disabled":
          setDisabled(value === true);
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
