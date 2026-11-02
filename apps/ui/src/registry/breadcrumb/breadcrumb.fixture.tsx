import type { BreadcrumbConfig } from "@cssints/apg-specs/apg/breadcrumb.bridge";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./breadcrumb-driver.ts";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "./breadcrumb.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Mounts the styled breadcrumb as the APG trail the bridge expects: the `Breadcrumb` landmark,
 * `BreadcrumbList`, one `BreadcrumbItem` per step and its `BreadcrumbLink`. The trail length is
 * fixed at mount from `count`; a signal moves `currentIndex`, and the `renderText`, `renderLink`
 * and `toggleMark` props move the `aria-current=page` marker (as in the primitive's fixture, the
 * link stays a link: the bridge only reads the mark).
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

  const depth = (): number => config.count;

  const dispose = render(() => {
    return (
      <Breadcrumb
        items={items}
        currentIndex={currentIndex()}
        disabled={disabled()}
        label={config.label}
        labelledby={config.labelledby}
        describedby={config.describedby}
      >
        <BreadcrumbList>
          {items.map((item, index) => (
            <BreadcrumbItem index={index}>
              <BreadcrumbLink index={index}>{item.label}</BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }, root);

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
