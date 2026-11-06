// What `createTabs`'s props accept and reject (effect-tsrs -p tsconfig.json; `@ts-expect-error` marks what must fail).
import { type TabProps, type Tabs, type TablistProps, createTabs } from "../../src/tabs";
import { focusGroupAttribute } from "../../src/focusgroup";

const tabs = createTabs({ items: 3 });
const tab = tabs.tabProps(0);

export const props = {
  id: tab.id,
  role: tab.role,
  selected: tab["aria-selected"],
  controls: tab["aria-controls"],
  disabled: tab["aria-disabled"],
  start: tab.focusgroupstart,
  element: tab.ref,
  focusgroup: tabs.tablistProps.focusgroup,
  dir: tabs.tablistProps.dir,
  owner: tabs.tablistProps.ref,
  attribute: focusGroupAttribute({ behavior: "tablist", axis: "inline", memory: false }),
};

// The provider owns an enabled tab's tabindex: the props only ever carry the disabled opt-out, so
// this intersection cannot be met.
// @ts-expect-error the focusgroup provider writes the roving tabindex, the widget never renders one
export const withRovingTabindex: TabProps & { readonly tabindex: 0 } = tab;

// The arrow movement is the platform's, so the primitive has no `keyDown` method.
// @ts-expect-error there is no keyDown: the platform moves focus along the axis
export const withKeyDownMethod: Tabs & { readonly keyDown: (key: string) => void } = tabs;

// The tab stop belongs to the provider, not to the owner: no handler is delegated from `tablistProps`.
// @ts-expect-error the primitive listens on the tab, not on the owner
export const withTablistKeyDown: TablistProps & {
  readonly onKeyDown: (event: KeyboardEvent) => void;
} = tabs.tablistProps;
