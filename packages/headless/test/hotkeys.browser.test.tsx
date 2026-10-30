import { afterEach, describe, expect, it } from "vite-plus/test";
import { createHotkeys, type Hotkeys } from "../src/hotkeys";

const live: Hotkeys[] = [];
const roots: HTMLElement[] = [];

const hotkeysOn = (isApple: boolean): Hotkeys => {
  const hotkeys = createHotkeys({ isApple });
  live.push(hotkeys);
  return hotkeys;
};

/** A fresh subtree of the document; returns its first element. */
const mount = (html: string): HTMLElement => {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.append(host);
  roots.push(host);
  const first = host.firstElementChild;
  if (!(first instanceof HTMLElement)) {
    throw new Error("mount: no element");
  }
  return first;
};

const press = (
  target: EventTarget | null,
  init: KeyboardEventInit & { key: string },
): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  target?.dispatchEvent(event);
  return event;
};

const counter = (): { fired: () => number; onTrigger: () => void } => {
  let fired = 0;
  return {
    fired: () => fired,
    onTrigger: () => {
      fired += 1;
    },
  };
};

afterEach(() => {
  for (const hotkeys of live.splice(0)) {
    hotkeys.dispose();
  }
  for (const host of roots.splice(0)) {
    host.remove();
  }
});

