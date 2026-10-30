// The composition contracts of the kit, in a real Chromium: `render` on a part, a state accessor that stays live, the mode a
// card sits in, the radius it hands to a card inside it, the size an ancestor sets, and a field that owns its control's
// ARIA — the things a component cannot prove alone, which is why they are one test. The views live in combos.fixture.tsx: a
// module with cssints sites is evaluated at build time, and this file has to run in the browser.
import { render } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { flush } from "solid-js";
import { describe, expect, it } from "vite-plus/test";

import {
  Alerts,
  Crumbs,
  Dialogs,
  Fields,
  Groups,
  Meters,
  Menus,
  Mode,
  Nesting,
  Renders,
  Selects,
  Sizes,
  Textareas,
  Toolbars,
  Tooltips,
} from "./combos.fixture.tsx";

const mount = (view: () => JSX.Element): HTMLElement => {
  const root = document.createElement("div");
  document.body.append(root);
  render(view, root);
  flush();
  return root;
};

const style = (element: Element): CSSStyleDeclaration => getComputedStyle(element);
const part = (root: HTMLElement, name: string): HTMLElement => {
  const found = root.querySelector<HTMLElement>(`[data-part="${name}"]`);
  if (found === null) {
    throw new Error(`no [data-part="${name}"] in ${root.innerHTML}`);
  }
  return found;
};

