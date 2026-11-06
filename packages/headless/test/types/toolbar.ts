// What `createToolbar`'s props accept and reject (effect-tsrs -p tsconfig.json; `@ts-expect-error` marks what must fail).
import { type Toolbar, type ToolbarItemProps, createToolbar } from "../../src/toolbar";
import { focusGroupAttribute } from "../../src/focusgroup";

const toolbar = createToolbar({ items: ["a", "b"] });
const item = toolbar.itemProps(0);

export const props = {
  id: item.id,
  role: item.role,
  disabled: item["aria-disabled"],
  focusgroup: toolbar.toolbarProps.focusgroup,
  owner: toolbar.toolbarProps.ref,
  element: item.ref,
  attribute: focusGroupAttribute({ behavior: "toolbar", axis: "block", wrap: false }),
};

// The provider owns an item's tabindex: the item props carry no such member, so this intersection cannot be met.
// @ts-expect-error the focusgroup provider writes the item tabindex, the widget never renders one
export const withTabindex: ToolbarItemProps & { readonly tabindex: 0 | -1 } = item;

// The owner's keydown listener is registered by `ref`, before the provider's, so the props carry no handler.
// @ts-expect-error a delegated `onKeyDown` would run after the polyfill has moved focus
export const withKeyDown: Toolbar["toolbarProps"] & {
  readonly onKeyDown: (event: KeyboardEvent) => void;
} = toolbar.toolbarProps;

// The arrow movement is the platform's, so the primitive has no `keyDown` method.
// @ts-expect-error there is no keyDown: the platform moves focus along the axis
export const withKeyDownMethod: Toolbar & { readonly keyDown: (key: string) => void } = toolbar;
