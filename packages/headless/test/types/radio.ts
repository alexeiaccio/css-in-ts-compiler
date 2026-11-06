// What `createRadioGroup`'s props accept and reject (effect-tsrs -p tsconfig.json; `@ts-expect-error` marks what must fail).
import {
  type RadioGroup,
  type RadioGroupProps,
  type RadioProps,
  createRadioGroup,
} from "../../src/radio";
import { focusGroupAttribute } from "../../src/focusgroup";

const group = createRadioGroup({ values: ["a", "b"] });
const item = group.radioProps(0);

export const props = {
  role: group.radiogroupProps.role,
  orientation: group.radiogroupProps["aria-orientation"],
  active: group.radiogroupProps["aria-activedescendant"],
  focusgroup: group.radiogroupProps.focusgroup,
  dir: group.radiogroupProps.dir,
  owner: group.radiogroupProps.ref,
  element: item.ref,
  start: item.focusgroupstart,
  optOut: item.focusgroup,
  tabindex: item.tabindex,
  attribute: focusGroupAttribute({ behavior: "radiogroup", wrap: true, memory: false }),
};

// The roving group is a focusgroup: the definition is the platform's attribute.
export const definition: string | undefined = group.radiogroupProps.focusgroup;
// @ts-expect-error the definition is a string (or absent in activedescendant), never a boolean
export const asBoolean: boolean = group.radiogroupProps.focusgroup;

// The owner's ref is what builds the platform's provider — the props carry no handler for it.
// @ts-expect-error the provider is built by `ref`, not by a prop the host calls
export const withoutRef: RadioGroupProps = { ...group.radiogroupProps, ref: undefined };

// Arrow movement is the platform's, so the primitive has no `keyDown` method.
// @ts-expect-error there is no keyDown: the platform moves focus along both axes
export const withKeyDownMethod: RadioGroup & { readonly keyDown: (key: string) => void } = group;

// An item's tabindex is a constant author value (`-1`, or `0` where only the
// native engine can focus a div) — never the roving stop the platform derives.
export const authorValue: 0 | -1 | undefined = item.tabindex;
// @ts-expect-error a roving stop is not a member the widget renders
export const asRovingStop: RadioProps & { readonly tabindex: 1 } = { ...item };
