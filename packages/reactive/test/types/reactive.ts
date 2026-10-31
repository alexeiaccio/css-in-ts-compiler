import { cn, display, type Style, type Wrap } from "cssints";

import {
  type Action,
  bind,
  checked,
  either,
  equals,
  inside,
  on,
  type Persisted,
  type Source,
  persist,
  set,
  state,
  toggle,
  value,
  when,
} from "../../src/index.ts";

const ui = state({ open: false, tab: "one", count: 0 });

export const owner: Style = ui.owner;
export const open: Source<boolean> = ui.open;
export const tab: Source<string> = ui.tab;
export const count: Source<number> = ui.count;

export const card = cn(ui.owner, display("block"));
export const toggled: Action = toggle(ui.open);
export const tabbed: Action = set(ui.tab, "two");
export const counted: Action = set(ui.count, 2);
export const fromValue: Action = set(ui.tab, value());
export const fromChecked: Action = set(ui.open, checked());
export const events = on({ click: toggle(ui.open), input: [set(ui.tab, "two"), set(ui.count, 3)] });
export const attributes = bind({ "aria-expanded": ui.open, "data-current": ui.tab });
export const own: Wrap = when(ui.open);
export const numeral: Wrap = when(ui.count, 0);
export const panel = inside(ui.open)(display("block"));
export const one = inside(ui.tab, "two")(display("block"));

// computed attributes: a comparison and a choice are bindings, not sources
export const comparedOpen = equals(ui.open, true);
export const comparedTab = equals(ui.tab, "one");
export const chosen = either(equals(ui.tab, "one"), "0", "-1");
export const computed = bind({
  "aria-selected": equals(ui.tab, "one"),
  "aria-controls": "panel-one",
  tabindex: either(equals(ui.tab, "one"), "0", "-1"),
  "data-open": ui.open,
});

// @ts-expect-error a string state is not a toggle
toggle(ui.tab);
// @ts-expect-error a number state is not a toggle
toggle(ui.count);
// @ts-expect-error not a value of that source
set(ui.open, "yes");
// @ts-expect-error not a value of that source
set(ui.count, "one");
// @ts-expect-error an event reactive() does not listen to
on({ keypress: toggle(ui.open) });
// @ts-expect-error an event takes an action, not a source
on({ click: ui.open });
// @ts-expect-error an action is not a style (writes happen only in on())
export const actionAsStyle: Style = toggle(ui.open);
// @ts-expect-error a source is not a style
export const sourceAsStyle: Style = ui.open;
// @ts-expect-error a source is not an action
on({ click: ui.open });
// @ts-expect-error an action is not a source
bind({ "aria-expanded": toggle(ui.open) });
// @ts-expect-error a number is not a source name
when(ui);
// @ts-expect-error a value() is a string field, not a boolean state's
set(ui.open, value());
// @ts-expect-error a checked() is a boolean field, not a string state's
set(ui.tab, checked());
// @ts-expect-error a payload is not a source
toggle(checked());
// @ts-expect-error a payload is not a source of bind()
bind({ "aria-expanded": value() });
// @ts-expect-error a payload is not an action
on({ click: checked() });
// @ts-expect-error a payload is not a style
export const payloadAsStyle: Style = value();
// @ts-expect-error a payload is not a condition
export const payloadAsWrap: Wrap = checked();
// @ts-expect-error a payload is not a value of when()
when(checked());

// computed attributes: a comparison and a choice are equations, not sources, actions, values or conditions
// @ts-expect-error not a value of that source
equals(ui.open, "yes");
// @ts-expect-error not a value of that source
equals(ui.tab, 1);
// @ts-expect-error either() takes a comparison, not a bare source
either(ui.tab, "0", "-1");
// @ts-expect-error a Comparison is not a Source of toggle()
toggle(equals(ui.open, true));
// @ts-expect-error a Comparison is not a value of set()
set(ui.tab, equals(ui.tab, "one"));
// @ts-expect-error a Comparison is not a condition
when(equals(ui.open, true));
// @ts-expect-error a Comparison is not a condition
inside(equals(ui.tab, "one"));
// @ts-expect-error a Comparison is not an action
on({ click: equals(ui.open, true) });
// @ts-expect-error a Comparison is not a style
export const comparisonAsStyle: Style = equals(ui.open, true);
// @ts-expect-error a Choice is not a Source
toggle(either(equals(ui.open, true), "0", "-1"));
// @ts-expect-error a Choice is not a value of a state
set(ui.tab, either(equals(ui.tab, "one"), "0", "-1"));
// @ts-expect-error a Choice is not a condition
when(either(equals(ui.tab, "one"), "0", "-1"));
// @ts-expect-error a Choice is not an action
on({ click: either(equals(ui.open, true), "0", "-1") });
// @ts-expect-error a Choice is not a style
export const choiceAsStyle: Style = either(equals(ui.open, true), "0", "-1");

// persistence: a persisted value is a state() value, and the source keeps the value's type
const stored = state({
  open: persist(false, "demo-open"),
  tab: persist("one", "demo-tab"),
  count: 0,
});
export const storedOwner: Style = stored.owner;
export const storedOpen: Source<boolean> = stored.open;
export const storedTab: Source<string> = stored.tab;
export const storedCount: Source<number> = stored.count;
const persisted: Persisted<boolean> = persist(false, "demo-open");

// @ts-expect-error a Persisted is not a source
toggle(persisted);
// @ts-expect-error a Persisted is not a source of set()
set(persisted, true);
// @ts-expect-error a Persisted is not a value of a source
set(stored.open, persisted);
// @ts-expect-error a Persisted is not a source of bind()
bind({ "aria-expanded": persisted });
// @ts-expect-error a Persisted is not a condition
when(persisted);
// @ts-expect-error a Persisted is not an action
on({ click: persisted });
// @ts-expect-error a Persisted is not a style
export const persistedAsStyle: Style = persisted;
// @ts-expect-error a Persisted is not a state's source name
inside(persisted);
// @ts-expect-error persist() takes a value
persist();
// @ts-expect-error persist() takes a state value
persist({}, "demo-open");