describe("the kit composes", () => {
  it("hands a card's radius to a card inside it, through a wrapper", () => {
    const root = mount(() => <Nesting />);
    const cards = root.querySelectorAll<HTMLElement>('[data-part="card"]');
    expect(style(cards[0]!).borderRadius).toBe("16px");
    // frame(): the inner radius is the parent's inner radius (16 - padding 12 - border 1) less its own margin (none)
    expect(style(cards[1]!).borderRadius).toBe("3px");
    expect(style(cards[1]!).padding).toBe("12px");
  });

  it("follows the mode the card sits in, without a prop", () => {
    const root = mount(() => <Mode />);
    const cards = root.querySelectorAll<HTMLElement>('[data-part="card"]');
    expect(style(cards[0]!).backgroundColor).not.toBe(style(cards[1]!).backgroundColor);
    expect(style(cards[0]!).color).not.toBe(style(cards[1]!).color);
  });

  it("takes its size from the container and its tone from a variant", () => {
    const root = mount(() => <Sizes />);
    const buttons = root.querySelectorAll<HTMLElement>('[data-part="button"]');
    expect(style(buttons[0]!).paddingTop).toBe("8px");
    expect(style(buttons[0]!).paddingLeft).toBe("16px");
    expect(style(buttons[1]!).paddingTop).toBe("4px");
    expect(style(buttons[1]!).paddingLeft).toBe("8px");
    expect(style(buttons[1]!).fontSize).toBe("12px");
    expect(style(buttons[2]!).backgroundColor).not.toBe(style(buttons[0]!).backgroundColor);
  });

  it("sizes the controls a toolbar holds, through the context and not a prop", () => {
    const root = mount(() => <Toolbars />);
    const buttons = root.querySelectorAll<HTMLElement>('[data-part="button"]');
    expect(style(buttons[0]!).paddingTop).toBe("8px");
    expect(style(buttons[1]!).paddingTop).toBe("4px");
    expect(style(buttons[1]!).paddingLeft).toBe("8px");
  });

  it("collapses the corners and the borders two buttons in a group share", () => {
    const root = mount(() => <Groups />);
    expect(part(root, "button-group").getAttribute("role")).toBe("group");
    expect(part(root, "button-group").getAttribute("aria-label")).toBe("Text alignment");
    const buttons = root.querySelectorAll<HTMLElement>('[data-part="button"]');
    // a row: the first keeps its left corners, the middle is square, the last keeps its right ones
    expect(style(buttons[0]!).borderStartStartRadius).toBe("8px");
    expect(style(buttons[1]!).borderStartStartRadius).toBe("0px");
    expect(style(buttons[1]!).borderStartEndRadius).toBe("0px");
    expect(style(buttons[2]!).borderStartEndRadius).toBe("8px");
    // every button after the first slides 1px into its neighbour: the two 1px borders between them are one line
    const first = buttons[0]!.getBoundingClientRect();
    const second = buttons[1]!.getBoundingClientRect();
    const third = buttons[2]!.getBoundingClientRect();
    expect(Math.round(second.left)).toBe(Math.round(first.right) - 1);
    expect(Math.round(third.left)).toBe(Math.round(second.right) - 1);
    // a column squares the top and the bottom instead, and a compact group sizes what it holds
    expect(style(buttons[3]!).borderStartStartRadius).toBe("8px");
    expect(style(buttons[3]!).borderEndStartRadius).toBe("0px");
    expect(style(buttons[4]!).borderEndEndRadius).toBe("8px");
    expect(style(buttons[4]!).paddingTop).toBe("4px");
  });

  it("puts a modal above the page, names it, keeps focus and gives it back", () => {
    const root = mount(() => <Dialogs />);
    const trigger = root.querySelector<HTMLElement>('[aria-haspopup="dialog"]')!;
    expect(root.querySelector('[data-part="dialog"]')).toBeNull();
    // a real pointer click focuses the button first; `click()` does not, and the dialog gives focus back to what had it
    trigger.focus();
    trigger.click();
    flush();
    const panel = root.querySelector<HTMLElement>('[data-part="dialog"]')!;
    const backdrop = root.querySelector<HTMLElement>('[data-part="dialog-backdrop"]')!;
    // the panel is the dialog: a role and a name from the prop, the description it renders, and the modal state
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-label")).toBe("Rename file");
    expect(panel.getAttribute("aria-modal")).toBe("true");
    const described = panel.getAttribute("aria-describedby")!;
    expect(document.getElementById(described)?.getAttribute("data-part")).toBe(
      "dialog-description",
    );
    // above the page, behind a wash, and the page does not scroll under it
    expect(style(root.querySelector<HTMLElement>('[data-part="dialog-layer"]')!).zIndex).toBe("20");
    expect(style(panel).position).toBe("relative");
    expect(style(backdrop).position).toBe("absolute");
    expect(style(backdrop).backgroundColor).not.toBe(style(panel).backgroundColor);
    expect(document.body.style.overflow).toBe("hidden");
    // focus went into the panel: a screen reader's reader starts where the message is
    expect(document.activeElement).toBe(panel);
    panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    flush();
    expect(root.querySelector('[data-part="dialog"]')).toBeNull();
    expect(root.querySelector('[data-part="dialog-backdrop"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
    // and the backdrop is a way out too
    trigger.click();
    flush();
    root.querySelector<HTMLElement>('[data-part="dialog-backdrop"]')!.click();
    flush();
    expect(root.querySelector('[data-part="dialog"]')).toBeNull();
  });

  it("lets render replace a part and keeps the props and the state live", () => {
    const root = mount(() => <Renders />);
    // the button's own props carry role="button": the caller replaces the element, not the semantics the widget owns
    const link = root.querySelector("a")!;
    expect(link.getAttribute("aria-pressed")).toBe("true");
    expect(link.getAttribute("data-part")).toBe("button");
    const live = root.querySelector<HTMLElement>("[data-live]")!;
    expect(live.getAttribute("data-live")).toBe("pressed");
    live.click();
    flush();
    expect(live.getAttribute("aria-pressed")).toBe("false");
    expect(live.getAttribute("data-live")).toBe("idle");
    expect(root.querySelector("header")?.getAttribute("data-part")).toBe("card-header");
  });

  it("gives the control its own id, its described-by ids and the invalid state", () => {
    const root = mount(() => <Fields />);
    const input = root.querySelector<HTMLInputElement>('[id="email-control"]')!;
    expect(input.id).toBe("email-control");
    expect(root.querySelector<HTMLLabelElement>('label[for="email-control"]')?.id).toBe(
      "email-label",
    );
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("email-hint email-error");
    expect(part(root, "hint").textContent).toBe("We never share it");
    expect(part(root, "error").getAttribute("role")).toBe("alert");
    // the invalid border is the theme's, and not the resting one the second field's input has
    const resting = root.querySelector<HTMLInputElement>('[id="plain-control"]')!;
    expect(style(input).borderTopColor).not.toBe(style(resting).borderTopColor);
    // a control that is not an Input: the field hands its ids and ARIA to the caller's element
    const pick = root.querySelector<HTMLElement>('[id="pick-control"]')!;
    expect(pick.getAttribute("data-part")).toBe("textarea");
    expect(pick.getAttribute("aria-invalid")).toBe("true");
  });

  it("announces an alert in a live region and paints its tone", () => {
    const root = mount(() => <Alerts />);
    const alerts = root.querySelectorAll<HTMLElement>('[data-part="alert"]');
    // the region is live and atomic, and it is in the page: a mount with a message is the announcement
    expect(alerts[0]!.getAttribute("role")).toBe("alert");
    expect(alerts[0]!.getAttribute("aria-atomic")).toBe("true");
    expect(alerts[0]!.hasAttribute("hidden")).toBe(false);
    expect(alerts[1]!.getAttribute("role")).toBe("alert");
    // the tone is the rule on the left and the title it runs beside, not a class of the caller's
    expect(style(alerts[0]!).borderInlineStartColor).not.toBe(
      style(alerts[1]!).borderInlineStartColor,
    );
    const titles = root.querySelectorAll<HTMLElement>('[data-part="alert-title"]');
    expect(titles[1]!.textContent).toBe("Could not save");
    expect(style(titles[1]!).color).toBe(style(alerts[1]!).borderInlineStartColor);
  });

  it("fills the meter the value it announces", () => {
    const root = mount(() => <Meters />);
    const meter = part(root, "meter");
    const fill = part(root, "meter-fill");
    expect(meter.getAttribute("role")).toBe("meter");
    expect(meter.getAttribute("aria-valuenow")).toBe("25");
    expect(meter.getAttribute("aria-label")).toBe("Storage");
    expect(fill.style.width).toBe("25%");
    // the attribute and the fill move together, because both are made from the primitive's one value
    root.querySelector<HTMLElement>('[data-part="advance"]')!.click();
    flush();
    expect(meter.getAttribute("aria-valuenow")).toBe("75");
    expect(fill.style.width).toBe("75%");
  });

  it("marks the current page of a breadcrumb and paints it from aria-current", () => {
    const root = mount(() => <Crumbs />);
    expect(part(root, "breadcrumb").getAttribute("aria-label")).toBe("Breadcrumbs");
    const links = root.querySelectorAll<HTMLElement>('[data-part="breadcrumb-link"]');
    const items = root.querySelectorAll<HTMLElement>('[data-part="breadcrumb-item"]');
    expect(items[2]!.getAttribute("aria-current")).toBe("page");
    expect(links[2]!.getAttribute("aria-current")).toBe("page");
    expect(links[0]!.getAttribute("aria-current")).toBeNull();
    // an ancestor is a tinted link, the page it leads to is text: the tint preset is what makes the two different
    expect(style(links[2]!).color).not.toBe(style(links[0]!).color);
    expect(style(links[2]!).fontWeight).toBe("500");
    expect(links[2]!.getAttribute("href")).toBe("#report");
  });

  it("opens the menu from its trigger, moves the highlight with a key, and gives focus back", () => {
    const root = mount(() => <Menus />);
    const trigger = root.querySelector<HTMLElement>('[aria-haspopup="menu"]')!;
    const menu = root.querySelector<HTMLElement>('[data-part="menu"]')!;
    expect(menu.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    // hidden has to mean hidden: no display in the content's class may override the UA's `[hidden] { display: none }`
    expect(style(menu).display).toBe("none");
    trigger.focus();
    trigger.click();
    flush();
    // the trigger names the menu it controls, and the menu is the popup the primitive says it is
    expect(menu.hidden).toBe(false);
    expect(style(menu).display).not.toBe("none");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(menu.getAttribute("role")).toBe("menu");
    expect(trigger.getAttribute("aria-controls")).toBe(menu.id);
    // the highlight is the roving tab stop the widget announces, and the DOM focus is on that row
    const items = [...root.querySelectorAll<HTMLElement>('[data-part="menu-item"]')];
    expect(items.map((item) => item.getAttribute("role"))).toEqual([
      "menuitem",
      "menuitem",
      "menuitem",
    ]);
    expect(items[0]!.tabIndex).toBe(0);
    expect(items[1]!.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(items[0]);
    expect(style(items[0]!).backgroundColor).not.toBe(style(items[1]!).backgroundColor);
    // an arrow key moves the highlight: the tab stop and the styled row follow it
    items[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    flush();
    expect(items[1]!.tabIndex).toBe(0);
    expect(items[0]!.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(items[1]);
    expect(style(items[1]!).backgroundColor).not.toBe(style(items[2]!).backgroundColor);
    // a disabled item stays focusable and says so (APG note 1)
    expect(items[2]!.getAttribute("aria-disabled")).toBe("true");
    expect(style(items[2]!).cursor).toBe("not-allowed");
    // Escape closes it and the focus goes back to what opened it
    items[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    flush();
    expect(menu.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
    // a pointer outside the anchor is the other way out
    trigger.click();
    flush();
    expect(menu.hidden).toBe(false);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    flush();
    expect(menu.hidden).toBe(true);
  });

  it("describes the trigger with the tooltip's id while the tooltip is shown", () => {
    const root = mount(() => <Tooltips />);
    const trigger = root.querySelector<HTMLElement>('[data-part="button"]')!;
    const tooltip = root.querySelector<HTMLElement>('[role="tooltip"]')!;
    // the bubble is in the DOM while it is off, because `aria-describedby` names it
    expect(tooltip.id).not.toBe("");
    expect(tooltip.hidden).toBe(true);
    // no display in the bubble's class: the UA's `[hidden] { display: none }` is what hides it
    expect(style(tooltip).display).toBe("none");
    expect(trigger.getAttribute("aria-describedby")).toBeNull();
    // focus is enough: the tooltip appears with the focus and goes with it
    trigger.focus();
    flush();
    expect(tooltip.hidden).toBe(false);
    expect(style(tooltip).display).not.toBe("none");
    expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);
    expect(tooltip.textContent).toBe("Deletes the file");
    // it floats in the anchor, under a dialog's layer, and is absolute there
    const anchor = root.querySelector<HTMLElement>('[data-part="tooltip-anchor"]')!;
    expect(style(anchor).position).toBe("relative");
    expect(style(tooltip).position).toBe("absolute");
    expect(style(tooltip).zIndex).toBe("10");
    trigger.blur();
    flush();
    expect(tooltip.hidden).toBe(true);
    expect(trigger.getAttribute("aria-describedby")).toBeNull();
  });

  it("opens the select from its trigger, moves the highlight, chooses and gives focus back", () => {
    const root = mount(() => <Selects />);
    const trigger = root.querySelector<HTMLElement>('[aria-haspopup="listbox"]')!;
    const listbox = root.querySelector<HTMLElement>('[data-part="select-listbox"]')!;
    expect(trigger.getAttribute("aria-label")).toBe("Fruit");
    expect(listbox.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    // hidden has to mean hidden: no display in the list's class may override the UA's `[hidden] { display: none }`
    expect(style(listbox).display).toBe("none");
    trigger.focus();
    trigger.click();
    flush();
    expect(listbox.hidden).toBe(false);
    expect(style(listbox).display).not.toBe("none");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(listbox.id);
    expect(listbox.getAttribute("role")).toBe("listbox");
    expect(trigger.textContent).toBe("Apple");
    const options = [...root.querySelectorAll<HTMLElement>('[data-part="select-option"]')];
    expect(options.map((option) => option.getAttribute("role"))).toEqual([
      "option",
      "option",
      "option",
      "option",
    ]);
    expect(options.map((option) => option.getAttribute("aria-selected"))).toEqual([
      "true",
      "false",
      "false",
      "false",
    ]);
    // the highlight is the roving tab stop the widget announces, and the DOM focus is on that row
    expect(options[0]!.tabIndex).toBe(0);
    expect(options[1]!.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(options[0]);
    // an arrow key moves the highlight: the tab stop and the styled row follow it
    options[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    flush();
    expect(options[1]!.tabIndex).toBe(0);
    expect(options[0]!.tabIndex).toBe(-1);
    expect(document.activeElement).toBe(options[1]);
    expect(style(options[1]!).backgroundColor).not.toBe(style(options[0]!).backgroundColor);
    // a disabled option says so and an arrow steps over it
    expect(options[2]!.getAttribute("aria-disabled")).toBe("true");
    expect(style(options[2]!).cursor).toBe("not-allowed");
    options[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    flush();
    expect(document.activeElement).toBe(options[3]);
    options[3]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    flush();
    expect(document.activeElement).toBe(options[1]);
    // Enter chooses the highlighted row, closes the list and the trigger shows the label
    options[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    flush();
    expect(listbox.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.textContent).toBe("Banana");
    expect(options[1]!.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(trigger);
    // Escape closes it too and the focus goes back to what opened it
    trigger.click();
    flush();
    expect(listbox.hidden).toBe(false);
    expect(document.activeElement).toBe(options[1]);
    document.activeElement!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    flush();
    expect(listbox.hidden).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
    // a pointer outside the anchor is the other way out
    trigger.click();
    flush();
    expect(listbox.hidden).toBe(false);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    flush();
    expect(listbox.hidden).toBe(true);
  });

  it("gives a textarea the field's id and invalid state", () => {
    const root = mount(() => <Textareas />);
    const invalid = root.querySelector<HTMLTextAreaElement>('[id="notes-control"]')!;
    expect(invalid.tagName).toBe("TEXTAREA");
    expect(invalid.getAttribute("data-part")).toBe("textarea");
    expect(invalid.getAttribute("aria-invalid")).toBe("true");
    expect(invalid.getAttribute("aria-describedby")).toBe("notes-error");
    // the field's invalid border is the theme's, and not the resting one the second textarea has
    const resting = root.querySelector<HTMLTextAreaElement>('[id="summary-control"]')!;
    expect(resting.getAttribute("aria-invalid")).toBeNull();
    expect(style(invalid).borderTopColor).not.toBe(style(resting).borderTopColor);
    // it is a textarea, not a one-line control: it takes a height and grows down
    expect(style(resting).resize).toBe("vertical");
  });
});
