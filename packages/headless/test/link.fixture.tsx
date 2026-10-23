import type { Json } from "@cssints/apg-specs/src/scenario";
import type { LinkConfig } from "@cssints/apg-specs/src/apg/link.bridge";
import type { Mounted } from "./dom-driver";
import { createLink } from "../src/link";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

const optional = (value: Json | undefined): string | undefined =>
  value === null || value === undefined ? undefined : String(value);

/**
 * Renders `createLink` as a native `<a href>` or a custom `role=link` element,
 * plus the `target` the activation moves focus to and the outside `button`
 * `link.ariakit.link-is-focusable` clicks. Records `onClick`/`onPress`/
 * `onNavigate` the way the ported scenarios read them.
 */
export const mountLink = (config: LinkConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  const [native, setNative] = createSignal(config.native);
  const [href, setHref] = createSignal<string | undefined>(config.href);
  const [disabled, setDisabled] = createSignal(config.disabled);
  const [current, setCurrent] = createSignal(config.current);

  const linkElement = (): HTMLElement | null =>
    root.querySelector<HTMLElement>('[data-part="link"]');

  const record = (): void => {
    events.set("onClick", ["A"]);
    events.set("onPress", ["link"]);
    const target = href();
    if (target !== undefined) {
      events.set("onNavigate", [target]);
    }
    root.querySelector<HTMLElement>('[data-part="target"]')?.focus();
  };

  const link = createLink({
    get href() {
      return href();
    },
    get native() {
      return native();
    },
    get disabled() {
      return disabled();
    },
    get current() {
      return current();
    },
    onActivate: record,
  });

  const dispose = render(
    () => (
      <>
        {native() ? (
          <a data-part="link" {...link.linkProps}>
            {link.href() ?? "link"}
          </a>
        ) : (
          <span data-part="link" {...link.linkProps}>
            link
          </span>
        )}
        <span data-part="target" tabindex={-1}>
          target
        </span>
        <button data-part="button" type="button" onClick={() => linkElement()?.focus()}>
          Button
        </button>
      </>
    ),
    root,
  );

  return {
    root,
    events,
    setProp: (name, value) => {
      switch (name) {
        case "back": {
          const active = document.activeElement;
          if (active instanceof HTMLElement && root.contains(active)) {
            active.blur();
          }
          break;
        }
        case "native":
        case "setNative":
          setNative(true);
          break;
        case "custom":
        case "setCustom":
          setNative(false);
          break;
        case "disabled":
        case "isDisabled":
          setDisabled(value === true);
          break;
        case "href":
          setHref(optional(value));
          break;
        case "active":
        case "current":
          setCurrent(value === true);
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
