// Where the async is. @cssints/reactive has no loading boundary, because a request is not CSS: nothing in a style sheet can
// wait, fail or retry. `on({ submit: emit("save") })` is the one hand-off — the event leaves the CSS world and the app takes
// over with `listen()` from @cssints/reactive/runtime. Pending, saved and failed are the app's state, not the plugin's: the
// app writes `data-pending` and `data-state` on the form, and this file's CSS only paints what those attributes say. The
// form stays an owner (the runtime applies a program to the nearest owner), but its one state never changes during a
// request; no JavaScript state stands in for a condition CSS can write.
import { emit, on, state } from "@cssints/reactive" with { type: "cssints" };
import { listen } from "@cssints/reactive/runtime";
import {
  alignItems,
  animation,
  attr,
  bg,
  border,
  borderRadius,
  borderTopColor,
  cn,
  color,
  cursor,
  display,
  flexDirection,
  fontSize,
  fontWeight,
  gap,
  group,
  height,
  keyframes,
  lineHeight,
  margin,
  maxWidth,
  padding,
  transform,
  width,
  within,
} from "cssints" with { type: "cssints" };
import { onSettled } from "solid-js";

import type { Meta, Story } from "../csf.ts";
import { t } from "../theme.ts" with { type: "cssints" };

interface SaveFormProps {
  /** The fake save ends in the failure path after the wait, so the failed message paints from the same attributes. */
  readonly fail: boolean;
}

// The owner the submit program runs against. Its own state is the build's and never changes while the request runs: the
// request is the app's, which is the whole point.
const ui = state({ idle: true });

// The spinner, plain keyframes: a request in flight is motion, and motion is CSS once an attribute says it is in flight.
const spin = keyframes({ from: transform("rotate(0deg)"), to: transform("rotate(360deg)") });

// group("save") puts the marker on the form, so a descendant's condition can read the attributes the app writes there.
const formClass = cn(
  // The owner the submit program runs against, the hand-off itself, and the group marker within() reads from the app's
  // attributes.
  ui.owner,
  on({ submit: emit("save") }),
  group("save"),
  display("flex"),
  flexDirection("column"),
  alignItems("flex-start"),
  gap(3),
  maxWidth("28rem"),
  padding(t.space.md),
  bg(t.color.surface),
  border("1px solid", t.color.border),
  borderRadius(t.radius.md),
  fontSize(t.fontSize.sm),
);

const label = cn(
  display("flex"),
  flexDirection("column"),
  gap(1),
  color(t.color.muted),
  fontSize(t.fontSize.sm),
);

const input = cn(
  padding("8px 10px"),
  bg(t.color.bg),
  color(t.color.text),
  border("1px solid", t.color.border),
  borderRadius(t.radius.sm),
  fontSize(t.fontSize.md),
);

// The button looks disabled while the request runs, from the form's data-pending: the app does not own a look.
const button = cn(
  display("inline-flex"),
  alignItems("center"),
  gap(2),
  padding("10px 16px"),
  border("1px solid", t.color.accent),
  borderRadius(t.radius.sm),
  bg(t.color.accent),
  color(t.color.onAccent),
  fontSize(t.fontSize.md),
  fontWeight("600"),
  cursor("pointer"),
  within(attr("data-pending", "true"), "save")(bg(t.color.border), color(t.color.muted)),
);

const spinner = cn(
  display("none"),
  width("12px"),
  height("12px"),
  border("2px solid transparent"),
  borderTopColor("currentColor"),
  borderRadius(t.radius.full),
  animation(spin, "700ms", "linear", "infinite"),
  within(attr("data-pending", "true"), "save")(display("inline-block")),
);

const message = cn(margin(0), display("none"), lineHeight("1.4"), fontSize(t.fontSize.sm));

// One line per outcome, both in the markup: CSS paints the one the app's attribute names, so no copy is written from JS.
const saved = cn(
  message,
  color(t.color.accent),
  within(attr("data-state", "saved"), "save")(display("block")),
);

const failed = cn(
  message,
  color("oklch(58% 0.21 26)"),
  within(attr("data-state", "failed"), "save")(display("block")),
);

// The app side of the hand-off: it hears the submit once, prevents the page load, does the fake request, and writes the
// attributes. 400 ms is the request; `fail` is what the story's args make of it.
function SaveForm(props: SaveFormProps) {
  let form: HTMLFormElement | undefined;
  let submit: HTMLButtonElement | undefined;

  onSettled(() => {
    if (!form || !submit) return;
    const node = form;
    const button = submit;
    // listen() returns its disposer: a story switch must not leave a listener saving into a form that is gone.
    // oxlint-disable-next-line typescript/no-misused-promises -- an async listener; listen() ignores what it returns
    return listen(node, "save", async ({ detail }) => {
      detail.event.preventDefault(); // the native submit would reload the page; the request is the app's
      delete node.dataset.state; // the last outcome is stale while this request runs
      node.dataset.pending = "true";
      button.setAttribute("aria-busy", "true");
      // oxlint-disable-next-line promise/avoid-new -- the fake request is a wait, as in the package's browser test
      await new Promise((resolve) => setTimeout(resolve, 400));
      delete node.dataset.pending;
      button.setAttribute("aria-busy", "false");
      node.dataset.state = props.fail ? "failed" : "saved";
    });
  });

  return (
    <form id="save-form" class={formClass} ref={(el) => (form = el)}>
      <label class={label} for="save-name">
        Name
      </label>
      <input id="save-name" class={input} name="name" value="Ada Lovelace" />
      <button id="save-submit" type="submit" class={button} ref={(el) => (submit = el)}>
        <span id="save-spinner" class={spinner} aria-hidden="true" />
        <span>Save</span>
      </button>
      <p id="save-saved" class={saved}>
        Saved. The app wrote data-state="saved" after the await; this line is
        within(attr("data-state", "saved")) in the sheet.
      </p>
      <p id="save-failed" class={failed}>
        Save failed. The app wrote data-state="failed"; the form still submits, so the next request
        starts from the same attributes.
      </p>
    </form>
  );
}

const meta = {
  title: "CSS interactions/Save form",
  component: SaveForm,
  args: { fail: false },
} satisfies Meta<SaveFormProps>;

export default meta;

export const Saved: Story<SaveFormProps> = {};

export const Failed: Story<SaveFormProps> = { args: { fail: true } };