describe("createHotkeys (real DOM)", () => {
  it("fires only when every modifier matches exactly", () => {
    const hotkeys = hotkeysOn(false);
    const hit = counter();
    hotkeys.bind({ keys: "mod+k", onTrigger: hit.onTrigger });
    const target = mount("<button>search</button>");

    press(target, { key: "k", ctrlKey: true });
    expect(hit.fired()).toBe(1);

    press(target, { key: "k" });
    press(target, { key: "k", metaKey: true });
    press(target, { key: "k", ctrlKey: true, altKey: true });
    press(target, { key: "k", ctrlKey: true, shiftKey: true });
    expect(hit.fired()).toBe(1);
  });

  it("reads mod as Ctrl off macOS and as Meta on it", () => {
    const target = mount("<button>search</button>");
    const offMac = hotkeysOn(false);
    const onMac = hotkeysOn(true);
    const ctrl = counter();
    const meta = counter();
    offMac.bind({ keys: "mod+k", onTrigger: ctrl.onTrigger });
    onMac.bind({ keys: "mod+k", onTrigger: meta.onTrigger });

    press(target, { key: "k", ctrlKey: true });
    expect(ctrl.fired()).toBe(1);
    expect(meta.fired()).toBe(0);

    press(target, { key: "k", metaKey: true });
    expect(ctrl.fired()).toBe(1);
    expect(meta.fired()).toBe(1);
  });

  it("does not fire when the event carries a modifier the chord does not declare", () => {
    const hotkeys = hotkeysOn(false);
    const hit = counter();
    hotkeys.bind({ keys: "k", onTrigger: hit.onTrigger });
    const target = mount("<button>type</button>");

    press(target, { key: "k", shiftKey: true });
    press(target, { key: "k", altKey: true });
    expect(hit.fired()).toBe(0);

    press(target, { key: "k" });
    expect(hit.fired()).toBe(1);
  });

  it("implies Shift for a shifted character such as ?", () => {
    const hotkeys = hotkeysOn(false);
    const hit = counter();
    hotkeys.bind({ keys: "?", onTrigger: hit.onTrigger });
    const target = mount("<button>help</button>");

    press(target, { key: "?", shiftKey: true });
    expect(hit.fired()).toBe(1);

    press(target, { key: "?", shiftKey: false });
    press(target, { key: "/", shiftKey: true });
    expect(hit.fired()).toBe(1);
  });

  it("ignores the chord while the focus is in an input, a textarea or a contenteditable", () => {
    const hotkeys = hotkeysOn(false);
    const hit = counter();
    hotkeys.bind({ keys: "/", onTrigger: hit.onTrigger });
    const input = mount("<input type=text>");
    const textarea = mount("<textarea></textarea>");
    const editable = mount("<div contenteditable=true><b>text</b></div>");
    const inside = editable.firstElementChild;

    input.focus();
    press(input, { key: "/" });
    textarea.focus();
    press(textarea, { key: "/" });
    editable.focus();
    press(inside, { key: "/" });
    expect(hit.fired()).toBe(0);

    input.blur();
    press(document.body, { key: "/" });
    expect(hit.fired()).toBe(1);
  });

  it("fires in a text field when the binding asks for it, and not for the others", () => {
    const hotkeys = hotkeysOn(false);
    const escape = counter();
    const slash = counter();
    hotkeys.bind({ keys: "escape", allowInEditable: true, onTrigger: escape.onTrigger });
    hotkeys.bind({ keys: "/", onTrigger: slash.onTrigger });
    const input = mount("<input type=text>");
    input.focus();

    press(input, { key: "Escape" });
    press(input, { key: "/" });
    expect(escape.fired()).toBe(1);
    expect(slash.fired()).toBe(0);
  });

  it("gates a binding on when, and falls through to the next one while it is off", () => {
    const hotkeys = hotkeysOn(false);
    let open = false;
    const modal = counter();
    const page = counter();
    hotkeys.bind({ keys: "/", onTrigger: page.onTrigger });
    hotkeys.bind({ keys: "/", when: () => open, onTrigger: modal.onTrigger });
    const target = mount("<button>search</button>");

    press(target, { key: "/" });
    expect(modal.fired()).toBe(0);
    expect(page.fired()).toBe(1);

    open = true;
    press(target, { key: "/" });
    expect(modal.fired()).toBe(1);
    expect(page.fired()).toBe(1);
  });

  it("lets the most recent binding win, and the older one return when it is unbound", () => {
    const hotkeys = hotkeysOn(false);
    const first = counter();
    const second = counter();
    hotkeys.bind({ keys: "mod+s", onTrigger: first.onTrigger });
    const unbind = hotkeys.bind({ keys: "mod+s", onTrigger: second.onTrigger });
    const target = mount("<button>save</button>");

    press(target, { key: "s", ctrlKey: true });
    expect(first.fired()).toBe(0);
    expect(second.fired()).toBe(1);

    unbind();
    press(target, { key: "s", ctrlKey: true });
    expect(first.fired()).toBe(1);
  });

  it("limits a scope to events from inside that element", () => {
    const hotkeys = hotkeysOn(false);
    const hit = counter();
    const panel = mount("<div><input type=text><button>save</button></div>");
    const outside = mount("<button>elsewhere</button>");
    hotkeys.bind({ keys: "mod+s", scope: panel, onTrigger: hit.onTrigger });

    press(outside, { key: "s", ctrlKey: true });
    expect(hit.fired()).toBe(0);

    press(panel, { key: "s", ctrlKey: true });
    expect(hit.fired()).toBe(1);
  });

  it("prevents the default action unless the binding turns that off", () => {
    const hotkeys = hotkeysOn(false);
    hotkeys.bind({ keys: "mod+s", onTrigger: () => {} });
    hotkeys.bind({ keys: "mod+k", preventDefault: false, onTrigger: () => {} });
    const target = mount("<button>save</button>");

    expect(press(target, { key: "s", ctrlKey: true }).defaultPrevented).toBe(true);
    expect(press(target, { key: "k", ctrlKey: true }).defaultPrevented).toBe(false);
  });

  it("unbinds one chord at a time and dispose ends them all", () => {
    const hotkeys = hotkeysOn(false);
    const save = counter();
    const search = counter();
    const unbindSave = hotkeys.bind({ keys: "mod+s", onTrigger: save.onTrigger });
    hotkeys.bind({ keys: "mod+k", onTrigger: search.onTrigger });
    const target = mount("<button>save</button>");

    unbindSave();
    unbindSave();
    press(target, { key: "s", ctrlKey: true });
    press(target, { key: "k", ctrlKey: true });
    expect(save.fired()).toBe(0);
    expect(search.fired()).toBe(1);

    hotkeys.dispose();
    press(target, { key: "k", ctrlKey: true });
    expect(search.fired()).toBe(1);

    // a disposed registry takes no new bindings: its listener is gone for good
    const after = counter();
    hotkeys.bind({ keys: "mod+k", onTrigger: after.onTrigger });
    press(target, { key: "k", ctrlKey: true });
    expect(after.fired()).toBe(0);
  });
});
