import type { Json } from "@cssints/apg-specs/scenario";
import type { LinkConfig } from "@cssints/apg-specs/apg/link.bridge";
import type { Mounted } from "./link-driver.ts";
import { Link, type LinkPartProps, type LinkState } from "./link.tsx";
import type { Render } from "../render.tsx";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

const optional = (value: Json | undefined): string | undefined =>
  value === null || value === undefined ? undefined : String(value);

/** The skin's own options: the tone `render` sees, and the element a page swaps in. */
export interface LinkLook {
  readonly tone?: "default" | "muted";
  readonly render?: Render<LinkPartProps, LinkState>;
}

/**
 * Renders the styled `Link` as a native `<a href>` or a custom `role=link` element, plus the `target` the activation moves
 * focus to and the outside `button` `link.ariakit.link-is-focusable` clicks. Records `onClick`/`onPress`/`onNavigate` the
 * way the ported scenarios read them.
 */
export const mountLink = (config: LinkConfig, look: LinkLook = {}): Mounted => {
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

  const dispose = render(
    () => (
      <>
        <Link
          href={href()}
          native={native()}
          disabled={disabled()}
          current={current()}
          tone={look.tone}
          render={look.render}
          onActivate={record}
        >
          {href() ?? "link"}
        </Link>
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

/** The skin's own mounting: the scenario fixture, with the props the look block drives and no `target`/`button` beside it. */
export interface StyledLinkOptions {
  readonly native?: boolean;
  readonly href?: string | undefined;
  readonly disabled?: boolean;
  readonly current?: boolean;
  readonly tone?: "default" | "muted";
  readonly render?: Render<LinkPartProps, LinkState>;
}

/**
 * Mounts the styled link for the skin block: the look options on top of the scenario fixture, so a test can move `current`
 * or switch to the native anchor through `setProp` while it reads the same DOM.
 */
export const mountStyledLink = (options: StyledLinkOptions = {}): Mounted =>
  mountLink(
    {
      native: options.native ?? options.href !== undefined,
      href: options.href,
      disabled: options.disabled ?? false,
      current: options.current ?? false,
    },
    { tone: options.tone, render: options.render },
  );
