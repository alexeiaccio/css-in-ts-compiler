import { cn, display, type Style, type Wrap } from "cssints";

import {
  type Action,
  bind,
  checked,
  inside,
  on,
  type Source,
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
// @ts-expect-error a string is not a source
bind({ "aria-expanded": "yes" });
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
