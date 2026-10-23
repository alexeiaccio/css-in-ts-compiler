import { type TooltipGroup, createTooltipGroup } from "../src/tooltip";
import type { Json } from "@cssints/apg-specs/scenario";
import type { Mounted } from "./dom-driver";
import type { TooltipConfig } from "@cssints/apg-specs/apg/tooltip.bridge";
import { createSignal } from "solid-js";
import { render } from "@solidjs/web";

/**
 * Renders `createTooltipGroup` as two triggers and their tooltips. The tooltip
 * ids are fixed (`tooltip:0`/`tooltip:1`) so the differential walk can compare
 * `aria-describedby` against the spec's symbolic refs. A trigger only reports a
 * blur to the primitive when focus leaves the whole widget (moving between the
 * triggers is one focus change, not focus-out + focus-in). Controlled, the
 * fixture is the host: it keeps the visible tooltip in a signal (0 none / 1
 * first / 2 second) and writes every request back only when `accepts`.
 */
export const mountTooltip = (config: TooltipConfig): Mounted => {
  const root = document.createElement("div");
  document.body.append(root);
  const events = new Map<string, Json[]>();
  // the host write is synchronous (like createControllable's `local`), so the
  // primitive can tell an accepted request from a vetoed one right away
  let hostLocal = config.open ? 1 : 0;
  const [hostVersion, setHostVersion] = createSignal(0);
  const host = (): number => {
    hostVersion();
    return hostLocal;
  };
  const setHost = (next: number): void => {
    hostLocal = next;
    setHostVersion((count) => count + 1);
  };
  let api: TooltipGroup | undefined;

  const elementOf = (target: string): HTMLElement | undefined => {
    const [name = "", index = "0"] = target.split(":");
    return [...root.querySelectorAll<HTMLElement>(`[data-part="${name}"]`)][Number(index)];
  };

  const dispose = render(() => {
    const group = createTooltipGroup({
      triggers: [
        { id: "trigger-0", tooltipId: "tooltip:0" },
        { id: "trigger-1", tooltipId: "tooltip:1" },
      ],
      disabled: config.disabled,
      openOnFocus: config.delay !== undefined,
      openOnHover: config.delay === 0,
      nativePointer: config.delay === 0,
      ...(config.defaultOpen ? { defaultOpen: 0 } : {}),
      get value() {
        return config.controlled ? host() : undefined;
      },
      onOpenChange: (open, index) => {
        events.set("onOpenChange", [...(events.get("onOpenChange") ?? []), open]);
        if (config.accepts) {
          setHost(open ? index + 1 : 0);
        }
      },
    });
    api = group;
    const blur = (event: FocusEvent): void => {
      const next = event.relatedTarget;
      if (!(next instanceof Node) || !root.contains(next)) {
        group.blur();
      }
    };
    return (
      <>
        <button data-part="trigger" {...group.triggerProps(0)} onBlur={blur}>
          A
        </button>
        <button data-part="trigger" {...group.triggerProps(1)} onBlur={blur}>
          B
        </button>
        <div data-part="tooltip" {...group.tooltipProps(0)}>
          Tip A
        </div>
        <div data-part="tooltip" {...group.tooltipProps(1)}>
          Tip B
        </div>
      </>
    );
  }, root);

  return {
    root,
    events,
    value: () => {
      const index = api?.visibleIndex() ?? null;
      return index === null ? 0 : index + 1;
    },
    setProp: (name, value) => {
      switch (name) {
        case "blur":
          api?.blur();
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          break;
        case "pointerEnterA":
          api?.pointerEnter(0);
          break;
        case "pointerEnterB":
          api?.pointerEnter(1);
          break;
        case "focusA":
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          elementOf("trigger:0")?.focus();
          break;
        case "focusB":
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          elementOf("trigger:1")?.focus();
          break;
        case "pointerLeave":
          api?.pointerLeave();
          api?.hideTimer();
          break;
        case "pointerEnterTip":
          api?.pointerEnterTip();
          break;
        case "showTimerA":
          api?.showTimer(0);
          break;
        case "showTimerB":
          api?.showTimer(1);
          break;
        case "hideTimer":
          api?.hideTimer();
          break;
        case "warmExpire":
          api?.warmExpire();
          break;
        case "escape":
          api?.escape();
          break;
        case "setWarmup":
          api?.setWarmup(value === true);
          break;
        case "setValue":
          api?.hostSet(Number(value));
          setHost(Number(value));
          break;
        case "hostToggle": {
          const next = host() === 0 ? 1 : 0;
          api?.hostToggle();
          setHost(next);
          break;
        }
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
