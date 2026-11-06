// What `createListbox`'s props accept and reject (effect-tsrs -p tsconfig.json; `@ts-expect-error` marks what must fail).
import { type Listbox, type ListboxOptionProps, createListbox } from "../../src/listbox";
import { focusGroupAttribute } from "../../src/focusgroup";

const listbox = createListbox({ items: ["a", "b"] });
const option = listbox.optionProps(0);

export const props = {
  id: option.id,
  selected: option["aria-selected"],
  focusable: option.tabindex,
  eligible: option.focusgroup,
  focusgroup: listbox.listboxProps.focusgroup,
  owner: listbox.listboxProps.ref,
  element: option.ref,
  attribute: focusGroupAttribute({ behavior: "listbox", axis: "block", wrap: false }),
};

// The owner's keydown listener is registered by `ref`, before the platform's: the
// props carry no handler, so a host cannot wire a delegated one through them.
// @ts-expect-error a delegated `onKeyDown` would run after the polyfill has moved focus
export const withKeyDown: Listbox["listboxProps"] & {
  readonly onKeyDown: (event: KeyboardEvent) => void;
} = listbox.listboxProps;

// The option props name the focusgroup opt-out, not the platform's stop.
export const noRovingStop: ListboxOptionProps = { ...option, focusgroup: "none" };
